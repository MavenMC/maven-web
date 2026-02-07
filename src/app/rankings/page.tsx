import Link from "next/link";
import { getSurvivalLeaderboard } from "@/lib/site-data";

function toNumber(value: number | string | bigint | null) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return value;
}

function formatStat(value: number | string | bigint | null) {
  const normalized = toNumber(value);
  if (!Number.isFinite(normalized)) return "0";
  return normalized.toLocaleString("pt-BR");
}

function formatPlaytime(value: number | string | bigint | null) {
  const totalSeconds = Math.max(0, Math.floor(toNumber(value)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0 && minutes <= 0) return "0m";
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default async function RankingsPage() {
  const leaderboard = await getSurvivalLeaderboard(25);

  return (
    <section className="section leaderboard-page">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Leaderboards</span>
            <h2>Ranking Survival</h2>
            <p className="muted">
              Top jogadores com base no tempo jogado em survival.
            </p>
          </div>
          <Link href="/forum" className="btn secondary">
            Discutir no forum
          </Link>
        </div>

        {leaderboard.length ? (
          <div className="leaderboard-grid">
            {leaderboard.map((player, index) => {
              const displayName =
                player.apelido?.trim() || player.current_nick || "Jogador";
              const nick = player.current_nick ?? "";
              const profileHref = nick ? `/perfil/${encodeURIComponent(nick)}` : "";
              const rankClass =
                index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "";

              return (
                <article
                  key={`${player.uuid}-${index}`}
                  className={`card leaderboard-card ${index < 3 ? "is-top" : ""}`}
                >
                  <div className={`leaderboard-rank ${rankClass}`}>#{index + 1}</div>

                  <div className="leaderboard-name">
                    {profileHref ? (
                      <Link href={profileHref} className="leaderboard-link">
                        {displayName}
                      </Link>
                    ) : (
                      <span className="leaderboard-link">{displayName}</span>
                    )}
                    <span className="card-sub">
                      {nick ? `@${nick}` : "Nick nao informado"}
                    </span>
                  </div>

                  <div className="leaderboard-score">
                    <span className="card-eyebrow">Tempo jogado</span>
                    <strong>{formatPlaytime(player.total_playtime)}</strong>
                  </div>

                  <div className="leaderboard-meta">
                    <span>Mobs: {formatStat(player.mobs_killed)}</span>
                    <span>Blocos: {formatStat(player.blocks_broken)}</span>
                    <span>PVP: {formatStat(player.pvp_kills)}</span>
                    <span>Mortes: {formatStat(player.deaths)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <h3>Sem dados no ranking</h3>
            <p className="muted">Nenhuma estatistica encontrada no momento.</p>
          </div>
        )}
      </div>
    </section>
  );
}
