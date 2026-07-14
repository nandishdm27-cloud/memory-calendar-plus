import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarGrid } from "@/components/memories/CalendarGrid";
import { MemoryDialog } from "@/components/memories/MemoryDialog";
import { RecapPanel } from "@/components/memories/RecapPanel";
import { Button } from "@/components/ui/button";
import { useMemories } from "@/hooks/useMemories";
import { fmtDateISO, MOOD_META, monthKey, parseISO, TEMPLATES, type Memory } from "@/lib/memories";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

type View = "calendar" | "recap";

function Index() {
  const { memories, upsert, remove, hydrated } = useMemories();
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedISO, setSelectedISO] = useState<string>(() => fmtDateISO(new Date()));
  const [view, setView] = useState<View>("calendar");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | undefined>();

  const monthMems = useMemo(() => {
    const key = monthKey(monthDate);
    return memories.filter((m) => m.date.startsWith(key));
  }, [memories, monthDate]);

  const selectedMems = useMemo(
    () => memories.filter((m) => m.date === selectedISO).sort((a, b) => a.createdAt - b.createdAt),
    [memories, selectedISO],
  );

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const isCurrentMonth = monthKey(monthDate) === monthKey(new Date());

  function shiftMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function openNew() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(m: Memory) {
    setEditing(m);
    setDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="no-print border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-3">
            <div className="font-display text-2xl font-medium tracking-tight">Marginalia</div>
            <div className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:block">
              a calendar for what's worth keeping
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <ViewTab active={view === "calendar"} onClick={() => setView("calendar")} icon={<CalendarDays className="h-3.5 w-3.5" />}>
              Calendar
            </ViewTab>
            <ViewTab active={view === "recap"} onClick={() => setView("recap")} icon={<Sparkles className="h-3.5 w-3.5" />}>
              Recap
            </ViewTab>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Month controls */}
        <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {isCurrentMonth ? "This month" : "Viewing"}
            </div>
            <h1 className="mt-1 font-display text-5xl font-normal leading-none">{monthLabel}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {monthMems.length} {monthMems.length === 1 ? "memory" : "memories"} · {monthMems.reduce((s, m) => s + m.photos.length, 0)} photos
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => {
              const now = new Date();
              setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedISO(fmtDateISO(now));
            }}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {view === "calendar" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
            {/* Calendar */}
            <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-paper)]">
              {hydrated ? (
                <CalendarGrid
                  monthDate={monthDate}
                  memories={monthMems}
                  onSelectDate={setSelectedISO}
                  selectedISO={selectedISO}
                />
              ) : (
                <div className="aspect-[7/6] animate-pulse bg-muted/30" />
              )}
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 border-t border-border bg-background/40 px-4 py-3">
                {Object.values(TEMPLATES).map((t) => (
                  <div key={t.id} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: t.colorVar }} />
                    {t.label}
                  </div>
                ))}
              </div>
            </section>

            {/* Day panel */}
            <aside className="flex flex-col rounded-lg border border-border bg-card shadow-[var(--shadow-paper)]">
              <div className="border-b border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {selectedISO === fmtDateISO(new Date()) ? "Today" : "Selected"}
                </div>
                <div className="mt-1 font-display text-2xl">
                  {parseISO(selectedISO).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <Button className="mt-4 w-full gap-2" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Add memory
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {selectedMems.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                      ·
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Nothing recorded for this day.
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {selectedMems.map((m) => {
                      const t = TEMPLATES[m.templateId];
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => openEdit(m)}
                            className={cn(
                              "group w-full overflow-hidden rounded-md border border-border bg-background text-left transition-all",
                              "hover:border-foreground/60 hover:shadow-[var(--shadow-paper)]",
                            )}
                          >
                            {m.photos[0] && (
                              <div className="aspect-[16/9] overflow-hidden bg-muted">
                                <img src={m.photos[0]} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              </div>
                            )}
                            <div className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: t.colorVar }}>
                                  {t.glyph} {t.short}
                                </span>
                                <span className="text-sm">{MOOD_META[m.mood].emoji}</span>
                              </div>
                              <div className="mt-1 font-display text-lg leading-tight">{m.title}</div>
                              {(m.location || m.tripName || m.subject || m.milestoneKind) && (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {[m.tripName, m.location, m.subject, m.milestoneKind].filter(Boolean).join(" · ")}
                                </div>
                              )}
                              {m.note && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{m.note}</p>}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <RecapPanel monthDate={monthDate} memories={monthMems} />
        )}

        <footer className="no-print mt-16 border-t border-border pt-6 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Everything you save stays on this device.
        </footer>
      </main>

      <MemoryDialog
        open={dialogOpen}
        dateISO={selectedISO}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSave={upsert}
        onDelete={remove}
      />
    </div>
  );
}

function ViewTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
