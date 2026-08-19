import { redirect } from "next/navigation";
import { getOwnerAalStatus } from "@/lib/supabase/owner";
import { MfaEnrollForm } from "@/components/owner/mfa-enroll-form";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export default async function OwnerMfaSetupPage() {
  const aal = await getOwnerAalStatus();

  if (aal.hasVerifiedFactor) {
    redirect(aal.currentLevel === "aal2" ? OWNER_BASE_PATH : `${OWNER_BASE_PATH}/mfa-challenge`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-4 text-slate-100">
      <MfaEnrollForm />
    </div>
  );
}
