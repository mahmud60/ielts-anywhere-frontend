"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { logout } from "@/lib/auth";

const LINKS = [
  { href: "/tests",     label: "Tests" },
  { href: "/pricing",   label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function AppNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't render nav on these routes
  const hidden =
    !pathname ||
    pathname === "/login" ||
    pathname.startsWith("/admin");

  // Still loading auth state — render nothing to avoid flash
  if (loading || hidden || !user) return null;

  return (
    <nav style={{
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 24px",
      height: 54,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxSizing: "border-box",
    }}>

      {/* Brand */}
      
        href="/tests"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 17, color: "#6366f1" }}>
          IELTS
        </span>
        <span style={{ fontWeight: 400, fontSize: 17, color: "#374151" }}>
          Pro
        </span>
      </a>

      {/* Page links */}
      <div style={{ display: "flex", gap: 2 }}>
        {LINKS.map(link => {
          const active = pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href));
          return (
            
              key={link.href}
              href={link.href}
              style={{
                padding: "5px 13px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? "#6366f1" : "#6b7280",
                background: active ? "#eef2ff" : "transparent",
                textDecoration: "none",
                transition: "color .15s, background .15s",
              }}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      {/* Right — email + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          fontSize: 12,
          color: "#9ca3af",
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user.email}
        </span>

        {/* Admin link — only shown to admins */}
        {user.is_admin && (
          
            href="/admin"
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12,
              color: "#6366f1",
              background: "#eef2ff",
              border: "1px solid #6366f133",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Admin
          </a>
        )}

        {/* Logout */}
        <LogoutButton router={router} />
      </div>
    </nav>
  );
}

function LogoutButton({ router }) {
  const handleMouseEnter = (e) => {
    e.currentTarget.style.background = "#fee2e2";
    e.currentTarget.style.borderColor = "#fca5a5";
    e.currentTarget.style.color = "#dc2626";
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.borderColor = "#e5e7eb";
    e.currentTarget.style.color = "#6b7280";
  };

  return (
    <button
      onClick={() => logout(router)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: "5px 14px",
        borderRadius: 7,
        border: "1px solid #e5e7eb",
        background: "transparent",
        color: "#6b7280",
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "system-ui",
        transition: "all .15s",
      }}
    >
      Log out
    </button>
  );
}