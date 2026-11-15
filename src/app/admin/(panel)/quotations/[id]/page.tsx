import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuotationUpdateForm } from "@/components/admin/inbox-forms";
import { AdminPageHeader, Dl, Panel, StatusBadge, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/features/admin/auth";
import { contactMethod, formatDateTime, localeLabel, quotationStatus } from "@/features/admin/labels";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Demande de devis" };

export default async function QuotationDetailPage({ params }: PageProps<"/admin/quotations/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createSessionClient();
  const [{ data: request }, { data: items }, { data: details }, { data: files }, { data: events }] = await Promise.all([
    db.from("quotation_requests").select("*").eq("id", id).maybeSingle(),
    db.from("quotation_items").select("*").eq("quotation_request_id", id).order("sort_order"),
    db.from("custom_request_details").select("*").eq("quotation_request_id", id).maybeSingle(),
    db.from("quotation_files").select("*").eq("quotation_request_id", id).order("storage_path"),
    db.from("quotation_status_events").select("status, created_at").eq("quotation_request_id", id).order("created_at", { ascending: false }),
  ]);
  if (!request) notFound();

  // Customer files are private: short-lived download links, generated per page view.
  const signed = files?.length
    ? (await db.storage.from("custom-uploads").createSignedUrls(files.map((f) => f.storage_path), 60 * 10, { download: true })).data ?? []
    : [];
  const fileLinks = (files ?? []).map((file) => ({ ...file, url: signed.find((s) => s.path === file.storage_path)?.signedUrl ?? null }));
  const dims = details ? [details.width, details.height, details.depth].filter((v) => v !== null) : [];
  const whatsappDigits = request.phone.replace(/\D/g, "");

  return (
    <>
      <AdminPageHeader
        title={`${request.kind === "custom" ? "Impression à la demande" : "Devis"} ${request.reference}`}
        description={`Reçue le ${formatDateTime(request.created_at)}`}
        back={{ href: "/admin/quotations", label: "Demandes de devis" }}
        actions={<StatusBadge status={quotationStatus[request.status]} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {details ? (
            <Panel title="Impression à la demande — projet">
              <Dl
                items={[
                  { label: "Type de produit", value: details.project_type },
                  { label: "Quantité", value: details.quantity.toLocaleString("fr-MA") },
                  { label: "Dimensions", value: dims.length ? `${dims.join(" × ")} ${details.dimension_unit}` : "—" },
                  { label: "Matière", value: details.material ?? "À conseiller" },
                  { label: "Finitions", value: details.finishings.length ? details.finishings.join(", ") : "—" },
                  { label: "Date souhaitée", value: details.deadline ? new Date(`${details.deadline}T00:00:00`).toLocaleDateString("fr-MA") : "—" },
                ]}
              />
              <h3 className="text-fg mt-6 text-sm font-semibold">Description</h3>
              <p dir="auto" className="mt-2 text-sm whitespace-pre-line">{details.description}</p>
            </Panel>
          ) : null}

          {details ? (
            <Panel title={`Fichiers du client (${fileLinks.length})`}>
              {fileLinks.length > 0 ? (
                <ul className="divide-line divide-y text-sm">
                  {fileLinks.map((file) => (
                    <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{file.original_name}</span>
                        <span className="text-fg-muted text-xs">
                          {file.mime_type ?? "type inconnu"}
                          {file.size_bytes ? ` · ${(file.size_bytes / (1024 * 1024)).toFixed(1)} Mo` : ""}
                        </span>
                      </span>
                      {file.url ? (
                        <a href={file.url} className="text-accent shrink-0 font-medium" rel="noopener noreferrer">
                          Télécharger
                        </a>
                      ) : (
                        <span className="text-fg-subtle text-xs">Lien indisponible</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-fg-muted text-sm">Aucun fichier joint.</p>
              )}
              <p className="text-fg-muted mt-3 text-xs">Liens de téléchargement valables 10 minutes (rechargez la page pour en générer de nouveaux).</p>
            </Panel>
          ) : null}

          <Panel title={`Articles demandés (${items?.length ?? 0})`}>
            <Table head={["Article", "Quantité", "Spécifications"]}>
              {(items ?? []).map((item) => (
                <tr key={item.id}>
                  <Td>
                    {item.product_id ? (
                      <Link href={`/admin/products/${item.product_id}`} className="hover:text-accent font-medium">
                        {item.product_name_snapshot}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.product_name_snapshot}</span>
                    )}
                    <p className="text-fg-muted text-xs">
                      {item.product_sku_snapshot ? `Réf. ${item.product_sku_snapshot}` : null}
                      {!item.product_id ? (item.product_sku_snapshot ? " · produit supprimé du catalogue" : "Besoin sur mesure") : null}
                    </p>
                  </Td>
                  <Td className="font-semibold tabular-nums">{item.quantity.toLocaleString("fr-MA")}</Td>
                  <Td className="text-fg-muted whitespace-pre-line">{item.specifications ?? "—"}</Td>
                </tr>
              ))}
            </Table>
            <p className="text-fg-muted mt-3 text-xs">Noms et références enregistrés au moment de la demande (historique conservé).</p>
          </Panel>

          {request.message ? (
            <Panel title="Précisions du client">
              <p dir="auto" className="text-sm whitespace-pre-line">{request.message}</p>
            </Panel>
          ) : null}

          <Panel title="Client">
            <Dl
              items={[
                { label: "Nom", value: request.full_name },
                { label: "Entreprise", value: request.company_name ?? "—" },
                { label: "E-mail", value: <a href={`mailto:${request.email}`} className="text-accent">{request.email}</a> },
                {
                  label: "Téléphone",
                  value: (
                    <span className="flex flex-wrap gap-3">
                      <a href={`tel:${request.phone}`} className="text-accent" dir="ltr">
                        {request.phone}
                      </a>
                      <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="text-accent">
                        WhatsApp ↗
                      </a>
                    </span>
                  ),
                },
                { label: "Contact préféré", value: contactMethod[request.preferred_contact] },
                { label: "Langue", value: localeLabel[request.locale] ?? request.locale },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Suivi">
            <QuotationUpdateForm id={request.id} status={request.status} notes={request.internal_notes} />
          </Panel>
          {events && events.length > 0 ? (
            <Panel title="Historique du statut">
              <ol className="space-y-2 text-sm">
                {events.map((event, index) => (
                  <li key={index} className="flex items-center justify-between gap-3">
                    <StatusBadge status={quotationStatus[event.status]} />
                    <span className="text-fg-muted text-xs">{formatDateTime(event.created_at)}</span>
                  </li>
                ))}
              </ol>
              <p className="text-fg-muted mt-3 text-xs">Le client voit cet avancement sur la page « Suivi de commande » avec sa référence et son e-mail.</p>
            </Panel>
          ) : null}
          <Panel title="Informations techniques">
            <Dl
              items={[
                { label: "Statut modifié", value: formatDateTime(request.status_changed_at) },
                { label: "Page d'origine", value: request.source_path ?? "—" },
                {
                  label: "Notification",
                  value: request.notified_at
                    ? `Envoyée le ${formatDateTime(request.notified_at)}`
                    : request.notification_error === "email_disabled"
                      ? "Envoi d'e-mails désactivé"
                      : (request.notification_error ?? "En attente"),
                },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
