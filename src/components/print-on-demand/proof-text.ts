"use client";

/**
 * The text a visitor typed in the homepage live proof, kept for the session so the mockup
 * studio opens with it (sessionStorage; never sent anywhere). Shaped for useSyncExternalStore.
 */
const KEY = "mslab-proof-text";

export const proofText = {
  read(): string {
    try {
      return sessionStorage.getItem(KEY) ?? "";
    } catch {
      return "";
    }
  },
  write(value: string) {
    try {
      if (value) sessionStorage.setItem(KEY, value);
      else sessionStorage.removeItem(KEY);
    } catch {
      // Storage unavailable (private mode): the studio simply starts empty.
    }
  },
  subscribe() {
    return () => {};
  },
  server(): string {
    return "";
  },
};
