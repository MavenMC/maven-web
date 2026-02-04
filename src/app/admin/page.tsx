import { dbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

type CountRow = { total: number };

export default async function AdminDashboard() {
  await requireAdmin();
  
  const [posts] = await dbQuery<CountRow[]>(
    "SELECT COUNT(*) as total FROM site_posts",
  );
  const [changelog] = await dbQuery<CountRow[]>(
    "SELECT COUNT(*) as total FROM site_changelog_entries",
  );
  const [forum] = await dbQuery<CountRow[]>(
    "SELECT COUNT(*) as total FROM site_forum_categories",
  );
  const [social] = await dbQuery<CountRow[]>(
    "SELECT COUNT(*) as total FROM site_social_links",
  );
  const [stats] = await dbQuery<CountRow[]>(
    "SELECT COUNT(*) as total FROM site_stats",
  );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Painel Administrativo</h1>
        <p>Gerencie o conteúdo dinâmico do site Maven Network.</p>
      </header>

      <section className="admin-grid">
        <div className="card admin-card">
          <span className="card-eyebrow">Posts</span>
          <h2 className="admin-metric">{posts?.total ?? 0}</h2>
          <p className="muted">Notícias, blog e patch notes.</p>
        </div>
        <div className="card admin-card">
          <span className="card-eyebrow">Changelog</span>
          <h2 className="admin-metric">{changelog?.total ?? 0}</h2>
          <p className="muted">Entradas publicadas.</p>
        </div>
        <div className="card admin-card">
          <span className="card-eyebrow">Fórum</span>
          <h2 className="admin-metric">{forum?.total ?? 0}</h2>
          <p className="muted">Categorias oficiais.</p>
        </div>
        <div className="card admin-card">
          <span className="card-eyebrow">Redes</span>
          <h2 className="admin-metric">{social?.total ?? 0}</h2>
          <p className="muted">Links publicados.</p>
        </div>
      </section>

      <section className="admin-grid">
        <div className="card admin-card">
          <span className="card-eyebrow">Estatísticas</span>
          <h2 className="admin-metric">{stats?.total ?? 0}</h2>
          <p className="muted">Cards da home.</p>
        </div>
      </section>
    </div>
  );
}
