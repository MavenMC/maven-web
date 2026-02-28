import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { ICON_OPTIONS } from "@/lib/icon-map";
import { DeleteRoleButton } from "./DeleteRoleButton";
import { DeleteMemberButton } from "./DeleteMemberButton";

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
  name: string | null;
  minecraft: string | null;
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
     WHERE m.name IS NOT NULL AND m.name != '' 
       AND m.minecraft IS NOT NULL AND m.minecraft != ''
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
    `INSERT INTO site_staff_roles (slug, name, icon, color, sort_order, active, created_at, updated_at)
     VALUES (:slug, :name, :icon, :color, :sort_order, :active, NOW(), NOW())`,
    { slug, name, icon, color, sort_order: sortOrder, active },
  );

  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe");
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
         active = :active,
         updated_at = NOW()
     WHERE id = :id`,
    { id, slug, name, icon, color, sort_order: sortOrder, active },
  );

  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe");
}

async function deleteRole(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) return;

  await dbQuery("DELETE FROM site_staff_roles WHERE id = :id", { id });
  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe");
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
    `INSERT INTO site_staff_members (role_id, name, minecraft, discord_id, responsibility, minecraft_uuid, sort_order, active, created_at, updated_at)
     VALUES (:role_id, :name, :minecraft, :discord_id, :responsibility, :minecraft_uuid, :sort_order, :active, NOW(), NOW())`,
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
  redirect("/admin/equipe");
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
         active = :active,
         updated_at = NOW()
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
  redirect("/admin/equipe");
}

async function deleteMember(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) return;

  await dbQuery("DELETE FROM site_staff_members WHERE id = :id", { id });
  revalidatePath("/equipe");
  revalidatePath("/admin/equipe");
  redirect("/admin/equipe");
}

export default async function AdminEquipePage() {
  const [roles, members] = await Promise.all([getRoles(), getMembers()]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Gerenciamento da Equipe</h1>
        <p>Gerencie cargos e membros exibidos na página de equipe do site.</p>
      </header>

      {/* SEÇÃO DE CARGOS */}
      <section style={{ marginBottom: "3rem" }}>
        <div className="card admin-card">
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
              🏷️ Cargos da Equipe
            </h2>
            <span style={{ 
              padding: "0.25rem 0.75rem", 
              background: "rgba(240, 138, 43, 0.2)",
              border: "1px solid rgba(240, 138, 43, 0.3)",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500
            }}>
              {roles.length} cargo{roles.length !== 1 ? "s" : ""}
            </span>
          </div>

          <datalist id="role-icon-options">
            {ICON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </datalist>

          {/* Formulário de Criar Cargo */}
          <details style={{ marginBottom: "1.5rem" }}>
            <summary style={{
              padding: "1rem",
              background: "rgba(240, 138, 43, 0.1)",
              border: "1px solid rgba(240, 138, 43, 0.3)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              marginBottom: "1rem",
              listStyle: "none"
            }}>
              ➕ Adicionar Novo Cargo
            </summary>
            <form className="admin-form" action={createRole} style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "0.5rem"
            }}>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Identificador (slug)</span>
                <input name="slug" placeholder="admin, mod, helper" required />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Nome do Cargo</span>
                <input name="name" placeholder="Administrador" required />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Ícone</span>
                <input name="icon" list="role-icon-options" placeholder="bright-crown" />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Cor (HEX)</span>
                <input name="color" placeholder="#f08a2b" defaultValue="#f08a2b" />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Ordem de Exibição</span>
                <input type="number" name="sort_order" defaultValue={0} />
              </label>
              <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" name="active" defaultChecked />
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Ativo no site</span>
              </label>
              <button className="btn primary" type="submit" style={{ gridColumn: "1 / -1" }}>
                💾 Criar Cargo
              </button>
            </form>
          </details>

          {/* Lista de Cargos */}
          <div style={{ display: "grid", gap: "1rem" }}>
            {roles.map((role) => (
              <div 
                key={role.id} 
                className="card" 
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${role.color}40`,
                  borderLeft: `4px solid ${role.color}`,
                  padding: "1.25rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      padding: "0.5rem 1rem",
                      background: `${role.color}20`,
                      border: `1px solid ${role.color}50`,
                      borderRadius: "0.5rem",
                      fontWeight: 600,
                      color: role.color,
                      fontSize: "1rem"
                    }}>
                      {role.name}
                    </span>
                    <code style={{ 
                      fontSize: "0.75rem", 
                      opacity: 0.6,
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem"
                    }}>
                      {role.slug}
                    </code>
                    <span style={{
                      fontSize: "0.875rem",
                      opacity: 0.7,
                      background: "rgba(255, 255, 255, 0.05)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem"
                    }}>
                      #{role.sort_order}
                    </span>
                    {!role.active && (
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "0.25rem",
                        color: "#ef4444"
                      }}>
                        INATIVO
                      </span>
                    )}
                  </div>
                </div>

                <details>
                  <summary style={{ 
                    cursor: "pointer", 
                    fontSize: "0.875rem", 
                    opacity: 0.7,
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    listStyle: "none"
                  }}>
                    ✏️ Editar cargo
                  </summary>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <form 
                      className="admin-form" 
                      action={updateRole}
                      style={{
                        flex: 1,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "0.75rem"
                      }}
                    >
                      <input type="hidden" name="id" value={role.id} />
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Slug</span>
                        <input name="slug" defaultValue={role.slug} required />
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Nome</span>
                        <input name="name" defaultValue={role.name} required />
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Ícone</span>
                        <input name="icon" list="role-icon-options" defaultValue={role.icon ?? ""} />
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Cor</span>
                        <input name="color" defaultValue={role.color} />
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Ordem</span>
                        <input type="number" name="sort_order" defaultValue={role.sort_order} />
                      </label>
                      <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input type="checkbox" name="active" defaultChecked={Boolean(role.active)} />
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Ativo</span>
                      </label>
                      <button className="btn primary" type="submit" style={{ gridColumn: "1 / -1" }}>
                        ✓ Atualizar
                      </button>
                    </form>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <DeleteRoleButton 
                        roleId={role.id} 
                        roleName={role.name}
                        deleteAction={deleteRole}
                      />
                    </div>
                  </div>
                </details>
              </div>
            ))}
            {!roles.length && (
              <p style={{ textAlign: "center", opacity: 0.5, padding: "2rem" }}>
                Nenhum cargo cadastrado. Adicione um cargo para começar.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO DE MEMBROS */}
      <section>
        <div className="card admin-card">
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
              👥 Membros da Equipe
            </h2>
            <span style={{ 
              padding: "0.25rem 0.75rem", 
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500
            }}>
              {members.length} membro{members.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Formulário de Criar Membro */}
          <details style={{ marginBottom: "1.5rem" }}>
            <summary style={{
              padding: "1rem",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              marginBottom: "1rem",
              listStyle: "none"
            }}>
              ➕ Adicionar Novo Membro
            </summary>
            <form className="admin-form" action={createMember} style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "0.5rem"
            }}>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Cargo *</span>
                <select name="role_id" defaultValue="" required>
                  <option value="" disabled>Selecione um cargo</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Nome *</span>
                <input name="name" placeholder="nickz1n" required />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Minecraft *</span>
                <input name="minecraft" placeholder="nickz1n" required />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Discord ID</span>
                <input name="discord_id" placeholder="123456789012345678" />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Minecraft UUID</span>
                <input name="minecraft_uuid" placeholder="1a2b3c4d-..." />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Responsabilidade</span>
                <input name="responsibility" placeholder="Diretor de Tecnologia e Financeiro" />
              </label>
              <label>
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Ordem</span>
                <input type="number" name="sort_order" defaultValue={0} />
              </label>
              <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" name="active" defaultChecked />
                <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Ativo no site</span>
              </label>
              <button className="btn primary" type="submit" style={{ gridColumn: "1 / -1" }}>
                💾 Criar Membro
              </button>
            </form>
          </details>

          {/* Grid de Membros */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1rem" 
          }}>
            {members.map((member) => {
              // Validar dados do membro
              if (!member || !member.id || !member.minecraft || !member.minecraft.trim() || !member.name || !member.name.trim()) {
                return (
                  <div 
                    key={member?.id || Math.random()} 
                    className="card" 
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      padding: "1rem"
                    }}
                  >
                    <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                      ⚠️ Membro #{member?.id || '?'} com dados inválidos
                    </p>
                    {member?.id && (
                      <DeleteMemberButton 
                        memberId={member.id}
                        memberName={`Membro #${member.id}`}
                        deleteAction={deleteMember}
                      />
                    )}
                  </div>
                );
              }

              // Após validação, extrair valores garantidos como não-null
              const memberId = member.id;
              const memberName = member.name;
              const memberMinecraft = member.minecraft;

              const discordId = member.linked_discord_id ?? member.discord_id;
              const discordAvatar = member.discord_avatar;
              const avatarSrc = discordId && discordAvatar
                ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=96`
                : `https://mc-heads.net/avatar/${encodeURIComponent(memberMinecraft)}/64`;

              return (
                <div 
                  key={memberId} 
                  className="card" 
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${member.role_color || "#ffffff"}20`,
                    borderTop: `3px solid ${member.role_color || "#f08a2b"}`,
                    padding: "1.25rem"
                  }}
                >
                  {/* Header Card */}
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <img
                      src={avatarSrc}
                      alt={memberName}
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "0.5rem",
                        objectFit: "cover",
                        border: `2px solid ${member.role_color || "#f08a2b"}60`
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        margin: "0 0 0.25rem 0", 
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {memberName}
                      </h3>
                      {member.role_name && (
                        <span style={{
                          display: "inline-block",
                          padding: "0.25rem 0.625rem",
                          background: `${member.role_color || "#f08a2b"}20`,
                          border: `1px solid ${member.role_color || "#f08a2b"}40`,
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: member.role_color || "#f08a2b",
                          marginBottom: "0.5rem"
                        }}>
                          {member.role_name}
                        </span>
                      )}
                      <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.25rem" }}>
                        <div>🎮 {memberMinecraft}</div>
                        {member.discord_username && <div>💬 {member.discord_username}</div>}
                      </div>
                    </div>
                    {!member.active && (
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "0.25rem 0.5rem",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "0.25rem",
                        color: "#ef4444",
                        height: "fit-content"
                      }}>
                        INATIVO
                      </span>
                    )}
                  </div>

                  {member.responsibility && (
                    <p style={{ 
                      fontSize: "0.875rem", 
                      opacity: 0.8, 
                      margin: "0 0 1rem 0",
                      padding: "0.75rem",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "0.375rem",
                      borderLeft: `3px solid ${member.role_color || "#f08a2b"}80`
                    }}>
                      📋 {member.responsibility}
                    </p>
                  )}

                  <details>
                    <summary style={{ 
                      cursor: "pointer", 
                      fontSize: "0.875rem", 
                      opacity: 0.7,
                      padding: "0.5rem",
                      textAlign: "center",
                      listStyle: "none",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "0.375rem"
                    }}>
                      ✏️ Editar membro
                    </summary>
                    
                    <form 
                      className="admin-form" 
                      action={updateMember}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "0.75rem",
                        marginTop: "1rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)"
                      }}
                    >
                      <input type="hidden" name="id" value={memberId} />
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Cargo</span>
                        <select name="role_id" defaultValue={member.role_id}>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <label>
                          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Nome</span>
                          <input name="name" defaultValue={memberName} />
                        </label>
                        <label>
                          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Minecraft</span>
                          <input name="minecraft" defaultValue={memberMinecraft} />
                        </label>
                      </div>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Discord ID</span>
                        <input name="discord_id" defaultValue={member.discord_id ?? ""} />
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Minecraft UUID</span>
                        <input name="minecraft_uuid" defaultValue={member.minecraft_uuid ?? ""} />
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Responsabilidade</span>
                        <input name="responsibility" defaultValue={member.responsibility ?? ""} />
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <label>
                          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Ordem</span>
                          <input type="number" name="sort_order" defaultValue={member.sort_order} />
                        </label>
                        <label className="checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1.5rem" }}>
                          <input type="checkbox" name="active" defaultChecked={Boolean(member.active)} />
                          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Ativo</span>
                        </label>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }}>
                        <button className="btn primary" type="submit">
                          ✓ Atualizar
                        </button>
                        <DeleteMemberButton 
                          memberId={memberId}
                          memberName={memberName}
                          deleteAction={deleteMember}
                        />
                      </div>
                    </form>
                  </details>
                </div>
              );
            })}
            {!members.length && (
              <p style={{ 
                textAlign: "center", 
                opacity: 0.5, 
                padding: "2rem",
                gridColumn: "1 / -1" 
              }}>
                Nenhum membro cadastrado. Adicione um membro para começar.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
