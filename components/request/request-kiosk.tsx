"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, PartyPopper, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BigChoiceGrid } from "@/components/request/big-choice-grid";
import { PhotoUpload } from "@/components/request/photo-upload";
import {
  COLOR_FAMILY_OPTIONS,
  DESIGN_TYPE_OPTIONS,
  LENGTH_OPTIONS,
  SHAPE_OPTIONS,
  type ColorFamily,
  type DesignType,
  type Length,
  type Shape,
} from "@/lib/types";

const COLOR_SWATCH: Record<ColorFamily, string> = {
  nudes: "bg-[#e3c1a5]",
  reds: "bg-[#b3122a]",
  pinks: "bg-[#f4a6c6]",
  blacks: "bg-[#1a1a1a]",
  whites: "bg-[#fafafa]",
  chrome: "bg-gradient-to-br from-slate-300 to-slate-500",
  glitter: "bg-gradient-to-br from-fuchsia-400 via-amber-300 to-sky-400",
};

const STEPS = [
  "welcome",
  "shape",
  "length",
  "color",
  "design",
  "notes",
  "review",
  "success",
] as const;

type Step = (typeof STEPS)[number];

const PROGRESS_STEPS: Step[] = ["welcome", "shape", "length", "color", "design", "notes"];

interface FormState {
  name: string;
  phone: string;
  shape: Shape | null;
  length: Length | null;
  colorFamily: ColorFamily | null;
  designType: DesignType | null;
  notes: string;
  photoUrl: string | null;
}

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  shape: null,
  length: null,
  colorFamily: null,
  designType: null,
  notes: "",
  photoUrl: null,
};

export function RequestKiosk() {
  const [step, setStep] = useState<Step>("welcome");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "success") return;
    const timer = setTimeout(() => {
      setForm(EMPTY_FORM);
      setStep("welcome");
    }, 8000);
    return () => clearTimeout(timer);
  }, [step]);

  function goNext() {
    const i = STEPS.indexOf(step);
    setStep(STEPS[Math.min(i + 1, STEPS.length - 1)]);
  }

  function goBack() {
    const i = STEPS.indexOf(step);
    setStep(STEPS[Math.max(i - 1, 0)]);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone || undefined,
          shape: form.shape,
          length: form.length,
          colorFamily: form.colorFamily,
          designType: form.designType,
          notes: form.notes || undefined,
          photoUrl: form.photoUrl || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const progressIndex = PROGRESS_STEPS.indexOf(step);

  return (
    <div className="kiosk mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-4 sm:px-8 sm:py-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-6" />
          <span className="text-lg font-bold tracking-tight">Nail Buddy</span>
        </div>
        {progressIndex >= 0 && (
          <div className="flex gap-1.5">
            {PROGRESS_STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-2 w-6 rounded-full transition-colors ${
                  i <= progressIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col justify-center">
        {step === "welcome" && (
          <StepShell title="Welcome in!" subtitle="Let's get your nails started. What's your name?">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-base">
                  Name
                </Label>
                <Input
                  id="name"
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="h-14 text-xl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-base">
                  Phone number (optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 555-5555"
                  className="h-14 text-xl"
                />
              </div>
            </div>
            <NavButtons onNext={goNext} nextDisabled={!form.name.trim()} showBack={false} />
          </StepShell>
        )}

        {step === "shape" && (
          <StepShell title="Pick a shape" subtitle="What shape would you like?">
            <BigChoiceGrid
              options={SHAPE_OPTIONS}
              value={form.shape}
              onChange={(shape) => setForm((f) => ({ ...f, shape }))}
            />
            <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!form.shape} />
          </StepShell>
        )}

        {step === "length" && (
          <StepShell title="Pick a length" subtitle="How long would you like them?">
            <BigChoiceGrid
              options={LENGTH_OPTIONS}
              value={form.length}
              onChange={(length) => setForm((f) => ({ ...f, length }))}
              columns={2}
            />
            <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!form.length} />
          </StepShell>
        )}

        {step === "color" && (
          <StepShell title="Pick a color family" subtitle="What color family are you feeling?">
            <BigChoiceGrid
              options={COLOR_FAMILY_OPTIONS.map((o) => ({
                ...o,
                swatchClassName: COLOR_SWATCH[o.value],
              }))}
              value={form.colorFamily}
              onChange={(colorFamily) => setForm((f) => ({ ...f, colorFamily }))}
            />
            <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!form.colorFamily} />
          </StepShell>
        )}

        {step === "design" && (
          <StepShell title="Pick a design" subtitle="What kind of design would you like?">
            <BigChoiceGrid
              options={DESIGN_TYPE_OPTIONS}
              value={form.designType}
              onChange={(designType) => setForm((f) => ({ ...f, designType }))}
            />
            <NavButtons onNext={goNext} onBack={goBack} nextDisabled={!form.designType} />
          </StepShell>
        )}

        {step === "notes" && (
          <StepShell title="Anything else?" subtitle="Add notes or a reference photo for your tech (optional).">
            <div className="flex flex-col gap-5">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Short and square, I have a wedding this weekend, be gentle on my thumb..."
                className="min-h-32 text-lg"
              />
              <PhotoUpload
                photoUrl={form.photoUrl}
                onChange={(photoUrl) => setForm((f) => ({ ...f, photoUrl }))}
              />
            </div>
            <NavButtons onNext={goNext} onBack={goBack} nextLabel="Review" />
          </StepShell>
        )}

        {step === "review" && (
          <StepShell title="Review your request" subtitle="Everything look good?">
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 text-lg">
              <ReviewRow label="Name" value={form.name} />
              {form.phone && <ReviewRow label="Phone" value={form.phone} />}
              <ReviewRow label="Shape" value={label(SHAPE_OPTIONS, form.shape)} />
              <ReviewRow label="Length" value={label(LENGTH_OPTIONS, form.length)} />
              <ReviewRow label="Color family" value={label(COLOR_FAMILY_OPTIONS, form.colorFamily)} />
              <ReviewRow label="Design" value={label(DESIGN_TYPE_OPTIONS, form.designType)} />
              {form.notes && <ReviewRow label="Notes" value={form.notes} />}
              {form.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.photoUrl}
                  alt="Reference"
                  className="size-32 rounded-xl border object-cover"
                />
              )}
            </div>
            {error && <p className="mt-3 text-center text-destructive">{error}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <Button
                size="xl"
                className="w-full sm:w-auto"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Send className="size-6" />
                )}
                Send Request
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={goBack}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="size-5" />
                Back
              </Button>
            </div>
          </StepShell>
        )}

        {step === "success" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <PartyPopper className="size-16 text-primary" />
            <h1 className="text-3xl font-bold">Thanks, {form.name}!</h1>
            <p className="max-w-sm text-lg text-muted-foreground">
              Your request has been sent. A tech will be with you shortly — please have a
              seat.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setForm(EMPTY_FORM);
                setStep("welcome");
              }}
            >
              Start a new request
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function NavButtons({
  onNext,
  onBack,
  nextDisabled,
  nextLabel = "Next",
  showBack = true,
}: {
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showBack?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
      <Button size="xl" className="w-full sm:w-auto" disabled={nextDisabled} onClick={onNext}>
        {nextLabel}
      </Button>
      {showBack && onBack && (
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onBack}>
          <ArrowLeft className="size-5" />
          Back
        </Button>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function label<T extends string>(options: { value: T; label: string }[], value: T | null) {
  return options.find((o) => o.value === value)?.label ?? "—";
}
