import { ButtonLink } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { Container, Heading, Section } from "@/components/ui/layout";
import type { Dictionary } from "@/i18n/dictionaries";
import { Print3dVideo } from "./print-3d-video";

export const PRINT_3D_ID = "impression-3d";

/** Timelapse filmed by the printer's camera (owner-supplied, 2026-11-22), edited for the web. */
const VIDEO = {
  sources: [
    { src: "/media/3d-printing/print-timelapse.webm", type: "video/webm" as const },
    { src: "/media/3d-printing/print-timelapse.mp4", type: "video/mp4" as const },
  ],
  poster: "/media/3d-printing/print-timelapse-poster.jpg",
};

/**
 * 3D printing (owner, 2026-11-25: "we have also machines for 3D printing"). Text on the
 * inline-start side, the printer's own timelapse on the other. Carries the fourth process ink
 * (K) after the three division cards (C, M, Y). Facts only: no materials, sizes, lead times or
 * prices are stated; like everything MSLAB makes, it is quoted.
 */
export function Print3dSection({ dict, quoteHref }: { dict: Dictionary; quoteHref: string }) {
  const t = dict.cx.print3d;
  return (
    <Section id={PRINT_3D_ID} aria-labelledby={`${PRINT_3D_ID}-heading`} className="scroll-mt-20">
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="reveal lg:col-span-5">
          <p className="text-fg-subtle flex items-center gap-3 text-xs font-semibold tracking-[0.14em] uppercase rtl:tracking-normal">
            <span aria-hidden="true" className="h-[3px] w-6 rounded-[1px]" style={{ backgroundColor: "var(--color-process-k)" }} />
            {t.eyebrow}
          </p>
          <Heading as="h2" size="xl" id={`${PRINT_3D_ID}-heading`} className="type-display mt-4">
            {t.title}
          </Heading>
          <p className="text-fg-muted mt-4 text-base leading-relaxed text-pretty">{t.body}</p>
          <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {t.uses.map((use) => (
              <li key={use} className="text-fg flex items-start gap-2.5 text-sm">
                <CheckIcon width={15} height={15} strokeWidth={2.25} className="text-accent mt-[0.2rem] shrink-0" aria-hidden="true" />
                {use}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <ButtonLink href={quoteHref} size="lg">
              {t.cta}
            </ButtonLink>
            <p className="text-fg-muted text-sm">{t.note}</p>
          </div>
        </div>

        <div className="reveal lg:col-span-7">
          <div className="bg-charcoal relative aspect-video overflow-hidden rounded-[var(--radius-tile)] shadow-[0_30px_60px_-36px_rgb(14_26_43/0.6)]">
            <Print3dVideo
              sources={VIDEO.sources}
              poster={VIDEO.poster}
              label={t.videoLabel}
              labels={{ pause: t.pauseVideo, play: t.playVideo }}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
