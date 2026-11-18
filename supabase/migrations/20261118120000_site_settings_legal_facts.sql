-- Values used by the legal documents (ADR-024): RC, ICE, CNDP reference, retention periods,
-- payment / delivery / returns terms… entered by MSLAB in /admin/settings → "Informations légales".
-- Shape: { "<key>": { "all"?: text, "fr"?: text, "ar"?: text, "en"?: text } }.
-- Public read like every other site setting (RLS policies of site_settings apply); writes are
-- admin-only through the existing "site_settings: admin updates" policy.
-- A key that is missing or empty is HIDDEN on the public legal pages (never a placeholder).
alter table public.site_settings
  add column legal_facts jsonb not null default '{}'::jsonb
    constraint site_settings_legal_facts_is_object check (jsonb_typeof(legal_facts) = 'object')
    constraint site_settings_legal_facts_size check (pg_column_size(legal_facts) <= 65536);

comment on column public.site_settings.legal_facts is
  'Legal document values (ADR-024): {"<key>": {"all"|"fr"|"ar"|"en": text}}. Empty key = hidden on the site.';
