"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import { formatMoney } from "@/lib/pricing";

/**
 * Surfaces the hands+feet saving. This is the most common upsell in a nail
 * salon and it belongs in the customer's eyeline, not folded silently into
 * the total where it does nothing for them or for the salon.
 */
export function ComboBadge({ savingCents }: { savingCents: number }) {
  const t = useT();
  if (savingCents <= 0) return null;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING}
      className="inline-block"
    >
      <Badge variant="solid-coral">
        <Sparkles className="size-3.5" aria-hidden />
        {t("services.comboSaves", { amount: formatMoney(savingCents) })}
      </Badge>
    </motion.span>
  );
}
