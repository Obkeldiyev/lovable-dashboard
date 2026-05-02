import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Layout } from "react-grid-layout";

export type WidgetId =
  | "kpi-products"
  | "kpi-warehouses"
  | "kpi-suppliers"
  | "kpi-low-stock"
  | "kpi-pending-po"
  | "kpi-shipments"
  | "chart-fulfillment"
  | "chart-po-status"
  | "list-recent-activity"
  | "list-low-stock"
  | "list-alerts";

export const ALL_WIDGETS: WidgetId[] = [
  "kpi-products",
  "kpi-warehouses",
  "kpi-suppliers",
  "kpi-low-stock",
  "kpi-pending-po",
  "kpi-shipments",
  "chart-fulfillment",
  "chart-po-status",
  "list-recent-activity",
  "list-low-stock",
  "list-alerts",
];

const DEFAULT_LAYOUT: Layout[] = [
  { i: "kpi-products", x: 0, y: 0, w: 3, h: 2 },
  { i: "kpi-warehouses", x: 3, y: 0, w: 3, h: 2 },
  { i: "kpi-suppliers", x: 6, y: 0, w: 3, h: 2 },
  { i: "kpi-low-stock", x: 9, y: 0, w: 3, h: 2 },
  { i: "kpi-pending-po", x: 0, y: 2, w: 3, h: 2 },
  { i: "kpi-shipments", x: 3, y: 2, w: 3, h: 2 },
  { i: "chart-fulfillment", x: 6, y: 2, w: 6, h: 5 },
  { i: "chart-po-status", x: 0, y: 4, w: 6, h: 5 },
  { i: "list-recent-activity", x: 0, y: 9, w: 6, h: 6 },
  { i: "list-low-stock", x: 6, y: 7, w: 6, h: 4 },
  { i: "list-alerts", x: 6, y: 11, w: 6, h: 4 },
];

type State = {
  editMode: boolean;
  layout: Layout[];
  widgets: WidgetId[];
};

const STORAGE_KEY = "vms.dashboard.layout.v1";

function load(): { layout: Layout[]; widgets: WidgetId[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.layout) && Array.isArray(p.widgets)) return p;
    }
  } catch {}
  return { layout: DEFAULT_LAYOUT, widgets: [...ALL_WIDGETS] };
}

const persisted = load();

const initial: State = {
  editMode: false,
  layout: persisted.layout,
  widgets: persisted.widgets,
};

function persist(s: State) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ layout: s.layout, widgets: s.widgets }),
    );
  } catch {}
}

const slice = createSlice({
  name: "dashboard",
  initialState: initial,
  reducers: {
    setEditMode(s, a: PayloadAction<boolean>) {
      s.editMode = a.payload;
    },
    setLayout(s, a: PayloadAction<Layout[]>) {
      s.layout = a.payload;
      persist(s);
    },
    addWidget(s, a: PayloadAction<WidgetId>) {
      if (s.widgets.includes(a.payload)) return;
      s.widgets.push(a.payload);
      const last = s.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
      s.layout.push({ i: a.payload, x: 0, y: last, w: 4, h: 3 });
      persist(s);
    },
    removeWidget(s, a: PayloadAction<WidgetId>) {
      s.widgets = s.widgets.filter((w) => w !== a.payload);
      s.layout = s.layout.filter((l) => l.i !== a.payload);
      persist(s);
    },
    resetLayout(s) {
      s.layout = DEFAULT_LAYOUT;
      s.widgets = [...ALL_WIDGETS];
      persist(s);
    },
  },
});

export const { setEditMode, setLayout, addWidget, removeWidget, resetLayout } =
  slice.actions;
export default slice.reducer;
