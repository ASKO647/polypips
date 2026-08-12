import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_ERROR_REDIRECTS = ["/signup", "/login"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorRedirectParam = searchParams.get("error_redirect");
  const errorRedirect = ALLOWED_ERROR_REDIRECTS.includes(
    errorRedirectParam ?? ""
  )
    ? errorRedirectParam!
    : "/signup";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}${errorRedirect}?error=auth_failed`
  );
}
