import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";

type AdminAccessRow = {
  discord_id: string;
  discord_username: string | null;
  is_active: number;
  access_level: string;
  granted_at: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // Verificar se a tabela existe
    const tableCheck = await dbQuery<Array<{ TABLE_NAME: string }>>(
      "SHOW TABLES LIKE 'admin_access'",
      {}
    );

    if (tableCheck.length === 0) {
      return NextResponse.json({
        error: "Tabela admin_access não existe",
        solution: "Execute o arquivo database/admin_access.sql no banco de dados"
      });
    }

    // Verificar registro do usuário atual
    const adminRows = await dbQuery<AdminAccessRow[]>(
      "SELECT discord_id, discord_username, is_active, access_level, granted_at FROM admin_access WHERE discord_id = :discord_id",
      { discord_id: session.user.playerId }
    );

    // Listar todos os admins ativos
    const allAdmins = await dbQuery<AdminAccessRow[]>(
      "SELECT discord_id, discord_username, is_active, access_level, granted_at FROM admin_access ORDER BY granted_at DESC",
      {}
    );

    return NextResponse.json({
      tableExists: true,
      currentUser: {
        discordId: session.user.playerId,
        name: session.user.name,
        sessionAdminId: session.user.adminId,
        isAdmin: !!session.user.adminId
      },
      adminRecord: adminRows[0] || null,
      allAdmins: allAdmins,
      debug: {
        hasRecord: adminRows.length > 0,
        isActive: adminRows[0]?.is_active === 1,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: "Erro ao consultar banco",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
