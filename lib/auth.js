import { signOut } from "firebase/auth";
import { auth } from "./firebase";

/**
 * Signs the user out of Firebase and redirects to /login.
 * Call this from any component — nav, admin panel, wherever.
 */
export async function logout(router) {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Logout error:", e);
  } finally {
    // Always redirect even if signOut throws
    router.push("/login");
  }
}