-- Removes the development sample data inserted by sample_catalog.sql.
-- Quotation items referencing sample products keep their name/SKU snapshots (product_id → null).
delete from public.products where slug_fr like 'exemple-%';
delete from public.categories where slug_fr like 'exemple-%';
delete from public.services where slug_fr like 'exemple-%';
