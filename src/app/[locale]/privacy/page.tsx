/**
 * DRAFT LEGAL CONTENT — NOT LEGALLY VALIDATED.
 * This page's text is a standard-template draft (RGPD-oriented privacy
 * policy for a French SaaS) generated to unblock development. It MUST be
 * reviewed by a qualified professional (lawyer / DPO / legal counsel)
 * before this site goes into real production, and every
 * [À COMPLÉTER : ...] placeholder must be filled in with accurate
 * information first. The list of sub-processors (Supabase, Stripe,
 * Anthropic, Vercel, API-Sports) reflects the codebase's actual
 * third-party integrations at the time this draft was written — verify it
 * still matches reality before publishing, and add any new integration
 * introduced since. Do not treat this as legal advice.
 */
import type { Metadata } from "next";
import { LegalPageShell, LegalSection, ToComplete } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Polypips",
};

const LAST_UPDATED = "20 août 2026";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Politique de confidentialité"
      lastUpdated={LAST_UPDATED}
      intro="Cette politique explique quelles données personnelles Polypips collecte, pourquoi, avec qui elles sont partagées, et quels droits vous pouvez exercer, conformément au Règlement Général sur la Protection des Données (RGPD)."
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données collectées via Polypips
          est <ToComplete>raison sociale</ToComplete>,{" "}
          <ToComplete>adresse</ToComplete>, joignable à{" "}
          <ToComplete>email de contact / DPO</ToComplete>.
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <ul>
          <li>
            <strong>Données de compte :</strong> adresse email, mot de passe
            (chiffré), identifiant de connexion via un fournisseur tiers
            (Google) le cas échéant.
          </li>
          <li>
            <strong>Données de paiement :</strong> Polypips ne stocke aucune
            donnée bancaire — le paiement et sa gestion sont intégralement
            délégués à Stripe (voir Article 5). Polypips conserve uniquement
            l&apos;identifiant client Stripe et le statut de l&apos;abonnement.
          </li>
          <li>
            <strong>Données d&apos;usage :</strong> analyses de marché, de
            matchs sportifs et de graphiques de trading demandées, marchés
            suivis, portefeuilles Smart Wallet suivis, messages échangés
            avec le Coach IA, et statistiques de performance associées à
            votre compte.
          </li>
          <li>
            <strong>Données techniques :</strong> adresse IP, données de
            connexion, journaux d&apos;erreurs, à des fins de sécurité et de
            bon fonctionnement du Service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités et bases légales">
        <ul>
          <li>
            <strong>Fourniture du Service</strong> (création de compte,
            analyses, abonnement) — exécution du contrat (CGU).
          </li>
          <li>
            <strong>Gestion des paiements et de la facturation</strong> —
            exécution du contrat, et obligation légale (comptabilité).
          </li>
          <li>
            <strong>Sécurité et prévention de la fraude</strong> — intérêt
            légitime de Polypips.
          </li>
          <li>
            <strong>
              Amélioration du Service et mesure d&apos;audience (cookies
              analytics)
            </strong>{" "}
            — consentement, recueilli via le bandeau cookies.
          </li>
          <li>
            <strong>Communications relatives au Service</strong>{" "}
            (confirmation, alertes, réinitialisation de mot de passe) —
            exécution du contrat.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Durée de conservation">
        <p>
          Les données de compte et d&apos;usage sont conservées pendant toute
          la durée de la relation contractuelle, puis archivées ou supprimées
          dans un délai de <ToComplete>durée, ex. 3 ans</ToComplete> après la
          fin de l&apos;abonnement, sauf obligation légale de conservation plus
          longue (notamment comptable et fiscale, généralement 10 ans pour
          les données de facturation). Les données de compte sont supprimées
          sans délai déraisonnable après une demande de suppression de
          compte, sous réserve des obligations légales de conservation.
        </p>
      </LegalSection>

      <LegalSection title="5. Destinataires et sous-traitants">
        <p>
          Vos données sont traitées par Polypips et par les sous-traitants
          suivants, dans le strict cadre des finalités décrites ci-dessus :
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> (Supabase Inc.) — hébergement de la
            base de données, authentification et stockage des données de
            l&apos;application (comptes, analyses, messages, abonnements).
          </li>
          <li>
            <strong>Stripe</strong> (Stripe, Inc.) — traitement des paiements
            et de la facturation de l&apos;abonnement. Stripe agit comme
            responsable de traitement autonome pour les données de paiement
            qu&apos;il collecte directement ; voir la{" "}
            <a
              href="https://stripe.com/fr/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              politique de confidentialité de Stripe
            </a>
            .
          </li>
          <li>
            <strong>Anthropic</strong> (Anthropic, PBC) — fournisseur du
            modèle d&apos;intelligence artificielle utilisé pour générer les
            analyses de marché et les réponses du Coach IA. Le contenu de
            vos demandes (question posée, contexte du marché) est transmis à
            Anthropic pour générer la réponse, sans être utilisé par
            Anthropic pour entraîner ses modèles dans le cadre de son offre
            API commerciale.
          </li>
          <li>
            <strong>Vercel</strong> (Vercel Inc.) — hébergement technique du
            site et de l&apos;application.
          </li>
          <li>
            <strong>API-Sports</strong> — fournisseur des données sportives
            publiques (compétitions, équipes, résultats) utilisées pour les
            analyses sportives. Aucune donnée personnelle de l&apos;Utilisateur
            n&apos;est transmise à ce prestataire.
          </li>
        </ul>
        <p>
          Aucune donnée personnelle n&apos;est vendue à des tiers, ni utilisée
          à des fins publicitaires par Polypips.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferts hors Union européenne">
        <p>
          Certains de nos sous-traitants (Stripe, Anthropic, Vercel) sont
          susceptibles de traiter des données en dehors de l&apos;Union
          européenne, notamment aux États-Unis. Ces transferts sont encadrés
          par les garanties appropriées prévues par le RGPD (clauses
          contractuelles types de la Commission européenne, ou mécanisme
          équivalent reconnu adéquat).
        </p>
      </LegalSection>

      <LegalSection title="7. Vos droits">
        <p>
          Conformément au RGPD, vous disposez des droits suivants sur vos
          données personnelles : droit d&apos;accès, de rectification,
          d&apos;effacement, de limitation du traitement, de portabilité, et
          d&apos;opposition. Vous pouvez également définir des directives
          relatives au sort de vos données après votre décès.
        </p>
        <p>
          Pour exercer ces droits, contactez-nous à{" "}
          <ToComplete>email de contact / DPO</ToComplete>. Vous pouvez
          également gérer directement certaines données (mot de passe,
          suppression de compte) depuis la page « Paramètres » de votre
          compte.
        </p>
        <p>
          Si vous estimez, après nous avoir contactés, que vos droits ne
          sont pas respectés, vous pouvez introduire une réclamation auprès
          de la Commission Nationale de l&apos;Informatique et des Libertés
          (CNIL) —{" "}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          Polypips utilise des cookies essentiels au fonctionnement du site
          (connexion, sécurité, mémorisation de vos préférences) ainsi que,
          avec votre consentement, des cookies de mesure d&apos;audience. Vous
          pouvez à tout moment modifier votre choix via le lien « Gérer mes
          cookies » en bas de page.
        </p>
      </LegalSection>

      <LegalSection title="9. Sécurité">
        <p>
          Polypips met en œuvre des mesures techniques et organisationnelles
          raisonnables (chiffrement des mots de passe, contrôle d&apos;accès,
          isolation des données par compte via des règles de sécurité au
          niveau de la base de données) pour protéger vos données contre
          l&apos;accès non autorisé, la perte ou l&apos;altération.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Pour toute question relative à cette politique ou au traitement de
          vos données : <ToComplete>email de contact / DPO</ToComplete>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
