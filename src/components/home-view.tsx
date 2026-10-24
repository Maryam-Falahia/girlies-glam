"use client";

import { RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { categoryBlurb, clothingCategories, jewelryCategories } from "@/lib/constants";
import { useStore } from "@/lib/store";

export function HomeView() {
  const { products, wishlist, toggleWish, recentIds } = useStore();
  const router = useRouter();
  const visible = products.filter((product) => product.isVisible);
  const best = visible.filter((product) => product.isBestseller).slice(0, 4);
  const newer = visible.filter((product) => product.isNew).slice(0, 4);
  const recent = recentIds.map((id) => visible.find((product) => product.id === id)).filter((product) => product != null);
  const open = (id: string) => router.push(`/product/${id}`);
  const wish = async (product: (typeof visible)[number]) => {
    const message = await toggleWish(product);
    if (message) window.alert(message);
  };

  return (
    <div>
      <section className="gg-hero">
        <div>
          <div className="gg-hero-eyebrow"><Sparkles size={13} /> New Season Drop</div>
          <h1 className="gg-hero-title">Dress up your <em>everyday</em> sparkle</h1>
          <p className="gg-hero-copy">Feminine fits, buttery-soft fabrics, and just the right amount of glam — curated for the girlies who like their outfits camera-ready.</p>
          <Button onClick={() => router.push("/shop")}>Shop the Collection</Button>
        </div>
        <div className="gg-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gg-visual-image" src="/girlies-glam-editorial-hero.jpg" alt="Girlies Glam editorial fashion" />
          <Sparkles className="spark" size={28} style={{ top: "14%", left: "18%" }} />
          <Sparkles className="spark" size={40} style={{ top: "55%", left: "65%", animationDelay: "1s" }} />
        </div>
      </section>
      <section className="gg-section gg-container">
        <div className="gg-section-head"><div><div className="gg-section-title">Shop by Category</div><div className="gg-section-sub">Find your next favorite fit</div></div></div>
        <div className="gg-cat-grid">{clothingCategories.map((category) => <button key={category} className="gg-cat-tile" onClick={() => router.push(`/shop?category=${encodeURIComponent(category)}`)}><div className="gg-cat-name">{category}</div><div className="gg-cat-blurb">{categoryBlurb[category]}</div></button>)}</div>
      </section>
      <section className="gg-section gg-container">
        <div className="gg-section-head"><div><div className="gg-section-title">Shop Jewellery</div><div className="gg-section-sub">Finishing touches for every look</div></div></div>
        <div className="gg-cat-grid">{jewelryCategories.map((category) => <button key={category} className="gg-cat-tile" onClick={() => router.push(`/shop?category=${encodeURIComponent(category)}`)}><div className="gg-cat-name">{category}</div><div className="gg-cat-blurb">{categoryBlurb[category]}</div></button>)}</div>
      </section>
      {[["Bestsellers", "Loved by the Girlies Glam community", best], ["New Arrivals", "Fresh off the rack this week", newer]].map(([title, sub, list]) => (
        <section key={String(title)} className="gg-section gg-container">
          <div className="gg-section-head">
            <div><div className="gg-section-title">{title as string}</div><div className="gg-section-sub">{sub as string}</div></div>
            <button className="gg-nav-link" onClick={() => router.push("/shop")}>View all →</button>
          </div>
          <div className="gg-grid">{(list as typeof visible).map((product) => <ProductCard key={product.id} product={product} wished={wishlist.has(product.id)} onOpen={() => open(product.id)} onWish={() => wish(product)} />)}</div>
        </section>
      ))}
      <section className="gg-section gg-container" style={{ paddingTop: 0 }}>
        <div className="gg-perks">
          {[[<Truck size={20} key="truck" />, "Shipping", "Shipping on orders OMR 2.000"], [<RotateCcw size={20} key="returns" />, "Returns", "Returns is NOT acceptable"], [<ShieldCheck size={20} key="secure" />, "Secure Checkout", "Your payments, protected"]].map(([icon, title, body]) => (
            <div key={String(title)} className="gg-panel" style={{ padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ color: "var(--pink)" }}>{icon}</div>
              <div><div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--plum)" }}>{title}</div><div style={{ fontSize: 12, color: "var(--text2)" }}>{body}</div></div>
            </div>
          ))}
        </div>
      </section>
      {recent.length > 0 && (
        <section className="gg-section gg-container">
          <div className="gg-section-head"><div><div className="gg-section-title">Recently viewed</div><div className="gg-section-sub">Pick up where you left off</div></div></div>
          <div className="gg-grid">{recent.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.has(product.id)} onOpen={() => open(product.id)} onWish={() => wish(product)} />)}</div>
        </section>
      )}
    </div>
  );
}
