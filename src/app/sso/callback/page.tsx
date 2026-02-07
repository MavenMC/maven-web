"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SsoCallbackPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const nextParam = searchParams.get("next") ?? "/";
  const nextUrl = nextParam.startsWith("/") ? nextParam : "/";

  useEffect(() => {
    if (!token) return;
    void signIn("sso", { token, callbackUrl: nextUrl });
  }, [token, nextUrl]);

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
    }}>
      Finalizando login...
    </div>
  );
}
