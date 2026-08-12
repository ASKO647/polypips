import type { Metadata } from "next";
import { CoachFlow } from "@/components/dashboard/coach/coach-flow";
import { IS_DEMO_MODE } from "@/lib/config/demo-mode";
import { MOCK_CONVERSATIONS } from "@/lib/data/coach";

export const metadata: Metadata = {
  title: "Coach IA — Polypips",
};

export default function CoachPage() {
  return (
    <CoachFlow
      initialConversations={IS_DEMO_MODE ? MOCK_CONVERSATIONS : []}
    />
  );
}
