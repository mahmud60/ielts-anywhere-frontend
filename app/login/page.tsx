"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  Mic,
  PenLine,
  ShieldCheck,
  Target,
} from "lucide-react";

import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const PRIMARY = "#4f46e5";
const PRIMARY_DARK = "#312e81";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e6e8ef";

const MODULES = [
  { icon: BookOpen, label: "Reading", desc: "Timed passages and score review" },
  { icon: Headphones, label: "Listening", desc: "Audio practice with answer feedback" },
  { icon: PenLine, label: "Writing", desc: "Task feedback across IELTS criteria" },
  { icon: Mic, label: "Speaking", desc: "Practice sessions and AI evaluation" },
];

const googleProvider = new GoogleAuthProvider();

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z" />
    </svg>
  );
}

function cleanAuthError(err: unknown) {
  if (!(err instanceof Error)) return "Something went wrong. Please try again.";
  return err.message
    .replace("Firebase: ", "")
    .replace(/\s*\(auth\/.*\)/, "")
    .replace(/^Error:\s*/, "");
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, router, user]);

  const afterAuth = async () => {
    try {
      await api.getMe();
    } catch {
      // Profile sync can fail independently of Firebase auth; dashboard can retry.
    }
    router.replace("/dashboard");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!auth) {
        setError("Firebase is not configured. Add the Firebase environment variables and restart the app.");
        return;
      }
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await afterAuth();
    } catch (err) {
      setError(cleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      if (!auth) {
        setError("Firebase is not configured. Add the Firebase environment variables and restart the app.");
        return;
      }
      await signInWithPopup(auth, googleProvider);
      await afterAuth();
    } catch (err) {
      setError(cleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel = loading ? "Please wait" : isRegister ? "Create account" : "Sign in";

  return (
    <main className="login-shell">
      <style>{`
        .login-shell{
          min-height:100vh;
          display:grid;
          grid-template-columns:minmax(360px, .9fr) minmax(420px, 1.1fr);
          background:#f6f7fb;
          color:${INK};
          font-family:var(--font-inter),system-ui,sans-serif;
        }
        .login-brand-panel{
          background:${PRIMARY_DARK};
          color:#fff;
          padding:40px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          min-height:100vh;
        }
        .login-brand-row{display:flex;align-items:center;gap:12px;font-weight:850;font-size:18px;letter-spacing:-.02em}
        .login-mark{
          width:38px;height:38px;border-radius:11px;background:#fff;color:${PRIMARY_DARK};
          display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;
        }
        .login-copy{max-width:430px}
        .login-kicker{
          display:inline-flex;align-items:center;gap:8px;margin-bottom:18px;padding:7px 11px;
          border-radius:999px;background:rgba(255,255,255,.1);color:#ddd6fe;font-size:12.5px;font-weight:750;
        }
        .login-copy h1{font-size:36px;line-height:1.12;margin:0 0 16px;font-weight:900;letter-spacing:-.03em;text-wrap:balance}
        .login-copy p{margin:0;color:#ddd6fe;font-size:15px;line-height:1.65;max-width:390px}
        .login-modules{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:32px;max-width:430px}
        .login-module{
          border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:13px;
          background:rgba(255,255,255,.07);
        }
        .login-module svg{color:#c4b5fd}
        .login-module-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;margin-bottom:5px}
        .login-module-desc{font-size:12px;color:#c4b5fd;line-height:1.45}
        .login-trust{display:flex;align-items:center;gap:9px;color:#ddd6fe;font-size:12.5px;font-weight:650}
        .login-form-panel{display:flex;align-items:center;justify-content:center;padding:42px 24px}
        .login-card{width:100%;max-width:430px;background:#fff;border:1px solid ${BORDER};border-radius:16px;padding:34px}
        .login-mobile-brand{display:none;align-items:center;justify-content:center;gap:10px;margin-bottom:24px;font-weight:850}
        .login-mobile-mark{
          width:34px;height:34px;border-radius:10px;background:${PRIMARY};color:#fff;
          display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;
        }
        .login-heading{margin-bottom:24px}
        .login-heading h2{font-size:23px;line-height:1.2;margin:0 0 7px;font-weight:900;letter-spacing:-.025em;color:${INK}}
        .login-heading p{margin:0;color:${MUTED};font-size:13.5px;line-height:1.55}
        .login-button{
          width:100%;height:44px;border-radius:11px;border:none;display:inline-flex;align-items:center;justify-content:center;
          gap:9px;font-weight:800;font-size:14px;cursor:pointer;transition:background .16s,border-color .16s,box-shadow .16s,transform .16s,opacity .16s;
        }
        .login-button:focus-visible,.login-field:focus-within{outline:3px solid rgba(79,70,229,.18);outline-offset:2px}
        .login-button:active{transform:translateY(1px)}
        .login-button:disabled{cursor:not-allowed;opacity:.65;transform:none}
        .login-google{background:#fff;color:${INK};border:1px solid #dbe1ea}
        .login-google:hover:not(:disabled){background:#f8fafc;border-color:#cbd5e1}
        .login-primary{background:${PRIMARY};color:#fff}
        .login-primary:hover:not(:disabled){background:#4338ca;box-shadow:0 8px 16px rgba(79,70,229,.18)}
        .login-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:#94a3b8;font-size:12px;font-weight:650}
        .login-divider:before,.login-divider:after{content:"";height:1px;background:${BORDER};flex:1}
        .login-label{display:block;color:#334155;font-size:12.5px;font-weight:750;margin-bottom:7px}
        .login-field{
          min-height:44px;border:1px solid #dbe1ea;border-radius:11px;background:#fff;
          display:flex;align-items:center;gap:10px;padding:0 12px;transition:border-color .16s,outline .16s;
        }
        .login-field:focus-within{border-color:${PRIMARY}}
        .login-field svg{color:#64748b;flex-shrink:0}
        .login-field input{
          border:none;outline:none;background:transparent;width:100%;min-width:0;color:${INK};
          font-size:14px;font-family:inherit;padding:11px 0;
        }
        .login-field input::placeholder{color:#64748b}
        .login-password-toggle{
          border:none;background:transparent;color:#64748b;display:flex;align-items:center;justify-content:center;
          padding:4px;cursor:pointer;border-radius:7px;
        }
        .login-password-toggle:hover{background:#f1f5f9;color:${INK}}
        .login-alert{
          display:flex;gap:9px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;
          border-radius:11px;padding:11px 12px;font-size:13px;line-height:1.45;margin-bottom:16px;
        }
        .login-env{margin-bottom:18px}
        .login-toggle{margin:18px 0 0;text-align:center;color:${MUTED};font-size:13.5px}
        .login-link{border:none;background:transparent;color:${PRIMARY};font-weight:800;font-size:13.5px;cursor:pointer;padding:0}
        .login-footnote{margin:18px auto 0;text-align:center;color:#64748b;font-size:12px;line-height:1.55;max-width:360px}
        @media(max-width:900px){
          .login-shell{display:block;background:#fff}
          .login-brand-panel{display:none}
          .login-form-panel{min-height:100vh;padding:28px 18px;background:#f6f7fb}
          .login-card{padding:28px 22px}
          .login-mobile-brand{display:flex}
        }
        @media(max-width:420px){
          .login-form-panel{padding:18px 12px}
          .login-card{padding:24px 18px;border-radius:14px}
        }
        @media(prefers-reduced-motion: reduce){
          .login-button,.login-field{transition:none}
        }
      `}</style>

      <section className="login-brand-panel" aria-label="IELTS Anywhere overview">
        <div className="login-brand-row">
          <div className="login-mark">IA</div>
          <span>IELTSAnywhere</span>
        </div>

        <div className="login-copy">
          <div className="login-kicker">
            <Target size={14} />
            Practice with intent
          </div>
          <h1>IELTS anywhere anytime preparation that stays focused.</h1>
          <p>
            Timed practice, module feedback, vocabulary training, and score tracking in one clean workspace.
          </p>

          <div className="login-modules">
            {MODULES.map(({ icon: Icon, label, desc }) => (
              <div className="login-module" key={label}>
                <div className="login-module-title">
                  <Icon size={16} />
                  {label}
                </div>
                <div className="login-module-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-trust">
          <ShieldCheck size={16} />
          Focused tools for repeat practice and measurable progress
        </div>
      </section>

      <section className="login-form-panel" aria-label={isRegister ? "Create account" : "Sign in"}>
        <div style={{ width: "100%", maxWidth: 430 }}>
          <div className="login-mobile-brand">
            <div className="login-mobile-mark">IA</div>
            <span>IELTS<span style={{ color: PRIMARY }}>Anywhere</span></span>
          </div>

          <div className="login-card">
            <div className="login-heading">
              <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
              <p>
                {isRegister
                  ? "Start your IELTS preparation workspace."
                  : "Continue your practice, reports, and study plan."}
              </p>
            </div>

            {!isFirebaseConfigured && (
              <div className="login-alert login-env" role="alert">
                <AlertCircle size={17} />
                <span>
                  Firebase env vars are missing. Copy <code>.env.example</code> to <code>.env.local</code> and add{" "}
                  <code>NEXT_PUBLIC_FIREBASE_*</code>.
                </span>
              </div>
            )}

            <button
              type="button"
              className="login-button login-google"
              onClick={signInWithGoogle}
              disabled={loading || !isFirebaseConfigured}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="login-divider">or use email</div>

            <form onSubmit={submit}>
              <div style={{ marginBottom: 14 }}>
                <label className="login-label" htmlFor="email">Email address</label>
                <div className="login-field">
                  <Mail size={17} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="login-label" htmlFor="password">Password</label>
                <div className="login-field">
                  <LockKeyhole size={17} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isRegister ? "At least 6 characters" : "Your password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete={isRegister ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-alert" role="alert">
                  <AlertCircle size={17} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="login-button login-primary"
                disabled={loading || !isFirebaseConfigured}
              >
                {primaryLabel}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="login-toggle">
              {isRegister ? "Already have an account? " : "No account yet? "}
              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setIsRegister((current) => !current);
                  setError("");
                }}
              >
                {isRegister ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>

          <p className="login-footnote">
            <CheckCircle2 size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Your progress and reports stay connected to your account.
          </p>
        </div>
      </section>
    </main>
  );
}
