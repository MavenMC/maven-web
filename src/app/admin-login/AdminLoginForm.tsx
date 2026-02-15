"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function AdminLoginFormInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciais invalidas.");
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: "#0b0b0b",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#1a1a1a",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Login Administrativo
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="username"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #374151",
                borderRadius: "4px",
                background: "#2d2d2d",
                color: "#fff",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #374151",
                borderRadius: "4px",
                background: "#2d2d2d",
                color: "#fff",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.5rem",
                background: "#dc2626",
                color: "#fff",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: loading ? "#374151" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginFormInner />
    </Suspense>
  );
}
