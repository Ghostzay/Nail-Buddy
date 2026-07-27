/**
 * Feature flags gating anything that depends on an unapplied migration.
 *
 * Every flag here is OFF until the matching file in supabase/migrations/ has
 * been applied to the project. The UI must build, render, and be navigable
 * with all of them off — features read mock data or hide entirely.
 *
 * Flip a flag by setting the env var in .env.local and on Vercel, then
 * redeploying. They are NEXT_PUBLIC_ because client components branch on them.
 */

const on = (v: string | undefined) => v === "true" || v === "1";

export const FLAGS = {
  /** 0001 + 0002 — customers extended, phone deduped, masked lookup RPC. */
  clientIdentity: on(process.env.NEXT_PUBLIC_FF_CLIENT_IDENTITY),

  /** 0003 — services catalog, job_services join, technicians. */
  servicesAndTechs: on(process.env.NEXT_PUBLIC_FF_SERVICES_TECHS),

  /** 0004 — widened statuses, started_at/completed_at, atomic claim,
      multi-photo, multi-color, squoval. */
  jobLifecycle: on(process.env.NEXT_PUBLIC_FF_JOB_LIFECYCLE),
} as const;

export type FlagName = keyof typeof FLAGS;
