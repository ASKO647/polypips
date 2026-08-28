"use client";

import { useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, uploadMessageImage, validateCommunityImage } from "@/lib/supabase/community";

export function MessageInput({
  groupId,
  userId,
  disabled,
}: {
  groupId: string;
  userId: string;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validationError = validateCommunityImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSend = async () => {
    if (sending || disabled) return;
    if (text.trim() === "" && !imageFile) return;
    setSending(true);
    setError(null);
    try {
      const supabase = createClient();
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadMessageImage(supabase, groupId, userId, imageFile);
      }
      await sendMessage(supabase, { groupId, content: text.trim(), imageUrl });
      setText("");
      clearImage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message non envoyé.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      {error && <p className="mb-2 text-xs font-medium text-rose-400">{error}</p>}

      {imagePreview && (
        <div className="relative mb-3 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <button
            type="button"
            onClick={clearImage}
            aria-label="Retirer l'image"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={handlePickImage}
          disabled={disabled || sending}
          aria-label="Joindre une image"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          <ImagePlus className="h-4 w-4" strokeWidth={2} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez un message..."
          disabled={disabled || sending}
          className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/25 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || sending || (text.trim() === "" && !imageFile)}
          aria-label="Envoyer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-transform duration-150 ease-out hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
