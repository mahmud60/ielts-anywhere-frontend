"use client";
import { useUsers } from "@/lib/admin/useUsers";
import { formatDate, getSubscriptionColor } from "@/lib/admin/usersData";
import PetLoader from "@/components/PetLoader";
import { UserAnalytics } from "@/components/Admin/UserAnalytics";

const TABLE_HEADERS = ["Email", "Name", "Subscription", "Admin", "Joined", "Actions"];

const badge = (color) => ({
  display: "inline-block", borderRadius: 99, fontSize: 11, fontWeight: 600,
  padding: "2px 9px", letterSpacing: "0.05em", textTransform: "uppercase",
  background: color + "18", color, border: `1px solid ${color}33`,
});

function UserBadge({ subscription }) {
  return <span style={badge(getSubscriptionColor(subscription))}>{subscription}</span>;
}

function AdminBadge() {
  return <span style={badge("#0ea5e9")}>Admin</span>;
}

function UserRow({ user, updating, onSubscription, onAdmin }) {
  const isUpdating = updating === user.id;
  const isPro = user.subscription === "pro";
  return (
    <tr>
      <td style={{ fontWeight: 600, color: "#0f172a" }}>{user.email}</td>
      <td style={{ color: "#64748b" }}>{user.full_name || "—"}</td>
      <td><UserBadge subscription={user.subscription} /></td>
      <td>{user.is_admin && <AdminBadge />}</td>
      <td style={{ color: "#64748b", fontSize: 12 }}>{formatDate(user.created_at)}</td>
      <td>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className="da-btn"
            style={{
              padding: "5px 12px", fontSize: 12, fontWeight: 600,
              background: isPro ? "#fee2e2" : "#d1fae5",
              color: isPro ? "#dc2626" : "#059669",
              border: `1px solid ${isPro ? "#dc262633" : "#05966933"}`,
            }}
            disabled={isUpdating}
            onClick={() => onSubscription(user.id, user.subscription)}
          >
            {isPro ? "Revoke Pro" : "Grant Pro"}
          </button>
          <button
            className="da-btn da-btn-ghost"
            style={{ padding: "5px 12px", fontSize: 12 }}
            disabled={isUpdating}
            onClick={() => onAdmin(user.id, !user.is_admin)}
          >
            {user.is_admin ? "Revoke admin" : "Make admin"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function UsersTable({ users, loading, updating, onSubscription, onAdmin }) {
  return (
    <div className="da-card" style={{ overflow: "hidden" }}>
      <table className="da-table" style={{ width: "100%" }}>
        <thead>
          <tr>{TABLE_HEADERS.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{ padding: "32px 0", textAlign: "center" }}>
              <PetLoader size={80} label="is loading users" />
            </td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: 24, color: "#64748b", textAlign: "center" }}>No users found</td></tr>
          ) : users.map((u) => (
            <UserRow key={u.id} user={u} updating={updating} onSubscription={onSubscription} onAdmin={onAdmin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTab() {
  const { users, search, setSearch, loading, updating, handleSubscription, handleAdmin } = useUsers();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "system-ui" }}>
      <UserAnalytics />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Manage users</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          style={{ width: 260, maxWidth: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #e6e8ef", fontSize: 13, fontFamily: "system-ui", background: "#fff", color: "#0f172a", outline: "none" }}
        />
      </div>

      <UsersTable users={users} loading={loading} updating={updating} onSubscription={handleSubscription} onAdmin={handleAdmin} />
    </div>
  );
}
