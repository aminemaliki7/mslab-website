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
  const [{ data: request }, { data: items }] = await Promise.all([
    db.from("quotation_requests").select("*").eq("id", id).maybeSingle(),
    db.from("quotation_items").select("*").eq("quotation_request_id", id).order("sort_order"),
  ]);
  if (!request) notFound();
  const whatsappDigits = request.phone.replace(/\D/g, "");

  return (
    <>
      <AdminPageHeader
        title={`Devis ${request.reference}`}
        description={`Reçue le ${formatDateTime(request.created_at)}`}
        back={{ href: "/admin/quotations", label: "Demandes de devis" }}
        actions={<StatusBadge status={quotationStatus[request.status]} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
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
