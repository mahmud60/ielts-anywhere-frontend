export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

export function getSubscriptionColor(subscription) {
  return subscription === "pro" ? "#059669" : "#64748b";
}