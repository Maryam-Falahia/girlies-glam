"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderTracker } from "@/components/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categories, discountStatus, JEWELLERY_COLORS, jewelryCategories, ORDER_STATUSES, PRODUCT_SIZE_OPTIONS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Discount, Product, Review, ReviewStatus, StoreSettings } from "@/lib/types";
import { money } from "@/lib/utils";

type Section = "products" | "orders" | "reviews" | "settings" | "analytics" | "discounts";

function localDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminView() {
  const store = useStore();
  const router = useRouter();
  const [section, setSection] = useState<Section>("products");
  if (!store.user?.isAdmin) return <div className="gg-container gg-section"><div className="gg-empty">This dashboard is for the Girlies Glam team.</div></div>;

  return (
    <div className="gg-container gg-section">
      <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: "var(--plum)", marginBottom: 20 }}>Admin Dashboard</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {[["products", "Products"], ["orders", "All Orders"], ["reviews", "Reviews"], ["settings", "Settings"], ["analytics", "Analytics"], ["discounts", "Discounts / Promo Codes"]].map(([id, label]) => (
          <Button key={id} variant={section === id ? "glam" : "outline"} onClick={() => setSection(id as Section)}>{label}</Button>
        ))}
      </div>
      {section === "products" && <ProductList />}
      {section === "orders" && <OrderList onOpen={(id) => router.push(`/orders/${id}`)} />}
      {section === "reviews" && <ReviewList />}
      {section === "settings" && <SettingsPanel />}
      {section === "analytics" && <AnalyticsPanel />}
      {section === "discounts" && <DiscountPanel />}
    </div>
  );
}

function ProductList() {
  const { products, setProductVisibility, deleteProduct } = useStore();
  return (
    <section>
      <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--plum)", marginBottom: 16 }}>Products</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {products.map((product) => (
          <div key={product.id} className="gg-panel" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--plum)" }}>{product.name}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{product.category} · {money(product.price)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge style={{ background: product.isVisible ? "#8bbf9f" : "#aaa", color: "#fff" }}>{product.isVisible ? "Visible" : "Hidden"}</Badge>
              <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px" }} onClick={() => setProductVisibility(product.id, !product.isVisible)}>{product.isVisible ? "Hide" : "Show"}</Button>
              <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px", color: "#b04b6b", borderColor: "#e7a5b8" }} onClick={() => { if (window.confirm(`Delete "${product.name}" permanently? This cannot be undone.`)) void deleteProduct(product.id); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderList({ onOpen }: { onOpen: (id: string) => void }) {
  const { orders, setOrderStatus } = useStore();
  const active = orders.filter((order) => order.status !== "Received");
  const finished = orders.filter((order) => order.status === "Received");
  const card = (order: (typeof orders)[number]) => (
    <div key={order.id} className="gg-panel" style={{ padding: "18px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: "var(--plum)" }}>{order.id}</div>
          <div className="gg-admin-customer-meta" style={{ fontSize: 12, color: "var(--text2)" }}>
            <span>Placed {order.date}</span>
            {order.customerName && <span className="gg-admin-bidi" dir="auto">{order.customerName}</span>}
            {order.customerEmail && <span className="gg-admin-contact" dir="ltr">{order.customerEmail}</span>}
          </div>
        </div>
        <select className="gg-inp" style={{ width: "auto", padding: "6px 12px", margin: 0 }} value={order.status} onChange={(event) => setOrderStatus(order.id, event.target.value)}>
          {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      <OrderTracker status={order.status} />
      <div className="gg-admin-delivery">
        <div className="gg-filter-title">Delivery Details</div>
        <span className="gg-admin-bidi" dir="auto">{order.shippingName}</span>
        {order.governorate && <span className="gg-admin-bidi" dir="auto">{order.governorate}</span>}
        {order.wilayat && <span className="gg-admin-bidi" dir="auto">{order.wilayat}</span>}
        {order.postalCode && <span className="gg-admin-contact" dir="ltr">{order.postalCode}</span>}
        {order.phone && <span className="gg-admin-contact gg-admin-phone" dir="ltr">{order.phone}</span>}
      </div>
      {order.items.map((item, index) => <div key={index} style={{ fontSize: 13, color: "var(--text2)", padding: "4px 0" }}>{item.name} · Size {item.size} · Qty {item.qty} — <span style={{ fontWeight: 600, color: "var(--plum)" }}>{money(item.price)}</span></div>)}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 10, flexWrap: "wrap" }}>
        <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px" }} onClick={() => onOpen(order.id)}>View / Print Bill</Button>
        {order.transferReceipt && <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px" }} onClick={() => window.open(order.transferReceipt || "", "_blank", "noopener,noreferrer")}>View Transfer Receipt</Button>}
        <div style={{ fontWeight: 700, color: "var(--pink-deep)" }}>Total: {money(order.total)}</div>
      </div>
    </div>
  );
  return (
    <section>
      <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--plum)", marginBottom: 16 }}>All Orders</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{active.length ? active.map(card) : <div className="gg-empty">No active orders right now.</div>}</div>
      {finished.length > 0 && <div style={{ marginTop: 36 }}><div className="gg-filter-title" style={{ fontSize: 14, marginBottom: 14 }}>Order Finished</div><div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: 0.85 }}>{finished.map(card)}</div></div>}
    </section>
  );
}

