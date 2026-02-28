import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <strong>Maven Admin</strong>
          <p className="muted">Painel do site</p>
        </div>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/anuncio">Anúncio</Link>
          <Link href="/admin/estatisticas">Estatísticas</Link>
          <Link href="/admin/noticias">Notícias</Link>
          <Link href="/admin/blog">Blog</Link>
          <Link href="/admin/patch-notes">Patch Notes</Link>
          <Link href="/admin/changelog">Changelog</Link>
          <Link href="/admin/formulario">Formulário</Link>
          <Link href="/admin/forum">Fórum</Link>
          <Link href="/admin/equipe">Equipe</Link>
          <Link href="/admin/redes">Redes Sociais</Link>
          <Link href="/admin/molduras">Molduras de Perfil</Link>
          <Link href="/admin/limpeza">Limpeza de Arquivos</Link>
          <Link href="/admin/admins">Admins</Link>
        </nav>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
