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
  name: string;
  minecraft: string;
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
     ORDER BY m.sort_order ASC, m.id ASC`,
  );

  return roles.map((role) => ({
    ...role,
    members: members.filter((member) => member.role_id === role.id),
  }));
}

export default async function EquipePage() {
  const staffRoles = await getStaffData();

  return (
    <section className="section">
      <div className="container">
        <div className="team-hero">
          <div className="team-hero-badge" aria-hidden="true">
            <Users className="team-hero-icon" />
          </div>
          <div>
            <h1 className="team-hero-title">
              Nossa <span className="text-brand-sky">Equipe</span>
            </h1>
            <p className="muted">Conheca nosso time de staff</p>
          </div>
        </div>

        <div className="staff-role-grid">
          {staffRoles.map((role) => (
            <div
              key={role.id}
              className="card staff-role-card"
              style={{ "--role-color": role.color } as React.CSSProperties}
            >
              <div className="staff-role-header">
                {(() => {
                  const Icon = resolveIcon(role.icon || role.slug, Users);
                  return (
                    <Icon
                      aria-hidden="true"
                      className="staff-role-icon"
                    />
                  );
                })()}
                <div className="staff-role-heading">
                  <h2 className="staff-role-title">
                    {role.name}
                  </h2>
                  <p className="staff-role-count">
                    {role.members.length} {role.members.length === 1 ? "membro" : "membros"}
                  </p>
                </div>
              </div>

              <div className="staff-member-grid">
                {role.members.map((member) => {
                  const responsibilityText = member.responsibility?.trim() || role.name;
                  const minecraftAvatar = member.minecraft_uuid
                    ? getMinecraftHead3d(member.minecraft_uuid)
                    : getMinecraftAvatar(member.minecraft);
                  const displayName = member.minecraft;
                  return (
                    <div
                      key={member.id}
                      className="staff-member-card"
                      style={{ "--role-color": role.color } as React.CSSProperties}
                    >
                      <div className="staff-member-header">
                        <img
                          src={minecraftAvatar}
                          alt={displayName}
                          width={56}
                          height={56}
                          className="staff-member-avatar"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="staff-member-text">
                          <div className="staff-member-name">{displayName}</div>
                        </div>
                      </div>

                      <div className="staff-member-body">
                        <div className="staff-member-role">
                          {(() => {
                            const Icon = resolveIcon(role.icon || role.slug, Users);
                            return <Icon aria-hidden="true" className="staff-role-icon" />;
                          })()}
                          <span>{role.name}</span>
                        </div>

                        <div className="staff-member-footer">
                          <span
                            className="staff-member-responsibility"
                            title={responsibilityText}
                          >
                            {responsibilityText}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
