import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateInput } from "@/lib/date";
import DeleteButton from "./DeleteButton";

const PAGE_SIZE = 10;

type StaffChangeRow = {
  id: number;
  member_name: string;
  role_name: string | null;
  action: "join" | "leave" | "promoted" | "demoted";
  note: string | null;
  happened_at: Date | string | null;
  created_ts: number | null;
  sort_order: number;
  active: number;
};

type MutationResult = {
  affectedRows?: number;
  insertId?: number;
};

function getMinecraftAvatar(username: string): string {
  return `https://minotar.net/helm/${username}/128`;
}

function getActionStyle(action: StaffChangeRow["action"]) {
  switch (action) {
    case "leave":
      return { color: "#ef4444", text: "Saiu" };
    case "promoted":
      return { color: "#3b82f6", text: "Promovido" };
    case "demoted":
      return { color: "#f59e0b", text: "Rebaixado" };
    case "join":
    default:
      return { color: "#10b981", text: "Entrou" };
  }
}

async function getStaffChanges(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  return dbQuery<StaffChangeRow[]>(
    `SELECT id, member_name, role_name, action, note, happened_at, UNIX_TIMESTAMP(created_at) AS created_ts, sort_order, active
     FROM site_staff_changes
     ORDER BY happened_at DESC, sort_order ASC, id DESC
     LIMIT :limit OFFSET :offset`,
    {
      limit: pageSize,
      offset,
    },
  );
}

async function getStaffChangesCount() {
  const rows = await dbQuery<Array<{ total: number }>>(
    "SELECT COUNT(*) as total FROM site_staff_changes",
  );
  return Number(rows[0]?.total ?? 0);
}

async function getNextSortOrder() {
  const result = await dbQuery<Array<{ max_order: number | null }>>(
    "SELECT MAX(sort_order) as max_order FROM site_staff_changes",
  );
  const maxOrder = result[0]?.max_order ?? 0;
  return maxOrder + 1;
}

async function getNextStaffChangeId() {
  const result = await dbQuery<Array<{ next_id: number | null }>>(
    "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM site_staff_changes",
  );
  return Number(result[0]?.next_id ?? 1);
}

async function createStaffChange(formData: FormData) {
  "use server";
  await requireAdmin();

  const memberName = String(formData.get("member_name") || "").trim();
  const roleName = String(formData.get("role_name") || "").trim() || null;
  const actionRaw = String(formData.get("action") || "join").trim();
  const validActions = ["join", "leave", "promoted", "demoted"];
  const action = validActions.includes(actionRaw) ? actionRaw : "join";
  const noteValue = formData.get("note");
  const noteTrimmed = noteValue ? String(noteValue).trim() : "";
  const note = noteTrimmed;
  const happenedAt = String(formData.get("happened_at") || "").trim() || null;
  const sortOrderInput = String(formData.get("sort_order") || "").trim();
  const active = formData.get("active") === "on" ? 1 : 0;
  const resolvedDate = happenedAt || new Date().toISOString().slice(0, 10);

  // Ordem automática se não for fornecida ou for 0
  const sortOrder = sortOrderInput && Number(sortOrderInput) !== 0 
    ? Number(sortOrderInput) 
    : await getNextSortOrder();

  if (!memberName) return;

  const payload = {
    member_name: memberName,
    role_name: roleName,
    action,
    note,
    happened_at: resolvedDate,
    sort_order: sortOrder,
    active,
  };

  try {
    const nextId = await getNextStaffChangeId();
    await dbQuery<MutationResult>(
      `INSERT INTO site_staff_changes
        (id, member_name, role_name, action, note, happened_at, sort_order, active, created_at, updated_at)
       VALUES
        (:id, :member_name, :role_name, :action, :note, :happened_at, :sort_order, :active, NOW(), NOW())`,
      {
        id: nextId,
        ...payload,
      },
    );
  } catch (error) {
    await dbQuery<MutationResult>(
      `INSERT INTO site_staff_changes
        (member_name, role_name, action, note, happened_at, sort_order, active, created_at, updated_at)
       VALUES
        (:member_name, :role_name, :action, :note, :happened_at, :sort_order, :active, NOW(), NOW())`,
      payload,
    );
    console.warn("Fallback de INSERT sem id aplicado em site_staff_changes", error);
  }

  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
  redirect("/admin/changelog");
}

