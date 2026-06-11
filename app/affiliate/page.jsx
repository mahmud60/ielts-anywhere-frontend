"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Users, DollarSign, TrendingUp, Link } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

function CopyButton({ text, label = "Copy link" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "10px 18px", borderRadius: 10, border: "1px solid #e2e8f0",
      background: copied ? "#d1fae5" : "#fff", color: copied ? "#059669" : "#475569",
      fontWeight: 600, fontSize: 13.5, cursor: "pointer", transition: "all .15s",
    }}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function StatCard({ icon, label, value, sub, color = "#6366f1", bg = "#eef2ff" }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px", flex: "1 1 160px" }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color }}>
        {icon}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function AffiliatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [notAffiliate, setNotAffiliate] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.affiliate.getMe()
      .then(setData)
      .catch((err) => {
        if (err.message?.startsWith("404")) setNotAffiliate(true);
      })
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) {
    return (
      <DashboardShell title="Affiliate">
        <PetLoader fullScreen label="is loading your affiliate stats" />
      </DashboardShell>
    );
  }

  if (notAffiliate) {
    return (
      <DashboardShell title="Affiliate">
        <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>You&apos;re not an affiliate yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            Contact us to join the affiliate program and start earning commissions for every subscriber you refer.
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (!data) return null;

  const referralLink = `${BASE_URL}/pricing?ref=${data.code}`;
  const pendingTotal = data.pending_earnings ?? 0;
  const confirmedTotal = data.confirmed_earnings ?? 0;

  return (
    <DashboardShell title="Affiliate">
      {/* Hero */}
      <div style={{
        borderRadius: 20, padding: "28px 30px", marginBottom: 24,
        background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)", color: "#fff",
        boxShadow: "0 18px 40px -18px #6366f1aa",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Affiliate Dashboard</h1>
        <p style={{ fontSize: 14, opacity: 0.9, margin: "0 0 20px", maxWidth: 480 }}>
          Share your link and earn {(data.commission_rate * 100).toFixed(0)}% commission on every subscription you refer.
        </p>

        {/* Referral link box */}
        <div style={{
          background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <Link size={15} style={{ flexShrink: 0 }} />
          <code style={{ flex: 1, fontSize: 13, wordBreak: "break-all", minWidth: 200 }}>{referralLink}</code>
          <CopyButton text={referralLink} label="Copy link" />
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>Your code:</span>
          <code style={{
            background: "rgba(255,255,255,0.2)", borderRadius: 7, padding: "4px 12px",
            fontSize: 15, fontWeight: 800, letterSpacing: 2,
          }}>{data.code}</code>
          <CopyButton text={data.code} label="Copy code" />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard icon={<Users size={18} />} label="Total referrals" value={data.total_referrals} color="#6366f1" bg="#eef2ff" />
        <StatCard icon={<DollarSign size={18} />} label="Confirmed earnings" value={`$${confirmedTotal.toFixed(2)}`} color="#059669" bg="#d1fae5" />
        <StatCard icon={<TrendingUp size={18} />} label="Pending earnings" value={`$${pendingTotal.toFixed(2)}`} sub="Awaiting confirmation" color="#d97706" bg="#fef3c7" />
        <StatCard icon={<span style={{ fontWeight: 800, fontSize: 15 }}>%</span>} label="Commission rate" value={`${(data.commission_rate * 100).toFixed(0)}%`} color="#8b5cf6" bg="#f5f3ff" />
      </div>

      {/* Referrals table */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Your Referrals</h2>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
        {data.referrals.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            No referrals yet. Share your link to start earning!
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Subscriber", "Amount", "Your Commission", "Status", "Date"].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", color: "#0f172a" }}>{r.referred_user_email || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>{r.order_amount ? `$${r.order_amount.toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#059669" }}>
                    {r.commission_amount ? `$${r.commission_amount.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: r.status === "confirmed" ? "#d1fae5" : r.status === "paid" ? "#eef2ff" : "#fef3c7",
                      color: r.status === "confirmed" ? "#059669" : r.status === "paid" ? "#6366f1" : "#d97706",
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}