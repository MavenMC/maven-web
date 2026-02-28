import Link from "next/link";
import { Ban, MessageSquareOff, UserX } from "lucide-react";
import { getPunishmentsPaged } from "@/lib/site-data";

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

function formatDate(date: Date | null) {
  if (!date) return "Data não informada";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "Permanente";
  const totalSeconds = Math.floor(durationMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length) return "< 1m";
  return parts.join(" ");
}

function normalizeType(raw: string | null) {
  const value = String(raw || "").trim().toLowerCase();
  if (value.includes("ban")) return { label: "BAN", key: "ban", color: "#ef4444", icon: Ban };
  if (value.includes("mute")) return { label: "MUTE", key: "mute", color: "#f97316", icon: MessageSquareOff };
  if (value.includes("kick")) return { label: "KICK", key: "kick", color: "#eab308", icon: UserX };
  return { label: raw?.toUpperCase() || "OUTRO", key: "other", color: "#6b7280", icon: Ban };
}

function getMinecraftAvatar(username: string): string {
  const normalized = String(username || "").trim();
  if (!normalized || normalized.startsWith("*")) {
    return "https://minotar.net/helm/Steve/128";
  }
  return `https://minotar.net/helm/${encodeURIComponent(normalized)}/128`;
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
    limit: 50,
  });

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
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Punições</span>
            <h2>Histórico de Punições</h2>
            <p className="muted">
              {total.toLocaleString("pt-BR")} punições encontradas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <form
          method="get"
          action="/punicoes"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Buscar jogador</span>
              <input
                type="search"
                name="q"
                placeholder="Nick ou UUID"
                defaultValue={query}
                style={{
                  padding: "0.625rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Tipo</span>
              <select
                name="type"
                defaultValue={type}
                style={{
                  padding: "0.625rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                }}
              >
                <option value="all">Todos</option>
                <option value="ban">Ban</option>
                <option value="mute">Mute</option>
                <option value="kick">Kick</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Status</span>
              <select
                name="status"
                defaultValue={status}
                style={{
                  padding: "0.625rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Ativa</option>
                <option value="inactive">Encerrada</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Data início</span>
              <input
                type="date"
                name="start"
                defaultValue={startDate}
                style={{
                  padding: "0.625rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>Data fim</span>
              <input
                type="date"
                name="end"
                defaultValue={endDate}
                style={{
                  padding: "0.625rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" name="today" value="1" defaultChecked={today} />
              <span style={{ fontSize: "0.875rem" }}>Somente hoje</span>
            </label>

            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn primary">
                Buscar
              </button>
              <Link href="/punicoes" className="btn ghost">
                Limpar
              </Link>
            </div>
          </div>
        </form>

        {/* Resumo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            color: "#9ca3af",
          }}
        >
          <span>
            Mostrando {paginationStart}-{paginationEnd} de {total}
          </span>
          <span>
            Página {currentPage} de {totalPages}
          </span>
        </div>

        {/* Tabela */}
        {punishments.length > 0 ? (
          <div style={{ marginBottom: "2rem" }}>
            {/* Header */}
            <div
              className="punishments-table-header"
              style={{
                display: "grid",
                gridTemplateColumns: "100px 160px 1fr 300px 120px",
                gap: "1.5rem",
                padding: "1rem 1.5rem",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "12px 12px 0 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#9ca3af",
              }}
            >
              <div>TIPO</div>
              <div>DATA</div>
              <div>JOGADOR</div>
              <div>MOTIVO</div>
              <div>DURAÇÃO</div>
            </div>

            {/* Rows */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "0 0 12px 12px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderTop: "none",
              }}
            >
              {punishments.map((punishment, index) => {
                const startDate = parseEpoch(punishment.data_inicio);
                const durationMs = toNumber(punishment.duracao_ms);
                const typeInfo = normalizeType(punishment.tipo);
                const durationLabel = durationMs > 0 ? formatDuration(durationMs) : "Permanente";
                const displayName = punishment.current_nick || "Jogador";
                const avatar = getMinecraftAvatar(punishment.current_nick || "");
                const isActive = Boolean(punishment.ativa);
                const TypeIcon = typeInfo.icon;

                // Extrair motivo do tipo se possível
                const motivoMatch = punishment.tipo?.match(/\[(.*?)\]/);
                const motivo = motivoMatch ? motivoMatch[1] : punishment.tipo || "Sem motivo";

                return (
                  <div
                    key={punishment.id}
                    className="punishments-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px 160px 1fr 300px 120px",
                      gap: "1.5rem",
                      padding: "1rem 1.5rem",
                      alignItems: "center",
                      borderBottom:
                        index < punishments.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "none",
                      transition: "background 0.2s",
                    }}
                  >
                    {/* Tipo */}
                    <div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: typeInfo.color,
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
                        <TypeIcon size={12} strokeWidth={2.5} />
                        {typeInfo.label}
                      </span>
                    </div>

                    {/* Data */}
                    <div style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                      {formatDate(startDate)}
                    </div>

                    {/* Jogador */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <img
                        src={avatar}
                        alt={displayName}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "6px",
                          border: `2px solid ${typeInfo.color}`,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {displayName}
                        </div>
                        {punishment.alvo_uuid && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              fontFamily: "monospace",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {punishment.alvo_uuid.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Motivo */}
                    <div style={{ fontSize: "0.875rem", color: "#d1d5db", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {motivo}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            padding: "0.125rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: "#10b981",
                            color: "white",
                            flexShrink: 0,
                          }}
                        >
                          Ativa
                        </span>
                      )}
                    </div>

                    {/* Duração */}
                    <div style={{ fontSize: "0.875rem", color: "#9ca3af", textAlign: "right" }}>
                      {durationLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <h3>Nenhuma punição encontrada</h3>
            <p className="muted">Tente ajustar os filtros de busca.</p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <nav
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
            aria-label="Paginação de punições"
          >
            <Link
              className={`btn ghost btn-sm ${currentPage <= 1 ? "disabled" : ""}`}
              href={`/punicoes?${buildQueryString({ ...filterParams, page: String(currentPage - 1) })}`}
              style={{ pointerEvents: currentPage <= 1 ? "none" : "auto", opacity: currentPage <= 1 ? 0.5 : 1 }}
            >
              Anterior
            </Link>
            {pageNumbers.map((page) => (
              <Link
                key={page}
                className={`btn ${page === currentPage ? "primary" : "ghost"} btn-sm`}
                href={`/punicoes?${buildQueryString({ ...filterParams, page: String(page) })}`}
                style={{ minWidth: "2.5rem" }}
              >
                {page}
              </Link>
            ))}
            <Link
              className={`btn ghost btn-sm ${currentPage >= totalPages ? "disabled" : ""}`}
              href={`/punicoes?${buildQueryString({ ...filterParams, page: String(currentPage + 1) })}`}
              style={{ pointerEvents: currentPage >= totalPages ? "none" : "auto", opacity: currentPage >= totalPages ? 0.5 : 1 }}
            >
              Próxima
            </Link>
          </nav>
        )}
      </div>
    </section>
  );
}
