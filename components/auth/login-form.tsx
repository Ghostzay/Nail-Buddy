"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Turns Supabase's terse auth errors into something actionable. */
function explain(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed")) {
    return "That account hasn't been confirmed yet. In Supabase → Authentication → Users, open the user and confirm their email (or re-create it with “Auto Confirm User” ticked).";
  }
  if (m.includes("invalid login credentials")) {
    return "Email or password doesn't match. Note that a user created in the Supabase dashboard only works if you set a password for it.";
  }
  if (m.includes("url and key are required") || m.includes("supabaseurl")) {
    return "This deployment is missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. They are baked in at build time, so add them in Vercel and then redeploy — setting them without redeploying is not enough.";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror")) {
    return "Couldn't reach Supabase. Check the project URL and that the project isn't paused.";
  }
  return message;
}

/**
 * NEXT_PUBLIC_ vars are inlined into the client bundle at BUILD time, so this
 * is a genuine build-time check, not a runtime read. If it's empty here, the
 * deployment was built without the vars and no amount of clicking will work —
 * say so up front rather than after a failed submit.
 */
const CLIENT_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(explain(signInError.message));
        return;
      }

      if (!data.session) {
        setError("Signed in, but no session came back. Check that email confirmations are satisfied for this user.");
        return;
      }

      // Full-page navigation, NOT router.push. The session cookie was just
      // written by the browser client; a client-side RSC navigation can reach
      // the middleware before that cookie is readable, which bounces straight
      // back to /login and looks like the button did nothing.
      const target = searchParams.get("redirect") || "/manager";
      window.location.assign(target);
    } catch (err) {
      // Without this, ANY throw here leaves the button spinning forever with
      // no message — which is exactly how this failed before.
      console.error("Sign-in failed:", err);
      setError(explain(err instanceof Error ? err.message : String(err)));
    } finally {
      // Cleared even on the success path, so a slow navigation doesn't look
      // frozen if the user comes back.
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-coral/12 text-coral-strong mx-auto mb-2 grid size-12 place-items-center rounded-pill">
          <Sparkles className="size-6" />
        </div>
        <CardTitle className="text-h2 font-display">Staff sign in</CardTitle>
        <CardDescription>
          For the tech queue and the manager dashboard. Customers don&apos;t need
          this.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!CLIENT_CONFIGURED && (
          <p
            role="alert"
            className="border-warning-strong/40 bg-warning/14 text-warning-strong mb-4 rounded-control border p-3 text-body"
          >
            This build has no Supabase keys. Add{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
            Vercel, then <strong>redeploy</strong> — these are baked in at build
            time, so saving them alone won&apos;t fix it.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@salon.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="border-danger-strong/40 bg-danger/8 text-danger-strong rounded-control border p-3 text-body"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" block loading={loading} className="mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
