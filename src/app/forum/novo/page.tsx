import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { getForumCategories } from "@/lib/site-data";

const TITLE_LIMIT = 200;
const CONTENT_LIMIT = 5000;

type PlayerAccountRow = {
  minecraft_uuid: string | null;
};

type InsertResult = {
  insertId: number;
};

type NickRow = {
  current_nick: string | null;
};

function sanitizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

async function createTopic(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.playerId) {
    redirect("/login");
  }

  const playerRows = await dbQuery<PlayerAccountRow[]>(
    "SELECT minecraft_uuid FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: session.user.playerId },
  );

  const authorUuid = playerRows[0]?.minecraft_uuid ?? null;
  if (!authorUuid) {
    redirect("/perfil#vinculo");
  }

  const categoryId = Number(formData.get("category_id") || 0);
  const title = sanitizeText(String(formData.get("title") || ""), TITLE_LIMIT);
  const content = sanitizeText(String(formData.get("content") || ""), CONTENT_LIMIT);

  if (!Number.isFinite(categoryId) || categoryId <= 0 || !title || !content) {
    return;
  }

  const categoryRows = await dbQuery<{ id: number }[]>(
    "SELECT id FROM site_forum_categories WHERE id = :id AND active = 1 LIMIT 1",
    { id: categoryId },
  );

  if (!categoryRows.length) {
    return;
  }

  const result = await dbQuery<InsertResult>(
    `INSERT INTO site_forum_posts (category_id, author_uuid, title, content, active)
     VALUES (:category_id, :author_uuid, :title, :content, 1)`,
    { category_id: categoryId, author_uuid: authorUuid, title, content },
  );

  revalidatePath("/forum");
  revalidatePath(`/forum/${categoryId}`);
  revalidatePath("/perfil");

  const nickRows = await dbQuery<NickRow[]>(
    "SELECT current_nick FROM account_stats WHERE uuid = :uuid LIMIT 1",
    { uuid: authorUuid },
  );
  const authorNick = nickRows[0]?.current_nick ?? null;
  if (authorNick) {
    revalidatePath(`/perfil/${authorNick}`);
  }

  const postId = result.insertId;
  if (postId) {
    revalidatePath(`/forum/topico/${postId}`);
    redirect(`/forum/topico/${postId}`);
  }

  redirect(`/forum/${categoryId}`);
}

export default async function ForumNewPage({
  searchParams,
}: {
  searchParams?: { categoria?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.playerId) {
    redirect("/login");
  }

  const playerRows = await dbQuery<PlayerAccountRow[]>(
    "SELECT minecraft_uuid FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: session.user.playerId },
  );

  if (!playerRows[0]?.minecraft_uuid) {
    redirect("/perfil#vinculo");
  }

  const categories = await getForumCategories();
  const preferredId = Number(searchParams?.categoria ?? 0);
  const selectedCategoryId = categories.some((category) => category.id === preferredId)
    ? preferredId
    : categories[0]?.id ?? "";

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Forum</span>
            <h2>Novo topico</h2>
            <p className="muted">
              Compartilhe sugestoes, duvidas ou relatorios com a comunidade Maven.
            </p>
          </div>
          <Link href="/forum" className="btn secondary">
            Voltar ao forum
          </Link>
        </div>

        {categories.length ? (
          <div className="feature-grid">
            <div className="card forum-guidelines">
              <span className="card-eyebrow">Antes de postar</span>
              <h3 className="card-title">Deixe o topico claro</h3>
              <p className="card-sub">
                Seja objetivo no titulo e inclua detalhes que ajudem outros jogadores.
              </p>
              <ul>
                <li>Explique o contexto e o que voce tentou.</li>
                <li>Inclua prints ou videos quando for bug.</li>
                <li>Respeite as regras e evite flood.</li>
              </ul>
            </div>

            <div className="card">
              <h3 className="card-title">Publicar topico</h3>
              <form className="forum-form" action={createTopic}>
                <label>
                  Categoria
                  <select name="category_id" defaultValue={selectedCategoryId} required>
                    <option value="" disabled>
                      Selecione uma categoria
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Titulo
                  <input
                    name="title"
                    type="text"
                    placeholder="Ex: Duvida sobre o novo evento"
                    maxLength={TITLE_LIMIT}
                    required
                  />
                </label>

                <label>
                  Conteudo
                  <textarea
                    name="content"
                    rows={8}
                    placeholder="Descreva o seu topico com detalhes."
                    maxLength={CONTENT_LIMIT}
                    required
                  />
                </label>

                <button type="submit" className="btn primary">
                  Publicar topico
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>Sem categorias</h3>
            <p className="muted">
              Nenhuma categoria foi configurada ainda. Aguarde a equipe liberar o forum.
            </p>
            <Link href="/forum" className="btn ghost btn-sm">
              Voltar ao forum
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
