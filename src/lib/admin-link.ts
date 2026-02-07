import { SignJWT, jwtVerify } from "jose";

type AdminLinkPayload = {
  adminId: string;
  role?: string | null;
};

const adminLinkAudience = "maven-admin-link";

function getAdminLinkSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminLinkToken(payload: AdminLinkPayload) {
  const secret = getAdminLinkSecret();

  return await new SignJWT({ adminId: payload.adminId, role: payload.role ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .setAudience(adminLinkAudience)
    .setSubject(`admin:${payload.adminId}`)
    .sign(secret);
}

export async function verifyAdminLinkToken(token: string) {
  const secret = getAdminLinkSecret();
  const { payload } = await jwtVerify(token, secret, {
    audience: adminLinkAudience,
  });

  return payload as AdminLinkPayload;
}
