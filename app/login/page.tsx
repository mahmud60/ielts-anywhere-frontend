"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const GRAD = "linear-gradient(135deg,#6366f1 0%,#7c3aed 60%,#8b5cf6 100%)";
const PRIMARY = "#6366f1";
const BORDER = "#e2e8f0";

const FEATURES = [
  { icon: "📖", label: "Reading", desc: "Full-length Academic & General passages" },
  { icon: "🎧", label: "Listening", desc: "Authentic audio with instant scoring" },
  { icon: "✍️", label: "Writing", desc: "AI-graded Task 1 & 2 with feedback" },
  { icon: "🎙️", label: "Speaking", desc: "Conversational AI examiner, anytime" },
];

const googleProvider = new GoogleAuthProvider();

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, router, user]);

  const afterAuth = async () => {
    try { await api.getMe(); } catch {}
    router.replace("/dashboard");
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!auth) { setError("Firebase is not configured."); return; }
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await afterAuth();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)/, "")
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      if (!auth) { setError("Firebase is not configured."); return; }
      await signInWithPopup(auth, googleProvider);
      await afterAuth();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)/, "")
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1.5px solid ${focusedField === field ? PRIMARY : BORDER}`,
    fontSize: 14,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s",
    boxShadow: focusedField === field ? `0 0 0 3px rgba(99,102,241,.12)` : "none",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "var(--font-inter),system-ui,sans-serif",
      background: "#f6f7fb",
    }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .login-fadein{animation:fadeUp .4s ease both}
        @media(max-width:820px){.login-left{display:none!important}.login-right{padding:32px 20px!important}}
      `}</style>

      {/* ── Left panel ── */}
      <div
        className="login-left"
        style={{
          width: "46%",
          flexShrink: 0,
          background: GRAD,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 52px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: "rgba(255,255,255,.2)",
            border: "1px solid rgba(255,255,255,.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 16, color: "#fff",
          }}>
            IA
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-.02em" }}>
            IELTS<span style={{ opacity: .75 }}>Anywhere</span>
          </span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-.02em" }}>
            Your IELTS<br />preparation,<br />supercharged.
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", margin: 0, lineHeight: 1.6, maxWidth: 320 }}>
            AI-powered practice for all four modules — with real-time feedback and instant band scores.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: "rgba(255,255,255,.15)",
                border: "1px solid rgba(255,255,255,.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{f.label}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)", marginTop: 1 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{
          marginTop: 48, display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,.12)", borderRadius: 99, padding: "8px 14px",
          alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.9)", fontWeight: 600 }}>
            ✦ Estimated IELTS band score after every test
          </span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="login-right"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div className="login-fadein" style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile brand (hidden on desktop) */}
          <div style={{ display: "none" }} className="login-mobile-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>IA</div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>IELTS<span style={{ color: PRIMARY }}>Anywhere</span></span>
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "#fff",
            borderRadius: 20,
            border: `1px solid ${BORDER}`,
            padding: "36px 36px 32px",
            boxShadow: "0 4px 32px rgba(15,23,42,.07)",
          }}>
            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-.02em" }}>
                {isRegister ? "Create your account" : "Welcome back"}
              </h2>
              <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
                {isRegister
                  ? "Join thousands of IELTS candidates preparing smarter."
                  : "Sign in to continue your preparation."}
              </p>
            </div>

            {/* Firebase warning */}
            {!isFirebaseConfigured && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#dc2626", lineHeight: 1.5 }}>
                Firebase env vars are missing. Copy <code style={{ fontSize: 12 }}>.env.example</code> to{" "}
                <code style={{ fontSize: 12 }}>.env.local</code> and add{" "}
                <code style={{ fontSize: 12 }}>NEXT_PUBLIC_FIREBASE_*</code>.
              </div>
            )}

            {/* Google button */}
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading || !isFirebaseConfigured}
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 10,
                background: "#fff", border: `1.5px solid ${BORDER}`,
                color: "#0f172a", fontWeight: 600, fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                transition: "background .15s, border-color .15s",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            {/* Email/password form */}
            <form onSubmit={submit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  style={inputStyle("email")}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Password
                </label>
                <input
                  style={inputStyle("password")}
                  type="password"
                  placeholder={isRegister ? "At least 6 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </div>

              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "10px 13px", marginBottom: 16,
                  fontSize: 13, color: "#dc2626", lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isFirebaseConfigured}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10,
                  background: loading ? "#a5b4fc" : GRAD,
                  border: "none", color: "#fff",
                  fontWeight: 700, fontSize: 15,
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,.35)",
                  transition: "opacity .15s, box-shadow .15s",
                  letterSpacing: "-.01em",
                }}
              >
                {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              </button>
            </form>

            {/* Toggle */}
            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "#64748b", marginBottom: 0 }}>
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setIsRegister((r) => !r); setError(""); }}
                style={{
                  background: "none", border: "none", color: PRIMARY,
                  fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 0,
                }}
              >
                {isRegister ? "Sign in" : "Register for free"}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
