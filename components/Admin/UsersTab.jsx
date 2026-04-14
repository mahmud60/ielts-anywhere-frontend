"use client";
import { useUsers } from "@/lib/admin/useUsers";
import { formatDate, getSubscriptionColor } from "@/lib/admin/usersData";
import styles from "@/styles/admin/users.module.css";

const TABLE_HEADERS = ["Email", "Name", "Subscription", "Admin", "Joined", "Actions"];

function UserBadge({ subscription }) {
  const color = getSubscriptionColor(subscription);
  return (
    <span className={styles.badge} style={{
      background: color + "18",
      color,
      border: `1px solid ${color}33`,
    }}>
      {subscription}
    </span>
  );
}

function AdminBadge() {
  return (
    <span className={styles.badge} style={{
      background: "#6366f118",
      color: "#6366f1",
      border: "1px solid #6366f133",
    }}>
      Admin
    </span>
  );
}

function UserRow({ user, updating, onSubscription, onAdmin }) {
  const isUpdating = updating === user.id;
  return (
    <tr className={styles.row}>
      <td className={styles.td}>{user.email}</td>
      <td className={styles.tdMuted}>{user.full_name || "—"}</td>
      <td className={styles.td}>
        <UserBadge subscription={user.subscription} />
      </td>
      <td className={styles.td}>
        {user.is_admin && <AdminBadge />}
      </td>
      <td className={styles.tdSmall}>{formatDate(user.created_at)}</td>
      <td className={styles.td}>
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${user.subscription === "pro" ? styles.btnDanger : styles.btnSuccess}`}
            disabled={isUpdating}
            onClick={() => onSubscription(user.id, user.subscription)}
          >
            {user.subscription === "pro" ? "Revoke Pro" : "Grant Pro"}
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
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
    <div className={styles.card}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {TABLE_HEADERS.map(h => (
              <th key={h} className={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className={styles.empty}>Loading…</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={6} className={styles.empty}>No users found</td></tr>
          ) : users.map(u => (
            <UserRow
              key={u.id}
              user={u}
              updating={updating}
              onSubscription={onSubscription}
              onAdmin={onAdmin}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTab() {
  const {
    users, search, setSearch,
    loading, updating,
    handleSubscription, handleAdmin,
  } = useUsers();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Users</h2>
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email…"
          />
        </div>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        updating={updating}
        onSubscription={handleSubscription}
        onAdmin={handleAdmin}
      />
    </div>
  );
}