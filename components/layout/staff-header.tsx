import Link from "next/link";
import { Sparkles } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

export function StaffHeader({ active }: { active: "tech" | "manager" }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <span className="font-bold tracking-tight">Nail Buddy</span>
        </div>
        <nav className="flex gap-1">
          <Link
            href="/tech"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              active === "tech"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Tech Queue
          </Link>
          <Link
            href="/manager"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              active === "manager"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Manager
          </Link>
        </nav>
      </div>
      <SignOutButton />
    </header>
  );
}
