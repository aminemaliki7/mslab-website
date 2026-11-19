"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "@/i18n/format";
import { quoteList, useQuoteRows } from "./quote-list-store";

type Props = {
  product: { productId: string; name: string; sku: string | null; minOrderQuantity: number | null };
  quoteHref: string;
  labels: { add: string; added: string; view: string };
};

/** Adds the product to the visitor's quote list; once added, links to the quote page. */
export function AddToQuoteButton({ product, quoteHref, labels }: Props) {
  const rows = useQuoteRows();
  const added = rows.some((row) => row.productId === product.productId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="lg" className="w-full sm:w-auto" disabled={added} onClick={() => quoteList.addProduct(product)} aria-live="polite">
        {added ? labels.added : labels.add}
      </Button>
      {rows.length > 0 ? (
        <Link href={quoteHref} className="text-accent hover:text-accent-hover inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline">
          {format(labels.view, { count: rows.length })}
        </Link>
      ) : null}
    </div>
  );
}
