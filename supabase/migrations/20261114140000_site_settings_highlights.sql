-- "Why choose MSLAB" points (homepage) — one verified point per line, entered by MSLAB in
-- /admin/settings. Empty = section hidden. Never pre-filled with invented claims.
alter table public.site_settings
  add column highlights_fr text check (char_length(highlights_fr) <= 2000),
  add column highlights_ar text check (char_length(highlights_ar) <= 2000),
  add column highlights_en text check (char_length(highlights_en) <= 2000);
