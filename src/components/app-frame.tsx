"use client";

import { Eye, EyeOff, Heart, Lock, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, Trash2, User as UserIcon, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { BackgroundCanvas } from "@/components/background-canvas";
import { BrandMark } from "@/components/brand-mark";
import { ProductImage } from "@/components/product-card";
import { WhatsAppSupport } from "@/components/store-features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { categories, clothingCategories, jewelryCategories } from "@/lib/constants";
import { usePreferences } from "@/lib/preferences";
import { useStore } from "@/lib/store";
import { money } from "@/lib/utils";

function AuthScreen() {
  const { login, signup, continueAsGuest, showToast } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const result = mode === "login" ? await login(email, password) : await signup(name, email, password);
    setBusy(false);
    if (result) {
      if (result.startsWith("Check your email")) setNotice(result);
      else setError(result);
      return;
    }
    showToast(mode === "login" ? "Welcome back!" : "Account created!", mode === "login" ? "Good to see you ✨" : "Welcome to Girlies Glam 🎀");
  };

  return (
    <div id="gg-auth">
      <div className="gg-auth-box">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <BrandMark variant="auth" />
          <div style={{ fontSize: 12.5, color: "var(--text2)", marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Sparkles size={13} /> Feminine fashion, made to sparkle
          </div>
        </div>
        {error && <div className="gg-error-msg" role="alert">{error}</div>}
        {notice && <div className="gg-auth-notice" role="status">{notice}</div>}
        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <Label htmlFor="auth-name">Full Name</Label>
              <Input id="auth-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required />
            </>
          )}
          <Label htmlFor="auth-email">Email Address</Label>
          <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Label htmlFor="auth-password">Password</Label>
            {mode === "login" && <button type="button" className="gg-auth-link" onClick={() => { setError(""); setNotice("Password reset is not available yet. Please contact Girlies Glam support to reset your account."); }}>Forgot password?</button>}
          </div>
          <div className="gg-password-field">
            <Input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "••••••••" : "Create a password"} required minLength={6} />
            <button type="button" className="gg-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
          <Button type="submit" size="wide" style={{ marginTop: 4 }} disabled={busy}>{busy ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Create Account")}</Button>
          <div className="gg-auth-switch">
            {mode === "login" ? "New here?" : "Already glam?"}{" "}
            <button type="button" className="gg-auth-link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); setShowPassword(false); }}>{mode === "login" ? "Create an account" : "Sign in"}</button>
          </div>
          {mode === "login" && (
            <>
              <Button variant="outline" className="gg-guest-btn" onClick={continueAsGuest}>Continue as guest</Button>
              <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--text3)", marginTop: 10 }}>Browse the collection without an account. Sign in when you’re ready to save favorites or checkout.</div>
              <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--text3)", marginTop: 8 }}>Team sign-in: demo@girliesglam.com / glam123</div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function CartSheet() {
  const { cartOpen, setCartOpen, cart, products, updateQty, removeLine, user } = useStore();
  const router = useRouter();
  const detail = cart.map((line) => ({ line, product: products.find((product) => product.id === line.productId) })).filter((entry) => entry.product);
  const subtotal = detail.reduce((sum, entry) => sum + entry.product!.price * entry.line.qty, 0);
  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen} title="Your bag">
      <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 19, color: "var(--plum)" }}>Your Bag ({detail.length})</div>
        <Button variant="icon" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={20} /></Button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 22px" }}>
        {!detail.length && <div className="gg-empty"><ShoppingBag size={30} color="var(--pink)" style={{ marginBottom: 10 }} />Your bag is feeling light. Go find something sparkly!</div>}
        {detail.map(({ line, product }) => (
          <div className="gg-cart-line" key={product!.id + line.size + line.colorway}>
            <div className="gg-cart-thumb"><ProductImage product={product!} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--plum)" }}>{product!.name}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Color {line.colorway || product!.colorway} · Size {line.size}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--border)", borderRadius: 8, padding: "3px 8px" }}>
                  <button type="button" onClick={() => updateQty(product!.id, line.size, line.qty - 1, line.colorway)} aria-label="Decrease quantity"><Minus size={12} /></button>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{line.qty}</span>
                  <button type="button" onClick={() => updateQty(product!.id, line.size, line.qty + 1, line.colorway)} aria-label="Increase quantity"><Plus size={12} /></button>
                </div>
                <span style={{ fontWeight: 700, color: "var(--pink-deep)", fontSize: 13.5 }}>{money(product!.price * line.qty)}</span>
              </div>
            </div>
            <button type="button" onClick={() => removeLine(product!.id, line.size, line.colorway)} style={{ color: "var(--text3)", alignSelf: "flex-start" }} aria-label="Remove item"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {detail.length > 0 && (
        <div style={{ padding: "18px 22px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, color: "var(--text2)" }}><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>Shipping & taxes calculated at checkout</div>
          <Button size="wide" onClick={() => {
            setCartOpen(false);
            if (!user) {
              window.alert("Please sign in or create an account before checkout.");
              return;
            }
            router.push("/checkout");
          }}><Lock size={14} /> Checkout</Button>
        </div>
      )}
    </Sheet>
  );
}

