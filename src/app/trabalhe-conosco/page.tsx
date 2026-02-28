import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { redirect } from "next/navigation";
import RecruitmentStepForm from "./RecruitmentStepForm";
import {
  ensureRecruitmentTables,
  getRecruitmentQuestions,
  getRecruitmentSettings,
  isRecruitmentOpen,
} from "@/lib/recruitment";

const DEFAULT_TERMS_MDX = `## Termo de Candidatura

Ao marcar o aceite e enviar este formulário, você declara que:

- As informações fornecidas são **verdadeiras**;
- Está ciente de que dados inconsistentes podem levar à reprovação;
- Concorda com as regras de conduta da equipe durante o processo seletivo.

Se não concordar com os termos, **não envie** a candidatura.`;

type PlayerRow = {
  discord_id: string | null;
  minecraft_uuid: string | null;
  minecraft_name: string | null;
};

async function proceedToRecruitmentForm(formData: FormData) {
  "use server";

  const accepted = formData.get("accept_terms") === "on";
  if (!accepted) {
    redirect("/trabalhe-conosco?error=terms");
  }

  redirect("/trabalhe-conosco?step=form");
}

async function submitRecruitmentForm(formData: FormData) {
  "use server";

  await ensureRecruitmentTables();

  const session = await getServerSession(authOptions);
  if (!session?.user?.playerId) {
    redirect("/login");
  }

  const playerRows = await dbQuery<PlayerRow[]>(
    `SELECT discord_id, minecraft_uuid, minecraft_name
     FROM player_accounts
     WHERE discord_id = :discord_id
     LIMIT 1`,
    { discord_id: session.user.playerId },
  );
  const player = playerRows[0] ?? null;

  if (!player?.minecraft_uuid) {
    redirect("/perfil#vinculo");
  }

  const settings = await getRecruitmentSettings();
  if (!isRecruitmentOpen(settings)) {
    redirect("/trabalhe-conosco?closed=1");
  }

  const acceptedTerms = String(formData.get("accept_terms") || "") === "1";
  if (!acceptedTerms) {
    redirect("/trabalhe-conosco?error=terms");
  }

  const questions = await getRecruitmentQuestions(true);
  const answers: Record<string, string> = {};

  for (const question of questions) {
    const fieldName = `question_${question.id}`;
    const value = String(formData.get(fieldName) || "").trim();

    if (question.required && !value) {
      redirect("/trabalhe-conosco?step=form&error=required");
    }

    answers[question.label] = value;
  }

  await dbQuery(
    `INSERT INTO site_recruitment_responses
      (minecraft_uuid, minecraft_name, discord_id, discord_name, answers_json, terms_accepted, terms_accepted_at, submitted_at)
     VALUES
      (:minecraft_uuid, :minecraft_name, :discord_id, :discord_name, :answers_json, :terms_accepted, :terms_accepted_at, NOW())`,
    {
      minecraft_uuid: player.minecraft_uuid,
      minecraft_name: player.minecraft_name,
      discord_id: player.discord_id,
      discord_name: session.user?.name ?? null,
      answers_json: JSON.stringify(answers),
      terms_accepted: 1,
      terms_accepted_at: new Date(),
    },
  );

  redirect("/trabalhe-conosco?step=form&success=1");
}

