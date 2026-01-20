"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import store from "@/data/store.json";
import VipComparisonTable from "@/components/VipComparisonTable";
import BackgroundHeader from "@/components/backgroundheader";

type Conta = {
  nick: string;
  plataforma: "java" | "bedrock";
};

const cores = {
  lendario: {
    border: "border-green-500/40",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.35)]",
    price: "text-green-400",
    button: "bg-green-500 hover:bg-green-600",
  },
  supremo: {
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.35)]",
    price: "text-yellow-400",
    button: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  imperador: {
    border: "border-blue-500/40",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.35)]",
    price: "text-blue-400",
    button: "bg-blue-500 hover:bg-blue-600",
  },
  monarca: {
    border: "border-purple-500/40",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.35)]",
    price: "text-purple-400",
    button: "bg-purple-500 hover:bg-purple-600",
  },
};

export default function LojaPage() {
  const [conta, setConta] = useState<Conta | null>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem("maven_account");
    if (data) setConta(JSON.parse(data));
  }, []);

  function handleComprar(vipId: string) {
    if (!conta) {
      router.push("/validar");
      return;
    }

    const vip = store.vips.find((v) => v.id === vipId);
    if (!vip) return;

    const item = {
      id: vip.id,
      nome: `VIP ${vip.nome}`,
      preco: vip.preco.valor,
      quantidade: 1,
    };

    localStorage.setItem("maven_cart", JSON.stringify([item]));
    router.push("/carrinho");
  }

  return (
    <div className="space-y-12">
      <BackgroundHeader />

      {/* AVISO */}
      {!conta && (
        <div className="bg-[#1a0f14] border border-red-500/30 rounded-xl p-4 text-sm sm:text-base text-red-300">
          ⚠️ Para comprar um VIP, é necessário validar sua conta.
        </div>
      )}

      {/* VIPs */}
      <div
        className="
          flex gap-4 overflow-x-auto pb-4
          sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6
        "
      >
        {store.vips.map((vip) => {
          const cor = cores[vip.id as keyof typeof cores];

          return (
            <div
              key={vip.id}
              className={`
                min-w-[260px] sm:min-w-0
                bg-[#13080C]
                border ${cor.border}
                rounded-2xl
                p-6
                flex flex-col
                items-center
                text-center
                ${cor.glow}
              `}
            >
              <h2 className="text-xl font-bold mb-2">
                VIP {vip.nome}
              </h2>

              <p className={`text-2xl font-extrabold mb-6 ${cor.price}`}>
                R$ {vip.preco.valor.toFixed(2)}
                {vip.preco.tipo === "mensal" && "/mês"}
              </p>

              <button
                onClick={() => handleComprar(vip.id)}
                className={`w-full py-3 rounded-xl font-bold transition ${cor.button}`}
              >
                COMPRAR
              </button>
            </div>
          );
        })}
      </div>

      {/* BENEFÍCIOS */}
      <div className="pt-6">
        <VipComparisonTable />
      </div>
    </div>
  );
}
