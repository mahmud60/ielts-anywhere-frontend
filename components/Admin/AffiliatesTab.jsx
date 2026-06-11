"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Copy, Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";

const C = {
  accent: "#6366f1", accentDim: "#eef2ff",
  green: "#059669", greenDim: "#d1fae5",
  red: "#dc2626", redDim: "#fee2e2",
  gold: "#d97706", goldDim: "#fef3c7",
  border: "#e2e8f0", surface: "#fff",
  text: "#0f172a", muted: "#64748b",
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

function StatusBadge({ active }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: active ? C.greenDim : C.redDim,
      color: active ? C.green : C.red,
    }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={copy} title="Copy" style={{
      background: "none", border: "none", cursor: "pointer", padding: "3px 6px",
      color: copied ? C.green : C.muted, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function CreateAffiliateModal({ onClose, onCreated }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [rate, setRate] = useState("20");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await api.admin.createAffiliate({
        user_email: email.trim(),
        code: code.trim(),
        commission_rate: parseFloat(rate) / 100,
      });
      onCreated(result);
    } catch (err) {
      setError(err.message || "Failed to create affiliate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: C.surface, borderRadius: 16, padding: 28, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Add Affiliate</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>User Email</label>
            <input
              required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="influencer@example.com"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>Referral Code</label>
            <input
              required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="JOHN20"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "monospace", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 5 }}>
              Commission Rate (%)
            </label>
            <input
              required type="number" min="0" max="100" step="0.5"
              value={rate} onChange={(e) => setRate(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          {error && <p style={{ margin: 0, fontSize: 13, color: C.red }}>{error}</p>}
          <button
            type="submit" disabled={saving}
            style={{
              padding: "11px 0", borderRadius: 10, background: C.accent, color: "#fff",
              border: "none", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Creating…" : "Create Affiliate"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AffiliateRow({ aff, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [referrals, setReferrals] = useState(null);
  const [editRate, setEditRate] = useState(null);
  const [saving, setSaving] = useState(false);

  const referralLink = `${BASE_URL}/pricing?ref=${aff.code}`;

  const loadReferrals = async () => {
    if (referrals) return;
    const data = await api.admin.getAffiliateReferrals(aff.id);
    setReferrals(data);
  };

  const toggleExpand = () => {
    if (!expanded) loadReferrals();
    setExpanded(!expanded);
  };

  const toggleActive = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.updateAffiliate(aff.id, { is_active: !aff.is_active });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  const saveRate = async () => {
    if (editRate === null) return;
    setSaving(true);
    try {
      const updated = await api.admin.updateAffiliate(aff.id, { commission_rate: parseFloat(editRate) / 100 });
      onUpdated(updated);
      setEditRate(null);
    } finally {
      setSaving(false);
    }
  };

  const displayRate = editRate !== null ? editRate : (aff.commission_rate * 100).toFixed(1);

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.surface }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 auto" }}>
          <StatusBadge active={aff.is_active} />
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{aff.user_email}</div>
          {aff.user_name && <div style={{ fontSize: 12, color: C.muted }}>{aff.user_name}</div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <code style={{
            background: C.accentDim, color: C.accent, borderRadius: 7, padding: "4px 10px",
            fontSize: 13, fontWeight: 700, letterSpacing: 1,
          }}>{aff.code}</code>
          <CopyButton text={referralLink} />
        </div>

        {/* Commission rate — inline edit */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number" min="0" max="100" step="0.5"
            value={displayRate}
            onFocus={() => setEditRate((aff.commission_rate * 100).toFixed(1))}
            onChange={(e) => setEditRate(e.target.value)}
            style={{
              width: 64, padding: "5px 8px", borderRadius: 7,
              border: `1px solid ${editRate !== null ? C.accent : C.border}`,
              fontSize: 13, fontWeight: 600, textAlign: "right",
            }}
          />
          <span style={{ fontSize: 13, color: C.muted }}>%</span>
          {editRate !== null && (
            <button onClick={saveRate} disabled={saving} style={{
              padding: "4px 10px", borderRadius: 7, background: C.accent, color: "#fff",
              border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>Save</button>
          )}
        </div>

        <div style={{ textAlign: "center", minWidth: 70 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{aff.total_referrals}</div>
          <div style={{ fontSize: 11, color: C.muted }}>referrals</div>
        </div>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>${aff.confirmed_earnings.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: C.muted }}>earned</div>
        </div>

        <button
          onClick={toggleActive} disabled={saving}
          style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${aff.is_active ? C.border : C.green}`,
            background: aff.is_active ? C.redDim : C.greenDim,
            color: aff.is_active ? C.red : C.green,
          }}
        >
          {aff.is_active ? "Deactivate" : "Activate"}
        </button>

        <button onClick={toggleExpand} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Referral link row */}
      <div style={{ padding: "8px 18px 10px", borderTop: `1px solid ${C.border}`, background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>Link:</span>
        <code style={{ fontSize: 12, color: C.muted, wordBreak: "break-all" }}>{referralLink}</code>
        <CopyButton text={referralLink} />
      </div>

      {/* Expanded referrals */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {!referrals ? (
            <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>Loading…</div>
          ) : referrals.length === 0 ? (
            <div style={{ padding: 16, color: C.muted, fontSize: 13 }}>No referrals yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["User", "Order Amount", "Commission", "Status", "Date"].map((h) => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "9px 14px", color: C.text }}>{r.referred_user_email || "—"}</td>
                    <td style={{ padding: "9px 14px" }}>{r.order_amount ? `$${r.order_amount.toFixed(2)}` : "—"}</td>
                    <td style={{ padding: "9px 14px", color: C.green, fontWeight: 600 }}>{r.commission_amount ? `$${r.commission_amount.toFixed(2)}` : "—"}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: r.status === "confirmed" ? C.greenDim : r.status === "paid" ? C.accentDim : C.goldDim,
                        color: r.status === "confirmed" ? C.green : r.status === "paid" ? C.accent : C.gold,
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "9px 14px", color: C.muted }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function AffiliatesTab() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.admin.getAffiliates()
      .then(setAffiliates)
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (aff) => {
    setAffiliates((prev) => [aff, ...prev]);
    setShowCreate(false);
  };

  const handleUpdated = (updated) => {
    setAffiliates((prev) => prev.map((a) => a.id === updated.id ? updated : a));
  };

  const totalEarnings = affiliates.reduce((s, a) => s + a.confirmed_earnings, 0);
  const totalReferrals = affiliates.reduce((s, a) => s + a.total_referrals, 0);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Affiliates</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Manage referral codes and commission rates.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 10, background: C.accent, color: "#fff",
            border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Affiliate
        </button>
      </div>

      {/* Summary tiles */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total affiliates", value: affiliates.length, color: C.accent, bg: C.accentDim },
          { label: "Active", value: affiliates.filter((a) => a.is_active).length, color: C.green, bg: C.greenDim },
          { label: "Total referrals", value: totalReferrals, color: C.gold, bg: C.goldDim },
          { label: "Total commissions", value: `$${totalEarnings.toFixed(2)}`, color: C.green, bg: C.greenDim },
        ].map((t) => (
          <div key={t.label} style={{
            flex: "1 1 140px", background: t.bg, borderRadius: 12, padding: "14px 18px",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: C.muted, fontSize: 14 }}>Loading…</div>
      ) : affiliates.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 14 }}>
          No affiliates yet. Click &ldquo;Add Affiliate&rdquo; to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {affiliates.map((aff) => (
            <AffiliateRow key={aff.id} aff={aff} onUpdated={handleUpdated} />
          ))}
        </div>
      )}

      {showCreate && <CreateAffiliateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}