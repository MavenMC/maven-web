import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { getForumCategories } from "@/lib/site-data";
import { resolveIcon } from "@/lib/icon-map";

type PlayerAccountRow = {
  minecraft_uuid: string | null;
};

const faqItems = [
  {
    question: "Como reporto um bug?",
    answer: "Abra um tópico em Suporte com print ou vídeo e sua versão do jogo.",
  },
  {
    question: "Posso divulgar meu clã?",
    answer: "Sim, use a categoria Clãs e alianças seguindo as regras fixadas.",
  },
  {
    question: "Quando os mods respondem?",
    answer: "Em geral dentro de 24h. Em eventos, respondemos ainda mais rápido.",
  },
];

export default async function ForumPage() {
  const forumCategories = await getForumCategories();
  const session = await getServerSession(authOptions);
  const isPlayer = Boolean(session?.user?.playerId);
  const isAdminOnly = Boolean(session?.user?.adminId && !session?.user?.playerId);
  const canInteract = Boolean(isPlayer || session?.user?.adminId);
  const displayName = session?.user?.name?.split(" ")[0] ?? "Jogador";
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

  const accessTitle = canCreateTopic
    ? "Interatividade liberada"
    : canInteract
      ? "Modo leitura"
      : "Modo leitura";

  const accessStatus = canCreateTopic
    ? `Conectado como ${displayName}`
    : isAdminOnly
      ? `Acesso admin: ${displayName}`
      : needsLink
        ? "Conta conectada, falta vinculo do Minecraft"
        : "Faça login para interagir";

  const accessDescription = canCreateTopic
    ? "Suas interações ficam vinculadas ao seu perfil no Maven."
    : needsLink
      ? "Vincule sua conta Minecraft para criar topicos."
      : isAdminOnly
        ? "A conta administrativa tem acesso apenas de leitura no forum."
        : "Sem login voce pode apenas visualizar o conteudo do forum.";

  const accessNote = canCreateTopic
    ? "Crie um novo topico para iniciar a conversa."
    : needsLink
      ? "Finalize o vinculo do Minecraft para desbloquear postagens."
      : isAdminOnly
        ? "Use uma conta de jogador para publicar topicos."
        : "Entre com Discord para desbloquear novos topicos.";

  const primaryAction = canCreateTopic
    ? { href: "/forum/novo", label: "Novo topico" }
    : needsLink
    ? { href: "/perfil#vinculo", label: "Vincular conta" }
      : isAdminOnly
        ? { href: "/admin", label: "Painel admin" }
        : { href: "/login", label: "Fazer login" };

  const secondaryAction = canCreateTopic || needsLink
    ? { href: "/perfil", label: "Meu perfil", external: false }
    : isAdminOnly
      ? { href: "/login", label: "Entrar com Discord", external: false }
      : { href: "https://discord.gg/mvn", label: "Discord", external: true };

  return (
    <>
      <section className="section">
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

          <div className="forum-hero">
            <div className="forum-hero-copy">
              <span className="section-kicker">Interatividade</span>
              <h2>Crie topicos e colabore</h2>
              <p className="muted">
                O conteudo e publico, mas apenas contas logadas podem criar topicos.
              </p>
              <div className="forum-pill-group">
                <span className="forum-pill">Moderação ativa</span>
                <span className="forum-pill">Regras claras</span>
                <span className="forum-pill">Respostas rápidas</span>
              </div>
            </div>

            <div className={`card forum-access ${canCreateTopic ? "is-active" : "is-locked"}`}>
              <div className="forum-access-header">
                <span className="forum-pill">
                  {accessTitle}
                </span>
                <span className="forum-access-status">
                  {accessStatus}
                </span>
              </div>
              <p className="muted">{accessDescription}</p>
              <div className="forum-access-actions">
                <Link href={primaryAction.href} className="btn primary btn-sm">
                  {primaryAction.label}
                </Link>
                {secondaryAction.external ? (
                  <a
                    href={secondaryAction.href}
                    className="btn secondary btn-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {secondaryAction.label}
                  </a>
                ) : (
                  <Link href={secondaryAction.href} className="btn ghost btn-sm">
                    {secondaryAction.label}
                  </Link>
                )}
              </div>
              <p className="forum-access-note">{accessNote}</p>
            </div>
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
                <p className="muted">Nenhuma categoria publicada ainda.</p>
              </div>
            )}
          </div>

          <div className="section-header">
            <div>
              <span className="section-kicker">FAQ</span>
              <h2>Dúvidas rápidas</h2>
            </div>
          </div>

          <div className="faq-accordion">
            {faqItems.map((item) => (
              <details key={item.question} className="card faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="cta-strip">
            <div>
              <strong>Quer abrir um tópico?</strong>
              <p className="muted">Use o fórum para reportar bugs e trocar ideias.</p>
            </div>
            <Link href={primaryAction.href} className="btn primary btn-sm">
              {primaryAction.label}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
