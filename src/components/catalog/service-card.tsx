import Image from "next/image";
import Link from "next/link";
import { SERVICE_ART, ServiceArt } from "@/components/illustrations/service-art";
import { ArrowIcon } from "@/components/ui/icons";
import type { ServiceSummary } from "@/features/services/queries";

/** Whole card is one link (single tab stop); the heading carries the accessible name. */
export function ServiceCard({ service, href, cta }: { service: ServiceSummary; href: string; cta: string }) {
  return (
    <Link
      href={href}
      className="group border-line bg-bg hover:border-line-strong flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-18px_rgb(14_26_43/0.45)]"
    >
      {service.imageUrl ? (
        <div className="bg-surface relative aspect-[16/9]">
          <Image src={service.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : SERVICE_ART[service.slugs.fr] ? (
        // Core services: the picture explains the service before the text is read.
        <div className="bg-surface border-line border-b px-8 pt-6 pb-4">
          <div className="mx-auto max-w-[15rem] transition-transform duration-300 group-hover:-translate-y-1">
            <ServiceArt slugFr={service.slugs.fr} className="w-full" />
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="bg-accent h-1 w-full" />
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-fg text-lg font-semibold leading-snug">{service.name}</h3>
        {service.summary ? <p className="text-fg-muted mt-2 text-[0.9375rem] leading-relaxed">{service.summary}</p> : null}
        <span className="text-accent mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium">
          {cta}
          <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
