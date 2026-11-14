import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/admin-form";
import { InquiryStatusForm } from "@/components/admin/inbox-forms";
import { AdminPageHeader, Dl, Panel, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { updateInquiry } from "@/features/admin/inbox-actions";
import { formatDateTime, inquiryStatus, localeLabel } from "@/features/admin/labels";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Message" };

export default async function InquiryDetailPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: inquiry } = await (await createSessionClient()).from("inquiries").select("*").eq("id", id).maybeSingle();
  if (!inquiry) notFound();

  return (
    <>
      <AdminPageHeader
        title={inquiry.subject}
        description={`${inquiry.reference} · reçu le ${formatDateTime(inquiry.created_at)}`}
        back={{ href: "/admin/inquiries", label: "Messages" }}
        actions={<StatusBadge status={inquiryStatus[inquiry.status]} />}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Message">
            <p className="text-sm leading-relaxed whitespace-pre-line" dir="auto">
              {inquiry.message}
            </p>
          </Panel>
          <Panel title="Expéditeur">
            <Dl
              items={[
                { label: "Nom", value: inquiry.full_name },
                { label: "E-mail", value: <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${inquiry.subject}`)}`} className="text-accent">{inquiry.email}</a> },
                { label: "Téléphone", value: inquiry.phone ? <a href={`tel:${inquiry.phone}`} className="text-accent" dir="ltr">{inquiry.phone}</a> : "—" },
                { label: "Langue", value: localeLabel[inquiry.locale] ?? inquiry.locale },
              ]}
            />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Suivi">
            {!inquiry.read_at ? (
              <div className="mb-5">
                <ActionButton action={updateInquiry} label="Marquer comme lu" variant="primary" hidden={{ id: inquiry.id, status: "read" }} />
              </div>
            ) : (
              <p className="text-fg-muted mb-5 text-sm">Lu le {formatDateTime(inquiry.read_at)}</p>
            )}
            <InquiryStatusForm id={inquiry.id} status={inquiry.status} />
          </Panel>
          <Panel title="Informations techniques">
            <Dl
              items={[
                { label: "Page d'origine", value: inquiry.source_path ?? "—" },
                {
                  label: "Notification",
                  value: inquiry.notified_at
                    ? `Envoyée le ${formatDateTime(inquiry.notified_at)}`
                    : inquiry.notification_error === "email_disabled"
                      ? "Envoi d'e-mails désactivé"
                      : (inquiry.notification_error ?? "En attente"),
                },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
