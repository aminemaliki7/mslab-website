"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  OPEN_CONSENT_EVENT,
  clearAnalyticsCookies,
  getConsentSnapshot,
  loadGoogleTagManager,
  parseConsent,
  saveConsent,
  subscribeConsent,
} from "./consent-store";

type Props = {
  t: Dictionary["consent"];
  cookiePolicyHref: string;
  /** Google Tag Manager container; null outside the production deployment. */
  gtmId: string | null;
};

const SERVER_SNAPSHOT = "ssr";

/**
 * Cookie banner + preferences dialog. Nothing non-essential runs before an explicit choice:
 * Google Tag Manager is injected only once analytics consent is stored. Withdrawing consent
 * deletes Google Analytics cookies and reloads the page so the already-loaded tags stop.
 */
export function ConsentManager({ t, cookiePolicyHref, gtmId }: Props) {
  const raw = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => SERVER_SNAPSHOT);
  const choice = raw === SERVER_SNAPSHOT ? null : parseConsent(raw);
  const undecided = raw === "";
  const analyticsGranted = choice?.analytics === true;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [analyticsDraft, setAnalyticsDraft] = useState(false);
  const titleId = useId();
  const dialogTitleId = useId();
  const analyticsId = useId();

  useEffect(() => {
    if (analyticsGranted && gtmId) loadGoogleTagManager(gtmId);
  }, [analyticsGranted, gtmId]);

  useEffect(() => {
    const open = () => {
      setAnalyticsDraft(parseConsent(getConsentSnapshot())?.analytics ?? false);
      dialogRef.current?.showModal();
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  function decide(analytics: boolean) {
    const wasGranted = parseConsent(getConsentSnapshot())?.analytics === true;
    saveConsent(analytics);
    dialogRef.current?.close();
    if (wasGranted && !analytics) {
      clearAnalyticsCookies();
      window.location.reload();
    }
  }

  function customize() {
    setAnalyticsDraft(false);
    dialogRef.current?.showModal();
  }

  return (
    <>
      {undecided ? (
        <section
          aria-labelledby={titleId}
          className="fixed inset-x-0 bottom-0 z-50 px-[max(1rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="bg-bg border-line mx-auto max-w-3xl rounded-[var(--radius-card)] border p-5 shadow-[0_12px_40px_-12px_rgb(14_26_43/0.35)] sm:p-6">
            <p id={titleId} className="text-fg font-semibold">
              {t.bannerTitle}
            </p>
            <p className="text-fg-muted mt-2 text-sm leading-relaxed">
              {t.bannerBody}{" "}
              <Link href={cookiePolicyHref} className="text-accent underline underline-offset-2">
                {t.policyLink}
              </Link>
            </p>
            {/* Accept and reject carry the same visual weight on purpose. */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button type="button" onClick={() => decide(false)} className={buttonClasses("secondary", "md", "sm:min-w-36")}>
                {t.reject}
              </button>
              <button type="button" onClick={() => decide(true)} className={buttonClasses("secondary", "md", "sm:min-w-36")}>
                {t.accept}
              </button>
              <button type="button" onClick={customize} className={buttonClasses("ghost", "md", "sm:ms-auto")}>
                {t.customize}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        className="bg-bg text-fg m-auto w-[min(36rem,calc(100%-2rem))] rounded-[var(--radius-card)] p-0 shadow-xl backdrop:bg-[rgb(14_26_43/0.55)]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={dialogTitleId} className="text-fg text-lg font-semibold">
              {t.dialogTitle}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t.close}
              className="text-fg-muted hover:text-fg -m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)]"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="text-fg-muted mt-2 text-sm leading-relaxed">{t.dialogIntro}</p>

          <ul className="mt-5 space-y-3">
            <li className="border-line rounded-[var(--radius-control)] border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-fg font-medium">{t.essentialTitle}</p>
                <span className="bg-surface-strong text-fg rounded-full px-2.5 py-0.5 text-xs font-medium">{t.alwaysOn}</span>
              </div>
              <p className="text-fg-muted mt-1.5 text-sm">{t.essentialBody}</p>
            </li>
            <li className="border-line rounded-[var(--radius-control)] border p-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={analyticsId} className="text-fg font-medium">
                  {t.analyticsTitle}
                </label>
                <input
                  id={analyticsId}
                  type="checkbox"
                  role="switch"
                  checked={analyticsDraft}
                  onChange={(event) => setAnalyticsDraft(event.target.checked)}
                  aria-describedby={`${analyticsId}-desc`}
                  className="accent-accent size-6 shrink-0 cursor-pointer"
                />
              </div>
              <p id={`${analyticsId}-desc`} className="text-fg-muted mt-1.5 text-sm">
                {t.analyticsBody}
              </p>
            </li>
          </ul>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => decide(false)} className={buttonClasses("secondary", "md")}>
              {t.reject}
            </button>
            <button type="button" onClick={() => decide(true)} className={buttonClasses("secondary", "md")}>
              {t.accept}
            </button>
            <button type="button" onClick={() => decide(analyticsDraft)} className={buttonClasses("primary", "md", "sm:ms-auto")}>
              {t.save}
            </button>
          </div>
          <p className="mt-4 text-sm">
            <Link href={cookiePolicyHref} className="text-accent underline underline-offset-2" onClick={() => dialogRef.current?.close()}>
              {t.policyLink}
            </Link>
          </p>
        </div>
      </dialog>
    </>
  );
}
