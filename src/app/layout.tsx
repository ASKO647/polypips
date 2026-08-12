import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatButton } from "@/components/layout/chat-button";
import { ScrollRevealObserver } from "@/components/scroll-reveal-observer";
import { TouchActiveEnabler } from "@/components/touch-active-enabler";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Polypips — L'IA qui analyse. Vous décidez. Le marché suit.",
  description:
    "Polypips analyse les marchés Polymarket en profondeur, vous indique quelle position présente le meilleur signal et vous explique pourquoi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page-bg text-ink">
        <ThemeProvider>
          {children}
          <ChatButton />
          <ScrollRevealObserver />
          <TouchActiveEnabler />
        </ThemeProvider>
      </body>
    </html>
  );
}