function ReviewList() {
  const { reviews, moderateReview, deleteReview } = useStore();
  return (
    <section>
      <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--plum)", marginBottom: 6 }}>Customer Reviews</h2>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Approve new reviews, hide content that should not appear publicly, or restore and delete existing reviews.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} onStatus={(status) => moderateReview(review.id, status)} onDelete={() => { if (window.confirm(`Delete this review by ${review.customerName} permanently? This cannot be undone.`)) void deleteReview(review.id); }} />) : <div className="gg-empty">No customer reviews yet.</div>}
      </div>
    </section>
  );
}

function ReviewCard({ review, onStatus, onDelete }: { review: Review; onStatus: (status: ReviewStatus) => void; onDelete: () => void }) {
  const color = review.moderationStatus === "visible" ? "#8bbf9f" : review.moderationStatus === "hidden" ? "#a88a9f" : "#d9a04d";
  return (
    <article className="gg-panel" style={{ padding: "18px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: "var(--plum)", fontSize: 15 }}>{review.productName}</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>By <span dir="auto">{review.customerName}</span> · <span dir="ltr">{review.customerEmail}</span> · {new Date(review.createdAt).toLocaleDateString()}</div>
        </div>
        <Badge style={{ background: color, color: "#fff" }}>{review.moderationStatus}</Badge>
      </div>
      <div style={{ display: "flex", gap: 3, color: "#e8b04b", marginBottom: 8 }}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} fill={value <= review.rating ? "currentColor" : "none"} />)}</div>
      {review.title && <div style={{ fontWeight: 700, color: "var(--plum)", marginBottom: 5 }}>{review.title}</div>}
      <p style={{ color: "var(--text2)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{review.body}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Label htmlFor={`review-status-${review.id}`} style={{ margin: 0 }}>Moderation</Label>
        <select id={`review-status-${review.id}`} className="gg-inp" value={review.moderationStatus} onChange={(event) => onStatus(event.target.value as ReviewStatus)} style={{ width: "auto", padding: "7px 12px", margin: 0 }}>
          <option value="pending">Pending</option><option value="visible">Visible</option><option value="hidden">Hidden</option>
        </select>
        <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px" }} onClick={() => onStatus(review.moderationStatus === "hidden" ? "visible" : "hidden")}>{review.moderationStatus === "hidden" ? "Restore" : "Hide"}</Button>
        <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px", color: "#b04b6b", borderColor: "#e7a5b8" }} onClick={onDelete}>Delete</Button>
      </div>
    </article>
  );
}

function SettingsPanel() {
  const { settings, saveSettings, products, saveProduct } = useStore();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [message, setMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="gg-panel" style={{ padding: 24 }}>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>New orders keep these contacts on the store record. Live email and WhatsApp delivery is not connected in this build.</p>
        {message && <div style={{ fontSize: 13, marginBottom: 10, color: message === "Saved!" ? "#3a8a5c" : "#c0392b" }}>{message}</div>}
        <form onSubmit={async (event) => { event.preventDefault(); try { await saveSettings(form); setMessage("Saved!"); } catch (error) { setMessage(error instanceof Error ? error.message : "Failed to save"); } }}>
          <Label>Notification Email</Label>
          <Input type="email" required value={form.notifyEmail} onChange={(event) => setForm({ ...form, notifyEmail: event.target.value })} />
          <Label>WhatsApp Number (with country code)</Label>
          <Input type="tel" required placeholder="+96879162199" value={form.notifyPhone} onChange={(event) => setForm({ ...form, notifyPhone: event.target.value })} />
          <Label>Bank / Phone Transfer Details</Label>
          <Textarea rows={5} value={form.transferDetails} onChange={(event) => setForm({ ...form, transferDetails: event.target.value })} placeholder={"Example:\nBank: ...\nAccount name: ...\nAccount number: ..."} />
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: -4, marginBottom: 8 }}>These details appear highlighted at checkout. Clear this field and save to remove them.</div>
          <Button type="submit" size="wide">Save Changes</Button>
        </form>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 18, paddingTop: 18 }}>
          <div className="gg-filter-title" style={{ marginBottom: 6 }}>Test order alerts</div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, marginBottom: 10 }}>A provider is required before a test can leave the store.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="outline" onClick={() => setTestMessage("Email delivery is not connected yet. The notification address is saved with the store settings.")}>Test Email</Button>
            <Button variant="outline" onClick={() => setTestMessage("WhatsApp delivery is not connected yet. The notification number is saved with the store settings.")}>Test WhatsApp</Button>
          </div>
          {testMessage && <div role="status" style={{ fontSize: 12.5, marginTop: 10, color: "var(--text2)" }}>{testMessage}</div>}
        </div>
      </div>
      <div style={{ marginTop: 24 }}><ProductEditor products={products} onSave={saveProduct} /></div>
    </div>
  );
}

