"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";

export function NotifySportButton({ sport }: { sport: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleClick = async () => {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const response = await fetch("/api/sports/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport }),
      });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={state === "sending"}>
      {state === "sent" ? (
        <>
          <BellRing className="h-3.5 w-3.5" strokeWidth={2} />
          Vous serez averti(e)
        </>
      ) : (
        <>
          <Bell className="h-3.5 w-3.5" strokeWidth={2} />
          {state === "error" ? "Réessayer" : "M'avertir quand disponible"}
          <ButtonIcon variant="outline">→</ButtonIcon>
        </>
      )}
    </Button>
  );
}
