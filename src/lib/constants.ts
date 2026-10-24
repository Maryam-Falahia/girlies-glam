import type { CheckoutLanguage, Discount } from "@/lib/types";

export const ORDER_STATUSES = ["Submitted", "In Process", "Packed", "In Delivery", "Received"] as const;
export const SHIPPING_FEE = 2;
export const JEWELLERY_COLORS = ["Silver", "Gold", "Golden Rose"];
export const PRODUCT_SIZE_OPTIONS = ["One Size", "Small", "Medium", "Large", "X Large"];
export const clothingCategories = ["Cotton Makhwar", "Italy Silk Makhwar", "Digital Cotton Liberty", "Cotton Amoudi Makhwar", "Makhwar Scarfs"];
export const jewelryCategories = ["Earrings", "Full Sets", "Necklace", "Bracelet", "Rings"];
export const categories = [...clothingCategories, ...jewelryCategories];

export const categoryEmoji: Record<string, string> = {
  "Cotton Makhwar": "🧵",
  "Italy Silk Makhwar": "✨",
  "Digital Cotton Liberty": "🌸",
  "Cotton Amoudi Makhwar": "♡",
  "Makhwar Scarfs": "🧣",
  Earrings: "💎",
  "Full Sets": "👑",
  Necklace: "📿",
  Bracelet: "⭐",
  Rings: "💍",
};

export const categoryBlurb: Record<string, string> = {
  "Cotton Makhwar": "Soft, breathable comfort",
  "Italy Silk Makhwar": "Luxe silk finish",
  "Digital Cotton Liberty": "Prints made to bloom",
  "Cotton Amoudi Makhwar": "Lightweight everyday glam",
  "Makhwar Scarfs": "Embroidered color for every look",
  Earrings: "Statement studs and hoops",
  "Full Sets": "Matching sets, effortless glam",
  Necklace: "Layer-worthy pieces",
  Bracelet: "Delicate arm candy",
  Rings: "Little details that shine",
};

export const OMAN_GOVERNORATES = ["Muscat", "Dhofar", "North Al Batinah", "South Al Batinah", "Al Dakhiliyah", "North Al Sharqiyah", "South Al Sharqiyah", "Al Wusta", "Al Dhahirah", "Musandam", "Al Buraimi"];

export const OMAN_WILAYATS: Record<string, string[]> = {
  Muscat: ["Muscat", "Muttrah", "Bawshar", "Seeb", "Al Amerat", "Qurayyat"],
  Dhofar: ["Salalah", "Taqah", "Mirbat", "Thumrait", "Muqshin", "Shalim and the Hallaniyat Islands", "Sadah", "Rakhyut", "Dhalkut", "Al Mazyunah", "Maqshan"],
  "North Al Batinah": ["Sohar", "Shinas", "Liwa", "Saham", "Al Khaburah", "Al Suwaiq"],
  "South Al Batinah": ["Rustaq", "Al Awabi", "Nakhal", "Wadi Al Maawil", "Al Musannah", "Barka"],
  "Al Dakhiliyah": ["Nizwa", "Bahla", "Manah", "Al Hamra", "Adam", "Izki", "Samail", "Bidbid"],
  "North Al Sharqiyah": ["Ibra", "Al Mudaybi", "Bidiyah", "Al Qabil", "Wadi Bani Khalid", "Dima Wa'tayeen", "Sinaw"],
  "South Al Sharqiyah": ["Sur", "Jalan Bani Bu Ali", "Jalan Bani Bu Hassan", "Al Kamil Wal Wafi", "Masirah"],
  "Al Wusta": ["Haima", "Mahout", "Duqm", "Al Jazir"],
  "Al Dhahirah": ["Ibri", "Yanqul", "Dhank"],
  Musandam: ["Khasab", "Bukha", "Dibba", "Madha"],
  "Al Buraimi": ["Al Buraimi", "Mahdah", "Al Sunaynah"],
};

