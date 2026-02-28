import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import { dbQuery } from "@/lib/db";
import { notifyLogin } from "@/lib/discord";
import { verifySsoToken } from "@/lib/sso";

type PlayerAccountRow = {
  discord_id: string;
  email: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  minecraft_name: string | null;
  account_type: string | null;
  verified: number | null;
};

type AdminAccessRow = {
  discord_id: string;
  is_active: number;
  access_level: string;
};

type AdminUserRow = {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string;
  role: string;
};

const Discord = (DiscordProvider as unknown as { default?: typeof DiscordProvider }).default ?? DiscordProvider;
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.NEXTAUTH_URL && !isProduction) {
  process.env.NEXTAUTH_URL = process.env.NEXT_PUBLIC_AUTH_CENTER_URL ?? "http://localhost:3000";
}

if (!process.env.NEXTAUTH_SECRET && !isProduction) {
  process.env.NEXTAUTH_SECRET = "dev-nextauth-secret-change-me";
}

async function getPlayerByDiscordId(discordId: string) {
  const rows = await dbQuery<PlayerAccountRow[]>(
    "SELECT discord_id, email, discord_username, discord_avatar, minecraft_name, account_type, verified FROM player_accounts WHERE discord_id = :discord_id LIMIT 1",
    { discord_id: discordId }
  );
  return rows[0] ?? null;
}

async function getPlayerByEmail(email: string) {
  const rows = await dbQuery<PlayerAccountRow[]>(
    "SELECT discord_id, email, discord_username, discord_avatar, minecraft_name, account_type, verified FROM player_accounts WHERE email = :email LIMIT 1",
    { email }
  );
  return rows[0] ?? null;
}

async function getAdminByEmail(email: string) {
  const rows = await dbQuery<AdminUserRow[]>(
    "SELECT id, email, name, passwordHash, role FROM store_admin_users WHERE email = :email LIMIT 1",
    { email }
  );
  return rows[0] ?? null;
}

async function checkAdminAccess(discordId: string) {
  const rows = await dbQuery<AdminAccessRow[]>(
    "SELECT discord_id, is_active, access_level FROM admin_access WHERE discord_id = :discord_id AND is_active = 1 LIMIT 1",
    { discord_id: discordId }
  );
  return rows[0] ?? null;
}

async function updateAdminLastLogin(discordId: string) {
  await dbQuery("UPDATE admin_access SET last_login = NOW() WHERE discord_id = :discord_id", { discord_id: discordId });
}

async function ensurePlayerIdentity({
  providerAccountId,
  email,
  name,
  image,
}: {
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  if (!providerAccountId) return null;

  const existing = await getPlayerByDiscordId(providerAccountId);
  if (existing) {
    await dbQuery(
      "UPDATE player_accounts SET email = COALESCE(:email, email), discord_username = COALESCE(:name, discord_username), discord_avatar = COALESCE(:avatar, discord_avatar), last_updated = NOW() WHERE discord_id = :discord_id",
      {
        discord_id: providerAccountId,
        email: email ?? null,
        name: name ?? null,
        avatar: image ?? null,
      }
    );
    return providerAccountId;
  }

  if (email) {
    const byEmail = await getPlayerByEmail(email);
    if (byEmail) {
      await dbQuery(
        "UPDATE player_accounts SET discord_id = :discord_id, discord_username = COALESCE(:name, discord_username), discord_avatar = COALESCE(:avatar, discord_avatar), last_updated = NOW() WHERE email = :email",
        {
          discord_id: providerAccountId,
          name: name ?? null,
          avatar: image ?? null,
          email,
        }
      );
      return providerAccountId;
    }
  }

  await dbQuery(
    `INSERT INTO player_accounts
      (discord_id, minecraft_uuid, minecraft_name, email, discord_username, discord_avatar, account_type, verified, linked_at, last_updated)
     VALUES
      (:discord_id, NULL, NULL, :email, :discord_username, :discord_avatar, :account_type, 0, NOW(), NOW())`,
    {
      discord_id: providerAccountId,
      email: email ?? null,
      discord_username: name ?? null,
      discord_avatar: image ?? null,
      account_type: "pirata",
    }
  );

  return providerAccountId;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const email = credentials.username.includes("@")
          ? credentials.username
          : `${credentials.username}@mavenmc.local`;
        const admin = await getAdminByEmail(email);
        if (!admin) return null;

        const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!valid) return null;

        return {
          id: String(admin.id),
          email: admin.email,
          name: admin.name || "Admin",
          role: admin.role,
          adminId: String(admin.id),
        };
      },
    }),
    CredentialsProvider({
      id: "sso",
      name: "SSO",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const payload = await verifySsoToken(credentials.token);

        return {
          id: payload.playerId ?? payload.adminId ?? "sso-user",
          name: payload.name ?? null,
          email: payload.email ?? null,
          image: payload.image ?? null,
          role: payload.role,
          playerId: payload.playerId,
          adminId: payload.adminId,
        };
      },
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
          username: profile.username,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "credentials") {
        if ((user as typeof user & { role?: string })?.role)
          (token as typeof token & { role?: string }).role = (user as typeof user & { role?: string }).role as string;
        if ((user as typeof user & { adminId?: string }).adminId) {
          (token as typeof token & { adminId?: string }).adminId = String(
            (user as typeof user & { adminId?: string }).adminId
          );
        }
        return token;
      }

      if (account?.provider === "sso") {
        const typedUser = user as typeof user & {
          role?: string;
          playerId?: string;
          adminId?: string;
        };
        if (typedUser.role) (token as typeof token & { role?: string }).role = typedUser.role;
        if (typedUser.playerId) (token as typeof token & { playerId?: string }).playerId = typedUser.playerId;
        if (typedUser.adminId) (token as typeof token & { adminId?: string }).adminId = typedUser.adminId;
        return token;
      }

      // Revalidar admin access apenas quando explicitamente solicitado
      if (trigger === "update") {
        const playerId = token.playerId as string;
        if (playerId) {
          const adminAccess = await checkAdminAccess(playerId);
          if (adminAccess) {
            (token as typeof token & { adminId?: string }).adminId = playerId;
          } else {
            delete (token as typeof token & { adminId?: string }).adminId;
          }
        }
      }

      if (account?.provider === "discord" && account.providerAccountId) {
        const playerId = await ensurePlayerIdentity({
          providerAccountId: String(account.providerAccountId),
          email: user?.email ?? null,
          name: user?.name ?? null,
          image: user?.image ?? null,
        });

        if (playerId) {
          (token as typeof token & { role?: string; playerId?: string; adminId?: string }).role = "player";
          (token as typeof token & { role?: string; playerId?: string; adminId?: string }).playerId = playerId;

          // Check if user has admin access in database
          const adminAccess = await checkAdminAccess(playerId);
          if (adminAccess) {
            (token as typeof token & { role?: string; playerId?: string; adminId?: string }).adminId = playerId;
            // Update last login timestamp
            await updateAdminLastLogin(playerId).catch(() => undefined);
          }

          try {
            const player = await getPlayerByDiscordId(playerId);
            if (player) {
              await notifyLogin(player);
            }
          } catch (error) {
            console.error("Erro ao notificar login:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const typedToken = token as typeof token & { role?: string; playerId?: string; adminId?: string };
        if (typedToken.role) session.user.role = typedToken.role;
        if (typedToken.playerId) session.user.playerId = typedToken.playerId;
        if (typedToken.adminId) session.user.adminId = typedToken.adminId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
