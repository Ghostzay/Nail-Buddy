"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  photoUrl: string | null;
  onChange: (url: string | null) => void;
}

export function PhotoUpload({ photoUrl, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("job-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("job-photos").getPublicUrl(path);

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (photoUrl) {
    return (
      <div className="relative w-fit">
        <Image
          src={photoUrl}
          alt="Reference photo"
          width={160}
          height={160}
          unoptimized
          className="size-40 rounded-2xl border object-cover"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow"
          aria-label="Remove photo"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-fit"
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Camera className="size-5" />
        )}
        {uploading ? "Uploading…" : "Add a reference photo (optional)"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
