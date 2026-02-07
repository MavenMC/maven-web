import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { User } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { formatShortDate } from "@/lib/date";

const rankTags: Record<
  string,
  { name: string; color: string; gradient?: string }
> = {
  vip: { name: "VIP", color: "#22c55e", gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" },
  "vip+": { name: "VIP+", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
  mvp: { name: "MVP", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
  "mvp+": { name: "MVP+", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  "mvp++": { name: "MVP++", color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
  admin: { name: "ADMIN", color: "#dc2626", gradient: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" },
  mod: { name: "MOD", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" },
  helper: { name: "HELPER", color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
};

type AccountStatsRow = {
  uuid: string;
  current_nick: string | null;
  total_playtime: number | string | bigint | null;
  mobs_killed: number | string | bigint | null;
  pvp_kills: number | string | bigint | null;
  blocks_broken: number | string | bigint | null;
  deaths: number | string | bigint | null;
  distance_traveled: number | string | bigint | null;
};

type ProfileRow = {
  uuid: string;
  apelido: string | null;
  bio: string | null;
  estatisticas_publicas: number | null;
  privacidade: string | null;
  cor_favorita: string | null;
};

type AssetRow = {
  banner_url: string | null;
  avatar_url: string | null;
  ring_url: string | null;
};

type SocialRow = {
  id: number;
  label: string;
  url: string;
  is_public: number;
};

type RankRow = {
  rank_id: string;
  expires_at: Date | null;
  is_permanent: number | null;
};

type BadgeRow = {
  nome: string;
  descricao: string;
  icone: string | null;
};

type LinkedAccountRow = {
  discord_id: string | null;
  minecraft_name: string | null;
  account_type: string | null;
  is_bedrock: number | null;
};

type StaffRoleRow = {
  role_name: string | null;
  role_color: string | null;
};

type ViewerAccountRow = {
  minecraft_uuid: string | null;
};

type AccountNickRow = {
  minecraft_uuid: string | null;
  minecraft_name: string | null;
};

type ForumPostRow = {
  id: number;
  title: string;
  created_at: Date | string | null;
  category_title: string | null;
};

type ReportRow = {
  id: number;
  reportado_uuid: string;
  motivo: string;
  reportadoEm: Date | string | null;
  current_nick: string | null;
};

type PunishedPlayerRow = {
  reportado_uuid: string;
  current_nick: string | null;
};

type ReputationSummaryRow = {
  avg_rating: number | string | null;
  total_count: number | string | null;
};

type ReputationVoteRow = {
  rating: number | string | null;
  updated_at: Date | string | null;
};

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

function formatDate(value: Date | string | null) {
  if (!value) return "";
  const parsed = typeof value === "string" ? new Date(value) : value;
  return formatShortDate(parsed) || "";
}

function toFloat(value: number | string | null) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") return Number(value);
  return value;
}

async function submitReputation(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.playerId) return;

  const viewerRows = await dbQuery<ViewerAccountRow[]>(
    "SELECT minecraft_uuid FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: session.user.playerId },
  );
  const raterUuid = viewerRows[0]?.minecraft_uuid ?? null;
  if (!raterUuid) return;

  const targetUuid = String(formData.get("target_uuid") || "").trim();
  const nick = String(formData.get("nick") || "").trim();
  const rating = Number(formData.get("rating") || 0);

  if (!targetUuid || targetUuid === raterUuid) return;
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return;

  await dbQuery(
    "INSERT IGNORE INTO perfil_jogadores (uuid, estatisticas_publicas, privacidade) VALUES (:uuid, 1, 'PUBLICA')",
    { uuid: targetUuid },
  );

  const existing = await dbQuery<ReputationVoteRow[]>(
    "SELECT rating, updated_at FROM perfil_jogadores_reputacoes WHERE rater_uuid = :rater_uuid AND target_uuid = :target_uuid LIMIT 1",
    { rater_uuid: raterUuid, target_uuid: targetUuid },
  );

  const updatedAt = existing[0]?.updated_at ? new Date(existing[0].updated_at as string) : null;
  if (updatedAt && Date.now() - updatedAt.getTime() < 30 * 24 * 60 * 60 * 1000) {
    return;
  }

  await dbQuery(
    "INSERT INTO perfil_jogadores_reputacoes (rater_uuid, target_uuid, rating) VALUES (:rater_uuid, :target_uuid, :rating) ON DUPLICATE KEY UPDATE rating = :rating, updated_at = NOW()",
    { rater_uuid: raterUuid, target_uuid: targetUuid, rating },
  );

  revalidatePath(`/perfil/${nick}`);
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ nick: string }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const nick = decodeURIComponent(resolvedParams.nick ?? "").trim();

  if (!nick) {
    notFound();
  }

  let statsRows = await dbQuery<AccountStatsRow[]>(
    "SELECT uuid, current_nick, total_playtime, mobs_killed, pvp_kills, blocks_broken, deaths, distance_traveled FROM account_stats WHERE LOWER(current_nick) = LOWER(:nick) LIMIT 1",
    { nick },
  );
  let stats = statsRows[0] ?? null;

  if (!stats) {
    const accountRows = await dbQuery<AccountNickRow[]>(
      "SELECT minecraft_uuid, minecraft_name FROM player_accounts WHERE LOWER(minecraft_name) = LOWER(:nick) LIMIT 1",
      { nick },
    );
    const account = accountRows[0] ?? null;
    if (account?.minecraft_uuid) {
      statsRows = await dbQuery<AccountStatsRow[]>(
        "SELECT uuid, current_nick, total_playtime, mobs_killed, pvp_kills, blocks_broken, deaths, distance_traveled FROM account_stats WHERE uuid = :uuid LIMIT 1",
        { uuid: account.minecraft_uuid },
      );
      stats = statsRows[0] ?? {
        uuid: account.minecraft_uuid,
        current_nick: account.minecraft_name,
        total_playtime: null,
        mobs_killed: null,
        pvp_kills: null,
        blocks_broken: null,
        deaths: null,
        distance_traveled: null,
      };
    }
  }

  if (!stats) {
    notFound();
  }

  let viewerUuid: string | null = null;
  if (session?.user?.playerId) {
    const viewerRows = await dbQuery<ViewerAccountRow[]>(
      "SELECT minecraft_uuid FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
      { discord_id: session.user.playerId },
    );
    viewerUuid = viewerRows[0]?.minecraft_uuid ?? null;
  }

  const isOwner = viewerUuid && viewerUuid === stats.uuid;

  const profileRows = await dbQuery<ProfileRow[]>(
    "SELECT uuid, apelido, bio, estatisticas_publicas, privacidade, cor_favorita FROM perfil_jogadores WHERE uuid = :uuid LIMIT 1",
    { uuid: stats.uuid },
  );
  const profile = profileRows[0] ?? null;
  const privacy = profile?.privacidade ?? "PUBLICA";

  if (privacy === "PRIVADA" && !isOwner) {
    return (
      <section className="section profile-page">
        <div className="container">
          <div className="card profile-locked">
            <span className="card-eyebrow">Perfil privado</span>
            <h2>Este perfil esta protegido</h2>
            <p className="muted">O jogador decidiu ocultar as informacoes publicas.</p>
          </div>
        </div>
      </section>
    );
  }

  const assetRows = await dbQuery<AssetRow[]>(
    "SELECT banner_url, avatar_url, ring_url FROM perfil_jogadores_assets WHERE uuid = :uuid LIMIT 1",
    { uuid: stats.uuid },
  );
  const assets = assetRows[0] ?? null;

  const socials = await dbQuery<SocialRow[]>(
    `SELECT id, label, url, is_public
     FROM perfil_jogadores_redes
     WHERE uuid = :uuid ${isOwner ? "" : "AND is_public = 1"}
     ORDER BY sort_order ASC, id ASC`,
    { uuid: stats.uuid },
  );

  const rankRows = await dbQuery<RankRow[]>(
    "SELECT rank_id, expires_at, is_permanent FROM player_ranks WHERE player_uuid = :uuid AND (is_permanent = 1 OR expires_at >= NOW()) ORDER BY granted_at DESC LIMIT 1",
    { uuid: stats.uuid },
  );
  const rank = rankRows[0] ?? null;
  const rankTag = rank ? rankTags[String(rank.rank_id).toLowerCase()] : null;

  const accountRows = await dbQuery<LinkedAccountRow[]>(
    "SELECT discord_id, minecraft_name, account_type, is_bedrock FROM player_accounts WHERE minecraft_uuid = :uuid LIMIT 1",
    { uuid: stats.uuid },
  );
  const account = accountRows[0] ?? null;
  const isOriginal = account?.account_type === "original" || account?.account_type === "java_original";
  const isBedrock = account?.account_type === "bedrock" || account?.is_bedrock === 1;
  const skinSource = account?.minecraft_name ?? stats.current_nick ?? "";
  const minecraftAvatar = isOriginal && !isBedrock && skinSource
    ? `https://minotar.net/helm/${encodeURIComponent(skinSource)}/128`
    : null;

  const badges = await dbQuery<BadgeRow[]>(
    "SELECT c.nome, c.descricao, c.icone FROM conquistas_jogadores cj JOIN conquistas c ON c.id = cj.conquista_id WHERE cj.jogador_uuid = :uuid AND cj.concluida = 1 ORDER BY cj.concluida_em DESC LIMIT 8",
    { uuid: stats.uuid },
  );

  const staffRows = account?.discord_id
    ? await dbQuery<StaffRoleRow[]>(
        `SELECT r.name AS role_name, r.color AS role_color
         FROM site_staff_members m
         LEFT JOIN site_staff_roles r ON r.id = m.role_id
         WHERE m.active = 1 AND r.active = 1 AND m.discord_id = :discord_id
         ORDER BY r.sort_order ASC, r.id ASC
         LIMIT 1`,
        { discord_id: account.discord_id },
      )
    : [];
  const staffRole = staffRows[0] ?? null;

  const forumPosts = await dbQuery<ForumPostRow[]>(
    `SELECT p.id, p.title, p.created_at, c.title AS category_title
     FROM site_forum_posts p
     LEFT JOIN site_forum_categories c ON c.id = p.category_id
     WHERE p.author_uuid = :uuid AND p.active = 1
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT 6`,
    { uuid: stats.uuid },
  );

  const acceptedReports = await dbQuery<ReportRow[]>(
    `SELECT r.id, r.reportado_uuid, r.motivo, r.reportadoEm, a.current_nick
     FROM reportes r
     LEFT JOIN account_stats a ON a.uuid = r.reportado_uuid
     WHERE r.reporter_uuid = :uuid AND r.status = 'ACEITO'
     ORDER BY r.reportadoEm DESC, r.id DESC
     LIMIT 6`,
    { uuid: stats.uuid },
  );

  const punishedPlayers = await dbQuery<PunishedPlayerRow[]>(
    `SELECT DISTINCT r.reportado_uuid, a.current_nick
     FROM reportes r
     LEFT JOIN account_stats a ON a.uuid = r.reportado_uuid
     WHERE r.reporter_uuid = :uuid AND r.status = 'ACEITO'
     ORDER BY a.current_nick ASC
     LIMIT 6`,
    { uuid: stats.uuid },
  );

  const reputationSummaryRows = await dbQuery<ReputationSummaryRow[]>(
    "SELECT AVG(rating) as avg_rating, COUNT(*) as total_count FROM perfil_jogadores_reputacoes WHERE target_uuid = :uuid",
    { uuid: stats.uuid },
  );
  const reputationSummary = reputationSummaryRows[0] ?? { avg_rating: 0, total_count: 0 };
  const reputationAverage = toFloat(reputationSummary.avg_rating);
  const reputationCount = Number(reputationSummary.total_count ?? 0);

  const viewerVoteRows = viewerUuid
    ? await dbQuery<ReputationVoteRow[]>(
        "SELECT rating, updated_at FROM perfil_jogadores_reputacoes WHERE rater_uuid = :rater_uuid AND target_uuid = :target_uuid LIMIT 1",
        { rater_uuid: viewerUuid, target_uuid: stats.uuid },
      )
    : [];
  const viewerVote = viewerVoteRows[0] ?? null;

  const displayName = profile?.apelido?.trim() || stats.current_nick || "Jogador";
  const showStats = profile?.estatisticas_publicas !== 0;
  const bannerStyle = assets?.banner_url
    ? { backgroundImage: `url(${assets.banner_url})` }
    : profile?.cor_favorita
      ? { backgroundImage: `linear-gradient(135deg, ${profile.cor_favorita}55, rgba(0,0,0,0.65))` }
      : undefined;

  return (
    <section className="section profile-page">
      <div className="container">
        <div className="profile-hero">
          <div className="profile-banner" style={bannerStyle}>
            <div className="profile-banner-overlay" />
            <div className="profile-identity">
              <div className="profile-avatar-shell">
                {assets?.ring_url && (
                  <img src={assets.ring_url} alt="Moldura" className="profile-ring" />
                )}
                {assets?.avatar_url ? (
                  <img
                    src={assets.avatar_url}
                    alt={displayName}
                    className="profile-avatar-lg"
                  />
                ) : minecraftAvatar ? (
                  <img src={minecraftAvatar} alt={displayName} className="profile-avatar-lg" />
                ) : (
                  <div className="profile-avatar-lg profile-avatar-fallback">
                    <User size={40} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="profile-headline">
                <span className="section-kicker">Perfil publico</span>
                <h1>{displayName}</h1>
                <div className="profile-meta">
                  <span className="profile-nick">@{stats.current_nick ?? "-"}</span>
                  {rankTag && (
                    <span
                      className="status-pill badge"
                      style={{
                        background: rankTag.gradient || rankTag.color,
                        boxShadow: rankTag.color ? `0 8px 20px ${rankTag.color}55` : undefined,
                      }}
                    >
                      {rankTag.name}
                    </span>
                  )}
                  {staffRole?.role_name && (
                    <span
                      className="staff-role-badge"
                      style={{
                        background: staffRole.role_color
                          ? `${staffRole.role_color}1A`
                          : "rgba(255, 255, 255, 0.08)",
                        borderColor: staffRole.role_color
                          ? `${staffRole.role_color}4D`
                          : "rgba(255, 255, 255, 0.2)",
                        color: staffRole.role_color ?? "rgb(var(--text))",
                      }}
                    >
                      {staffRole.role_name}
                    </span>
                  )}
                </div>
                {isOwner && (
                  <div className="profile-actions">
                    <Link href="/perfil" className="btn secondary btn-sm">
                      Editar perfil
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-quick">
            <div className="card">
              <span className="card-eyebrow">Tempo jogado</span>
              <h3>{formatPlaytime(stats.total_playtime)}</h3>
              <p className="muted">Atividade recente no servidor.</p>
            </div>
            <div className="card">
              <span className="card-eyebrow">Combates</span>
              <h3>{formatStat(stats.pvp_kills)}</h3>
              <p className="muted">Vitorias em PVP.</p>
            </div>
            <div className="card">
              <span className="card-eyebrow">Exploracao</span>
              <h3>{formatStat(stats.distance_traveled)}</h3>
              <p className="muted">Blocos percorridos.</p>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <div className="card">
            <span className="card-eyebrow">Sobre</span>
            <h3 className="card-title">Bio</h3>
            <p className="muted">{profile?.bio?.trim() || "Sem bio publicada ainda."}</p>
          </div>

          <div className="card">
            <span className="card-eyebrow">Social</span>
            <h3 className="card-title">Conecte-se</h3>
            {socials.length ? (
              <div className="profile-socials">
                {socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhuma rede social publicada.</p>
            )}
          </div>

          <div className="card">
            <span className="card-eyebrow">Badges</span>
            <h3 className="card-title">Conquistas</h3>
            {badges.length ? (
              <div className="profile-badges">
                {badges.map((badge) => (
                  <div key={badge.nome} className="profile-badge">
                    <strong>{badge.nome}</strong>
                    <span className="muted">{badge.descricao}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhuma conquista registrada.</p>
            )}
          </div>

          <div className="card">
            <span className="card-eyebrow">Forum</span>
            <h3 className="card-title">Postagens recentes</h3>
            {forumPosts.length ? (
              <div className="profile-forum-list">
                {forumPosts.map((post) => (
                  <Link key={post.id} href={`/forum/topico/${post.id}`} className="profile-forum-item">
                    <div>
                      <strong>{post.title}</strong>
                      <span className="muted">{post.category_title ?? "Comunidade"}</span>
                    </div>
                    <span className="muted">{formatDate(post.created_at)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhum topico publicado ainda.</p>
            )}
          </div>

          <div className="card">
            <span className="card-eyebrow">Denuncias</span>
            <h3 className="card-title">Aceitas pela equipe</h3>
            {acceptedReports.length ? (
              <div className="profile-report-list">
                {acceptedReports.map((report) => (
                  <div key={report.id} className="profile-report-item">
                    <div>
                      <strong>{report.current_nick ?? report.reportado_uuid}</strong>
                      <span className="muted">{report.motivo}</span>
                    </div>
                    <span className="muted">{formatDate(report.reportadoEm)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhuma denuncia aceita ainda.</p>
            )}
          </div>

          <div className="card">
            <span className="card-eyebrow">Punicoes</span>
            <h3 className="card-title">Jogadores punidos</h3>
            {punishedPlayers.length ? (
              <div className="profile-report-list">
                {punishedPlayers.map((player) => (
                  <div key={player.reportado_uuid} className="profile-report-item">
                    <strong>{player.current_nick ?? player.reportado_uuid}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhuma punicao registrada.</p>
            )}
          </div>
        </div>

        <div className="card profile-reputation">
          <div className="profile-stats-head">
            <div>
              <span className="card-eyebrow">Reputacao</span>
              <h3 className="card-title">Como a comunidade avalia</h3>
              <p className="muted">Media de avaliacoes dos jogadores.</p>
            </div>
            <div className="profile-reputation-score">
              <strong>{reputationAverage.toFixed(1)}</strong>
              <span className="muted">({reputationCount} votos)</span>
            </div>
          </div>

          {viewerUuid && !isOwner ? (
            <form action={submitReputation} className="profile-reputation-form">
              <input type="hidden" name="target_uuid" value={stats.uuid} />
              <input type="hidden" name="nick" value={stats.current_nick ?? ""} />
              <label className="muted">Sua avaliacao</label>
              <div className="profile-reputation-actions">
                <select name="rating" defaultValue={Number(viewerVote?.rating ?? 0) || 5}>
                  <option value={5}>5 - Excelente</option>
                  <option value={4}>4 - Muito bom</option>
                  <option value={3}>3 - Bom</option>
                  <option value={2}>2 - Regular</option>
                  <option value={1}>1 - Ruim</option>
                </select>
                <button className="btn primary btn-sm" type="submit">
                  Enviar voto
                </button>
              </div>
              {viewerVote?.updated_at && (
                <p className="muted">
                  Ultima avaliacao: {formatDate(viewerVote.updated_at)}
                </p>
              )}
            </form>
          ) : !viewerUuid ? (
            <p className="muted">Entre com Discord para avaliar jogadores.</p>
          ) : null}
        </div>

        <div className="card profile-stats">
          <div className="profile-stats-head">
            <div>
              <span className="card-eyebrow">Estatisticas</span>
              <h3 className="card-title">Resumo de desempenho</h3>
              <p className="muted">Dados do servidor em tempo real.</p>
            </div>
            {!showStats && <span className="status-pill">Privado</span>}
          </div>
          {showStats ? (
            <div className="profile-stats-grid">
              <div>
                <span className="muted">Mobs abatidos</span>
                <strong>{formatStat(stats.mobs_killed)}</strong>
              </div>
              <div>
                <span className="muted">PVP Kills</span>
                <strong>{formatStat(stats.pvp_kills)}</strong>
              </div>
              <div>
                <span className="muted">Blocos quebrados</span>
                <strong>{formatStat(stats.blocks_broken)}</strong>
              </div>
              <div>
                <span className="muted">Mortes</span>
                <strong>{formatStat(stats.deaths)}</strong>
              </div>
            </div>
          ) : (
            <p className="muted">O jogador ocultou as estatisticas publicas.</p>
          )}
        </div>
      </div>
    </section>
  );
}