export const checkoutCopy = {
  en: {
    language: "Language", english: "English", arabic: "العربية", backShop: "← Back to shop", checkout: "Checkout",
    paymentNotice: "Online card and Apple Pay checkout is not connected for Oman yet. You can still submit your order and we’ll follow up with payment instructions.",
    shippingAddress: "Delivery Details", fullName: "First Name", postalCode: "Postal Code",
    phone: "Phone Number", phonePlaceholder: "8-digit number", governorate: "Governorate", selectGovernorate: "Select Governorate", wilayat: "Wilayat", selectWilayat: "Select Wilayat",
    transferPayment: "Bank / Phone Transfer Details", transferNotConfigured: "Transfer details will be added by the store soon.",
    invalidReceipt: "Upload a JPG, PNG, WEBP image or PDF smaller than 5 MB that clearly shows the bank or phone-transfer receipt.",
    saving: "Saving order...", submit: "Make Payment", noCharge: "All transactions are secure and encrypted.",
    paymentReceipt: "Payment Receipt", paymentReceiptRequired: "To confirm the order, please upload the payment receipt here.",
    summary: "Order Summary", subtotal: "Subtotal", shipping: "Shipping", total: "Total",
    invalidPhone: "Enter a valid Oman phone number with exactly 8 digits.", failedOrder: "Unable to place order",
    received: "Order received!", followUp: "Our team will follow up with payment instructions for Oman.",
    backOrders: "← Back to My Orders", orderNumber: "Order Number", date: "Date", shippingTo: "Shipping To", items: "Items",
    print: "Print / Save as PDF", continueShopping: "Continue Shopping", backToOrders: "Back to My Orders",
    promoCode: "Promo code", promoPlaceholder: "Enter your code", applyPromo: "Apply code", applyingPromo: "Checking...", discount: "Discount", promoApplied: "Code applied", promoHint: "Savings apply to eligible items only.",
  },
  ar: {
    language: "اللغة", english: "English", arabic: "العربية", backShop: "العودة إلى المتجر ←", checkout: "إتمام الطلب",
    paymentNotice: "الدفع الإلكتروني بالبطاقة وApple Pay غير متصل بعد في عُمان. يمكنك إرسال طلبك وسنتواصل معك بتعليمات الدفع.",
    shippingAddress: "بيانات التوصيل", fullName: "الاسم الأول", postalCode: "الرمز البريدي",
    phone: "رقم الهاتف", phonePlaceholder: "رقم من 8 أرقام", governorate: "المحافظة", selectGovernorate: "اختر المحافظة", wilayat: "الولاية", selectWilayat: "اختر الولاية",
    transferPayment: "تفاصيل التحويل البنكي / عبر الهاتف", transferNotConfigured: "ستتم إضافة تفاصيل التحويل من المتجر قريباً.",
    invalidReceipt: "ارفع صورة JPG أو PNG أو WEBP أو ملف PDF بحجم أقل من 5 ميجابايت ويظهر فيه بوضوح إيصال التحويل البنكي أو عبر الهاتف.",
    saving: "جارٍ حفظ الطلب...", submit: "إجراء الدفع", noCharge: "جميع المعاملات آمنة ومشفرة.",
    paymentReceipt: "إيصال الدفع", paymentReceiptRequired: "لتأكيد الطلب، يرجى رفع إيصال الدفع هنا.",
    summary: "ملخص الطلب", subtotal: "المجموع الفرعي", shipping: "التوصيل", total: "الإجمالي",
    invalidPhone: "أدخل رقم هاتف عُمانيًا صحيحًا مكونًا من 8 أرقام.", failedOrder: "تعذر إرسال الطلب",
    received: "تم استلام طلبك!", followUp: "سيتواصل فريقنا معك لإرسال تعليمات الدفع في عُمان.",
    backOrders: "العودة إلى طلباتي ←", orderNumber: "رقم الطلب", date: "التاريخ", shippingTo: "التوصيل إلى", items: "المنتجات",
    print: "طباعة / حفظ بصيغة PDF", continueShopping: "متابعة التسوق", backToOrders: "العودة إلى طلباتي",
    promoCode: "رمز الخصم", promoPlaceholder: "أدخل الرمز", applyPromo: "تطبيق الرمز", applyingPromo: "جارٍ التحقق...", discount: "الخصم", promoApplied: "تم تطبيق الرمز", promoHint: "يُطبق الخصم على المنتجات المؤهلة فقط.",
  },
} as const satisfies Record<CheckoutLanguage, Record<string, string>>;

export function discountStatus(discount: Pick<Discount, "isEnabled" | "startsAt" | "endsAt">) {
  if (!discount.isEnabled) return "Disabled" as const;
  const now = Date.now();
  if (now < new Date(discount.startsAt).getTime()) return "Scheduled" as const;
  if (now > new Date(discount.endsAt).getTime()) return "Expired" as const;
  return "Active" as const;
}

export const defaultSettings = {
  notifyEmail: "demo@girliesglam.com",
  notifyPhone: "+96879162199",
  transferDetails: "Bank: Bank Muscat\nAccount name: Girlies Glam\nAccount number: 0300 0000 0000\nPhone transfer: +968 7916 2199",
};

export function defaultDiscounts(): Discount[] {
  return [{
    id: "disc-glam10",
    code: "GLAM10",
    percentage: 10,
    categories: [...categories],
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-12-31T23:59:00.000Z",
    isEnabled: true,
  }];
}

export function shippingQuote(governorate: string, fee = SHIPPING_FEE) {
  if (governorate === "Muscat") return { fee, etaMinDays: 1, etaMaxDays: 2 };
  return { fee, etaMinDays: 2, etaMaxDays: 5 };
}

export function detectReceiptMime(bytes: Uint8Array): string | null {
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (bytes.length >= 12 && startsWith([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}
