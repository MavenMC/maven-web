import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

type PlayerRow = {
  discord_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  email: string | null;
  minecraft_name: string | null;
  linked_at: Date | string;
  is_admin: number;
  admin_level: string | null;
  admin_granted_at: Date | string | null;
};

async function getAllPlayers() {
  return dbQuery<PlayerRow[]>(
    `SELECT 
      pa.discord_id,
      pa.discord_username,
      pa.discord_avatar,
      pa.email,
      pa.minecraft_name,
      pa.linked_at,
      COALESCE(aa.is_active, 0) as is_admin,
      aa.access_level as admin_level,
      aa.granted_at as admin_granted_at
    FROM player_accounts pa
    LEFT JOIN admin_access aa ON pa.discord_id = aa.discord_id
    WHERE pa.discord_id IS NOT NULL
    ORDER BY aa.is_active DESC, pa.linked_at DESC`,
  );
}

async function grantAdmin(formData: FormData) {
  "use server";
  const session = await requireAdmin();

  const discordId = String(formData.get("discord_id") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const level = String(formData.get("level") || "admin").trim();

  if (!discordId) return;

  await dbQuery(
    `INSERT INTO admin_access (discord_id, discord_username, access_level, granted_by, is_active)
     VALUES (:discord_id, :username, :level, :granted_by, 1)
     ON DUPLICATE KEY UPDATE 
       is_active = 1,
       access_level = :level,
       discord_username = :username`,
    {
      discord_id: discordId,
      username: username || null,
      level,
      granted_by: session.user?.playerId || null,
    },
  );

  revalidatePath("/admin/admins");
}

async function revokeAdmin(formData: FormData) {
  "use server";
  const session = await requireAdmin();

  const discordId = String(formData.get("discord_id") || "").trim();

  if (!discordId) return;

  await dbQuery(
    `UPDATE admin_access 
     SET is_active = 0, revoked_at = NOW(), revoked_by = :revoked_by
     WHERE discord_id = :discord_id`,
    {
      discord_id: discordId,
      revoked_by: session.user?.playerId || null,
    },
  );

  revalidatePath("/admin/admins");
}

export default async function AdminAdminsPage() {
  await requireAdmin();
  const players = await getAllPlayers();

  const admins = players.filter(p => p.is_admin === 1);
  const nonAdmins = players.filter(p => p.is_admin === 0);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Gerenciar Administradores</h1>
        <p>Conceda ou revogue acesso ao painel administrativo para usuários com Discord vinculado.</p>
      </header>

      <section className="admin-section">
        <h2 className="section-title">Administradores Ativos ({admins.length})</h2>
        {admins.length === 0 ? (
          <p className="muted">Nenhum administrador cadastrado.</p>
        ) : (
          <div className="admin-users-grid">
            {admins.map((player) => (
              <div key={player.discord_id} className="card admin-user-card">
                <div className="admin-user-info">
                  {player.discord_avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${player.discord_id}/${player.discord_avatar}.png?size=64`}
                      alt={player.discord_username || "User"}
                      className="admin-user-avatar"
                    />
                  )}
                  <div className="admin-user-details">
                    <h3>{player.discord_username || "Usuário sem nome"}</h3>
                    <p className="muted">ID: {player.discord_id}</p>
                    {player.minecraft_name && (
                      <p className="muted">Minecraft: {player.minecraft_name}</p>
                    )}
                    <span className={`badge badge-${player.admin_level}`}>
                      {player.admin_level || "admin"}
                    </span>
                  </div>
                </div>
                <div className="admin-user-actions">
                  <form action={revokeAdmin}>
                    <input type="hidden" name="discord_id" value={player.discord_id} />
                    <button type="submit" className="btn danger-ghost">
                      Revogar Acesso
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="section-title">Usuários com Discord Vinculado ({nonAdmins.length})</h2>
        {nonAdmins.length === 0 ? (
          <p className="muted">Nenhum usuário não-admin encontrado.</p>
        ) : (
          <div className="admin-users-grid">
            {nonAdmins.map((player) => (
              <div key={player.discord_id} className="card admin-user-card">
                <div className="admin-user-info">
                  {player.discord_avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${player.discord_id}/${player.discord_avatar}.png?size=64`}
                      alt={player.discord_username || "User"}
                      className="admin-user-avatar"
                    />
                  )}
                  <div className="admin-user-details">
                    <h3>{player.discord_username || "Usuário sem nome"}</h3>
                    <p className="muted">ID: {player.discord_id}</p>
                    {player.minecraft_name && (
                      <p className="muted">Minecraft: {player.minecraft_name}</p>
                    )}
                    {player.email && (
                      <p className="muted">{player.email}</p>
                    )}
                  </div>
                </div>
                <div className="admin-user-actions">
                  <form action={grantAdmin}>
                    <input type="hidden" name="discord_id" value={player.discord_id} />
                    <input type="hidden" name="username" value={player.discord_username || ""} />
                    <select name="level" className="admin-select">
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button type="submit" className="btn primary">
                      Conceder Acesso
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
