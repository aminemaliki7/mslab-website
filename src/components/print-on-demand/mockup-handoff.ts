"use client";

/**
 * Tiny in-memory channel from the mockup studio to the request form's file uploader:
 * "use this product" hands over the visitor's design file once (then it is consumed).
 */
type Listener = (file: File) => void;

const listeners = new Set<Listener>();

export const mockupHandoff = {
  send(file: File) {
    for (const listener of listeners) listener(file);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
