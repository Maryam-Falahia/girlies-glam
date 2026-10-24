import Link from "next/link";

export default function NotFound() {
  return (
    <div className="gg-container gg-section">
      <div className="gg-empty">
        <div className="gg-section-title">This page wandered off</div>
        <p style={{ margin: "8px 0 18px" }}>The piece you asked for isn’t in the collection.</p>
        <Link className="gg-btn" href="/">Back home</Link>
      </div>
    </div>
  );
}
