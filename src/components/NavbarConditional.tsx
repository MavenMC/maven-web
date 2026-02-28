"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarConditional() {
  const pathname = usePathname();

  // On the homepage the navbar is embedded inside the showcase (between banner and slider)
  if (pathname === "/") return null;

  return <Navbar />;
}
