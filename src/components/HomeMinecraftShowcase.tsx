"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

type Props = {
  membersOnline: string;
};

type Slide = {
  image: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

const slides: Slide[] = [
  {
    image: "/background/Captura_de_Tela_353.png",
    title: "BEM-VINDO À NOVA TEMPORADA",
    subtitle: "Progressão, eventos e economia viva para jogar com sua equipe.",
    ctaLabel: "Começar agora",
    ctaHref: "/perfil#vinculo",
  },
  {
    image: "/bg.jpg",
    title: "EVENTOS DIÁRIOS E RECOMPENSAS",
    subtitle: "Participe de desafios e suba no ranking da comunidade.",
    ctaLabel: "Ver rankings",
    ctaHref: "/rankings",
  },
  {
    image: "/bg.png",
    title: "STAFF ATIVO E SUPORTE RÁPIDO",
    subtitle: "Precisa de ajuda? Nossa equipe responde no Discord e no fórum.",
    ctaLabel: "Abrir fórum",
    ctaHref: "/forum",
  },
];

export default function HomeMinecraftShowcase({ membersOnline }: Props) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="inicio" className="mc-showcase">

      {/* ── BANNER TOPO ─────────────────────────────── */}
      <div className="mc-top-banner">
        <div className="mc-top-banner-content">
          <div className="mc-brand">
            <Image
              src="/logos/mavennetwork.png"
              alt="Maven"
              width={340}
              height={94}
              className="mc-brand-logo"
              priority
            />
          </div>
          <div className="mc-status-strip">
            <span className="mc-status-ip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
              MAVENMC.COM.BR
            </span>
            <span className="mc-status-online">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              {membersOnline} JOGADORES
            </span>
            <a
              href="https://discord.gg/mvn"
              target="_blank"
              rel="noopener noreferrer"
              className="mc-status-discord"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.03.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              DISCORD
            </a>
          </div>
        </div>
      </div>

      {/* ── NAVBAR (posicionada entre o banner e o slider) ── */}
      <Navbar hideLogo />

      {/* ── SLIDER ──────────────────────────────────── */}
      <div className="mc-slider">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <article
              key={slide.title}
              className={`mc-slide${isActive ? " active" : ""}`}
              aria-hidden={!isActive}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="mc-slide-bg"
                priority={index === 0}
              />
              <div className="mc-slide-overlay" />
              <div className="mc-slide-content">
                <h1 className="mc-slide-title">{slide.title}</h1>
                <p className="mc-slide-subtitle">{slide.subtitle}</p>
                <Link href={slide.ctaHref} className="mc-slide-cta">
                  {slide.ctaLabel}
                </Link>
              </div>
            </article>
          );
        })}

        <div className="mc-slider-dots" role="tablist" aria-label="Trocar slide">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={index === activeSlide ? "active" : ""}
              onClick={() => setActiveSlide(index)}
              aria-label={`Slide ${index + 1}`}
              aria-selected={index === activeSlide}
              role="tab"
            />
          ))}
        </div>
      </div>

    </section>
  );
}
