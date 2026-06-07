"use client";

import { useEffect, useMemo } from "react";

const STYLE_ID = "pet-loader-style";
const DEFAULT_ACCENT = "#6366f1";

function buildCss(accent) {
  return `
@keyframes pet-bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-9px) rotate(1.5deg)}}
@keyframes pet-ring{to{transform:rotate(360deg)}}
@keyframes pet-ring-rev{to{transform:rotate(-360deg)}}
@keyframes pet-blink{0%,92%,100%{transform:scaleY(0.06)}96%{transform:scaleY(1)}}
@keyframes pet-shadow{0%,100%{transform:scaleX(1);opacity:.20}50%{transform:scaleX(.62);opacity:.10}}
@keyframes pet-z{0%{transform:translate(0,0) scale(.6);opacity:0}25%{opacity:1}100%{transform:translate(14px,-30px) scale(1);opacity:0}}
@keyframes pet-dots{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.pet-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:var(--font-inter),system-ui,sans-serif;}
.pet-full{min-height:60vh;width:100%;}
.pet-fixed{position:fixed;inset:0;z-index:50;background:#f6f7fb;}
.pet-stage{position:relative;display:flex;align-items:center;justify-content:center;}
.pet-ring{position:absolute;border-radius:50%;border:3px dashed #c7d2fe;animation:pet-ring 7s linear infinite;}
.pet-ring2{position:absolute;border-radius:50%;border:2px dotted #ddd6fe;animation:pet-ring-rev 9s linear infinite;}
.pet-owl{animation:pet-bob 2s ease-in-out infinite;transform-origin:50% 70%;}
.pet-lid{animation:pet-blink 3.4s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
.pet-shadow{border-radius:50%;background:#4f46e5;animation:pet-shadow 2s ease-in-out infinite;}
.pet-z{position:absolute;font-weight:800;color:#a5b4fc;animation:pet-z 2.6s ease-in-out infinite;}
.pet-label{font-size:14px;color:#64748b;font-weight:500;text-align:center;}
.pet-label b{color:#6366f1;font-weight:700;}
.pet-dots{display:inline-flex;gap:4px;align-items:center;}
.pet-dot{width:5px;height:5px;border-radius:50%;background:${accent};animation:pet-dots 1.3s ease-in-out infinite;}
.pet-dot:nth-child(2){animation-delay:.18s}
.pet-dot:nth-child(3){animation-delay:.36s}
.pet-label-accent{color:${accent}!important;}
@media (prefers-reduced-motion: reduce){
 .pet-owl,.pet-ring,.pet-ring2,.pet-lid,.pet-shadow,.pet-z,.pet-dot{animation:none!important}
}
`;
}

function useLoaderStyles(accent) {
  const css = useMemo(() => buildCss(accent), [accent]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }, [css]);
}

function Owl({ size = 128 }) {
  return (
    <svg className="pet-owl" width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pet-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c6cf5" />
          <stop offset="1" stopColor="#5b4bd6" />
        </linearGradient>
        <linearGradient id="pet-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef0ff" />
          <stop offset="1" stopColor="#dcd9ff" />
        </linearGradient>
      </defs>

      {/* ear tufts */}
      <path d="M40 30 L34 8 L56 24 Z" fill="#5b4bd6" />
      <path d="M88 30 L94 8 L72 24 Z" fill="#5b4bd6" />

      {/* body */}
      <ellipse cx="64" cy="66" rx="42" ry="46" fill="url(#pet-body)" />
      {/* belly */}
      <ellipse cx="64" cy="78" rx="26" ry="30" fill="url(#pet-belly)" />

      {/* wings */}
      <path d="M24 60 q-6 22 8 38 q4 -22 0 -40 Z" fill="#5141c9" />
      <path d="M104 60 q6 22 -8 38 q-4 -22 0 -40 Z" fill="#5141c9" />

      {/* eye discs */}
      <circle cx="48" cy="56" r="18" fill="#fff" />
      <circle cx="80" cy="56" r="18" fill="#fff" />
      {/* pupils */}
      <circle cx="51" cy="58" r="8" fill="#1e1b4b" />
      <circle cx="83" cy="58" r="8" fill="#1e1b4b" />
      <circle cx="48" cy="54" r="2.6" fill="#fff" />
      <circle cx="80" cy="54" r="2.6" fill="#fff" />

      {/* blinking eyelids */}
      <circle className="pet-lid" cx="48" cy="56" r="18.5" fill="#6a5af0" />
      <circle className="pet-lid" cx="80" cy="56" r="18.5" fill="#6a5af0" style={{ animationDelay: "0.12s" }} />

      {/* beak */}
      <path d="M64 64 L57 73 L71 73 Z" fill="#fbbf24" />
      <path d="M64 73 L59 78 L69 78 Z" fill="#f59e0b" />

      {/* feet */}
      <path d="M52 110 l-6 8 M52 110 l0 9 M52 110 l6 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <path d="M76 110 l-6 8 M76 110 l0 9 M76 110 l6 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function PetLoader({
  label = "Loading",
  size = 128,
  fullScreen = false,
  fixed = false,
  className = "",
  accent = DEFAULT_ACCENT,
  bg,
}) {
  useLoaderStyles(accent);
  const stage = size + 56;

  const content = (
    <div className={`pet-wrap ${className}`}>
      <div className="pet-stage" style={{ width: stage, height: stage }}>
        <span className="pet-ring" style={{ width: stage, height: stage }} />
        <span className="pet-ring2" style={{ width: stage - 18, height: stage - 18 }} />
        <span className="pet-z" style={{ fontSize: size * 0.16, left: "62%", top: "8%" }}>z</span>
        <span className="pet-z" style={{ fontSize: size * 0.12, left: "70%", top: "20%", animationDelay: "1.1s" }}>z</span>
        <Owl size={size} />
        <span className="pet-shadow" style={{ position: "absolute", bottom: -2, width: size * 0.5, height: size * 0.1 }} />
      </div>
      {label && (
        <div className="pet-label">
          <b className="pet-label-accent">Warda</b> {label}
          <span className="pet-dots" style={{ marginLeft: 4 }}>
            <span className="pet-dot" /><span className="pet-dot" /><span className="pet-dot" />
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen || fixed) {
    return (
      <div
        className={`pet-wrap ${fixed ? "pet-fixed" : "pet-full"}`}
        style={bg ? { background: bg } : undefined}
      >
        {content}
      </div>
    );
  }
  return content;
}
