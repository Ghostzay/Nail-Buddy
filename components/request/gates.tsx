"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, UserRound } from "lucide-react";

import { ClientConfirmCard, type MaskedClient } from "@/components/salon/client-confirm-card";
import { PhoneKeypad } from "@/components/salon/phone-keypad";
import { RegistrationForm } from "@/components/salon/registration-form";
import { RepeatLastVisitCard } from "@/components/salon/repeat-last-visit-card";
import { Button } from "@/components/ui/button";
import { FLAGS } from "@/lib/flags";
import { useT } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import type { KioskDraft } from "@/lib/kiosk/flow";

const SALON_NAME = process.env.NEXT_PUBLIC_SALON_NAME || "Nail Buddy";

export function WelcomeGate({ onStart }: { onStart: () => void }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
    >
      <Sparkles className="text-coral size-14" aria-hidden />
      <div className="flex flex-col gap-2">
        <h1 className="text-display font-display text-ink">
          {t("welcome.title", { salon: SALON_NAME })}
        </h1>
        <p className="text-body-lg text-ink-muted">{t("welcome.question")}</p>
      </div>
      <Button size="xl" onClick={onStart}>
        {t("common.continue")}
      </Button>
    </motion.div>
  );
}

/** Two enormous cards, nothing else. No third option, no skip. */
export function SignInGate({
  onNew,
  onReturning,
}: {
  onNew: () => void;
  onReturning: () => void;
}) {
  const t = useT();

  const Card = ({
    icon,
    title,
    hint,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    hint: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="border-hairline-strong bg-surface-raised hover:border-coral-strong flex min-h-60 flex-1 flex-col items-center justify-center gap-4 rounded-card border-2 p-8 text-center shadow-md transition-[border-color,box-shadow] duration-[160ms] active:scale-[0.98]"
    >
      <span className="bg-coral/12 text-coral-strong grid size-16 place-items-center rounded-pill">
        {icon}
      </span>
      <span className="text-h1 font-display text-ink">{title}</span>
      <span className="text-body-lg text-ink-muted">{hint}</span>
    </button>
  );

  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <h1 className="text-display font-display text-ink text-center text-balance">
        {t("welcome.question")}
      </h1>
      <div className="flex flex-col gap-5 sm:flex-row">
        <Card
          icon={<Sparkles className="size-8" />}
          title={t("welcome.firstTime")}
          hint={t("welcome.firstTimeHint")}
          onClick={onNew}
        />
        <Card
          icon={<UserRound className="size-8" />}
          title={t("welcome.returning")}
          hint={t("welcome.returningHint")}
          onClick={onReturning}
        />
      </div>
    </div>
  );
}

export function PhoneGate({
  draft,
  setDraft,
  onFound,
  onNotFound,
}: {
  draft: KioskDraft;
  setDraft: (fn: (d: KioskDraft) => KioskDraft) => void;
  onFound: (client: MaskedClient) => void;
  onNotFound: (phone: string) => void;
}) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  async function lookup(digits: string) {
    // Without migration 0002 there is no lookup RPC, and anon has no read on
    // customers — so we go straight to registration with the number kept.
    if (!FLAGS.clientIdentity) {
      onNotFound(digits);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client-lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const body = await res.json();

      if (res.status === 429) {
        setError(t("phone.rateLimited"));
        return;
      }
      if (!res.ok || !body.client) {
        onNotFound(digits);
        return;
      }
      onFound(body.client as MaskedClient);
    } catch {
      onNotFound(digits);
    } finally {
      setLoading(false);
      setAttempts((a) => a + 1);
    }
  }

  // Three failed identifications and we stop letting the kiosk be used to
  // probe numbers — it falls through to plain registration instead.
  if (attempts >= 3) {
    onNotFound(draft.phone);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-display font-display text-ink">{t("phone.question")}</h1>
        <p className="text-body-lg text-ink-muted">{t("phone.helper")}</p>
      </div>
      <PhoneKeypad
        value={draft.phone}
        onChange={(phone) => setDraft((d) => ({ ...d, phone }))}
        onComplete={lookup}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export function ConfirmGate({
  client,
  onConfirm,
  onReject,
}: {
  client: MaskedClient;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <h1 className="text-display font-display text-ink text-center">
        {t("confirm.question")}
      </h1>
      <div className="mx-auto w-full max-w-md">
        <ClientConfirmCard client={client} onConfirm={onConfirm} onReject={onReject} />
      </div>
    </div>
  );
}

export function RepeatGate({
  summary,
  onRepeat,
  onDifferent,
}: {
  summary: string;
  onRepeat: () => void;
  onDifferent: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mx-auto w-full max-w-xl">
        <RepeatLastVisitCard
          summary={summary}
          onRepeat={onRepeat}
          onDifferent={onDifferent}
        />
      </div>
    </div>
  );
}

export function RegisterGate({
  draft,
  setDraft,
  onDone,
}: {
  draft: KioskDraft;
  setDraft: (fn: (d: KioskDraft) => KioskDraft) => void;
  onDone: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <h1 className="text-display font-display text-ink">{t("register.title")}</h1>
      <RegistrationForm
        values={{
          firstName: draft.firstName,
          lastName: draft.lastName,
          phone: draft.phone,
          sensitivities: draft.sensitivities,
          smsConsent: draft.smsConsent,
        }}
        onChange={(v) =>
          setDraft((d) => ({
            ...d,
            firstName: v.firstName,
            lastName: v.lastName,
            phone: v.phone,
            sensitivities: v.sensitivities,
            smsConsent: v.smsConsent,
          }))
        }
        onSubmit={onDone}
      />
    </div>
  );
}
