import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers(search);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSubscription = async (userId, currentTier) => {
    setUpdating(userId);
    try {
      await api.admin.updateSubscription(userId, currentTier === "pro" ? "free" : "pro");
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleAdmin = async (userId, isAdmin) => {
    if (!confirm(`${isAdmin ? "Grant" : "Revoke"} admin access for this user?`)) return;
    setUpdating(userId);
    try {
      await api.admin.toggleAdmin(userId, isAdmin);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(null);
    }
  };

  return {
    users, search, setSearch,
    loading, updating,
    handleSubscription, handleAdmin,
  };
}