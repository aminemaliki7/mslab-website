-- Removes rows created by tests/integration (dev project only). Items cascade.
delete from public.quotation_requests where email in ('buyer@example.com');
delete from public.inquiries where email in ('visitor@example.com');
delete from public.products where slug_fr = 'exemple-test-snapshot';
