"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const Ctx = createContext({ user: undefined, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (auth ? undefined : null));
  
  useEffect(() => {
    if (!auth) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    }, (err) => {
      console.error("Auth state error:", err);
      setUser(null);
    });
    return unsubscribe;
  }, []);

  return (
    <Ctx.Provider value={{ user, loading: user === undefined }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);