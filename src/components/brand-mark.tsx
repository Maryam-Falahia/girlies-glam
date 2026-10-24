import { Sparkles } from "lucide-react";

export function BrandMark({ variant, dark = false }: { variant: "auth" | "nav" | "footer"; dark?: boolean }) {
  return (
    <span className={`gg-logo gg-logo-${variant}${dark ? " gg-logo-dark" : ""}`} aria-label="Girlies Glam" role="img">
      <span className="gg-logo-sparkle gg-logo-sparkle-left" aria-hidden="true"><Sparkles /></span>
      <span className="gg-logo-words">
        <span className="gg-logo-script">Girlies</span>
        <span className="sub">Glam</span>
      </span>
      <span className="gg-logo-sparkle gg-logo-sparkle-right" aria-hidden="true"><Sparkles /></span>
    </span>
  );
}
