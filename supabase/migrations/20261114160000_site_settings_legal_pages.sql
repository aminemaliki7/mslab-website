-- Legal notice and privacy policy texts (Loi 09-08), written/validated by MSLAB and entered in
-- /admin/settings. Empty = the public page shows a "being prepared" notice and is not indexed.
alter table public.site_settings
  add column legal_notice_fr text check (char_length(legal_notice_fr) <= 20000),
  add column legal_notice_ar text check (char_length(legal_notice_ar) <= 20000),
  add column legal_notice_en text check (char_length(legal_notice_en) <= 20000),
  add column privacy_policy_fr text check (char_length(privacy_policy_fr) <= 20000),
  add column privacy_policy_ar text check (char_length(privacy_policy_ar) <= 20000),
  add column privacy_policy_en text check (char_length(privacy_policy_en) <= 20000);
