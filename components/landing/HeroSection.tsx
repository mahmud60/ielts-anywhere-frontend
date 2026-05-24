"use client";

import Link from "next/link";
import { ArrowDown, BarChart3, Brain, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDiagnosticHref } from "@/lib/landingAccess";

import { useLandingAuth } from "./LandingAuthContext";

function HeroReportMockup() {
  const modules = [
    { name: "Listening", score: 6.5, pct: 72, color: "bg-sky-500" },
    { name: "Reading", score: 7.0, pct: 78, color: "bg-amber-500" },
    { name: "Writing", score: 6.0, pct: 67, color: "bg-emerald-500" },
    { name: "Speaking", score: 6.5, pct: 72, color: "bg-violet-500" },
  ];

  return (
    <div className="glass-card w-full max-w-md p-6 text-left shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estimated band
          </p>
          <p className="text-4xl font-bold tabular-nums text-foreground">6.5</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          Preview
        </span>
      </div>

      <div className="mb-4 space-y-3">
        {modules.map((m) => (
          <div key={m.name}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{m.name}</span>
              <span className="font-semibold tabular-nums">{m.score}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Weakest area</p>
        <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
          Writing — Task Response & coherence
        </p>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Next: focused Reading practice → full mock when ready
      </p>
    </div>
  );
}

export default function HeroSection() {
  const { isAuthenticated } = useLandingAuth();

  const scrollToContent = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const primaryHref = isAuthenticated ? "/dashboard" : getDiagnosticHref(false);
  const primaryLabel = isAuthenticated ? "Go to Dashboard" : "Start Free Diagnostic";

  const badges = [
    { icon: Clock, text: "Real exam-style flow" },
    { icon: Brain, text: "AI Writing & Speaking feedback" },
    { icon: BarChart3, text: "Progress & weakness tracking" },
  ];

  return (
    <section className="relative flex min-h-screen flex-col justify-center px-4 pb-16 pt-28 md:px-8 md:pt-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 h-[20rem] w-[20rem] rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="container mx-auto">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium text-muted-foreground">
              IELTS preparation platform
            </div>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem]">
              Practice IELTS in a{" "}
              <span className="text-primary">real exam environment</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              Start with a free diagnostic, practice Listening and Reading, then unlock full mock
              tests with AI Writing and Speaking feedback when you are ready.
            </p>

            <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {badges.map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {text}
                </span>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="w-full rounded-full px-8 sm:w-auto">
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full rounded-full px-8 sm:w-auto">
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroReportMockup />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary/70 transition-colors hover:text-primary"
        aria-label="Scroll to learn more"
      >
        <ArrowDown className="h-6 w-6 animate-bounce" />
      </button>
    </section>
  );
}
