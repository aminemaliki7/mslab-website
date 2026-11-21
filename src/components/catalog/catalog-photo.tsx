"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

/**
 * Product photo that never leaves an empty frame: if the file fails to load (deleted from
 * Storage, wrong path), the product's drawing is shown instead.
 */
export function CatalogPhoto({ fallback, ...props }: ImageProps & { fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <Image {...props} alt={props.alt} onError={() => setFailed(true)} />;
}
