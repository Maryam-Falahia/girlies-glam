"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PRODUCTS, swatchFor } from "@/lib/catalog";
import { defaultDiscounts, defaultSettings, discountStatus, SHIPPING_FEE } from "@/lib/constants";
import { getSupabase } from "@/lib/supabase/client";
import type { CartLine, Discount, Order, OrderItem, Product, PromoPreview, Review, ReviewStatus, SessionUser, StoreSettings } from "@/lib/types";
import { initialsFrom, readJson, writeJson } from "@/lib/utils";

type LocalAccount = SessionUser & { password: string };

type OrderInput = {
  shippingName: string;
  phone: string;
  governorate: string;
  wilayat: string;
  postalCode: string;
  language: "en" | "ar";
  transferReceipt: string;
  promoCode?: string;
};

type ProductInput = {
  id?: string;
  name: string;
  category: string;
  price: number;
  colors: string[];
  sizes: string[];
  description: string;
  imageUrl?: string | null;
  isNew: boolean;
  isBestseller: boolean;
  isVisible?: boolean;
};

type StoreValue = {
  ready: boolean;
  user: SessionUser | null;
  guest: boolean;
  products: Product[];
  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  wishlist: Set<string>;
  orders: Order[];
  reviews: Review[];
  discounts: Discount[];
  settings: StoreSettings;
  recentIds: string[];
  toast: { title: string; body: string } | null;
  showToast: (title: string, body: string) => void;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  addToCart: (product: Product, size: string, colorway?: string) => void;
  updateQty: (productId: string, size: string, qty: number, colorway?: string) => void;
  removeLine: (productId: string, size: string, colorway?: string) => void;
  toggleWish: (product: Product) => Promise<string | null>;
  validatePromo: (code: string) => Promise<PromoPreview>;
  placeOrder: (input: OrderInput) => Promise<Order>;
  saveProduct: (input: ProductInput) => Promise<void>;
  setProductVisibility: (id: string, isVisible: boolean) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setOrderStatus: (id: string, status: string) => Promise<void>;
  submitReview: (productId: string, rating: number, title: string, body: string) => Promise<string>;
  moderateReview: (id: string, status: ReviewStatus) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  saveDiscount: (discount: Discount) => Promise<void>;
  toggleDiscount: (discount: Discount) => Promise<void>;
  saveSettings: (settings: StoreSettings) => Promise<void>;
  rememberProduct: (id: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);
const demoAccount: LocalAccount = { id: "demo", name: "Maryam Al-Falahi", email: "demo@girliesglam.com", password: "glam123", initials: "MF", isAdmin: true };

function accounts() {
  const stored = readJson<LocalAccount[]>("gg-accounts", []);
  if (!stored.some((account) => account.email === demoAccount.email)) return [demoAccount, ...stored];
  return stored;
}

function quotePromo(code: string, lines: CartLine[], products: Product[], discounts: Discount[]): PromoPreview {
  const found = discounts.find((discount) => discount.code.toUpperCase() === code.trim().toUpperCase());
  if (!found) return { valid: false, message: "This promo code cannot be applied." };
  const status = discountStatus(found);
  if (status !== "Active") {
    const message = status === "Scheduled" ? "This code is not active yet." : status === "Expired" ? "This code has expired." : "This code is disabled.";
    return { valid: false, message };
  }
  const eligibleSubtotal = lines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    if (!product || !found.categories.includes(product.category)) return sum;
    return sum + product.price * line.qty;
  }, 0);
  if (eligibleSubtotal <= 0) return { valid: false, message: "This code does not apply to the items in your bag." };
  return {
    valid: true,
    message: "Code applied",
    code: found.code,
    percentage: found.percentage,
    eligibleSubtotal: +eligibleSubtotal.toFixed(3),
    discountAmount: +((eligibleSubtotal * found.percentage) / 100).toFixed(3),
  };
}

