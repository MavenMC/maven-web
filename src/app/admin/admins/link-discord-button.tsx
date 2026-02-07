"use client";

import { signIn } from "next-auth/react";

type LinkDiscordButtonProps = {
  linkToken: string;
};

export default function LinkDiscordButton({ linkToken }: LinkDiscordButtonProps) {
  const handleLink = () => {
    const callbackUrl = `/admin-link?token=${encodeURIComponent(linkToken)}`;
    void signIn("discord", { callbackUrl });
  };

  return (
    <button type="button" className="btn primary" onClick={handleLink}>
      Vincular Discord
    </button>
  );
}
