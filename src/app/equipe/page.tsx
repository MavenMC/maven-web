import Link from "next/link";
import { Users } from "lucide-react";
import { dbQuery } from "@/lib/db";
import { resolveIcon } from "@/lib/icon-map";

type RoleRow = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
};

type MemberRow = {
  id: number;
  role_id: number;
  name: string | null;
  minecraft: string | null;
  minecraft_uuid: string | null;
  responsibility: string | null;
  sort_order: number;
};

function getMinecraftAvatar(username: string): string {
  return `https://minotar.net/helm/${username}/128`;
}

function getMinecraftHead3d(uuid: string): string {
  return `https://mc-heads.net/head/${uuid}/512`;
}

async function getStaffData() {
  const roles = await dbQuery<RoleRow[]>(
    "SELECT id, slug, name, icon, color, sort_order FROM site_staff_roles WHERE active = 1 ORDER BY sort_order ASC, id ASC",
  );
  const members = await dbQuery<MemberRow[]>(
    `SELECT m.id,
            m.role_id,
            m.name,
            m.minecraft,
            m.minecraft_uuid,
            m.responsibility,
            m.sort_order
     FROM site_staff_members m
     WHERE m.active = 1
       AND m.name IS NOT NULL AND m.name != ''
       AND m.minecraft IS NOT NULL AND m.minecraft != ''
     ORDER BY m.sort_order ASC, m.id ASC`,
  );

  return roles.map((role) => ({
    ...role,
    members: members.filter((member) => 
      member.role_id === role.id && 
      member.minecraft && 
      member.minecraft.trim().length > 0 &&
      member.name &&
      member.name.trim().length > 0
    ),
  }));
}

export default async function EquipePage() {
  const staffRoles = await getStaffData();

  // Separar cargos de liderança (CEO, Admin) dos demais
  const leadershipRoles = staffRoles.filter(role => 
    role.slug === 'ceo' || role.slug === 'admin'
  );
  const otherRoles = staffRoles.filter(role => 
    role.slug !== 'ceo' && role.slug !== 'admin'
  );

  return (
    <section className="section team-section">
      <div className="container">
        {/* Header */}
        <div className="team-header">
          <div className="team-header-badge">
            <Users size={32} strokeWidth={2.5} />
          </div>
          <div className="team-header-content">
            <h1 className="team-header-title">
              Nossa <span className="gradient-text">Equipe</span>
            </h1>
            <p className="team-header-subtitle">
              Conheça os profissionais que tornam tudo possível
            </p>
          </div>
        </div>

        {/* Leadership Section - Hero Cards */}
        {leadershipRoles.length > 0 && (
          <div className="leadership-section">
            <div className="leadership-grid">
              {leadershipRoles.map((role) => (
                role.members.map((member) => {
                  // Validar dados do membro
                  if (!member || !member.minecraft || !member.minecraft.trim() || !member.name || !member.name.trim()) {
                    console.warn(`Membro ${member?.id || '?'} com dados inválidos`);
                    return null;
                  }

                  // Extrair valores garantidos após validação
                  const memberMinecraft = member.minecraft;
                  const memberId = member.id;

                  const Icon = resolveIcon(role.icon || role.slug, Users);
                  const minecraftAvatar = member.minecraft_uuid
                    ? getMinecraftHead3d(member.minecraft_uuid)
                    : getMinecraftAvatar(memberMinecraft);
                  const responsibilityText = member.responsibility?.trim() || role.name;
                  
                  return (
                    <Link
                      key={memberId}
                      href={`/equipe/${encodeURIComponent(memberMinecraft)}`}
                      className="hero-card"
                      style={{ "--role-color": role.color } as React.CSSProperties}
                    >
                      <div className="hero-card-glow"></div>
                      <div className="hero-card-content">
                        <div className="hero-card-avatar-wrapper">
                          <img
                            src={minecraftAvatar}
                            alt={memberMinecraft}
                            className="hero-card-avatar"
                            loading="eager"
                          />
                        </div>
                        <div className="hero-card-info">
                          <div className="hero-card-badge">
                            <Icon size={14} strokeWidth={2.5} />
                            <span>{role.name}</span>
                          </div>
                          <h3 className="hero-card-name">{memberMinecraft}</h3>
                          <p className="hero-card-role">{responsibilityText}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ))}
            </div>
          </div>
        )}

        {/* Other Staff Sections */}
        {otherRoles.map((role) => {
          if (role.members.length === 0) return null;
          
          const Icon = resolveIcon(role.icon || role.slug, Users);
          
          return (
            <div key={role.id} className="staff-section">
              <div className="staff-section-header">
                <div className="staff-section-icon" style={{ "--role-color": role.color } as React.CSSProperties}>
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <h2 className="staff-section-title">{role.name}</h2>
                <span className="staff-section-count">
                  {role.members.length} {role.members.length === 1 ? "membro" : "membros"}
                </span>
              </div>

              <div className="staff-grid">
                {role.members.map((member) => {
                  // Validar dados do membro
                  if (!member || !member.minecraft || !member.minecraft.trim() || !member.name || !member.name.trim()) {
                    console.warn(`Membro ${member?.id || '?'} com dados inválidos`);
                    return null;
                  }

                  // Extrair valores garantidos após validação
                  const memberMinecraft = member.minecraft;
                  const memberId = member.id;

                  const minecraftAvatar = member.minecraft_uuid
                    ? getMinecraftHead3d(member.minecraft_uuid)
                    : getMinecraftAvatar(memberMinecraft);
                  const responsibilityText = member.responsibility?.trim() || role.name;
                  
                  return (
                    <Link
                      key={memberId}
                      href={`/equipe/${encodeURIComponent(memberMinecraft)}`}
                      className="staff-card"
                      style={{ "--role-color": role.color } as React.CSSProperties}
                    >
                      <div className="staff-card-header">
                        <img
                          src={minecraftAvatar}
                          alt={memberMinecraft}
                          className="staff-card-avatar"
                          loading="lazy"
                        />
                        <div className="staff-card-badge">
                          <Icon size={12} strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="staff-card-body">
                        <h3 className="staff-card-name">{memberMinecraft}</h3>
                        <p className="staff-card-responsibility">{responsibilityText}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
