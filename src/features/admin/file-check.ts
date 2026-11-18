import "server-only";
import { SNIFF_BYTES, sniffFile, type SniffedFile } from "@/features/print-on-demand/file-sniff";

/**
 * Authoritative check of customer uploads (the browser's declared type is not trusted):
 * fetch only the first 64 KB of each private object through its short-lived signed URL and
 * identify the real format and pixel size. Failures return null (shown as "unrecognised").
 */
export async function checkUploads(files: Array<{ path: string; url: string | null }>): Promise<Map<string, SniffedFile | null>> {
  const results = await Promise.all(
    files.map(async ({ path, url }) => {
      if (!url) return [path, null] as const;
      try {
        const response = await fetch(url, { headers: { Range: `bytes=0-${SNIFF_BYTES - 1}` }, cache: "no-store", signal: AbortSignal.timeout(6000) });
        if (!response.ok) return [path, null] as const;
        const bytes = new Uint8Array(await response.arrayBuffer()).subarray(0, SNIFF_BYTES);
        return [path, sniffFile(bytes)] as const;
      } catch {
        return [path, null] as const;
      }
    }),
  );
  return new Map(results);
}
