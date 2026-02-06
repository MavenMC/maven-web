import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { getDiscordStats } from "@/lib/discord";
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
    getSitePosts("blog", 4),
    getSitePosts("patch", 4),
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
      <section id="inicio" className="hero">
        <div className="hero-grid-bg grid-background" aria-hidden="true" />
        <div className="hero-side-card card small">
          <span className="card-eyebrow">IP do servidor</span>
          <h3>mavenmc.com.br</h3>
          <p className="card-sub">Bedrock: play.mavenmc.com.br</p>
        </div>

        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-copy-content">
              <span className="pill">Java + Bedrock</span>
              <h1>
                Bem-vindo ao <span className="gradient-text">MavenMC</span>
              </h1>
              <p>
                Um servidor survival com RPG, economia ativa e eventos constantes. Tudo conectado ao
                nosso ecossistema para você acompanhar notícias, patch notes e a vida da comunidade.
              </p>

              <div className="hero-actions">
                <Link href="/validar" className="btn primary">
                  Jogar agora
                </Link>
                <a href="/noticias" className="btn secondary">
                  Ver notícias
                </a>
              </div>

              <div className="hero-features">
                <div>
                  <div className="feature-title">Atualizações semanais</div>
                  <div className="feature-text">Patch notes e changelogs sempre atualizados.</div>
                </div>
                <div>
                  <div className="feature-title">Comunidade ativa</div>
                  <div className="feature-text">Fórum, eventos e suporte todos os dias.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-logo-container">
              <Image src="/logo.png" alt="Logo do MavenMC" fill className="hero-logo" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.length ? (
              stats.map((stat) => (
                <div key={stat.id} className="card">
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

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Comunidade</span>
              <h2>Fique conectado</h2>
              <p className="muted">
                Acompanhe conteúdos, avisos e eventos em nossas redes oficiais.
              </p>
            </div>
            <a href="https://discord.gg/mvn" className="btn secondary" target="_blank" rel="noreferrer">
              Entrar no Discord
            </a>
          </div>

          <div className="feature-grid">
            <div className="card social-card">
              <span className="card-eyebrow">Redes oficiais</span>
              <h3 className="card-title">Stay Connected</h3>
              <p className="card-sub">
                Siga o Maven Network para não perder anúncios, lives e novidades.
              </p>

              <div className="social-links">
                {primarySocials.length ? (
                  primarySocials.map((link) => {
                    const Icon = resolveIcon(link.icon, MessageSquare);
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        className="social-button"
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.label}
                        title={link.label}
                      >
                        <Icon className="icon" />
                      </a>
                    );
                  })
                ) : (
                  <span className="muted">Configure as redes no painel.</span>
                )}
              </div>

              <p className="muted">Participe também dos sorteios mensais no Discord.</p>
            </div>

            <div className="discord-widget">
              <div className="discord-widget-top">
                <div className="discord-widget-meta">
                  <div className="discord-widget-icon">
                    <Users className="icon"/>
                  </div>
                  <div>
                    <div className="discord-widget-count">{membersOnline}</div>
                    <div className="discord-widget-label">Members Online</div>
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
                Join Our Discord
                <span className="discord-widget-arrow">›</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="noticias" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Notícias</span>
              <h2>Últimas do servidor</h2>
              <p className="muted">
                Fique por dentro de eventos, atualizações e o que vem por aí.
              </p>
            </div>
            <a href="/forum" className="btn secondary">
              Participar da comunidade
            </a>
          </div>

          <div className="category-compact-grid">
            {newsItems.length ? (
              newsItems.map((news) => (
                <article key={news.id} className="card category-compact-card">
                  <div className={`category-visual ${news.cover ?? ""}`}>
                    <span>{news.tag || news.cover_label || "NEWS"}</span>
                  </div>
                  <div className="category-compact-content">
                    <span className="card-eyebrow">
                      {formatShortDate(news.published_at) || "Sem data"}
                    </span>
                    <h3>{news.title}</h3>
                    <p>{news.summary ?? "Atualização publicada pela equipe Maven."}</p>
                    <div className="category-action">
                      <a href="/blog" className="btn ghost btn-sm">
                        Ler detalhes
                      </a>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>Sem notícias</h3>
                <p className="muted">Ainda não há comunicados publicados.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="blog" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Blog</span>
              <h2>Guias, bastidores e histórias</h2>
              <p className="muted">
                Conteúdo feito pela equipe para você dominar o servidor.
              </p>
            </div>
            <a href="/equipe" className="btn secondary">
              Entrar para a equipe
            </a>
          </div>

          <div className="blog-grid">
            {blogPosts.length ? (
              blogPosts.map((post) => (
                <article key={post.id} className="card blog-card">
                  <div className={`blog-cover ${post.cover ?? ""}`}>
                    {post.cover_label || post.tag || "BLOG"}
                  </div>
                  <div>
                    <span className="card-eyebrow">
                      {formatShortDate(post.published_at) || "Sem data"}
                    </span>
                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-sub">{post.summary ?? "Conteúdo novo no blog."}</p>
                  </div>
                  <a href="/forum" className="btn ghost btn-sm">
                    Ler artigo
                  </a>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>Sem posts</h3>
                <p className="muted">Cadastre posts do blog no painel.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="equipe" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Equipe</span>
              <h2>Formulário de recrutamento</h2>
              <p className="muted">
                Quer ajudar a construir o servidor? Conte sobre você e suas habilidades.
              </p>
            </div>
            <a href="/forum" className="btn secondary">
              Tirar dúvidas no fórum
            </a>
          </div>

          <div className="feature-grid">
            <div className="card">
              <h3 className="card-title">Candidatura</h3>
              <p className="card-sub">
                Preencha os campos abaixo. Entraremos em contato pelo Discord.
              </p>

              <form className="admin-form">
                <div className="admin-form-grid">
                  <label>
                    Nome no jogo
                    <input type="text" placeholder="Seu nick" />
                  </label>
                  <label>
                    Usuário do Discord
                    <input type="text" placeholder="@seuusuario" />
                  </label>
                  <label>
                    Idade
                    <input type="number" placeholder="16" />
                  </label>
                  <label>
                    Função desejada
                    <select defaultValue="">
                      <option value="" disabled>
                        Selecione uma opção
                      </option>
                      <option value="mod">Moderação</option>
                      <option value="builder">Builder</option>
                      <option value="support">Suporte</option>
                      <option value="content">Conteúdo</option>
                    </select>
                  </label>
                </div>

                <label>
                  Experiência no servidor
                  <textarea rows={4} placeholder="Conte um pouco sobre sua trajetória." />
                </label>

                <label>
                  Disponibilidade semanal
                  <textarea rows={3} placeholder="Dias e horários que você consegue ajudar." />
                </label>

                <label className="checkbox">
                  <input type="checkbox" /> Li e concordo com as regras da equipe.
                </label>

                <button type="button" className="btn primary">
                  Enviar candidatura
                </button>
              </form>
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
                <a href="/forum" className="btn secondary btn-sm">
                  Fórum
                </a>
              </div>
            </div>
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
            <a href="/patch-notes" className="btn secondary">
              Ver patch notes
            </a>
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

      <section id="patch-notes" className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Patch Notes</span>
              <h2>Notas de atualização</h2>
              <p className="muted">
                Pequenos ajustes e melhorias semanais em um formato rápido.
              </p>
            </div>
            <a href="/forum" className="btn secondary">
              Reportar bug
            </a>
          </div>

          <div className="blog-grid">
            {patchNotes.length ? (
              patchNotes.map((note) => (
                <article key={note.id} className="card blog-card">
                  <div className={`blog-cover ${note.cover ?? ""}`}>
                    {note.cover_label || note.tag || "PATCH"}
                  </div>
                  <div>
                    <span className="card-eyebrow">
                      {formatShortDate(note.published_at) || "Sem data"}
                    </span>
                    <h3 className="card-title">{note.title}</h3>
                    <p className="card-sub">{note.summary ?? "Atualização rápida do servidor."}</p>
                  </div>
                  <a href="/forum" className="btn ghost btn-sm">
                    Discutir no fórum
                  </a>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>Sem patches</h3>
                <p className="muted">Cadastre patch notes para aparecerem aqui.</p>
              </div>
            )}
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
                    <a href="/forum" className="btn ghost btn-sm">
                      Ver tópicos
                    </a>
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
            <a href="/forum" className="btn primary btn-sm">
              Acessar fórum
            </a>
          </div>
        </div>
      </section>

    </>
  );
}
