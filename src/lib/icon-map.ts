import {
  type LucideIcon,
  Crown,
  Instagram,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Twitch,
  Users,
  Flame,
  Youtube,
  ChessQueen,
  ShieldBan
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone,
  avisos: Megaphone,
  announcement: Megaphone,
  lifebuoy: LifeBuoy,
  "life-buoy": LifeBuoy,
  suporte: LifeBuoy,
  support: LifeBuoy,
  sparkles: Sparkles,
  sugestoes: Sparkles,
  ideas: Sparkles,
  users: Users,
  clans: Users,
  shieldcheck: ShieldCheck,
  "shield-check": ShieldCheck,
  denuncias: ShieldCheck,
  reports: ShieldCheck,
  messagesquare: MessageSquare,
  "message-square": MessageSquare,
  chat: MessageSquare,
  discord: MessageSquare,
  instagram: Instagram,
  youtube: Youtube,
  twitch: Twitch,
  crown: Crown,
  "bright-crown": Crown,
  "chess-queen": ChessQueen,
  "shield-ban": ShieldBan,
  flame: Flame,
};

export const ICON_OPTIONS = [
  { value: "bright-crown", label: "Coroa" },
  { value: "user-crown", label: "Admin" },
  { value: "users", label: "Usuarios" },
  { value: "shield-check", label: "Moderacao" },
  { value: "sparkles", label: "Criativo" },
  { value: "message-square", label: "Comunicacao" },
  { value: "megaphone", label: "Anuncios" },
  { value: "life-buoy", label: "Suporte" },
  { value: "instagram", label: "Social" },
  { value: "youtube", label: "Video" },
  { value: "twitch", label: "Streaming" },
];

export function resolveIcon(name: string | null | undefined, fallback: LucideIcon) {
  if (!name) return fallback;
  const key = name.trim().toLowerCase();
  return ICONS[key] ?? fallback;
}
