"use client";

import { Heart, Star } from "lucide-react";
import { categoryEmoji } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { money } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function ProductImage({ product, large = false, imageUrl, swatch }: { product: Product; large?: boolean; imageUrl?: string | null; swatch?: string }) {
  const src = imageUrl !== undefined ? imageUrl : product.imageUrl;
  const background = swatch || product.swatch;
  if (src) {
    return (
      <div className={large ? "gg-pd-image" : "gg-card-img"} style={{ overflow: "hidden", padding: 0 }}>
        {/* Product photos include uploaded data URLs, which next/image does not serve. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div className={large ? "gg-pd-image" : "gg-card-img"} style={{ background: `linear-gradient(155deg, ${background} 0%, #fff 130%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: large ? 140 : 72 }}>{categoryEmoji[product.category] || "✦"}</span>
    </div>
  );
}

export function ProductCard({ product, wished, onOpen, onWish }: { product: Product; wished: boolean; onOpen: () => void; onWish: () => void }) {
  const tag = product.isNew ? "New" : product.isBestseller ? "Bestseller" : product.compareAt ? "Sale" : "";
  const tagClass = product.isNew ? "gg-tag-new" : product.isBestseller ? "gg-tag-best" : "gg-tag-sale";
  return (
    <Card className="gg-card fade-in" onClick={onOpen} style={{ padding: 0, cursor: "pointer" }}>
      <ProductImage product={product} />
      {tag && <span className={`gg-card-tag ${tagClass}`}>{tag}</span>}
      <button className="gg-wish-btn" onClick={(event) => { event.stopPropagation(); onWish(); }} aria-label="Wishlist">
        <Heart size={15} fill={wished ? "currentColor" : "none"} />
      </button>
      <div className="gg-card-body">
        <div className="gg-card-cat">{product.category} · {product.colorway}</div>
        <div className="gg-card-name">{product.name}</div>
        <div className="gg-card-price-row">
          <span className="gg-price">{money(product.price)}</span>
          {product.compareAt ? <span className="gg-price-compare">{money(product.compareAt)}</span> : null}
        </div>
        <div className="gg-rating"><Star size={11} style={{ display: "inline", marginBottom: 2, color: "#e8b04b" }} fill="#e8b04b" /> {product.rating} ({product.reviews})</div>
      </div>
    </Card>
  );
}
