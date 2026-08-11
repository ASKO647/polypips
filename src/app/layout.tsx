import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatButton } from "@/components/layout/chat-button";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
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
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <ThemeProvider>
          {children}
          <ChatButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
