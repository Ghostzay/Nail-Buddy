import Link from "next/link";
import { LayoutDashboard, ListChecks, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-muted/30 p-6 text-center">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="size-8" />
        <span className="text-2xl font-bold tracking-tight">Nail Buddy</span>
      </div>
      <p className="max-w-md text-muted-foreground">
        Walk-in request kiosk, tech job queue, and manager dashboard for the
        salon floor.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="xl">
          <Link href="/request">
            <Sparkles className="size-5" />
            Start a Request
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/tech">
            <ListChecks className="size-5" />
            Tech Queue
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/manager">
            <LayoutDashboard className="size-5" />
            Manager
          </Link>
        </Button>
      </div>
    </main>
  );
}
