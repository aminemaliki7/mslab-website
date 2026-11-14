import "server-only";
import { createSessionClient } from "@/lib/supabase/server";

/** Category options for selects, indented by depth ("Parent › Enfant"). */
export async function categoryOptions(excludeId?: string) {
  const db = await createSessionClient();
  const { data } = await db.from("categories").select("id, name_fr, parent_id").order("sort_order").order("name_fr");
  const rows = data ?? [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  return rows
    .filter((r) => r.id !== excludeId)
    .map((r) => {
      const parent = r.parent_id ? byId.get(r.parent_id) : undefined;
      return { id: r.id, label: parent ? `${parent.name_fr} › ${r.name_fr}` : r.name_fr, parentId: r.parent_id };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}
