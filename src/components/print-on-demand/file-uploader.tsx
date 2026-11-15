"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { requestUploadTicket } from "@/features/print-on-demand/actions";
import { ACCEPT_ATTRIBUTE, ACCEPTED_FILE_TYPES, MAX_FILE_BYTES, MAX_FILES } from "@/features/print-on-demand/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { mockupHandoff } from "./mockup-handoff";

type T = Dictionary["printOnDemand"];
type Upload = { key: string; name: string; size: number; path: string | null; state: "uploading" | "done" | "error" };

/** Browsers often send no MIME type for design files: infer it from the extension. */
const BY_EXTENSION: Record<string, string> = {
  ai: "application/illustrator",
  eps: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function mimeOf(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = (ACCEPTED_FILE_TYPES as readonly string[]).includes(file.type) ? file.type : BY_EXTENSION[ext];
  return type ?? null;
}

/** Storage keys stay ASCII; the readable name is kept after the index prefix. */
function safeName(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (cleaned || "fichier").slice(-100);
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Uploads straight from the browser to the private `custom-uploads` bucket (never through the
 * Next.js server), under "<ticket>/<n>-<name>". The form submits the ticket and the paths
 * still listed; the database attaches only those.
 */
export function FileUploader({ storageEndpoint, publishableKey, t, onBusyChange }: {
  storageEndpoint: string;
  publishableKey: string;
  t: T;
  onBusyChange: (busy: boolean) => void;
}) {
  const inputId = useId();
  const hintId = useId();
  const [ticket, setTicket] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const counter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ensureTicket(): Promise<string | null> {
    if (ticket) return ticket;
    const result = await requestUploadTicket();
    if (!result.ok) return null;
    setTicket(result.ticket);
    return result.ticket;
  }

  async function onFiles(list: FileList | File[] | null) {
    if (!list?.length) return;
    const files = [...list];
    if (inputRef.current) inputRef.current.value = "";
    const problems: string[] = [];
    const active = uploads.filter((u) => u.state !== "error").length;
    const room = MAX_FILES - active;
    if (files.length > room) problems.push(format(t.fileTooMany, { max: MAX_FILES }));

    const accepted: { file: File; type: string }[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      const type = mimeOf(file);
      if (!type) problems.push(format(t.fileType, { name: file.name }));
      else if (file.size > MAX_FILE_BYTES) problems.push(format(t.fileTooLarge, { name: file.name }));
      else accepted.push({ file, type });
    }
    setMessages(problems);
    if (accepted.length === 0) return;

    onBusyChange(true);
    const currentTicket = await ensureTicket();
    const queued = accepted.map(({ file, type }) => {
      counter.current += 1;
      return { key: `${counter.current}`, file, type, path: currentTicket ? `${currentTicket}/${counter.current}-${safeName(file.name)}` : null };
    });
    setUploads((prev) => [
      ...prev,
      ...queued.map((q) => ({ key: q.key, name: q.file.name, size: q.file.size, path: q.path, state: q.path ? ("uploading" as const) : ("error" as const) })),
    ]);

    await Promise.all(
      queued.map(async (q) => {
        let ok = false;
        if (q.path) {
          try {
            const response = await fetch(`${storageEndpoint}/${q.path.split("/").map(encodeURIComponent).join("/")}`, {
              method: "POST",
              headers: { apikey: publishableKey, "content-type": q.type, "x-upsert": "false" },
              body: q.file,
            });
            ok = response.ok;
          } catch {
            ok = false;
          }
        }
        if (!ok) setMessages((m) => [...m, format(t.fileFailed, { name: q.file.name })]);
        setUploads((prev) => prev.map((u) => (u.key === q.key ? { ...u, state: ok ? "done" : "error" } : u)));
      }),
    );
    onBusyChange(false);
  }

  // A design chosen in the mockup studio ("use this product") is attached like a picked file.
  const onFilesRef = useRef(onFiles);
  useEffect(() => {
    onFilesRef.current = onFiles;
  });
  useEffect(() => mockupHandoff.subscribe((file) => void onFilesRef.current([file])), []);

  const done = uploads.filter((u) => u.state === "done" && u.path);
  const uploading = uploads.some((u) => u.state === "uploading");

  return (
    <div>
      {ticket ? <input type="hidden" name="uploadTicket" value={ticket} /> : null}
      {done.map((u) => (
        <input key={u.key} type="hidden" name="uploadedFiles" value={u.path!} />
      ))}

      <p id={hintId} className="text-fg-muted text-sm">
        {format(t.filesHint, { max: MAX_FILES })}
      </p>

      <label
        htmlFor={inputId}
        className="border-line-strong hover:border-accent hover:bg-accent-soft/40 focus-within:ring-accent mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed px-6 py-8 text-center transition-colors focus-within:ring-2"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-accent">
          <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-accent text-sm font-semibold">{t.filesButton}</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          aria-describedby={hintId}
          className="sr-only"
          onChange={(e) => void onFiles(e.target.files)}
        />
      </label>

      <div aria-live="polite">
        {messages.length > 0 ? (
          <ul className="text-danger mt-3 space-y-1 text-sm">
            {messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        ) : null}
        {uploading ? <p className="text-fg-muted mt-3 text-sm">{t.filesUploading}</p> : null}
      </div>

      {uploads.some((u) => u.state !== "error") ? (
        <ul className="mt-4 space-y-2">
          {uploads
            .filter((u) => u.state !== "error")
            .map((u) => (
              <li key={u.key} className="border-line bg-bg flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {u.state === "uploading" ? (
                    <span aria-hidden="true" className="border-accent size-4 shrink-0 animate-spin rounded-full border-2 border-t-transparent" />
                  ) : (
                    <span aria-hidden="true" className="text-success shrink-0">✓</span>
                  )}
                  <bdi className="truncate">{u.name}</bdi>
                  <span className="text-fg-subtle shrink-0 text-xs" dir="ltr">
                    {formatSize(u.size)}
                  </span>
                </span>
                {u.state === "done" ? (
                  <button
                    type="button"
                    onClick={() => setUploads((prev) => prev.filter((x) => x.key !== u.key))}
                    aria-label={format(t.filesRemove, { name: u.name })}
                    className="text-fg-muted hover:text-danger -m-1 rounded p-1"
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                ) : null}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
