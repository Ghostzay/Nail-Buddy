"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Deliberately does NOT use the i18n hook — if the
 * provider itself is what threw, calling into it here would fail again and
 * produce a blank screen instead of a recovery path.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="bg-surface-base flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-h1 font-display text-ink">Something went wrong</h1>
      <p className="text-body text-ink-muted max-w-md">
        That didn&apos;t work. Try again — if it keeps happening, let the front
        desk know.
      </p>
      <div className="flex gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button size="lg" variant="outline" onClick={() => location.assign("/")}>
          Start over
        </Button>
      </div>
      {error.digest && (
        <code className="text-caption text-ink-muted font-mono">{error.digest}</code>
      )}
    </main>
  );
}
