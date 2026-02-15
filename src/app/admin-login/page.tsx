import { Suspense } from "react";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
