import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  ensureRecruitmentTables,
  getRecruitmentQuestions,
  getRecruitmentSettings,
  toDateTimeLocalValue,
} from "@/lib/recruitment";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

type ResponseRow = {
  id: number;
  discord_id: string | null;
  minecraft_name: string | null;
  discord_name: string | null;
  answers_json: string;
  terms_accepted: number;
  terms_accepted_at: Date | string | null;
  review_status: "pending" | "approved" | "rejected";
  user_total_submissions: number;
  user_rejected_submissions: number;
  submitted_at: Date | string;
};

type CountRow = { total: number };

type SearchParams = {
  page?: string | string[];
  start?: string | string[];
  end?: string | string[];
  tab?: string | string[];
};

const RESPONSE_PAGE_SIZE = 20;
const SUPPORTED_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "select",
  "email",
  "tel",
  "url",
  "date",
  "time",
  "datetime-local",
] as const;

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeDateTimeForSql(input: string) {
  const value = String(input || "").trim();
  if (!value) return null;
  return value.replace("T", " ") + ":00";
}

function buildFilters(start: string, end: string) {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (start) {
    conditions.push("submitted_at >= :start_at");
    params.start_at = `${start} 00:00:00`;
  }

  if (end) {
    conditions.push("submitted_at <= :end_at");
    params.end_at = `${end} 23:59:59`;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, params };
}

async function updateRecruitmentSettings(formData: FormData) {
  "use server";
  await requireAdmin();
  await ensureRecruitmentTables();

  const isOpen = formData.get("is_open") === "on" ? 1 : 0;
  const opensAt = normalizeDateTimeForSql(String(formData.get("opens_at") || ""));
  const closesAt = normalizeDateTimeForSql(String(formData.get("closes_at") || ""));
  const termsMdx = String(formData.get("terms_mdx") || "").trim();

  await dbQuery(
    `UPDATE site_recruitment_settings
     SET is_open = :is_open,
         opens_at = :opens_at,
         closes_at = :closes_at,
         terms_mdx = :terms_mdx,
         updated_at = NOW()
     WHERE id = 1`,
    {
      is_open: isOpen,
      opens_at: opensAt,
      closes_at: closesAt,
      terms_mdx: termsMdx || null,
    },
  );

  revalidatePath("/trabalhe-conosco");
  revalidatePath("/admin/formulario");
  redirect("/admin/formulario?tab=config");
}

