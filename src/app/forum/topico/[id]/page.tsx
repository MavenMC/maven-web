import Link from "next/link";
import { notFound } from "next/navigation";
import { formatShortDate } from "@/lib/date";
import { getForumPostById } from "@/lib/site-data";

function splitParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getAuthorDisplay(authorAlias: string | null, authorNick: string | null) {
  const displayName = authorAlias?.trim() || authorNick?.trim() || "Jogador";
  const profileHref = authorNick ? `/perfil/${encodeURIComponent(authorNick)}` : null;
  return { displayName, profileHref };
}

export default async function ForumTopicPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const post = await getForumPostById(id);
  if (!post) {
    notFound();
  }

  const paragraphs = splitParagraphs(post.content ?? "");
  const author = getAuthorDisplay(post.author_alias, post.author_nick);
  const categoryHref = `/forum/${post.category_id}`;

  return (
    <section className="section">
      <div className="container post-shell">
        <Link href={categoryHref} className="btn ghost btn-sm post-back">
          Voltar ao forum
        </Link>

        <header className="post-header">
          <div className="post-meta">
            <span>{formatShortDate(post.created_at) || "Sem data"}</span>
            {post.category_title && (
              <Link href={categoryHref} className="post-tag">
                {post.category_title}
              </Link>
            )}
            <span>
              Por{" "}
              {author.profileHref ? (
                <Link href={author.profileHref}>{author.displayName}</Link>
              ) : (
                author.displayName
              )}
            </span>
          </div>
          <h1 className="post-title">{post.title}</h1>
        </header>

        <article className="post-content">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => {
              const lines = paragraph.split("\n").filter(Boolean);
              return (
                <p key={index}>
                  {lines.map((line, lineIndex) => (
                    <span key={lineIndex}>
                      {line}
                      {lineIndex < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              );
            })
          ) : (
            <p className="muted">Conteudo em breve.</p>
          )}
        </article>

        <div className="card forum-reply-card">
          <div>
            <strong>Respostas em breve</strong>
            <p className="muted">
              Estamos preparando comentarios neste forum. Enquanto isso, abra outro topico ou
              confira outras categorias.
            </p>
          </div>
          <Link href={categoryHref} className="btn ghost btn-sm">
            Ver mais topicos
          </Link>
        </div>
      </div>
    </section>
  );
}
