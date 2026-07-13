import { ImageResponse } from "next/og";

export const alt = "Andre Huizen — Scientific machine learning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#11110f", color: "#f3f0e6", padding: "72px", flexDirection: "column", justifyContent: "space-between", fontFamily: "sans-serif" }}><div style={{ display: "flex", fontSize: 28, letterSpacing: "-1px" }}>AH · ANDRE HUIZEN</div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", color: "#c5ff42", fontSize: 20, textTransform: "uppercase", letterSpacing: "4px", marginBottom: "22px" }}>Scientific machine learning</div><div style={{ display: "flex", fontSize: 76, letterSpacing: "-4px", lineHeight: 1.02, maxWidth: "980px" }}>Learning the rules inside complex systems.</div></div><div style={{ display: "flex", fontSize: 20, color: "#a7a69e" }}>PDEs · Physics-informed learning · Numerical simulation</div></div>, size);
}
