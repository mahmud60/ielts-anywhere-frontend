"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const Ctx = createContext({ user: undefined, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);  // data from our backend
  
  useEffect(() => {
    console.log("🔥 Setting up auth listener...");
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("✅ Auth state:", u);
      setUser(u);
    }, (err) => {
      console.error("❌ Auth error:", err);
      setUser(null);
    });
    return unsubscribe;
  }, []);

  return (  // ✅ this was missing entirely
    <Ctx.Provider value={{ user, loading: user === undefined }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);