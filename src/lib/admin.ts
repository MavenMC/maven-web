import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getAdminSession() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.adminId) return null;
    return session;
  } catch (error) {
    console.error("Erro ao obter sessão de admin:", error);
    return null;
  }
}

export async function requireAdmin() {
  let session;
  
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Erro crítico ao obter sessão:", error);
    redirect("/");
  }
  
  if (!session?.user?.adminId) {
    redirect("/");
  }
  
  return session;
}
