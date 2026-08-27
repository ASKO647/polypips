import { ChangePasswordButton } from "@/components/dashboard/settings/change-password-button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function PasswordTab({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-dash-text">Mot de passe</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-dash-text-tertiary">
          Nous vous envoyons un lien par email pour définir un nouveau mot de
          passe — aucun mot de passe actuel à saisir ici.
        </p>
        <div className="mt-4">
          <ChangePasswordButton email={email} />
        </div>
      </div>

      <div className="border-t border-dash-border pt-6">
        <h3 className="text-sm font-semibold text-dash-text">Session</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-dash-text-tertiary">
          Se déconnecter de Polypips sur cet appareil.
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
