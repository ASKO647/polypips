import Image from "next/image";
import Link from "next/link";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import type { SubscriptionRow } from "@/lib/supabase/subscriptions";

export function DashboardSidebar({
  userEmail,
  subscription,
  analysesToday,
}: {
  userEmail: string;
  subscription: SubscriptionRow | null;
  analysesToday: number;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#160b0c] lg:flex">
      <Link
        href="/dashboard"
        className="flex h-[72px] shrink-0 items-center gap-2 px-6"
        aria-label="Polypips — tableau de bord"
      >
        <Image
          src="/polypips-mark.png"
          alt=""
          width={290}
          height={322}
          className="h-7 w-auto"
        />
        <span className="font-display text-lg font-bold tracking-tight text-white">
          POLYPIPS
        </span>
      </Link>

      <SidebarNavContent
        userEmail={userEmail}
        subscription={subscription}
        analysesToday={analysesToday}
      />
    </aside>
  );
}
