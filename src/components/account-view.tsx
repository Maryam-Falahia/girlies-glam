"use client";

import { Heart, LogOut, Package, User as UserIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderCard } from "@/components/orders";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePreferences } from "@/lib/preferences";
import { useStore } from "@/lib/store";

export function AccountView() {
  const { user, orders, products, wishlist, toggleWish, logout } = useStore();
  const { t, language, setLanguage, theme, setTheme } = usePreferences();
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("tab");
  const tab = requested === "wishlist" || requested === "profile" ? requested : "orders";

  if (!user) return <div className="gg-container gg-section"><div className="gg-empty">Sign in to open your account.</div></div>;

  const mine = orders.filter((order) => order.userId === user.id || order.customerEmail === user.email);
  const active = mine.filter((order) => order.status !== "Received");
  const finished = mine.filter((order) => order.status === "Received");
  const wished = products.filter((product) => wishlist.has(product.id));

  return (
    <div className="gg-container gg-section">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(155deg,var(--pink),var(--lavender))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>{user.initials}</div>
        <div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: "var(--plum)" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>{user.email}</div>
        </div>
      </div>
      <Tabs value={tab} onValueChange={(value) => router.replace(`/account?tab=${value}`)}>
        <TabsList className="gg-tabs">
          <TabsTrigger className="gg-tab" value="orders"><Package size={15} />{t("account.myOrders")}</TabsTrigger>
          <TabsTrigger className="gg-tab" value="wishlist"><Heart size={15} />{t("account.wishlist")}</TabsTrigger>
          <TabsTrigger className="gg-tab" value="profile"><UserIcon size={15} />{t("account.profile")}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          {mine.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {active.length ? active.map((order) => <OrderCard key={order.id} order={order} onView={(item) => router.push(`/orders/${item.id}`)} />) : <div className="gg-empty" style={{ padding: "24px 20px" }}>{t("account.noActiveOrders")}</div>}
              {finished.length > 0 && <div style={{ marginTop: 20 }}><div className="gg-filter-title" style={{ fontSize: 14, marginBottom: 14 }}>{t("account.orderFinished")}</div><div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: 0.85 }}>{finished.map((order) => <OrderCard key={order.id} order={order} onView={(item) => router.push(`/orders/${item.id}`)} />)}</div></div>}
            </div>
          ) : <div className="gg-empty">{t("account.noOrders")}</div>}
        </TabsContent>
        <TabsContent value="wishlist">
          {wished.length ? <div className="gg-grid">{wished.map((product) => <ProductCard key={product.id} product={product} wished onOpen={() => router.push(`/product/${product.id}`)} onWish={() => toggleWish(product)} />)}</div> : <div className="gg-empty">{t("account.nothingSaved")}</div>}
        </TabsContent>
        <TabsContent value="profile">
          <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
            <div className="gg-panel" style={{ padding: 24 }}>
              <Label>{t("account.fullName")}</Label>
              <Input defaultValue={user.name} readOnly />
              <Label>{t("account.email")}</Label>
              <Input defaultValue={user.email} readOnly />
              <Button variant="outline" size="wide" style={{ marginTop: 8 }} onClick={() => { void logout(); router.push("/"); }}><LogOut size={16} /> {t("account.signOut")}</Button>
            </div>
            <section className="gg-preferences">
              <div className="gg-filter-title">{t("preferences.title")}</div>
              <p className="gg-preferences-copy">{t("preferences.subtitle")}</p>
              <div className="gg-preferences-grid">
                <label className="gg-preference-field"><span>{t("language.label")}</span><select className="gg-inp" value={language} onChange={(event) => setLanguage(event.target.value as "en" | "ar")}><option value="en">{t("language.english")}</option><option value="ar">{t("language.arabic")}</option></select></label>
                <label className="gg-preference-field"><span>{t("theme.label")}</span><select className="gg-inp" value={theme} onChange={(event) => setTheme(event.target.value as "auto" | "light" | "dark")}><option value="auto">{t("theme.auto")}</option><option value="light">{t("theme.light")}</option><option value="dark">{t("theme.dark")}</option></select></label>
              </div>
              <p className="gg-preferences-note">{t("preferences.saved")}</p>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
