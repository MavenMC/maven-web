import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.adminId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsedId = Number(String(body?.id ?? "").trim());

    if (parsedId > 0) {
      await dbQuery("DELETE FROM site_staff_changes WHERE id = :id", { id: parsedId });
      return NextResponse.json({ ok: true });
    }

    const legacy = body?.legacy ?? {};
    const legacyCreatedTs = Number(legacy?.createdTs || 0);
    const legacyMemberName = String(legacy?.memberName || "").trim();
    const legacyAction = String(legacy?.action || "").trim();
    const legacySortOrder = Number(legacy?.sortOrder || 0);
    const legacyHappenedAtRaw = String(legacy?.happenedAt || "").trim();
    const legacyHappenedAt = legacyHappenedAtRaw.length > 0 ? legacyHappenedAtRaw : null;

    if (!legacyCreatedTs || !legacyMemberName || !legacyAction) {
      return NextResponse.json({ error: "Identificador inválido para exclusão." }, { status: 400 });
    }

    await dbQuery(
      `DELETE FROM site_staff_changes
       WHERE id IS NULL
         AND UNIX_TIMESTAMP(created_at) = :legacy_created_ts
         AND member_name = :legacy_member_name
         AND action = :legacy_action
         AND sort_order = :legacy_sort_order
         AND ((happened_at IS NULL AND :legacy_happened_at IS NULL) OR happened_at = :legacy_happened_at)
       LIMIT 1`,
      {
        legacy_created_ts: legacyCreatedTs,
        legacy_member_name: legacyMemberName,
        legacy_action: legacyAction,
        legacy_sort_order: legacySortOrder,
        legacy_happened_at: legacyHappenedAt,
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir movimentação via API:", error);
    return NextResponse.json({ error: "Erro ao excluir movimentação." }, { status: 500 });
  }
}
