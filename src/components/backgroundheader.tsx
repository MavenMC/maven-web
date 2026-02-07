import Link from "next/link";
import Image from "next/image";

export default function BackgroundHeader() {
  return (
    <section
      className="
        relative w-full
        min-h-[160px] sm:min-h-[220px]
        rounded-xl
        flex items-center justify-center
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
          className="object-cover opacity-70"
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
    </section>
  );
}
