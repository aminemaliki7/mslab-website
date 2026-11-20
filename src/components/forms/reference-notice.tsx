"use client";

import { useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * The reference given after a successful submission: shown with a copy button and a red
 * reminder to keep it, since it is the visitor's only handle on the request.
 */
export function ReferenceNotice({
  reference,
  label,
  t,
}: {
  reference: string;
  /** Sentence with a `{reference}` placeholder, e.g. "Référence de votre demande : {reference}". */
  label: string;
  t: Pick<Dictionary["forms"], "copyReference" | "referenceCopied" | "saveReference">;
}) {
  const [copied, setCopied] = useState(false);
  const code = useRef<HTMLElement>(null);

  function done() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      done();
    } catch {
      // Clipboard API refused (permission, embedded view): select the reference and fall back to
      // the legacy copy command; if that fails too, the selection lets the visitor copy it by hand.
      const node = code.current;
      if (!node) return;
      window.getSelection()?.selectAllChildren(node);
      if (document.execCommand("copy")) done();
    }
  }

  const [before, after = ""] = label.split("{reference}");

  return (
    <div className="space-y-2">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          {before}
          <bdi ref={code} dir="ltr" className="font-[family-name:var(--font-geist-mono)] font-semibold select-all">
            {reference}
          </bdi>
          {after}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? t.referenceCopied : t.copyReference}
          title={copied ? t.referenceCopied : t.copyReference}
          className="border-line-strong text-fg hover:bg-surface focus-visible:outline-focus bg-bg inline-flex size-9 items-center justify-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {copied ? <CheckIcon className="text-success" width={16} height={16} /> : <CopyIcon width={16} height={16} />}
        </button>
        <span aria-live="polite" className="text-success text-xs font-medium">
          {copied ? t.referenceCopied : ""}
        </span>
      </p>
      <p className="text-danger text-sm font-medium">{t.saveReference}</p>
    </div>
  );
}
