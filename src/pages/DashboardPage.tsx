import { useEffect } from "react";
import { ReactGridLayout, WidthProvider } from "react-grid-layout/legacy";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, RotateCcw, X, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  ALL_WIDGETS, addWidget, removeWidget, resetLayout, setEditMode, setLayout,
} from "@/store/dashboardSlice";
import { WIDGETS } from "@/features/dashboard/widgets";
import { useTranslation } from "react-i18next";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const Grid = WidthProvider(ReactGridLayout);

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { editMode, layout, widgets } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    document.title = `${t("dashboard.title")} · VMS`;
  }, [t]);

  const available = ALL_WIDGETS.filter((w) => !widgets.includes(w));
  const visibleLayout = layout.filter((l) => widgets.includes(l.i as never));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("dashboard.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {editMode ? t("dashboard.editMode") : t("dashboard.liveOverview")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={available.length === 0}>
                    <Plus className="h-4 w-4 mr-1" /> {t("dashboard.addWidget")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>{t("dashboard.available")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {available.length === 0 && (
                    <DropdownMenuItem disabled>{t("dashboard.allWidgetsInUse")}</DropdownMenuItem>
                  )}
                  {available.map((w) => (
                    <DropdownMenuItem key={w} onClick={() => dispatch(addWidget(w))}>
                      {t(`dashboard.widgets.${w}`, WIDGETS[w].label)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="ghost" onClick={() => dispatch(resetLayout())}>
                <RotateCcw className="h-4 w-4 mr-1" /> {t("dashboard.reset")}
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={editMode ? "default" : "outline"}
            onClick={() => dispatch(setEditMode(!editMode))}
          >
            {editMode ? (
              <><Check className="h-4 w-4 mr-1" /> {t("dashboard.done")}</>
            ) : (
              <><Pencil className="h-4 w-4 mr-1" /> {t("dashboard.edit")}</>
            )}
          </Button>
        </div>
      </div>

      <Grid
        layout={visibleLayout}
        cols={12}
        rowHeight={48}
        margin={[12, 12]}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={(l) => editMode && dispatch(setLayout(l as never))}
        draggableCancel=".no-drag"
      >
        {widgets.map((w) => (
          <div key={w} className="relative">
            {editMode && (
              <button
                aria-label={t("dashboard.removeWidget", "Remove widget")}
                onClick={() => dispatch(removeWidget(w))}
                className="no-drag absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-md hover:scale-110 transition-transform"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <div className="h-full">{WIDGETS[w].render()}</div>
          </div>
        ))}
      </Grid>
    </div>
  );
}