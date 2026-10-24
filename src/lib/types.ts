export type ProductVariant = { colorway: string; swatch: string; imageUrl?: string | null };

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number | null;
  colorway: string;
  swatch: string;
  sizes: string[];
  isNew: boolean;
  isBestseller: boolean;
  isVisible: boolean;
  rating: number;
  reviews: number;
  description: string;
  imageUrl?: string | null;
  variants?: ProductVariant[] | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  isAdmin: boolean;
};

export type CartLine = { productId: string; size: string; qty: number; colorway?: string };

export type OrderItem = {
  productId?: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  colorway?: string;
};

export type Order = {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: string;
  language?: "en" | "ar";
  shippingName?: string;
  shippingAddress?: string;
  phone?: string;
  governorate?: string;
  wilayat?: string;
  postalCode?: string;
  transferReceipt?: string | null;
  transferReceiptAvailable?: boolean;
  customerName?: string;
  customerEmail?: string;
  userId?: string;
  promoCode?: string | null;
  discountAmount?: number;
  shippingFee?: number;
};

export type ReviewStatus = "visible" | "hidden" | "pending";

export type Review = {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  moderationStatus: ReviewStatus;
  createdAt: string;
};

export type DiscountStatus = "Scheduled" | "Active" | "Expired" | "Disabled";

export type Discount = {
  id: string;
  code: string;
  percentage: number;
  categories: string[];
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
};

export type StoreSettings = {
  notifyEmail: string;
  notifyPhone: string;
  transferDetails: string;
};

export type CheckoutLanguage = "en" | "ar";

export type PromoPreview = {
  valid: boolean;
  message: string;
  code?: string;
  percentage?: number;
  eligibleSubtotal?: number;
  discountAmount?: number;
};
