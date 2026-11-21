import Link from "next/link";
import { notFound } from "next/navigation";
import { QuotationUpdateForm } from "@/components/admin/inbox-forms";
import { AdminPageHeader, Dl, Panel, StatusBadge, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { formatAdminDate, formatAdminDateTime, formatAdminNumber } from "@/features/admin/dictionary";
import { quotationStatuses } from "@/features/admin/labels";
import { adminTitle, getAdminT } from "@/features/admin/lang";
import { format } from "@/i18n/format";
import { StudioDesignPanel, readStoredDesign } from "@/components/admin/studio-design-panel";
import type { AdminDict } from "@/features/admin/dictionary";
import { checkUploads } from "@/features/admin/file-check";
import { sameFormat, type SniffedFile } from "@/features/print-on-demand/file-sniff";
import { createSessionClient } from "@/lib/supabase/server";

export const generateMetadata = adminTitle((t) => t.quotations.pageTitle);

export default async function QuotationDetailPage({ params }: PageProps<"/admin/quotations/[id]">) {
  await requireAdmin();
  const { lang, t } = await getAdminT();
  const q = t.quotations;
  const statuses = quotationStatuses(t);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createSessionClient();
  const [{ data: request }, { data: items }, { data: details }, { data: files }, { data: events }, { data: digital }] = await Promise.all([
    db.from("quotation_requests").select("*").eq("id", id).maybeSingle(),
    db.from("quotation_items").select("*").eq("quotation_request_id", id).order("sort_order"),
    db.from("custom_request_details").select("*").eq("quotation_request_id", id).maybeSingle(),
    db.from("quotation_files").select("*").eq("quotation_request_id", id).order("storage_path"),
    db.from("quotation_status_events").select("status, created_at").eq("quotation_request_id", id).order("created_at", { ascending: false }),
    db.from("digital_request_details").select("*").eq("quotation_request_id", id).maybeSingle(),
  ]);
  if (!request) notFound();

  // Customer files are private: short-lived download links, generated per page view.
  const signed = files?.length
    ? (await db.storage.from("custom-uploads").createSignedUrls(files.map((f) => f.storage_path), 60 * 10, { download: true })).data ?? []
    : [];
  // Same objects without forced download: used server-side to check the real content (first
  // 64 KB) and to show verified PNG mockups inline. Never used to render other formats inline.
  const viewable = files?.length
    ? (await db.storage.from("custom-uploads").createSignedUrls(files.map((f) => f.storage_path), 60 * 10)).data ?? []
    : [];
  const viewUrl = (path: string) => viewable.find((s) => s.path === path)?.signedUrl ?? null;
  const checks = await checkUploads((files ?? []).map((f) => ({ path: f.storage_path, url: viewUrl(f.storage_path) })));
  const fileLinks = (files ?? []).map((file) => ({
    ...file,
    role: (file.role === "mockup" ? "mockup" : "artwork") as "mockup" | "artwork",
    url: signed.find((s) => s.path === file.storage_path)?.signedUrl ?? null,
    check: checks.get(file.storage_path) ?? null,
  }));
  const design = readStoredDesign(details?.design);
  const mockups = fileLinks
    .filter((f) => f.role === "mockup" && f.check?.mime === "image/png")
    .flatMap((f) => {
      const url = viewUrl(f.storage_path);
      return url ? [{ name: f.original_name, url }] : [];
    });
  const dims = details ? [details.width, details.height, details.depth].filter((v) => v !== null) : [];
  const whatsappDigits = request.phone.replace(/\D/g, "");
  const notification = request.notified_at
    ? format(q.sentOn, { date: formatAdminDateTime(request.notified_at, lang) })
    : request.notification_error === "email_disabled"
      ? q.emailDisabled
      : (request.notification_error ?? q.pending);

  return (
    <>
      <AdminPageHeader
        title={format(request.kind === "custom" ? q.titleCustom : request.kind === "digital" ? q.titleDigital : q.titleQuote, { ref: request.reference })}
        description={format(q.received, { date: formatAdminDateTime(request.created_at, lang) })}
        back={{ href: "/admin/quotations", label: q.title }}
        actions={<StatusBadge status={statuses[request.status]} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Follow-up first on phones: it is what the admin acts on. */}
        <div className="space-y-6 xl:order-2">
          <Panel title={q.followUp}>
            <QuotationUpdateForm id={request.id} status={request.status} notes={request.internal_notes} />
          </Panel>
          <Panel title={q.customer}>
            <Dl
              items={[
                { label: q.name, value: request.full_name },
                { label: q.company, value: request.company_name ?? "—" },
                { label: q.email, value: <a href={`mailto:${request.email}`} className="text-accent break-all">{request.email}</a> },
                {
                  label: q.phone,
                  value: (
                    <span className="flex flex-wrap gap-x-4 gap-y-1">
                      <a href={`tel:${request.phone}`} className="text-accent" dir="ltr">
                        {request.phone}
                      </a>
                      <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="text-accent">
                        WhatsApp ↗
                      </a>
                    </span>
                  ),
                },
                { label: q.preferred, value: t.contactMethod[request.preferred_contact] },
                { label: q.language, value: t.locales[request.locale as "fr" | "ar" | "en"] ?? request.locale },
              ]}
            />
          </Panel>
          {events && events.length > 0 ? (
            <Panel title={q.statusHistory}>
              <ol className="space-y-2 text-sm">
                {events.map((event, index) => (
                  <li key={index} className="flex items-center justify-between gap-3">
                    <StatusBadge status={statuses[event.status]} />
                    <span className="text-fg-muted text-xs">{formatAdminDateTime(event.created_at, lang)}</span>
                  </li>
                ))}
              </ol>
              <p className="text-fg-muted mt-3 text-xs">{q.historyNote}</p>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6 xl:order-1">
          {digital ? (
            <Panel title={q.digitalProject}>
              <Dl
                items={[
                  {
                    label: q.digitalTypes,
                    value: digital.project_types.map((key) => q.digitalTypeLabels[key as keyof typeof q.digitalTypeLabels] ?? key).join(", "),
                  },
                  {
                    label: q.digitalFeatures,
                    value: digital.features.length
                      ? digital.features.map((key) => q.digitalFeatureLabels[key as keyof typeof q.digitalFeatureLabels] ?? key).join(", ")
                      : "—",
                  },
                  {
                    label: q.existingWebsite,
                    value: digital.existing_website ? (
                      <a href={digital.existing_website} target="_blank" rel="noopener noreferrer nofollow" className="text-accent break-all" dir="ltr">
                        {digital.existing_website}
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  { label: q.budget, value: digital.budget ? <bdi>{digital.budget}</bdi> : "—" },
                  { label: q.launchDate, value: digital.deadline ? formatAdminDate(`${digital.deadline}T00:00:00`, lang) : "—" },
                ]}
              />
              <h3 className="text-fg mt-6 text-sm font-semibold">{q.descriptionTitle}</h3>
              <p dir="auto" className="mt-2 text-sm whitespace-pre-line">{digital.description}</p>
            </Panel>
          ) : null}

          {details ? (
            <Panel title={q.project}>
              <Dl
                items={[
                  { label: q.projectType, value: details.project_type },
                  { label: q.quantity, value: formatAdminNumber(details.quantity, lang) },
                  { label: q.dimensions, value: dims.length ? <span dir="ltr">{`${dims.join(" × ")} ${details.dimension_unit}`}</span> : "—" },
                  { label: q.material, value: details.material ?? q.materialAdvice },
                  { label: q.finishings, value: details.finishings.length ? details.finishings.join(", ") : "—" },
                  { label: q.deadline, value: details.deadline ? formatAdminDate(`${details.deadline}T00:00:00`, lang) : "—" },
                ]}
              />
              <h3 className="text-fg mt-6 text-sm font-semibold">{q.descriptionTitle}</h3>
              <p dir="auto" className="mt-2 text-sm whitespace-pre-line">{details.description}</p>
            </Panel>
          ) : null}

          {design ? <StudioDesignPanel design={design} mockups={mockups} t={t} /> : null}

          {details ? (
            <Panel title={format(q.files, { count: fileLinks.length })}>
              {fileLinks.length > 0 ? (
                <ul className="divide-line divide-y text-sm">
                  {fileLinks.map((file) => (
                    <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <bdi className="block truncate font-medium">{file.original_name}</bdi>
                        <span className="text-fg-muted text-xs" dir="ltr">
                          {file.role === "mockup" ? `${q.studio.mockup} · ` : ""}
                          {file.mime_type ?? q.unknownType}
                          {file.size_bytes ? ` · ${format(q.megabytes, { size: (file.size_bytes / (1024 * 1024)).toFixed(1) })}` : ""}
                          {file.check?.width && file.check.height ? ` · ${format(q.studio.pixels, { w: file.check.width, h: file.check.height })}` : ""}
                        </span>
                        <FileCheck check={file.check} declared={file.mime_type} t={q.studio} />
                      </span>
                      {file.url ? (
                        <a href={file.url} className="text-accent inline-flex min-h-11 shrink-0 items-center font-medium" rel="noopener noreferrer">
                          {q.download}
                        </a>
                      ) : (
                        <span className="text-fg-subtle text-xs">{q.linkUnavailable}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-fg-muted text-sm">{q.noFiles}</p>
              )}
              <p className="text-fg-muted mt-3 text-xs">{q.filesNote}</p>
            </Panel>
          ) : null}

          {/* Web projects have no articles: their details are in the panel above. */}
          {request.kind !== "digital" ? (
          <Panel title={format(q.items, { count: items?.length ?? 0 })}>
            <Table head={[q.colArticle, q.quantity, q.colSpecs]}>
              {(items ?? []).map((item) => (
                <tr key={item.id}>
                  <Td>
                    {item.product_id ? (
                      <Link href={`/admin/products/${item.product_id}`} className="hover:text-accent font-semibold">
                        {item.product_name_snapshot}
                      </Link>
                    ) : (
                      <span className="font-semibold">{item.product_name_snapshot}</span>
                    )}
                    <p className="text-fg-muted text-xs">
                      {item.product_sku_snapshot ? format(q.skuRef, { sku: item.product_sku_snapshot }) : null}
                      {!item.product_id ? (item.product_sku_snapshot ? ` · ${q.removedProduct}` : q.customNeed) : null}
                    </p>
                  </Td>
                  <Td label={q.quantity} className="font-semibold tabular-nums">
                    {formatAdminNumber(item.quantity, lang)}
                  </Td>
                  <Td label={q.colSpecs} className="text-fg-muted whitespace-pre-line">
                    {item.specifications ?? "—"}
                  </Td>
                </tr>
              ))}
            </Table>
            <p className="text-fg-muted mt-3 text-xs">{q.itemsNote}</p>
          </Panel>
          ) : null}

          {request.message ? (
            <Panel title={q.customerMessage}>
              <p dir="auto" className="text-sm whitespace-pre-line">{request.message}</p>
            </Panel>
          ) : null}

          <Panel title={q.technical}>
            <Dl
              items={[
                { label: q.statusChanged, value: formatAdminDateTime(request.status_changed_at, lang) },
                { label: q.sourcePage, value: <span dir="ltr">{request.source_path ?? "—"}</span> },
                { label: q.notification, value: notification },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}

/** Real content of an upload compared with the type the browser declared. */
function FileCheck({ check, declared, t }: { check: SniffedFile | null; declared: string | null; t: AdminDict["quotations"]["studio"] }) {
  if (!check?.mime) return <span className="text-danger block text-xs">{t.unrecognized}</span>;
  if (declared && !sameFormat(declared, check.mime)) return <span className="text-danger block text-xs">{format(t.mismatch, { type: check.mime })}</span>;
  return <span className="text-success block text-xs">{format(t.verified, { type: check.mime })}</span>;
}
