"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundHeader from "@/components/backgroundheader";

type Conta = {
  nick: string;
  plataforma: "java" | "bedrock";
};

export default function ValidarPage() {
  const [plataforma, setPlataforma] = useState<"java" | "bedrock" | null>(null);
  const [nick, setNick] = useState("");
  const [erro, setErro] = useState("");
  const [contaSalva, setContaSalva] = useState<Conta | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /* 🔍 verifica conta salva */
  useEffect(() => {
    const data = localStorage.getItem("maven_account");
    if (data) {
      setContaSalva(JSON.parse(data));
    }
  }, []);

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

  if (!plataforma || !nick) return;

  try {
    const res = await fetch("/api/validar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nick,
        plataforma,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErro(data.error || "Erro ao validar");
      return;
    }

    localStorage.setItem(
      "maven_account",
      JSON.stringify({ nick, plataforma })
    );

    router.push("/");
  } catch {
    setErro("Erro de conexão com o servidor");
  }
}

  function trocarConta() {
    localStorage.removeItem("maven_account");
    setContaSalva(null);
    setNick("");
    setPlataforma(null);
  }

  /* 🔒 CONTA JÁ VINCULADA */
  if (contaSalva) {
    return (
      <div className="min-h-screen text-white">
        <BackgroundHeader />

        <div className="flex items-center justify-center px-4 py-10 sm:py-16">
          <div className="bg-[#13080C] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <h1 className="text-2xl font-bold mb-4">
              Conta já vinculada
            </h1>

            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <p className="font-semibold text-lg">
                {contaSalva.nick}
              </p>
              <p className="text-sm text-gray-400">
                Plataforma: {contaSalva.plataforma.toUpperCase()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-700"
              >
                Voltar
              </button>

              <button
                onClick={trocarConta}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 font-bold"
              >
                Trocar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* 🧾 TELA DE VALIDAÇÃO */
  return (
    <div className="min-h-screen bg-[#222525] text-white">
      <BackgroundHeader />

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-[#13080C] border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <h1 className="text-2xl font-bold text-center">
            VALIDAR CONEXÃO
          </h1>

          <p className="text-center text-gray-400 mt-2 mb-6">
            Insira seu nick e selecione a plataforma
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={selecionarJava}
              className={`py-3 rounded-xl font-semibold ${
                plataforma === "java"
                  ? "bg-red-500"
                  : "bg-[#0f1623] hover:bg-[#1f2937]"
              }`}
            >
              🖥️ Java
            </button>

            <button
              onClick={selecionarBedrock}
              className={`py-3 rounded-xl font-semibold ${
                plataforma === "bedrock"
                  ? "bg-red-500"
                  : "bg-[#0f1623] hover:bg-[#1f2937]"
              }`}
            >
              📱 Bedrock
            </button>
          </div>

          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Seu nick no jogo"
            className="w-full px-4 py-3 rounded-xl bg-white text-black mb-2"
          />

          {erro && (
            <p className="text-sm text-red-400 mb-2">
              ⚠️ {erro}
            </p>
          )}

          <button
            onClick={handleValidar}
            disabled={!plataforma || !nick || loading}
            className="w-full mt-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 font-bold disabled:bg-gray-600"
          >
            {loading ? "VALIDANDO..." : "VALIDAR"}
          </button>
        </div>
      </main>
    </div>
  );
}
