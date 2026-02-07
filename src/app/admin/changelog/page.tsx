import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateInput } from "@/lib/date";

type ChangelogRow = {
  id: number;
  version: string;
  title: string;
  items_json: string | null;
  published_at: Date | string | null;
  sort_order: number;
  active: number;
};


type StaffChangeRow = {
  id: number;
  member_name: string;
  role_name: string | null;
  action: string;
  note: string | null;
  happened_at: Date | string | null;
  sort_order: number;
  active: number;
};

function normalizeItems(raw: string) {
  const items = raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? JSON.stringify(items) : null;
}

function itemsToText(itemsJson: string | null) {
  if (!itemsJson) return "";
  try {
    const parsed = JSON.parse(itemsJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).join("\n");
    }
  } catch {
    return itemsJson;
  }
  return itemsJson;
}

async function getEntries() {
  return dbQuery<ChangelogRow[]>(
    "SELECT id, version, title, items_json, published_at, sort_order, active FROM site_changelog_entries ORDER BY published_at DESC, sort_order ASC, id DESC",
  );
}


async function getStaffChanges() {
  return dbQuery<StaffChangeRow[]>(
    "SELECT id, member_name, role_name, action, note, happened_at, sort_order, active FROM site_staff_changes ORDER BY happened_at DESC, sort_order ASC, id DESC",
  );
}


