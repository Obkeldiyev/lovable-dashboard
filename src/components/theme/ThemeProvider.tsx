import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark";
export type PresetId =
  | "default"
  | "ocean"
  | "sunset"
  | "forest"
  | "mono"
  | "midnight";

export type ThemeTokens = {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  border: string;
  radius: string; // rem
  font: string;
};

export const PRESETS: Record<PresetId, { light: ThemeTokens; dark: ThemeTokens; label: string }> = {
  default: {
    label: "Default",
    light: {
      background: "0 0% 100%", foreground: "222 47% 11%",
      primary: "222 47% 11%", primaryForeground: "210 40% 98%",
      accent: "210 40% 96%", accentForeground: "222 47% 11%",
      muted: "210 40% 96%", border: "214 32% 91%",
      radius: "0.5", font: "Inter",
    },
    dark: {
      background: "222 47% 6%", foreground: "210 40% 98%",
      primary: "210 40% 98%", primaryForeground: "222 47% 11%",
      accent: "217 33% 17%", accentForeground: "210 40% 98%",
      muted: "217 33% 17%", border: "217 33% 17%",
      radius: "0.5", font: "Inter",
    },
  },
  ocean: {
    label: "Ocean",
    light: {
      background: "210 50% 98%", foreground: "215 50% 12%",
      primary: "199 89% 48%", primaryForeground: "210 40% 98%",
      accent: "199 89% 92%", accentForeground: "215 50% 12%",
      muted: "210 40% 94%", border: "210 32% 88%",
      radius: "0.75", font: "Inter",
    },
    dark: {
      background: "215 50% 7%", foreground: "210 40% 98%",
      primary: "199 89% 55%", primaryForeground: "215 50% 7%",
      accent: "199 60% 18%", accentForeground: "210 40% 98%",
      muted: "215 40% 14%", border: "215 30% 18%",
      radius: "0.75", font: "Inter",
    },
  },
  sunset: {
    label: "Sunset",
    light: {
      background: "30 50% 98%", foreground: "20 30% 12%",
      primary: "16 85% 55%", primaryForeground: "30 50% 98%",
      accent: "32 95% 92%", accentForeground: "20 30% 12%",
      muted: "30 30% 94%", border: "30 25% 88%",
      radius: "1", font: "Inter",
    },
    dark: {
      background: "20 30% 7%", foreground: "30 50% 96%",
      primary: "16 90% 60%", primaryForeground: "20 30% 7%",
      accent: "20 40% 18%", accentForeground: "30 50% 96%",
      muted: "20 25% 14%", border: "20 25% 18%",
      radius: "1", font: "Inter",
    },
  },
  forest: {
    label: "Forest",
    light: {
      background: "140 30% 98%", foreground: "150 30% 10%",
      primary: "152 60% 36%", primaryForeground: "140 30% 98%",
      accent: "150 50% 92%", accentForeground: "150 30% 10%",
      muted: "150 20% 94%", border: "150 20% 86%",
      radius: "0.5", font: "Inter",
    },
    dark: {
      background: "150 30% 7%", foreground: "140 30% 96%",
      primary: "152 65% 48%", primaryForeground: "150 30% 7%",
      accent: "150 30% 16%", accentForeground: "140 30% 96%",
      muted: "150 25% 13%", border: "150 25% 18%",
      radius: "0.5", font: "Inter",
    },
  },
  mono: {
    label: "Mono",
    light: {
      background: "0 0% 100%", foreground: "0 0% 8%",
      primary: "0 0% 9%", primaryForeground: "0 0% 98%",
      accent: "0 0% 94%", accentForeground: "0 0% 9%",
      muted: "0 0% 96%", border: "0 0% 90%",
      radius: "0.25", font: "Inter",
    },
    dark: {
      background: "0 0% 6%", foreground: "0 0% 96%",
      primary: "0 0% 96%", primaryForeground: "0 0% 8%",
      accent: "0 0% 14%", accentForeground: "0 0% 96%",
      muted: "0 0% 12%", border: "0 0% 18%",
      radius: "0.25", font: "Inter",
    },
  },
  midnight: {
    label: "Midnight",
    light: {
      background: "240 30% 98%", foreground: "250 40% 12%",
      primary: "258 80% 58%", primaryForeground: "240 30% 98%",
      accent: "258 70% 94%", accentForeground: "250 40% 12%",
      muted: "240 20% 94%", border: "240 20% 88%",
      radius: "0.75", font: "Inter",
    },
    dark: {
      background: "250 40% 6%", foreground: "240 30% 96%",
      primary: "258 90% 70%", primaryForeground: "250 40% 6%",
      accent: "258 40% 18%", accentForeground: "240 30% 96%",
      muted: "250 30% 12%", border: "250 30% 18%",
      radius: "0.75", font: "Inter",
    },
  },
};

