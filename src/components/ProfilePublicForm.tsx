"use client";

import { useState } from "react";

type ProfileFormProfile = {
  apelido: string | null;
  bio: string | null;
  estatisticas_publicas: number | null;
  privacidade: string | null;
};

type ProfileFormAssets = {
  banner_url: string | null;
  avatar_url: string | null;
  ring_url: string | null;
};

type ProfileFormSocial = {
  id: number;
  label: string;
  url: string;
  is_public: number;
};

type ProfilePublicFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  profile: ProfileFormProfile | null;
  assets: ProfileFormAssets | null;
  socialList: ProfileFormSocial[];
};

const MAX_BYTES = 5 * 1024 * 1024;

export default function ProfilePublicForm({
  action,
  profile,
  assets,
  socialList,
}: ProfilePublicFormProps) {
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setError("");
    const form = event.currentTarget;
    const fileInputs = form.querySelectorAll<HTMLInputElement>('input[type="file"]');
    let totalBytes = 0;

    fileInputs.forEach((input) => {
      const file = input.files?.[0];
      if (file) totalBytes += file.size;
    });

    if (totalBytes > MAX_BYTES) {
      event.preventDefault();
      setError("Limite total de upload: 5MB. Reduza o tamanho dos arquivos e tente novamente.");
    }
  };

  return (
    <form action={action} className="profile-form" onSubmit={handleSubmit}>
      <div className="profile-form-grid">
        <label className="profile-field">
          <span>Apelido</span>
          <input
            type="text"
            name="apelido"
            defaultValue={profile?.apelido ?? ""}
            placeholder="Seu nome no perfil"
          />
        </label>

        <label className="profile-field">
          <span>Visibilidade</span>
          <select name="privacidade" defaultValue={profile?.privacidade ?? "PUBLICA"}>
            <option value="PUBLICA">Publico</option>
            <option value="PRIVADA">Privado</option>
          </select>
        </label>

        <label className="profile-field profile-field-full">
          <span>Bio</span>
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder="Fale sobre voce, eventos favoritos e conquistas."
          />
        </label>
      </div>

      <div className="profile-toggle">
        <label>
          <input
            type="checkbox"
            name="estatisticas_publicas"
            defaultChecked={profile?.estatisticas_publicas !== 0}
          />
          Exibir estatisticas publicas
        </label>
      </div>

      <div className="profile-upload-grid">
        <div className="profile-upload">
          <span>Banner</span>
          {assets?.banner_url && (
            <div className="profile-upload-preview">
              <img src={assets.banner_url} alt="Banner atual" />
              <label className="profile-remove">
                <input type="checkbox" name="remove_banner" /> Remover
              </label>
            </div>
          )}
          <input type="file" name="banner" accept="image/*" />
        </div>

        <div className="profile-upload">
          <span>Avatar animado</span>
          {assets?.avatar_url && (
            <div className="profile-upload-preview">
              <img src={assets.avatar_url} alt="Avatar atual" />
              <label className="profile-remove">
                <input type="checkbox" name="remove_avatar" /> Remover
              </label>
            </div>
          )}
          <input type="file" name="avatar" accept="image/*" />
        </div>

        <div className="profile-upload">
          <span>Moldura</span>
          {assets?.ring_url && (
            <div className="profile-upload-preview">
              <img src={assets.ring_url} alt="Moldura atual" />
              <label className="profile-remove">
                <input type="checkbox" name="remove_ring" /> Remover
              </label>
            </div>
          )}
          <input type="file" name="ring" accept="image/*" />
        </div>
      </div>

      <p className="muted">Limite total de upload: 5MB.</p>
      {error ? <p className="form-error">{error}</p> : null}

      <div className="profile-socials-editor">
        <div className="profile-socials-header">
          <div>
            <span className="card-eyebrow">Redes</span>
            <h3 className="card-title">Links publicos</h3>
            <p className="muted">Escolha quais links ficam visiveis.</p>
          </div>
        </div>

        <input type="hidden" name="social_count" value={socialList.length} />
        <div className="profile-socials-grid">
          {socialList.map((social, index) => (
            <div key={`${social.id}-${index}`} className="profile-social-row">
              <input
                type="text"
                name={`social_label_${index}`}
                placeholder="Rede (ex: Twitter)"
                defaultValue={social.label}
              />
              <input
                type="url"
                name={`social_url_${index}`}
                placeholder="https://"
                defaultValue={social.url}
              />
              <label className="profile-social-public">
                <input
                  type="checkbox"
                  name={`social_public_${index}`}
                  defaultChecked={social.is_public !== 0}
                />
                Publico
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-actions">
        <button type="submit" className="btn primary">
          Salvar perfil
        </button>
      </div>
    </form>
  );
}
