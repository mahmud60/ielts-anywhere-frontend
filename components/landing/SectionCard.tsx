import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  delay: number;
}

export default function SectionCard({
  title,
  description,
  icon,
  color,
  delay,
}: SectionCardProps) {
  return (
    <Link
      href="/tests"
      className={cn(
        "glass-card hover-scale group flex h-full flex-col p-6",
        `animate-slide-up opacity-0 [animation-delay:${delay}ms] [animation-fill-mode:forwards]`
      )}
    >
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-full", color)}>
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="flex-grow text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-primary">
        <span>Start Practice</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
