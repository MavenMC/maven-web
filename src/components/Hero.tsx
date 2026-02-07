import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="
        relative w-full rounded-xl
        p-6 sm:p-10
        flex flex-col sm:flex-row
        items-center justify-between
        gap-6 sm:gap-0
        overflow-hidden
        border border-red-500/20
      "
    >
      {/* FUNDO */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/bg.png"
          alt="Background Maven"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* LOGO (clicável + hover) */}
      <Link
        href="/"
        className="
          order-1 sm:order-2
          transition-transform duration-300
          hover:scale-120
          cursor-pointer
        "
      >
        <Image
          src="/logo.png"
          alt="Logo Maven"
          width={360}
          height={360}
          priority
          className="
            w-[10px] h-[10px]
            sm:w-[250px] sm:h-[250px]
            drop-shadow-[0_0_30px_rgba(225,29,72,0.7)]
          "
        />
      </Link>

      {/* CONECTAR */}
      <Link
        href="/perfil#vinculo"
        className="
          order-2 sm:order-1
          flex items-center gap-3
          hover:scale-105 transition
        "
      >
        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <p className="font-semibold text-white text-sm sm:text-base">
          CONECTE-SE JÁ!
        </p>
      </Link>

      {/* DISCORD */}
      <Link
        href="https://discord.gg/mvn"
        target="_blank"
        className="
          order-3
          flex items-center gap-3
          hover:scale-105 transition
        "
      >
        <div className="text-right">
          <p className="font-semibold text-white text-sm sm:text-base">
            ENTRAR NO DISCORD
          </p>
          <p className="text-xs sm:text-sm text-gray-300">
            Participe da comunidade
          </p>
        </div>

        <Image
          src="/discord.png"
          alt="Discord"
          width={38}
          height={38}
          className="drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]"
        />
      </Link>
    </section>
  );
}
