"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Custom play/pause UI over a plain <audio> element — this app never
 * uses native browser media controls elsewhere, so a voice message
 * shouldn't either. durationSeconds is the value recorded client-side at
 * send time (the audio element's own .duration can be unreliable for
 * some webm/opus recordings until enough of the file has buffered), used
 * as the initial display and as a fallback if the element never reports
 * one. */
export function VoiceMessagePlayer({
  src,
  durationSeconds,
  className,
}: {
  src: string;
  durationSeconds: number | null;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className={cn("flex w-56 items-center gap-2.5 rounded-full bg-black/15 px-2 py-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Mettre en pause" : "Écouter le message vocal"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={2} /> : <Play className="ml-0.5 h-3.5 w-3.5" strokeWidth={2} />}
      </button>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-white/70" style={{ width: `${progress * 100}%` }} />
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-white/70">
        {formatDuration(playing || currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}
