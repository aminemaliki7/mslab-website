"use client";

/**
 * In-memory channel from the Studio to the request form ("Use this design in my request"):
 * the design spec (JSON, sent as a hidden field), the customer's ORIGINAL artwork files
 * (uploaded unchanged) and the generated mockups (uploaded as "mslab-mockup-…" PNGs).
 * Each hand-off replaces the previous design and mockups; artwork already attached is kept.
 */
export type StudioHandoff = {
  design: string;
  productName: string;
  layerCount: number;
  artwork: File[];
  mockups: File[];
};

type Listener = (handoff: StudioHandoff) => void;

const listeners = new Set<Listener>();

export const mockupHandoff = {
  send(handoff: StudioHandoff) {
    for (const listener of listeners) listener(handoff);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Prefix the database uses to tell mockups from artwork (migration 20261118150000). */
export const MOCKUP_FILE_PREFIX = "mslab-mockup-";
