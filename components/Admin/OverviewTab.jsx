"use client";
import { useOverview } from "@/lib/admin/useOverview";
import styles from "@/styles/admin/overview.module.css";

export function OverviewTab() {
  const { tiles, loading, error, openDocs, openLemon } = useOverview();

  if (error) return <p className={styles.error}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Overview</h2>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          tiles.map(t => (
            <div key={t.label} className={styles.tile}>
              <div className={styles.tileLabel}>{t.label}</div>
              <div className={styles.tileValue} style={{ color: t.color }}>{t.value}</div>
            </div>
          ))
        )}
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardHeading}>Quick actions</h3>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={openDocs}>API docs ↗</button>
          <button className={styles.btn} onClick={openLemon}>LemonSqueezy dashboard ↗</button>
        </div>
      </div>
    </div>
  );
}