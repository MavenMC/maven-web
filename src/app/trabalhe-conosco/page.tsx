import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";

type PlayerRow = {
  minecraft_uuid: string | null;
  minecraft_name: string | null;
};

export default async function TrabalheConoscoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.playerId) {
    return (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Trabalhe Conosco</span>
              <h2>Conecte seu Discord</h2>
              <p className="muted">
                Para enviar a candidatura, primeiro conecte sua conta Discord.
              </p>
            </div>
            <Link href="/login" className="btn primary">
              Entrar com Discord
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const playerRows = await dbQuery<PlayerRow[]>(
    "SELECT minecraft_uuid, minecraft_name FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: session.user.playerId },
  );
  const player = playerRows[0] ?? null;

  if (!player?.minecraft_uuid) {
    return (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Trabalhe Conosco</span>
              <h2>Vincule sua conta Minecraft</h2>
              <p className="muted">
                Somente jogadores com conta vinculada podem preencher o formulário.
              </p>
            </div>
            <Link href="/perfil#vinculo" className="btn primary">
              Vincular conta
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Trabalhe Conosco</span>
            <h2>Formulário de recrutamento</h2>
            <p className="muted">
              Quer ajudar a construir o servidor? Conte sobre você e suas habilidades.
            </p>
          </div>
          <Link href="/forum" className="btn secondary">
            Tirar dúvidas no fórum
          </Link>
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
                  <input
                    type="text"
                    placeholder="Seu nick"
                    defaultValue={player.minecraft_name ?? ""}
                  />
                </label>
                <label>
                  Usuário do Discord
                  <input
                    type="text"
                    placeholder="@seuusuario"
                    defaultValue={session.user?.name ?? ""}
                  />
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
              <Link href="/forum" className="btn secondary btn-sm">
                Fórum
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
