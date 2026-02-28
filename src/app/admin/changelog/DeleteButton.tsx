"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

type DeleteButtonProps = {
  id: number;
  legacy?: {
    createdTs: number | null;
    memberName: string;
    action: string;
    sortOrder: number;
    happenedAt: string;
  };
};

export default function DeleteButton({ id, legacy }: DeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const shouldDelete = confirm("Tem certeza que deseja remover esta movimentação?");
    if (!shouldDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/admin/changelog/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          legacy,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Falha ao excluir movimentação.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao excluir.";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      className="btn ghost"
      type="button"
      style={{
        padding: "0.5rem 0.75rem",
        fontSize: "0.875rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
      onClick={handleDelete}
      title="Excluir movimentação"
      disabled={isDeleting || isPending}
    >
      <Trash2 size={16} />
      {isDeleting || isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
