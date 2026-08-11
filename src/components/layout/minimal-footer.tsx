import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

export function MinimalFooter() {
  return (
    <footer className="border-t border-border py-8">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo className="text-base" />
        <p className="text-xs text-body-soft">
          © {new Date().getFullYear()} Polypips. Tous droits réservés.
        </p>
      </Container>
    </footer>
  );
}
