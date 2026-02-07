import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { formatShortDate } from "@/lib/date";
import { buildSummary } from "@/lib/post-utils";
import { resolveIcon } from "@/lib/icon-map";
import { getForumCategoryById, getForumPostsByCategory } from "@/lib/site-data";

type PlayerAccountRow = {
  minecraft_uuid: string | null;
};

function getAuthorDisplay(authorAlias: string | null, authorNick: string | null) {
  const displayName = authorAlias?.trim() || authorNick?.trim() || "Jogador";
  const profileHref = authorNick ? `/perfil/${encodeURIComponent(authorNick)}` : null;
  return { displayName, profileHref };
}

export default async function ForumCategoryPage({ params }: { params: { id: string } }) {
  const categoryId = Number(params.id);
  if (!Number.isFinite(categoryId)) {
    notFound();
  }

  const category = await getForumCategoryById(categoryId);
  if (!category) {
    notFound();
  }

  const posts = await getForumPostsByCategory(categoryId, 60);
  const session = await getServerSession(authOptions);
  const isPlayer = Boolean(session?.user?.playerId);
  let hasMinecraft = false;

  if (session?.user?.playerId) {
    const playerRows = await dbQuery<PlayerAccountRow[]>(
      "SELECT minecraft_uuid FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
      { discord_id: session.user.playerId },
    );
    hasMinecraft = Boolean(playerRows[0]?.minecraft_uuid);
  }

  const canCreateTopic = Boolean(isPlayer && hasMinecraft);
  const needsLink = Boolean(isPlayer && !hasMinecraft);
  const createHref = canCreateTopic
    ? `/forum/novo?categoria=${categoryId}`
    : needsLink
    ? "/perfil#vinculo"
      : "/login";
  const createLabel = canCreateTopic
    ? "Novo topico"
    : needsLink
      ? "Vincular conta"
      : "Fazer login";

  const Icon = resolveIcon(category.icon, MessageSquare);

  return (
    <section className="section">
      <div className="container">
        <div className="forum-category-header">
          <div className="forum-category-info">
            <div className={`service-icon ${category.variant || ""}`}>
              <Icon />
            </div>
            <div>
              <span className="section-kicker">Categoria</span>
              <h2>{category.title}</h2>
              <p className="muted">
                {category.description ?? "Acompanhe as discussões do servidor."}
              </p>
              <div className="forum-category-meta">
                <span>{posts.length} topicos</span>
              </div>
            </div>
          </div>
          <Link href="/forum" className="btn ghost btn-sm">
            Voltar ao forum
          </Link>
        </div>

        <div className="cta-strip">
          <div>
            <strong>Quer abrir um topico?</strong>
            <p className="muted">Compartilhe sua duvida, sugestao ou relato.</p>
          </div>
          <Link href={createHref} className="btn primary btn-sm">
            {createLabel}
          </Link>
        </div>

        <div className="forum-topic-list">
          {posts.length ? (
            posts.map((post) => {
              const excerpt = buildSummary(null, post.content);
              const author = getAuthorDisplay(post.author_alias, post.author_nick);

              return (
                <article key={post.id} className="card forum-topic-card">
                  <div className="forum-topic-head">
                    <div>
                      <span className="card-eyebrow">
                        {formatShortDate(post.created_at) || "Sem data"}
                      </span>
                      <h3 className="forum-topic-title">{post.title}</h3>
                    </div>
                    <Link href={`/forum/topico/${post.id}`} className="btn ghost btn-sm">
                      Ler topico
                    </Link>
                  </div>
                  {excerpt && <p className="forum-topic-excerpt">{excerpt}</p>}
                  <div className="forum-topic-meta">
                    <span>Por</span>
                    {author.profileHref ? (
                      <Link href={author.profileHref}>{author.displayName}</Link>
                    ) : (
                      <span>{author.displayName}</span>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="card">
              <h3>Sem topicos</h3>
              <p className="muted">Nenhum topico publicado nesta categoria.</p>
              <Link href={createHref} className="btn ghost btn-sm">
                {createLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
