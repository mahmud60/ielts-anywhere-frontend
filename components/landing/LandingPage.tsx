"use client";

import Link from "next/link";
import {
  BookText,
  Check,
  Headphones,
  LineChart,
  MicIcon,
  Pen,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getDiagnosticHref,
  getListeningCta,
  getReadingCta,
  getWritingSpeakingCta,
} from "@/lib/landingAccess";

import HeroSection from "./HeroSection";
import { LandingAuthProvider, useLandingAuth } from "./LandingAuthContext";
import ModuleCard from "./ModuleCard";
import Navbar from "./Navbar";

function TrustStrip() {
  const items = [
    { icon: Timer, label: "Timed IELTS-style mock tests" },
    { icon: Target, label: "Section-wise practice" },
    { icon: Sparkles, label: "AI-powered feedback" },
    { icon: LineChart, label: "Personalized improvement path" },
  ];

  return (
    <section className="border-y border-border bg-secondary/40 px-4 py-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:justify-start sm:text-left"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Start with a diagnostic",
      description: "Understand your current level before taking a full mock test.",
    },
    {
      step: "2",
      title: "Practice weak areas",
      description: "Train Listening and Reading separately with focused practice.",
    },
    {
      step: "3",
      title: "Unlock full mock reports",
      description:
        "Get complete IELTS simulation with Writing/Speaking AI feedback and progress insights.",
    },
  ];

  return (
    <section id="how-it-works" className="px-4 py-20 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="mb-3 text-center text-2xl font-bold md:text-3xl">How it works</h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          A calm path from first assessment to exam-ready performance.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="glass-card relative p-6">
              <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.step}
              </span>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  const { isAuthenticated, isPro, isReady } = useLandingAuth();

  const listening = getListeningCta(isAuthenticated);
  const reading = getReadingCta(isAuthenticated);
  const writing = getWritingSpeakingCta(isAuthenticated, isPro, isReady);
  const speaking = getWritingSpeakingCta(isAuthenticated, isPro, isReady);

  const modules = [
    {
      title: "Listening",
      description:
        "Authentic audio, exam-style questions, and timed sections that mirror the real test.",
      icon: <Headphones className="h-6 w-6 text-white" />,
      color: "bg-sky-500",
      tier: "Free" as const,
      ctaHref: listening.href,
      ctaLabel: listening.label,
      delay: 100,
    },
    {
      title: "Reading",
      description:
        "Long passages, varied question types, and focused practice without full-exam pressure.",
      icon: <BookText className="h-6 w-6 text-white" />,
      color: "bg-amber-500",
      tier: "Free" as const,
      ctaHref: reading.href,
      ctaLabel: reading.label,
      delay: 200,
    },
    {
      title: "Writing",
      description:
        "Task 1 and Task 2 with AI grading on coherence, vocabulary, grammar, and task achievement.",
      icon: <Pen className="h-6 w-6 text-white" />,
      color: "bg-emerald-500",
      tier: "Pro" as const,
      ctaHref: writing.href,
      ctaLabel: writing.label,
      delay: 300,
    },
    {
      title: "Speaking",
      description:
        "Three-part speaking simulation with AI evaluation across fluency, pronunciation, and lexical range.",
      icon: <MicIcon className="h-6 w-6 text-white" />,
      color: "bg-violet-500",
      tier: "Pro" as const,
      ctaHref: speaking.href,
      ctaLabel: speaking.label,
      delay: 400,
    },
  ];

  return (
    <section id="modules-section" className="bg-secondary/30 px-4 py-20 md:px-8">
      <div className="container mx-auto">
        <h2 className="mb-3 text-center text-2xl font-bold md:text-3xl">All four IELTS modules</h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Train each skill with realistic formats. Free practice for Listening and Reading; full
          mock AI feedback for Writing and Speaking on Pro.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.title}
              title={m.title}
              description={m.description}
              icon={m.icon}
              color={m.color}
              tier={m.tier}
              ctaHref={m.ctaHref}
              ctaLabel={m.ctaLabel}
              delay={m.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LearningPathSection() {
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="mb-3 text-center text-2xl font-bold md:text-3xl">
          Start small, simulate the real exam when you are ready
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Free tools build confidence first. Pro unlocks the complete IELTS experience.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <div className="glass-card border-l-4 border-l-sky-500 p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">Free</p>
            <h3 className="mb-4 text-lg font-semibold">Build your foundation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Free diagnostic", "Listening practice", "Reading practice", "Basic results"].map(
                (item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="hidden flex-col items-center justify-center gap-2 lg:flex">
            <div className="h-full w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">then</span>
            <div className="h-full w-px bg-border" />
          </div>

          <div className="glass-card border-l-4 border-l-indigo-500 p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Pro
            </p>
            <h3 className="mb-4 text-lg font-semibold">Exam simulation & insights</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Full IELTS mock tests",
                "Writing AI feedback",
                "Speaking AI feedback",
                "Progress analytics & study plan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportPreviewSection() {
  const criteria = [
    { label: "Task Achievement", score: 6.0 },
    { label: "Coherence & Cohesion", score: 6.5 },
    { label: "Lexical Resource", score: 6.0 },
    { label: "Fluency & Coherence", score: 6.5 },
  ];

  return (
    <section className="bg-secondary/40 px-4 py-20 md:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-2xl font-bold md:text-3xl">Clear reports, not guesswork</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              After full mock tests, Pro members see estimated bands, criterion-level Writing and
              Speaking scores, weakest areas, and recommended next steps — all in one calm
              dashboard.
            </p>
            <p className="text-sm text-muted-foreground">
              Detailed reports are available with Pro after full mock tests.
            </p>
          </div>

          <div className="glass-card border border-border p-6 shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overall estimate</p>
                <p className="text-3xl font-bold tabular-nums">6.5</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                Pro report preview
              </span>
            </div>

            <p className="mb-3 text-sm font-medium">Weakest section: Writing</p>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {criteria.map((c) => (
                <div key={c.label} className="rounded-lg bg-secondary/80 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{c.label}</p>
                  <p className="font-semibold tabular-nums">{c.score.toFixed(1)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
              <span className="font-medium">Recommended next step: </span>
              <span className="text-muted-foreground">
                20 min Reading practice, then schedule a full mock
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlansTeaser() {
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="container mx-auto max-w-4xl">
        <h2 className="mb-3 text-center text-2xl font-bold md:text-3xl">Free vs Pro</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
          Start free. Upgrade when you need the full exam and AI coaching.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 font-semibold">Free includes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Free diagnostic",
                "Listening practice",
                "Reading practice",
                "Basic results",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card border-2 border-indigo-200 p-6 dark:border-indigo-900/50">
            <h3 className="mb-4 font-semibold">Pro includes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Full IELTS mock tests",
                "Writing AI feedback",
                "Speaking AI feedback",
                "Progress analytics",
                "Weakness tracking",
                "Vocabulary & grammar exercises",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/pricing">Compare Plans</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { isAuthenticated } = useLandingAuth();
  const href = isAuthenticated ? "/dashboard" : getDiagnosticHref(false);
  const title = isAuthenticated
    ? "Continue your IELTS preparation"
    : "Ready to know your current IELTS level?";
  const label = isAuthenticated ? "Go to Dashboard" : "Start Free Diagnostic";

  return (
    <section className="px-4 py-20 md:px-8">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="glass-card border border-primary/20 bg-primary/5 px-6 py-12 md:px-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            {isAuthenticated
              ? "Pick up where you left off — diagnostic, practice, or full mock."
              : "Create a free account and take a short diagnostic in minutes."}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href={href}>{label}</Link>
            </Button>
            {!isAuthenticated && (
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
          {/* TODO: /tests should filter or adjust behavior based on mode=diagnostic in the next milestone. */}
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-border bg-foreground px-4 py-10 text-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <p className="text-sm opacity-80">
          © {new Date().getFullYear()} IELTS Anywhere. All rights reserved.
        </p>
        <nav className="flex flex-wrap justify-center gap-4 text-sm opacity-80">
          <Link href="/pricing" className="hover:opacity-100">
            Pricing
          </Link>
          <Link href="/login" className="hover:opacity-100">
            Sign In
          </Link>
          <Link href="/dashboard" className="hover:opacity-100">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function LandingContent() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustStrip />
      <HowItWorks />
      <ModulesSection />
      <LearningPathSection />
      <ReportPreviewSection />
      <PlansTeaser />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}

export default function LandingPage() {
  return (
    <LandingAuthProvider>
      <LandingContent />
    </LandingAuthProvider>
  );
}
