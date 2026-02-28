"use client";

type DeleteRoleButtonProps = {
  roleId: number;
  roleName: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteRoleButton({ roleId, roleName, deleteAction }: DeleteRoleButtonProps) {
  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja remover o cargo "${roleName}"?`)) {
      const formData = new FormData();
      formData.append("id", String(roleId));
      await deleteAction(formData);
    }
  };

  return (
    <button
      className="btn ghost"
      type="button"
      style={{
        color: "#ef4444",
        borderColor: "#ef4444",
        minWidth: "120px"
      }}
      onClick={handleDelete}
    >
      🗑️ Remover
    </button>
  );
}