function ProductEditor({ products, onSave }: { products: Product[]; onSave: (input: { id?: string; name: string; category: string; price: number; colors: string[]; sizes: string[]; description: string; imageUrl?: string | null; isNew: boolean; isBestseller: boolean }) => Promise<void> }) {
  const blank = { id: "", name: "", category: categories[0], price: "", colors: "", sizes: ["One Size"] as string[], description: "", imageUrl: "", isNew: false, isBestseller: false };
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const isJewellery = jewelryCategories.includes(form.category);
  const sizeOptions = form.category === "Rings" ? ["6", "7", "8", "9"] : PRODUCT_SIZE_OPTIONS;
  const colors = form.colors.split(",").map((color) => color.trim()).filter(Boolean);

  const choose = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) { setForm(blank); return; }
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      colors: [product.colorway, ...(product.variants || []).map((variant) => variant.colorway)].join(", "),
      sizes: product.sizes,
      description: product.description,
      imageUrl: product.imageUrl || "",
      isNew: product.isNew,
      isBestseller: product.isBestseller,
    });
    setMessage("");
  };

  return (
    <div className="gg-panel" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--plum)", margin: 0 }}>{form.id ? "Edit Product" : "Add Product"}</h2>
          <p style={{ fontSize: 12.5, color: "var(--text2)", margin: "6px 0 0" }}>Upload a product photo, choose its category, price, colors, and sizes.</p>
        </div>
        {form.id && <Button variant="outline" onClick={() => { setForm(blank); setMessage(""); }}>Add New Instead</Button>}
      </div>
      {message && <div style={{ fontSize: 13, margin: "10px 0", color: message.includes("Saved") ? "#3a8a5c" : "#c0392b" }}>{message}</div>}
      <form onSubmit={async (event) => {
        event.preventDefault();
        if (!colors.length || !form.sizes.length) { setMessage("Choose at least one color and one size."); return; }
        setSaving(true);
        try {
          await onSave({ id: form.id || undefined, name: form.name, category: form.category, price: Number(form.price), colors, sizes: form.sizes, description: form.description, imageUrl: form.imageUrl || null, isNew: form.isNew, isBestseller: form.isBestseller });
          setMessage(form.id ? "Product updated." : "Product added.");
          if (!form.id) setForm(blank);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to save product");
        } finally { setSaving(false); }
      }}>
        <Label>Product to edit</Label>
        <select className="gg-inp" value={form.id} onChange={(event) => choose(event.target.value)}>
          <option value="">Create a new product</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <Label>Product name</Label>
        <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Makhwar Scarf — Jewel Tones" />
        <Label>Category</Label>
        <select className="gg-inp" value={form.category} onChange={(event) => {
          const category = event.target.value;
          setForm({ ...form, category, sizes: category === "Rings" ? ["6"] : ["One Size"], colors: jewelryCategories.includes(category) ? "Silver, Gold, Golden Rose" : form.colors });
        }}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
        <Label>Price (OMR)</Label>
        <Input required type="number" min="0" step="0.001" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <Label>Colors</Label>
        {isJewellery ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{JEWELLERY_COLORS.map((color) => <Button key={color} type="button" variant={colors.includes(color) ? "glam" : "outline"} style={{ padding: "8px 12px" }} onClick={() => setForm({ ...form, colors: (colors.includes(color) ? colors.filter((item) => item !== color) : [...colors, color]).join(", ") })}>{color}</Button>)}</div> : <Input value={form.colors} onChange={(event) => setForm({ ...form, colors: event.target.value })} placeholder="Orange, Green, Lilac" />}
        <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: -4, marginBottom: 12 }}>{isJewellery ? "Jewellery colors are limited to Silver, Gold, and Golden Rose." : "Separate multiple colors with commas. Customers can choose from these on the product page."}</div>
        <Label>Sizes</Label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{sizeOptions.map((size) => <Button key={size} type="button" variant={form.sizes.includes(size) ? "glam" : "outline"} style={{ padding: "8px 12px" }} onClick={() => setForm({ ...form, sizes: form.sizes.includes(size) ? form.sizes.filter((item) => item !== size) : [...form.sizes, size] })}>{size}</Button>)}</div>
        <Label>Product photo</Label>
        <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) { setMessage("Upload a JPG, PNG, or WEBP image smaller than 4 MB."); return; }
          const reader = new FileReader();
          reader.onload = () => setForm((current) => ({ ...current, imageUrl: String(reader.result || "") }));
          reader.readAsDataURL(file);
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {form.imageUrl ? <img src={form.imageUrl} alt="Product preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 12 }} /> : null}
        <Label>Description</Label>
        <Textarea required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the fabric, finish, and fit." />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "8px 0 14px" }}>
          <label style={{ fontSize: 13, color: "var(--text2)" }}><input type="checkbox" checked={form.isNew} onChange={(event) => setForm({ ...form, isNew: event.target.checked })} /> New arrival</label>
          <label style={{ fontSize: 13, color: "var(--text2)" }}><input type="checkbox" checked={form.isBestseller} onChange={(event) => setForm({ ...form, isBestseller: event.target.checked })} /> Bestseller</label>
        </div>
        <Button type="submit" size="wide" disabled={saving}>{saving ? "Saving..." : form.id ? "Save Product Changes" : "Add Product"}</Button>
      </form>
    </div>
  );
}

