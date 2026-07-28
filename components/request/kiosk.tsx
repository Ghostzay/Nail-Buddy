"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  ConfirmGate,
  PhoneGate,
  RegisterGate,
  RepeatGate,
  SignInGate,
  WelcomeGate,
} from "@/components/request/gates";
import { PreviewBar } from "@/components/request/preview-bar";
import {
  ColorStep,
  DesignStep,
  DetailsStep,
  LengthStep,
  ReviewStep,
  ServicesStep,
  ShapeStep,
  TechStep,
} from "@/components/request/steps";
import { SuccessStep } from "@/components/request/success-step";
import { LanguageToggle } from "@/components/salon/language-toggle";
import { ProgressRail } from "@/components/salon/progress-rail";
import { StepShell } from "@/components/salon/step-shell";
import type { MaskedClient } from "@/components/salon/client-confirm-card";
import type { Technician } from "@/components/salon/tech-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBackGuard, useKioskSession } from "@/hooks/use-kiosk-session";
import { useT, type MessageKey } from "@/lib/i18n";
import { buildJobPayload, buildNotes, maxColors } from "@/lib/job-adapter";
import { canAdvance, computeSteps, type FlowStep, type Gate } from "@/lib/kiosk/flow";
import { estimate, formatMoney } from "@/lib/pricing";

type Phase = Gate | "flow" | "success";

