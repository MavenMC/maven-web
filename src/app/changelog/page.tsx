import Link from "next/link";
import { UserPlus, UserMinus, ArrowUp, ArrowDown } from "lucide-react";
import { getStaffChangesCount, getStaffChangesPaginated } from "@/lib/site-data";

const PAGE_SIZE = 10;

function getMinecraftAvatar(username: string): string {
  return `https://minotar.net/helm/${username}/128`;
}

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const requestedPage = Number(pageParam ?? "1");
  const totalCount = await getStaffChangesCount();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), totalPages);

  const staffChanges = await getStaffChangesPaginated(currentPage, PAGE_SIZE);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Data não informada";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Changelog</span>
            <h2>Movimentações da Equipe</h2>
            <p className="muted">
              Histórico completo de entradas e saídas da equipe do servidor.
            </p>
          </div>
          <Link href="/equipe" className="btn secondary">
            Ver equipe atual
          </Link>
        </div>

        {staffChanges.length > 0 ? (
          <div style={{ marginTop: "2rem" }}>
            {/* Header da tabela */}
            <div
              className="changelog-table-header"
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 200px 150px 180px",
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
              <div></div>
              <div>JOGADOR</div>
              <div>CARGO</div>
              <div>AÇÃO</div>
              <div>DATA</div>
            </div>

            {/* Linhas da tabela */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "0 0 12px 12px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderTop: "none",
              }}
            >
              {staffChanges.map((change, index) => {
                const actionConfig = {
                  join: { color: "#10b981", text: "Entrou", icon: UserPlus },
                  leave: { color: "#ef4444", text: "Saiu", icon: UserMinus },
                  promoted: { color: "#3b82f6", text: "Promovido", icon: ArrowUp },
                  demoted: { color: "#f59e0b", text: "Rebaixado", icon: ArrowDown },
                } as const;
                const config = actionConfig[change.action as keyof typeof actionConfig] || actionConfig.join;
                const actionColor = config.color;
                const actionText = config.text;
                const ActionIcon = config.icon;
                const avatar = getMinecraftAvatar(change.member_name);

                return (
                  <div
                    key={change.id}
                    className="changelog-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 200px 150px 180px",
                      gap: "1.5rem",
                      padding: "1.25rem 1.5rem",
                      alignItems: "center",
                      borderBottom:
                        index < staffChanges.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "none",
                      transition: "background 0.2s",
                    }}
                  >
                    {/* Avatar */}
                    <div>
                      <img
                        src={avatar}
                        alt={change.member_name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          border: `2px solid ${actionColor}`,
                        }}
                      />
                    </div>

                    {/* Nome do jogador */}
                    <div>
                      <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                        {change.member_name}
                      </div>
                      {change.note && (
                        <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                          {change.note}
                        </div>
                      )}
                    </div>

                    {/* Cargo */}
                    <div style={{ fontSize: "0.9rem", color: "#d1d5db" }}>
                      {change.role_name || "-"}
                    </div>

                    {/* Ação */}
                    <div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.375rem 0.875rem",
                          borderRadius: "9999px",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          background: actionColor,
                          color: "white",
                        }}
                      >
                        <ActionIcon size={14} strokeWidth={2.5} />
                        {actionText}
                      </span>
                    </div>

                    {/* Data */}
                    <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                      {formatDate(change.happened_at)}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                {currentPage > 1 ? (
                  <Link href={`/changelog?page=${currentPage - 1}`} className="btn ghost">
                    Anterior
                  </Link>
                ) : (
                  <span className="btn ghost" style={{ opacity: 0.6, pointerEvents: "none" }}>
                    Anterior
                  </span>
                )}

                <span className="muted" style={{ fontSize: "0.875rem" }}>
                  Página {currentPage} de {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link href={`/changelog?page=${currentPage + 1}`} className="btn ghost">
                    Próxima
                  </Link>
                ) : (
                  <span className="btn ghost" style={{ opacity: 0.6, pointerEvents: "none" }}>
                    Próxima
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <h3>Nenhuma movimentação registrada</h3>
            <p className="muted">O histórico ainda está vazio.</p>
          </div>
        )}

        <div className="cta-strip" style={{ marginTop: "3rem" }}>
          <div>
            <strong>Quer fazer parte da equipe?</strong>
            <p className="muted">Confira os requisitos e candidate-se no Discord.</p>
          </div>
          <Link href="/equipe" className="btn secondary btn-sm">
            Ver equipe
          </Link>
        </div>
      </div>
    </section>
  );
}
