import { ImageResponse } from "next/og";

export const alt = "IELTSAnywhere — AI-powered IELTS practice with instant band scores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #8b5cf6 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 44 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "#ffffff",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            IA
          </div>
          <div style={{ fontSize: 46, fontWeight: 800 }}>IELTSAnywhere</div>
        </div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, maxWidth: 940 }}>
          Practice IELTS with instant AI band scores
        </div>
        <div style={{ fontSize: 32, opacity: 0.92, marginTop: 28, maxWidth: 900 }}>
          Listening · Reading · Writing · Speaking — realistic tests and detailed feedback.
        </div>
      </div>
    ),
    { ...size }
  );
}
