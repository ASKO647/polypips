"use client";

import { useRef, useState } from "react";
import { ArrowRight, Clock, Link2, UploadCloud, X } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { RECENT_ANALYSES, type MarketAnalysis } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

export function AnalysisInput({
  onAnalyze,
  onSelectRecent,
}: {
  onAnalyze: () => void;
  onSelectRecent: (analysis: MarketAnalysis) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAnalyze = file !== null || link.trim() !== "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Analyse IA
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          Déposez une capture ou collez un lien de marché Polymarket.
        </p>
      </div>

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
            if (dropped) setFile(dropped);
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
              if (selected) setFile(selected);
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
                aria-label="Retirer le fichier"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
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
                Glissez-déposez une capture d&apos;écran
              </p>
              <p className="text-xs text-white/40">
                ou cliquez pour parcourir vos fichiers
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/30">
            ou
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-white/25">
          <Link2 className="h-4 w-4 shrink-0 text-white/40" strokeWidth={2} />
          <input
            type="url"
            inputMode="url"
            placeholder="Collez un lien de marché Polymarket"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <Button
          type="button"
          disabled={!canAnalyze}
          onClick={onAnalyze}
          className="w-full sm:w-auto sm:self-end"
        >
          Analyser
          <ButtonIcon>
            <ArrowRight className="h-4 w-4" />
          </ButtonIcon>
        </Button>
      </div>

      {RECENT_ANALYSES.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
            Marchés récemment analysés
          </p>
          <div className="flex flex-col gap-2">
            {RECENT_ANALYSES.map((item) => (
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
                    item.decision === "YES"
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
