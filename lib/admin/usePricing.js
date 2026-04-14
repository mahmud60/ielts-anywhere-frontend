import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function usePricing() {
  const [pricing, setPricing] = useState(null);
  const [limits, setLimits]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.admin.getPricing(),
      api.admin.getTimeLimits(),
    ])
      .then(([p, l]) => { setPricing(p); setLimits(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { pricing, limits, loading };
}