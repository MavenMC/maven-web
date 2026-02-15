import { Suspense } from "react";
import SsoCallbackForm from "./SsoCallbackForm";

export const dynamic = "force-dynamic";

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SsoCallbackForm />
    </Suspense>
  );
}
