import { Suspense } from "react";
import { OrderPage } from "@/components/orders";

export const instant = false;

export default async function OrderRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="gg-empty">Loading your glam...</div>}>
      <OrderPage id={decodeURIComponent(id)} />
    </Suspense>
  );
}
