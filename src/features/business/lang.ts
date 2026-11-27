import "server-only";
import { getAdminT } from "@/features/admin/lang";
import { businessDict, type BusinessDict } from "./dictionary";

/** Admin language + both dictionaries, for business pages. */
export async function getBusinessT() {
  const admin = await getAdminT();
  return { ...admin, b: businessDict(admin.lang) };
}

/** Browser-tab title: `export const generateMetadata = businessTitle((b) => b.sales.title)`. */
export function businessTitle(pick: (b: BusinessDict) => string) {
  return async (): Promise<{ title: string }> => {
    const { b } = await getBusinessT();
    return { title: pick(b) };
  };
}
