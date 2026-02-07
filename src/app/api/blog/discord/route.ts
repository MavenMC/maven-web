import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbQuery } from "@/lib/db";
import { buildSummary, resolveCoverLabel } from "@/lib/post-utils";

const TOKEN = process.env.BLOG_INGEST_TOKEN ?? "";

function getAuthToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return request.headers.get("x-blog-token")?.trim() ?? "";
}

function resolveCover(payload: Record<string, unknown>) {
  const cover =
    (typeof payload.cover === "string" && payload.cover.trim()) ||
    (typeof payload.cover_url === "string" && payload.cover_url.trim()) ||
    (typeof payload.coverUrl === "string" && payload.coverUrl.trim()) ||
    (typeof payload.image === "string" && payload.image.trim()) ||
    null;
  return cover;
}

export async function POST(request: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json({ error: "Missing BLOG_INGEST_TOKEN" }, { status: 500 });
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

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : null;
  const tag = typeof payload.tag === "string" ? payload.tag.trim() : null;
  const coverLabelRaw =
    typeof payload.cover_label === "string"
      ? payload.cover_label.trim()
      : typeof payload.coverLabel === "string"
        ? payload.coverLabel.trim()
        : null;
  const cover = resolveCover(payload);

  const publishedRaw =
    (typeof payload.published_at === "string" && payload.published_at.trim()) ||
    (typeof payload.publishedAt === "string" && payload.publishedAt.trim()) ||
    "";
  const publishedAt = publishedRaw ? publishedRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const active = payload.active === false ? 0 : 1;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const resolvedSummary = buildSummary(summary, content);
  const resolvedCoverLabel = resolveCoverLabel(coverLabelRaw, tag);

  await dbQuery(
    `INSERT INTO site_posts
      (type, title, summary, content, tag, cover, cover_label, published_at, sort_order, active)
     VALUES
      ('blog', :title, :summary, :content, :tag, :cover, :cover_label, :published_at, :sort_order, :active)`,
    {
      title,
      summary: resolvedSummary,
      content,
      tag,
      cover,
      cover_label: resolvedCoverLabel,
      published_at: publishedAt,
      sort_order: 0,
      active,
    },
  );

  revalidatePath("/blog");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