function AnalyticsPanel() {
  const { orders, products } = useStore();
  const gross = orders.reduce((sum, order) => sum + order.total, 0);
  const byStatus = ORDER_STATUSES.map((status) => [status, orders.filter((order) => order.status === status).length] as const).filter(([, count]) => count > 0);
  const totals = new Map<string, { name: string; quantity: number; revenue: number }>();
  orders.forEach((order) => order.items.forEach((item) => {
    const current = totals.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
    current.quantity += item.qty;
    current.revenue += item.price * item.qty;
    totals.set(item.name, current);
  }));
  const top = [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="gg-stat-grid">
        {[["Orders", orders.length], ["Gross sales", money(gross)], ["Visible products", products.filter((product) => product.isVisible).length], ["Catalog products", products.length]].map(([label, value]) => (
          <div key={String(label)} className="gg-panel" style={{ padding: 18 }}><div style={{ fontSize: 12, color: "var(--text2)" }}>{label}</div><div style={{ fontSize: 24, fontWeight: 700, color: "var(--plum)", marginTop: 5 }}>{value}</div></div>
        ))}
      </div>
      <div className="gg-split">
        <div className="gg-panel" style={{ padding: 20 }}><div className="gg-filter-title" style={{ marginBottom: 14 }}>Orders by status</div>{byStatus.length ? byStatus.map(([status, count]) => <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}><span>{status}</span><b>{count}</b></div>) : <div style={{ color: "var(--text2)", fontSize: 13 }}>No orders yet.</div>}</div>
        <div className="gg-panel" style={{ padding: 20 }}><div className="gg-filter-title" style={{ marginBottom: 14 }}>Top products</div>{top.length ? top.map((item) => <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}><span>{item.name}</span><b>{item.quantity} sold · {money(item.revenue)}</b></div>) : <div style={{ color: "var(--text2)", fontSize: 13 }}>Sales data will appear after the first order.</div>}</div>
      </div>
    </div>
  );
}

