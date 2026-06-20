"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

type Pending = { id: string; preview: string; error?: boolean };

// Admin gallery editor: previews selected files instantly, uploads them to
// Storage (showing an uploading state), and keeps the ordered list of public
// URLs in a hidden input that the saveProduct action reads.
export default function ProductImageManager({
  slug,
  initialImages,
}: {
  slug: string;
  initialImages: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [images, setImages] = useState<string[]>(initialImages);
  const [pending, setPending] = useState<Pending[]>([]);

  async function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setPending((p) => [...p, { id, preview }]);

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${slug || "product"}/${Date.now()}-${id}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });

      if (error) {
        setPending((p) =>
          p.map((x) => (x.id === id ? { ...x, error: true } : x)),
        );
      } else {
        const url = supabase.storage.from(BUCKET).getPublicUrl(path).data
          .publicUrl;
        setImages((im) => [...im, url]);
        setPending((p) => p.filter((x) => x.id !== id));
        URL.revokeObjectURL(preview);
      }
    }
  }

  return (
    <div className="sm:col-span-6">
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="flex flex-wrap items-center gap-2">
        {images.map((url) => (
          <div key={url} className="relative h-16 w-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-full w-full rounded object-cover"
            />
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

        {pending.map((p) => (
          <div key={p.id} className="relative h-16 w-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.preview}
              alt=""
              className="h-full w-full rounded object-cover opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs">
              {p.error ? "⚠️" : "⏳"}
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
      <p className="mt-1 text-[11px] text-foreground/50">
        First image is the cover. Changes save when you press Save.
      </p>
    </div>
  );
}
