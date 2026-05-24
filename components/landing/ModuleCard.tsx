import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  tier: "Free" | "Pro";
  ctaHref: string;
  ctaLabel: string;
  delay?: number;
}

export default function ModuleCard({
  title,
  description,
  icon,
  color,
  tier,
  ctaHref,
  ctaLabel,
  delay = 0,
}: ModuleCardProps) {
  const isPro = tier === "Pro";

  return (
    <Link
      href={ctaHref}
      className={cn(
        "glass-card hover-scale group flex h-full flex-col p-6",
        delay > 0 && `animate-slide-up opacity-0 [animation-delay:${delay}ms] [animation-fill-mode:forwards]`
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", color)}>
          {icon}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            isPro
              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {tier}
        </span>
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="flex-grow text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-primary">
        <span>{ctaLabel}</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
