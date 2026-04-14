import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { buildTiles } from "./overviewData";

export function useOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.admin.getStats()
      .then(data => { setStats(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const tiles = stats ? buildTiles(stats) : [];
  const openDocs = () => window.open("/docs", "_blank");
  const openLemon = () => window.open("https://app.lemonsqueezy.com", "_blank");

  return { tiles, loading, error, openDocs, openLemon };
}