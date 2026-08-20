/**
 * DRAFT LEGAL CONTENT — NOT LEGALLY VALIDATED.
 * This page's text is a standard-template draft (French SaaS with a
 * recurring subscription, conditions générales de vente et d'utilisation)
 * generated to unblock development. It MUST be reviewed by a qualified
 * professional (lawyer / legal counsel) before this site goes into real
 * production, and every [À COMPLÉTER : ...] placeholder must be filled in
 * with accurate information first. Do not treat this as legal advice —
 * this is especially true of the right-of-withdrawal clause (Article 6),
 * which touches consumer-protection law (Code de la consommation) and
 * needs explicit sign-off before publication.
 */
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { LegalPageShell, LegalSection, ToComplete } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "Conditions générales — Polypips",
};

const LAST_UPDATED = "20 août 2026";

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Conditions générales de vente et d'utilisation"
      lastUpdated={LAST_UPDATED}
      intro="Les présentes conditions générales de vente et d'utilisation (les « CGU ») régissent l'accès et l'usage du service Polypips, ainsi que les modalités d'abonnement. En créant un compte, vous acceptez sans réserve les présentes CGU."
    >
      <LegalSection title="1. Objet">
        <p>
          Polypips (le « Service ») est édité par{" "}
          <ToComplete>raison sociale</ToComplete> (l&apos;« Éditeur »). Les
          présentes CGU définissent les droits et obligations de
          l&apos;Éditeur et de tout utilisateur (l&apos;« Utilisateur ») dans le
          cadre de l&apos;utilisation du Service, à titre gratuit ou payant.
        </p>
      </LegalSection>

      <LegalSection title="2. Description du service">
        <p>
          Polypips est un outil d&apos;analyse par intelligence artificielle de
          marchés de prédiction (notamment ceux de la plateforme Polymarket).
          Le Service propose notamment : une analyse IA de marchés
          individuels, une sélection automatisée de marchés, un suivi de
          portefeuilles publics on-chain (« Smart Money »), un module de
          copie de stratégie en simulation (« Copy Trading »), et un
          assistant conversationnel (« Coach IA »).
        </p>
        <p>
          <strong>
            Le Service est fourni à titre strictement informatif et
            éducatif. Il ne constitue en aucun cas un conseil en
            investissement, un conseil financier, une recommandation
            personnalisée, ni une incitation à parier ou à investir. Les
            décisions, probabilités et scores générés par l&apos;IA sont des
            estimations statistiques et ne garantissent aucun résultat, gain
            ou performance.
          </strong>{" "}
          L&apos;Utilisateur reste seul responsable de toute décision qu&apos;il
          prend, sur la base ou non des informations fournies par le
          Service. Polymarket et les marchés de prédiction comportent un
          risque de perte totale des sommes engagées.
        </p>
        <p>
          <strong>
            Le module Copy Trading fonctionne exclusivement en mode
            simulation : à aucun moment le Service n&apos;exécute, ne
            transmet, ni ne déclenche un ordre ou une transaction réelle
            pour le compte de l&apos;Utilisateur, sur Polymarket ou sur tout
            autre marché.
          </strong>{" "}
          Il ne s&apos;agit ni d&apos;un service de gestion sous mandat, ni d&apos;un
          service de réception-transmission d&apos;ordres au sens du droit
          financier applicable.
        </p>
      </LegalSection>

      <LegalSection title="3. Accès au service et création de compte">
        <p>
          L&apos;accès à certaines fonctionnalités nécessite la création d&apos;un
          compte (adresse email et mot de passe, ou authentification via un
          fournisseur tiers). L&apos;Utilisateur s&apos;engage à fournir des
          informations exactes et à préserver la confidentialité de ses
          identifiants. Le Service est réservé aux personnes majeures et
          juridiquement capables de contracter.
        </p>
      </LegalSection>

      <LegalSection title="4. Offres et tarifs">
        <p>Polypips propose, à la date des présentes, les offres suivantes :</p>
        <ul>
          <li>
            <strong>Offre découverte :</strong> accès complet au Service
            pendant 3 jours pour 0,99&nbsp;€, puis reconduction automatique
            en abonnement mensuel à 29,99&nbsp;€/mois sauf résiliation avant
            la fin des 3 jours.
          </li>
          <li>
            <strong>Offre Pro :</strong> abonnement mensuel sans engagement à
            29,99&nbsp;€/mois, accès complet au Service.
          </li>
        </ul>
        <p>
          Les tarifs sont indiqués toutes taxes comprises (TTC) en euros. Le
          paiement est traité par notre prestataire Stripe (voir notre{" "}
          <Link
            href="/privacy"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            politique de confidentialité
          </Link>
          ). Polypips ne stocke aucune donnée de carte bancaire.
        </p>
        <p>
          Polypips se réserve le droit de modifier ses tarifs à tout moment ;
          toute modification sera communiquée à l&apos;Utilisateur avant son
          entrée en vigueur et ne s&apos;appliquera pas à la période déjà
          facturée.
        </p>
      </LegalSection>

      <LegalSection title="5. Résiliation de l'abonnement">
        <p>
          L&apos;abonnement est sans engagement de durée et peut être résilié
          à tout moment par l&apos;Utilisateur, directement depuis la page
          « Paramètres » de son compte, avec effet à la fin de la période en
          cours déjà payée. Aucun remboursement au prorata n&apos;est effectué
          pour la période en cours, sauf disposition légale contraire
          (voir Article 6).
        </p>
        <p>
          Polypips peut suspendre ou résilier l&apos;accès d&apos;un Utilisateur en
          cas de manquement grave aux présentes CGU, notamment en cas de
          fraude, d&apos;usage détourné du Service ou de non-paiement.
        </p>
      </LegalSection>

      <LegalSection title="6. Droit de rétractation">
        <p>
          Conformément à l&apos;article L.221-18 du Code de la consommation, tout
          consommateur dispose d&apos;un délai de 14 jours francs pour exercer
          son droit de rétractation sur un achat à distance, sans avoir à
          justifier de motif.
        </p>
        <p>
          <strong>
            Toutefois, Polypips étant un service numérique dont
            l&apos;exécution commence immédiatement dès l&apos;activation de
            l&apos;abonnement (accès immédiat aux fonctionnalités payantes), et
            conformément à l&apos;article L.221-28 13° du Code de la
            consommation, l&apos;Utilisateur reconnaît expressément, lors de la
            souscription, renoncer à son droit de rétractation dès lors que
            l&apos;exécution du Service a commencé avec son accord préalable
            exprès.
          </strong>{" "}
          Cette renonciation est recueillie explicitement au moment du
          paiement, avant toute confirmation de commande.
        </p>
        <p>
          En l&apos;absence d&apos;un tel accord exprès, ou pour toute situation non
          couverte par cette exception, l&apos;Utilisateur peut exercer son
          droit de rétractation en écrivant à{" "}
          <ToComplete>email de contact</ToComplete> dans le délai légal.
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          Polypips met en œuvre des moyens raisonnables pour assurer la
          fiabilité et la disponibilité du Service, sans garantir
          l&apos;absence d&apos;erreurs, d&apos;interruptions ou d&apos;inexactitudes dans
          les analyses produites. Le Service dépend notamment de données
          publiques tierces (Polymarket, sources on-chain) dont Polypips ne
          contrôle ni l&apos;exactitude ni la disponibilité.
        </p>
        <p>
          Polypips ne saurait être tenu responsable des pertes financières,
          directes ou indirectes, résultant de décisions prises par
          l&apos;Utilisateur sur la base des informations, analyses ou
          suggestions fournies par le Service. La responsabilité de Polypips
          est, dans toute la mesure permise par la loi, limitée au montant
          effectivement payé par l&apos;Utilisateur au cours des 12 derniers
          mois.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>
          Le Service, son contenu, sa marque, son code source et ses
          modèles d&apos;analyse demeurent la propriété exclusive de{" "}
          <ToComplete>raison sociale</ToComplete>. L&apos;abonnement confère à
          l&apos;Utilisateur un droit d&apos;usage personnel, non exclusif et non
          cessible du Service, à l&apos;exclusion de tout autre droit.
        </p>
      </LegalSection>

      <LegalSection title="9. Modification des CGU">
        <p>
          Polypips peut modifier les présentes CGU à tout moment. Les
          Utilisateurs seront informés de toute modification substantielle
          par email ou notification dans l&apos;application, avant son entrée
          en vigueur. La poursuite de l&apos;utilisation du Service après
          notification vaut acceptation des CGU modifiées.
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable et juridiction">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de
          litige, et à défaut de résolution amiable, les tribunaux français
          compétents seront seuls saisis, sous réserve des règles
          impératives de protection du consommateur applicables à
          l&apos;Utilisateur agissant en dehors de toute activité
          professionnelle.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <ToComplete>email de contact</ToComplete>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
