"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordButton({ email }: { email: string }) {
  const t = useTranslations("Profile.ChangePasswordButton");
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
        {t("sentTo", { email })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "sending"}
        className="flex h-11 w-full items-center justify-center rounded-full border border-dash-border-strong px-5 text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
      >
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("cta")
        )}
      </button>
      {status === "error" && (
        <p className="text-xs text-rose-400">
          {t("genericError")}
        </p>
      )}
    </div>
  );
}
