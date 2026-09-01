import { Mail, Phone, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { NAV_LINKS } from "@/lib/data/batipilot";

const CONTACT_EMAIL = "contact@batipilot.fr";
const CONTACT_PHONE = "+33 1 23 45 67 89";

export function BatipilotFooter() {
  return (
    <footer id="contact" className="relative border-t border-white/10 bg-[#04060d]">
      <Container className="grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="col-span-1 flex flex-col gap-4 sm:col-span-2">
          <a href="#hero" className="inline-flex items-center gap-2.5" aria-label="BatiPilot — accueil">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600">
              <Zap className="h-5 w-5 text-[#04060d]" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Bati<span className="text-cyan-400">Pilot</span>
            </span>
          </a>
          <p className="max-w-sm text-[15px] leading-relaxed text-white/50">
            La plateforme d&apos;agents IA qui automatise la gestion de
            chantiers, le commercial et l&apos;administratif des entreprises
            du BTP et de la rénovation.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-cyan-300"
            >
              <Mail className="h-4 w-4 text-cyan-400" />
              {CONTACT_EMAIL}
            </a>
            <a
              href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-cyan-300"
            >
              <Phone className="h-4 w-4 text-cyan-400" />
              {CONTACT_PHONE}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Produit</h4>
          <ul className="flex flex-col gap-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[15px] text-white/50 transition-colors hover:text-cyan-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="text-[15px] text-white/50 transition-colors hover:text-cyan-300"
              >
                Se connecter
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Légal</h4>
          <ul className="flex flex-col gap-2.5">
            <li className="text-[15px] text-white/40">Mentions légales</li>
            <li className="text-[15px] text-white/40">CGU</li>
            <li className="text-[15px] text-white/40">Politique de confidentialité</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container>
          <p className="text-center text-xs text-white/35">
            © {new Date().getFullYear()} BatiPilot. Tous droits réservés.
          </p>
        </Container>
      </div>
    </footer>
  );
}
