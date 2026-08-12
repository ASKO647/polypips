import type { Metadata } from "next";
import { CopyTradingFlow } from "@/components/dashboard/copy-trading/copy-trading-flow";

export const metadata: Metadata = {
  title: "Copy Trading — Polypips",
};

export default function CopyTradingPage() {
  return <CopyTradingFlow />;
}
