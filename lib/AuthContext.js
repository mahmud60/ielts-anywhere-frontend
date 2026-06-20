"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { analytics } from "./analytics";

const Ctx = createContext({ user: undefined, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (auth ? undefined : null));
  
  useEffect(() => {
    if (!auth) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Tie analytics events to the user (Firebase UID), or clear on logout.
      if (u) analytics.identify(u.uid, { email: u.email });
      else analytics.reset();
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