"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type PlayerInfo = {
  minecraftName?: string | null;
};

const MAX_NAME_CHARS = 16;
const HEAD_CHARS = 8;
const TAIL_CHARS = 4;

function truncateMiddle(value: string) {
  if (value.length <= MAX_NAME_CHARS) return value;
  return `${value.slice(0, HEAD_CHARS)}…${value.slice(-TAIL_CHARS)}`;
}

export default function ContaConectada() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.playerId) return;
    let active = true;

    fetch("/api/player/me")
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!active || !data) return;
        setPlayer({ minecraftName: data.minecraftName ?? null });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [session?.user?.playerId]);

  if (status === "loading") {
    return (
      <div className="btn-header-account" aria-busy="true">
        <img
          src="https://mc-heads.net/avatar/steve/64"
          alt="Carregando"
          className="account-avatar"
        />
        <div className="account-info">
          <h3>Carregando...</h3>
          <p>Aguarde</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Link href="/login" className="btn-header-account">
        <img
          src="https://mc-heads.net/avatar/chelseazk/64"
          alt="Steve"
          className="account-avatar"
        />
        <div className="account-info">
          <h3>Login</h3>
          <p>Clique para entrar</p>
        </div>
      </Link>
    );
  }

  const fallbackName = session.user?.name ?? "Conectado";
  const minecraftName = player?.minecraftName ?? null;
  const baseName = minecraftName || fallbackName;
  const displayName = truncateMiddle(baseName);
  const avatarSrc = minecraftName
    ? `https://mc-heads.net/avatar/${encodeURIComponent(minecraftName)}/64`
    : session.user?.image || "https://mc-heads.net/avatar/steve/64";
  const isAdmin = !!session.user?.adminId;

  return (
    <div className="account-dropdown">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn-header-account"
        title={baseName}
      >
        <img src={avatarSrc} alt={baseName} className="account-avatar" />
        <div className="account-info">
          <h3>{displayName}</h3>
          <p>Ver opções</p>
        </div>
      </button>
      
      {dropdownOpen && (
        <div className="account-dropdown-menu">
          <Link href="/perfil" onClick={() => setDropdownOpen(false)}>
            Meu Perfil
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setDropdownOpen(false)} className="admin-link">
              Painel Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              signOut({ callbackUrl: "/" });
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
