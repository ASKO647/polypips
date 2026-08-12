import type { Metadata } from "next";
import { SmartMoneyFlow } from "@/components/dashboard/smart-money/smart-money-flow";

export const metadata: Metadata = {
  title: "Smart Money — Polypips",
};

export default function SmartMoneyPage() {
  return <SmartMoneyFlow />;
}
