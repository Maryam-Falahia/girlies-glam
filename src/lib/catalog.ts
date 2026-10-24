import type { Product } from "@/lib/types";

const names: Record<string, string[]> = {
  "Cotton Makhwar": ["Lilac Cotton Makhwar", "Cloud Cotton Makhwar", "Heart Cotton Makhwar", "Sparkle Cotton Makhwar", "Butter Cotton Makhwar"],
  "Italy Silk Makhwar": ["Silk Rose Makhwar", "Silk Lavender Makhwar", "Silk Pearl Makhwar", "Silk Blossom Makhwar"],
  "Digital Cotton Liberty": ["Liberty Bloom Makhwar", "Liberty Garden Makhwar", "Liberty Petal Makhwar", "Liberty Sky Makhwar", "Liberty Rose Makhwar"],
  "Cotton Amoudi Makhwar": ["Amoudi Blush Makhwar", "Amoudi Lilac Makhwar", "Amoudi Cream Makhwar", "Amoudi Berry Makhwar", "Amoudi Sky Makhwar"],
  "Makhwar Scarfs": ["Makhwar Scarf — Jewel Tones", "Makhwar Scarf — Soft Pastels"],
  Earrings: ["Pearl Drop Earrings", "Crystal Hoop Earrings"],
  "Full Sets": ["Rose Gold Full Set", "Pearl Glow Full Set"],
  Necklace: ["Layered Pearl Necklace", "Heart Charm Necklace"],
  Bracelet: ["Blush Tennis Bracelet", "Dainty Charm Bracelet"],
  Rings: ["Petal Stack Ring", "Twinkle Signet Ring"],
};

const swatches = ["#F6A6C8", "#D9A8DE", "#F7D9A0", "#B8C9F0", "#F5B8C8", "#E7B8E9", "#FCE29B", "#C4A6E0"];
const jewelSwatch: Record<string, string> = { Silver: "#d9d9e2", Gold: "#e8b04b", "Golden Rose": "#e8a0b4" };
const jewelry = new Set(["Earrings", "Full Sets", "Necklace", "Bracelet", "Rings"]);

const photos: Record<string, { image: string; extra?: { colorway: string; image: string; swatch: string } }> = {
  "Liberty Bloom Makhwar": { image: "/products/digital-cotton-liberty-pink-green.jpeg", extra: { colorway: "Collage", image: "/products/digital-cotton-liberty-collage.jpeg", swatch: "#d7b4e4" } },
  "Liberty Garden Makhwar": { image: "/products/digital-cotton-liberty-teal-lavender.jpeg" },
  "Liberty Petal Makhwar": { image: "/products/digital-cotton-liberty-rose-lavender.jpeg" },
  "Liberty Sky Makhwar": { image: "/products/digital-cotton-liberty-champagne-gold.jpeg" },
  "Liberty Rose Makhwar": { image: "/products/digital-cotton-liberty-blush-berry.jpeg" },
  "Makhwar Scarf — Jewel Tones": { image: "/products/makhwar-scarfs-jewel-tones.jpeg" },
  "Makhwar Scarf — Soft Pastels": { image: "/products/makhwar-scarfs-soft-pastels.jpeg" },
};

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildProducts(): Product[] {
  const products: Product[] = [];
  let idx = 1;
  Object.keys(names).forEach((cat) => {
    names[cat].forEach((name, i) => {
      const rnd = seedRandom(idx * 37 + i * 7);
      const base = 22 + Math.floor(rnd() * 58);
      const omrPrice = +(base * 0.385).toFixed(3);
      const onSale = rnd() > 0.7;
      const photo = photos[name];
      const isJewel = jewelry.has(cat);
      const product: Product = {
        id: `PRD-${String(idx).padStart(3, "0")}`,
        name,
        category: cat,
        price: omrPrice,
        compareAt: onSale ? +((base + 12 + Math.floor(rnd() * 20)) * 0.385).toFixed(3) : null,
        colorway: isJewel ? "Silver" : ["Blush", "Lilac", "Cream", "Berry", "Sky"][Math.floor(rnd() * 5)],
        swatch: isJewel ? jewelSwatch.Silver : swatches[idx % swatches.length],
        sizes: cat === "Rings" ? ["6", "7", "8", "9"] : isJewel || cat === "Makhwar Scarfs" ? ["One Size"] : ["Small", "Medium", "Large", "X Large"],
        isNew: rnd() > 0.75,
        isBestseller: rnd() > 0.8,
        isVisible: true,
        rating: +(3.8 + rnd() * 1.2).toFixed(1),
        reviews: Math.floor(20 + rnd() * 480),
        description: `The ${name.toLowerCase()} is cut for movement and made to be photographed. Soft-touch fabric, true-to-size fit, and just enough sparkle for whatever the day calls for.`,
        imageUrl: photo?.image ?? null,
        variants: isJewel
          ? ["Gold", "Golden Rose"].map((color) => ({ colorway: color, swatch: jewelSwatch[color], imageUrl: photo?.image ?? null }))
          : photo?.extra
            ? [{ colorway: photo.extra.colorway, swatch: photo.extra.swatch, imageUrl: photo.extra.image }]
            : [],
      };
      products.push(product);
      idx += 1;
    });
  });
  return products;
}

export const PRODUCTS: Product[] = buildProducts();

export function swatchFor(color: string, index = 0) {
  return jewelSwatch[color] || swatches[index % swatches.length];
}
