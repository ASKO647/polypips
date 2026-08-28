"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Trash2 } from "lucide-react";

/** Hard cap on a single voice message — stops the recording automatically
 * (without sending) once reached, so nothing unbounded ever gets
 * uploaded; the owner still reviews/sends or discards from there like
 * any other recording. */
const MAX_RECORDING_SECONDS = 120;

const CANDIDATE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Owner-only mic button + inline recording bar (timer, cancel, send) —
 * mirrors the message list's other actions in styling. Lets the parent
 * know when recording starts/stops so it can hide the rest of the input
 * row meanwhile (typing and recording a voice note at the same time
 * doesn't make sense). */
export function VoiceRecorderButton({
  disabled,
  onRecordingChange,
  onSend,
}: {
  disabled?: boolean;
  onRecordingChange?: (recording: boolean) => void;
  onSend: (blob: Blob, durationSeconds: number) => void | Promise<void>;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldSendRef = useRef(false);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      shouldSendRef.current = false;

      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopStream();
        if (shouldSendRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
          setSending(true);
          Promise.resolve(onSend(blob, duration))
            .catch((err) => setError(err instanceof Error ? err.message : "Envoi du vocal impossible."))
            .finally(() => setSending(false));
        }
        setRecording(false);
        setElapsedSeconds(0);
        onRecordingChange?.(false);
      };

      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      onRecordingChange?.(true);

      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            shouldSendRef.current = false;
            mediaRecorderRef.current?.stop();
          }
          return next;
        });
      }, 1000);
    } catch {
      setError("Micro indisponible. Vérifiez les autorisations de votre navigateur.");
    }
  };

  const handleSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    shouldSendRef.current = true;
    mediaRecorderRef.current.stop();
  };

  const handleCancel = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    shouldSendRef.current = false;
    mediaRecorderRef.current.stop();
  };

  if (recording) {
    return (
      <div className="flex h-10 flex-1 items-center gap-2.5 rounded-full border border-rose-500/30 bg-rose-500/[0.06] px-3.5">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-500" />
        <span className="min-w-[2.5rem] shrink-0 text-xs font-semibold tabular-nums text-white/80">
          {formatDuration(elapsedSeconds)}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Annuler l'enregistrement"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={handleSend}
          aria-label="Envoyer le vocal"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || sending}
        aria-label="Enregistrer un message vocal"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Mic className="h-4 w-4" strokeWidth={2} />}
      </button>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
    </>
  );
}
