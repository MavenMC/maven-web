import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getSocialLinks } from "@/lib/site-data";
import { resolveIcon } from "@/lib/icon-map";

export default async function Footer() {
  const socialLinks = await getSocialLinks();
  const footerSocials = socialLinks.slice(0, 3);

  return (
    <footer className="footer">
      <div className="container footer-shell">
        <div className="footer-bg" aria-hidden="true" />
        
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/logos/Mavenlogo4.png" alt="MavenMC" className="logo-footer" />
          </div>
          
          <div className="footer-grid">
            <div>
              <h4>Servidor</h4>
              <Link className="footer-link" href="/noticias">
                Notícias
              </Link>
              <Link className="footer-link" href="/changelog">
                Changelog
              </Link>
              <Link className="footer-link" href="/patch-notes">
                Patch Notes
              </Link>
            </div>
            <div>
              <h4>Comunidade</h4>
              <Link className="footer-link" href="/forum">
                Fórum
              </Link>
              <Link className="footer-link" href="/blog">
                Blog
              </Link>
              <Link className="footer-link" href="/trabalhe-conosco">
                Trabalhe Conosco
              </Link>
              <Link className="footer-link" href="/perfil#vinculo">
                Jogar
              </Link>
            </div>
            <div>
              <h4>Suporte</h4>
              <a className="footer-link" href="https://discord.gg/mvn" target="_blank" rel="noreferrer">
                Discord
              </a>
              <Link className="footer-link" href="/equipe">
                Equipe
              </Link>
              <a className="footer-link" href="https://loja.mavenmc.com.br/" target="_blank" rel="noreferrer">
                Loja
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <span className="footer-credit">
              {" "}
              <span className="developer-credit">
                Maven Network 
                <span className="developer-card">
                  <img
                    src="https://mc-heads.net/avatar/Nickz1n/64"
                    alt="Nickz1n"
                    className="developer-avatar"
                  />
                  <span className="developer-info">
                    <span className="developer-badge">CEO</span>
                    <span className="developer-name">Nickz1n</span>
                  </span>
                </span>
              </span> 
                <span> © {new Date().getFullYear()} ― Todos os direitos reservados.</span>
            </span>
            <div className="footer-links">
              <Link href="/termos">Termos de Uso</Link>
              <span>•</span>
              <Link href="/privacidade">Privacidade</Link>
            </div>
          </div>
        </div>
        <div className="footer-disclaimer">
          <p>Maven não é um serviço oficial, afiliado ou associado à Microsoft ou Mojang AB</p>
        </div>
      </div>
    </footer>
  );
}
