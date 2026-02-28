"use client";

import { useMemo, useRef, useState } from "react";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "email"
  | "tel"
  | "url"
  | "date"
  | "time"
  | "datetime-local";

type RecruitmentQuestion = {
  id: number;
  label: string;
  field_type: FieldType;
  required: number;
  options: string[];
};

type Props = {
  playerName: string;
  discordName: string;
  questions: RecruitmentQuestion[];
  questionsPerStep?: number;
  action: (formData: FormData) => void;
};

const INPUT_TYPES = new Set([
  "text",
  "number",
  "email",
  "tel",
  "url",
  "date",
  "time",
  "datetime-local",
]);

export default function RecruitmentStepForm({
  playerName,
  discordName,
  questions,
  questionsPerStep = 8,
  action,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [stepError, setStepError] = useState("");

  const questionChunks = useMemo(() => {
    const chunks: RecruitmentQuestion[][] = [];
    for (let index = 0; index < questions.length; index += questionsPerStep) {
      chunks.push(questions.slice(index, index + questionsPerStep));
    }
    return chunks.length ? chunks : [[]];
  }, [questions, questionsPerStep]);

  const totalSteps = questionChunks.length;
  const stepQuestions = questionChunks[currentStep] ?? [];
  const currentStepQuestionIds = new Set(stepQuestions.map((question) => question.id));
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  const getAnswer = (questionId: number) => answers[questionId] ?? "";

  const readCurrentStepAnswers = () => {
    const element = formRef.current;
    if (!element) return {} as Record<number, string>;

    const formData = new FormData(element);
    const currentValues: Record<number, string> = {};

    for (const question of stepQuestions) {
      const fieldName = `question_${question.id}`;
      currentValues[question.id] = String(formData.get(fieldName) || "");
    }

    return currentValues;
  };

  const buildMergedAnswers = () => ({
    ...answers,
    ...readCurrentStepAnswers(),
  });

  const setAnswer = (questionId: number, value: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };

  const validateQuestions = (items: RecruitmentQuestion[], sourceAnswers: Record<number, string>) => {
    for (const question of items) {
      if (!question.required) continue;
      const value = String(sourceAnswers[question.id] || "").trim();
      if (!value) {
        return question;
      }
    }
    return null;
  };

  const goToNextStep = () => {
    const mergedAnswers = buildMergedAnswers();
    setAnswers(mergedAnswers);

    const missingQuestion = validateQuestions(stepQuestions, mergedAnswers);
    if (missingQuestion) {
      setStepError(`Preencha o campo obrigatório: ${missingQuestion.label}`);
      return;
    }

    setStepError("");
    setCurrentStep((previous) => Math.min(previous + 1, totalSteps - 1));
  };

  const goToPreviousStep = () => {
    setAnswers(buildMergedAnswers());
    setStepError("");
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    const mergedAnswers = buildMergedAnswers();
    setAnswers(mergedAnswers);

    const missingQuestion = validateQuestions(questions, mergedAnswers);
    if (!missingQuestion) {
      setStepError("");
      return;
    }

    event.preventDefault();

    const missingStepIndex = questionChunks.findIndex((chunk) =>
      chunk.some((question) => question.id === missingQuestion.id),
    );

    if (missingStepIndex >= 0) {
      setCurrentStep(missingStepIndex);
    }

    setStepError(`Preencha o campo obrigatório: ${missingQuestion.label}`);
  };

  return (
    <form ref={formRef} className="admin-form" action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="accept_terms" value="1" />

      {questions
        .filter((question) => !currentStepQuestionIds.has(question.id))
        .map((question) => (
        <input
          key={`hidden-${question.id}`}
          type="hidden"
          name={`question_${question.id}`}
          value={getAnswer(question.id)}
          readOnly
        />
        ))}

      <div className="admin-form-grid">
        <label>
          Nome no jogo
          <input type="text" value={playerName} disabled readOnly />
        </label>
        <label>
          Usuário do Discord
          <input type="text" value={discordName} disabled readOnly />
        </label>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Etapa {currentStep + 1} de {totalSteps}
      </p>

      <div style={{ marginTop: "-0.25rem", marginBottom: "0.75rem" }}>
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "var(--color-primary, #f08a2b)",
              transition: "width 200ms ease",
            }}
          />
        </div>
        <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
          Progresso: {progressPercent}%
        </p>
      </div>

      {stepQuestions.map((question) => {
        const answer = getAnswer(question.id);

        if (question.field_type === "textarea") {
          return (
            <label key={question.id}>
              {question.label}
              {question.required ? " *" : ""}
              <textarea
                name={`question_${question.id}`}
                rows={4}
                value={answer}
                onChange={(event) => setAnswer(question.id, event.target.value)}
                placeholder="Digite sua resposta"
              />
            </label>
          );
        }

        if (question.field_type === "select") {
          return (
            <label key={question.id}>
              {question.label}
              {question.required ? " *" : ""}
              <select
                name={`question_${question.id}`}
                value={answer}
                onChange={(event) => setAnswer(question.id, event.target.value)}
              >
                <option value="">Selecione</option>
                {question.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        const inputType = INPUT_TYPES.has(question.field_type)
          ? question.field_type
          : "text";

        return (
          <label key={question.id}>
            {question.label}
            {question.required ? " *" : ""}
            <input
              name={`question_${question.id}`}
              type={inputType}
              value={answer}
              onChange={(event) => setAnswer(question.id, event.target.value)}
              placeholder="Digite sua resposta"
            />
          </label>
        );
      })}

      {stepError && (
        <div className="card" style={{ borderColor: "rgba(239,68,68,0.5)" }}>
          <strong>Campos obrigatórios faltando.</strong>
          <p className="muted" style={{ margin: 0 }}>{stepError}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn ghost"
          onClick={goToPreviousStep}
          disabled={currentStep === 0}
          style={currentStep === 0 ? { opacity: 0.6, pointerEvents: "none" } : undefined}
        >
          Voltar
        </button>

        {currentStep < totalSteps - 1 ? (
          <button type="button" className="btn primary" onClick={goToNextStep}>
            Próxima etapa
          </button>
        ) : (
          <button type="submit" className="btn primary">
            Enviar candidatura
          </button>
        )}
      </div>
    </form>
  );
}
