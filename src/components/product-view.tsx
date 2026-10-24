"use client";

import { Heart, RotateCcw, Ruler, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductImage } from "@/components/product-card";
import { DeliveryPromise, ProductReviews, SizeGuide } from "@/components/store-features";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { money } from "@/lib/utils";

export function ProductView({ id }: { id: string }) {
  const { products, wishlist, toggleWish, addToCart, rememberProduct } = useStore();
  const router = useRouter();
  const product = products.find((item) => item.id === id);
  const [size, setSize] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => { rememberProduct(id); }, [id, rememberProduct]);

  if (!product || !product.isVisible) {
    return <div className="gg-container gg-section"><div className="gg-empty">This piece is no longer in the collection.</div><Button onClick={() => router.push("/shop")}>Back to shop</Button></div>;
  }

  const options = [{ colorway: product.colorway, swatch: product.swatch, imageUrl: product.imageUrl }, ...(product.variants || [])];
  const active = options[variantIndex] || options[0];

  return (
    <div className="gg-container gg-section">
      <button className="gg-nav-link" style={{ marginBottom: 20 }} onClick={() => router.push("/shop")}>← Back to shop</button>
      <div className="gg-pd-grid">
        <ProductImage product={product} large imageUrl={active.imageUrl} swatch={active.swatch} />
        <div>
          <div className="gg-card-cat">{product.category} · {active.colorway}</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 700, color: "var(--plum)", margin: "6px 0 10px" }}>{product.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Star size={15} fill="#e8b04b" color="#e8b04b" /><span style={{ fontWeight: 600 }}>{product.rating}</span><span style={{ color: "var(--text2)", fontSize: 13 }}>({product.reviews} reviews)</span></div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}><span style={{ fontSize: 24, fontWeight: 700, color: "var(--pink-deep)" }}>{money(product.price)}</span>{product.compareAt ? <span className="gg-price-compare" style={{ fontSize: 16 }}>{money(product.compareAt)}</span> : null}</div>
          <p style={{ fontSize: 14.5, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 }}>{product.description}</p>
          {options.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              <div className="gg-filter-title">Color: {active.colorway}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {options.map((variant, index) => <button key={`${variant.colorway}-${index}`} onClick={() => setVariantIndex(index)} title={variant.colorway} aria-label={variant.colorway} style={{ width: 34, height: 34, borderRadius: "50%", background: variant.swatch, border: variantIndex === index ? "3px solid var(--pink-deep)" : "1.5px solid var(--border)", padding: 0 }} />)}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="gg-filter-title">Select Size</div>
              <button className="gg-nav-link" type="button" onClick={() => setShowSizeGuide(true)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><Ruler size={14} /> Size guide</button>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{product.sizes.map((item) => <button key={item} className={`gg-size-chip ${size === item ? "selected" : ""}`} onClick={() => setSize(item)}>{item}</button>)}</div>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <Button style={{ flex: 1 }} onClick={() => size ? addToCart({ ...product, colorway: active.colorway, imageUrl: active.imageUrl }, size, active.colorway) : window.alert("Please pick a size first")}>Add to Bag</Button>
            <Button variant="icon" style={{ border: "1.5px solid var(--border)", width: 48, height: 48 }} onClick={async () => { const message = await toggleWish(product); if (message) window.alert(message); }} aria-label="Wishlist"><Heart size={19} fill={wishlist.has(product.id) ? "currentColor" : "none"} color="var(--pink-deep)" /></Button>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text2)" }}>
            <DeliveryPromise />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}><RotateCcw size={16} /> Returns are not accepted</div>
          </div>
        </div>
      </div>
      <ProductReviews productId={product.id} />
      {showSizeGuide && <SizeGuide sizes={product.sizes} onClose={() => setShowSizeGuide(false)} />}
    </div>
  );
}
