import Link from "next/link";
import { notFound } from "next/navigation";
import { getSitePostById } from "@/lib/site-data";
import { formatShortDate } from "@/lib/date";
import { getPostCoverProps } from "@/lib/post-cover";

type PageProps = {
  params: { id: string };
};

function estimateReadingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min de leitura`;
}

function splitParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default async function BlogPostPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const post = await getSitePostById(id, "blog");
  if (!post) notFound();

  const content = post.content ?? post.summary ?? "";
  const paragraphs = splitParagraphs(content);
  const readingTime = estimateReadingTime(content);
  const coverProps = getPostCoverProps(post.cover);
  const coverLabel = post.cover_label || post.tag || "BLOG";

  return (
    <section className="section">
      <div className="container post-shell">
        <Link href="/blog" className="btn ghost btn-sm post-back">
          Voltar ao blog
        </Link>

        <header className="post-header">
          <div className="post-meta">
            <span>{formatShortDate(post.published_at) || "Sem data"}</span>
            {post.tag && <span className="post-tag">{post.tag}</span>}
            {readingTime && <span>{readingTime}</span>}
          </div>
          <h1 className="post-title">{post.title}</h1>
          {post.summary && <p className="post-summary">{post.summary}</p>}
        </header>

        <div className={`${coverProps.className} post-cover`} style={coverProps.style}>
          {coverLabel}
        </div>

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
            <p className="muted">Conteúdo em breve.</p>
          )}
        </article>
      </div>
    </section>
  );
}