export default async function TrabalheConoscoPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string; closed?: string; step?: string }>;
}) {
  await ensureRecruitmentTables();
  const session = await getServerSession(authOptions);
  const resolvedParams = (await searchParams) ?? {};

  const settings = await getRecruitmentSettings();
  const questions = await getRecruitmentQuestions(true);
  const open = isRecruitmentOpen(settings);
  const termsMdx = String(settings?.terms_mdx || "").trim() || DEFAULT_TERMS_MDX;
  const step = resolvedParams.step === "form" ? "form" : "terms";

  const success = resolvedParams.success === "1";
  const requiredError = resolvedParams.error === "required";
  const termsError = resolvedParams.error === "terms";

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
    "SELECT discord_id, minecraft_uuid, minecraft_name FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
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

  if (!open) {
    return (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Trabalhe Conosco</span>
              <h2>Período seletivo fechado</h2>
              <p className="muted">
                No momento não estamos recebendo novas candidaturas. Fique atento aos próximos períodos abertos.
              </p>
              <p className="muted" style={{ marginTop: "0.5rem" }}>
                Abertura: {settings?.opens_at ? new Date(settings.opens_at).toLocaleString("pt-BR") : "Não definida"}
                {" • "}
                Fechamento: {settings?.closes_at ? new Date(settings.closes_at).toLocaleString("pt-BR") : "Não definido"}
              </p>
            </div>
            <Link href="/forum" className="btn secondary">
              Acompanhar novidades
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (step !== "form") {
    return (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Trabalhe Conosco</span>
              <h2>Leia e aceite os termos</h2>
              <p className="muted">
                Para continuar para o formulário, é obrigatório aceitar os termos abaixo.
              </p>
            </div>
          </div>

          <div className="feature-grid">
            <div className="card">
              <h3 className="card-title">Termos de candidatura</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <MDXRemote source={termsMdx} />
              </div>

              {termsError && (
                <div className="card" style={{ marginTop: "1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.5)" }}>
                  <strong>É necessário aceitar os termos.</strong>
                  <p className="muted" style={{ margin: 0 }}>Sem o aceite, a candidatura não pode continuar.</p>
                </div>
              )}

              <form className="admin-form" action={proceedToRecruitmentForm}>
                <label className="checkbox" style={{ marginBottom: "0.75rem" }}>
                  <input type="checkbox" name="accept_terms" required />
                  Li e aceito os termos de candidatura.
                </label>

                <button type="submit" className="btn primary">Continuar para o formulário</button>
              </form>
            </div>

            <div className="card" style={{ alignSelf: "start" }}>
              <span className="card-eyebrow">Requisitos</span>
              <h3 className="card-title">O que procuramos</h3>
              <p className="card-sub">
               ⚜︎ Pessoas comprometidas, educadas e que curtam trabalhar em equipe.
              </p>
              <div>
                <p className="card-sub">• Disponibilidade mínima de 6h semanais.</p>
                <p className="card-sub">• Ter 14+ anos e maturidade.</p>
                <p className="card-sub">• Conhecimento das regras e diretrizes.</p>
                <p className="card-sub">• Boa comunicação no Discord.</p>
                <p className="card-sub">• Não ter punições ativas no discord ou servidor.</p>
                <p className="card-sub">• Precisa ser ativo e cadastrado.</p>
                <p className="card-sub">• Disponibilidade de um dispositivo de captura de som (microfone).</p>
                <p className="card-sub">• Possuir no mínimo 3 semanas dentro do nosso discord.</p>
              </div>
            </div>
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

            {success && (
              <div className="card" style={{ marginBottom: "1rem", borderColor: "rgba(34,197,94,0.5)" }}>
                <strong>Candidatura enviada com sucesso!</strong>
                <p className="muted" style={{ margin: 0 }}>Recebemos seu formulário e vamos analisar.</p>
              </div>
            )}

            {requiredError && (
              <div className="card" style={{ marginBottom: "1rem", borderColor: "rgba(239,68,68,0.5)" }}>
                <strong>Campos obrigatórios faltando.</strong>
                <p className="muted" style={{ margin: 0 }}>Preencha todas as perguntas obrigatórias e tente novamente.</p>
              </div>
            )}

            <RecruitmentStepForm
              action={submitRecruitmentForm}
              playerName={player.minecraft_name ?? ""}
              discordName={session.user?.name ?? ""}
              questions={questions}
              questionsPerStep={8}
            />
          </div>

          <div className="card" style={{ alignSelf: "start" }}>
            <span className="card-eyebrow">Requisitos</span>
            <h3 className="card-title">O que procuramos</h3>
            <p className="card-sub">
               ⚜︎ Pessoas comprometidas, educadas e que curtam trabalhar em equipe.
              </p>
              <div>
                <p className="card-sub">• Disponibilidade mínima de 6h semanais.</p>
                <p className="card-sub">• Ter 14+ anos e maturidade.</p>
                <p className="card-sub">• Conhecimento das regras e diretrizes.</p>
                <p className="card-sub">• Boa comunicação no Discord.</p>
                <p className="card-sub">• Não ter punições ativas no discord ou servidor.</p>
                <p className="card-sub">• Precisa ser ativo e cadastrado.</p>
                <p className="card-sub">• Disponibilidade de um dispositivo de captura de som (microfone).</p>
                <p className="card-sub">• Possuir no mínimo 3 semanas dentro do nosso discord.</p>
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
