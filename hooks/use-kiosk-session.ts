"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EMPTY_DRAFT, type KioskDraft } from "@/lib/kiosk/flow";

const DRAFT_KEY = "nb-kiosk-draft";

/** 90s of no input, then a 15s countdown, then a full wipe (§8). */
const IDLE_MS = 90_000;
export const IDLE_COUNTDOWN_S = 15;

/**
 * Kiosk session lifecycle. Three jobs, all of them privacy jobs:
 *
 *  1. Persist the draft to sessionStorage — NOT localStorage. A refresh
 *     mid-flow shouldn't lose answers, but the draft must not outlive the
 *     browser session and greet the next customer.
 *  2. Reset after inactivity, so the next person never sees the last one's
 *     name, phone, or photos.
 *  3. Own the step history, so the hardware back button can't reveal a
 *     previous customer's screen.
 */
export function useKioskSession() {
  const [draft, setDraft] = useState<KioskDraft>(EMPTY_DRAFT);
  const [idlePrompt, setIdlePrompt] = useState(false);
  const [countdown, setCountdown] = useState(IDLE_COUNTDOWN_S);
  const [hydrated, setHydrated] = useState(false);
  const resetRef = useRef<() => void>(() => {});

  // ---- restore ------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as KioskDraft;
        // Object URLs from a previous page load are dead after a refresh, so
        // photos never survive — the customer re-adds them rather than seeing
        // broken thumbnails.
        setDraft({ ...EMPTY_DRAFT, ...parsed, photos: [] });
      }
    } catch {
      /* corrupt or unavailable — start clean */
    }
    setHydrated(true);
  }, []);

  // ---- persist ------------------------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    try {
      const { photos, ...rest } = draft;
      void photos;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {
      /* storage full or disabled — the flow still works, just not resumable */
    }
  }, [draft, hydrated]);

  const clear = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setIdlePrompt(false);
    setCountdown(IDLE_COUNTDOWN_S);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* non-fatal */
    }
  }, []);

  // ---- idle detection -----------------------------------------------------
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpActivity = useCallback(() => {
    if (idlePrompt) return; // the dialog owns the clock once it's up
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdlePrompt(true), IDLE_MS);
  }, [idlePrompt]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "wheel",
    ];
    events.forEach((e) => window.addEventListener(e, bumpActivity, { passive: true }));
    bumpActivity();
    return () => {
      events.forEach((e) => window.removeEventListener(e, bumpActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bumpActivity]);

  // ---- countdown once prompted -------------------------------------------
  useEffect(() => {
    if (!idlePrompt) return;
    setCountdown(IDLE_COUNTDOWN_S);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          resetRef.current();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [idlePrompt]);

  const dismissIdle = useCallback(() => {
    setIdlePrompt(false);
    bumpActivity();
  }, [bumpActivity]);

  return {
    draft,
    setDraft,
    hydrated,
    clear,
    idlePrompt,
    countdown,
    dismissIdle,
    /** Registered by the flow so the countdown can reset it to the welcome screen. */
    registerReset: (fn: () => void) => {
      resetRef.current = fn;
    },
  };
}

/**
 * Keeps the hardware/browser back button inside the app's own step history.
 *
 * Without this, back navigates away from /request entirely — and on a kiosk
 * the forward button then walks a stranger back into the previous customer's
 * session.
 */
export function useBackGuard(onBack: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    // Seed one entry so there is always something to pop.
    history.pushState({ kiosk: true }, "");
    const handler = (e: PopStateEvent) => {
      void e;
      onBack();
      history.pushState({ kiosk: true }, "");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [onBack, active]);
}