async function updateStaffChange(formData: FormData) {
  "use server";
  await requireAdmin();

  const idRaw = String(formData.get("id") ?? "").trim();
  const parsedId = Number(idRaw);
  const memberName = String(formData.get("member_name") || "").trim();
  const roleName = String(formData.get("role_name") || "").trim() || null;
  const actionRaw = String(formData.get("action") || "join").trim();
  const validActions = ["join", "leave", "promoted", "demoted"];
  const action = validActions.includes(actionRaw) ? actionRaw : "join";
  const noteValue = formData.get("note");
  const noteTrimmed = noteValue ? String(noteValue).trim() : "";
  const note = noteTrimmed;
  const happenedAt = String(formData.get("happened_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;
  const legacyCreatedTs = Number(formData.get("legacy_created_ts") || 0);
  const legacyMemberName = String(formData.get("legacy_member_name") || "").trim();
  const legacyAction = String(formData.get("legacy_action") || "").trim();
  const legacySortOrder = Number(formData.get("legacy_sort_order") || 0);
  const legacyHappenedAtRaw = String(formData.get("legacy_happened_at") || "").trim();
  const legacyHappenedAt = legacyHappenedAtRaw.length > 0 ? legacyHappenedAtRaw : null;

  if (!memberName) {
    console.error("Erro ao atualizar: memberName inválido");
    return;
  }

  let affectedRows = 0;

  if (parsedId > 0) {
    const result = await dbQuery<MutationResult>(
      `UPDATE site_staff_changes
       SET member_name = :member_name,
           role_name = :role_name,
           action = :action,
           note = :note,
           happened_at = :happened_at,
           sort_order = :sort_order,
           active = :active,
           updated_at = NOW()
       WHERE id = :id`,
      {
        id: parsedId,
        member_name: memberName,
        role_name: roleName,
        action,
        note,
        happened_at: happenedAt || null,
        sort_order: sortOrder,
        active,
      },
    );
    affectedRows = Number(result?.affectedRows ?? 0);
  }

  if (affectedRows === 0 && legacyCreatedTs > 0 && legacyMemberName && legacyAction) {
    const fallbackResult = await dbQuery<MutationResult>(
      `UPDATE site_staff_changes
       SET member_name = :member_name,
           role_name = :role_name,
           action = :action,
           note = :note,
           happened_at = :happened_at,
           sort_order = :sort_order,
           active = :active,
           updated_at = NOW()
       WHERE id IS NULL
         AND UNIX_TIMESTAMP(created_at) = :legacy_created_ts
         AND member_name = :legacy_member_name
         AND action = :legacy_action
         AND sort_order = :legacy_sort_order
         AND ((happened_at IS NULL AND :legacy_happened_at IS NULL) OR happened_at = :legacy_happened_at)
       LIMIT 1`,
      {
        member_name: memberName,
        role_name: roleName,
        action,
        note,
        happened_at: happenedAt || null,
        sort_order: sortOrder,
        active,
        legacy_created_ts: legacyCreatedTs,
        legacy_member_name: legacyMemberName,
        legacy_action: legacyAction,
        legacy_sort_order: legacySortOrder,
        legacy_happened_at: legacyHappenedAt,
      },
    );
    affectedRows = Number(fallbackResult?.affectedRows ?? 0);
  }

  if (affectedRows === 0) {
    throw new Error("Nenhuma linha foi atualizada. Registro não encontrado para edição.");
  }

  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
  redirect("/admin/changelog");
}

export default async function AdminChangelogPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const requestedPage = Number(pageParam ?? "1");
  const totalCount = await getStaffChangesCount();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), totalPages);

  const staffChanges = await getStaffChanges(currentPage, PAGE_SIZE);
  const nextOrder = await getNextSortOrder();

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Changelog - Movimentações da Equipe</h1>
        <p>Gerencie o histórico de entrada e saída de membros da equipe.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "450px 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Formulário de criação */}
        <div className="card admin-card" style={{ position: "sticky", top: "2rem" }}>
          <h2 className="card-title">Nova movimentação</h2>
          <form className="admin-form" action={createStaffChange}>
            <label>
              Nome do membro
              <input name="member_name" placeholder="Ex: Player01" required />
            </label>
            <label>
              Cargo
              <select name="role_name" defaultValue="">
                <option value="">Selecione um cargo</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MOD+">MOD+</option>
                <option value="MOD">MOD</option>
                <option value="HELPER">HELPER</option>
              </select>
            </label>
            <label>
              Ação
              <select name="action" defaultValue="join">
                <option value="join">Entrou</option>
                <option value="leave">Saiu</option>
                <option value="promoted">Promovido</option>
                <option value="demoted">Rebaixado</option>
              </select>
            </label>
            <label>
              Nota (opcional)
              <textarea name="note" rows={3} placeholder="Motivo ou observação adicional" />
            </label>
            <label>
              Data
              <input type="date" name="happened_at" />
            </label>
            <label>
              Ordem <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>(Próxima: {nextOrder})</span>
              <input 
                type="number" 
                name="sort_order" 
                placeholder={`Automático: ${nextOrder}`}
                title="Deixe 0 ou vazio para ordem automática"
              />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked />
              Ativo
            </label>
            <button className="btn primary" type="submit">
              Salvar movimentação
            </button>
          </form>
        </div>

        {/* Lista de movimentações */}
        <div className="card admin-card">
          <h2 className="card-title">Movimentações cadastradas ({totalCount})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {staffChanges.map((change) => {
              const config = getActionStyle(change.action);
              const actionColor = config.color;
              const actionText = config.text;
              const avatar = getMinecraftAvatar(change.member_name);

              return (
                <div key={change.id} className="card" style={{
                  padding: "1.5rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderLeft: `4px solid ${actionColor}`,
                }}>
                  <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={avatar}
                        alt={change.member_name}
                        style={{ width: "64px", height: "64px", borderRadius: "8px", border: `2px solid ${actionColor}` }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>{change.member_name}</h3>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: actionColor,
                          color: "white",
                        }}>
                          {actionText}
                        </span>
                        {!change.active && (
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: "#6b7280",
                            color: "white",
                          }}>
                            Inativo
                          </span>
                        )}
                      </div>

                      {change.role_name && (
                        <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af", fontSize: "0.875rem" }}>
                          Cargo: <strong>{change.role_name}</strong>
                        </p>
                      )}

                      {change.note && (
                        <p style={{ margin: "0 0 0.5rem 0", color: "#d1d5db", fontSize: "0.875rem" }}>{change.note}</p>
                      )}

                      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.75rem" }}>
                        Data: {change.happened_at ? new Date(change.happened_at).toLocaleDateString("pt-BR") : "N/A"}
                        {" • "}Ordem: {change.sort_order}
                      </p>
                    </div>

                    <div style={{ marginLeft: "auto" }}>
                      <DeleteButton
                        id={change.id}
                        legacy={{
                          createdTs: change.created_ts,
                          memberName: change.member_name,
                          action: change.action,
                          sortOrder: change.sort_order,
                          happenedAt: formatDateInput(change.happened_at),
                        }}
                      />
                    </div>
                  </div>

                  <details style={{ marginTop: "1rem" }}>
                    <summary style={{
                      cursor: "pointer",
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      padding: "0.5rem",
                      borderRadius: "4px",
                    }}>
                      Editar movimentação
                    </summary>
                    <form className="admin-form" action={updateStaffChange} style={{ marginTop: "1rem" }}>
                      <input type="hidden" name="id" defaultValue={String(change.id ?? "")} />
                      <input type="hidden" name="legacy_created_ts" defaultValue={String(change.created_ts ?? 0)} />
                      <input type="hidden" name="legacy_member_name" defaultValue={change.member_name || ""} />
                      <input type="hidden" name="legacy_action" defaultValue={change.action || ""} />
                      <input type="hidden" name="legacy_sort_order" defaultValue={String(change.sort_order ?? 0)} />
                      <input type="hidden" name="legacy_happened_at" defaultValue={formatDateInput(change.happened_at)} />
                      <label>
                        Nome do membro
                        <input name="member_name" defaultValue={change.member_name || ""} required />
                      </label>
                      <label>
                        Cargo
                        <select name="role_name" defaultValue={change.role_name || ""}>
                          <option value="">Selecione um cargo</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="MOD+">MOD+</option>
                          <option value="MOD">MOD</option>
                          <option value="HELPER">HELPER</option>
                        </select>
                      </label>
                      <label>
                        Ação
                        <select name="action" defaultValue={change.action}>
                          <option value="join">Entrou</option>
                          <option value="leave">Saiu</option>
                          <option value="promoted">Promovido</option>
                          <option value="demoted">Rebaixado</option>
                        </select>
                      </label>
                      <label>
                        Nota
                        <textarea name="note" rows={3} defaultValue={change.note ?? ""}></textarea>
                      </label>
                      <label>
                        Data
                        <input type="date" name="happened_at" defaultValue={formatDateInput(change.happened_at)} />
                      </label>
                      <label>
                        Ordem
                        <input type="number" name="sort_order" defaultValue={change.sort_order} />
                      </label>
                      <label className="checkbox">
                        <input type="checkbox" name="active" defaultChecked={Boolean(change.active)} />
                        Ativo
                      </label>
                      <button className="btn primary" type="submit">Atualizar</button>
                    </form>
                    <div style={{ marginTop: "0.5rem" }}>
                      <DeleteButton
                        id={change.id}
                        legacy={{
                          createdTs: change.created_ts,
                          memberName: change.member_name,
                          action: change.action,
                          sortOrder: change.sort_order,
                          happenedAt: formatDateInput(change.happened_at),
                        }}
                      />
                    </div>
                  </details>
                </div>
              );
            })}
            {!staffChanges.length && (
              <p className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                Nenhuma movimentação cadastrada.
              </p>
            )}

            {totalPages > 1 && (
              <div style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}>
                {currentPage > 1 ? (
                  <Link href={`/admin/changelog?page=${currentPage - 1}`} className="btn ghost">
                    Anterior
                  </Link>
                ) : (
                  <span className="btn ghost" style={{ opacity: 0.6, pointerEvents: "none" }}>
                    Anterior
                  </span>
                )}

                <span className="muted" style={{ fontSize: "0.875rem" }}>
                  Página {currentPage} de {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link href={`/admin/changelog?page=${currentPage + 1}`} className="btn ghost">
                    Próxima
                  </Link>
                ) : (
                  <span className="btn ghost" style={{ opacity: 0.6, pointerEvents: "none" }}>
                    Próxima
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
