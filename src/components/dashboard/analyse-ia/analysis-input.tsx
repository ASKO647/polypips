"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock, Link2, TriangleAlert, UploadCloud, X } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { isPrimaryDecision, type MarketAnalysis } from "@/lib/data/analysis";
import type { AnalyzeMarketRequest } from "@/lib/supabase/analyze-market-client";
import { cn } from "@/lib/utils";

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

export function AnalysisInput({
  recentAnalyses,
  errorMessage,
  link,
  onLinkChange,
  file,
  onFileChange,
  onAnalyze,
  onSelectRecent,
}: {
  recentAnalyses: MarketAnalysis[];
  errorMessage: React.ReactNode | null;
  link: string;
  onLinkChange: (link: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: (request: AnalyzeMarketRequest) => void;
  onSelectRecent: (analysis: MarketAnalysis) => void;
}) {
  const t = useTranslations("Polymarket.AnalyseIa");
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAnalyze = (file !== null || link.trim() !== "") && !preparing;

  const handleSubmit = async () => {
    if (!canAnalyze) return;
    if (file) {
      setPreparing(true);
      try {
        const imageBase64 = await fileToBase64(file);
        onAnalyze({
          type: "image",
          imageBase64,
          imageMediaType: file.type || "image/png",
        });
      } finally {
        setPreparing(false);
      }
    } else {
      onAnalyze({ type: "link", link: link.trim() });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          {t("subtitle")}
        </p>
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
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150",
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
              <p className="max-w-[240px] truncate text-sm font-medium text-white">
                {file.name}
              </p>
              <button
                type="button"
                aria-label={t("removeFileAria")}
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
              <p className="text-sm font-medium text-white">
                {t("dragDropTitle")}
              </p>
              <p className="text-xs text-white/40">
                {t("browseHint")}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/30">
            {t("orDivider")}
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-white/25">
          <Link2 className="h-4 w-4 shrink-0 text-white/40" strokeWidth={2} />
          <input
            type="url"
            inputMode="url"
            placeholder={t("linkPlaceholder")}
            value={link}
            onChange={(e) => onLinkChange(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <Button
          type="button"
          disabled={!canAnalyze}
          onClick={handleSubmit}
          className="w-full sm:w-auto sm:self-end"
        >
          {t("analyzeButton")}
          <ButtonIcon>
            <ArrowRight className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>

      {recentAnalyses.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            {t("recentAnalysesTitle")}
          </p>
          <div className="flex flex-col gap-2">
            {recentAnalyses.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectRecent(item)}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.question}
                  </p>
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    {item.analyzedAt} · {item.category}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                    isPrimaryDecision(item.decision, item.outcomes)
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  )}
                >
                  {item.decision} {item.aiProbability}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
