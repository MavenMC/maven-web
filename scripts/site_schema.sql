CREATE TABLE IF NOT EXISTS site_admins (
  discord_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discord_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_announcements (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  highlight VARCHAR(120) NULL,
  ip_text VARCHAR(120) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_announcements_active (active),
  INDEX idx_site_announcements_dates (starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_stats (
  id INT NOT NULL AUTO_INCREMENT,
  label VARCHAR(120) NOT NULL,
  value VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_stats_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_posts (
  id INT NOT NULL AUTO_INCREMENT,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT NULL,
  content LONGTEXT NULL,
  tag VARCHAR(60) NULL,
  cover VARCHAR(255) NULL,
  cover_label VARCHAR(60) NULL,
  published_at DATE NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_posts_type (type),
  INDEX idx_site_posts_active (active),
  INDEX idx_site_posts_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_changelog_entries (
  id INT NOT NULL AUTO_INCREMENT,
  version VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  items_json LONGTEXT NULL,
  published_at DATE NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_changelog_active (active),
  INDEX idx_site_changelog_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_forum_categories (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(60) NULL,
  variant VARCHAR(30) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_forum_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_forum_posts (
  id INT NOT NULL AUTO_INCREMENT,
  category_id INT NOT NULL,
  author_uuid VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content LONGTEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_forum_posts_author (author_uuid),
  INDEX idx_site_forum_posts_category (category_id),
  INDEX idx_site_forum_posts_active (active),
  CONSTRAINT fk_site_forum_posts_category
    FOREIGN KEY (category_id) REFERENCES site_forum_categories (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_social_links (
  id INT NOT NULL AUTO_INCREMENT,
  label VARCHAR(120) NOT NULL,
  url VARCHAR(255) NOT NULL,
  icon VARCHAR(60) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_social_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_staff_roles (
  id INT NOT NULL AUTO_INCREMENT,
  slug VARCHAR(50) NOT NULL,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(60) NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#f08a2b',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_site_staff_roles_slug (slug),
  INDEX idx_site_staff_roles_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_staff_members (
  id INT NOT NULL AUTO_INCREMENT,
  role_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  minecraft VARCHAR(50) NOT NULL,
  discord_id VARCHAR(32) NULL,
  responsibility VARCHAR(140) NULL,
  minecraft_uuid VARCHAR(36) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_staff_members_role (role_id),
  INDEX idx_site_staff_members_active (active),
  CONSTRAINT fk_site_staff_members_role
    FOREIGN KEY (role_id) REFERENCES site_staff_roles (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_staff_changes (
  id INT NOT NULL AUTO_INCREMENT,
  member_name VARCHAR(80) NOT NULL,
  role_name VARCHAR(80) NULL,
  action VARCHAR(20) NOT NULL,
  note TEXT NULL,
  happened_at DATE NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_site_staff_changes_active (active),
  INDEX idx_site_staff_changes_date (happened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS perfil_jogadores_assets (
  uuid VARCHAR(36) NOT NULL,
  banner_url VARCHAR(500) NULL,
  avatar_url VARCHAR(500) NULL,
  ring_url VARCHAR(500) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (uuid),
  CONSTRAINT fk_perfil_jogadores_assets_uuid
    FOREIGN KEY (uuid) REFERENCES perfil_jogadores (uuid)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS perfil_jogadores_redes (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) NOT NULL,
  label VARCHAR(60) NOT NULL,
  url VARCHAR(255) NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_perfil_jogadores_redes_uuid (uuid),
  INDEX idx_perfil_jogadores_redes_public (is_public),
  CONSTRAINT fk_perfil_jogadores_redes_uuid
    FOREIGN KEY (uuid) REFERENCES perfil_jogadores (uuid)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS perfil_jogadores_reputacoes (
  id INT NOT NULL AUTO_INCREMENT,
  rater_uuid VARCHAR(36) NOT NULL,
  target_uuid VARCHAR(36) NOT NULL,
  rating TINYINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_perfil_jogadores_reputacoes_pair (rater_uuid, target_uuid),
  INDEX idx_perfil_jogadores_reputacoes_target (target_uuid),
  CONSTRAINT fk_perfil_jogadores_reputacoes_target
    FOREIGN KEY (target_uuid) REFERENCES perfil_jogadores (uuid)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