function BrowseLinks({ category, onNavigate, closeMenu, isAdmin, page }: { category: string | null; onNavigate: (category?: string) => void; closeMenu: () => void; isAdmin: boolean; page: string }) {
  const { t } = usePreferences();
  const router = useRouter();
  const shopAll = page === "shop" && (!category || category === "All");
  const go = (href: string) => { closeMenu(); router.push(href); };
  return (
    <nav className="gg-side-nav" aria-label="Store categories">
      <button className={`gg-filter-item ${page === "home" ? "active" : ""}`} onClick={() => go("/")}>{t("nav.home")}</button>
      <button className={`gg-filter-item ${shopAll ? "active" : ""}`} onClick={() => onNavigate()}>{t("nav.shop")}</button>
      {clothingCategories.map((item) => <button key={item} className={`gg-filter-item ${page === "shop" && category === item ? "active" : ""}`} onClick={() => onNavigate(item)}>{item}</button>)}
      <div className="gg-filter-title gg-side-title">{t("nav.jewellery")}</div>
      {jewelryCategories.map((item) => <button key={item} className={`gg-filter-item ${page === "shop" && category === item ? "active" : ""}`} onClick={() => onNavigate(item)}>{item}</button>)}
      {isAdmin && <button className={`gg-filter-item gg-side-admin ${page === "admin" ? "active" : ""}`} onClick={() => go("/admin")}>{t("nav.admin")}</button>}
    </nav>
  );
}

function BrowseSidebar({ onNavigate, closeMenu, isAdmin, page }: { onNavigate: (category?: string) => void; closeMenu: () => void; isAdmin: boolean; page: string }) {
  const category = useSearchParams().get("category");
  return <BrowseLinks category={category} onNavigate={onNavigate} closeMenu={closeMenu} isAdmin={isAdmin} page={page} />;
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { ready, user, guest, cart, wishlist, logout, setCartOpen, toast } = useStore();
  const { t } = usePreferences();
  const pathname = usePathname();
  const router = useRouter();
  const page = pathname === "/" ? "home" : pathname.split("/")[1];
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  const goShop = (category?: string) => {
    setMenuOpen(false);
    router.push(category ? `/shop?category=${encodeURIComponent(category)}` : "/shop");
    window.scrollTo(0, 0);
  };

  const showStore = ready && Boolean(user || guest);
  const browsing = user ?? { name: "Guest shopper", email: "", initials: "G", isAdmin: false, id: "guest" };

  return (
    <>
      <BackgroundCanvas />
      {!ready && <div className="gg-empty" style={{ minHeight: "100vh" }}>Loading your glam...</div>}
      {ready && !showStore && <AuthScreen />}
      <div id="app" style={{ minHeight: "100vh", display: showStore ? "flex" : "none", flexDirection: "column" }}>
        <nav id="gg-nav">
          <div className="gg-nav-brand">
            <Button variant="icon" className="gg-menu-toggle" title="Menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19} /></Button>
            <button type="button" onClick={() => router.push("/")} aria-label="Girlies Glam home"><BrandMark variant="nav" /></button>
          </div>
          <div className="gg-nav-icons">
            <Button variant="icon" title={t("nav.search")} onClick={() => goShop()}><Search size={19} /></Button>
            <Button variant="icon" title={t("nav.wishlist")} onClick={() => user ? router.push("/account?tab=wishlist") : window.alert("Sign in to open your account and manage favorites.")}><Heart size={19} />{wishlist.size > 0 && <span className="gg-cart-count">{wishlist.size}</span>}</Button>
            <Button variant="icon" title={t("nav.cart")} onClick={() => setCartOpen(true)}><ShoppingBag size={19} />{count > 0 && <span className="gg-cart-count">{count}</span>}</Button>
            <Button variant="icon" title={browsing.name} onClick={() => user ? router.push("/account") : window.alert("Sign in to open your account and manage favorites.")}><UserIcon size={19} /></Button>
          </div>
        </nav>
        <div className="gg-body">
          <div className="gg-main">{children}</div>
        </div>
        {menuOpen && (
          <div className="gg-side-layer">
            <button type="button" className="gg-side-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="gg-side-drawer" role="dialog" aria-label="Store categories">
              <div className="gg-side-drawer-head">
                <BrandMark variant="nav" />
                <Button variant="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></Button>
              </div>
              <Suspense fallback={<BrowseLinks category={null} onNavigate={goShop} closeMenu={() => setMenuOpen(false)} isAdmin={browsing.isAdmin} page={page} />}>
                <BrowseSidebar onNavigate={goShop} closeMenu={() => setMenuOpen(false)} isAdmin={browsing.isAdmin} page={page} />
              </Suspense>
            </div>
          </div>
        )}
        <footer id="gg-footer">
          <div className="gg-footer-grid gg-container">
            <div>
              <BrandMark variant="footer" dark />
              <p style={{ fontSize: 13, color: "#d9b8ce", marginTop: 16, maxWidth: 260, lineHeight: 1.6 }}>{t("footer.tagline")}</p>
            </div>
            <div>
              <div className="gg-footer-title">{t("footer.shop")}</div>
              {categories.map((category) => <button key={category} className="gg-footer-link" onClick={() => goShop(category)}>{category}</button>)}
            </div>
            <div>
              <div className="gg-footer-title">{t("footer.help")}</div>
              <span className="gg-footer-link">Shipping & Returns</span>
              <span className="gg-footer-link">Size Guide</span>
              <span className="gg-footer-link">Contact Us</span>
            </div>
            <div>
              <div className="gg-footer-title">{t("footer.account")}</div>
              <button className="gg-footer-link" onClick={() => user ? router.push("/account") : window.alert("Sign in to open your account and manage favorites.")}>{t("nav.account")}</button>
              <button className="gg-footer-link" onClick={() => { void logout(); router.push("/"); }}>{t("footer.signOut")}</button>
            </div>
          </div>
          <div className="gg-footer-bottom">{t("footer.location")}</div>
        </footer>
      </div>
      <CartSheet />
      <WhatsAppSupport />
      {toast && <div className="toast-container"><div className="toast"><div className="toast-title">{toast.title}</div><div className="toast-body">{toast.body}</div></div></div>}
    </>
  );
}
