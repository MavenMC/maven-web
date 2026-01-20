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
          src="/bg.jpg"
          alt="Background Maven"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* LOGO */}
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
    </section>
  );
}
