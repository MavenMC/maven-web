const { spawnSync } = require("child_process");

const host = process.env.MYSQL_HOST || process.env.HOST;
const port = process.env.MYSQL_PORT || "3306";
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

if (!host || !user || !password || !database) {
  console.error("Missing MYSQL_* environment variables for Prisma.");
  process.exit(1);
}

const databaseUrl = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
process.env.DATABASE_URL = databaseUrl;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/prisma-env.js <prisma-args>");
  process.exit(1);
}

const hasSchemaArg = args.includes("--schema");
const finalArgs = hasSchemaArg ? args : [...args, "--schema", "prisma/schema.prisma"];

const result = spawnSync("npx", ["prisma", ...finalArgs], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
