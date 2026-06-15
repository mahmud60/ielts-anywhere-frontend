"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

const REF_KEY = "ielts_ref_code";

function PricingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState(null);

  useEffect(() => {
    const param = searchParams.get("ref");
    if (param) {
      const code = param.trim().toUpperCase();
      sessionStorage.setItem(REF_KEY, code);
      setRefCode(code);
    } else {
      const stored = sessionStorage.getItem(REF_KEY) || localStorage.getItem(REF_KEY);
      if (stored) setRefCode(stored);
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    if (!user) { router.push("/login"); return; }
    setLoading(true);
    try {
      const { checkout_url } = await api.getCheckoutUrl(refCode);
      sessionStorage.removeItem(REF_KEY);
      window.location.href = checkout_url;
    } catch (e) {
      alert("Could not start checkout: " + e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 24px", fontFamily: "system-ui" }}>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
        Unlock your full potential
      </h1>
      <p style={{ color: "#6b7280", textAlign: "center", marginBottom: 40 }}>
        One plan, everything you need to reach your target band score.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Free */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Free</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#9ca3af", marginBottom: 16 }}>$0</div>
          {["1 demo test", "Listening + Reading sections only", "No AI feedback"].map(f => (
            <div key={f} style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6, display: "flex", gap: 8 }}>
              <span>·</span> {f}
            </div>
          ))}
          <div style={{ marginTop: 20, padding: "9px", borderRadius: 8, background: "#f3f4f6", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
            Current plan
          </div>
        </div>

        {/* Pro */}
        <div style={{ background: "#fff", border: "2px solid #6366f1", borderRadius: 12, padding: 24, position: "relative" }}>
          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", borderRadius: 99, padding: "2px 12px", fontSize: 11, fontWeight: 600 }}>
            RECOMMENDED
          </div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Pro</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#6366f1", marginBottom: 4 }}>$19</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>per month</div>
          {[
            "Unlimited full tests", "All 4 modules", "AI writing grading",
            "AI speaking evaluation", "Progress tracking", "Personalised tips",
          ].map(f => (
            <div key={f} style={{ fontSize: 13, color: "#374151", marginBottom: 6, display: "flex", gap: 8 }}>
              <span style={{ color: "#059669" }}>✓</span> {f}
            </div>
          ))}
          {refCode && (
            <div style={{
              marginTop: 14, padding: "8px 12px", borderRadius: 8,
              background: "#d1fae5", color: "#059669", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              ✓ Referral code <strong>{refCode}</strong> applied
            </div>
          )}
          <button onClick={handleUpgrade} disabled={loading} style={{
            width: "100%", marginTop: 12, padding: 11, borderRadius: 8,
            background: "#6366f1", border: "none", color: "#fff",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Opening checkout…" : "Upgrade to Pro →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}