async function createStaffChange(formData: FormData) {
  "use server";
  await requireAdmin();

  const memberName = String(formData.get("member_name") || "").trim();
  const roleName = String(formData.get("role_name") || "").trim() || null;
  const actionRaw = String(formData.get("action") || "join").trim();
  const action = actionRaw === "leave" ? "leave" : "join";
  const note = String(formData.get("note") || "").trim() || null;
  const happenedAt = String(formData.get("happened_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;
  const resolvedDate = happenedAt || new Date().toISOString().slice(0, 10);

  if (!memberName) return;

  await dbQuery(
    `INSERT INTO site_staff_changes
      (member_name, role_name, action, note, happened_at, sort_order, active)
     VALUES
      (:member_name, :role_name, :action, :note, :happened_at, :sort_order, :active)`,
    {
      member_name: memberName,
      role_name: roleName,
      action,
      note,
      happened_at: resolvedDate,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
}

async function updateStaffChange(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const memberName = String(formData.get("member_name") || "").trim();
  const roleName = String(formData.get("role_name") || "").trim() || null;
  const actionRaw = String(formData.get("action") || "join").trim();
  const action = actionRaw === "leave" ? "leave" : "join";
  const note = String(formData.get("note") || "").trim() || null;
  const happenedAt = String(formData.get("happened_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!id || !memberName) return;

  await dbQuery(
    `UPDATE site_staff_changes
     SET member_name = :member_name,
         role_name = :role_name,
         action = :action,
         note = :note,
         happened_at = :happened_at,
         sort_order = :sort_order,
         active = :active
     WHERE id = :id`,
    {
      id,
      member_name: memberName,
      role_name: roleName,
      action,
      note,
      happened_at: happenedAt || null,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
}

async function deleteStaffChange(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await dbQuery("DELETE FROM site_staff_changes WHERE id = :id", { id });
  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
}

async function createEntry(formData: FormData) {
  "use server";
  await requireAdmin();

  const version = String(formData.get("version") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const itemsRaw = String(formData.get("items") || "");
  const publishedAt = String(formData.get("published_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!version || !title) return;

  await dbQuery(
    `INSERT INTO site_changelog_entries
      (version, title, items_json, published_at, sort_order, active)
     VALUES
      (:version, :title, :items_json, :published_at, :sort_order, :active)`,
    {
      version,
      title,
      items_json: normalizeItems(itemsRaw),
      published_at: publishedAt || null,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/");
  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
}

async function updateEntry(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const version = String(formData.get("version") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const itemsRaw = String(formData.get("items") || "");
  const publishedAt = String(formData.get("published_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!id || !version || !title) return;

  await dbQuery(
    `UPDATE site_changelog_entries
     SET version = :version,
         title = :title,
         items_json = :items_json,
         published_at = :published_at,
         sort_order = :sort_order,
         active = :active
     WHERE id = :id`,
    {
      id,
      version,
      title,
      items_json: normalizeItems(itemsRaw),
      published_at: publishedAt || null,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/");
  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
}

async function deleteEntry(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await dbQuery("DELETE FROM site_changelog_entries WHERE id = :id", { id });
  revalidatePath("/");
  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");
}

export default async function AdminChangelogPage() {
  const [entries, staffChanges] = await Promise.all([getEntries(), getStaffChanges()]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Changelog</h1>
        <p>Controle as entradas detalhadas do servidor.</p>
      </header>

      <section className="admin-split">
        <div className="card admin-card">
          <h2 className="card-title">Nova entrada</h2>
          <form className="admin-form" action={createEntry}>
            <label>
              Versão
              <input name="version" placeholder="v5.0.2" />
            </label>
            <label>
              Título
              <input name="title" placeholder="Equilíbrio de combate" />
            </label>
            <label>
              Itens (1 por linha)
              <textarea name="items" rows={6} placeholder="Buff em espadas\nAjuste em flechas" />
            </label>
            <label>
              Data
              <input type="date" name="published_at" />
            </label>
            <label>
              Ordem
              <input type="number" name="sort_order" defaultValue={0} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked />
              Ativo
            </label>
            <button className="btn primary" type="submit">
              Salvar entrada
            </button>
          </form>
        </div>

        <div className="card admin-card">
          <h2 className="card-title">Entradas cadastradas</h2>
          <div className="admin-list">
            {entries.map((entry) => (
              <div key={entry.id} className="card admin-card">
                <form className="admin-form" action={updateEntry}>
                  <input type="hidden" name="id" value={entry.id} />
                  <label>
                    Versão
                    <input name="version" defaultValue={entry.version} />
                  </label>
                  <label>
                    Título
                    <input name="title" defaultValue={entry.title} />
                  </label>
                  <label>
                    Itens (1 por linha)
                    <textarea name="items" rows={6} defaultValue={itemsToText(entry.items_json)} />
                  </label>
                  <label>
                    Data
                    <input
                      type="date"
                      name="published_at"
                      defaultValue={formatDateInput(entry.published_at)}
                    />
                  </label>
                  <label>
                    Ordem
                    <input type="number" name="sort_order" defaultValue={entry.sort_order} />
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" name="active" defaultChecked={Boolean(entry.active)} />
                    Ativo
                  </label>
                  <button className="btn primary" type="submit">
                    Atualizar
                  </button>
                </form>
                <form action={deleteEntry}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button className="btn ghost" type="submit">
                    Remover
                  </button>
                </form>
              </div>
            ))}
            {!entries.length && <p className="muted">Nenhuma entrada cadastrada.</p>}
          </div>
        </div>
      </section>

      <section className="admin-split">
        <div className="card admin-card">
          <h2 className="card-title">Nova movimentacao</h2>
          <form className="admin-form" action={createStaffChange}>
            <label>
              Nome do membro
              <input name="member_name" placeholder="Ex: Player01" />
            </label>
            <label>
              Cargo
              <input name="role_name" placeholder="Moderador" />
            </label>
            <label>
              Acao
              <select name="action" defaultValue="join">
                <option value="join">Entrou</option>
                <option value="leave">Saiu</option>
              </select>
            </label>
            <label>
              Nota
              <textarea name="note" rows={3} placeholder="Motivo ou observacao" />
            </label>
            <label>
              Data
              <input type="date" name="happened_at" />
            </label>
            <label>
              Ordem
              <input type="number" name="sort_order" defaultValue={0} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked />
              Ativo
            </label>
            <button className="btn primary" type="submit">
              Salvar movimentacao
            </button>
          </form>
        </div>

        <div className="card admin-card">
          <h2 className="card-title">Movimentacoes cadastradas</h2>
          <div className="admin-list">
            {staffChanges.map((change) => (
              <div key={change.id} className="card admin-card">
                <form className="admin-form" action={updateStaffChange}>
                  <input type="hidden" name="id" value={change.id} />
                  <label>
                    Nome do membro
                    <input name="member_name" defaultValue={change.member_name} />
                  </label>
                  <label>
                    Cargo
                    <input name="role_name" defaultValue={change.role_name ?? ""} />
                  </label>
                  <label>
                    Acao
                    <select
                      name="action"
                      defaultValue={change.action === "leave" ? "leave" : "join"}
                    >
                      <option value="join">Entrou</option>
                      <option value="leave">Saiu</option>
                    </select>
                  </label>
                  <label>
                    Nota
                    <textarea name="note" rows={3} defaultValue={change.note ?? ""} />
                  </label>
                  <label>
                    Data
                    <input
                      type="date"
                      name="happened_at"
                      defaultValue={formatDateInput(change.happened_at)}
                    />
                  </label>
                  <label>
                    Ordem
                    <input type="number" name="sort_order" defaultValue={change.sort_order} />
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" name="active" defaultChecked={Boolean(change.active)} />
                    Ativo
                  </label>
                  <button className="btn primary" type="submit">
                    Atualizar
                  </button>
                </form>
                <form action={deleteStaffChange}>
                  <input type="hidden" name="id" value={change.id} />
                  <button className="btn ghost" type="submit">
                    Remover
                  </button>
                </form>
              </div>
            ))}
            {!staffChanges.length && (
              <p className="muted">Nenhuma movimentacao cadastrada.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
