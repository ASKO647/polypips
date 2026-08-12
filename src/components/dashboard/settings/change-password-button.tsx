"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleClick = async () => {
    if (status === "sending") return;
    setStatus("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setStatus(error ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Lien de réinitialisation envoyé à {email}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={status === "sending"}
        className="w-full sm:w-auto"
      >
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Changer le mot de passe"
        )}
      </Button>
      {status === "error" && (
        <p className="text-xs text-rose-400">
          Une erreur est survenue. Merci de réessayer.
        </p>
      )}
    </div>
  );
}
