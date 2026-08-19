import { redirect } from "next/navigation";
import { requireOwnerUser, getOwnerAalStatus } from "@/lib/supabase/owner";
import { logOwnerEvent } from "@/lib/supabase/owner-audit";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

/**
 * Step-up gate: everything under here additionally requires AAL2 (a
 * verified TOTP challenge completed this session), on top of the
 * owner-only check the parent layout already enforced. Split into its own
 * route group so /mfa-setup and /mfa-challenge — reachable only after
 * passing the parent's owner check — aren't themselves blocked by the
 * step-up they exist to satisfy.
 */
export default async function OwnerDashLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwnerUser();
  if (!owner) redirect(OWNER_BASE_PATH); // parent layout already guarantees this never actually fires

  const aal = await getOwnerAalStatus();

  if (!aal.hasVerifiedFactor) {
    redirect(`${OWNER_BASE_PATH}/mfa-setup`);
  }
  if (aal.currentLevel !== "aal2") {
    await logOwnerEvent({
      event: "owner_console_access",
      result: "denied",
      userId: owner.id,
      email: owner.email,
      detail: { reason: "mfa_not_verified" },
    });
    redirect(`${OWNER_BASE_PATH}/mfa-challenge`);
  }

  await logOwnerEvent({
    event: "owner_console_access",
    result: "granted",
    userId: owner.id,
    email: owner.email,
  });

  return <OwnerShell email={owner.email ?? ""}>{children}</OwnerShell>;
}
