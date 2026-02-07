import Link from "next/link";
import { getSitePosts } from "@/lib/site-data";
import { formatShortDate } from "@/lib/date";
import { getPostCoverProps } from "@/lib/post-cover";

export default async function PatchNotesPage() {
  const patchNotes = await getSitePosts("patch");

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="blog-header">
            <span className="section-kicker">Patch Notes</span>
            <h2>Notas de atualização</h2>
            <p>Resumo rápido do que mudou no Maven Network.</p>
          </div>

          <div className="blog-grid">
            {patchNotes.length ? (
              patchNotes.map((note) => (
                <article key={note.id} className="card blog-card">
                  <div className={getPostCoverProps(note.cover).className} style={getPostCoverProps(note.cover).style}>
                    {note.cover_label || note.tag || "PATCH"}
                  </div>
                  <div>
                    <span className="card-eyebrow">
                      {formatShortDate(note.published_at) || "Sem data"}
                    </span>
                    <h3 className="card-title">{note.title}</h3>
                    <p className="card-sub">{note.summary ?? "Atualização rápida do servidor."}</p>
                  </div>
                  <Link href="/forum" className="btn ghost btn-sm">
                    Discutir no fórum
                  </Link>
                </article>
              ))
            ) : (
              <div className="card">
                <h3>Sem patches</h3>
                <p className="muted">Nenhum patch note publicado ainda.</p>
              </div>
            )}
          </div>

          <div className="blog-footer">
            <div className="blog-strip">
              <div>
                <strong>Quer detalhes completos?</strong>
                <p className="muted">Veja o changelog para uma lista detalhada.</p>
              </div>
              <Link href="/changelog" className="btn secondary btn-sm">
                Ver changelog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
