"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/** Supabase's built-in email-change flow: updateUser({ email }) sends a
 * confirmation link (to the new address, and to the current one too if
 * "secure email change" is on for this project) rather than switching it
 * immediately — same "email does the confirming" pattern as
 * ChangePasswordButton's resetPasswordForEmail. */
export function ChangeEmailButton({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("Profile.ChangeEmailButton");
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (status === "sending" || !newEmail.trim()) return;
    setStatus("sending");
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (updateError) {
        setError(updateError.message);
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setError(t("genericError"));
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {t("sentTo", { email: newEmail })}
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {t("cta")}
      </Button>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex flex-1 flex-col gap-1.5">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder={t("placeholder", { email: currentEmail })}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={status === "sending" || !newEmail.trim()}
        >
          {status === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("confirm")
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setNewEmail("");
            setError(null);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