function authMessage(message: string, mode: "login" | "signup") {
  if (/invalid login|invalid email or password/i.test(message)) return "We couldn't sign you in. Check your email and password and try again.";
  if (/already registered|already in use|already been registered/i.test(message)) return "That email is already registered. Try signing in instead.";
  if (/password/i.test(message)) return "Use a password with at least 6 characters.";
  if (message) return message;
  return mode === "login" ? "We couldn't sign you in right now. Please try again." : "We couldn't create your account right now. Please try again.";
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    price: Number(row.price),
    compareAt: row.compare_at == null ? null : Number(row.compare_at),
    colorway: String(row.colorway),
    swatch: String(row.swatch),
    sizes: (row.sizes as string[]) || [],
    isNew: Boolean(row.is_new),
    isBestseller: Boolean(row.is_bestseller),
    isVisible: row.is_visible !== false,
    rating: Number(row.rating || 0),
    reviews: Number(row.review_count || 0),
    description: String(row.description || ""),
    imageUrl: (row.image_url as string | null) ?? null,
    variants: (row.variants as Product["variants"]) || [],
  };
}

function productRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    compare_at: product.compareAt ?? null,
    colorway: product.colorway,
    swatch: product.swatch,
    sizes: product.sizes,
    is_new: product.isNew,
    is_bestseller: product.isBestseller,
    is_visible: product.isVisible,
    rating: product.rating,
    review_count: product.reviews,
    description: product.description,
    image_url: product.imageUrl ?? null,
    variants: product.variants ?? [],
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.order_ref || row.id),
    date: new Date(String(row.created_at || Date.now())).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    items: (row.items as OrderItem[]) || [],
    total: Number(row.total || 0),
    status: String(row.status || "Submitted"),
    language: (row.language as "en" | "ar") || "en",
    shippingName: String(row.shipping_name || ""),
    phone: String(row.phone || ""),
    governorate: String(row.governorate || ""),
    wilayat: String(row.wilayat || ""),
    postalCode: String(row.postal_code || ""),
    transferReceipt: (row.transfer_receipt as string | null) ?? null,
    transferReceiptAvailable: Boolean(row.transfer_receipt),
    customerName: String(row.customer_name || ""),
    customerEmail: String(row.customer_email || ""),
    userId: String(row.user_id || ""),
    promoCode: (row.promo_code as string | null) ?? null,
    discountAmount: Number(row.discount_amount || 0),
    shippingFee: Number(row.shipping_fee || SHIPPING_FEE),
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productName: String(row.product_name || ""),
    userId: String(row.user_id || ""),
    customerName: String(row.customer_name || ""),
    customerEmail: String(row.customer_email || ""),
    rating: Number(row.rating || 0),
    title: String(row.title || ""),
    body: String(row.body || ""),
    moderationStatus: (row.moderation_status as ReviewStatus) || "pending",
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapDiscount(row: Record<string, unknown>): Discount {
  return {
    id: String(row.id),
    code: String(row.code),
    percentage: Number(row.percentage),
    categories: (row.categories as string[]) || [],
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    isEnabled: Boolean(row.is_enabled),
  };
}

