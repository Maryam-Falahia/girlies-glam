"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { categoryEmoji, clothingCategories, jewelryCategories } from "@/lib/constants";
import { useStore } from "@/lib/store";

export function ShopView() {
  const params = useSearchParams();
  const initial = params.get("category") || "All";
  return <ShopCatalog key={initial} initial={initial} />;
}

function ShopCatalog({ initial }: { initial: string }) {
  const [category, setCategory] = useState(initial);
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const { products, wishlist, toggleWish } = useStore();
  const router = useRouter();

  const list = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let next = products.filter((product) => product.isVisible && (category === "All" || product.category === category));
    if (normalized) next = next.filter((product) => [product.name, product.category, product.colorway, product.description].some((value) => value.toLowerCase().includes(normalized)));
    if (sort === "price_asc") next = [...next].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") next = [...next].sort((a, b) => b.price - a.price);
    if (sort === "rating") next = [...next].sort((a, b) => b.rating - a.rating);
    return next;
  }, [products, category, sort, query]);

  const wish = async (product: (typeof products)[number]) => {
    const message = await toggleWish(product);
    if (message) window.alert(message);
  };

  return (
    <div className="gg-container gg-section gg-shop-layout">
      <aside className="gg-shop-aside">
        <div className="gg-filter-title">Category</div>
        <button className={`gg-filter-item ${category === "All" ? "active" : ""}`} onClick={() => setCategory("All")}>All Items</button>
        {clothingCategories.map((item) => <button key={item} className={`gg-filter-item ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}
        <div className="gg-filter-title" style={{ marginTop: 22 }}>Jewellery</div>
        {jewelryCategories.map((item) => <button key={item} className={`gg-filter-item ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{categoryEmoji[item]} {item}</button>)}
      </aside>
      <div>
        <div className="gg-section-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="gg-section-title" style={{ fontSize: 24 }}>{category === "All" ? "Shop All" : category}</div>
            <div className="gg-section-sub">{list.length} {list.length === 1 ? "item" : "items"}{query.trim() ? ` matching “${query.trim()}”` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 420px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <label className="gg-search-shell" aria-label="Search products">
              <Search size={17} aria-hidden="true" />
              <input className="gg-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories, or colors" aria-label="Search products, categories, or colors" />
              {query && <button type="button" className="gg-search-clear" onClick={() => setQuery("")} aria-label="Clear product search"><X size={16} /></button>}
            </label>
            <Select className="gg-sort-select" ariaLabel="Sort products" value={sort} onValueChange={setSort} options={[
              { value: "featured", label: "Sort: Featured" },
              { value: "price_asc", label: "Price: Low to High" },
              { value: "price_desc", label: "Price: High to Low" },
              { value: "rating", label: "Top Rated" },
            ]} />
          </div>
        </div>
        {list.length > 0 ? (
          <div className="gg-grid">{list.map((product) => <ProductCard key={product.id} product={product} wished={wishlist.has(product.id)} onOpen={() => router.push(`/product/${product.id}`)} onWish={() => wish(product)} />)}</div>
        ) : (
          <div className="gg-empty">
            <div>No products found{query.trim() ? ` for “${query.trim()}”` : ""}.</div>
            {query.trim() && <Button variant="outline" style={{ marginTop: 16 }} onClick={() => setQuery("")}>Clear search</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
