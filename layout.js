import { AuthProvider } from "@/lib/AuthContext";
import AppNav from "@/components/AppNav";

export const metadata = { title: "IELTS Pro" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <AuthProvider>
          <AppNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}