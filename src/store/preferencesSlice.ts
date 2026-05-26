import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type NavMode = "navbar" | "sidebar";
export type SidebarVariant = "expanded" | "collapsed" | "icon";

export type UserPreferences = {
  navMode: NavMode;
  sidebarVariant: SidebarVariant;
  compactMode: boolean;
  showBreadcrumbs: boolean;
  animationsEnabled: boolean;
  tableRowSize: "sm" | "md" | "lg";
  defaultPageSize: number;
  stickyHeader: boolean;
  showQuickActions: boolean;
  language: string;
  // Extended preferences
  desktopNotifications: boolean;
  soundAlerts: boolean;
  autoRefresh: boolean;
  fontScale: "sm" | "md" | "lg";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  currency: string;
  timezone: string;
};

const STORAGE_KEY = "vms.preferences.v2";

const defaults: UserPreferences = {
  navMode: "navbar",
  sidebarVariant: "expanded",
  compactMode: false,
  showBreadcrumbs: true,
  animationsEnabled: true,
  tableRowSize: "md",
  defaultPageSize: 25,
  stickyHeader: true,
  showQuickActions: true,
  language: "en",
  desktopNotifications: false,
  soundAlerts: false,
  autoRefresh: true,
  fontScale: "md",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  currency: "USD",
  timezone: "UTC",
};

function load(): UserPreferences {
  try {
    // Try new key first, fall back to old key
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("vms.preferences.v1");
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return { ...defaults };
}

function persist(s: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

const slice = createSlice({
  name: "preferences",
  initialState: load(),
  reducers: {
    setNavMode(s, a: PayloadAction<NavMode>) {
      s.navMode = a.payload;
      persist(s);
    },
    setSidebarVariant(s, a: PayloadAction<SidebarVariant>) {
      s.sidebarVariant = a.payload;
      persist(s);
    },
    updatePreferences(s, a: PayloadAction<Partial<UserPreferences>>) {
      Object.assign(s, a.payload);
      persist(s);
    },
    loadPreferences(_s, a: PayloadAction<Partial<UserPreferences>>) {
      const merged = { ...defaults, ...a.payload };
      persist(merged);
      return merged;
    },
    resetPreferences() {
      persist(defaults);
      return { ...defaults };
    },
  },
});

export const {
  setNavMode,
  setSidebarVariant,
  updatePreferences,
  loadPreferences,
  resetPreferences,
} = slice.actions;
export default slice.reducer;
