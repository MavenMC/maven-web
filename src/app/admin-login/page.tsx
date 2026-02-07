"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
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
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      background: "#0b0b0b",
      color: "#fff",
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(420px, 92vw)",
          background: "#151515",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Login administrativo</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          Usuario ou email
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            style={{
              background: "#0f0f0f",
              border: "1px solid #303030",
              borderRadius: "8px",
              padding: "0.75rem",
              color: "#fff",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{
              background: "#0f0f0f",
              border: "1px solid #303030",
              borderRadius: "8px",
              padding: "0.75rem",
              color: "#fff",
            }}
          />
        </label>
        {error ? <p style={{ color: "#ff7b7b", margin: 0 }}>{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#2b2b2b" : "#ffc42b",
            color: "#1a1a1a",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
