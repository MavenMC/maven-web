import Link from "next/link";
import { ShoppingCart, Gamepad2 } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-[#16090B]">
      <div
        className="
          h-full max-w-7xl mx-auto
          flex items-center justify-between
          px-4 sm:px-20
        "
      >
        {/* LOGO */}
        <Link
          href="/"
          className="font-extrabold text-white tracking-tight
                     text-xl sm:text-4xl"
        >
          MAVEN
        </Link>

        {/* LINKS */}
        <div className="flex items-center gap-4 sm:gap-10 text-white font-bold">
          <Link
            href="/validar"
            className="flex items-center gap-2 text-sm sm:text-2xl hover:opacity-80 transition"
          >
            <Gamepad2 size={20} className="sm:w-[25px] sm:h-[25px]" />
            Jogar
          </Link>

          <Link
            href="/loja"
            className="flex items-center gap-2 text-sm sm:text-2xl hover:opacity-80 transition"
          >
            <ShoppingCart size={20} className="sm:w-[25px] sm:h-[25px]" />
            Loja
          </Link>
        </div>
      </div>
    </nav>
  );
}
