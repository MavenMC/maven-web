"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { SitePost } from "@/lib/site-data";
import { getPostCoverProps } from "@/lib/post-cover";
import { formatShortDate } from "@/lib/date";

type Props = {
  posts: SitePost[];
};

export default function HomeBlogCarousel({ posts }: Props) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (animating) return;
      setAnimating(true);
      setActive((index + posts.length) % posts.length);
      setTimeout(() => setAnimating(false), 400);
    },
    [animating, posts.length],
  );

  const prev = () => goTo(active - 1);
  const next = () => goTo(active + 1);

  useEffect(() => {
    if (posts.length <= 1) return;
    const timer = setInterval(() => goTo(active + 1), 7000);
    return () => clearInterval(timer);
  }, [active, goTo, posts.length]);

  if (!posts.length) return null;

  const post = posts[active];
  const coverProps = getPostCoverProps(post.cover);
  const eyebrow = post.cover_label || post.tag || "Blog";

  return (
    <section className="home-blog-carousel">
      <div className="container">
        <div className={`home-blog-inner${animating ? " home-blog-animating" : ""}`}>
          {/* Copy */}
          <div className="home-blog-copy">
            <span className="section-kicker">{eyebrow}</span>
            <h2 className="home-blog-title">{post.title}</h2>
            <p className="home-blog-date">{formatShortDate(post.published_at)}</p>
            <p className="home-blog-summary">
              {post.summary ?? "Novo conteúdo publicado pela equipe Maven."}
            </p>
            <Link href={`/blog/${post.id}`} className="home-blog-readmore">
              Ler mais <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Cover */}
          <div className="home-blog-visual">
            <div
              className={`home-blog-cover ${coverProps.className}`}
              style={coverProps.style}
            >
              {!coverProps.isImage && (
                <span>{post.cover_label || post.tag || "BLOG"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="home-blog-nav">
          {posts.length > 1 && (
            <button className="home-blog-arrow" onClick={prev} aria-label="Post anterior">
              ←
            </button>
          )}

          <div className="home-blog-dots">
            {posts.map((_, i) => (
              <button
                key={i}
                className={`home-blog-dot${i === active ? " active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Post ${i + 1}`}
              />
            ))}
          </div>

          {posts.length > 1 && (
            <button className="home-blog-arrow" onClick={next} aria-label="Próximo post">
              →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
