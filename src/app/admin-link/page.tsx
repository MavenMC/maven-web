import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { verifyAdminLinkToken } from "@/lib/admin-link";

type AdminLinkPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function AdminLinkPage({ searchParams }: AdminLinkPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const token = resolvedParams?.token;
  if (!token) {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <h1>Vincular Discord</h1>
          <p>Token ausente. Inicie o vinculo pelo painel administrativo.</p>
        </header>
        <Link href="/admin-login" className="btn primary">
          Ir para login admin
        </Link>
      </main>
    );
  }

  let payload: { adminId: string; role?: string | null };
  try {
    payload = await verifyAdminLinkToken(token);
  } catch {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <h1>Vincular Discord</h1>
          <p>Token invalido ou expirado. Gere um novo vinculo no painel.</p>
        </header>
        <Link href="/admin-login" className="btn primary">
          Ir para login admin
        </Link>
      </main>
    );
  }

  const session = await getServerSession(authOptions);
  const discordId = session?.user?.playerId;
  if (!discordId) {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <h1>Vincular Discord</h1>
          <p>Entre com sua conta Discord para concluir o vinculo.</p>
        </header>
        <Link href="/login" className="btn primary">
          Entrar com Discord
        </Link>
      </main>
    );
  }

  const accessLevel = payload.role ?? "admin";
  const discordUsername = session?.user?.name ?? null;

  await dbQuery(
    `INSERT INTO admin_access (discord_id, discord_username, access_level, granted_by, is_active)
     VALUES (:discord_id, :discord_username, :access_level, :granted_by, 1)
     ON DUPLICATE KEY UPDATE
       is_active = 1,
       access_level = :access_level,
       discord_username = :discord_username`,
    {
      discord_id: discordId,
      discord_username: discordUsername,
      access_level: accessLevel,
      granted_by: payload.adminId,
    },
  );

  redirect("/admin");
}
