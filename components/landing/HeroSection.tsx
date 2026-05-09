"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const scrollToContent = () => {
    const contentSection = document.getElementById("content-section");
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container max-w-4xl animate-fade-in">
        <div className="mb-6 inline-block animate-slide-down rounded-full bg-secondary px-3 py-1 text-sm font-medium opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
          IELTS Practice Platform
        </div>
        <h1 className="mb-6 animate-slide-down text-4xl font-bold leading-tight opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards] md:text-6xl">
          IELTS Practice
          <span className="block text-primary">Anywhere, Anytime</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl animate-slide-down text-lg text-muted-foreground opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards] md:text-xl">
          Comprehensive preparation for all four IELTS test modules with realistic practice and instant feedback.
        </p>
        <div className="flex animate-slide-down flex-col items-center justify-center gap-4 opacity-0 [animation-delay:800ms] [animation-fill-mode:forwards] sm:flex-row">
          <Button onClick={scrollToContent} size="lg" className="rounded-full px-8">
            Get Started
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        aria-label="Scroll down"
      >
        <ArrowDown className="h-6 w-6 text-primary" />
      </button>
    </section>
  );
}
