"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

type PlayerInfo = {
  discordId: string;
  discordUsername: string | null;
  minecraftName: string | null;
  accountType: string | null;
  verified: boolean;
  isBedrock: boolean;
};

export default function ProfileLinker() {
  const { data: session, status } = useSession();
  const [plataforma, setPlataforma] = useState<"java" | "bedrock" | null>(null);
  const [accountType, setAccountType] = useState<"original" | "pirata">("original");
  const [nick, setNick] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.playerId) return;
    setInfoLoading(true);
    fetch("/api/player/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.discordId) {
          setPlayerInfo(data);
        }
      })
      .catch(() => undefined)
      .finally(() => setInfoLoading(false));
  }, [session?.user?.playerId]);

  function selecionarJava() {
    setPlataforma("java");
    if (nick.startsWith("*")) setNick(nick.substring(1));
  }

  function selecionarBedrock() {
    setPlataforma("bedrock");
    if (nick && !nick.startsWith("*")) setNick(`*${nick}`);
  }

  async function handleValidar() {
    setErro("");
    setLoading(true);

    if (!plataforma) {
      setErro("Selecione a plataforma");
      setLoading(false);
      return;
    }

    if (!nick) {
      setErro("Informe o nick");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/player/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nick,
          platform: plataforma,
          accountType: plataforma === "java" ? accountType : "bedrock",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao validar");
        return;
      }

      setPlayerInfo((prev) => ({
        ...(prev ?? {
          discordId: session?.user?.playerId ?? "",
          discordUsername: session?.user?.name ?? null,
          minecraftName: null,
          accountType: null,
          verified: false,
          isBedrock: false,
        }),
        minecraftName: data.nickname,
        accountType: data.accountType,
        verified: true,
        isBedrock: data.platform === "bedrock",
      }));
    } catch (err) {
      console.error(err);
      setErro("Erro de conexao com o servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/player/unlink", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao desvincular");
        return;
      }
      setPlayerInfo((prev) =>
        prev
          ? {
              ...prev,
              minecraftName: null,
              accountType: null,
              verified: false,
              isBedrock: false,
            }
          : prev,
      );
    } catch (err) {
      console.error(err);
      setErro("Erro de conexao com o servidor");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div className="validar-card">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="validar-card">
        <h3 className="validar-title">Conecte seu Discord</h3>
        <p className="validar-sub">
          Para vincular sua conta Minecraft, primeiro conecte seu Discord.
        </p>
        <button type="button" className="btn primary" onClick={() => signIn("discord")}>
          Entrar com Discord
        </button>
      </div>
    );
  }

  if (infoLoading) {
    return <div className="validar-card">Buscando informacoes...</div>;
  }

  if (playerInfo?.minecraftName) {
    return (
      <div className="validar-card">
        <h3 className="validar-title">Conta vinculada</h3>

        <div className="validar-summary">
          <p className="validar-name">{playerInfo.minecraftName}</p>
          <p className="validar-meta">
            Plataforma: {playerInfo.isBedrock ? "BEDROCK" : "JAVA"}
          </p>
        </div>

        {erro && <p className="form-error">{erro}</p>}

        <div className="validar-actions">
          <button onClick={handleUnlink} className="btn secondary" disabled={loading} type="button">
            Desvincular
          </button>
          <button
            onClick={() => setPlayerInfo({ ...playerInfo, minecraftName: null })}
            className="btn primary"
            disabled={loading}
            type="button"
          >
            Alterar nick
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="validar-card">
      <h3 className="validar-title">Vincular conta Minecraft</h3>
      <p className="validar-sub">Insira seu nick e selecione a plataforma.</p>

      <div className="validar-options">
        <button
          onClick={selecionarJava}
          className={`btn ${plataforma === "java" ? "primary" : "secondary"}`}
          type="button"
        >
          Java
        </button>
        <button
          onClick={selecionarBedrock}
          className={`btn ${plataforma === "bedrock" ? "primary" : "secondary"}`}
          type="button"
        >
          Bedrock
        </button>
      </div>

      {plataforma === "java" && (
        <div className="validar-options">
          <button
            onClick={() => setAccountType("original")}
            className={`btn ${accountType === "original" ? "primary" : "secondary"}`}
            type="button"
          >
            Original
          </button>
          <button
            onClick={() => setAccountType("pirata")}
            className={`btn ${accountType === "pirata" ? "primary" : "secondary"}`}
            type="button"
          >
            Pirata
          </button>
        </div>
      )}

      <div className="player-input">
        <label htmlFor="perfil-validar-nick">Seu nick no jogo</label>
        <div className="player-input-group">
          <input
            id="perfil-validar-nick"
            value={nick}
            onChange={(e) => {
              let value = e.target.value;
              if (plataforma === "bedrock") {
                value = value.replace(/\*/g, "");
                value = `*${value}`;
              }
              setNick(value);
            }}
            placeholder="Seu nick no jogo"
          />
        </div>
      </div>

      {erro && <p className="form-error">{erro}</p>}

      <div className="validar-actions">
        <button
          onClick={handleValidar}
          disabled={!plataforma || !nick || loading}
          className="btn primary"
          type="button"
        >
          {loading ? "Validando..." : "Vincular"}
        </button>
      </div>
    </div>
  );
}
