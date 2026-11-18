/**
 * Cookie consent state (ADR-024). Pure browser module, no React.
 *
 * Categories: "essential" (always on, never stored as a choice) and "analytics" (Google Tag
 * Manager, off until the visitor accepts). The choice lives in a first-party cookie so it is
 * the same for every tab; it expires after CONSENT_MAX_AGE and the banner is shown again.
 * Bump CONSENT_VERSION when a new non-essential category or tool is added: older choices
 * are then ignored and the visitor is asked again.
 */
export const CONSENT_COOKIE = "mslab_consent";
export const CONSENT_VERSION = 1;
/** 6 months, as stated in the Cookie Policy. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;
export const OPEN_CONSENT_EVENT = "mslab:consent-open";

export type ConsentChoice = { analytics: boolean; date: string };

const listeners = new Set<() => void>();

function readRaw(): string {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${CONSENT_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1)) : "";
}

/** Raw cookie value ("" = no valid choice yet). A string keeps useSyncExternalStore snapshots stable. */
export function getConsentSnapshot(): string {
  const raw = readRaw();
  return parseConsent(raw) ? raw : "";
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** "1.0.2026-11-18" → { analytics: false, date }. Unknown versions are treated as no choice. */
export function parseConsent(raw: string): ConsentChoice | null {
  const [version, analytics, date] = raw.split(".");
  if (Number(version) !== CONSENT_VERSION || (analytics !== "0" && analytics !== "1") || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
    return null;
  }
  return { analytics: analytics === "1", date: date! };
}

export function saveConsent(analytics: boolean) {
  const date = new Date().toISOString().slice(0, 10);
  const value = encodeURIComponent(`${CONSENT_VERSION}.${analytics ? 1 : 0}.${date}`);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  listeners.forEach((listener) => listener());
}

/** Delete Google Analytics cookies on this host and its parent domains (consent withdrawn). */
export function clearAnalyticsCookies() {
  const names = document.cookie
    .split("; ")
    .map((part) => part.split("=")[0] ?? "")
    .filter((name) => /^(_ga|_gid|_gat|_gcl)/.test(name));
  const labels = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < labels.length - 1; i++) domains.push(`; Domain=.${labels.slice(i).join(".")}`);
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; Path=/; Max-Age=0${domain}`;
  }
}

let gtmLoaded = false;

type DataLayerWindow = Window & { dataLayer?: unknown[] };

/**
 * Inject Google Tag Manager — only ever called after analytics consent. Consent Mode defaults
 * are pushed first: analytics storage granted (the visitor accepted), advertising denied.
 */
export function loadGoogleTagManager(id: string) {
  if (gtmLoaded || !/^GTM-[A-Z0-9]+$/.test(id)) return;
  gtmLoaded = true;
  const w = window as DataLayerWindow;
  const dataLayer = (w.dataLayer = w.dataLayer ?? []);
  // gtag() must push the `arguments` object itself, not an array (Consent Mode requirement).
  // Declared parameters document the call shape; only `arguments` is pushed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function gtag(command: string, action: string, params: Record<string, string>) {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  }
  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  document.head.appendChild(script);
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
