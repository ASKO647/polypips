import type { Metadata } from "next";
import { CoachFlow } from "@/components/dashboard/coach/coach-flow";

export const metadata: Metadata = {
  title: "Coach IA — Polypips",
};

export default function CoachPage() {
  return <CoachFlow />;
}
