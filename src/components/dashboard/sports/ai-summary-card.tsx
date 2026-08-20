export function AiSummaryCard({ summary }: { summary: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-white">Résumé IA</h3>
        <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-400">
          IA
        </span>
      </div>
      <p className="text-sm leading-relaxed text-white/60">{summary}</p>
    </div>
  );
}
