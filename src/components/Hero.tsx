import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="
        relative w-full rounded-xl p-10 flex items-center justify-between
        overflow-hidden
        border border-red-500/20
      "
    >
      {/* IMAGEM DE FUNDO */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/bg.jpg"
          alt="Background Maven"
          fill
          className="object-cover opacity-70"
          priority
        />
        {/* overlay escuro */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* STATUS */}
      <Link
        href="/validar"
        target="_blank"
        className="flex items-center gap-3 hover:scale-105 transition"
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="font-semibold text-white">CONECTE-SE JÁ!</p>
          </div>
        </div>
      </Link>



      {/* LOGO */}

<div className="flex flex-col items-center">
  <Image
    src="/logo.png"
    alt="Logo Maven"
    width={160}
    height={160}
    priority
    className="
      w-[100px] h-[100px]
      sm:w-[160px] sm:h-[160px]
      drop-shadow-[0_0_25px_rgba(225,29,72,0.6)]
    "
  />
</div>


      {/* DISCORD */}
      <Link
        href="https://discord.gg/mvn"
        target="_blank"
        className="flex items-center gap-3 hover:scale-105 transition"
      >
        <div className="text-right">
          <p className="font-semibold text-white">
            ENTRAR NO DISCORD
          </p>
          <p className="text-sm sm:text-base
 text-gray-300">
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
