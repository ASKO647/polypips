import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Pips Tracks — News ingestion. Polls CryptoPanic's free developer API
 * (signup required, no cost — see https://cryptopanic.com/developers/api/)
 * for important crypto news and writes each new article into
 * pips_track_events (source='news', event_type='news'), the same table
 * sync-signal-wallets' companion trigger writes Fomo/Axiom/Signal IA rows
 * into. Nothing here ever fabricates an article: if CRYPTOPANIC_API_TOKEN
 * isn't set, this returns "skipped" and writes nothing — the News tab
 * simply stays empty until a real token is configured, exactly like the
 * signal-providers' own mock/live gating.
 *
 * IMPORTANT — endpoint verification: this environment's outbound network
 * access could not reach cryptopanic.com to re-confirm the CURRENT exact
 * endpoint/plan-name segment at the time this was written (egress to that
 * domain is blocked in the sandbox this was built in). The URL below
 * (`/api/v1/posts/`) is CryptoPanic's long-standing, well-documented free
 * public endpoint, but their docs also reference a newer
 * `/api/API_PLAN/v2/` structure for paid plans — before relying on this in
 * production, confirm at https://cryptopanic.com/developers/api/about that
 * `/api/v1/posts/` still serves the free plan, and adjust CRYPTOPANIC_BASE_URL
 * below if it has moved.
 */
const CRYPTOPANIC_BASE_URL = "https://cryptopanic.com/api/v1/posts/";

type CryptoPanicPost = {
  id?: number | string;
  title?: string;
  url?: string;
  published_at?: string;
  source?: { title?: string; domain?: string };
  currencies?: { code?: string }[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Cette fonction ne peut être déclenchée qu'avec la clé service role.",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const cryptoPanicToken = Deno.env.get("CRYPTOPANIC_API_TOKEN");
  if (!cryptoPanicToken) {
    return new Response(
      JSON.stringify({
        status: "skipped",
        reason: "not_configured",
        message: "CRYPTOPANIC_API_TOKEN n'est pas défini — aucune actu n'est écrite tant qu'aucun token réel n'est configuré.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  const summary = { fetched: 0, inserted: 0, skippedDuplicates: 0, errors: [] as string[] };

  try {
    const url = `${CRYPTOPANIC_BASE_URL}?auth_token=${cryptoPanicToken}&public=true&filter=important&kind=news`;
    const response = await fetch(url);
    if (!response.ok) {
      summary.errors.push(`CryptoPanic HTTP ${response.status}`);
      return new Response(JSON.stringify({ status: "error", summary }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = (await response.json()) as { results?: CryptoPanicPost[] };
    const posts = data.results ?? [];
    summary.fetched = posts.length;

    for (const post of posts) {
      if (!post.title || !post.url) continue;

      const currencyCode = post.currencies?.[0]?.code ?? null;
      const sourceLabel = post.source?.title ?? post.source?.domain ?? "Source externe";

      const { error } = await supabase.from("pips_track_events").insert({
        source: "news",
        event_type: "news",
        title: post.title,
        description: `Source : ${sourceLabel}`,
        token_symbol: currencyCode,
        external_url: post.url,
        data_source_mode: "live",
        occurred_at: post.published_at ?? new Date().toISOString(),
      });

      if (error) {
        // 23505 = unique_violation on the (event_type='news', external_url)
        // partial index — this article was already ingested in a previous
        // run, not a real failure.
        if ((error as { code?: string }).code === "23505") {
          summary.skippedDuplicates++;
        } else {
          summary.errors.push(error.message);
        }
        continue;
      }
      summary.inserted++;
    }
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : "Erreur inattendue");
  }

  return new Response(JSON.stringify({ status: "ok", summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
