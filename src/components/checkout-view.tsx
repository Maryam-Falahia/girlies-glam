"use client";

import { Lock, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LanguageSwitch, OrderReceipt } from "@/components/orders";
import { DeliveryPromise } from "@/components/store-features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { checkoutCopy, detectReceiptMime, OMAN_GOVERNORATES, OMAN_WILAYATS, shippingQuote } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { CheckoutLanguage, Order, PromoPreview } from "@/lib/types";
import { money } from "@/lib/utils";

export function CheckoutView() {
  const { cart, products, settings, placeOrder, validatePromo, user } = useStore();
  const router = useRouter();
  const [language, setLanguage] = useState<CheckoutLanguage>("en");
  const copy = checkoutCopy[language];
  const arabic = language === "ar";
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [form, setForm] = useState({ shippingName: "", phone: "", governorate: "", wilayat: "", postalCode: "" });
  const [promoCode, setPromoCode] = useState("");
  const [promoPreview, setPromoPreview] = useState<PromoPreview | null>(null);
  const [promoError, setPromoError] = useState("");
  const detail = cart.map((line) => ({ line, product: products.find((product) => product.id === line.productId) })).filter((entry) => entry.product);
  const subtotal = detail.reduce((sum, entry) => sum + entry.product!.price * entry.line.qty, 0);
  const promoApplied = Boolean(promoPreview?.valid && promoPreview.code === promoCode.trim().toUpperCase());
  const promoDiscount = promoApplied ? Math.min(subtotal, promoPreview?.discountAmount || 0) : 0;
  const quote = shippingQuote(form.governorate);
  const total = Math.max(0, subtotal - promoDiscount + quote.fee);

  const readReceipt = async (file: File | null) => {
    if (!file) return;
    const detected = detectReceiptMime(new Uint8Array(await file.arrayBuffer()));
    if (!detected || detected !== file.type || file.size > 5 * 1024 * 1024) {
      setReceipt("");
      setReceiptName("");
      window.alert(copy.invalidReceipt);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceipt(String(reader.result || ""));
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return <div className="gg-container gg-section"><div className="gg-empty">Please sign in or create an account before checkout.</div></div>;
  }
  if (placed) {
    return <OrderReceipt order={placed} showSuccess initialLanguage={language} onBack={() => router.push("/")} />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{8}$/.test(form.phone)) { window.alert(copy.invalidPhone); return; }
    if (!receipt) { window.alert(copy.paymentReceiptRequired); return; }
    if (promoCode.trim() && !promoApplied) { setPromoError("Apply a valid promo code before placing your order."); return; }
    setBusy(true);
    setOrderError("");
    try {
      const order = await placeOrder({ ...form, language, transferReceipt: receipt, promoCode: promoApplied ? promoPreview?.code : undefined });
      setPlaced(order);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : copy.failedOrder);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`gg-container gg-section gg-checkout-grid ${arabic ? "gg-checkout-ar" : ""}`} dir={arabic ? "rtl" : "ltr"} lang={language}>
      <div>
        <LanguageSwitch language={language} onChange={setLanguage} />
        <button className="gg-nav-link" style={{ marginBottom: 16 }} onClick={() => router.push("/shop")}>{copy.backShop}</button>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, color: "var(--plum)", marginBottom: 20 }}>{copy.checkout}</h1>
        <div className="gg-error-msg" style={{ background: "var(--lavender-light)", color: "var(--plum)" }}>{copy.paymentNotice}</div>
        <form onSubmit={submit}>
          {orderError && <div className="gg-error-msg" role="alert">{orderError}</div>}
          <div className="gg-filter-title">{copy.shippingAddress}</div>
          <Label htmlFor="gg-name">{copy.fullName}</Label>
          <Input id="gg-name" dir="auto" required value={form.shippingName} onChange={(event) => setForm({ ...form, shippingName: event.target.value })} />
          <Label htmlFor="gg-phone">{copy.phone}</Label>
          <div className="gg-phone-field"><span dir="ltr">+968</span><Input id="gg-phone" dir="ltr" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder={copy.phonePlaceholder} required minLength={8} maxLength={8} pattern="[0-9]{8}" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "").slice(0, 8) })} style={{ marginBottom: 16 }} /></div>
          <Label htmlFor="gg-governorate">{copy.governorate}</Label>
          <Select id="gg-governorate" value={form.governorate} placeholder={copy.selectGovernorate} onValueChange={(value) => setForm({ ...form, governorate: value, wilayat: "" })} options={OMAN_GOVERNORATES.map((item) => ({ value: item, label: item }))} />
          <Label htmlFor="gg-wilayat">{copy.wilayat}</Label>
          <Select key={form.governorate || "wilayat"} id="gg-wilayat" value={form.wilayat} placeholder={copy.selectWilayat} disabled={!form.governorate} onValueChange={(value) => setForm({ ...form, wilayat: value })} options={(OMAN_WILAYATS[form.governorate] || []).map((item) => ({ value: item, label: item }))} />
          <Label htmlFor="gg-postal">{copy.postalCode}</Label>
          <Input id="gg-postal" dir="ltr" inputMode="numeric" required value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} />
          <div style={{ marginTop: 8, background: "#fff5aa", border: "2px solid #e7c94b", borderRadius: 14, padding: "16px 18px", color: "#5d4810" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{copy.transferPayment}</div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13 }}>{settings.transferDetails || copy.transferNotConfigured}</div>
          </div>
          <Label htmlFor="gg-transfer-receipt" style={{ marginTop: 18 }}>{copy.paymentReceipt} <span style={{ color: "var(--pink-deep)" }}>*</span></Label>
          <div style={{ background: "var(--surface)", border: "1px dashed var(--pink)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <input id="gg-transfer-receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => readReceipt(event.target.files?.[0] || null)} />
            {receiptName && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>{receiptName}</div>}
            <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 6 }}>{copy.paymentReceiptRequired}</div>
          </div>
          <div style={{ padding: "12px 14px", background: "var(--lavender-light)", borderRadius: 12, color: "var(--plum)", fontSize: 12.5 }}>
            <DeliveryPromise governorate={form.governorate} />
            <div style={{ marginTop: 4 }}>Shipping for this address: <bdi dir="ltr">{money(quote.fee)}</bdi></div>
          </div>
          <Button type="submit" size="wide" style={{ marginTop: 16 }} disabled={busy || !detail.length || !receipt || !form.governorate || !form.wilayat || (Boolean(promoCode.trim()) && !promoApplied)}><Lock size={14} /> {busy ? copy.saving : <>{copy.submit} · <bdi dir="ltr">{money(total)}</bdi></>}</Button>
          <div style={{ fontSize: 11.5, color: "var(--text3)", textAlign: "center", marginTop: 10 }}>{copy.noCharge}</div>
        </form>
      </div>
      <div className="gg-panel" style={{ padding: 22 }}>
        <div className="gg-filter-title">{copy.summary}</div>
        {!detail.length && <div className="gg-empty" style={{ padding: 20 }}>Your bag is empty.</div>}
        {detail.map(({ line, product }) => <div key={product!.id + line.size + line.colorway} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 12 }}><span dir="auto">{product!.name} × {line.qty} <span style={{ color: "var(--text3)" }}>({line.size})</span></span><span dir="ltr" style={{ fontWeight: 600 }}>{money(product!.price * line.qty)}</span></div>)}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <Label htmlFor="gg-promo-code" style={{ display: "flex", alignItems: "center", gap: 6 }}><Tag size={14} />{copy.promoCode}</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <Input id="gg-promo-code" style={{ margin: 0 }} value={promoCode} onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); setPromoPreview(null); setPromoError(""); }} placeholder={copy.promoPlaceholder} />
            <Button variant="outline" style={{ whiteSpace: "nowrap", padding: "8px 12px" }} onClick={async () => {
              if (!promoCode.trim()) { setPromoError("Enter a promo code first."); return; }
              const result = await validatePromo(promoCode);
              setPromoPreview(result.valid ? result : null);
              setPromoError(result.valid ? "" : result.message);
            }}>{copy.applyPromo}</Button>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 6 }}>{copy.promoHint}</div>
          {promoError && <div role="alert" style={{ fontSize: 12.5, color: "#b04b6b", marginTop: 8 }}>{promoError}</div>}
          {promoApplied && <div role="status" style={{ background: "#eef8f1", color: "#31754b", borderRadius: 10, padding: "9px 10px", fontSize: 12.5, marginTop: 8 }}>{copy.promoApplied} · {promoPreview?.percentage}%</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "12px 0 6px", color: "var(--text2)" }}><span>{copy.subtotal}</span><span dir="ltr">{money(subtotal)}</span></div>
        {promoDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, paddingBottom: 6, color: "#3f8a61" }}><span>{copy.discount}</span><span dir="ltr">−{money(promoDiscount)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, paddingBottom: 12, color: "var(--text2)" }}><span>{copy.shipping}</span><span dir="ltr">{money(quote.fee)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "var(--plum)", borderTop: "1px solid var(--border)", paddingTop: 12 }}><span>{copy.total}</span><span dir="ltr">{money(total)}</span></div>
      </div>
    </div>
  );
}
