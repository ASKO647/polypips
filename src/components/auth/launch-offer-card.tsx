import { Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Countdown } from "@/components/ui/countdown";
import { getDefaultLaunchDeadline } from "@/lib/deadline";

export async function LaunchOfferCard() {
  const deadline = getDefaultLaunchDeadline();
  const t = await getTranslations("Auth.LaunchOfferCard");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-surface p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Gift className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{t("badge")}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-brand-600">
              {t("price")}
            </span>
            <span className="text-xs font-medium text-body-soft">
              {t("duration")}
            </span>
          </p>
        </div>
      </div>

      <p className="text-xs font-medium text-body-soft">{t("afterOffer")}</p>

      <Countdown deadline={deadline} variant="blocks" />
    </div>
  );
}
