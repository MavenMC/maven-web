import { SignJWT, jwtVerify } from "jose";

type SsoPayload = {
  playerId?: string;
  adminId?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const ssoAudience = "maven-sso";

function getSsoSecret() {
  const secret = process.env.SSO_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing SSO_JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

function getSsoIssuer() {
  return process.env.SSO_ISSUER ?? process.env.NEXT_PUBLIC_AUTH_CENTER_URL ?? "";
}

export async function createSsoToken(payload: SsoPayload) {
  const secret = getSsoSecret();
  const issuer = getSsoIssuer();
  if (!issuer) {
    throw new Error("Missing SSO_ISSUER or NEXT_PUBLIC_AUTH_CENTER_URL");
  }

  const subject = payload.playerId
    ? `player:${payload.playerId}`
    : payload.adminId
      ? `admin:${payload.adminId}`
      : "user:unknown";

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .setAudience(ssoAudience)
    .setIssuer(issuer)
    .setSubject(subject)
    .sign(secret);
}

export async function verifySsoToken(token: string) {
  const secret = getSsoSecret();
  const issuer = getSsoIssuer();
  if (!issuer) {
    throw new Error("Missing SSO_ISSUER or NEXT_PUBLIC_AUTH_CENTER_URL");
  }

  const { payload } = await jwtVerify(token, secret, {
    audience: ssoAudience,
    issuer,
  });

  return payload as SsoPayload;
}

export function getSafeRedirectUrl(input: string) {
  try {
    const target = new URL(input);
    if (target.hostname.endsWith(".mavenmc.com.br") || target.hostname === "mavenmc.com.br") {
      return target.toString();
    }
  } catch {
    return null;
  }

  return null;
}
