import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { InquiryStatusForm } from "@/components/admin/inbox-forms";
import { AdminPageHeader, Dl, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDateTime } from "@/features/admin/dictionary";
import { updateInquiry } from "@/features/admin/inbox-actions";
import { inquiryStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { format } from "@/i18n/format";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.inquiries.pageTitle);

export default async function InquiryDetailPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const ti = t.inquiries;
  const q = t.quotations;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: inquiry } = await (await createSessionClient()).from("inquiries").select("*").eq("id", id).maybeSingle();
  if (!inquiry) notFound();
  const notification = inquiry.notified_at
    ? format(q.sentOn, { date: formatAdminDateTime(inquiry.notified_at, lang) })
    : inquiry.notification_error === "email_disabled"
      ? q.emailDisabled
      : (inquiry.notification_error ?? q.pending);

  return (
    <>
      <AdminPageHeader
        title={inquiry.subject}
        description={format(ti.received, { ref: inquiry.reference, date: formatAdminDateTime(inquiry.created_at, lang) })}
        back={{ href: "/admin/inquiries", label: ti.title }}
        actions={<StatusBadge status={inquiryStatuses(t)[inquiry.status]} />}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title={ti.message}>
            <p className="leading-relaxed whitespace-pre-line" dir="auto">
              {inquiry.message}
            </p>
          </Panel>
          <Panel title={ti.sender}>
            <Dl
              items={[
                { label: q.name, value: inquiry.full_name },
                {
                  label: q.email,
                  value: (
                    <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${inquiry.subject}`)}`} className="text-accent break-all">
                      {inquiry.email}
                    </a>
                  ),
                },
                { label: q.phone, value: inquiry.phone ? <a href={`tel:${inquiry.phone}`} className="text-accent" dir="ltr">{inquiry.phone}</a> : "—" },
                { label: q.language, value: t.locales[inquiry.locale as "fr" | "ar" | "en"] ?? inquiry.locale },
              ]}
            />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title={q.followUp}>
            {!inquiry.read_at ? (
              <div className="mb-5">
                <ActionButton action={updateInquiry} label={ti.markRead} variant="primary" hidden={{ id: inquiry.id, status: "read" }} />
              </div>
            ) : (
              <p className="text-fg-muted mb-5 text-sm">{format(ti.readOn, { date: formatAdminDateTime(inquiry.read_at, lang) })}</p>
            )}
            <InquiryStatusForm id={inquiry.id} status={inquiry.status} />
          </Panel>
          <Panel title={q.technical}>
            <Dl
              items={[
                { label: q.sourcePage, value: <span dir="ltr">{inquiry.source_path ?? "—"}</span> },
                { label: q.notification, value: notification },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