async function createQuestion(formData: FormData) {
  "use server";
  await requireAdmin();
  await ensureRecruitmentTables();

  const label = String(formData.get("label") || "").trim();
  const fieldTypeRaw = String(formData.get("field_type") || "text").trim();
  const fieldType = SUPPORTED_FIELD_TYPES.includes(fieldTypeRaw as (typeof SUPPORTED_FIELD_TYPES)[number])
    ? fieldTypeRaw
    : "text";
  const required = formData.get("required") === "on" ? 1 : 0;
  const sortOrderRaw = String(formData.get("sort_order") || "").trim();
  const active = formData.get("active") === "on" ? 1 : 0;
  const optionsRaw = String(formData.get("options") || "").trim();

  if (!label) return;

  const options = optionsRaw
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

  let finalSortOrder = 0;
  if (sortOrderRaw) {
    const parsedSortOrder = Number(sortOrderRaw);
    finalSortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0;
  } else {
    const nextSortOrderRows = await dbQuery<Array<{ next_sort_order: number }>>(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
       FROM site_recruitment_questions`,
    );
    finalSortOrder = Number(nextSortOrderRows[0]?.next_sort_order ?? 0);
  }

  await dbQuery(
    `INSERT INTO site_recruitment_questions
      (label, field_type, required, options_json, sort_order, active)
     VALUES
      (:label, :field_type, :required, :options_json, :sort_order, :active)`,
    {
      label,
      field_type: fieldType,
      required,
      options_json: fieldType === "select" ? JSON.stringify(options) : null,
      sort_order: finalSortOrder,
      active,
    },
  );

  revalidatePath("/trabalhe-conosco");
  revalidatePath("/admin/formulario");
  redirect("/admin/formulario?tab=editor");
}

async function updateQuestion(formData: FormData) {
  "use server";
  await requireAdmin();
  await ensureRecruitmentTables();

  const id = Number(formData.get("id") || 0);
  const label = String(formData.get("label") || "").trim();
  const fieldTypeRaw = String(formData.get("field_type") || "text").trim();
  const fieldType = SUPPORTED_FIELD_TYPES.includes(fieldTypeRaw as (typeof SUPPORTED_FIELD_TYPES)[number])
    ? fieldTypeRaw
    : "text";
  const required = formData.get("required") === "on" ? 1 : 0;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;
  const optionsRaw = String(formData.get("options") || "").trim();

  if (!id || !label) return;

  const options = optionsRaw
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);

  await dbQuery(
    `UPDATE site_recruitment_questions
     SET label = :label,
         field_type = :field_type,
         required = :required,
         options_json = :options_json,
         sort_order = :sort_order,
         active = :active,
         updated_at = NOW()
     WHERE id = :id`,
    {
      id,
      label,
      field_type: fieldType,
      required,
      options_json: fieldType === "select" ? JSON.stringify(options) : null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      active,
    },
  );

  revalidatePath("/trabalhe-conosco");
  revalidatePath("/admin/formulario");
  redirect("/admin/formulario?tab=editor");
}

async function deleteQuestion(formData: FormData) {
  "use server";
  await requireAdmin();
  await ensureRecruitmentTables();

  const id = Number(formData.get("id") || 0);
  if (!id) return;

  await dbQuery("DELETE FROM site_recruitment_questions WHERE id = :id", { id });

  revalidatePath("/trabalhe-conosco");
  revalidatePath("/admin/formulario");
  redirect("/admin/formulario?tab=editor");
}

async function moveQuestion(formData: FormData) {
  "use server";
  await requireAdmin();
  await ensureRecruitmentTables();

  const id = Number(formData.get("id") || 0);
  const direction = String(formData.get("direction") || "").trim();

  if (!id || (direction !== "up" && direction !== "down")) return;

  const currentRows = await dbQuery<Array<{ id: number; sort_order: number }>>(
    `SELECT id, sort_order
     FROM site_recruitment_questions
     WHERE id = :id
     LIMIT 1`,
    { id },
  );

  const current = currentRows[0];
  if (!current) return;

  const neighborRows = await dbQuery<Array<{ id: number; sort_order: number }>>(
    direction === "up"
      ? `SELECT id, sort_order
         FROM site_recruitment_questions
         WHERE (sort_order < :sort_order)
            OR (sort_order = :sort_order AND id < :id)
         ORDER BY sort_order DESC, id DESC
         LIMIT 1`
      : `SELECT id, sort_order
         FROM site_recruitment_questions
         WHERE (sort_order > :sort_order)
            OR (sort_order = :sort_order AND id > :id)
         ORDER BY sort_order ASC, id ASC
         LIMIT 1`,
    {
      id: current.id,
      sort_order: current.sort_order,
    },
  );

  const neighbor = neighborRows[0];
  if (!neighbor) return;

  await dbQuery(
    `UPDATE site_recruitment_questions
     SET sort_order = CASE
       WHEN id = :current_id THEN :neighbor_sort_order
       WHEN id = :neighbor_id THEN :current_sort_order
       ELSE sort_order
     END
     WHERE id IN (:current_id, :neighbor_id)`,
    {
      current_id: current.id,
      neighbor_id: neighbor.id,
      current_sort_order: current.sort_order,
      neighbor_sort_order: neighbor.sort_order,
    },
  );

  revalidatePath("/trabalhe-conosco");
  revalidatePath("/admin/formulario");
  redirect("/admin/formulario?tab=editor");
}

async function updateResponseStatus(formData: FormData) {
  "use server";
  await requireAdmin();
  await ensureRecruitmentTables();

  const id = Number(formData.get("id") || 0);
  const statusRaw = String(formData.get("status") || "").trim();
  const status: "pending" | "approved" | "rejected" =
    statusRaw === "approved" || statusRaw === "rejected" ? statusRaw : "pending";

  if (!id) return;

  await dbQuery(
    `UPDATE site_recruitment_responses
     SET review_status = :status
     WHERE id = :id`,
    { id, status },
  );

  revalidatePath("/admin/formulario");
  redirect("/admin/formulario?tab=responses");
}

export default async function AdminFormularioPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdmin();
  await ensureRecruitmentTables();

  const resolvedSearchParams = (await searchParams) ?? {};
  const start = getParam(resolvedSearchParams, "start");
  const end = getParam(resolvedSearchParams, "end");
  const pageParam = Number(getParam(resolvedSearchParams, "page") || "1");
  const tabParam = getParam(resolvedSearchParams, "tab");
  const activeTab: "editor" | "responses" | "config" =
    tabParam === "responses" || tabParam === "config" ? tabParam : "editor";

  const settings = await getRecruitmentSettings();
  const questions = await getRecruitmentQuestions(false);

  const { whereClause, params } = buildFilters(start, end);
  const [countRow] = await dbQuery<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM site_recruitment_responses
     ${whereClause}`,
    params,
  );

  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / RESPONSE_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number.isFinite(pageParam) ? pageParam : 1), totalPages);
  const offset = (currentPage - 1) * RESPONSE_PAGE_SIZE;

  const responses = await dbQuery<ResponseRow[]>(
    `SELECT
        id,
        discord_id,
        minecraft_name,
        discord_name,
        answers_json,
        terms_accepted,
        terms_accepted_at,
        review_status,
        submitted_at,
        (
          SELECT COUNT(*)
          FROM site_recruitment_responses x
          WHERE x.discord_id <=> site_recruitment_responses.discord_id
        ) AS user_total_submissions,
        (
          SELECT COUNT(*)
          FROM site_recruitment_responses x
          WHERE x.discord_id <=> site_recruitment_responses.discord_id
            AND x.review_status = 'rejected'
        ) AS user_rejected_submissions
     FROM site_recruitment_responses
     ${whereClause}
     ORDER BY submitted_at DESC, id DESC
     LIMIT :limit OFFSET :offset`,
    {
      ...params,
      limit: RESPONSE_PAGE_SIZE,
      offset,
    },
  );

  const tabs: Array<{ key: "editor" | "responses" | "config"; label: string }> = [
    { key: "editor", label: "Editar formulário" },
    { key: "responses", label: "Respostas" },
    { key: "config", label: "Configuração" },
  ];

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Formulário - Trabalhe Conosco</h1>
        <p>Gerencie período seletivo, perguntas e respostas.</p>
      </header>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/formulario?tab=${tab.key}`}
              className={selected ? "btn primary" : "btn ghost"}
              aria-current={selected ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {activeTab === "editor" && (
        <section className="card admin-card">
          <h2 className="card-title">Seção 1 — Edição do formulário</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Crie perguntas, edite os campos e ajuste a ordem de exibição.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "1.5rem", alignItems: "start" }}>
            <div className="card" style={{ padding: "1rem" }}>
              <h3 style={{ marginTop: 0 }}>Nova pergunta</h3>
              <form className="admin-form" action={createQuestion}>
                <label>
                  Pergunta
                  <input name="label" placeholder="Ex: Por que você quer entrar na equipe?" required />
                </label>
                <label>
                  Tipo de campo
                  <select name="field_type" defaultValue="text">
                    <option value="text">Texto curto</option>
                    <option value="textarea">Texto longo</option>
                    <option value="number">Número</option>
                    <option value="select">Seleção</option>
                    <option value="email">E-mail</option>
                    <option value="tel">Telefone</option>
                    <option value="url">URL / Link</option>
                    <option value="date">Data</option>
                    <option value="time">Hora</option>
                    <option value="datetime-local">Data e hora</option>
                  </select>
                </label>
                <label>
                  Opções (apenas seleção)
                  <textarea name="options" rows={3} placeholder="Uma opção por linha ou separadas por vírgula" />
                </label>
                <label>
                  Ordem (opcional)
                  <input type="number" name="sort_order" placeholder="Automática" />
                </label>
                <label className="checkbox">
                  <input type="checkbox" name="required" defaultChecked />
                  Obrigatória
                </label>
                <label className="checkbox">
                  <input type="checkbox" name="active" defaultChecked />
                  Ativa
                </label>
                <button className="btn primary" type="submit">Criar pergunta</button>
              </form>
            </div>

            <div>
              <h3 style={{ marginTop: 0 }}>Perguntas cadastradas ({questions.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {questions.map((question) => (
                  <details key={question.id} className="card" style={{ padding: "1rem" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                      #{question.sort_order} • {question.label} ({question.field_type})
                      {!question.active ? " • Inativa" : ""}
                    </summary>

                    <form action={moveQuestion} style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <input type="hidden" name="id" defaultValue={question.id} />
                      <button className="btn ghost" type="submit" name="direction" value="up">Subir</button>
                      <button className="btn ghost" type="submit" name="direction" value="down">Descer</button>
                    </form>

                    <form className="admin-form" action={updateQuestion} style={{ marginTop: "0.75rem" }}>
                      <input type="hidden" name="id" defaultValue={question.id} />
                      <label>
                        Pergunta
                        <input name="label" defaultValue={question.label} required />
                      </label>
                      <label>
                        Tipo
                        <select name="field_type" defaultValue={question.field_type}>
                          <option value="text">Texto curto</option>
                          <option value="textarea">Texto longo</option>
                          <option value="number">Número</option>
                          <option value="select">Seleção</option>
                          <option value="email">E-mail</option>
                          <option value="tel">Telefone</option>
                          <option value="url">URL / Link</option>
                          <option value="date">Data</option>
                          <option value="time">Hora</option>
                          <option value="datetime-local">Data e hora</option>
                        </select>
                      </label>
                      <label>
                        Opções (seleção)
                        <textarea
                          name="options"
                          rows={3}
                          defaultValue={question.options.join("\n")}
                          placeholder="Uma opção por linha"
                        />
                      </label>
                      <label>
                        Ordem
                        <input type="number" name="sort_order" defaultValue={question.sort_order} />
                      </label>
                      <label className="checkbox">
                        <input type="checkbox" name="required" defaultChecked={Boolean(question.required)} />
                        Obrigatória
                      </label>
                      <label className="checkbox">
                        <input type="checkbox" name="active" defaultChecked={Boolean(question.active)} />
                        Ativa
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button className="btn primary" type="submit">Salvar</button>
                        <button className="btn ghost" type="submit" formAction={deleteQuestion}>
                          Excluir
                        </button>
                      </div>
                    </form>
                  </details>
                ))}

                {!questions.length && (
                  <p className="muted">Nenhuma pergunta cadastrada.</p>
                )}
              </div>
            </div>
          </div>
        </section>
        )}

        {activeTab === "responses" && (
        <section className="card admin-card">
          <h2 className="card-title">Seção 2 — Respostas</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Consulte as candidaturas recebidas e filtre por período.
          </p>

          <h3 style={{ marginTop: 0 }}>Respostas recebidas ({total})</h3>

          <form method="get" action="/admin/formulario" className="admin-form" style={{ marginBottom: "1rem" }}>
            <input type="hidden" name="tab" value="responses" />
            <div className="admin-form-grid">
              <label>
                De
                <input type="date" name="start" defaultValue={start} />
              </label>
              <label>
                Até
                <input type="date" name="end" defaultValue={end} />
              </label>
            </div>
            <button className="btn ghost" type="submit">Filtrar por período</button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {responses.map((response) => {
              const answers = (() => {
                try {
                  const parsed = JSON.parse(response.answers_json);
                  return parsed && typeof parsed === "object" ? parsed : {};
                } catch {
                  return {};
                }
              })() as Record<string, string>;

              return (
                <details key={response.id} className="card" style={{ padding: "1rem" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                    #{response.id} • {response.minecraft_name || "Sem nick"} • {new Date(response.submitted_at).toLocaleString("pt-BR")}
                  </summary>
                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p style={{ margin: 0, color: "#9ca3af" }}>Discord: {response.discord_name || "-"}</p>
                    <p style={{ margin: 0, color: "#9ca3af" }}>
                      Status: {response.review_status === "approved" ? "Aprovada" : response.review_status === "rejected" ? "Negada" : "Pendente"}
                    </p>
                    <p style={{ margin: 0, color: "#9ca3af" }}>
                      Histórico do usuário: {Number(response.user_total_submissions || 0)} envio(s) • {Number(response.user_rejected_submissions || 0)} negada(s)
                    </p>
                    <p style={{ margin: 0, color: "#9ca3af" }}>
                      Termos aceitos: {response.terms_accepted ? "Sim" : "Não"}
                      {response.terms_accepted && response.terms_accepted_at
                        ? ` • ${new Date(response.terms_accepted_at).toLocaleString("pt-BR")}`
                        : ""}
                    </p>

                    <form action={updateResponseStatus} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <input type="hidden" name="id" defaultValue={response.id} />
                      <button className="btn ghost" type="submit" name="status" value="pending">Marcar pendente</button>
                      <button className="btn primary" type="submit" name="status" value="approved">Aprovar</button>
                      <button className="btn ghost" type="submit" name="status" value="rejected">Negar</button>
                    </form>

                    {Object.entries(answers).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong>
                        <p style={{ margin: "0.25rem 0 0", color: "#d1d5db", whiteSpace: "pre-wrap" }}>{value || "-"}</p>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}

            {!responses.length && (
              <p className="muted">Nenhuma resposta para o filtro selecionado.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              {currentPage > 1 ? (
                <a className="btn ghost" href={`/admin/formulario?tab=responses&page=${currentPage - 1}${start ? `&start=${encodeURIComponent(start)}` : ""}${end ? `&end=${encodeURIComponent(end)}` : ""}`}>
                  Anterior
                </a>
              ) : (
                <span className="btn ghost" style={{ opacity: 0.6, pointerEvents: "none" }}>Anterior</span>
              )}

              <span className="muted">Página {currentPage} de {totalPages}</span>

              {currentPage < totalPages ? (
                <a className="btn ghost" href={`/admin/formulario?tab=responses&page=${currentPage + 1}${start ? `&start=${encodeURIComponent(start)}` : ""}${end ? `&end=${encodeURIComponent(end)}` : ""}`}>
                  Próxima
                </a>
              ) : (
                <span className="btn ghost" style={{ opacity: 0.6, pointerEvents: "none" }}>Próxima</span>
              )}
            </div>
          )}
        </section>
        )}

        {activeTab === "config" && (
        <section className="card admin-card">
          <h2 className="card-title">Seção 3 — Configuração do formulário</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Defina abertura e fechamento do período seletivo. Após o prazo final, o formulário bloqueia automaticamente novas respostas.
          </p>

          <div style={{ maxWidth: "480px" }}>
            <form className="admin-form" action={updateRecruitmentSettings}>
              <label className="checkbox">
                <input type="checkbox" name="is_open" defaultChecked={Boolean(settings?.is_open)} />
                Formulário aberto
              </label>
              <label>
                Abre em
                <input type="datetime-local" name="opens_at" defaultValue={toDateTimeLocalValue(settings?.opens_at)} />
              </label>
              <label>
                Fecha em (prazo automático)
                <input type="datetime-local" name="closes_at" defaultValue={toDateTimeLocalValue(settings?.closes_at)} />
              </label>
              <label>
                Termos (MDX)
                <textarea
                  name="terms_mdx"
                  rows={14}
                  defaultValue={settings?.terms_mdx ?? ""}
                  placeholder={`## Termos de candidatura\n\nAo enviar, você confirma que as informações são verdadeiras.\n\n- Respostas falsas podem resultar em reprovação.\n- **Mantenha respeito** durante todo o processo.`}
                />
              </label>
              <button className="btn primary" type="submit">
                Salvar configuração
              </button>
            </form>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