function buildProduct(input: ProductInput, existing?: Product): Product {
  const colors = input.colors.map((color) => color.trim()).filter(Boolean);
  return {
    id: existing?.id || input.id || `PRD-${Date.now()}`,
    name: input.name.trim(),
    category: input.category,
    price: input.price,
    compareAt: existing?.compareAt ?? null,
    colorway: colors[0] || "Blush",
    swatch: swatchFor(colors[0] || "Blush", 0),
    sizes: input.sizes,
    isNew: input.isNew,
    isBestseller: input.isBestseller,
    isVisible: input.isVisible ?? existing?.isVisible ?? true,
    rating: existing?.rating ?? 5,
    reviews: existing?.reviews ?? 0,
    description: input.description.trim(),
    imageUrl: input.imageUrl ?? null,
    variants: colors.slice(1).map((color, index) => ({ colorway: color, swatch: swatchFor(color, index + 1), imageUrl: input.imageUrl ?? null })),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [guest, setGuest] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>(defaultDiscounts());
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [remote, setRemote] = useState(false);

  const showToast = (title: string, body: string) => {
    setToast({ title, body });
    window.setTimeout(() => setToast((current) => (current?.title === title ? null : current)), 3200);
  };

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      setCart(readJson<CartLine[]>("gg-cart", []));
      setRecentIds(readJson<string[]>("gg-recent-products", []));
      const supabase = getSupabase();
      if (!supabase) {
        setProducts(readJson<Product[]>("gg-products", PRODUCTS));
        setOrders(readJson<Order[]>("gg-orders", []));
        setReviews(readJson<Review[]>("gg-reviews", []));
        setDiscounts(readJson<Discount[]>("gg-discounts", defaultDiscounts()));
        setSettings(readJson<StoreSettings>("gg-settings", defaultSettings));
        const session = readJson<SessionUser | null>("gg-session", null);
        if (session) {
          setUser(session);
          setWishlist(new Set(readJson<string[]>(`gg-wish-${session.id}`, [])));
        }
        if (!cancelled) setReady(true);
        return;
      }
      setRemote(true);
      const [{ data: sessionData }, productResult, reviewResult, discountResult, settingsResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from("products").select("*").order("id"),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("discounts").select("*").order("created_at", { ascending: false }),
        supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (!cancelled) {
        if (!productResult.error && productResult.data) setProducts(productResult.data.map((row) => mapProduct(row)));
        if (!reviewResult.error && reviewResult.data) setReviews(reviewResult.data.map((row) => mapReview(row)));
        if (!discountResult.error && discountResult.data) setDiscounts(discountResult.data.map((row) => mapDiscount(row)));
        if (settingsResult.data) {
          setSettings({
            notifyEmail: String(settingsResult.data.notify_email || ""),
            notifyPhone: String(settingsResult.data.notify_phone || ""),
            transferDetails: String(settingsResult.data.transfer_details || ""),
          });
        }
      }
      const sessionUser = sessionData.session?.user;
      if (sessionUser) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle();
        const nextUser: SessionUser = {
          id: sessionUser.id,
          name: String(profile?.name || sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "Girlies Glam"),
          email: String(profile?.email || sessionUser.email || ""),
          initials: String(profile?.initials || initialsFrom(String(profile?.name || "GG"))),
          isAdmin: Boolean(profile?.is_admin),
        };
        const [{ data: wishRows }, { data: orderRows }] = await Promise.all([
          supabase.from("wishlist").select("product_id").eq("user_id", nextUser.id),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
        ]);
        if (!cancelled) {
          setUser(nextUser);
          setWishlist(new Set((wishRows || []).map((row) => String(row.product_id))));
          setOrders((orderRows || []).map((row) => mapOrder(row)));
        }
      }
      if (!cancelled) setReady(true);
    };
    void boot();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (ready) writeJson("gg-cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) writeJson("gg-recent-products", recentIds); }, [recentIds, ready]);

  const persistLocal = (next: { products?: Product[]; orders?: Order[]; reviews?: Review[]; discounts?: Discount[]; settings?: StoreSettings; wishlist?: Set<string>; user?: SessionUser | null }) => {
    if (remote) return;
    if (next.products) writeJson("gg-products", next.products);
    if (next.orders) writeJson("gg-orders", next.orders);
    if (next.reviews) writeJson("gg-reviews", next.reviews);
    if (next.discounts) writeJson("gg-discounts", next.discounts);
    if (next.settings) writeJson("gg-settings", next.settings);
    if (next.wishlist && (next.user || user)) writeJson(`gg-wish-${(next.user || user)!.id}`, [...next.wishlist]);
  };

  const login = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      const match = accounts().find((account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password);
      if (!match) return "We couldn't sign you in. Check your email and password and try again.";
      const next = { id: match.id, name: match.name, email: match.email, initials: match.initials, isAdmin: match.isAdmin };
      setUser(next);
      setGuest(false);
      writeJson("gg-session", next);
      setWishlist(new Set(readJson<string[]>(`gg-wish-${next.id}`, [])));
      return null;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return authMessage(error?.message || "", "login");
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    const next = {
      id: data.user.id,
      name: String(profile?.name || data.user.user_metadata?.name || "Girlies Glam"),
      email: String(profile?.email || data.user.email || email),
      initials: String(profile?.initials || initialsFrom(String(profile?.name || data.user.user_metadata?.name || "GG"))),
      isAdmin: Boolean(profile?.is_admin),
    };
    setUser(next);
    setGuest(false);
    const [{ data: wishRows }, { data: orderRows }] = await Promise.all([
      supabase.from("wishlist").select("product_id").eq("user_id", next.id),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    setWishlist(new Set((wishRows || []).map((row) => String(row.product_id))));
    if (orderRows) setOrders(orderRows.map((row) => mapOrder(row)));
    return null;
  };

  const signup = async (name: string, email: string, password: string) => {
    if (!name.trim()) return "Tell us your name first!";
    const supabase = getSupabase();
    if (!supabase) {
      const list = accounts();
      if (list.some((account) => account.email.toLowerCase() === email.trim().toLowerCase())) return "That email is already registered. Try signing in instead.";
      const nextAccount: LocalAccount = { id: `local-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), password, initials: initialsFrom(name), isAdmin: false };
      writeJson("gg-accounts", [...list.filter((account) => account.email !== demoAccount.email), demoAccount, nextAccount]);
      const next = { id: nextAccount.id, name: nextAccount.name, email: nextAccount.email, initials: nextAccount.initials, isAdmin: false };
      setUser(next);
      setGuest(false);
      writeJson("gg-session", next);
      return null;
    }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
    if (error || !data.user) return authMessage(error?.message || "", "signup");
    if (!data.session) return "Check your email to confirm the account, then sign in.";
    const next = { id: data.user.id, name: name.trim(), email: email.trim(), initials: initialsFrom(name), isAdmin: email.trim().toLowerCase() === demoAccount.email };
    setUser(next);
    setGuest(false);
    return null;
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setGuest(false);
    setWishlist(new Set());
    if (!remote) window.localStorage.removeItem("gg-session");
  };

  const addToCart = (product: Product, size: string, colorway = product.colorway) => {
    setCart((previous) => {
      const found = previous.find((line) => line.productId === product.id && line.size === size && line.colorway === colorway);
      if (found) return previous.map((line) => line === found ? { ...line, qty: Math.min(10, line.qty + 1) } : line);
      return [...previous, { productId: product.id, size, qty: 1, colorway }];
    });
    setCartOpen(true);
  };

  const updateQty = (productId: string, size: string, qty: number, colorway?: string) => {
    setCart((previous) => previous.map((line) => line.productId === productId && line.size === size && line.colorway === colorway ? { ...line, qty: Math.max(1, Math.min(10, qty)) } : line));
  };

  const removeLine = (productId: string, size: string, colorway?: string) => {
    setCart((previous) => previous.filter((line) => !(line.productId === productId && line.size === size && line.colorway === colorway)));
  };

  const toggleWish = async (product: Product) => {
    if (!user) return "Sign in to save favorites to your wishlist.";
    const exists = wishlist.has(product.id);
    const next = new Set(wishlist);
    if (exists) next.delete(product.id);
    else next.add(product.id);
    setWishlist(next);
    const supabase = getSupabase();
    if (!supabase || !remote) {
      persistLocal({ wishlist: next, user });
      return null;
    }
    const query = exists
      ? supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", product.id)
      : supabase.from("wishlist").insert({ user_id: user.id, product_id: product.id });
    const { error } = await query;
    if (error) {
      setWishlist(wishlist);
      return error.message;
    }
    return null;
  };

  const validatePromo = async (code: string): Promise<PromoPreview> => {
    if (!remote || discounts.length) return quotePromo(code, cart, products, discounts);
    const supabase = getSupabase();
    if (!supabase) return quotePromo(code, cart, products, discounts);
    const { data, error } = await supabase.rpc("validate_promo", {
      p_code: code.trim(),
      p_lines: cart.map((line) => ({ productId: line.productId, qty: line.qty })),
    });
    if (error || !data) return { valid: false, message: error?.message || "Unable to validate this promo code." };
    return data as PromoPreview;
  };

  const placeOrder = async (input: OrderInput) => {
    if (!user) throw new Error("Please sign in or create an account before checkout.");
    if (!cart.length) throw new Error("Your bag is empty.");
    const promo = input.promoCode ? await validatePromo(input.promoCode) : null;
    if (input.promoCode && !promo?.valid) throw new Error(promo?.message || "This promo code cannot be applied.");
    const items: OrderItem[] = cart.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      if (!product) throw new Error("A product in your bag is no longer available.");
      return { productId: product.id, name: product.name, size: line.size, qty: line.qty, price: product.price, colorway: line.colorway || product.colorway };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmount = promo?.discountAmount || 0;
    const order: Order = {
      id: `GG-${100000 + orders.length + 1}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      items,
      total: +Math.max(0, subtotal - discountAmount + SHIPPING_FEE).toFixed(3),
      status: "Submitted",
      language: input.language,
      shippingName: input.shippingName,
      wilayat: input.wilayat,
      governorate: input.governorate,
      postalCode: input.postalCode,
      phone: `+968 ${input.phone}`,
      transferReceipt: input.transferReceipt,
      transferReceiptAvailable: true,
      customerName: user.name,
      customerEmail: user.email,
      userId: user.id,
      promoCode: promo?.code || null,
      discountAmount,
      shippingFee: SHIPPING_FEE,
    };
    const supabase = getSupabase();
    if (!supabase || !remote) {
      const next = [order, ...orders];
      setOrders(next);
      persistLocal({ orders: next });
      setCart([]);
      return order;
    }
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id,
      status: "Submitted",
      shipping_name: input.shippingName,
      phone: `+968 ${input.phone}`,
      governorate: input.governorate,
      wilayat: input.wilayat,
      postal_code: input.postalCode,
      language: input.language,
      promo_code: promo?.code || null,
      transfer_receipt: input.transferReceipt,
      customer_name: user.name,
      customer_email: user.email,
      items,
      shipping_fee: SHIPPING_FEE,
      discount_amount: discountAmount,
      total: order.total,
    }).select("*").single();
    if (error || !data) throw new Error(error?.message || "Unable to place order");
    const saved = mapOrder(data);
    setOrders((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    setCart([]);
    return saved;
  };

  const saveProduct = async (input: ProductInput) => {
    const existing = products.find((product) => product.id === input.id);
    const product = buildProduct(input, existing);
    const next = existing ? products.map((item) => item.id === product.id ? product : item) : [product, ...products];
    setProducts(next);
    const supabase = getSupabase();
    if (!supabase || !remote) {
      persistLocal({ products: next });
      return;
    }
    const { error } = await supabase.from("products").upsert(productRow(product));
    if (error) throw new Error(error.message);
  };

  const setProductVisibility = async (id: string, isVisible: boolean) => {
    const next = products.map((product) => product.id === id ? { ...product, isVisible } : product);
    setProducts(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ products: next });
    const { error } = await supabase.from("products").update({ is_visible: isVisible }).eq("id", id);
    if (error) throw new Error(error.message);
  };

  const deleteProduct = async (id: string) => {
    const next = products.filter((product) => product.id !== id);
    setProducts(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ products: next });
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  };

  const setOrderStatus = async (id: string, status: string) => {
    const next = orders.map((order) => order.id === id ? { ...order, status } : order);
    setOrders(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ orders: next });
    const { error } = await supabase.from("orders").update({ status }).eq("order_ref", id);
    if (error) throw new Error(error.message);
  };

  const submitReview = async (productId: string, rating: number, title: string, body: string) => {
    if (!user) return "Sign in to write a review.";
    const product = products.find((item) => item.id === productId);
    const review: Review = {
      id: `rev-${Date.now()}`,
      productId,
      productName: product?.name || "",
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      rating,
      title: title.trim(),
      body: body.trim(),
      moderationStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    const supabase = getSupabase();
    if (!supabase || !remote) {
      const next = [review, ...reviews];
      setReviews(next);
      persistLocal({ reviews: next });
      return "Thank you — your review is awaiting approval and will appear here once it is approved.";
    }
    const { data, error } = await supabase.from("reviews").insert({
      product_id: productId,
      product_name: review.productName,
      user_id: user.id,
      customer_name: user.name,
      customer_email: user.email,
      rating,
      title: review.title,
      body: review.body,
      moderation_status: "pending",
    }).select("*").single();
    if (error || !data) return error?.message || "Unable to submit review";
    setReviews((current) => [mapReview(data), ...current]);
    return "Thank you — your review is awaiting approval and will appear here once it is approved.";
  };

  const moderateReview = async (id: string, status: ReviewStatus) => {
    const next = reviews.map((review) => review.id === id ? { ...review, moderationStatus: status } : review);
    setReviews(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ reviews: next });
    const { error } = await supabase.from("reviews").update({ moderation_status: status }).eq("id", id);
    if (error) throw new Error(error.message);
  };

  const deleteReview = async (id: string) => {
    const next = reviews.filter((review) => review.id !== id);
    setReviews(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ reviews: next });
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw new Error(error.message);
  };

  const saveDiscount = async (discount: Discount) => {
    const next = discounts.some((item) => item.id === discount.id)
      ? discounts.map((item) => item.id === discount.id ? discount : item)
      : [discount, ...discounts];
    setDiscounts(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ discounts: next });
    const { data, error } = await supabase.from("discounts").upsert({
      id: discount.id.startsWith("disc-") ? undefined : discount.id,
      code: discount.code,
      percentage: discount.percentage,
      categories: discount.categories,
      starts_at: discount.startsAt,
      ends_at: discount.endsAt,
      is_enabled: discount.isEnabled,
    }).select("*").single();
    if (error || !data) throw new Error(error?.message || "Unable to save promo code.");
    const saved = mapDiscount(data);
    setDiscounts((current) => current.map((item) => item.id === discount.id ? saved : item));
  };

  const toggleDiscount = async (discount: Discount) => saveDiscount({ ...discount, isEnabled: !discount.isEnabled });

  const saveSettings = async (next: StoreSettings) => {
    setSettings(next);
    const supabase = getSupabase();
    if (!supabase || !remote) return persistLocal({ settings: next });
    const { error } = await supabase.from("store_settings").update({
      notify_email: next.notifyEmail,
      notify_phone: next.notifyPhone,
      transfer_details: next.transferDetails,
    }).eq("id", 1);
    if (error) throw new Error(error.message);
  };

  const value: StoreValue = {
    ready, user, guest, products, cart, cartOpen, setCartOpen, wishlist, orders, reviews, discounts, settings, recentIds, toast, showToast,
    login, signup, logout, continueAsGuest: () => setGuest(true), addToCart, updateQty, removeLine, toggleWish,
    validatePromo,
    placeOrder, saveProduct, setProductVisibility, deleteProduct, setOrderStatus, submitReview, moderateReview, deleteReview, saveDiscount, toggleDiscount, saveSettings,
    rememberProduct: (id) => setRecentIds((previous) => previous[0] === id ? previous : [id, ...previous.filter((item) => item !== id)].slice(0, 6)),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
