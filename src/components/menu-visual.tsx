"use client";

import Image from "next/image";
import { useState } from "react";

const tones = [
  "from-[#d98b62] to-[#8d3f26]",
  "from-[#d2a86f] to-[#7c4d2b]",
  "from-[#8fa27a] to-[#46583c]",
  "from-[#c98c7c] to-[#794139]",
];

export function MenuVisual({
  name,
  slug,
  imageUrl,
  className = "",
  sizes = "(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1280px) 50vw, 33vw",
}: {
  name: string;
  slug: string;
  imageUrl: string | null;
  className?: string;
  sizes?: string;
}) {
  const tone = tones[slug.length % tones.length];
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  if (imageUrl && imageUrl !== failedImageUrl) {
    return (
      <div className={`relative overflow-hidden bg-[#d9c4b0] ${className}`}>
        <Image
          alt={`${name}, photographed on warm handmade tableware`}
          className="object-cover transition duration-500 group-hover:scale-[1.025]"
          fill
          onError={() => setFailedImageUrl(imageUrl)}
          sizes={sizes}
          src={imageUrl}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`${name} visual placeholder`}
      className={`relative isolate overflow-hidden bg-gradient-to-br ${tone} ${className}`}
      role="img"
    >
      <span className="absolute -right-8 -top-10 size-36 rounded-full border border-white/25" />
      <span className="absolute bottom-5 right-6 size-16 rounded-full bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" />
      <span className="absolute left-6 top-6 text-5xl font-semibold tracking-[-0.08em] text-white/90">
        {name.slice(0, 1)}
      </span>
      <span className="absolute bottom-6 left-6 max-w-36 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
        Kitchen study
      </span>
    </div>
  );
}
