"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface MaskedClient {
  clientId: string;
  /** Already masked server-side: "Mai N." */
  displayName: string;
  /** Already masked server-side: "(•••) •••-0142" */
  maskedPhone: string;
  lastVisitAt?: string | null;
  lastVisitSummary?: string | null;
  usualTech?: string | null;
  sensitivities?: string[];
}

/**
 * Privacy-critical screen. The kiosk sits in a public room, so this shows a
 * single masked candidate and never a searchable list.
 *
 * Everything here arrives ALREADY MASKED from the client_lookup RPC — this
 * component does no masking of its own, because masking in the UI means the
 * unmasked record travelled to the device and is sitting in memory and in the
 * network tab. See supabase/migrations/0002.
 */
export function ClientConfirmCard({
  client,
  onConfirm,
  onReject,
  onEdit,
  className,
}: {
  client: MaskedClient;
  onConfirm: () => void;
  onReject: () => void;
  onEdit?: () => void;
  className?: string;
}) {
  const t = useT();

  return (
    <div
      className={cn(
        "border-hairline bg-surface-raised flex flex-col gap-5 rounded-card border p-6 shadow-md",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-h1 font-display text-ink">{client.displayName}</h2>
        <p className="text-body-lg text-ink-muted" data-numeric>
          {client.maskedPhone}
        </p>
      </div>

      {(client.lastVisitSummary || client.usualTech) && (
        <dl className="flex flex-col gap-2">
          {client.lastVisitSummary && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="text-label text-ink-muted">{t("confirm.lastVisit")}</dt>
              <dd className="text-body text-ink">{client.lastVisitSummary}</dd>
            </div>
          )}
          {client.usualTech && (
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="text-label text-ink-muted">{t("confirm.usuallySees")}</dt>
              <dd className="text-body text-ink">{client.usualTech}</dd>
            </div>
          )}
        </dl>
      )}

      {client.sensitivities && client.sensitivities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {client.sensitivities.map((s) => (
            <Badge key={s} variant="warning" size="sm">
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" block onClick={onConfirm} className="sm:flex-1">
          {t("confirm.yes")}
        </Button>
        <Button variant="outline" size="lg" block onClick={onReject} className="sm:flex-1">
          {t("confirm.no")}
        </Button>
      </div>

      {onEdit && (
        // Offered quietly — never a required step in the check-in path.
        <Button variant="ghost" size="sm" onClick={onEdit} className="self-center">
          <Pencil className="size-4" />
          {t("confirm.updateInfo")}
        </Button>
      )}
    </div>
  );
}
