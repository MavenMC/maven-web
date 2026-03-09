import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateInput } from "@/lib/date";

type PostRow = {
  id: number;
  title: string;
  summary: string | null;
  cover: string | null;
  cover_label: string | null;
  published_at: Date | string | null;
  sort_order: number;
  active: number;
};

async function getPosts() {
  return dbQuery<PostRow[]>(
    "SELECT id, title, summary, cover, cover_label, published_at, sort_order, active FROM site_posts WHERE type = 'patch' ORDER BY published_at DESC, sort_order ASC, id DESC",
  );
}

async function createPost(formData: FormData) {
  "use server";
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim() || null;
  const cover = String(formData.get("cover") || "").trim() || null;
  const coverLabel = String(formData.get("cover_label") || "").trim() || null;
  const publishedAt = String(formData.get("published_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!title) return;

  await dbQuery(
    `INSERT INTO site_posts
      (type, title, summary, cover, cover_label, published_at, sort_order, active, created_at, updated_at)
     VALUES
      ('patch', :title, :summary, :cover, :cover_label, :published_at, :sort_order, :active, NOW(), NOW())`,
    {
      title,
      summary,
      cover,
      cover_label: coverLabel,
      published_at: publishedAt || null,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/patch-notes");
  revalidatePath("/admin/patch-notes");
  revalidatePath("/");
}

async function updatePost(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim() || null;
  const cover = String(formData.get("cover") || "").trim() || null;
  const coverLabel = String(formData.get("cover_label") || "").trim() || null;
  const publishedAt = String(formData.get("published_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!id || !title) return;

  await dbQuery(
    `UPDATE site_posts
     SET title = :title,
         summary = :summary,
         cover = :cover,
         cover_label = :cover_label,
         published_at = :published_at,
         sort_order = :sort_order,
         active = :active
     WHERE id = :id`,
    {
      id,
      title,
      summary,
      cover,
      cover_label: coverLabel,
      published_at: publishedAt || null,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/patch-notes");
  revalidatePath("/admin/patch-notes");
  revalidatePath("/");
}

async function deletePost(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await dbQuery("DELETE FROM site_posts WHERE id = :id", { id });
  revalidatePath("/patch-notes");
  revalidatePath("/admin/patch-notes");
  revalidatePath("/");
}

export default async function AdminPatchNotesPage() {
  const posts = await getPosts();

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Patch Notes</h1>
        <p>Gerencie as notas de atualização rápidas.</p>
      </header>

      <section className="admin-split">
        <div className="card admin-card">
          <h2 className="card-title">Nova nota</h2>
          <form className="admin-form" action={createPost}>
            <label>
              Título
              <input name="title" placeholder="Patch 5.0.2" />
            </label>
            <label>
              Resumo
              <textarea name="summary" rows={3} />
            </label>
            <label>
              Capa (patch)
              <input name="cover" placeholder="patch" />
            </label>
            <label>
              Label da capa
              <input name="cover_label" placeholder="HOTFIX" />
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
              Salvar nota
            </button>
          </form>
        </div>

        <div className="card admin-card">
          <h2 className="card-title">Notas cadastradas</h2>
          <div className="admin-list">
            {posts.map((post) => (
              <div key={post.id} className="card admin-card">
                <form className="admin-form" action={updatePost}>
                  <input type="hidden" name="id" value={String(post.id)} />
                  <label>
                    Título
                    <input name="title" defaultValue={post.title} />
                  </label>
                  <label>
                    Resumo
                    <textarea name="summary" rows={3} defaultValue={post.summary ?? ""} />
                  </label>
                  <label>
                    Capa
                    <input name="cover" defaultValue={post.cover ?? ""} />
                  </label>
                  <label>
                    Label da capa
                    <input name="cover_label" defaultValue={post.cover_label ?? ""} />
                  </label>
                  <label>
                    Data
                    <input
                      type="date"
                      name="published_at"
                      defaultValue={formatDateInput(post.published_at)}
                    />
                  </label>
                  <label>
                    Ordem
                    <input type="number" name="sort_order" defaultValue={post.sort_order} />
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" name="active" defaultChecked={Boolean(post.active)} />
                    Ativo
                  </label>
                  <button className="btn primary" type="submit">
                    Atualizar
                  </button>
                </form>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={String(post.id)} />
                  <button className="btn ghost" type="submit">
                    Remover
                  </button>
                </form>
              </div>
            ))}
            {!posts.length && <p className="muted">Nenhuma nota cadastrada.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
