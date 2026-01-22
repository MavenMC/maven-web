import { NextResponse } from "next/server";

type Body = {
  nick: string;
  plataforma: "java" | "bedrock";
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    const { nick, plataforma } = body;

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

    // 🔐 AQUI NO FUTURO:
    // - enviar requisição para o plugin do Minecraft
    // - adicionar whitelist
    // - aplicar permissões

    console.log("VALIDAÇÃO RECEBIDA:", {
      nick,
      plataforma,
    });

    return NextResponse.json({
      success: true,
      message: "Conta validada com sucesso",
      data: {
        nick,
        plataforma,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
