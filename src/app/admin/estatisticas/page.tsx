import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

type StatRow = {
  id: number;
  label: string;
  value: string;
  sort_order: number;
  active: number;
};

async function getStats() {
  return dbQuery<StatRow[]>(
    "SELECT id, label, value, sort_order, active FROM site_stats ORDER BY sort_order ASC, id ASC",
  );
}

async function createStat(formData: FormData) {
  "use server";
  await requireAdmin();

  const label = String(formData.get("label") || "").trim();
  const value = String(formData.get("value") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!label || !value) return;

  await dbQuery(
    "INSERT INTO site_stats (label, value, sort_order, active, updated_at) VALUES (:label, :value, :sort_order, :active, NOW())",
    { label, value, sort_order: sortOrder, active },
  );

  revalidatePath("/");
  revalidatePath("/admin/estatisticas");
}

async function updateStat(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const label = String(formData.get("label") || "").trim();
  const value = String(formData.get("value") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!id || !label || !value) return;

  await dbQuery(
    "UPDATE site_stats SET label = :label, value = :value, sort_order = :sort_order, active = :active WHERE id = :id",
    { id, label, value, sort_order: sortOrder, active },
  );

  revalidatePath("/");
  revalidatePath("/admin/estatisticas");
}

async function deleteStat(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await dbQuery("DELETE FROM site_stats WHERE id = :id", { id });
  revalidatePath("/");
  revalidatePath("/admin/estatisticas");
}

export default async function AdminStatsPage() {
  const stats = await getStats();

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Estatísticas</h1>
        <p>Cards exibidos na home.</p>
      </header>

      <section className="admin-split">
        <div className="card admin-card">
          <h2 className="card-title">Novo card</h2>
          <form className="admin-form" action={createStat}>
            <label>
              Título
              <input name="label" placeholder="Jogadores ativos" />
            </label>
            <label>
              Valor
              <input name="value" placeholder="3.4k+" />
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
              Salvar
            </button>
          </form>
        </div>

        <div className="card admin-card">
          <h2 className="card-title">Cards existentes</h2>
          <div className="admin-list">
            {stats.map((stat) => (
              <div key={stat.id} className="card admin-card">
                <form className="admin-form" action={updateStat}>
                  <input type="hidden" name="id" value={stat.id} />
                  <label>
                    Título
                    <input name="label" defaultValue={stat.label} />
                  </label>
                  <label>
                    Valor
                    <input name="value" defaultValue={stat.value} />
                  </label>
                  <label>
                    Ordem
                    <input type="number" name="sort_order" defaultValue={stat.sort_order} />
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" name="active" defaultChecked={Boolean(stat.active)} />
                    Ativo
                  </label>
                  <button className="btn primary" type="submit">
                    Atualizar
                  </button>
                </form>
                <form action={deleteStat}>
                  <input type="hidden" name="id" value={stat.id} />
                  <button className="btn ghost" type="submit">
                    Remover
                  </button>
                </form>
              </div>
            ))}
            {!stats.length && <p className="muted">Nenhuma estatística cadastrada.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
