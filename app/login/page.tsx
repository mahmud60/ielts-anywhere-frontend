"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

const s = {
  wrap: { maxWidth: 380, margin: "80px auto", padding: "0 20px" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 28 },
  h1: { fontSize: 22, fontWeight: 600, marginBottom: 4 },
  sub: { color: "#6b7280", fontSize: 14, marginBottom: 24 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const },
  btn: { width: "100%", padding: "11px", borderRadius: 8, background: "#0ea5e9", border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  googleBtn: { width: "100%", padding: "11px", borderRadius: 8, background: "#fff", border: "1px solid #d1d5db", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  divider: { display: "flex", alignItems: "center", gap: 10, margin: "16px 0" },
  dividerLine: { flex: 1, height: 1, background: "#e5e7eb" },
  dividerText: { color: "#9ca3af", fontSize: 12 },
  err: { color: "#ef4444", fontSize: 13, marginBottom: 12 },
  toggle: { textAlign: "center" as const, marginTop: 16, fontSize: 13, color: "#6b7280" },
  link: { color: "#0ea5e9", cursor: "pointer", background: "none", border: "none", fontSize: 13 },
};

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const afterAuth = async () => {
    await api.getMe();
    router.push("/tests");
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await afterAuth();
    } catch (err) {
        if (err instanceof Error) {
          setError(
            err.message
              .replace("Firebase: ", "")
              .replace(/\s*\(auth\/.*\)/, "")
          );
        } else {
          setError("Something went wrong");
        }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      await afterAuth();
    } catch (err) {
        if (err instanceof Error) {
          setError(
            err.message
              .replace("Firebase: ", "")
              .replace(/\s*\(auth\/.*\)/, "")
          );
        } else {
          setError("Something went wrong");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.h1}>{isRegister ? "Create account" : "Sign in"}</h1>
        <p style={s.sub}>IELTS Pro</p>

        {/* Google button */}
        <button style={s.googleBtn} onClick={signInWithGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>or</span>
          <div style={s.dividerLine} />
        </div>

        {/* Email/password form */}
        <form onSubmit={submit}>
          <input style={s.input} type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={s.err}>{error}</p>}
          <button style={s.btn} disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p style={s.toggle}>
          {isRegister ? "Have an account? " : "No account? "}
          <button style={s.link} onClick={() => { setIsRegister(r => !r); setError(""); }}>
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}