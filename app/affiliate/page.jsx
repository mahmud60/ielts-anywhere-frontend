"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Users, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import PetLoader from "@/components/PetLoader";

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="da-btn da-btn-ghost" style={{
      background: copied ? "#d1fae5" : undefined,
      color: copied ? "#059669" : undefined,
    }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function StatCard({ icon, label, value, sub, color = "#6366f1", bg = "#eef2ff" }) {
  return (
    <div className="da-card" style={{ flex: "1 1 160px", padding: "20px 22px" }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color }}>
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
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
        <PetLoader label="is loading your affiliate stats" />
      </DashboardShell>
    );
  }

  if (notAffiliate) {
    return (
      <DashboardShell title="Affiliate">
        <div className="da-card" style={{ maxWidth: 480, margin: "60px auto", padding: "48px 36px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#6366f1" }}>
            <Users size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Not an affiliate yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, marginBottom: 24 }}>
            Contact us to join the affiliate program and start earning commissions for every subscriber you refer.
          </p>
          <a
            href="mailto:support@ieltsanywhere.app?subject=Affiliate program"
            className="da-btn da-btn-primary"
            style={{ textDecoration: "none" }}
          >
            Contact us
            <ArrowUpRight size={15} />
          </a>
        </div>
      </DashboardShell>
    );
  }

  if (!data) return null;

  // Backend returns referral_link pointing to /login; use it directly
  const referralLink = data.referral_link || `https://ieltsanywhere.app/login?ref=${data.code}`;
  const signupCount = data.signup_count ?? 0;
  const conversionCount = data.conversion_count ?? 0;
  const confirmedTotal = data.confirmed_earnings ?? 0;
  const pendingTotal = data.pending_earnings ?? 0;

  return (
    <DashboardShell title="Affiliate">
      {/* Hero card */}
      <div style={{
        borderRadius: 20, padding: "28px 30px", marginBottom: 24,
        background: "linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)", color: "#fff",
        boxShadow: "0 18px 40px -18px #6366f1aa",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Affiliate Dashboard</h1>
        <p style={{ fontSize: 14, opacity: 0.88, margin: "0 0 22px", maxWidth: 500 }}>
          Share your signup link and earn <strong>{(data.commission_rate * 100).toFixed(0)}%</strong> commission on every Pro subscription you refer.
        </p>

        <div style={{
          background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <code style={{ flex: 1, fontSize: 12.5, wordBreak: "break-all", minWidth: 200, opacity: 0.95 }}>
            {referralLink}
          </code>
          <CopyButton text={referralLink} label="Copy link" />
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>Promo code:</span>
          <code style={{
            background: "rgba(255,255,255,0.2)", borderRadius: 7, padding: "4px 12px",
            fontSize: 15, fontWeight: 800, letterSpacing: 2,
          }}>{data.code}</code>
          <CopyButton text={data.code} label="Copy code" />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard
          icon={<Users size={18} />}
          label="Total signups"
          value={signupCount}
          sub="Users who signed up via your link"
          color="#6366f1" bg="#eef2ff"
        />
        <StatCard
          icon={<ArrowUpRight size={18} />}
          label="Conversions"
          value={conversionCount}
          sub="Upgraded to Pro"
          color="#0ea5e9" bg="#e0f2fe"
        />
        <StatCard
          icon={<DollarSign size={18} />}
          label="Confirmed earnings"
          value={`$${confirmedTotal.toFixed(2)}`}
          color="#059669" bg="#d1fae5"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Pending earnings"
          value={`$${pendingTotal.toFixed(2)}`}
          sub="Awaiting confirmation"
          color="#d97706" bg="#fef3c7"
        />
      </div>

      {/* Referrals table */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Referral History</h2>
      <div className="da-card" style={{ overflow: "hidden" }}>
        {data.referrals.length === 0 ? (
          <div style={{ padding: "52px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            No referrals yet — share your link to start!
          </div>
        ) : (
          <table className="da-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th className="da-col-opt">Order Amount</th>
                <th>Commission</th>
                <th className="da-col-opt">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((r) => {
                const statusLabel = !r.signed_up ? "Link clicked" : !r.converted ? "Signed up" : r.status;
                const statusColor =
                  r.status === "confirmed" ? { bg: "#d1fae5", fg: "#059669" } :
                  r.status === "paid"      ? { bg: "#eef2ff", fg: "#6366f1" } :
                  r.converted              ? { bg: "#fef3c7", fg: "#d97706" } :
                                             { bg: "#f1f5f9", fg: "#64748b" };
                return (
                  <tr key={r.id}>
                    <td>{r.referred_user_email || "—"}</td>
                    <td>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: statusColor.bg, color: statusColor.fg,
                        textTransform: "capitalize",
                      }}>{statusLabel}</span>
                    </td>
                    <td className="da-col-opt">
                      {r.order_amount != null ? `$${Number(r.order_amount).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ fontWeight: 700, color: r.commission_amount ? "#059669" : "#94a3b8" }}>
                      {r.commission_amount != null ? `$${Number(r.commission_amount).toFixed(2)}` : "—"}
                    </td>
                    <td className="da-col-opt" style={{ color: "#94a3b8" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
