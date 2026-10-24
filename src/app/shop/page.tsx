import { Suspense } from "react";
import { ShopView } from "@/components/shop-view";

export const instant = false;

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="gg-empty">Loading your glam...</div>}>
      <ShopView />
    </Suspense>
  );
}
