"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Shared between the Profil page header and the header's ProfileMenu so
 * both always render the exact same avatar (real photo once uploaded, or
 * initials-on-brand fallback before that) instead of two subtly different
 * placeholder styles drifting apart over time. */
export function UserAvatar({
  name,
  avatarUrl,
  size = 40,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
  className?: string;
}) {
  // Falls back to initials if the URL points at a removed/broken object —
  // a stale cross-device URL, a manually-deleted storage object, or any
  // other fetch failure — rather than showing a next/image broken-image
  // icon in a user-facing avatar slot. Stores which URL failed (not just
  // a boolean) so a new avatarUrl — a fresh upload, say — naturally gets a
  // clean attempt again without needing an effect to reset anything.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (avatarUrl && avatarUrl !== failedUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
        unoptimized
        onError={() => setFailedUrl(avatarUrl)}
      />
    );
  }

  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-bold text-brand-400",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}
