import { useTranslations } from "next-intl";
import { ClipboardList, Eye, FileText, ShieldAlert, Table2 } from "lucide-react";
import type {
  Artifact,
  ChecklistPayload,
  ComparisonTablePayload,
  ReportPayload,
  RiskSummaryPayload,
  SurveillancePlanPayload,
} from "@/lib/data/coach";
import { cn } from "@/lib/utils";

/**
 * One typed React component per artifact type — every one renders from
 * an already-validated JSON payload (see artifact-tools.ts's
 * validateArtifactPayload on the server) via plain JSX, never
 * dangerouslySetInnerHTML or an eval of model-provided code. This file
 * is the entire rendering surface for Coach artifacts; there is no
 * generic/dynamic renderer that could be tricked into executing
 * something the model wrote.
 */

function CardShell({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Table2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <h3 className="font-display text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ComparisonTableCard({ payload }: { payload: ComparisonTablePayload }) {
  return (
    <CardShell icon={Table2} title={payload.title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              <th className="pb-2 pr-3">—</th>
              {payload.metric_labels.map((label, i) => (
                <th key={i} className="pb-2 px-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.rows.map((row, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="py-2 pr-3 font-medium text-white">{row.label}</td>
                {row.metric_values.map((value, j) => (
                  <td key={j} className="py-2 px-3 text-white/70">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-white/50">{payload.conclusion}</p>
    </CardShell>
  );
}

function ReportCard({ payload }: { payload: ReportPayload }) {
  return (
    <CardShell icon={FileText} title={payload.title}>
      <p className="text-sm leading-relaxed text-white/70">{payload.summary}</p>
      <div className="flex flex-col gap-3">
        {payload.sections.map((section, i) => (
          <div key={i}>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{section.heading}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{section.body}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function ChecklistCard({ payload }: { payload: ChecklistPayload }) {
  return (
    <CardShell icon={ClipboardList} title={payload.title}>
      <ul className="flex flex-col gap-2">
        {payload.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-white/20" />
            {item}
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

const RISK_LEVEL_TONE: Record<RiskSummaryPayload["risk_level"], string> = {
  Faible: "bg-emerald-500/15 text-emerald-400",
  Moyenne: "bg-amber-500/15 text-amber-400",
  Élevée: "bg-rose-500/15 text-rose-400",
};

function RiskSummaryCard({ payload }: { payload: RiskSummaryPayload }) {
  const t = useTranslations("Coach.Artifacts");
  return (
    <CardShell icon={ShieldAlert} title={payload.title}>
      <span
        className={cn(
          "w-fit rounded-full px-2.5 py-1 text-[11px] font-bold",
          RISK_LEVEL_TONE[payload.risk_level]
        )}
      >
        {t("riskLevelLabel", { level: payload.risk_level })}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("keyRisks")}</p>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {payload.key_risks.map((risk, i) => (
            <li key={i} className="text-sm text-white/70">
              • {risk}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{t("mitigations")}</p>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {payload.mitigations.map((mitigation, i) => (
            <li key={i} className="text-sm text-white/70">
              • {mitigation}
            </li>
          ))}
        </ul>
      </div>
    </CardShell>
  );
}

function SurveillancePlanCard({ payload }: { payload: SurveillancePlanPayload }) {
  const t = useTranslations("Coach.Artifacts");
  return (
    <CardShell icon={Eye} title={payload.title}>
      <div className="flex flex-col gap-2">
        {payload.watch_items.map((item, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-0.5 text-xs text-white/50">{item.trigger_condition}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/40">{t("reviewFrequency", { frequency: payload.review_frequency })}</p>
    </CardShell>
  );
}

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case "comparison_table":
      return <ComparisonTableCard payload={artifact.payload as ComparisonTablePayload} />;
    case "report":
      return <ReportCard payload={artifact.payload as ReportPayload} />;
    case "checklist":
      return <ChecklistCard payload={artifact.payload as ChecklistPayload} />;
    case "risk_summary":
      return <RiskSummaryCard payload={artifact.payload as RiskSummaryPayload} />;
    case "surveillance_plan":
      return <SurveillancePlanCard payload={artifact.payload as SurveillancePlanPayload} />;
    default:
      return null;
  }
}

export function ArtifactsPanel({ artifacts }: { artifacts: Artifact[] }) {
  const t = useTranslations("Coach.Artifacts");

  if (artifacts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05]">
          <Table2 className="h-5 w-5 text-white/30" />
        </span>
        <p className="text-sm font-semibold text-white">{t("emptyTitle")}</p>
        <p className="max-w-xs text-xs leading-relaxed text-white/40">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}
