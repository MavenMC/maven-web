import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { User } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import ProfileLinker from "@/components/ProfileLinker";
import ProfilePublicForm from "@/components/ProfilePublicForm";

type PlayerRow = {
  discord_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  email: string | null;
  minecraft_name: string | null;
  minecraft_uuid: string | null;
  account_type: string | null;
  verified: number | null;
  is_bedrock: number | null;
};

type ProfileRow = {
  uuid: string;
  apelido: string | null;
  bio: string | null;
  estatisticas_publicas: number | null;
  privacidade: string | null;
  cor_favorita: string | null;
};

type AssetRow = {
  banner_url: string | null;
  avatar_url: string | null;
  ring_url: string | null;
};

type SocialRow = {
  id: number;
  label: string;
  url: string;
  is_public: number;
};

type ProfileNickRow = {
  current_nick: string | null;
};

function formatAccountType(accountType: string | null, isBedrock: number | null) {
  if (accountType === "original") return "Original (Java)";
  if (accountType === "bedrock" || isBedrock) return "Bedrock";
  return "Pirata";
}

const uploadConfig = {
  banner: { maxSize: 5 * 1024 * 1024, label: "Banner" },
  avatar: { maxSize: 5 * 1024 * 1024, label: "Avatar" },
  ring: { maxSize: 5 * 1024 * 1024, label: "Moldura" },
};

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function isFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value && "size" in value);
}

function sanitizeText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

async function removeLocalUpload(currentUrl: string | null) {
  if (!currentUrl || !currentUrl.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", currentUrl.replace(/^\//, ""));
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing files.
  }
}

