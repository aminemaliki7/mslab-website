import { addDays, isIsoDate } from "./dates.ts";

/** Overview / report periods in Morocco days. Pure module. */
export type PeriodKey = "today" | "yesterday" | "7d" | "30d" | "custom";
export type Period = { key: PeriodKey; from: string; to: string };

/** ?period=…&from=…&to=… → dates (invalid or future custom ranges fall back to today). */
export function resolvePeriod(params: Record<string, string | string[] | undefined>, today: string): Period {
  const key = params.period;
  if (key === "yesterday") return { key, from: addDays(today, -1), to: addDays(today, -1) };
  if (key === "7d") return { key, from: addDays(today, -6), to: today };
  if (key === "30d") return { key, from: addDays(today, -29), to: today };
  if (key === "custom" && isIsoDate(params.from) && isIsoDate(params.to) && params.from <= params.to && params.to <= today && params.from >= addDays(today, -400)) {
    return { key, from: params.from, to: params.to };
  }
  return { key: "today", from: today, to: today };
}
