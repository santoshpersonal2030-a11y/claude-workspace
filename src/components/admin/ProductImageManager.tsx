"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

type Upload = { id: string; preview: string; progress: number; error?: boolean };

// Uploads a file to a signed URL via XHR so we get real progress events.
// Falls back to a normal upload (no granular progress) if signing fails.
async function uploadWithProgress(
  supabase: ReturnType<typeof createClient>,
  path: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    onProgress(1);
    return upErr ? null : path;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.signedUrl);
      xhr.setRequestHeader(
        "content-type",
        file.type || "application/octet-stream",
      );
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`HTTP ${xhr.status}`));
      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(file);
    });
    return path;
  } catch {
    return null;
  }
}

// Admin gallery editor: instant previews, real per-file upload progress,
// drag-to-reorder, set-cover, and remove. The ordered URLs are serialised into
// a hidden input that the saveProduct action reads (images[0] is the cover).
export default function ProductImageManager({
  slug,
  initialImages,
}: {
  slug: string;
  initialImages: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setUploads((u) => [...u, { id, preview, progress: 0 }]);

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${slug || "product"}/${Date.now()}-${id}.${ext}`;
      const result = await uploadWithProgress(supabase, path, file, (frac) =>
        setUploads((u) =>
          u.map((x) => (x.id === id ? { ...x, progress: frac } : x)),
        ),
      );

      if (!result) {
        setUploads((u) =>
          u.map((x) => (x.id === id ? { ...x, error: true } : x)),
        );
      } else {
        const url = supabase.storage.from(BUCKET).getPublicUrl(result).data
          .publicUrl;
        setImages((im) => [...im, url]);
        setUploads((u) => u.filter((x) => x.id !== id));
        URL.revokeObjectURL(preview);
      }
    }
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setImages((im) => {
      const next = [...im];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  return (
    <div className="sm:col-span-6">
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="flex flex-wrap items-start gap-2">
        {images.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) reorder(dragIndex, i);
              setDragIndex(null);
            }}
            className="relative h-16 w-16 cursor-move"
            title="Drag to reorder"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={`h-full w-full rounded object-cover ${
                i === 0 ? "ring-2 ring-saffron-500" : ""
              }`}
            />
            {i === 0 ? (
              <span className="absolute bottom-0 left-0 right-0 rounded-b bg-saffron-600/90 text-center text-[9px] text-white">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => reorder(i, 0)}
                className="absolute bottom-0 left-0 right-0 rounded-b bg-black/55 text-center text-[9px] text-white opacity-0 hover:opacity-100"
              >
                Set cover
              </button>
            )}
            <button
              type="button"
              onClick={() => setImages((im) => im.filter((u) => u !== url))}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-maroon-600 text-[10px] text-white"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ))}

        {uploads.map((u) => (
          <div key={u.id} className="relative h-16 w-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u.preview}
              alt=""
              className="h-full w-full rounded object-cover opacity-40"
            />
            <div className="absolute inset-x-1 bottom-1">
              {u.error ? (
                <span className="text-[10px] text-maroon-600">⚠️ failed</span>
              ) : (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-saffron-600 transition-all"
                    style={{ width: `${Math.round(u.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed border-saffron-300 text-xl text-saffron-600 hover:bg-saffron-50">
          +
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>
      <p className="mt-1 text-[11px] text-foreground/65">
        Drag to reorder · first image is the cover · changes save on Save.
      </p>
    </div>
  );
}
