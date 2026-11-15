import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/admin/admin-form";
import { ProductionOptionForm } from "@/components/admin/pod-forms";
import { AdminPageHeader, EmptyState, Panel, StatusBadge, Table, Td } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/auth";
import { contentStatus } from "@/features/admin/labels";
import { deleteProductionOption, toggleMockupProduct, toggleProductionOption } from "@/features/admin/pod-actions";
import { localizedPath } from "@/i18n/routes";
import type { Tables } from "@/lib/supabase/database.types";
import { createSessionClient } from "@/lib/supabase/server";
import { catalogImageUrl } from "@/lib/supabase/storage";

export const metadata: Metadata = { title: "Impression à la demande" };

const MOCKUP_LABELS: Record<string, string> = {
  tshirt: "T-shirt",
  hoodie: "Sweat à capuche",
  tote: "Tote bag",
  mug: "Mug",
  box: "Boîte / packaging",
  notebook: "Carnet",
  sticker: "Sticker",
  "business-card": "Carte de visite",
  flyer: "Flyer",
  poster: "Affiche / poster",
  letterhead: "Papier à en-tête",
};

export default async function PrintOnDemandAdminPage() {
  await requireAdmin();
  const db = await createSessionClient();
  const [{ data: options }, { data: portfolio }, { data: mockups }] = await Promise.all([
    db.from("production_options").select("*").order("kind").order("sort_order").order("name_fr"),
    db.from("portfolio_items").select("*").order("sort_order").order("created_at", { ascending: false }),
    db.from("mockup_products").select("*").order("sort_order"),
  ]);
  const materials = (options ?? []).filter((o) => o.kind === "material");
  const finishings = (options ?? []).filter((o) => o.kind === "finishing");

  return (
    <>
      <AdminPageHeader
        title="Impression à la demande"
        description="Matières et finitions proposées dans le formulaire, et galerie des réalisations. Les demandes reçues arrivent dans « Demandes de devis »."
        actions={
          <Link href={localizedPath("fr", { route: "service", slug: "impression-a-la-demande" })} target="_blank" className="text-accent text-sm">
            Voir la page ↗
          </Link>
        }
      />
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <OptionsPanel title="Matières" kind="material" options={materials} empty="Aucune matière : le formulaire affiche un champ libre « Matière »." />
          <OptionsPanel title="Finitions" kind="finishing" options={finishings} empty="Aucune finition : la section est masquée dans le formulaire." />
        </div>

        <Panel title="Aperçus produits (studio de maquettes)">
          <p className="text-fg-muted mb-4 text-sm">
            Produits sur lesquels les visiteurs voient leur logo en direct. Masquez ceux que MSLAB ne propose pas (ou plus). Si tous sont masqués, le studio disparaît de la page.
          </p>
          <ul className="divide-line divide-y text-sm">
            {(mockups ?? []).map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-3 py-2">
                <span className={m.is_active ? "font-medium" : "text-fg-subtle line-through"}>{MOCKUP_LABELS[m.key] ?? m.key}</span>
                <ActionButton action={toggleMockupProduct} label={m.is_active ? "Masquer" : "Afficher"} hidden={{ key: m.key, is_active: String(!m.is_active) }} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title={`Galerie des réalisations (${portfolio?.length ?? 0})`}
          actions={
            <ButtonLink href="/admin/print-on-demand/portfolio/new" size="sm">
              Ajouter une réalisation
            </ButtonLink>
          }
        >
          <p className="text-fg-muted mb-4 text-sm">
            Photos réelles de produits fabriqués par MSLAB. La galerie n&apos;apparaît sur le site qu&apos;avec au moins une réalisation publiée.
          </p>
          {portfolio && portfolio.length > 0 ? (
            <Table head={["Photo", "Titre", "Statut", "Ordre"]}>
              {portfolio.map((item) => (
                <tr key={item.id}>
                  <Td>
                    <div className="bg-surface size-14 overflow-hidden rounded">
                      {item.image_path ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                        <img src={catalogImageUrl(item.image_path)} alt="" className="size-full object-cover" />
                      ) : null}
                    </div>
                  </Td>
                  <Td>
                    <Link href={`/admin/print-on-demand/portfolio/${item.id}`} className="hover:text-accent font-medium">
                      {item.title_fr}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={contentStatus[item.status]} />
                  </Td>
                  <Td className="tabular-nums">{item.sort_order}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState>Aucune réalisation pour le moment.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}

function OptionsPanel({
  title,
  kind,
  options,
  empty,
}: {
  title: string;
  kind: "material" | "finishing";
  options: Tables<"production_options">[];
  empty: string;
}) {
  return (
    <Panel title={`${title} (${options.length})`}>
      {options.length > 0 ? (
        <ul className="divide-line mb-6 divide-y text-sm">
          {options.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className={o.is_active ? "font-medium" : "text-fg-subtle line-through"}>{o.name_fr}</span>
                <span className="text-fg-muted block text-xs">
                  {[o.name_ar, o.name_en].filter(Boolean).join(" · ") || "Traductions manquantes (le français sera affiché)"}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <ActionButton
                  action={toggleProductionOption}
                  label={o.is_active ? "Masquer" : "Afficher"}
                  hidden={{ id: o.id, is_active: String(!o.is_active) }}
                />
                <ActionButton action={deleteProductionOption} label="Supprimer" confirm={`Supprimer « ${o.name_fr} » ?`} hidden={{ id: o.id }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-fg-muted mb-6 text-sm">{empty}</p>
      )}
      <ProductionOptionForm kind={kind} />
    </Panel>
  );
}
