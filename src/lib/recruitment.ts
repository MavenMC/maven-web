import { dbQuery } from "@/lib/db";

export type RecruitmentSettings = {
  id: number;
  is_open: number;
  opens_at: Date | string | null;
  closes_at: Date | string | null;
  terms_mdx: string | null;
  updated_at: Date | string | null;
};

export type RecruitmentQuestionRow = {
  id: number;
  label: string;
  field_type:
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
  required: number;
  options_json: string | null;
  sort_order: number;
  active: number;
};

export type RecruitmentQuestion = RecruitmentQuestionRow & {
  options: string[];
};

export type RecruitmentResponseRow = {
  id: number;
  minecraft_uuid: string | null;
  minecraft_name: string | null;
  discord_id: string | null;
  discord_name: string | null;
  answers_json: string;
  terms_accepted: number;
  terms_accepted_at: Date | string | null;
  review_status: "pending" | "approved" | "rejected";
  submitted_at: Date | string;
};

export async function ensureRecruitmentTables() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_recruitment_settings (
      id TINYINT NOT NULL,
      is_open BOOLEAN NOT NULL DEFAULT FALSE,
      opens_at DATETIME NULL,
      closes_at DATETIME NULL,
      terms_mdx LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await dbQuery(`
    ALTER TABLE site_recruitment_settings
    ADD COLUMN IF NOT EXISTS terms_mdx LONGTEXT NULL AFTER closes_at;
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_recruitment_questions (
      id INT NOT NULL AUTO_INCREMENT,
      label VARCHAR(180) NOT NULL,
      field_type VARCHAR(20) NOT NULL DEFAULT 'text',
      required BOOLEAN NOT NULL DEFAULT TRUE,
      options_json TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_site_recruitment_questions_active (active),
      INDEX idx_site_recruitment_questions_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_recruitment_responses (
      id INT NOT NULL AUTO_INCREMENT,
      minecraft_uuid VARCHAR(36) NULL,
      minecraft_name VARCHAR(80) NULL,
      discord_id VARCHAR(36) NULL,
      discord_name VARCHAR(100) NULL,
      answers_json LONGTEXT NOT NULL,
      terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
      terms_accepted_at DATETIME NULL,
      review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_site_recruitment_responses_submitted (submitted_at),
      INDEX idx_site_recruitment_responses_discord (discord_id),
      INDEX idx_site_recruitment_responses_minecraft (minecraft_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await dbQuery(`
    ALTER TABLE site_recruitment_responses
    ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT FALSE AFTER answers_json,
    ADD COLUMN IF NOT EXISTS terms_accepted_at DATETIME NULL AFTER terms_accepted,
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER terms_accepted_at;
  `);

  await dbQuery(
    `INSERT INTO site_recruitment_settings (id, is_open)
     VALUES (1, 0)
     ON DUPLICATE KEY UPDATE id = VALUES(id)`
  );
}

export async function getRecruitmentSettings() {
  await ensureRecruitmentTables();
  const rows = await dbQuery<RecruitmentSettings[]>(
    `SELECT id, is_open, opens_at, closes_at, terms_mdx, updated_at
     FROM site_recruitment_settings
     WHERE id = 1
     LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function getRecruitmentQuestions(activeOnly = false) {
  await ensureRecruitmentTables();
  const rows = await dbQuery<RecruitmentQuestionRow[]>(
    `SELECT id, label, field_type, required, options_json, sort_order, active
     FROM site_recruitment_questions
     ${activeOnly ? "WHERE active = 1" : ""}
     ORDER BY sort_order ASC, id ASC`
  );

  return rows.map<RecruitmentQuestion>((row) => {
    let options: string[] = [];
    if (row.options_json) {
      try {
        const parsed = JSON.parse(row.options_json);
        if (Array.isArray(parsed)) {
          options = parsed.map((value) => String(value).trim()).filter(Boolean);
        }
      } catch {
        options = [];
      }
    }

    return {
      ...row,
      options,
    };
  });
}

export function isRecruitmentOpen(settings: RecruitmentSettings | null, now = new Date()) {
  if (!settings || !settings.is_open) return false;

  const opensAt = settings.opens_at ? new Date(settings.opens_at) : null;
  const closesAt = settings.closes_at ? new Date(settings.closes_at) : null;

  if (opensAt && now < opensAt) return false;
  if (closesAt && now > closesAt) return false;

  return true;
}

export function toDateTimeLocalValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
