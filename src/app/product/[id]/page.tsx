import { Suspense } from "react";
import { ProductView } from "@/components/product-view";

export const instant = false;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="gg-empty">Loading your glam...</div>}>
      <ProductView id={decodeURIComponent(id)} />
    </Suspense>
  );
}
