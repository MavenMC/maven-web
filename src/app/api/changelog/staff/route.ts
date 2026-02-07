import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";

const TOKEN = process.env.CHANGELOG_STAFF_TOKEN ?? "";

function getAuthToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return request.headers.get("x-changelog-token")?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json({ error: "Missing CHANGELOG_STAFF_TOKEN" }, { status: 500 });
  }

  const token = getAuthToken(request);
  if (!token || token !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const memberName = typeof payload.member_name === "string" ? payload.member_name.trim() : "";
  const roleName = typeof payload.role_name === "string" ? payload.role_name.trim() : null;
  const note = typeof payload.note === "string" ? payload.note.trim() : null;
  const actionRaw = typeof payload.action === "string" ? payload.action.trim() : "join";
  const action = actionRaw === "leave" ? "leave" : "join";

  const happenedRaw =
    (typeof payload.happened_at === "string" && payload.happened_at.trim()) ||
    (typeof payload.happenedAt === "string" && payload.happenedAt.trim()) ||
    "";
  const happenedAt = happenedRaw ? happenedRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);

  const sortOrder =
    typeof payload.sort_order === "number"
      ? payload.sort_order
      : Number(payload.sort_order || 0);
  const active = payload.active === false ? 0 : 1;

  if (!memberName) {
    return NextResponse.json({ error: "member_name is required" }, { status: 400 });
  }

  await dbQuery(
    `INSERT INTO site_staff_changes
      (member_name, role_name, action, note, happened_at, sort_order, active)
     VALUES
      (:member_name, :role_name, :action, :note, :happened_at, :sort_order, :active)`,
    {
      member_name: memberName,
      role_name: roleName,
      action,
      note,
      happened_at: happenedAt,
      sort_order: sortOrder,
      active,
    },
  );

  revalidatePath("/changelog");
  revalidatePath("/admin/changelog");

  return NextResponse.json({ ok: true });
}
