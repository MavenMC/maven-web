import Link from "next/link";
import { getSitePosts } from "@/lib/site-data";
import { formatShortDate } from "@/lib/date";
import { getPostCoverProps } from "@/lib/post-cover";

export default async function BlogPage() {
  const blogPosts = await getSitePosts("blog");

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="blog-header">
            <span className="section-kicker">Blog</span>
            <h2>Conteúdos para dominar o servidor</h2>
            <p>Guias, bastidores e novidades escritas pela equipe Maven.</p>
          </div>

          <div className="blog-grid">
            {blogPosts.length ? (
              blogPosts.map((post) => (
                <article key={post.id} className="card blog-card">
                  <div className={getPostCoverProps(post.cover).className} style={getPostCoverProps(post.cover).style}>
                    {post.cover_label || post.tag || "BLOG"}
                  </div>
                  <div>
                    <span className="card-eyebrow">
                      {formatShortDate(post.published_at) || "Sem data"}
                    </span>
                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-sub">{post.summary ?? "Conteúdo novo no blog."}</p>
                  </div>
                  <Link href={`/blog/${post.id}`} className="btn ghost btn-sm">
                    Ler artigo
                  </Link>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>Sem posts</h3>
                <p className="muted">Nenhum post publicado ainda.</p>
              </div>
            )}
          </div>

          <div className="blog-footer">
            <div className="blog-strip">
              <div>
                <strong>Quer sugerir um tema?</strong>
                <p className="muted">Abra um tópico e nossa equipe escreve sobre isso.</p>
              </div>
              <Link href="/forum" className="btn secondary btn-sm">
                Sugerir tema
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
