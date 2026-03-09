import "server-only";
import { dbQuery } from "@/lib/db";

type StatusRow = {
  status: string;
  players_online: number;
};

export async function getMinecraftStatus(): Promise<{
  playersOnline: number | null;
  online: boolean;
}> {
  try {
    const rows = await dbQuery<StatusRow[]>(
      "SELECT status, players_online FROM store_server_status ORDER BY id DESC LIMIT 1",
    );

    if (!rows.length) return { playersOnline: 0, online: true };

    const row = rows[0];
    return {
      online: row.status === "online",
      playersOnline: row.players_online ?? 0,
    };
  } catch {
    return { playersOnline: null, online: false };
  }
}
