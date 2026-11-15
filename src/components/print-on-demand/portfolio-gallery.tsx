import Image from "next/image";
import type { PortfolioItem } from "@/features/print-on-demand/queries";

/** Gallery of products MSLAB has made (managed in /admin/print-on-demand). Real photos only. */
export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="reveal">
          <figure className="group border-line bg-bg h-full overflow-hidden rounded-[var(--radius-card)] border">
            <div className="bg-surface relative aspect-[4/3] overflow-hidden">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : null}
            </div>
            <figcaption className="p-3 sm:p-4">
              <p className="text-fg text-sm font-semibold leading-snug sm:text-base">{item.title}</p>
              {item.caption ? <p className="text-fg-muted mt-1 text-xs leading-relaxed sm:text-sm">{item.caption}</p> : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