type ThemeState = {
  mode: ThemeMode;
  preset: PresetId;
  custom: Partial<ThemeTokens> | null;
};

type Ctx = ThemeState & {
  setMode: (m: ThemeMode, originX?: number, originY?: number) => void;
  toggleMode: (originX?: number, originY?: number) => void;
  setPreset: (p: PresetId) => void;
  setCustom: (c: Partial<ThemeTokens> | null) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "vms.theme.v1";

function load(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return { mode: prefersDark ? "dark" : "light", preset: "default", custom: null };
}

function applyTokens(state: ThemeState) {
  const preset = PRESETS[state.preset];
  const base = preset[state.mode];
  const tokens: ThemeTokens = { ...base, ...(state.custom ?? {}) };
  const root = document.documentElement;
  root.classList.toggle("dark", state.mode === "dark");
  root.style.setProperty("--background", tokens.background);
  root.style.setProperty("--foreground", tokens.foreground);
  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--primary-foreground", tokens.primaryForeground);
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--accent-foreground", tokens.accentForeground);
  root.style.setProperty("--secondary", tokens.accent);
  root.style.setProperty("--secondary-foreground", tokens.accentForeground);
  root.style.setProperty("--muted", tokens.muted);
  root.style.setProperty("--muted-foreground", tokens.foreground);
  root.style.setProperty("--card", tokens.background);
  root.style.setProperty("--card-foreground", tokens.foreground);
  root.style.setProperty("--popover", tokens.background);
  root.style.setProperty("--popover-foreground", tokens.foreground);
  root.style.setProperty("--border", tokens.border);
  root.style.setProperty("--input", tokens.border);
  root.style.setProperty("--ring", tokens.primary);
  root.style.setProperty("--radius", `${tokens.radius}rem`);
  document.body.style.fontFamily = `${tokens.font}, system-ui, sans-serif`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(() => load());

  useEffect(() => {
    applyTokens(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const runWithTransition = useCallback(
    (mutate: () => void, originX?: number, originY?: number) => {
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      };
      if (!doc.startViewTransition) {
        mutate();
        return;
      }
      const x = originX ?? window.innerWidth - 32;
      const y = originY ?? 32;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      const transition = doc.startViewTransition(() => mutate());
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 480,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    },
    [],
  );

  const setMode = useCallback(
    (mode: ThemeMode, x?: number, y?: number) =>
      runWithTransition(() => setState((s) => ({ ...s, mode })), x, y),
    [runWithTransition],
  );
  const toggleMode = useCallback(
    (x?: number, y?: number) =>
      setMode(state.mode === "dark" ? "light" : "dark", x, y),
    [state.mode, setMode],
  );
  const setPreset = useCallback(
    (preset: PresetId) =>
      runWithTransition(() => setState((s) => ({ ...s, preset }))),
    [runWithTransition],
  );
  const setCustom = useCallback(
    (custom: Partial<ThemeTokens> | null) =>
      setState((s) => ({ ...s, custom })),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({ ...state, setMode, toggleMode, setPreset, setCustom }),
    [state, setMode, toggleMode, setPreset, setCustom],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}
