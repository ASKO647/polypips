import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/data/nav";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-page-bg">
      <Container className="grid grid-cols-2 gap-10 py-12 sm:grid-cols-3 lg:grid-cols-6 lg:gap-8">
        <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-2">
          <Logo />
          <p className="max-w-xs text-[15px] leading-relaxed text-body">
            L&apos;IA qui analyse les marchés Polymarket en profondeur et vous
            donne l&apos;avantage pour décider mieux.
          </p>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-body transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-body transition-colors hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {col.title === "Légal" && (
                <li>
                  <Link
                    href="/cookies"
                    className="text-[15px] text-body transition-colors hover:text-brand-600"
                  >
                    Gérer mes cookies
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-black/[0.06] py-6">
        <Container>
          <p className="text-center text-xs text-body-soft">
            © {new Date().getFullYear()} Polypips. Tous droits réservés.
          </p>
        </Container>
      </div>
    </footer>
  );
}
