export const runtime = "nodejs";

import { NextResponse } from "next/server";

type Body = {
  nick: string;
  plataforma: "java" | "bedrock";
};

export async function POST(req: Request) {
  try {
    const { nick, plataforma }: Body = await req.json();

    // validações básicas
    if (!nick || !plataforma) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    if (plataforma === "bedrock" && !nick.startsWith("*")) {
      return NextResponse.json(
        { error: "Nick Bedrock deve iniciar com *" },
        { status: 400 }
      );
    }

    // 🔗 chamada SERVER → SERVER (permitido)
    const res = await fetch(
      "http://sp-13.magnohost.com.br:25501/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer MAVEN_21012026",
        },
        body: JSON.stringify({ nick }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { error: data.error || "Falha ao validar jogador" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        nick: data.nick,
        uuid: data.uuid,
        plataforma,
      },
    });

  } catch (err) {
    console.error("ERRO API VALIDAR:", err);
    return NextResponse.json(
      { error: "Erro interno ao validar" },
      { status: 500 }
    );
  }
}
