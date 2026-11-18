import Link from "next/link";
import type { ReactNode } from "react";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import type { ResolvedValues } from "@/content/legal/resolve";
import type { Locale } from "@/i18n/config";
import { isStaticSection, localizedPath } from "@/i18n/routes";

export type InlineContext = {
  locale: Locale;
  /** Configured values keyed by token ("ph:rc", "fact:email"); see content/legal/resolve.ts. */
  values: ResolvedValues;
};

const TOKEN = /(\{(?:ph|fact):[A-Za-z]+\}|\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g;

const linkClass = "text-accent hover:text-accent-hover underline underline-offset-2";

function renderLink(label: string, target: string, ctx: InlineContext, key: number): ReactNode {
  if (target === "consent:open") {
    return (
      <CookieSettingsButton key={key} className={`${linkClass} cursor-pointer font-medium`}>
        {label}
      </CookieSettingsButton>
    );
  }
  if (target.startsWith("route:")) {
    const [route, anchor] = target.slice("route:".length).split("#");
    if (!route || !isStaticSection(route)) throw new Error(`[legal] unknown route link: ${target}`);
    const href = `${localizedPath(ctx.locale, { route })}${anchor ? `#${anchor}` : ""}`;
    return (
      <Link key={key} href={href} className={linkClass}>
        {label}
      </Link>
    );
  }
  if (/^https:\/\//.test(target)) {
    return (
      <a key={key} href={target} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <bdi>{label}</bdi>
      </a>
    );
  }
  throw new Error(`[legal] unsupported link target: ${target}`);
}

/**
 * Renders one content string AFTER resolveText() has removed unconfigured values. Values typed
 * in the admin are inserted as plain text (never parsed as markup), isolated with <bdi> so a
 * Latin identifier reads correctly inside Arabic text.
 */
export function LegalInline({ text, ctx }: { text: string; ctx: InlineContext }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        const token = /^\{((?:ph|fact):[A-Za-z]+)\}$/.exec(part)?.[1];
        if (token) {
          const value = ctx.values[token];
          return value ? <bdi key={i}>{value}</bdi> : null;
        }
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) return renderLink(link[1]!, link[2]!, ctx, i);
        const strong = /^\*\*([^*]+)\*\*$/.exec(part);
        if (strong) {
          return (
            <strong key={i} className="text-fg font-semibold">
              {strong[1]}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}