async function saveProfileUpload(uuid: string, kind: "banner" | "avatar" | "ring", file: File) {
  const extension = path.extname(file.name || "").toLowerCase();
  if (!allowedImageExtensions.has(extension)) {
    throw new Error("Tipo de arquivo invalido.");
  }

  const maxSize = uploadConfig[kind].maxSize;
  if (file.size > maxSize) {
    throw new Error(`${uploadConfig[kind].label} excede o tamanho permitido.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), "public", "uploads", "profiles", uuid);
  await fs.mkdir(folder, { recursive: true });

  const filename = `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
  const filePath = path.join(folder, filename);
  await fs.writeFile(filePath, buffer);

  return `/uploads/profiles/${uuid}/${filename}`;
}

async function updatePublicProfile(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session?.user?.playerId) {
    redirect("/login");
  }

  try {

  const rows = await dbQuery<PlayerRow[]>(
    "SELECT discord_id, discord_username, discord_avatar, email, minecraft_name, minecraft_uuid, account_type, verified, is_bedrock FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: session.user.playerId },
  );

  const player = rows[0];
  if (!player?.minecraft_uuid) {
    redirect("/perfil#vinculo");
  }

  const uuid = player.minecraft_uuid;
  const apelido = sanitizeText(String(formData.get("apelido") || ""), 50) || null;
  const bio = sanitizeText(String(formData.get("bio") || ""), 500) || null;
  const privacidade = String(formData.get("privacidade") || "PUBLICA").toUpperCase();
  const estatisticasPublicas = formData.get("estatisticas_publicas") ? 1 : 0;

  await dbQuery(
    "INSERT INTO perfil_jogadores (uuid, apelido, bio, estatisticas_publicas, privacidade, atualizadoEm) VALUES (:uuid, :apelido, :bio, :estatisticas_publicas, :privacidade, NOW()) ON DUPLICATE KEY UPDATE apelido = :apelido, bio = :bio, estatisticas_publicas = :estatisticas_publicas, privacidade = :privacidade, atualizadoEm = NOW()",
    {
      uuid,
      apelido,
      bio,
      estatisticas_publicas: estatisticasPublicas,
      privacidade: privacidade === "PRIVADA" ? "PRIVADA" : "PUBLICA",
    },
  );

  const assetRows = await dbQuery<AssetRow[]>(
    "SELECT banner_url, avatar_url, ring_url FROM perfil_jogadores_assets WHERE uuid = :uuid LIMIT 1",
    { uuid },
  );
  const currentAssets = assetRows[0] ?? null;

  let bannerUrl = currentAssets?.banner_url ?? null;
  let avatarUrl = currentAssets?.avatar_url ?? null;
  let ringUrl = currentAssets?.ring_url ?? null;

  if (formData.get("remove_banner")) {
    await removeLocalUpload(bannerUrl);
    bannerUrl = null;
  }
  if (formData.get("remove_avatar")) {
    await removeLocalUpload(avatarUrl);
    avatarUrl = null;
  }
  if (formData.get("remove_ring")) {
    await removeLocalUpload(ringUrl);
    ringUrl = null;
  }

  const bannerFile = formData.get("banner");
  if (isFile(bannerFile) && bannerFile.size > 0) {
    await removeLocalUpload(bannerUrl);
    bannerUrl = await saveProfileUpload(uuid, "banner", bannerFile);
  }

  const avatarFile = formData.get("avatar");
  if (isFile(avatarFile) && avatarFile.size > 0) {
    await removeLocalUpload(avatarUrl);
    avatarUrl = await saveProfileUpload(uuid, "avatar", avatarFile);
  }

  const ringFile = formData.get("ring");
  if (isFile(ringFile) && ringFile.size > 0) {
    await removeLocalUpload(ringUrl);
    ringUrl = await saveProfileUpload(uuid, "ring", ringFile);
  }

  await dbQuery(
    "INSERT INTO perfil_jogadores_assets (uuid, banner_url, avatar_url, ring_url) VALUES (:uuid, :banner_url, :avatar_url, :ring_url) ON DUPLICATE KEY UPDATE banner_url = :banner_url, avatar_url = :avatar_url, ring_url = :ring_url, updated_at = NOW()",
    {
      uuid,
      banner_url: bannerUrl,
      avatar_url: avatarUrl,
      ring_url: ringUrl,
    },
  );

  const totalSocials = Number(formData.get("social_count") || 0);
  const socials: Array<{ label: string; url: string; is_public: number; sort_order: number }> = [];

  for (let index = 0; index < totalSocials; index += 1) {
    const label = sanitizeText(String(formData.get(`social_label_${index}`) || ""), 60);
    const url = sanitizeText(String(formData.get(`social_url_${index}`) || ""), 255);
    if (!label || !url) continue;
    const isPublic = formData.get(`social_public_${index}`) ? 1 : 0;
    socials.push({ label, url, is_public: isPublic, sort_order: index });
  }

  await dbQuery("DELETE FROM perfil_jogadores_redes WHERE uuid = :uuid", { uuid });
  for (const social of socials) {
    await dbQuery(
      "INSERT INTO perfil_jogadores_redes (uuid, label, url, is_public, sort_order) VALUES (:uuid, :label, :url, :is_public, :sort_order)",
      { uuid, ...social },
    );
  }

  const nickRows = await dbQuery<ProfileNickRow[]>(
    "SELECT current_nick FROM account_stats WHERE uuid = :uuid LIMIT 1",
    { uuid },
  );
  const publicNick = nickRows[0]?.current_nick ?? player.minecraft_name;

  revalidatePath("/perfil");
    if (publicNick) {
      revalidatePath(`/perfil/${publicNick}`);
    }
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
  }
}

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.playerId) {
    redirect("/login");
  }

  const rows = await dbQuery<PlayerRow[]>(
    "SELECT discord_id, discord_username, discord_avatar, email, minecraft_name, minecraft_uuid, account_type, verified, is_bedrock FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: session.user.playerId },
  );

  const player = rows[0];

  if (!player) {
    return (
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Perfil</span>
              <h2>Conta não encontrada</h2>
              <p className="muted">Sua conta ainda não está vinculada ao site.</p>
            </div>
            <a href="#vinculo" className="btn primary">
              Vincular conta
            </a>
          </div>
          <div id="vinculo" className="profile-link-section">
            <ProfileLinker />
          </div>
        </div>
      </section>
    );
  }

  const isOriginal = player.account_type === "original" || player.account_type === "java_original";
  const isBedrock = player.account_type === "bedrock" || player.is_bedrock === 1;
  const skinSource = player.minecraft_name ?? player.minecraft_uuid ?? null;
  const minecraftAvatar = isOriginal && !isBedrock && skinSource
    ? `https://minotar.net/helm/${encodeURIComponent(skinSource)}/96`
    : null;

  const profileRows = player.minecraft_uuid
    ? await dbQuery<ProfileRow[]>(
        "SELECT uuid, apelido, bio, estatisticas_publicas, privacidade, cor_favorita FROM perfil_jogadores WHERE uuid = :uuid LIMIT 1",
        { uuid: player.minecraft_uuid },
      )
    : [];
  const profile = profileRows[0] ?? null;

  const assetRows = player.minecraft_uuid
    ? await dbQuery<AssetRow[]>(
        "SELECT banner_url, avatar_url, ring_url FROM perfil_jogadores_assets WHERE uuid = :uuid LIMIT 1",
        { uuid: player.minecraft_uuid },
      )
    : [];
  const assets = assetRows[0] ?? null;

  const socialRows = player.minecraft_uuid
    ? await dbQuery<SocialRow[]>(
        "SELECT id, label, url, is_public FROM perfil_jogadores_redes WHERE uuid = :uuid ORDER BY sort_order ASC, id ASC",
        { uuid: player.minecraft_uuid },
      )
    : [];

  const socialList = [...socialRows];
  while (socialList.length < 4) {
    socialList.push({ id: 0, label: "", url: "", is_public: 1 });
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="section-kicker">Perfil</span>
            <h2>Resumo da sua conta</h2>
            <p className="muted">Veja suas informações e status no Maven Network.</p>
          </div>
          <a href="#vinculo" className="btn secondary">
            Gerenciar vínculo
          </a>
        </div>

        <div className="feature-grid">
          <div className="card">
            <span className="card-eyebrow">Discord</span>
            <div className="profile-card-head">
              {minecraftAvatar ? (
                <img
                  src={minecraftAvatar}
                  alt={player.minecraft_name ?? "Minecraft"}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar" style={{ display: 'grid', placeItems: 'center' }}>
                  <User size={28} aria-hidden="true" />
                </div>
              )}
              <div>
                <h3 className="card-title">{player.discord_username ?? "Usuário não informado"}</h3>
                <p className="card-sub">ID: {player.discord_id}</p>
                <p className="card-sub">Email: {player.email ?? "Não informado"}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <span className="card-eyebrow">Minecraft</span>
            <h3 className="card-title">
              {player.minecraft_name ?? "Conta não vinculada"}
            </h3>
            <p className="card-sub">
              UUID: {player.minecraft_uuid ?? "Não informado"}
            </p>
            <p className="card-sub">
              Tipo: {formatAccountType(player.account_type, player.is_bedrock)}
            </p>
            <p className="card-sub">
              Status: {player.verified ? "Verificado" : "Não verificado"}
            </p>
          </div>

          <div className="card">
            <span className="card-eyebrow">Ações</span>
            <h3 className="card-title">Gerenciar conta</h3>
            <p className="card-sub">
              Atualize seu nick, escolha plataforma e vincule/desvincule sua conta.
            </p>
            <a href="#vinculo" className="btn primary btn-sm">
              Ir para vínculo
            </a>
          </div>
        </div>

        <div id="vinculo" className="profile-link-section">
          <ProfileLinker />
        </div>

        {player.minecraft_uuid ? (
          <div className="card profile-public-card">
            <div className="section-header">
              <div>
                <span className="section-kicker">Perfil publico</span>
                <h2>Personalize seu perfil</h2>
                <p className="muted">Controle sua bio, assets e redes visiveis para o publico.</p>
              </div>
              {player.minecraft_name && (
                <a href={`/perfil/${player.minecraft_name}`} className="btn secondary">
                  Ver perfil
                </a>
              )}
            </div>

            <ProfilePublicForm
              action={updatePublicProfile}
              profile={profile}
              assets={assets}
              socialList={socialList}
            />
          </div>
        ) : (
          <div className="card profile-public-card">
            <span className="card-eyebrow">Perfil publico</span>
            <h3 className="card-title">Vincule sua conta</h3>
            <p className="muted">Para liberar o perfil publico, conecte seu Minecraft.</p>
            <a href="#vinculo" className="btn secondary btn-sm">
              Vincular conta
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
