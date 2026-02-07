import Link from "next/link";
import { getPunishmentsPaged } from "@/lib/site-data";
import { formatShortDate } from "@/lib/date";

type PunicoesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toNumber(value: number | string | bigint | null) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return value;
}

function parseEpoch(value: number | string | bigint | null) {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const ms = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "Sem expiracao";
  const totalSeconds = Math.floor(durationMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length) parts.push(`${seconds}s`);
  return parts.join(" ");
}

function normalizeType(raw: string | null) {
  const value = String(raw || "").trim().toLowerCase();
  if (value.includes("ban")) return { label: "Ban", key: "ban" };
  if (value.includes("mute")) return { label: "Mute", key: "mute" };
  if (value.includes("kick")) return { label: "Kick", key: "kick" };
  return { label: raw || "Punicao", key: "other" };
}

function getSearchValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export default async function PunicoesPage({ searchParams }: PunicoesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = getSearchValue(resolvedParams, "q").trim();
  const type = getSearchValue(resolvedParams, "type") || "all";
  const status = getSearchValue(resolvedParams, "status") || "all";
  const startDate = getSearchValue(resolvedParams, "start") || "";
  const endDate = getSearchValue(resolvedParams, "end") || "";
  const today = getSearchValue(resolvedParams, "today") === "1";
  const pageParam = Number(getSearchValue(resolvedParams, "page") || "1");

  const {
    rows: punishments,
    total,
    page: currentPage,
    totalPages,
    limit,
  } = await getPunishmentsPaged({
    query,
    type,
    status,
    startDate,
    endDate,
    today,
    page: Number.isFinite(pageParam) ? pageParam : 1,
    limit: 20,
  });
  const todayKey = toDateKey(new Date());

  const grouped = new Map<
    string,
    Array<
      typeof punishments[number] & {
        startDate: Date | null;
        durationLabel: string;
        expirationLabel: string;
        typeInfo: { label: string; key: string };
        displayName: string;
        nick: string;
        isActive: boolean;
      }
    >
  >();

  for (const punishment of punishments) {
    const startDate = parseEpoch(punishment.data_inicio);
    const durationMs = toNumber(punishment.duracao_ms);
    const expiresAt =
      startDate && durationMs > 0 ? new Date(startDate.getTime() + durationMs) : null;
    const typeInfo = normalizeType(punishment.tipo);
    const durationLabel =
      durationMs > 0
        ? formatDuration(durationMs)
        : typeInfo.key === "kick"
          ? "Instantaneo"
          : "Sem expiracao";
    const expirationLabel = expiresAt ? formatShortDate(expiresAt) : "Sem expiracao";
    const displayName = punishment.current_nick || "Jogador";
    const nick = punishment.current_nick ? `@${punishment.current_nick}` : "";
    const isActive = Boolean(punishment.ativa) && (!expiresAt || expiresAt > new Date());
    const dateKey = startDate ? toDateKey(startDate) : "unknown";

    const entry = {
      ...punishment,
      startDate,
      durationLabel,
      expirationLabel,
      typeInfo,
      displayName,
      nick,
      isActive,
    };

    const bucket = grouped.get(dateKey);
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(dateKey, [entry]);
    }
  }

  const groupedEntries = Array.from(grouped.entries());

  const filterParams = {
    q: query || undefined,
    type: type !== "all" ? type : undefined,
    status: status !== "all" ? status : undefined,
    start: startDate || undefined,
    end: endDate || undefined,
    today: today ? "1" : undefined,
  };

  const paginationStart = total ? (currentPage - 1) * limit + 1 : 0;
  const paginationEnd = total ? Math.min(currentPage * limit, total) : 0;
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const adjustedStart = Math.max(1, endPage - 4);
  const pageNumbers = [] as number[];
  for (let page = adjustedStart; page <= endPage; page += 1) {
    pageNumbers.push(page);
  }

  return (
    <section className="section punish-page">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Punicoes</span>
            <h2>Historico de punicoes</h2>
            <p className="muted">
              Lista publica de bans, mutes e kicks aplicados no servidor.
            </p>
          </div>
          <Link href="/forum" className="btn secondary">
            Reportar erro
          </Link>
        </div>

        <form className="punish-filters" method="get" action="/punicoes">
          <div className="punish-filters-row">
            <label className="punish-filter">
              <span>Buscar por nick ou UUID</span>
              <input
                type="search"
                name="q"
                placeholder="Ex: Player123 ou UUID"
                defaultValue={query}
              />
            </label>

            <label className="punish-filter">
              <span>Tipo</span>
              <select name="type" defaultValue={type}>
                <option value="all">Todos</option>
                <option value="ban">Ban</option>
                <option value="mute">Mute</option>
                <option value="kick">Kick</option>
                <option value="other">Outros</option>
              </select>
            </label>

            <label className="punish-filter">
              <span>Status</span>
              <select name="status" defaultValue={status}>
                <option value="all">Todos</option>
                <option value="active">Ativa</option>
                <option value="inactive">Encerrada</option>
              </select>
            </label>
          </div>

          <div className="punish-filters-row">
            <label className="punish-filter">
              <span>Data inicio</span>
              <input type="date" name="start" defaultValue={startDate} />
            </label>
            <label className="punish-filter">
              <span>Data fim</span>
              <input type="date" name="end" defaultValue={endDate} />
            </label>
            <label className="punish-filter punish-filter-check">
              <input type="checkbox" name="today" value="1" defaultChecked={today} />
              <span>Somente hoje</span>
            </label>

            <div className="punish-filter-actions">
              <button type="submit" className="btn primary">Buscar</button>
              <Link href="/punicoes" className="btn ghost">Limpar</Link>
            </div>
          </div>
        </form>

        <div className="punish-summary">
          <span>Mostrando {paginationStart}-{paginationEnd} de {total} registros</span>
          <span>Pagina {currentPage} de {totalPages}</span>
        </div>

        {groupedEntries.length ? (
          <div className="punish-groups">
            {groupedEntries.map(([dateKey, entries]) => {
              const label =
                dateKey === "unknown"
                  ? "Sem data"
                  : dateKey === todayKey
                    ? "Hoje"
                    : formatShortDate(new Date(`${dateKey}T00:00:00`));
              const countLabel = `${entries.length} ${entries.length === 1 ? "registro" : "registros"}`;

              return (
                <article key={dateKey} className="card punish-group">
                  <header className="punish-group-header">
                    <div>
                      <span className="card-eyebrow">Periodo</span>
                      <h3 className="card-title">{label}</h3>
                    </div>
                    <span className="status-pill">{countLabel}</span>
                  </header>

                  <div className="punish-group-list">
                    {entries.map((punishment) => (
                      <div key={punishment.id} className="punish-item">
                        <div className="punish-item-main">
                          <div>
                            <strong className="punish-item-title">{punishment.displayName}</strong>
                            <span className="punish-item-sub">
                              {punishment.nick || punishment.alvo_uuid}
                            </span>
                          </div>
                          <div className="punish-tags">
                            <span className={`status-pill badge punish-${punishment.typeInfo.key}`}>
                              {punishment.typeInfo.label}
                            </span>
                            <span className={`status-pill ${punishment.isActive ? "active" : "inactive"}`}>
                              {punishment.isActive ? "Ativa" : "Encerrada"}
                            </span>
                          </div>
                        </div>

                        <div className="punish-meta">
                          <div>
                            <span>Duracao</span>
                            <strong>{punishment.durationLabel}</strong>
                          </div>
                          <div>
                            <span>Ocorrencia</span>
                            <strong>{formatShortDate(punishment.startDate) || "Sem data"}</strong>
                          </div>
                          <div>
                            <span>Expiracao</span>
                            <strong>{punishment.expirationLabel}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <h3>Nenhuma punicao registrada</h3>
            <p className="muted">Nao ha registros disponiveis no momento.</p>
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="punish-pagination" aria-label="Paginacao de punicoes">
            <Link
              className={`pagination-link ${currentPage <= 1 ? "disabled" : ""}`}
              href={`/punicoes?${buildQueryString({ ...filterParams, page: String(currentPage - 1) })}`}
              aria-disabled={currentPage <= 1}
            >
              Anterior
            </Link>
            <div className="pagination-list">
              {pageNumbers.map((page) => (
                <Link
                  key={page}
                  className={`pagination-link ${page === currentPage ? "active" : ""}`}
                  href={`/punicoes?${buildQueryString({ ...filterParams, page: String(page) })}`}
                >
                  {page}
                </Link>
              ))}
            </div>
            <Link
              className={`pagination-link ${currentPage >= totalPages ? "disabled" : ""}`}
              href={`/punicoes?${buildQueryString({ ...filterParams, page: String(currentPage + 1) })}`}
              aria-disabled={currentPage >= totalPages}
            >
              Proxima
            </Link>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
