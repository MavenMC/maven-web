import "server-only";
import { dbQuery } from "@/lib/db";

export type SiteStat = {
  id: number;
  label: string;
  value: string;
};

export type SitePost = {
  id: number;
  type: "news" | "blog" | "patch";
  title: string;
  summary: string | null;
  content?: string | null;
  tag: string | null;
  cover: string | null;
  cover_label: string | null;
  published_at: Date | string | null;
};

export type SitePostDetail = SitePost & {
  content: string | null;
};

export type SiteChangelogEntry = {
  id: number;
  version: string;
  title: string;
  items_json: string | null;
  published_at: Date | string | null;
};

export type SiteForumCategory = {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  variant: string | null;
};

export type SiteForumPost = {
  id: number;
  category_id: number;
  title: string;
  content: string | null;
  created_at: Date | string | null;
  author_uuid: string;
  author_nick: string | null;
  author_alias: string | null;
};

export type SiteForumPostDetail = SiteForumPost & {
  category_title: string | null;
};

export type SiteSocialLink = {
  id: number;
  label: string;
  url: string;
  icon: string | null;
};


export type SiteStaffChange = {
  id: number;
  member_name: string;
  role_name: string | null;
  action: string;
  note: string | null;
  happened_at: Date | string | null;
};

export type SiteLeaderboardEntry = {
  uuid: string;
  current_nick: string | null;
  total_playtime: number | string | bigint | null;
  mobs_killed: number | string | bigint | null;
  pvp_kills: number | string | bigint | null;
  blocks_broken: number | string | bigint | null;
  deaths: number | string | bigint | null;
  distance_traveled: number | string | bigint | null;
  apelido: string | null;
  estatisticas_publicas: number | null;
  privacidade: string | null;
};

export type SitePunishment = {
  id: string;
  tipo: string;
  alvo_uuid: string;
  duracao_ms: number | string | bigint | null;
  data_inicio: number | string | bigint | null;
  ativa: number | null;
  current_nick: string | null;
};

export type PunishmentFilters = {
  query?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  today?: boolean;
  page?: number;
  limit?: number;
};

