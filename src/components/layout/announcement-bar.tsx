import { Sparkles } from "lucide-react";
import { Countdown } from "@/components/ui/countdown";
import { getDefaultLaunchDeadline } from "@/lib/deadline";

export function AnnouncementBar() {
  const deadline = getDefaultLaunchDeadline();

  return (
    <div className="flex min-h-12 items-center border-b border-[#F2D7D7] bg-[#FFF3F3] pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-6 text-center lg:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Offre limitée
        </span>
        <p className="text-sm text-body">
          L&apos;offre à 0,99&nbsp;€ se termine dans
        </p>
        <Countdown deadline={deadline} variant="cells" />
      </div>
    </div>
  );
}