export function Kiosk({
  technicians,
  baseWaitMin,
  queueAhead,
}: {
  technicians: Technician[];
  baseWaitMin: number;
  queueAhead: number;
}) {
  const t = useT();
  const {
    draft,
    setDraft,
    clear,
    idlePrompt,
    countdown,
    dismissIdle,
    registerReset,
  } = useKioskSession();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [client, setClient] = useState<MaskedClient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const steps = useMemo(() => computeSteps(draft), [draft]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  const resetAll = useCallback(() => {
    clear();
    setPhase("welcome");
    setStepIndex(0);
    setClient(null);
    setError(null);
    setQueuePosition(null);
  }, [clear]);

  registerReset(resetAll);

  // Back always moves within the app, never out of /request.
  const goBack = useCallback(() => {
    setError(null);
    if (phase === "flow") {
      if (stepIndex > 0) setStepIndex((i) => i - 1);
      else setPhase("signin");
      return;
    }
    if (phase === "register" || phase === "phone") setPhase("signin");
    else if (phase === "confirm") setPhase("phone");
    else if (phase === "repeat") setPhase("confirm");
    else if (phase === "signin") setPhase("welcome");
  }, [phase, stepIndex]);

  useBackGuard(goBack, phase !== "success");

  const next = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  };

  async function submit() {
    setSubmitting(true);
    setError(null);

    const sub = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      smsConsent: draft.smsConsent,
      sensitivities: draft.sensitivities.map((s) => t(`sensitivity.${s}` as MessageKey)),
      services: draft.services,
      techId: draft.techId,
      shape: draft.shape,
      length: draft.length,
      colors: draft.colors,
      toeColors: draft.toeColors,
      design: draft.design,
      notes: draft.notes,
      // Only photos that finished uploading are sent — the picker never blocks
      // Send, so a slow upload just means that photo doesn't make this request.
      photoUrls: draft.photos.map((p) => p.remoteUrl).filter((u): u is string => !!u),
    };

    const notes = buildNotes(sub, {
      services: t("services.question"),
      toes: t("color.differentToes"),
      avoid: t("register.avoid"),
      extraColors: t("color.question"),
    });

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildJobPayload(sub, notes)),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

      setQueuePosition(body.queuePosition ?? queueAhead + 1);
      toast.success(t("send.sent"));
      setPhase("success");
    } catch (err) {
      // A customer standing at a tablet must never be shown a raw exception —
      // "TypeError: fetch failed" tells them nothing and looks broken. They get
      // the actionable sentence; the technical detail goes to the console for
      // whoever is debugging the kiosk.
      console.error("Kiosk submit failed:", err);
      // The draft is intentionally left intact so "tap Send again" is true.
      setError(t("send.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const est = estimate(draft.services);

  return (
    <div className="kiosk mx-auto flex min-h-screen w-full max-w-[880px] flex-col px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <span className="text-coral inline-flex items-center gap-2">
          <Sparkles className="size-5" aria-hidden />
          <span className="text-label">Nail Buddy</span>
        </span>

        {phase === "flow" && (
          <ProgressRail
            steps={steps}
            currentIndex={stepIndex}
            onJumpTo={setStepIndex}
            className="hidden sm:flex"
          />
        )}

        <LanguageToggle />
      </header>

      <main className="flex flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={phase === "flow" ? `flow-${step}` : phase}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {phase === "welcome" && <WelcomeGate onStart={() => setPhase("signin")} />}

            {phase === "signin" && (
              <SignInGate
                onNew={() => setPhase("register")}
                onReturning={() => setPhase("phone")}
              />
            )}

            {phase === "phone" && (
              <PhoneGate
                draft={draft}
                setDraft={setDraft}
                onFound={(c) => {
                  setClient(c);
                  setDraft((d) => ({ ...d, clientId: c.clientId }));
                  setPhase("confirm");
                }}
                onNotFound={(phone) => {
                  setDraft((d) => ({ ...d, phone }));
                  setPhase("register");
                }}
              />
            )}

            {phase === "confirm" && client && (
              <ConfirmGate
                client={client}
                onConfirm={() => {
                  const [first, ...rest] = client.displayName.split(" ");
                  setDraft((d) => ({
                    ...d,
                    firstName: first ?? "",
                    lastName: rest.join(" ").replace(".", ""),
                  }));
                  setPhase(client.lastVisitSummary ? "repeat" : "flow");
                }}
                onReject={() => {
                  setClient(null);
                  setDraft((d) => ({ ...d, phone: "", clientId: null }));
                  setPhase("phone");
                }}
              />
            )}

            {phase === "repeat" && client?.lastVisitSummary && (
              <RepeatGate
                summary={client.lastVisitSummary}
                onRepeat={() => {
                  // Straight to review, everything still editable.
                  setPhase("flow");
                  setStepIndex(Math.max(0, computeSteps(draft).length - 1));
                }}
                onDifferent={() => {
                  setPhase("flow");
                  setStepIndex(0);
                }}
              />
            )}

            {phase === "register" && (
              <RegisterGate
                draft={draft}
                setDraft={setDraft}
                onDone={() => {
                  setPhase("flow");
                  setStepIndex(0);
                }}
              />
            )}

            {phase === "flow" && (
              <StepShell
                stepKey={step}
                question={t(QUESTION[step])}
                helper={
                  // "Pick up to three" is a lie while the schema stores one
                  // colour, so the hint tracks the real limit.
                  step === "color" && maxColors() === 1
                    ? undefined
                    : HELPER[step]
                      ? t(HELPER[step]!)
                      : undefined
                }
                onBack={goBack}
                onNext={step === "review" ? undefined : next}
                nextDisabled={!canAdvance(step, draft)}
                footer={
                  draft.services.length > 0 ? (
                    <PreviewBar draft={draft} className="mt-4" />
                  ) : undefined
                }
              >
                {step === "services" && <ServicesStep draft={draft} setDraft={setDraft} />}
                {step === "tech" && (
                  <TechStep
                    draft={draft}
                    setDraft={setDraft}
                    technicians={technicians}
                    baseWaitMin={baseWaitMin}
                  />
                )}
                {step === "shape" && <ShapeStep draft={draft} setDraft={setDraft} />}
                {step === "length" && <LengthStep draft={draft} setDraft={setDraft} />}
                {step === "color" && <ColorStep draft={draft} setDraft={setDraft} />}
                {step === "design" && <DesignStep draft={draft} setDraft={setDraft} />}
                {step === "details" && <DetailsStep draft={draft} setDraft={setDraft} />}
                {step === "review" && (
                  <div className="flex flex-col gap-6">
                    <ReviewStep
                      draft={draft}
                      error={error}
                      onEditStep={(s) => {
                        const i = steps.indexOf(s as FlowStep);
                        if (i >= 0) setStepIndex(i);
                      }}
                    />
                    <Button size="xl" block loading={submitting} onClick={submit}>
                      {submitting ? t("send.sending") : t("send.cta")}
                    </Button>
                    <p className="text-caption text-ink-muted text-center" data-numeric>
                      {t("common.estimate")} · ~{formatMoney(est.totalCents)} ·{" "}
                      {t("common.aboutMinutes", { n: est.durationMin })}
                    </p>
                  </div>
                )}
              </StepShell>
            )}

            {phase === "success" && (
              <SuccessStep
                draft={draft}
                queuePosition={queuePosition}
                waitMin={baseWaitMin}
                onReset={resetAll}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Idle reset — non-negotiable for privacy. */}
      <Dialog open={idlePrompt} onOpenChange={(o) => !o && dismissIdle()}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-h1 font-display">{t("idle.title")}</DialogTitle>
            <DialogDescription className="text-body-lg" data-numeric>
              {t("idle.body", { n: countdown })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="lg" block onClick={dismissIdle}>
              {t("idle.stay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const QUESTION: Record<FlowStep, MessageKey> = {
  services: "services.question",
  tech: "tech.question",
  shape: "shape.question",
  length: "length.question",
  color: "color.question",
  design: "design.question",
  details: "details.question",
  review: "send.review",
};

const HELPER: Partial<Record<FlowStep, MessageKey>> = {
  services: "services.helper",
  shape: "shape.helper",
  color: "color.helper",
  details: "details.helper",
  review: "send.check",
};
