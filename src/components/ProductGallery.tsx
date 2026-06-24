"use client";

import { useState } from "react";

import ProductThumb from "@/components/ProductThumb";

// Product image gallery: a main image plus a thumbnail strip when there are
// multiple images.
export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const list: (string | null)[] = images.length > 0 ? images : [null];
  const [index, setIndex] = useState(0);
  const current = list[Math.min(index, list.length - 1)];

  return (
    <div>
      <ProductThumb
        imageUrl={current}
        name={name}
        className="aspect-square w-full rounded-2xl border border-saffron-100"
        emojiSize="text-8xl"
        sizes="(max-width: 1024px) 100vw, 40vw"
      />
      {list.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {list.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`overflow-hidden rounded-lg border ${
                i === index ? "border-saffron-500" : "border-saffron-100"
              }`}
            >
              <ProductThumb
                imageUrl={url}
                name={name}
                className="h-16 w-16"
                emojiSize="text-2xl"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
