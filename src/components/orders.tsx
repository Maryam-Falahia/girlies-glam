"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkoutCopy, ORDER_STATUSES } from "@/lib/constants";
import { usePreferences } from "@/lib/preferences";
import { useStore } from "@/lib/store";
import type { CheckoutLanguage, Order } from "@/lib/types";
import { money } from "@/lib/utils";

export function OrderReference({ value }: { value: string }) {
  return <span className="gg-order-reference">{value}</span>;
}

export function OrderTracker({ status }: { status: string }) {
  const { t } = usePreferences();
  const index = Math.max(0, ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number]));
  return (
    <div style={{ display: "flex", alignItems: "flex-start", margin: "14px 0 18px" }}>
      {ORDER_STATUSES.map((step, stepIndex) => (
        <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {stepIndex > 0 && <div style={{ position: "absolute", top: 11, right: "50%", width: "100%", height: 2, background: stepIndex <= index ? "var(--pink-deep)" : "var(--border)", zIndex: 0 }} />}
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: stepIndex <= index ? "var(--pink-deep)" : "var(--surface)", border: stepIndex <= index ? "none" : "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, color: "#fff" }}>
            {stepIndex < index ? <CheckCircle2 size={15} /> : stepIndex === index ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> : null}
          </div>
          <div style={{ fontSize: 10.5, marginTop: 6, textAlign: "center", color: stepIndex <= index ? "var(--plum)" : "var(--text2)", fontWeight: stepIndex === index ? 700 : 500, maxWidth: 70 }}>
            {t(`status.${step === "In Process" ? "inProcess" : step === "In Delivery" ? "inDelivery" : step.toLowerCase()}`)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LanguageSwitch({ language, onChange }: { language: CheckoutLanguage; onChange: (language: CheckoutLanguage) => void }) {
  const copy = checkoutCopy[language];
  return (
    <div className="gg-language-switch gg-print-hide" role="group" aria-label={copy.language}>
      <span>{copy.language}</span>
      <button type="button" className={language === "en" ? "active" : ""} onClick={() => onChange("en")} aria-pressed={language === "en"}>{copy.english}</button>
      <button type="button" className={language === "ar" ? "active" : ""} onClick={() => onChange("ar")} aria-pressed={language === "ar"}>{copy.arabic}</button>
    </div>
  );
}

export function OrderReceipt({ order, onBack, showSuccess = false, initialLanguage }: { order: Order; onBack: () => void; showSuccess?: boolean; initialLanguage?: CheckoutLanguage }) {
  const { language: preferenceLanguage } = usePreferences();
  const [language, setLanguage] = useState<CheckoutLanguage>(initialLanguage ?? order.language ?? preferenceLanguage);
  const copy = checkoutCopy[language];
  const arabic = language === "ar";
  return (
    <div className="gg-container gg-section" style={{ maxWidth: 560 }}>
      <LanguageSwitch language={language} onChange={setLanguage} />
      {showSuccess ? (
        <div className="gg-print-hide" dir={arabic ? "rtl" : "ltr"} style={{ textAlign: "center", marginBottom: 28 }}>
          <CheckCircle2 size={54} color="var(--pink)" style={{ marginBottom: 16 }} />
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, color: "var(--plum)", marginBottom: 10 }}>{copy.received}</h1>
          <p style={{ color: "var(--text2)" }}>{copy.followUp}</p>
        </div>
      ) : <button className="gg-nav-link gg-print-hide" dir={arabic ? "rtl" : "ltr"} style={{ marginBottom: 16 }} onClick={onBack}>{copy.backOrders}</button>}
      <div className={arabic ? "gg-print-area gg-receipt-ar gg-panel" : "gg-print-area gg-panel"} dir={arabic ? "rtl" : "ltr"} lang={language} style={{ padding: 24, marginBottom: 24 }}>
        <div className="gg-receipt-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", textTransform: arabic ? "none" : "uppercase" }}>{copy.orderNumber}</div>
            <div dir="ltr" style={{ fontWeight: 700, color: "var(--plum)", fontSize: 16 }}><OrderReference value={order.id} /></div>
          </div>
          <div style={{ textAlign: arabic ? "left" : "right" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", textTransform: arabic ? "none" : "uppercase" }}>{copy.date}</div>
            <div dir="ltr" style={{ fontWeight: 600, color: "var(--plum)", fontSize: 14 }}>{order.date}</div>
          </div>
        </div>
        <div className="gg-print-hide"><OrderTracker status={order.status} /></div>
        <div className="gg-filter-title">{copy.shippingTo}</div>
        <div className="gg-receipt-address" style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.6, marginBottom: 18 }}>
          <span className="gg-receipt-bidi" dir="auto">{order.shippingName}</span>
          <span className="gg-receipt-bidi" dir="auto">{order.wilayat}</span>
          {order.governorate && <span className="gg-receipt-bidi" dir="auto">{order.governorate}</span>}
          {order.postalCode && <span className="gg-receipt-bidi" dir="ltr">{order.postalCode}</span>}
          {order.phone && <span className="gg-receipt-phone" dir="ltr">{order.phone}</span>}
        </div>
        <div className="gg-filter-title">{copy.items}</div>
        {order.items.map((item, index) => (
          <div className="gg-receipt-item" key={`${item.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <span dir="auto" style={{ color: "var(--plum)" }}>{item.name} × {item.qty} <span style={{ color: "var(--text3)" }}>({item.size})</span></span>
            <span dir="ltr" style={{ fontWeight: 600 }}>{money(item.price * item.qty)}</span>
          </div>
        ))}
        {(order.promoCode || Number(order.discountAmount || 0) > 0) && (
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 10, fontSize: 13 }}>
            {order.promoCode && <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "var(--text2)" }}><span>{copy.promoCode}</span><strong dir="ltr">{order.promoCode}</strong></div>}
            {Number(order.discountAmount || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#3f8a61", marginTop: 6 }}><span>{copy.discount}</span><span dir="ltr">−{money(Number(order.discountAmount || 0))}</span></div>}
          </div>
        )}
        <div className="gg-receipt-total" style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "var(--pink-deep)", paddingTop: 14, marginTop: 6 }}>
          <span>{copy.total}</span><span dir="ltr">{money(order.total)}</span>
        </div>
      </div>
      <div className="gg-print-hide" style={{ display: "flex", gap: 12 }}>
        <Button variant="outline" style={{ flex: 1 }} onClick={() => window.print()}><Printer size={16} /> {copy.print}</Button>
        <Button style={{ flex: 1 }} onClick={onBack}>{showSuccess ? copy.continueShopping : copy.backToOrders}</Button>
      </div>
    </div>
  );
}

export function OrderCard({ order, onView }: { order: Order; onView: (order: Order) => void }) {
  return (
    <div className="gg-panel" style={{ padding: "18px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: "var(--plum)", fontSize: 14.5 }}><OrderReference value={order.id} /></div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>Placed {order.date}</div>
        </div>
        <Badge style={{ background: order.status === "Received" ? "#8bbf9f" : "var(--pink)", color: "#fff" }}>{order.status}</Badge>
      </div>
      <OrderTracker status={order.status} />
      {order.items.map((item, index) => <div key={index} style={{ fontSize: 13, color: "var(--text2)", padding: "4px 0" }}>{item.name} · Size {item.size} · Qty {item.qty} — <span style={{ fontWeight: 600, color: "var(--plum)" }}>{money(item.price)}</span></div>)}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 10 }}>
        <Button variant="outline" style={{ fontSize: 12.5, padding: "7px 16px" }} onClick={() => onView(order)}>View Bill</Button>
        <div style={{ fontWeight: 700, color: "var(--pink-deep)", fontSize: 14.5 }}>Total: {money(order.total)}</div>
      </div>
    </div>
  );
}

export function OrderPage({ id }: { id: string }) {
  const router = useRouter();
  const { orders, ready } = useStore();
  const order = orders.find((item) => item.id === id);
  if (!ready) return <div className="gg-empty">Loading your glam...</div>;
  if (!order) return <div className="gg-container gg-section"><div className="gg-empty">We could not find that order.</div></div>;
  return <OrderReceipt order={order} onBack={() => router.push("/account")} />;
}
