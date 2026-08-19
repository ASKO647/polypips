import { redirect } from "next/navigation";
import { getOwnerAalStatus } from "@/lib/supabase/owner";
import { MfaChallengeForm } from "@/components/owner/mfa-challenge-form";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export default async function OwnerMfaChallengePage() {
  const aal = await getOwnerAalStatus();

  if (!aal.hasVerifiedFactor) {
    redirect(`${OWNER_BASE_PATH}/mfa-setup`);
  }
  if (aal.currentLevel === "aal2") {
    redirect(OWNER_BASE_PATH);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-4 text-slate-100">
      <MfaChallengeForm factorId={aal.verifiedFactorId!} />
    </div>
  );
}
