"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MicIcon,
  Pen,
  Shield,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getDiagnosticHref } from "@/lib/landingAccess";

import { useLandingAuth } from "./LandingAuthContext";

const MODULE_LINKS = [
  { name: "Listening", icon: Headphones, href: "#modules-section" },
  { name: "Reading", icon: BookText, href: "#modules-section" },
  { name: "Writing", icon: Pen, href: "#modules-section" },
  { name: "Speaking", icon: MicIcon, href: "#modules-section" },
];

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className="h-9 w-20 animate-pulse rounded-full bg-secondary" />
      <div className="h-9 w-24 animate-pulse rounded-full bg-secondary" />
    </div>
  );
}

function UserMenu({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const { isAdmin } = useLandingAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    onNavigate();
    router.push(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    onNavigate();
    await logout(router);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/80"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <User className="h-4 w-4" />
      </button>
      {open && (
        <div className="glass absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-xl border border-border p-1 shadow-md">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary/80"
            onClick={() => go("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary/80"
            onClick={() => go("/pricing")}
          >
            Manage Plan
          </button>
          {isAdmin && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary/80"
              onClick={() => go("/admin")}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/80"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { authLoading, isAuthenticated, isAdmin } = useLandingAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsMobileMenuOpen(false);
  const primaryHref = isAuthenticated
    ? "/dashboard"
    : getDiagnosticHref(false);

  const renderAuthDesktop = () => {
    if (authLoading) return <AuthSkeleton />;

    if (!isAuthenticated) {
      return (
        <>
          <Link href="/login">
            <Button variant="outline" size="sm" className="rounded-full">
              Sign In
            </Button>
          </Link>
          <Link href={primaryHref}>
            <Button size="sm" className="rounded-full">
              Get Started
            </Button>
          </Link>
        </>
      );
    }

    return (
      <>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="rounded-full">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <UserMenu onNavigate={closeMenu} />
      </>
    );
  };

  const renderAuthMobile = () => {
    if (authLoading) {
      return (
        <div className="flex gap-2 px-2 py-2">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-secondary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col gap-2 px-2 pb-2">
          <Link href="/login" onClick={closeMenu}>
            <Button variant="outline" className="w-full rounded-lg">
              Sign In
            </Button>
          </Link>
          <Link href={primaryHref} onClick={closeMenu}>
            <Button className="w-full rounded-lg">Get Started</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 border-t border-border px-2 pb-2 pt-2">
        <Link href="/dashboard" onClick={closeMenu}>
          <Button variant="outline" className="w-full justify-start rounded-lg">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/pricing" onClick={closeMenu}>
          <Button variant="ghost" className="w-full justify-start rounded-lg">
            Manage Plan
          </Button>
        </Link>
        {isAdmin && (
          <Link href="/admin" onClick={closeMenu}>
            <Button variant="ghost" className="w-full justify-start rounded-lg">
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 px-4 py-4 transition-all duration-300 md:px-8",
        isScrolled ? "glass" : "bg-transparent"
      )}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-bold text-primary transition-opacity hover:opacity-80 md:text-2xl"
            onClick={closeMenu}
          >
            IELTS<span className="text-foreground">Anywhere</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {MODULE_LINKS.map(({ name, icon: Icon, href }) => (
              <a
                key={name}
                href={href}
                className="flex items-center rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Icon className="mr-1.5 h-4 w-4" />
                {name}
              </a>
            ))}
            <Link
              href="/pricing"
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Pricing
            </Link>
            <div className="ml-2 flex items-center gap-2">{renderAuthDesktop()}</div>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            {!authLoading && isAuthenticated && (
              <Link href="/dashboard">
                <Button size="sm" className="rounded-full px-3 text-xs">
                  Dashboard
                </Button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              className="p-2 text-foreground"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="glass container mx-auto mt-4 animate-fade-in rounded-xl p-3 lg:hidden">
          <nav className="flex flex-col space-y-1">
            {MODULE_LINKS.map(({ name, icon: Icon, href }) => (
              <a
                key={name}
                href={href}
                className="flex items-center rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary/50"
                onClick={closeMenu}
              >
                <Icon className="mr-2 h-4 w-4" />
                {name}
              </a>
            ))}
            <Link
              href="/pricing"
              className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary/50"
              onClick={closeMenu}
            >
              Pricing
            </Link>
            {renderAuthMobile()}
            {isAuthenticated && isAdmin && (
              <Link href="/admin" className="px-4 pb-2 text-sm text-muted-foreground" onClick={closeMenu}>
                Admin panel
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
