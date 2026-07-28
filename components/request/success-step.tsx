"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { LiveNailPreview } from "@/components/salon/live-nail-preview";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import type { KioskDraft } from "@/lib/kiosk/flow";
import { requiresNailChoices } from "@/lib/services";

const AUTO_RESET_S = 10;

export function SuccessStep({
  draft,
  queuePosition,
  waitMin,
  onReset,
}: {
  draft: KioskDraft;
  queuePosition: number | null;
  waitMin: number;
  onReset: () => void;
}) {
  const t = useT();
  const [seconds, setSeconds] = useState(AUTO_RESET_S);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (seconds <= 0) {
      onReset();
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, paused, onReset]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      {requiresNailChoices(draft.services) && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING}
        >
          <LiveNailPreview
            state={{
              shape: draft.shape,
              length: draft.length,
              colors: draft.colors,
              design: draft.design,
            }}
            size={160}
          />
        </motion.div>
      )}

      <h1 className="text-display font-display text-ink">
        {t("success.thanks", { name: draft.firstName || "" })}
      </h1>

      {queuePosition != null && (
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING, delay: 0.15 }}
          className="text-h1 font-display text-coral-strong"
          data-numeric
        >
          {t("success.position", { n: queuePosition })}
        </motion.p>
      )}

      <p className="text-body-lg text-ink-muted" data-numeric>
        {t("success.wait", { n: waitMin })}
      </p>

      <div className="flex flex-col items-center gap-3">
        <Button size="lg" variant="outline" onClick={onReset}>
          {t("success.startOver")}
        </Button>

        {/* The countdown is visible and pausable — a kiosk that wipes the
            screen while someone is still reading it feels hostile. */}
        {!paused ? (
          <button
            type="button"
            onClick={() => setPaused(true)}
            className="text-caption text-ink-muted underline-offset-4 hover:underline"
            data-numeric
          >
            {t("success.resettingIn", { n: seconds })} · {t("success.giveMeAMinute")}
          </button>
        ) : (
          <span className="text-caption text-ink-muted">
            {t("success.giveMeAMinute")}
          </span>
        )}
      </div>
    </div>
  );
}