function DiscountPanel() {
  const { discounts, saveDiscount, toggleDiscount } = useStore();
  const empty = { id: "", code: "", percentage: "10", categories: [] as string[], startsAt: "2026-10-24T09:00", endsAt: "2026-11-24T09:00", isEnabled: true };
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const presets = [5, 15, 20, 25, 30, 50];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="gg-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--plum)", margin: 0 }}>{form.id ? "Edit promo code" : "Create a promo code"}</h2>
            <p style={{ fontSize: 12.5, color: "var(--text2)", margin: "6px 0 0" }}>Set a clear saving window for selected product categories.</p>
          </div>
          {form.id && <Button variant="outline" onClick={() => { setForm(empty); setMessage(""); setError(""); }}>Create new code</Button>}
        </div>
        {message && <div role="status" style={{ background: "#eef8f1", border: "1px solid #b9ddc4", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#31754b", marginBottom: 14 }}>{message}</div>}
        {error && <div role="alert" className="gg-error-msg">{error}</div>}
        <form onSubmit={async (event) => {
          event.preventDefault();
          setMessage("");
          setError("");
          const percentage = Number(form.percentage);
          if (!/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(form.code.trim())) { setError("Use 1–40 letters, numbers, hyphens, or underscores for the code."); return; }
          if (!Number.isInteger(percentage) || percentage < 1 || percentage > 100) { setError("Enter a whole-number percentage from 1 to 100."); return; }
          if (!form.categories.length) { setError("Choose at least one product category."); return; }
          const start = new Date(form.startsAt).getTime();
          const end = new Date(form.endsAt).getTime();
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) { setError("Choose an end date and time after the start date and time."); return; }
          const discount: Discount = { id: form.id || `disc-${Date.now()}`, code: form.code.trim().toUpperCase(), percentage, categories: form.categories, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), isEnabled: form.isEnabled };
          try {
            await saveDiscount(discount);
            setMessage(form.id ? "Promo code updated." : "Promo code created.");
            if (!form.id) setForm(empty);
          } catch (err) { setError(err instanceof Error ? err.message : "Unable to save promo code."); }
        }}>
          <Label htmlFor="discount-code">Code</Label>
          <Input id="discount-code" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="EID15" />
          <Label>Percentage</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>{presets.map((value) => <Button key={value} type="button" variant={Number(form.percentage) === value ? "glam" : "outline"} style={{ padding: "8px 13px" }} onClick={() => setForm({ ...form, percentage: String(value) })}>{value}%</Button>)}</div>
          <Input type="number" min="1" max="100" step="1" value={form.percentage} onChange={(event) => setForm({ ...form, percentage: event.target.value })} />
          <Label>Categories</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{categories.map((category) => <Button key={category} type="button" variant={form.categories.includes(category) ? "glam" : "outline"} style={{ padding: "8px 12px" }} onClick={() => setForm({ ...form, categories: form.categories.includes(category) ? form.categories.filter((item) => item !== category) : [...form.categories, category] })}>{category}</Button>)}</div>
          <Label htmlFor="discount-start">Starts</Label>
          <Input id="discount-start" type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
          <Label htmlFor="discount-end">Ends</Label>
          <Input id="discount-end" type="datetime-local" required value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--text2)", marginBottom: 14 }}><input type="checkbox" checked={form.isEnabled} onChange={(event) => setForm({ ...form, isEnabled: event.target.checked })} /> Enabled</label>
          <Button type="submit" size="wide">{form.id ? "Save promo code" : "Create promo code"}</Button>
        </form>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {discounts.map((discount) => (
          <div key={discount.id} className="gg-panel" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--plum)" }}>{discount.code} · {discount.percentage}%</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{discount.categories.join(", ")}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{new Date(discount.startsAt).toLocaleString()} — {new Date(discount.endsAt).toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge style={{ background: discountStatus(discount) === "Active" ? "#8bbf9f" : "#d9a04d", color: "#fff" }}>{discountStatus(discount)}</Badge>
              <Button variant="outline" style={{ padding: "7px 14px" }} onClick={() => setForm({ id: discount.id, code: discount.code, percentage: String(discount.percentage), categories: discount.categories, startsAt: localDateTime(discount.startsAt), endsAt: localDateTime(discount.endsAt), isEnabled: discount.isEnabled })}>Edit</Button>
              <Button variant="outline" style={{ padding: "7px 14px" }} onClick={() => toggleDiscount(discount)}>{discount.isEnabled ? "Disable" : "Enable"}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
