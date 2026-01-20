import Link from "next/link";
import { ShoppingCart, Gamepad2 } from "lucide-react";

export default function Navbar() {
  return (
    <nav
      className="
        w-full h-16
        flex items-center
        px-20
        bg-[#16090B]
      "
    >
      {/* CONTAINER INTERNO */}
      <div className="flex items-center gap-15">
        
        {/* LOGO */}
        <Link
          href="/"
          className="text-4xl font-extrabold text-white tracking-tight"
        >
          MAVEN
        </Link>

        {/* LINKS */}
        <div className="flex items-center gap-10 text-white text-sm sm:text-base
 font-bold">
          
          <Link
            href="/validar"
            className="text-2xl flex items-center gap-2 hover:opacity-80 transition"
          >
            <Gamepad2 size={25} />
            Jogar
          </Link>

          <Link
            href="/loja"
            className="text-2xl flex items-center gap-2 hover:opacity-80 transition"
          >
            <ShoppingCart size={25} />
            Loja
          </Link>

        </div>
      </div>
    </nav>
  );
}
