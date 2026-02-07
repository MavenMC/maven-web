import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatDateInput } from "@/lib/date";
import { buildSummary, resolveCoverLabel } from "@/lib/post-utils";

type PostRow = {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  tag: string | null;
  cover: string | null;
  cover_label: string | null;
  published_at: Date | string | null;
  sort_order: number;
  active: number;
};


async function getPosts() {
  return dbQuery<PostRow[]>(
    "SELECT id, title, summary, content, tag, cover, cover_label, published_at, sort_order, active FROM site_posts WHERE type = 'blog' ORDER BY published_at DESC, sort_order ASC, id DESC",
  );
}

async function createPost(formData: FormData) {
  "use server";
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim() || null;
  const content = String(formData.get("content") || "").trim() || null;
  const tag = String(formData.get("tag") || "").trim() || null;
  const cover = String(formData.get("cover") || "").trim() || null;
  const coverLabel = String(formData.get("cover_label") || "").trim() || null;
  const publishedAt = String(formData.get("published_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;
  const resolvedSummary = buildSummary(summary, content);
  const resolvedCoverLabel = resolveCoverLabel(coverLabel, tag);
  const resolvedPublishedAt = publishedAt || new Date().toISOString().slice(0, 10);

  if (!title) return;

  await dbQuery(
    `INSERT INTO site_posts
      (type, title, summary, content, tag, cover, cover_label, published_at, sort_order, active)
     VALUES
      ('blog', :title, :summary, :content, :tag, :cover, :cover_label, :published_at, :sort_order, :active)`,
    {
      title,
      summary: resolvedSummary,
      content,
      tag,
      cover,
      cover_label: resolvedCoverLabel,
      published_at: resolvedPublishedAt,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/");
}

async function updatePost(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim() || null;
  const content = String(formData.get("content") || "").trim() || null;
  const tag = String(formData.get("tag") || "").trim() || null;
  const cover = String(formData.get("cover") || "").trim() || null;
  const coverLabel = String(formData.get("cover_label") || "").trim() || null;
  const publishedAt = String(formData.get("published_at") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;
  const resolvedSummary = buildSummary(summary, content);

  if (!id || !title) return;

  await dbQuery(
    `UPDATE site_posts
     SET title = :title,
         summary = :summary,
         content = :content,
         tag = :tag,
         cover = :cover,
         cover_label = :cover_label,
         published_at = :published_at,
         sort_order = :sort_order,
         active = :active
     WHERE id = :id`,
    {
      id,
      title,
      summary: resolvedSummary,
      content,
      tag,
      cover,
      cover_label: coverLabel,
      published_at: publishedAt || null,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/");
}

async function deletePost(formData: FormData) {
  \"use server\";
  await requireAdmin();
  const id = Number(formData.get(\"id\"));
  if (!id) return;
  await dbQuery(\"DELETE FROM site_posts WHERE id = :id\", { id });
  revalidatePath(\"/blog\");
  revalidatePath(\"/admin/blog\");
  revalidatePath(\"/\");
}

export default async function AdminBlogPage() {
  const posts = await getPosts();

  return (
    <div className=\"admin-page\">
      <header className=\"admin-header\">
        <h1>Blog</h1>
        <p>Gerencie os artigos e guias do blog.</p>
      </header>

      <section className=\"admin-split\">
        <div className=\"card admin-card\">
          <h2 className=\"card-title\">Novo post</h2>
          <form className=\"admin-form\" action={createPost}>
            <label>
              Título
              <input name=\"title\" placeholder=\"Guia de profissões\" />
            </label>
            <label>
              Resumo
              <textarea name=\"summary\" rows={3} />
            </label>
            <label>
              Tag
              <input name="tag" placeholder="GUIA" />
            </label>
            <label>
              Conteudo
              <textarea name="content" rows={8} placeholder="Escreva o post aqui..." />
            </label>
            <label>
              Capa (preset ou URL)
              <input name=\"cover\" placeholder=\"academy ou /uploads/blog/capa.jpg\" />
            </label>
            <label>
              Label da capa
              <input name=\"cover_label\" placeholder=\"GUIA\" />
            </label>
            <label>
              Data
              <input type=\"date\" name=\"published_at\" />
            </label>
            <label>
              Ordem
              <input type=\"number\" name=\"sort_order\" defaultValue={0} />
            </label>
            <label className=\"checkbox\">
              <input type=\"checkbox\" name=\"active\" defaultChecked />
              Ativo
            </label>
            <button className=\"btn primary\" type=\"submit\">
              Salvar post
            </button>
          </form>
        </div>

        <div className=\"card admin-card\">
          <h2 className=\"card-title\">Posts cadastrados</h2>
          <div className=\"admin-list\">
            {posts.map((post) => (
              <div key={post.id} className=\"card admin-card\">
                <form className=\"admin-form\" action={updatePost}>
                  <input type=\"hidden\" name=\"id\" value={post.id} />
                  <label>
                    Título
                    <input name=\"title\" defaultValue={post.title} />
                  </label>
                  <label>
                    Resumo
                    <textarea name=\"summary\" rows={3} defaultValue={post.summary ?? \"\"} />
                  </label>
                  <label>
                    Tag
                    <input name="tag" defaultValue={post.tag ?? ""} />
                  </label>
                  <label>
                    Conteudo
                    <textarea name="content" rows={8} defaultValue={post.content ?? ""} />
                  </label>
                  <label>
                    Capa (preset ou URL)
                    <input name=\"cover\" defaultValue={post.cover ?? \"\"} />
                  </label>
                  <label>
                    Label da capa
                    <input name=\"cover_label\" defaultValue={post.cover_label ?? \"\"} />
                  </label>
                  <label>
                    Data
                    <input
                      type=\"date\"
                      name=\"published_at\"
                      defaultValue={formatDateInput(post.published_at)}
                    />
                  </label>
                  <label>
                    Ordem
                    <input type=\"number\" name=\"sort_order\" defaultValue={post.sort_order} />
                  </label>
                  <label className=\"checkbox\">
                    <input type=\"checkbox\" name=\"active\" defaultChecked={Boolean(post.active)} />
                    Ativo
                  </label>
                  <button className=\"btn primary\" type=\"submit\">
                    Atualizar
                  </button>
                </form>
                <form action={deletePost}>
                  <input type=\"hidden\" name=\"id\" value={post.id} />
                  <button className=\"btn ghost\" type=\"submit\">
                    Remover
                  </button>
                </form>
              </div>
            ))}
            {!posts.length && <p className=\"muted\">Nenhum post cadastrado.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
