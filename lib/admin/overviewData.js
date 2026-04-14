export async function fetchStats() {
  const res = await fetch("/api/admin/stats");
  return res.json();
}

export function buildTiles(stats) {
  return [
    { label: "Total users",   value: stats.total_users,        color: "#6366f1" },
    { label: "Pro users",     value: stats.pro_users,          color: "#059669" },
    { label: "Free users",    value: stats.free_users,         color: "#64748b" },
    { label: "IELTS tests",   value: stats.total_ielts_tests,  color: "#d97706" },
  ];
}