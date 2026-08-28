import type { Metadata } from "next";
import { SportComingSoon } from "@/components/dashboard/sports/sport-coming-soon";

export const metadata: Metadata = {
  title: "Sports — Polypips",
};

export default function SportCategoryPage() {
  return <SportComingSoon />;
}
