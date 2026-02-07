import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createSsoToken, getSafeRedirectUrl } from "@/lib/sso";

type SsoSearchParams = {
  redirect?: string;
  next?: string;
  mode?: string;
};

export default async function SsoStart({
  searchParams,
}: {
  searchParams: SsoSearchParams;
}) {
  const redirectParam = searchParams.redirect ?? "";
  const safeRedirect = redirectParam ? getSafeRedirectUrl(redirectParam) : null;

  if (!safeRedirect) {
    redirect("/");
  }

  const session = await getServerSession(authOptions);
  const mode = searchParams.mode === "admin" ? "admin" : "player";

  if (!session?.user) {
    const loginPath = mode === "admin" ? "/admin-login" : "/login";
    const authBase = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_AUTH_CENTER_URL ?? "";
    if (!authBase) {
      redirect("/");
    }
    const callbackUrl = new URL("/sso/start", authBase);
    callbackUrl.searchParams.set("redirect", safeRedirect);
    if (searchParams.next) callbackUrl.searchParams.set("next", searchParams.next);
    callbackUrl.searchParams.set("mode", mode);

    redirect(`${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`);
  }

  const token = await createSsoToken({
    playerId: session.user.playerId,
    adminId: session.user.adminId,
    role: session.user.role,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  });

  const targetUrl = new URL(safeRedirect);
  targetUrl.searchParams.set("token", token);
  if (searchParams.next) targetUrl.searchParams.set("next", searchParams.next);

  redirect(targetUrl.toString());
}
