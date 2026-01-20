"use client";

import { useEffect, useState } from "react";
import BackgroundHeader from "@/components/backgroundheader";
import TermsMaven from "@/components/TermsMaven";

type Conta = {
    nick: string;
    plataforma: "java" | "bedrock";
};

type ItemCarrinho = {
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
};

type Step = "cupom" | "dados" | "pagamento" | "termos";

function Accordion({
    title,
    icon,
    step,
    openSteps,
    toggle,
    children,
}: {
    title: string;
    icon: string;
    step: Step;
    openSteps: Step[];
    toggle: (s: Step) => void;
    children: React.ReactNode;
}) {
    const isOpen = openSteps.includes(step);

    return (
        <div className="bg-[#1f1f1f] rounded-xl border border-white/10">
            <button
                onClick={() => toggle(step)}
                className="w-full flex items-center gap-2 px-4 py-4 sm:px-5 sm:py-4
     font-semibold text-left"
            >
                <span>{icon}</span>
                <span>{title}</span>
            </button>

            {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-white/10">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function CarrinhoPage() {
    const [conta, setConta] = useState<Conta | null>(null);

    const [openSteps, setOpenSteps] = useState<Step[]>(["dados"]);

    const [email, setEmail] = useState("");
    const [nome, setNome] = useState("");
    const [sobrenome, setSobrenome] = useState("");

    const [pagamento, setPagamento] = useState<"" | "pix" | "cartao" | "paypal">(
        ""
    );
    const [aceitouTermos, setAceitouTermos] = useState(false);

    const itens: ItemCarrinho[] = [
        {
            id: "vip-lendario",
            nome: "VIP LENDÁRIO",
            preco: 19.95,
            quantidade: 1,
        },
    ];

    useEffect(() => {
        const data = localStorage.getItem("maven_account");
        if (data) setConta(JSON.parse(data));
    }, []);

    const subtotal = itens.reduce(
        (acc, item) => acc + item.preco * item.quantidade,
        0
    );

    function toggleStep(step: Step) {
        setOpenSteps((prev) =>
            prev.includes(step)
                ? prev.filter((s) => s !== step)
                : [...prev, step]
        );
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const nomeValido = nome.length >= 2 && nome.length <= 32;
    const sobrenomeValido = sobrenome.length >= 2 && sobrenome.length <= 32;

    const dadosValidos = emailValido && nomeValido && sobrenomeValido;

    return (
        <div className="space-y-8">
            <BackgroundHeader />

            {/* CONTAINER CENTRAL */}
            <div className="max-w-5xl mx-auto space-y-6 px-4">
                {/* RESUMO */}
                <div className="bg-[#1a1a1a] rounded-xl p-6">
                    <h2 className="font-bold mb-4">🛒 Carrinho de compras</h2>

                    {itens.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between border-b border-white/10 pb-3 mb-3"
                        >
                            <span>{item.nome}</span>
                            <span className="font-bold">
                                R$ {item.preco.toFixed(2)}
                            </span>
                        </div>
                    ))}

                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-400">
                            R$ {subtotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* CUPOM */}
                <Accordion
                    title="Cupom de Desconto"
                    icon="ℹ️"
                    step="cupom"
                    openSteps={openSteps}
                    toggle={toggleStep}
                >
                    <input
                        placeholder="Código de apoiador"
                        className="w-full px-4 py-3 rounded-lg bg-[#0f0f0f] border border-white/10"
                    />
                </Accordion>

                {/* DADOS */}
                <Accordion
                    title="Informações da compra"
                    icon="🚚"
                    step="dados"
                    openSteps={openSteps}
                    toggle={toggleStep}
                >
                    <input
                        value={conta?.nick ?? ""}
                        disabled
                        className="w-full mb-3 px-4 py-3 rounded-lg bg-[#0f0f0f] text-gray-400"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                        />
                        <input
                            placeholder="Nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="input"
                        />
                        <input
                            placeholder="Sobrenome"
                            value={sobrenome}
                            onChange={(e) => setSobrenome(e.target.value)}
                            className="input"
                        />
                    </div>

                    <button
                        disabled={!dadosValidos}
                        onClick={() =>
                            !openSteps.includes("pagamento") &&
                            setOpenSteps((s) => [...s, "pagamento"])
                        }
                        className={`mt-4 px-6 py-2 rounded-lg font-bold ${dadosValidos
                            ? "bg-blue-500"
                            : "bg-gray-600 cursor-not-allowed"
                            }`}
                    >
                        CONTINUAR
                    </button>
                </Accordion>

                {/* PAGAMENTO */}
                <Accordion
                    title="Detalhes do pagamento"
                    icon="💳"
                    step="pagamento"
                    openSteps={openSteps}
                    toggle={toggleStep}
                >
                    <label className="flex gap-2">
                        <input
                            type="radio"
                            checked={pagamento === "pix"}
                            onChange={() => setPagamento("pix")}
                        />
                        Pix
                    </label>

                    <label className="flex gap-2">
                        <input
                            type="radio"
                            checked={pagamento === "cartao"}
                            onChange={() => setPagamento("cartao")}
                        />
                        Cartão de crédito
                    </label>

                    <label className="flex gap-2">
                        <input
                            type="radio"
                            checked={pagamento === "paypal"}
                            onChange={() => setPagamento("paypal")}
                        />
                        PayPal
                    </label>

                    <button
                        disabled={!pagamento}
                        onClick={() =>
                            !openSteps.includes("termos") &&
                            setOpenSteps((s) => [...s, "termos"])
                        }
                        className={`mt-4 px-6 py-2 rounded-lg font-bold ${pagamento
                            ? "bg-blue-500"
                            : "bg-gray-600 cursor-not-allowed"
                            }`}
                    >
                        CONTINUAR
                    </button>
                </Accordion>


                {/* TERMOS */}
                <Accordion
                    title="Termos e checkout"
                    icon="📜"
                    step="termos"
                    openSteps={openSteps}
                    toggle={toggleStep}
                >
                    <TermsMaven />

                    <label className="flex gap-2 mt-4 text-sm sm:text-base">
                        <input
                            type="checkbox"
                            checked={aceitouTermos}
                            onChange={(e) => setAceitouTermos(e.target.checked)}
                        />
                        Li e concordo com os termos
                    </label>

                    <button
                        disabled={!aceitouTermos}
                        className={`mt-4 w-full py-3 rounded-xl font-bold ${aceitouTermos
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-gray-600 cursor-not-allowed"
                            }`}
                    >
                        PAGAR
                    </button>
                </Accordion>
            </div>
        </div>
    );
}
