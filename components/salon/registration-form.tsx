"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/salon/language-toggle";
import { formatPhone } from "@/components/salon/phone-keypad";
import { useHaptic } from "@/components/providers/preferences-provider";
import { useT, type MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SENSITIVITIES: { id: string; labelKey: MessageKey }[] = [
  { id: "acrylic", labelKey: "sensitivity.acrylic" },
  { id: "acetone", labelKey: "sensitivity.acetone" },
  { id: "latex", labelKey: "sensitivity.latex" },
  { id: "fragrance", labelKey: "sensitivity.fragrance" },
  { id: "injury", labelKey: "sensitivity.injury" },
  { id: "other", labelKey: "sensitivity.other" },
];

export interface RegistrationValues {
  firstName: string;
  lastName: string;
  phone: string;
  sensitivities: string[];
  smsConsent: boolean;
  referral?: string;
}

/**
 * One screen, no scrolling on 768×1024.
 *
 * Deliberately absent: email, birthday, address. Each is a field that slows
 * check-in and creates a data-retention liability; the front desk can collect
 * them later if the salon actually wants them.
 *
 * Validation fires on blur, not on submit — telling someone about six problems
 * at once after they thought they were done is the worst possible moment.
 */
export function RegistrationForm({
  values,
  onChange,
  onSubmit,
  phoneSlot,
  className,
}: {
  values: RegistrationValues;
  onChange: (next: RegistrationValues) => void;
  onSubmit: () => void;
  /** The kiosk passes its PhoneKeypad here; other surfaces get a text input. */
  phoneSlot?: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  const haptic = useHaptic();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    firstName: values.firstName.trim() ? null : t("register.required"),
    lastName: values.lastName.trim() ? null : t("register.required"),
    phone:
      values.phone.length === 10
        ? null
        : t("phone.invalid", { n: values.phone.length }),
  };
  const valid = !errors.firstName && !errors.lastName && !errors.phone;

  const set = <K extends keyof RegistrationValues>(
    k: K,
    v: RegistrationValues[K]
  ) => onChange({ ...values, [k]: v });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-first">{t("register.firstName")}</Label>
          <Input
            id="reg-first"
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, firstName: true }))}
            aria-invalid={touched.firstName && !!errors.firstName}
            aria-describedby="reg-first-err"
            autoComplete="given-name"
          />
          {touched.firstName && errors.firstName && (
            <p id="reg-first-err" role="alert" className="text-caption text-danger-strong">
              {errors.firstName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-last">{t("register.lastName")}</Label>
          <Input
            id="reg-last"
            value={values.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, lastName: true }))}
            aria-invalid={touched.lastName && !!errors.lastName}
            aria-describedby="reg-last-err"
            autoComplete="family-name"
          />
          {touched.lastName && errors.lastName && (
            <p id="reg-last-err" role="alert" className="text-caption text-danger-strong">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-phone">{t("register.phone")}</Label>
        {phoneSlot ?? (
          <Input
            id="reg-phone"
            inputMode="numeric"
            value={formatPhone(values.phone)}
            onChange={(e) =>
              set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            autoComplete="tel"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("register.language")}</Label>
        <LanguageToggle className="w-fit" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-label text-ink-muted pb-1">
          {t("register.avoid")}
        </legend>
        <p className="text-caption text-ink-muted pb-1">{t("register.avoidHint")}</p>
        <div className="flex flex-wrap gap-2">
          {SENSITIVITIES.map((s) => {
            const on = values.sensitivities.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => {
                  haptic();
                  set(
                    "sensitivities",
                    on
                      ? values.sensitivities.filter((x) => x !== s.id)
                      : [...values.sensitivities, s.id]
                  );
                }}
                className={cn(
                  "min-h-12 rounded-pill border-2 px-4 text-body font-medium transition-colors duration-[160ms] active:scale-[0.97]",
                  on
                    ? "border-warning-strong bg-warning/18 text-warning-strong"
                    : "border-hairline-strong bg-surface-raised text-ink"
                )}
              >
                {t(s.labelKey)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Queue texts only. Bundling promotional consent into this checkbox
          would be the kind of thing that gets a salon a TCPA letter. */}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={values.smsConsent}
          onChange={(e) => set("smsConsent", e.target.checked)}
          className="accent-coral mt-1 size-6 shrink-0"
        />
        <span className="flex flex-col">
          <span className="text-body-lg text-ink">{t("register.smsConsent")}</span>
          <span className="text-caption text-ink-muted">{t("register.smsHint")}</span>
        </span>
      </label>

      <Button type="submit" size="xl" block disabled={!valid}>
        {t("common.continue")}
      </Button>
    </form>
  );
}

export { SENSITIVITIES };
