import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { ICON_OPTIONS } from "@/lib/icon-map";

type RoleRow = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
  active: number;
};

type MemberRow = {
  id: number;
  role_id: number;
  role_name: string | null;
  role_color: string | null;
  name: string;
  minecraft: string;
  discord_id: string | null;
  responsibility: string | null;
  minecraft_uuid: string | null;
  linked_discord_id: string | null;
  discord_avatar: string | null;
  discord_username: string | null;
  sort_order: number;
  active: number;
};

async function getRoles() {
  return dbQuery<RoleRow[]>(
    "SELECT id, slug, name, icon, color, sort_order, active FROM site_staff_roles ORDER BY sort_order ASC, id ASC",
  );
}

async function getMembers() {
  return dbQuery<MemberRow[]>(
    `SELECT m.id,
            m.role_id,
            r.name AS role_name,
            r.color AS role_color,
            m.name,
            m.minecraft,
            m.discord_id,
            m.responsibility,
            m.minecraft_uuid,
            COALESCE(pa_discord.discord_id, pa_minecraft.discord_id) AS linked_discord_id,
            COALESCE(pa_discord.discord_avatar, pa_minecraft.discord_avatar) AS discord_avatar,
            COALESCE(pa_discord.discord_username, pa_minecraft.discord_username) AS discord_username,
            m.sort_order,
            m.active
     FROM site_staff_members m
     LEFT JOIN site_staff_roles r ON r.id = m.role_id
     LEFT JOIN player_accounts pa_discord
       ON pa_discord.discord_id COLLATE utf8mb4_general_ci = m.discord_id COLLATE utf8mb4_general_ci
     LEFT JOIN player_accounts pa_minecraft
       ON pa_minecraft.minecraft_name COLLATE utf8mb4_general_ci = m.minecraft COLLATE utf8mb4_general_ci
     ORDER BY m.sort_order ASC, m.id ASC`,
  );
}

async function createRole(formData: FormData) {
  "use server";
  await requireAdmin();

  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim().toLowerCase() || null;
  const color = String(formData.get("color") || "").trim() || "#f08a2b";
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!slug || !name) return;

  await dbQuery(
    `INSERT INTO site_staff_roles (slug, name, icon, color, sort_order, active)
     VALUES (:slug, :name, :icon, :color, :sort_order, :active)`,
    { slug, name, icon, color, sort_order: sortOrder, active },
  );

  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
}

async function updateRole(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim().toLowerCase() || null;
  const color = String(formData.get("color") || "").trim() || "#f08a2b";
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!id || !slug || !name) return;

  await dbQuery(
    `UPDATE site_staff_roles
     SET slug = :slug,
         name = :name,
         icon = :icon,
         color = :color,
         sort_order = :sort_order,
         active = :active
     WHERE id = :id`,
    { id, slug, name, icon, color, sort_order: sortOrder, active },
  );

  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
}

async function deleteRole(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) return;

  await dbQuery("DELETE FROM site_staff_roles WHERE id = :id", { id });
  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
}

