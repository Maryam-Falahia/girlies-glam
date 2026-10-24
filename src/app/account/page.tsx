import { Suspense } from "react";
import { AccountView } from "@/components/account-view";

export const instant = false;

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="gg-empty">Loading your glam...</div>}>
      <AccountView />
    </Suspense>
  );
}
