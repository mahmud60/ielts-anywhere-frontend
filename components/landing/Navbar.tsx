"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookText, Headphones, MicIcon, Menu, Pen, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const navItems = [
    { name: "Listening", icon: <Headphones className="mr-2 h-4 w-4" /> },
    { name: "Reading", icon: <BookText className="mr-2 h-4 w-4" /> },
    { name: "Writing", icon: <Pen className="mr-2 h-4 w-4" /> },
    { name: "Speaking", icon: <MicIcon className="mr-2 h-4 w-4" /> },
  ];

  const practiceHref = pathname === "/" ? "#content-section" : "/#content-section";

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 px-4 py-4 transition-all duration-300 md:px-8",
        isScrolled ? "glass" : "bg-transparent"
      )}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-primary transition-all duration-300 hover:opacity-80 md:text-2xl"
            onClick={closeMenu}
          >
            IELTS<span className="text-foreground">Anywhere</span>
          </Link>

          <nav className="hidden items-center space-x-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={practiceHref}
                className="flex items-center rounded-full px-4 py-2 text-sm font-medium text-foreground transition-all duration-300 hover:bg-secondary"
              >
                {item.icon}
                {item.name}
              </a>
            ))}

            <Link href="/login" className="ml-2">
              <Button variant="outline" size="sm" className="rounded-full">
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </nav>

          <div className="flex items-center md:hidden">
            <Link href="/login" className="mr-2">
              <Button variant="outline" size="sm" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="p-2 text-foreground focus:outline-none"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="glass mt-4 animate-fade-in rounded-xl p-3 md:hidden">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={practiceHref}
                className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:bg-secondary/50"
                onClick={closeMenu}
              >
                {item.icon}
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
