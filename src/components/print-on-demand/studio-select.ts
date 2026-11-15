"use client";

import type { MockupKey } from "@/features/print-on-demand/mockup-keys";

/**
 * Tiny in-memory channel from the product cards ("Choose your product") to the mockup
 * studio: picking a card selects that product in the studio, which then scrolls into view.
 */
type Listener = (key: MockupKey) => void;

const listeners = new Set<Listener>();

export const studioSelect = {
  send(key: MockupKey) {
    for (const listener of listeners) listener(key);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