export type PunishmentPage = {
  rows: SitePunishment[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

export type SiteAnnouncement = {
  id: number;
  title: string;
  highlight: string | null;
  ip_text: string | null;
};

export async function getSiteAnnouncement() {
  try {
    const rows = await dbQuery<SiteAnnouncement[]>(
      `SELECT id, title, highlight, ip_text
       FROM site_announcements
       WHERE active = 1
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY sort_order ASC, id DESC
       LIMIT 1`,
    );
    return rows[0] ?? null;
  } catch (error) {
    console.warn('Tabela site_announcements não existe ou erro ao buscar anúncio:', error);
    return null;
  }
}

export async function getSiteStats(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteStat[]>(
      `SELECT id, label, value
       FROM site_stats
       WHERE active = 1
       ORDER BY sort_order ASC, id ASC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn('Tabela site_stats não existe ou erro ao buscar estatísticas:', error);
    return [];
  }
}

export async function getSitePosts(type: SitePost["type"], limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SitePost[]>(
      `SELECT id, type, title, summary, tag, cover, cover_label, published_at
       FROM site_posts
       WHERE type = :type AND active = 1
       ORDER BY published_at DESC, sort_order ASC, id DESC
       ${limitClause}`,
      { type },
    );
  } catch (error) {
    console.warn('Tabela site_posts não existe ou erro ao buscar posts:', error);
    return [];
  }
}


export async function getSitePostById(id: number, type?: SitePost["type"]) {
  try {
    const rows = await dbQuery<SitePostDetail[]>(
      `SELECT id, type, title, summary, content, tag, cover, cover_label, published_at
       FROM site_posts
       WHERE id = :id
         ${type ? "AND type = :type" : ""}
         AND active = 1
       LIMIT 1`,
      type ? { id, type } : { id },
    );
    return rows[0] ?? null;
  } catch (error) {
    console.warn("Tabela site_posts nao existe ou erro ao buscar post:", error);
    return null;
  }
}

export async function getChangelogEntries(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteChangelogEntry[]>(
      `SELECT id, version, title, items_json, published_at
       FROM site_changelog_entries
       WHERE active = 1
       ORDER BY published_at DESC, sort_order ASC, id DESC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn('Tabela site_changelog_entries não existe ou erro ao buscar changelog:', error);
    return [];
  }
}

export async function getForumCategories(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteForumCategory[]>(
      `SELECT id, title, description, icon, variant
       FROM site_forum_categories
       WHERE active = 1
       ORDER BY sort_order ASC, id ASC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn('Tabela site_forum_categories não existe ou erro ao buscar categorias:', error);
    return [];
  }
}

export async function getSocialLinks(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteSocialLink[]>(
      `SELECT id, label, url, icon
       FROM site_social_links
       WHERE active = 1
       ORDER BY sort_order ASC, id ASC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn('Tabela site_social_links não existe ou erro ao buscar links sociais:', error);
    return [];
  }
}

export async function getStaffChanges(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteStaffChange[]>(
      `SELECT id, member_name, role_name, action, note, happened_at
       FROM site_staff_changes
       WHERE active = 1
       ORDER BY happened_at DESC, sort_order ASC, id DESC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn("Tabela site_staff_changes nao existe ou erro ao buscar mudancas:", error);
    return [];
  }
}

export async function getForumCategoryById(id: number) {
  try {
    const rows = await dbQuery<SiteForumCategory[]>(
      `SELECT id, title, description, icon, variant
       FROM site_forum_categories
       WHERE id = :id AND active = 1
       LIMIT 1`,
      { id },
    );
    return rows[0] ?? null;
  } catch (error) {
    console.warn("Tabela site_forum_categories nao existe ou erro ao buscar categoria:", error);
    return null;
  }
}

export async function getForumPostsByCategory(categoryId: number, limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteForumPost[]>(
      `SELECT p.id,
              p.category_id,
              p.title,
              p.content,
              p.created_at,
              p.author_uuid,
              a.current_nick AS author_nick,
              pj.apelido AS author_alias
       FROM site_forum_posts p
       LEFT JOIN account_stats a ON a.uuid = p.author_uuid
       LEFT JOIN perfil_jogadores pj ON pj.uuid = p.author_uuid
       WHERE p.category_id = :category_id AND p.active = 1
       ORDER BY p.created_at DESC, p.id DESC
       ${limitClause}`,
      { category_id: categoryId },
    );
  } catch (error) {
    console.warn("Tabela site_forum_posts nao existe ou erro ao buscar posts:", error);
    return [];
  }
}

export async function getForumPostById(id: number) {
  try {
    const rows = await dbQuery<SiteForumPostDetail[]>(
      `SELECT p.id,
              p.category_id,
              p.title,
              p.content,
              p.created_at,
              p.author_uuid,
              a.current_nick AS author_nick,
              pj.apelido AS author_alias,
              c.title AS category_title
       FROM site_forum_posts p
       LEFT JOIN site_forum_categories c ON c.id = p.category_id
       LEFT JOIN account_stats a ON a.uuid = p.author_uuid
       LEFT JOIN perfil_jogadores pj ON pj.uuid = p.author_uuid
       WHERE p.id = :id AND p.active = 1
       LIMIT 1`,
      { id },
    );
    return rows[0] ?? null;
  } catch (error) {
    console.warn("Tabela site_forum_posts nao existe ou erro ao buscar post:", error);
    return null;
  }
}

export async function getSurvivalLeaderboard(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SiteLeaderboardEntry[]>(
      `SELECT a.uuid,
              a.current_nick,
              a.total_playtime,
              a.mobs_killed,
              a.pvp_kills,
              a.blocks_broken,
              a.deaths,
              a.distance_traveled,
              p.apelido,
              p.estatisticas_publicas,
              p.privacidade
       FROM account_stats a
       LEFT JOIN perfil_jogadores p ON p.uuid = a.uuid
       WHERE a.current_nick IS NOT NULL
         AND (p.privacidade IS NULL OR p.privacidade <> 'PRIVADA')
         AND (p.estatisticas_publicas IS NULL OR p.estatisticas_publicas <> 0)
         AND a.total_playtime IS NOT NULL
       ORDER BY a.total_playtime DESC, a.uuid ASC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn("Tabela account_stats nao existe ou erro ao buscar leaderboard:", error);
    return [];
  }
}

export async function getPunishments(limit?: number) {
  try {
    const limitClause = limit ? `LIMIT ${Number(limit)}` : "";
    return await dbQuery<SitePunishment[]>(
      `SELECT p.id,
              p.tipo,
              p.alvo_uuid,
              p.duracao_ms,
              p.data_inicio,
              p.ativa,
              a.current_nick
       FROM punicoes p
       LEFT JOIN account_stats a ON a.uuid = p.alvo_uuid
       ORDER BY p.data_inicio DESC, p.id DESC
       ${limitClause}`,
    );
  } catch (error) {
    console.warn("Tabela punicoes nao existe ou erro ao buscar punicoes:", error);
    return [];
  }
}

function parseDateInput(value: string | undefined | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function resolveDateRange(filters: PunishmentFilters) {
  const now = new Date();
  if (filters.today) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }

  const startDate = parseDateInput(filters.startDate);
  const endDate = parseDateInput(filters.endDate);
  const startMs = startDate ? startDate.getTime() : null;
  const endMs = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime()
    : null;
  return { startMs, endMs };
}

export async function getPunishmentsPaged(filters: PunishmentFilters) {
  try {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    const query = filters.query?.trim();
    if (query) {
      params.search = `%${query}%`;
      conditions.push("(a.current_nick LIKE :search OR p.alvo_uuid LIKE :search)");
    }

    const type = String(filters.type || "").trim().toLowerCase();
    if (type && type !== "all") {
      if (type === "other") {
        conditions.push(
          "(LOWER(p.tipo) NOT LIKE '%ban%' AND LOWER(p.tipo) NOT LIKE '%mute%' AND LOWER(p.tipo) NOT LIKE '%kick%')",
        );
      } else {
        params.typePattern = `%${type}%`;
        conditions.push("LOWER(p.tipo) LIKE :typePattern");
      }
    }

    const status = String(filters.status || "").trim().toLowerCase();
    if (status === "active") {
      conditions.push("p.ativa = 1");
    } else if (status === "inactive") {
      conditions.push("(p.ativa = 0 OR p.ativa IS NULL)");
    }

    const { startMs, endMs } = resolveDateRange(filters);
    const dataStartExpr =
      "CASE WHEN p.data_inicio < 10000000000 THEN p.data_inicio * 1000 ELSE p.data_inicio END";
    if (startMs !== null && endMs !== null) {
      params.startMs = startMs;
      params.endMs = endMs;
      conditions.push(`${dataStartExpr} BETWEEN :startMs AND :endMs`);
    } else if (startMs !== null) {
      params.startMs = startMs;
      conditions.push(`${dataStartExpr} >= :startMs`);
    } else if (endMs !== null) {
      params.endMs = endMs;
      conditions.push(`${dataStartExpr} <= :endMs`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.max(1, Number(filters.limit ?? 20));

    const countRows = await dbQuery<Array<{ total: number }>>(
      `SELECT COUNT(*) as total
       FROM punicoes p
       LEFT JOIN account_stats a ON a.uuid = p.alvo_uuid
       ${whereClause}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(Number(filters.page ?? 1), 1), totalPages);
    const offset = (page - 1) * limit;

    const rows = await dbQuery<SitePunishment[]>(
      `SELECT p.id,
              p.tipo,
              p.alvo_uuid,
              p.duracao_ms,
              p.data_inicio,
              p.ativa,
              a.current_nick
       FROM punicoes p
       LEFT JOIN account_stats a ON a.uuid = p.alvo_uuid
       ${whereClause}
       ORDER BY p.data_inicio DESC, p.id DESC
       LIMIT :limit OFFSET :offset`,
      {
        ...params,
        limit,
        offset,
      },
    );

    return { rows, total, page, totalPages, limit } as PunishmentPage;
  } catch (error) {
    console.warn("Tabela punicoes nao existe ou erro ao buscar punicoes:", error);
    return { rows: [], total: 0, page: 1, totalPages: 1, limit: 20 } as PunishmentPage;
  }
}