async function createMember(formData: FormData) {
  "use server";
  await requireAdmin();

  const roleId = Number(formData.get("role_id"));
  const name = String(formData.get("name") || "").trim();
  const minecraft = String(formData.get("minecraft") || "").trim();
  const discordId = String(formData.get("discord_id") || "").trim() || null;
  const responsibility = String(formData.get("responsibility") || "").trim() || null;
  const minecraftUuid = String(formData.get("minecraft_uuid") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!roleId || !name || !minecraft) return;

  await dbQuery(
    `INSERT INTO site_staff_members (role_id, name, minecraft, discord_id, responsibility, minecraft_uuid, sort_order, active)
     VALUES (:role_id, :name, :minecraft, :discord_id, :responsibility, :minecraft_uuid, :sort_order, :active)`,
    {
      role_id: roleId,
      name,
      minecraft,
      discord_id: discordId,
      responsibility,
      minecraft_uuid: minecraftUuid,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
}

async function updateMember(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const roleId = Number(formData.get("role_id"));
  const name = String(formData.get("name") || "").trim();
  const minecraft = String(formData.get("minecraft") || "").trim();
  const discordId = String(formData.get("discord_id") || "").trim() || null;
  const responsibility = String(formData.get("responsibility") || "").trim() || null;
  const minecraftUuid = String(formData.get("minecraft_uuid") || "").trim() || null;
  const sortOrder = Number(formData.get("sort_order") || 0);
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!id || !roleId || !name || !minecraft) return;

  await dbQuery(
    `UPDATE site_staff_members
     SET role_id = :role_id,
         name = :name,
         minecraft = :minecraft,
         discord_id = :discord_id,
         responsibility = :responsibility,
         minecraft_uuid = :minecraft_uuid,
         sort_order = :sort_order,
         active = :active
     WHERE id = :id`,
    {
      id,
      role_id: roleId,
      name,
      minecraft,
      discord_id: discordId,
      responsibility,
      minecraft_uuid: minecraftUuid,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
}

async function deleteMember(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) return;

  await dbQuery("DELETE FROM site_staff_members WHERE id = :id", { id });
  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
}

export default async function AdminEquipePage() {
  const [roles, members] = await Promise.all([getRoles(), getMembers()]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Equipe</h1>
        <p>Gerencie cargos e membros exibidos na pagina de equipe.</p>
      </header>

      <section className="admin-split">
        <div className="card admin-card">
          <h2 className="card-title">Novo cargo</h2>
          <form className="admin-form" action={createRole}>
            <label>
              Identificador (slug)
              <input name="slug" placeholder="admin, mod, helper" />
            </label>
            <label>
              Nome
              <input name="name" placeholder="Admin" />
            </label>
            <label>
              Icone
              <input name="icon" list="role-icon-options" placeholder="ex: bright-crown" />
            </label>
            <label>
              Cor
              <input name="color" placeholder="#f08a2b" />
            </label>
            <label>
              Ordem
              <input type="number" name="sort_order" defaultValue={0} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked />
              Ativo
            </label>
            <button className="btn primary" type="submit">
              Salvar cargo
            </button>
          </form>
        </div>

        <datalist id="role-icon-options">
          {ICON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>

        <div className="card admin-card">
          <h2 className="card-title">Cargos cadastrados</h2>
          <div className="admin-list">
            {roles.map((role) => (
              <div key={role.id} className="card admin-card">
                <form className="admin-form" action={updateRole}>
                  <input type="hidden" name="id" value={role.id} />
                  <label>
                    Identificador (slug)
                    <input name="slug" defaultValue={role.slug} />
                  </label>
                  <label>
                    Nome
                    <input name="name" defaultValue={role.name} />
                  </label>
                  <label>
                    Icone
                    <input
                      name="icon"
                      list="role-icon-options"
                      defaultValue={role.icon ?? ""}
                      placeholder="ex: bright-crown"
                    />
                  </label>
                  <label>
                    Cor
                    <input name="color" defaultValue={role.color} />
                  </label>
                  <label>
                    Ordem
                    <input type="number" name="sort_order" defaultValue={role.sort_order} />
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" name="active" defaultChecked={Boolean(role.active)} />
                    Ativo
                  </label>
                  <button className="btn primary" type="submit">
                    Atualizar
                  </button>
                </form>
                <form action={deleteRole}>
                  <input type="hidden" name="id" value={role.id} />
                  <button className="btn ghost" type="submit">
                    Remover
                  </button>
                </form>
              </div>
            ))}
            {!roles.length && <p className="muted">Nenhum cargo cadastrado.</p>}
          </div>
        </div>
      </section>

      <section className="admin-split">
        <div className="card admin-card">
          <h2 className="card-title">Novo membro</h2>
          <form className="admin-form" action={createMember}>
            <label>
              Cargo
              <select name="role_id" defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome
              <input name="name" placeholder="iLemon" />
            </label>
            <label>
              Minecraft
              <input name="minecraft" placeholder="iLemon" />
            </label>
            <label>
              Discord ID (opcional)
              <input name="discord_id" placeholder="123456789012345678" />
            </label>
            <label>
              Minecraft UUID (opcional)
              <input name="minecraft_uuid" placeholder="1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" />
            </label>
            <label>
              Responsabilidade
              <input
                name="responsibility"
                placeholder="Diretor de Tecnologia e Financeiro"
              />
            </label>
            <label>
              Ordem
              <input type="number" name="sort_order" defaultValue={0} />
            </label>
            <label className="checkbox">
              <input type="checkbox" name="active" defaultChecked />
              Ativo
            </label>
            <button className="btn primary" type="submit">
              Salvar membro
            </button>
          </form>
        </div>

        <div className="card admin-card">
          <h2 className="card-title">Membros cadastrados</h2>
          <div className="admin-list admin-members-grid">
            {members.map((member) => (
              <div key={member.id} className="card admin-card admin-member-card">
                <div className="admin-user-info">
                  {(() => {
                    const discordId = member.linked_discord_id ?? member.discord_id;
                    const discordAvatar = member.discord_avatar;
                    const avatarSrc =
                      discordId && discordAvatar
                        ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=96`
                        : `https://mc-heads.net/avatar/${encodeURIComponent(member.minecraft)}/64`;
                    return (
                      <img
                        src={avatarSrc}
                        alt={member.discord_username || member.minecraft}
                        className="admin-user-avatar"
                      />
                    );
                  })()}
                  <div className="admin-user-details">
                    <h3>{member.name}</h3>
                    <p className="muted">Minecraft: {member.minecraft}</p>
                    {member.discord_username && (
                      <p className="muted">Discord: {member.discord_username}</p>
                    )}
                    {member.responsibility && (
                      <p className="muted">Responsabilidade: {member.responsibility}</p>
                    )}
                    {member.role_name && (
                      <span
                        className="staff-role-badge"
                        style={{
                          background: member.role_color
                            ? `${member.role_color}1A`
                            : "rgba(255, 255, 255, 0.08)",
                          borderColor: member.role_color
                            ? `${member.role_color}4D`
                            : "rgba(255, 255, 255, 0.2)",
                          color: member.role_color ?? "rgb(var(--text))",
                        }}
                      >
                        {member.role_name}
                      </span>
                    )}
                  </div>
                </div>
                <details className="admin-member-details">
                  <summary className="admin-member-summary">Editar membro</summary>
                  <form className="admin-form admin-form-grid" action={updateMember}>
                    <input type="hidden" name="id" value={member.id} />
                    <label>
                      Cargo
                      <select name="role_id" defaultValue={member.role_id}>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Nome
                      <input name="name" defaultValue={member.name} />
                    </label>
                    <label>
                      Minecraft
                      <input name="minecraft" defaultValue={member.minecraft} />
                    </label>
                    <label>
                      Discord ID (opcional)
                      <input name="discord_id" defaultValue={member.discord_id ?? ""} />
                    </label>
                    <label>
                      Minecraft UUID (opcional)
                      <input
                        name="minecraft_uuid"
                        defaultValue={member.minecraft_uuid ?? ""}
                      />
                    </label>
                    <label>
                      Responsabilidade
                      <input
                        name="responsibility"
                        defaultValue={member.responsibility ?? ""}
                      />
                    </label>
                    <label>
                      Ordem
                      <input type="number" name="sort_order" defaultValue={member.sort_order} />
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" name="active" defaultChecked={Boolean(member.active)} />
                      Ativo
                    </label>
                    <button className="btn primary" type="submit">
                      Atualizar
                    </button>
                  </form>
                  <form className="admin-member-actions" action={deleteMember}>
                    <input type="hidden" name="id" value={member.id} />
                    <button className="btn ghost" type="submit">
                      Remover
                    </button>
                  </form>
                </details>
              </div>
            ))}
            {!members.length && <p className="muted">Nenhum membro cadastrado.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
