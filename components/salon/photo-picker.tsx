"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PickedPhoto {
  id: string;
  /** Object URL for the local preview — instant, no upload wait. */
  previewUrl: string;
  /** Filled in once the background upload resolves. */
  remoteUrl?: string;
  progress: number;
  error?: string;
}

const MAX_PHOTOS = 3;
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Up to three reference photos.
 *
 * Two deliberate behaviours:
 *  - Compression happens client-side before upload (≤1600px, ~0.8 quality),
 *    because salon Wi-Fi is bad and a 12MP phone photo will not arrive.
 *  - Upload runs in the BACKGROUND and never blocks Send. The preview is a
 *    local object URL, so the customer sees their photo instantly and the
 *    submit reconciles whatever finished.
 *
 * HEIC: iOS hands us image/heic that canvas cannot decode. We detect and
 * reject it with a clear message rather than silently uploading a file the
 * tech's browser won't render.
 */
export function PhotoPicker({
  photos,
  onChange,
  upload,
  className,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  /** Injected so the component stays storage-agnostic and testable. */
  upload?: (file: File, onProgress: (pct: number) => void) => Promise<string>;
  className?: string;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const room = MAX_PHOTOS - photos.length;
      if (room <= 0) return;
      setBusy(true);

      const accepted: PickedPhoto[] = [];

      for (const file of Array.from(files).slice(0, room)) {
        const isHeic =
          /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

        if (isHeic) {
          accepted.push({
            id: crypto.randomUUID(),
            previewUrl: "",
            progress: 0,
            error: t("details.photoTooBig"),
          });
          continue;
        }

        if (file.size > MAX_BYTES) {
          accepted.push({
            id: crypto.randomUUID(),
            previewUrl: "",
            progress: 0,
            error: t("details.photoTooBig"),
          });
          continue;
        }

        accepted.push({
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
          progress: 0,
        });
      }

      const next = [...photos, ...accepted];
      onChange(next);
      setBusy(false);

      // Fire uploads without awaiting — Send must never wait on this.
      if (!upload) return;
      accepted.forEach(async (p, i) => {
        const file = Array.from(files)[i];
        if (!file || p.error) return;
        try {
          const { default: compress } = await import("browser-image-compression");
          const small = await compress(file, {
            maxWidthOrHeight: 1600,
            initialQuality: 0.8,
            useWebWorker: true,
          });
          const remoteUrl = await upload(small, (pct) => {
            onChange(
              next.map((q) => (q.id === p.id ? { ...q, progress: pct } : q))
            );
          });
          onChange(
            next.map((q) =>
              q.id === p.id ? { ...q, remoteUrl, progress: 100 } : q
            )
          );
        } catch {
          onChange(
            next.map((q) =>
              q.id === p.id ? { ...q, error: t("error.generic") } : q
            )
          );
        }
      });
    },
    [photos, onChange, upload, t]
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-start gap-3">
        {photos.map((p, i) => (
          <figure key={p.id} className="relative">
            {p.error ? (
              <div className="border-danger-strong bg-surface-sunken text-caption text-danger-strong grid size-28 place-items-center rounded-media border-2 p-2 text-center">
                {p.error}
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt=""
                  className="border-hairline size-28 rounded-media border object-cover"
                />
                {p.progress < 100 && !p.remoteUrl && (
                  <span className="bg-surface-sunken absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-pill">
                    <span
                      className="bg-coral block h-full transition-[width] duration-200"
                      style={{ width: `${p.progress}%` }}
                    />
                  </span>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => onChange(photos.filter((q) => q.id !== p.id))}
              aria-label={t("a11y.removePhoto", { n: i + 1 })}
              className="bg-danger-strong text-on-danger-strong absolute -right-2 -top-2 grid size-8 place-items-center rounded-pill shadow-sm active:scale-[0.97]"
            >
              <X className="size-4" strokeWidth={3} />
            </button>
          </figure>
        ))}

        {photos.length < MAX_PHOTOS && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="h-28 w-28 flex-col gap-1"
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Camera className="size-6" />
            )}
            <span className="text-caption">{t("details.addPhoto")}</span>
          </Button>
        )}
      </div>

      <p className="text-caption text-ink-muted">{t("details.photoLimit")}</p>
    </div>
  );
}
