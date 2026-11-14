-- Lets the Next.js server record the outcome of notification emails for a submission
-- (notified_at / notification_error) without granting the public role UPDATE on customer tables.
-- Guarded by the same server-held submission key as the submit_* functions.

create or replace function public.record_submission_notification(
  kind text,
  reference text,
  error_message text,
  submission_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_submission_key(submission_key);

  if kind = 'contact' then
    update public.inquiries
       set notified_at = case when error_message is null then now() else null end,
           notification_error = left(error_message, 1000)
     where inquiries.reference = record_submission_notification.reference;
  elsif kind = 'quote' then
    update public.quotation_requests
       set notified_at = case when error_message is null then now() else null end,
           notification_error = left(error_message, 1000)
     where quotation_requests.reference = record_submission_notification.reference;
  else
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.record_submission_notification(text, text, text, text) from public;
grant execute on function public.record_submission_notification(text, text, text, text) to anon, authenticated;
