"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { createClient } from "@/lib/supabase/client";

const OAUTH_ERROR_MESSAGE =
  "La connexion avec Google a échoué. Merci de réessayer.";

/**
 * Shared "Continuer avec Google" button for /signup and /login. The
 * initiating page is threaded through as `error_redirect` on the callback
 * URL so an OAuth failure sends the user back to the page they started
 * from, not always to /signup.
 */
export function GoogleAuthButton({
  onError,
  errorRedirectPath = "/signup",
}: {
  onError: (message: string | null) => void;
  errorRedirectPath?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    onError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?error_redirect=${encodeURIComponent(
            errorRedirectPath
          )}`,
        },
      });

      if (error) {
        onError(OAUTH_ERROR_MESSAGE);
        setLoading(false);
      }
      // On success the browser is redirected to Google, so no further
      // state update happens here.
    } catch {
      onError(OAUTH_ERROR_MESSAGE);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-7 flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border-strong bg-surface text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4.5 w-4.5 animate-spin" />
      ) : (
        <GoogleIcon className="h-4.5 w-4.5" />
      )}
      {loading ? "Redirection vers Google..." : "Continuer avec Google"}
    </button>
  );
}
