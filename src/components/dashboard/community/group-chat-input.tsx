"use client";

import { useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GroupChatInput({
  value,
  onChange,
  onSend,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: (image: File | null) => void;
  disabled: boolean;
  error: string | null;
}) {
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    setPendingImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingImage(null);
    setPreviewUrl(null);
  };

  const canSend = (value.trim() !== "" || pendingImage !== null) && !disabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(pendingImage);
    clearImage();
  };

  return (
    <div className="border-t border-white/10 p-3 sm:p-4">
      {error && <p className="mb-2 px-1 text-xs text-rose-400">{error}</p>}

      {previewUrl && (
        <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="min-w-0 flex-1 truncate text-xs text-white/50">
            {pendingImage?.name}
          </span>
          <button
            type="button"
            onClick={clearImage}
            aria-label="Retirer l'image"
            className="shrink-0 text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handlePickImage}
          disabled={disabled}
          aria-label="Ajouter une photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition-colors duration-150 hover:text-white disabled:pointer-events-none disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Écrivez un message..."
          disabled={disabled}
          className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Envoyer"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-transform duration-150 ease-out hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
