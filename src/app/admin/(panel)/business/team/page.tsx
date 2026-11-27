import { ActionButton } from "@/components/admin/admin-form";
import { AssignRoleForm, AttachStaffForm } from "@/components/admin/business/forms";
import { AdminPageHeader, Notice, Panel, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/layout";
import { format } from "@/i18n/format";
import { businessTitle, getBusinessT } from "@/features/business/lang";
import { requirePermission } from "@/features/business/permissions";
import { getTeam } from "@/features/business/queries";
import { removeRole } from "@/features/business/settings-actions";

export const generateMetadata = businessTitle((b) => b.team.title);

/**
 * Staff and roles (ADR-027). Accounts are invited from the Supabase dashboard (no service-role
 * key in the app), attached here, then given roles. The database refuses removing the last
 * active Administrator.
 */
export default async function TeamPage() {
  const { admin, can } = await requirePermission("staff.read");
  const { b } = await getBusinessT();
  const t = b.team;
  const { staff, assignments, roles, grants, permissions, error } = await getTeam();
  const canRoles = can("roles.manage");
  const roleById = new Map(roles.map((r) => [r.id, r]));
  const grantCount = (roleId: string) => grants.filter((g) => g.role_id === roleId).length;
  const businessKeys = permissions.filter((p) => p.module === "business").map((p) => p.key);

  return (
    <>
      <AdminPageHeader title={t.title} description={t.description} />
      {error ? <Notice tone="danger">{b.common.loadError}</Notice> : null}

      <Table head={[t.colMember, t.colRoles, t.colStatus]}>
        {staff.map((m) => {
          const mine = assignments.filter((a) => a.staff_id === m.id).map((a) => roleById.get(a.role_id)).filter((r) => r !== undefined);
          const available = roles.filter((r) => !mine.some((x) => x.id === r.id)).map((r) => ({ value: r.id, label: r.name }));
          return (
            <tr key={m.id}>
              <Td>
                <span className="font-semibold" dir="auto">{m.full_name ?? m.email}</span>
                {m.id === admin.id ? <span className="text-fg-muted text-xs"> ({t.you})</span> : null}
                <p className="text-fg-muted text-xs" dir="ltr">{m.email}</p>
                <p className="text-fg-muted text-xs">{m.kind === "associate" ? t.kindAssociate : t.kindEmployee}</p>
              </Td>
              <Td label={t.colRoles}>
                <ul className="flex flex-wrap gap-2">
                  {mine.map((r) => (
                    <li key={r.id} className="inline-flex items-center gap-1">
                      <Badge tone={r.key === "administrator" ? "accent" : "neutral"}>{r.name}</Badge>
                      {canRoles ? <ActionButton action={removeRole} label={t.removeRole} confirm={t.removeRoleConfirm} hidden={{ staff_id: m.id, role_id: r.id }} /> : null}
                    </li>
                  ))}
                </ul>
                {canRoles ? <div className="mt-2"><AssignRoleForm staffId={m.id} roles={available} /></div> : null}
              </Td>
              <Td label={t.colStatus}>
                <Badge tone={m.is_active ? "success" : "neutral"}>{m.is_active ? t.active : t.inactive}</Badge>
              </Td>
            </tr>
          );
        })}
      </Table>

      {can("staff.manage") ? (
        <Panel title={t.attachTitle} description={t.attachHint} className="mt-8">
          <AttachStaffForm />
        </Panel>
      ) : null}

      <Panel title={t.matrixTitle} description={t.roleHint} className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="text-fg-muted text-xs">
                <th scope="col" className="py-2 text-start font-medium">{t.rolesTitle}</th>
                {businessKeys.map((k) => (
                  <th key={k} scope="col" className="px-2 py-2 text-center align-bottom font-medium">{b.permission[k] ?? k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {roles.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className="py-2 text-start font-medium">
                    {r.name}
                    <span className="text-fg-muted block text-xs font-normal">
                      {r.key === "administrator" ? "∗" : format(t.permissions, { count: grantCount(r.id) })}
                    </span>
                  </th>
                  {businessKeys.map((k) => {
                    const has = r.key === "administrator" || grants.some((g) => g.role_id === r.id && g.permission_key === k);
                    return (
                      <td key={k} className="px-2 py-2 text-center">
                        <span aria-label={has ? "✓" : "—"} className={has ? "text-success font-semibold" : "text-fg-subtle"}>{has ? "✓" : "—"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
