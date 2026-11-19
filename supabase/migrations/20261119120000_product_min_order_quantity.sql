-- Minimum order quantity per product (docs/POSITIONING.md §2).
-- MSLAB produces in quantity only. The MOQ is optional and entered by MSLAB in /admin/products;
-- when null, the site says the minimum is confirmed in the quote (never an invented value).
-- Additive and nullable: existing rows, RLS policies and RPCs are unaffected. The public
-- quote action rejects quantities below a product's MOQ (src/features/inquiries/actions.ts).

alter table public.products
  add column if not exists min_order_quantity integer
    constraint products_min_order_quantity_check
    check (min_order_quantity is null or min_order_quantity between 1 and 1000000);

comment on column public.products.min_order_quantity is
  'Minimum order quantity (units). Null = not defined; confirmed in the quote.';
