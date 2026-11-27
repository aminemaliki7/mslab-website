"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/features/admin/auth";
import { success, type AdminActionState } from "@/features/admin/action-state";
import { createSessionClient } from "@/lib/supabase/server";
import { fromRpc } from "./errors";

/** Marks all of the signed-in member's notifications as read (own rows only — enforced by the RPC). */
export async function markAllNotificationsRead(): Promise<AdminActionState> {
  await requireAdmin();
  const { error } = await (await createSessionClient()).rpc("mark_notifications_read", {});
  if (error) return fromRpc(error, "mark notifications read");
  refresh();
  return success("Notifications marquées comme lues.");
}
