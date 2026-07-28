import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a reference photo to the public `job-photos` bucket.
 *
 * supabase-js has no upload progress event, so progress is reported as a
 * coarse 0 → 90 → 100 rather than faked with a timer. A progress bar that
 * lies is worse than one that jumps.
 */
export async function uploadJobPhoto(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  onProgress(10);
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  onProgress(90);
  const { error } = await supabase.storage.from("job-photos").upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("job-photos").getPublicUrl(path);

  onProgress(100);
  return publicUrl;
}
