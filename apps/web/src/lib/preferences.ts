/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";

export type Preferences = {
  defaultModel: string;
  timeDisplay: "local" | "utc";
  density: "comfortable" | "compact";
  notifyAnalysisDone: boolean;
  notifyReportPublished: boolean;
  notifyWorkflowFailed: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  defaultModel: "olmo-3:7b",
  timeDisplay: "local",
  density: "comfortable",
  notifyAnalysisDone: true,
  notifyReportPublished: true,
  notifyWorkflowFailed: true,
};

const KEY = "open-polityra:preferences";

function read(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Per-browser preferences. Safe to use from any client component. */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(read());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setPrefs(DEFAULT_PREFERENCES);
  }, []);

  return { prefs, update, reset, ready };
}
