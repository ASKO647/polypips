"use client";

import { useRef, useState } from "react";
import { Camera, PenLine, TriangleAlert, UploadCloud, X } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import type { SportsBetInput } from "@/lib/data/sports-analysis";
import type { AnalyzeSportsBetRequest } from "@/lib/supabase/analyze-sports-bet-client";
import { cn } from "@/lib/utils";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_BET: SportsBetInput = {
  sport: "",
  participants: "",
  betType: "",
  selection: "",
  bookmakerOdds: "",
};

type Mode = "image" | "manual";

export function SportsAnalysisInput({
  errorMessage,
  onAnalyze,
}: {
  errorMessage: React.ReactNode | null;
  onAnalyze: (request: AnalyzeSportsBetRequest) => void;
}) {
  const [mode, setMode] = useState<Mode>("image");
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [bet, setBet] = useState<SportsBetInput>(EMPTY_BET);
  const inputRef = useRef<HTMLInputElement>(null);

  const setField = (field: keyof SportsBetInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBet((prev) => ({ ...prev, [field]: e.target.value }));

  const manualComplete =
    bet.sport.trim() !== "" &&
    bet.participants.trim() !== "" &&
    bet.betType.trim() !== "" &&
    bet.selection.trim() !== "" &&
    bet.bookmakerOdds.trim() !== "";

  const canAnalyze = mode === "image" ? file !== null && !preparing : manualComplete;

  const handleSubmit = async () => {
    if (!canAnalyze) return;
    if (mode === "image" && file) {
      setPreparing(true);
      try {
        const imageBase64 = await fileToBase64(file);
        onAnalyze({ type: "image", imageBase64, imageMediaType: file.type || "image/png" });
      } finally {
        setPreparing(false);
      }
    } else if (mode === "manual") {
      onAnalyze({ type: "manual", bet });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-bold text-white">Analyse IA — Sport</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          Faites analyser n&apos;importe quel pari sportif, sur n&apos;importe quel bookmaker —
          déposez une capture ou saisissez les informations vous-même.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3.5">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={2} />
          <p className="text-sm leading-relaxed text-rose-300">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode("image")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              mode === "image" ? "bg-brand-500/15 text-brand-400" : "text-white/50 hover:text-white"
            )}
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={2} />
            Capture d&apos;écran
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              mode === "manual" ? "bg-brand-500/15 text-brand-400" : "text-white/50 hover:text-white"
            )}
          >
            <PenLine className="h-3.5 w-3.5" strokeWidth={2} />
            Saisie manuelle
          </button>
        </div>

        {mode === "image" ? (
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
                <p className="max-w-[240px] truncate text-sm font-medium text-white">{file.name}</p>
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
                  Glissez-déposez une capture d&apos;écran de pari
                </p>
                <p className="text-xs text-white/40">
                  Cotes/match affichés chez n&apos;importe quel bookmaker — ou cliquez pour parcourir
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/50">
              Sport
              <input
                type="text"
                value={bet.sport}
                onChange={setField("sport")}
                placeholder="Football, Tennis, Rugby..."
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/50">
              Match / participants
              <input
                type="text"
                value={bet.participants}
                onChange={setField("participants")}
                placeholder="PSG vs Marseille"
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/50">
              Type de pari
              <input
                type="text"
                value={bet.betType}
                onChange={setField("betType")}
                placeholder="Vainqueur du match"
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/50">
              Sélection
              <input
                type="text"
                value={bet.selection}
                onChange={setField("selection")}
                placeholder="PSG"
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-white/50 sm:col-span-2">
              Cote proposée par le bookmaker
              <input
                type="text"
                value={bet.bookmakerOdds}
                onChange={setField("bookmakerOdds")}
                placeholder="1.85 (décimale, américaine ou fractionnaire)"
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400"
              />
            </label>
          </div>
        )}

        <Button type="button" disabled={!canAnalyze} onClick={handleSubmit} className="w-full sm:w-auto sm:self-end">
          Analyser
          <ButtonIcon>→</ButtonIcon>
        </Button>
      </div>
    </div>
  );
}
