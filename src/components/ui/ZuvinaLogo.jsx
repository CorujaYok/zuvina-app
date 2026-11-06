import zuvinaOwl from "../../assets/zuvina-owl.png";

// ============================================================
// ZUVINA — LOGO OFICIAL
// ============================================================

export default function ZuvinaLogo({ width = 38, height = 38 }) {
  return (
    <img
      src={zuvinaOwl}
      alt="Zuvina"
      width={width}
      height={height}
      className="zuvina-logo-image"
      style={{
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 0 5px rgba(171, 85, 247, 0.65))",
      }}
    />
  );
}