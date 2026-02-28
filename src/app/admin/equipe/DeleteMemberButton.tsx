"use client";

type DeleteMemberButtonProps = {
  memberId: number;
  memberName: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteMemberButton({ memberId, memberName, deleteAction }: DeleteMemberButtonProps) {
  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja remover ${memberName} da equipe?`)) {
      const formData = new FormData();
      formData.append("id", String(memberId));
      await deleteAction(formData);
    }
  };

  return (
    <button
      className="btn ghost"
      type="button"
      style={{ color: "#ef4444", borderColor: "#ef4444" }}
      onClick={handleDelete}
    >
      🗑️
    </button>
  );
}
