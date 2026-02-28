import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { getDiscordStats } from "@/lib/discord";
import HomeMinecraftShowcase from "@/components/HomeMinecraftShowcase";
import {
  getChangelogEntries,
  getForumCategories,
  getSitePosts,
  getSiteStats,
  getSocialLinks,
} from "@/lib/site-data";
import { formatShortDate } from "@/lib/date";
import { resolveIcon } from "@/lib/icon-map";

export default async function Home() {
  const [
    discord,
    stats,
    newsItems,
    blogPosts,
    patchNotes,
    changelogItems,
    forumCategories,
    socialLinks,
  ] = await Promise.all([
    getDiscordStats(),
    getSiteStats(4),
    getSitePosts("news", 3),
    getSitePosts("blog", 3),
    getSitePosts("patch", 3),
    getChangelogEntries(3),
    getForumCategories(6),
    getSocialLinks(),
  ]);

  const membersOnline =
    discord.membersOnline === null ? "-" : discord.membersOnline.toLocaleString("pt-BR");
  const primarySocials = socialLinks.slice(0, 4);

  const parseItems = (itemsJson: string | null) => {
    if (!itemsJson) return [];
    try {
      const parsed = JSON.parse(itemsJson);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return itemsJson
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  return (
    <>
      <HomeMinecraftShowcase membersOnline={membersOnline} />

      <section className="section home-stats">
        <div className="container">
          <div className="home-stats-header">
            <div>
              <span className="section-kicker">Essência do servidor</span>
              <h2>Números que provam a jornada</h2>
              <p className="muted">Cada temporada deixa uma história nova para contar.</p>
            </div>
            <Link href="/changelog" className="btn ghost btn-sm">
              Ver tudo
            </Link>
          </div>
          <div className="home-stats-grid">
            {stats.length ? (
              stats.map((stat) => (
                <div key={stat.id} className="card home-stat-card">
                  <h3>{stat.value}</h3>
                  <p className="muted">{stat.label}</p>
                </div>
              ))
            ) : (
              <div className="card">
                <h3>Sem dados</h3>
                <p className="muted">Cadastre estatísticas no painel.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section home-updates">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Atualizações</span>
              <h2>O que está acontecendo agora</h2>
              <p className="muted">Notícias, novidades e patches em um só lugar.</p>
            </div>
            <Link href="/noticias" className="btn secondary">
              Ver central de notícias
            </Link>
          </div>

          <div className="home-updates-grid">
            <div className="card home-updates-card">
              <div className="home-updates-head">
                <div>
                  <span className="card-eyebrow">Notícias</span>
                  <h3 className="card-title">Últimos avisos</h3>
                </div>
                <Link href="/noticias" className="btn ghost btn-sm">
                  Ver todas
                </Link>
              </div>
              <div className="home-updates-list">
                {newsItems.length ? (
                  newsItems.map((news) => (
                    <article key={news.id} className="home-update-item">
                      <div>
                        <span className="home-update-date">
                          {formatShortDate(news.published_at) || "Sem data"}
                        </span>
                        <strong className="home-update-title">{news.title}</strong>
                        <p className="home-update-text">
                          {news.summary ?? "Atualização publicada pela equipe Maven."}
                        </p>
                      </div>
                      <Link href="/noticias" className="btn ghost btn-sm">
                        Abrir
                      </Link>
                    </article>
                  ))
                ) : (
                  <p className="muted">Nenhum comunicado publicado ainda.</p>
                )}
              </div>
            </div>

            <div className="card home-updates-card">
              <div className="home-updates-head">
                <div>
                  <span className="card-eyebrow">Blog</span>
                  <h3 className="card-title">Guias e histórias</h3>
                </div>
                <Link href="/blog" className="btn ghost btn-sm">
                  Ver blog
                </Link>
              </div>
              <div className="home-updates-list">
                {blogPosts.length ? (
                  blogPosts.map((post) => (
                    <article key={post.id} className="home-update-item">
                      <div>
                        <span className="home-update-date">
                          {formatShortDate(post.published_at) || "Sem data"}
                        </span>
                        <strong className="home-update-title">{post.title}</strong>
                        <p className="home-update-text">
                          {post.summary ?? "Conteúdo novo no blog."}
                        </p>
                      </div>
                      <Link href={`/blog/${post.id}`} className="btn ghost btn-sm">
                        Ler
                      </Link>
                    </article>
                  ))
                ) : (
                  <p className="muted">Nenhum post publicado ainda.</p>
                )}
              </div>
            </div>

            <div className="card home-updates-card">
              <div className="home-updates-head">
                <div>
                  <span className="card-eyebrow">Patch Notes</span>
                  <h3 className="card-title">Ajustes semanais</h3>
                </div>
                <Link href="/patch-notes" className="btn ghost btn-sm">
                  Ver patches
                </Link>
              </div>
              <div className="home-updates-list">
                {patchNotes.length ? (
                  patchNotes.map((note) => (
                    <article key={note.id} className="home-update-item">
                      <div>
                        <span className="home-update-date">
                          {formatShortDate(note.published_at) || "Sem data"}
                        </span>
                        <strong className="home-update-title">{note.title}</strong>
                        <p className="home-update-text">
                          {note.summary ?? "Atualização rápida do servidor."}
                        </p>
                      </div>
                      <Link href="/patch-notes" className="btn ghost btn-sm">
                        Ver
                      </Link>
                    </article>
                  ))
                ) : (
                  <p className="muted">Nenhuma nota publicada ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-community">
        <div className="container">
          <div className="home-community-grid">
            <div className="home-community-copy">
              <span className="section-kicker">Comunidade</span>
              <h2>O rosto do servidor vive aqui</h2>
              <p className="muted">
                Participe das discussões, receba avisos em primeira mão e acompanhe as lives da equipe.
              </p>
              <div className="home-community-actions">
                <a href="https://discord.gg/mvn" className="btn primary" target="_blank" rel="noreferrer">
                  Entrar no Discord
                </a>
                <Link href="/noticias" className="btn ghost">
                  Ver notícias
                </Link>
              </div>

              <div className="home-community-links">
                {primarySocials.length ? (
                  primarySocials.map((link) => {
                    const Icon = resolveIcon(link.icon, MessageSquare);
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        className="home-community-link"
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.label}
                        title={link.label}
                      >
                        <Icon className="icon" />
                        <span>{link.label}</span>
                      </a>
                    );
                  })
                ) : (
                  <span className="muted">Configure as redes no painel.</span>
                )}
              </div>
            </div>

            <div className="discord-widget home-discord">
              <div className="discord-widget-top">
                <div className="discord-widget-meta">
                  <div className="discord-widget-icon">
                    <Users className="icon" />
                  </div>
                  <div>
                    <div className="discord-widget-count">{membersOnline}</div>
                    <div className="discord-widget-label">Membros online</div>
                  </div>
                </div>
                <img src="/discord.svg" alt="Discord" className="discord-widget-logo" />
              </div>
              <a
                href={discord.inviteUrl}
                className="discord-widget-button"
                target="_blank"
                rel="noreferrer"
              >
                Entrar no Discord
                <span className="discord-widget-arrow">›</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="forum" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Fórum</span>
              <h2>Conecte-se com a comunidade</h2>
              <p className="muted">
                Sugestões, suporte e networking entre jogadores em um só lugar.
              </p>
            </div>
            <a href="https://discord.gg/mvn" className="btn secondary" target="_blank" rel="noreferrer">
              Entrar no Discord
            </a>
          </div>

          <div className="service-grid">
            {forumCategories.length ? (
              forumCategories.map((category) => {
                const Icon = resolveIcon(category.icon, MessageSquare);
                return (
                  <article key={category.id} className="card service-card">
                    <div className={`service-icon ${category.variant || ""}`}>
                      <Icon />
                    </div>
                    <h3>{category.title}</h3>
                    <p>{category.description ?? "Acompanhe as discussões do servidor."}</p>
                    <Link href={`/forum/${category.id}`} className="btn ghost btn-sm">
                      Ver tópicos
                    </Link>
                  </article>
                );
              })
            ) : (
              <div className="card">
                <h3>Sem categorias</h3>
                <p className="muted">Cadastre categorias no painel.</p>
              </div>
            )}
          </div>

          <div className="cta-strip">
            <div>
              <strong>Quer abrir um tópico?</strong>
              <p className="muted">Use o fórum para reportar bugs e trocar ideias.</p>
            </div>
            <Link href="/forum" className="btn primary btn-sm">
              Acessar fórum
            </Link>
          </div>
        </div>
      </section>

      <section id="changelog" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Changelog</span>
              <h2>Histórico de alterações</h2>
              <p className="muted">
                Tudo o que mudou no servidor, organizado por versão.
              </p>
            </div>
            <Link href="/patch-notes" className="btn secondary">
              Ver patch notes
            </Link>
          </div>

          <div className="category-grid">
            {changelogItems.length ? (
              changelogItems.map((item) => (
                <article key={item.id} className="card">
                  <span className="card-eyebrow">
                    {item.version} • {formatShortDate(item.published_at) || "Sem data"}
                  </span>
                  <h3 className="card-title">{item.title}</h3>
                  <div>
                    {parseItems(item.items_json).map((entry) => (
                      <p key={entry} className="card-sub">
                        • {entry}
                      </p>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>Sem changelog</h3>
                <p className="muted">Adicione entradas no painel administrativo.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="equipe" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Trabalhe Conosco</span>
              <h2>Faça parte da equipe</h2>
              <p className="muted">
                Quer ajudar a construir o servidor? Mostre suas habilidades no formulário.
              </p>
            </div>
            <Link href="/forum" className="btn secondary">
              Tirar dúvidas no fórum
            </Link>
          </div>

          <div className="feature-grid">
            <div className="card">
              <h3 className="card-title">Trabalhe Conosco</h3>
              <p className="card-sub">
                O formulário agora fica em uma página dedicada com validação de conta vinculada.
              </p>
              <Link href="/trabalhe-conosco" className="btn primary btn-sm">
                Abrir formulário
              </Link>
              <p className="muted">É necessário ter a conta Minecraft vinculada.</p>
            </div>

            <div className="card">
              <span className="card-eyebrow">Requisitos</span>
              <h3 className="card-title">O que procuramos</h3>
              <p className="card-sub">
                Pessoas comprometidas, educadas e que curtam trabalhar em equipe.
              </p>
              <div>
                <p className="card-sub">• Disponibilidade mínima de 6h semanais.</p>
                <p className="card-sub">• Ter 14+ anos e maturidade.</p>
                <p className="card-sub">• Conhecimento básico das regras.</p>
                <p className="card-sub">• Boa comunicação no Discord.</p>
              </div>

              <div className="cta-strip">
                <div>
                  <strong>Precisa de ajuda?</strong>
                  <p className="muted">Abra um tópico no fórum para conversar com o staff.</p>
                </div>
                <Link href="/forum" className="btn secondary btn-sm">
                  Fórum
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
