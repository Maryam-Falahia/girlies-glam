"use client";

import { Clock, MessageCircle, Ruler, Star, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shippingQuote } from "@/lib/constants";
import { useStore } from "@/lib/store";

export function SizeGuide({ sizes, onClose }: { sizes: string[]; onClose: () => void }) {
  const rows = [
    ["Small", "84–88", "66–70", "90–94"],
    ["Medium", "89–94", "71–76", "95–100"],
    ["Large", "95–100", "77–82", "101–106"],
    ["X Large", "101–108", "83–90", "107–114"],
  ].filter(([size]) => sizes.includes(size));
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }} title="Size guide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div>
          <div className="gg-filter-title" style={{ fontSize: 18 }}>Size Guide</div>
          <p style={{ margin: "6px 0 0", color: "var(--text2)", fontSize: 13 }}>Measurements are in centimeters. Measure over light clothing for the best fit.</p>
        </div>
        <Button variant="icon" onClick={onClose} aria-label="Close size guide"><X size={18} /></Button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Size", "Bust", "Waist", "Hip"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "9px 8px", borderBottom: "1px solid var(--border)", color: "var(--plum)" }}>{heading}</th>)}</tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} style={{ padding: "9px 8px", borderBottom: "1px solid var(--border)", color: "var(--text2)" }}>{cell}</td>)}</tr>) : <tr><td colSpan={4} style={{ padding: "9px 8px", color: "var(--text2)" }}>This piece is {sizes.join(", ")}.</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text2)", fontSize: 12, marginTop: 14 }}>
        <Ruler size={15} color="var(--pink-deep)" /> If you are between sizes, choose the larger size for a relaxed fit.
      </div>
    </Dialog>
  );
}

export function DeliveryPromise({ governorate }: { governorate?: string }) {
  const quote = shippingQuote(governorate || "");
  const eta = governorate === "Muscat" ? "1–2 days" : governorate ? `${quote.etaMinDays}–${quote.etaMaxDays} days` : "2–5 days across Oman";
  return <div style={{ display: "flex", gap: 9, alignItems: "center" }}><Clock size={16} /> Estimated delivery: {eta}</div>;
}

export function ProductReviews({ productId }: { productId: string }) {
  const { reviews, user, submitReview } = useStore();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const mine = user ? reviews.find((review) => review.productId === productId && review.userId === user.id) : undefined;
  const visible = reviews.filter((review) => review.productId === productId && review.moderationStatus === "visible");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (body.trim().length < 3) {
      setMessage("Please write at least a few words about this product.");
      return;
    }
    setSubmitting(true);
    const result = await submitReview(productId, rating, title, body);
    setMessage(result);
    if (result.startsWith("Thank you")) {
      setTitle("");
      setBody("");
      setRating(5);
    }
    setSubmitting(false);
  };

  return (
    <section style={{ marginTop: 44, borderTop: "1px solid var(--border)", paddingTop: 28 }}>
      <div className="gg-section-head">
        <div>
          <div className="gg-section-title">Customer reviews</div>
          <div className="gg-section-sub">Share your experience with the Girlies Glam community</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 22, alignItems: "start" }}>
        {mine ? (
          <div className="gg-panel" style={{ padding: 20 }}>
            <div className="gg-filter-title" style={{ marginBottom: 10 }}>Your review</div>
            <p role="status" style={{ color: mine.moderationStatus === "hidden" ? "#9a3d5d" : mine.moderationStatus === "pending" ? "var(--text2)" : "#3a8a5c", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {mine.moderationStatus === "hidden"
                ? "Your review is currently hidden and is not visible to other customers. Please contact us if you think this was a mistake."
                : mine.moderationStatus === "pending"
                  ? "Your review is waiting for store approval. It will appear here once it is approved."
                  : "Your review is live and visible to other customers."}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="gg-panel" style={{ padding: 20 }}>
            <div className="gg-filter-title" style={{ marginBottom: 12 }}>Write a review</div>
            <div style={{ display: "flex", gap: 3, marginBottom: 14 }} aria-label={`Rating: ${rating} out of 5`}>
              {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} onClick={() => setRating(value)} style={{ color: "#e8b04b", padding: 2 }}><Star size={20} fill={value <= rating ? "currentColor" : "none"} /></button>)}
            </div>
            <Label htmlFor={`review-title-${productId}`}>Review title <span style={{ color: "var(--text3)", fontWeight: 400 }}>(optional)</span></Label>
            <Input id={`review-title-${productId}`} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What stood out?" />
            <Label htmlFor={`review-body-${productId}`}>Your review</Label>
            <Textarea id={`review-body-${productId}`} rows={5} maxLength={2000} required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell other customers about the fit, quality, and finish." />
            <Button type="submit" size="wide" style={{ marginTop: 12 }} disabled={submitting}>{submitting ? "Posting..." : "Post review"}</Button>
            {message && <div role="status" style={{ color: message.includes("Thank you") ? "#3a8a5c" : "#9a3d5d", fontSize: 12.5, lineHeight: 1.5, marginTop: 10 }}>{message}</div>}
          </form>
        )}
        <div style={{ display: "grid", gap: 10 }}>
          {visible.length ? visible.map((review) => (
            <article key={review.id} className="gg-panel" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 2, color: "#e8b04b" }}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={14} fill={value <= review.rating ? "currentColor" : "none"} />)}</div>
                  {review.title && <div style={{ fontWeight: 700, color: "var(--plum)", marginTop: 7 }}>{review.title}</div>}
                </div>
                <div style={{ color: "var(--text3)", fontSize: 11 }}>{new Date(review.createdAt).toLocaleDateString()}</div>
              </div>
              <p style={{ color: "var(--text2)", lineHeight: 1.6, fontSize: 13.5, margin: "10px 0 7px" }}>{review.body}</p>
              <div style={{ color: "var(--plum)", fontSize: 12, fontWeight: 600 }}>— {review.customerName}</div>
            </article>
          )) : <div className="gg-empty" style={{ padding: 24 }}>No reviews yet. Be the first customer to share your thoughts.</div>}
        </div>
      </div>
    </section>
  );
}

export function WhatsAppSupport() {
  const [open, setOpen] = useState(false);
  const message = encodeURIComponent("Hello Girlies Glam, I need help with my order or product.");
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 20 }}>
      {open && (
        <div className="gg-panel" style={{ padding: 14, marginBottom: 10, width: 220, boxShadow: "0 12px 30px rgba(38,20,35,.15)" }}>
          <div style={{ fontWeight: 700, color: "var(--plum)", fontSize: 13 }}>Need help choosing?</div>
          <div style={{ color: "var(--text2)", fontSize: 12, lineHeight: 1.5, margin: "5px 0 10px" }}>Message us about sizing, products, or an existing order.</div>
          <a className="gg-btn" href={`https://wa.me/96879162199?text=${message}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", fontSize: 12 }}>Open WhatsApp</a>
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} aria-label="Contact Girlies Glam on WhatsApp" style={{ width: 52, height: 52, border: 0, borderRadius: "50%", background: "#25D366", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 8px 20px rgba(37,211,102,.32)" }}>
        <MessageCircle size={23} />
      </button>
    </div>
  );
}
