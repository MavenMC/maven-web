"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { Star, Gamepad2, Gem, MessageCircle } from "lucide-react";

export default function LoginPage() {
  const authCenterUrl = process.env.NEXT_PUBLIC_AUTH_CENTER_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isAuthCenter = process.env.NEXT_PUBLIC_IS_AUTH_CENTER === "true";

  const handleLogin = () => {
    if (!isAuthCenter && authCenterUrl && appUrl) {
      const callbackUrl = `${appUrl}/sso/callback`;
      const targetUrl = new URL("/sso/start", authCenterUrl);
      targetUrl.searchParams.set("redirect", callbackUrl);
      targetUrl.searchParams.set("next", "/");
      window.location.href = targetUrl.toString();
      return;
    }

    void signIn("discord", { callbackUrl: "/" });
  };

  return (
    <div className="login-page-container">
      <div className="login-hero">
        <div className="login-header">
          <Image
            src="/login/login.png"
            alt="Bem-vindo ao Maven Network"
            width={600}
            height={150}
            className="login-title-image"
            quality={100}
            priority
          />
          <p className="login-subtitle">
            Entre com sua conta do Discord para acessar conteúdo exclusivo, 
            participar da comunidade e muito mais!
          </p>
        </div>

        <div className="login-content">
          {/* Decorative Mobs */}
          <div className="login-mobs">
            <Image 
              className="login-mob-bat" 
              src="/login/bat.png"
              alt=""
              width={242}
              height={182}
              quality={100}
              priority
              unoptimized
              role="presentation"
            />
            <Image 
              className="login-mob-enderman" 
              src="/login/enderman.png"
              alt=""
              width={405}
              height={760}
              quality={100}
              priority
              unoptimized
              role="presentation"
            />
            <Image 
              className="login-mob-creeper" 
              src="/login/creeper.png"
              alt=""
              width={405}
              height={480}
              quality={100}
              priority
              unoptimized
              role="presentation"
            />
          </div>

          {/* Login Card */}
          <div className="login-card-wrapper">
            <div className="login-card">
              <div className="login-card-icon">
                <div className="discord-icon-bg">
                  <Image 
                    src="/socials/discord.webp"
                    alt="Discord"
                    width={40}
                    height={40}
                  />
                </div>
              </div>
              
              <h2 className="login-card-title">Entrar no Maven Network</h2>
              
              <p className="login-card-description">
                Use sua conta do Discord para acessar recursos exclusivos, 
                participar do fórum e conectar-se com a comunidade.
              </p>

              <button 
                type="button" 
                className="login-button"
                onClick={handleLogin}
              >
                <span>Entrar com Discord</span>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-button-arrow">
                  <path d="M0 0H0V2H2V2H2V4H4V4H4V6H6V6H6V8H8V8H8V6H10V6H10V4H12V4H12V2H14V2H14V0H12V0H12V2H10V2H10V4H8V4H8V6H6V6H6V4H4V4H4V2H2V2H2V0H0Z" fill="currentColor"/>
                </svg>
              </button>

              <div className="login-features">
                <div className="login-feature">
                  <div className="login-feature-icon">
                    <Star size={20} strokeWidth={2} />
                  </div>
                  <span>Acesso ao Fórum</span>
                </div>
                <div className="login-feature">
                  <div className="login-feature-icon">
                    <Gamepad2 size={20} strokeWidth={2} />
                  </div>
                  <span>Validação de Conta</span>
                </div>
                <div className="login-feature">
                  <div className="login-feature-icon">
                    <Gem size={20} strokeWidth={2} />
                  </div>
                  <span>Conteúdo Exclusivo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
