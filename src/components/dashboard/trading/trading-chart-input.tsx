"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, BrainCircuit, TriangleAlert, UploadCloud, X } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { getTradingDisclaimer } from "@/lib/data/trading-analysis";
import { cn } from "@/lib/utils";
import type { AnalysisDepth } from "@/lib/data/deep-analysis";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TradingChartInput({
  errorMessage,
  file,
  onFileChange,
  onAnalyze,
  creditBalance,
}: {
  errorMessage: React.ReactNode | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: (
    request: { imageBase64: string; imageMediaType: string },
    depth: AnalysisDepth
  ) => void;
  /** Current Deep Analysis credit balance — shown next to the button so a
   * user isn't surprised by a "no credits" error after uploading. Always
   * shown (even 0): the button stays clickable at 0 too, since the
   * no_credits error path already links to /dashboard/credits. */
  creditBalance: number;
}) {
  const t = useTranslations("Trading.ChartInput");
  const tTrading = useTranslations("Trading");
  const tCredits = useTranslations("Credits");
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState<AnalysisDepth | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAnalyze = file !== null && preparing === null;

  const handleSubmit = async (depth: AnalysisDepth) => {
    if (!canAnalyze || !file) return;
    setPreparing(depth);
    try {
      const imageBase64 = await fileToBase64(file);
      onAnalyze({ imageBase64, imageMediaType: file.type || "image/png" }, depth);
    } finally {
      setPreparing(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">{t("description")}</p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={2} />
          <p className="text-sm leading-relaxed text-rose-300">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) onFileChange(dropped);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center transition-colors duration-150",
            dragOver
              ? "border-brand-400 bg-brand-500/[0.06]"
              : "border-white/15 hover:border-white/25 hover:bg-white/[0.02]"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) onFileChange(selected);
            }}
          />
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-brand-400">
            <UploadCloud className="h-5 w-5" strokeWidth={1.75} />
          </span>
          {file ? (
            <div className="flex items-center gap-2">
              <p className="max-w-[240px] truncate text-sm font-medium text-white">{file.name}</p>
              <button
                type="button"
                aria-label={t("removeFile")}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-white">{t("dropzoneCta")}</p>
              <p className="text-xs text-white/40">{t("dropzoneBrowse")}</p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={!canAnalyze}
            onClick={() => handleSubmit("deep")}
            className="w-full sm:w-auto"
          >
            <BrainCircuit className="h-4 w-4" />
            {preparing === "deep" ? t("preparing") : tCredits("DeepAnalysis.button")}
            <span className="ml-1 text-xs font-normal text-current opacity-60">
              ({tCredits("DeepAnalysis.buttonCreditCost")} · {creditBalance})
            </span>
          </Button>
          <Button
            type="button"
            disabled={!canAnalyze}
            onClick={() => handleSubmit("standard")}
            className="w-full sm:w-auto"
          >
            {preparing === "standard" ? t("preparing") : t("submit")}
            <ButtonIcon>
              <ArrowRight className="h-4 w-4" />
            </ButtonIcon>
          </Button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-white/35">{getTradingDisclaimer(tTrading)}</p>
    </div>
  );
}
