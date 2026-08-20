/**
 * DRAFT LEGAL CONTENT — NOT LEGALLY VALIDATED.
 * This page's text is a standard-template draft (French SaaS, mentions
 * légales) generated to unblock development. It MUST be reviewed by a
 * qualified professional (lawyer / legal counsel) before this site goes
 * into real production, and every [À COMPLÉTER : ...] placeholder must be
 * filled in with accurate information first. Do not treat this as legal
 * advice.
 */
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { LegalPageShell, LegalSection, ToComplete } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "Mentions légales — Polypips",
};

const LAST_UPDATED = "20 août 2026";

export default function LegalPage() {
  return (
    <LegalPageShell title="Mentions légales" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Éditeur du site">
        <p>
          Le site accessible à l&apos;adresse{" "}
          <ToComplete>nom de domaine, ex. polypips.com</ToComplete> (le
          « Site ») est édité par :
        </p>
        <ul>
          <li>
            <strong>Raison sociale :</strong> <ToComplete>raison sociale</ToComplete>
          </li>
          <li>
            <strong>Forme juridique :</strong>{" "}
            <ToComplete>ex. SAS, SASU, EI, micro-entreprise</ToComplete>
          </li>
          <li>
            <strong>Capital social :</strong> <ToComplete>montant, si société</ToComplete>
          </li>
          <li>
            <strong>Siège social :</strong> <ToComplete>adresse complète</ToComplete>
          </li>
          <li>
            <strong>SIRET :</strong> <ToComplete>numéro SIRET</ToComplete>
          </li>
          <li>
            <strong>RCS :</strong> <ToComplete>ville d&apos;immatriculation + numéro RCS</ToComplete>
          </li>
          <li>
            <strong>N° de TVA intracommunautaire :</strong>{" "}
            <ToComplete>numéro de TVA, si applicable</ToComplete>
          </li>
          <li>
            <strong>Email de contact :</strong> <ToComplete>email de contact</ToComplete>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Directeur de la publication">
        <p>
          Le directeur de la publication est <ToComplete>nom et prénom</ToComplete>,{" "}
          <ToComplete>qualité, ex. Président / Gérant</ToComplete> de{" "}
          <ToComplete>raison sociale</ToComplete>.
        </p>
      </LegalSection>

      <LegalSection title="3. Hébergement">
        <p>Le Site est hébergé par :</p>
        <ul>
          <li>
            <strong>Vercel Inc.</strong>
          </li>
          <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
          <li>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              vercel.com
            </a>
          </li>
        </ul>
        <p>
          Les données de l&apos;application (comptes, abonnements, analyses,
          messages) sont hébergées par Supabase, dont les sous-traitants et
          la localisation des serveurs sont détaillés dans notre{" "}
          <Link
            href="/privacy"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="4. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du Site (structure, textes, logos,
          marques, graphismes, icônes, code source) est la propriété
          exclusive de <ToComplete>raison sociale</ToComplete>, sauf mention
          contraire, et est protégé par le droit de la propriété
          intellectuelle. Toute reproduction, représentation, modification ou
          adaptation, totale ou partielle, sans autorisation écrite
          préalable, est interdite.
        </p>
      </LegalSection>

      <LegalSection title="5. Limitation de responsabilité">
        <p>
          Polypips met en œuvre les moyens raisonnables pour assurer
          l&apos;accès et le bon fonctionnement du Site, mais ne peut garantir
          une disponibilité continue ni l&apos;absence d&apos;erreurs. Voir nos{" "}
          <Link
            href="/terms"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            conditions générales
          </Link>{" "}
          pour le détail des limitations applicables à l&apos;usage du service.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Pour toute question relative au Site ou à ces mentions légales,
          contactez-nous à l&apos;adresse suivante :{" "}
          <ToComplete>email de contact</ToComplete>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
