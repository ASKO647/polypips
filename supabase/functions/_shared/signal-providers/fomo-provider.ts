import { ProviderNotImplementedError, type RawSignalTrade, type RawSignalWallet, type SignalProvider, type SignalSource } from "./types.ts";

/**
 * Not implemented. As of this integration, fomo.trade does not publish a
 * documented public or commercial API — the site is a browser terminal
 * with no official developer access, rate limits, or terms permitting
 * programmatic/commercial use that could be found. Scraping it would
 * bypass its own protections and terms, which the brief explicitly
 * forbids ("NE SCRAPE PAS Fomo... NE contourne aucune protection").
 *
 * If Fomo ever publishes an official API/webhook, implement fetchWallets/
 * fetchNewTrades here against it (an API key would go in Edge Function
 * Secrets as FOMO_API_KEY, mirroring how ANTHROPIC_API_KEY /
 * API_SPORTS_KEY are read via Deno.env.get() elsewhere in this project —
 * never in Vault, which pg_cron/pg_net read, not Deno.env.get()). Until
 * then, getSignalProvider() in index.ts always returns MockSignalProvider
 * for 'fomo', and this class exists only as the typed extension point.
 */
export class FomoSignalProvider implements SignalProvider {
  readonly mode = "live" as const;

  async fetchWallets(_source: SignalSource): Promise<RawSignalWallet[]> {
    throw new ProviderNotImplementedError(
      "Aucune API publique/officielle Fomo n'est disponible — voir le commentaire de ce fichier."
    );
  }

  async fetchNewTrades(_source: SignalSource, _walletAddresses: string[]): Promise<RawSignalTrade[]> {
    throw new ProviderNotImplementedError(
      "Aucune API publique/officielle Fomo n'est disponible — voir le commentaire de ce fichier."
    );
  }
}
