import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-surface-base flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-h1 font-display text-ink">Nothing here</h1>
      <p className="text-body text-ink-muted">That page doesn&apos;t exist.</p>
      <Button asChild size="lg">
        <Link href="/request">Check in</Link>
      </Button>
    </main>
  );
}
