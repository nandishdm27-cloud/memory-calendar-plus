import { TEMPLATES, type Memory, fmtDateISO } from "@/lib/memories";
import { cn } from "@/lib/utils";

interface Props {
  monthDate: Date;
  memories: Memory[];
  onSelectDate: (iso: string) => void;
  selectedISO?: string;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({ monthDate, memories, onSelectDate, selectedISO }: Props) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const today = fmtDateISO(new Date());

  const byDate = new Map<string, Memory[]>();
  for (const m of memories) {
    const arr = byDate.get(m.date) ?? [];
    arr.push(m);
    byDate.set(m.date, arr);
  }

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const iso = fmtDateISO(new Date(year, month, dayNum));
    return { dayNum, iso, entries: byDate.get(iso) ?? [] };
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 border-b border-border">
        {DOW.map((d) => (
          <div key={d} className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={idx} className="aspect-square border-b border-r border-border/60 bg-muted/30" />;
          }
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selectedISO;
          const hasEntries = cell.entries.length > 0;
          const firstPhoto = cell.entries.find((e) => e.photos.length > 0)?.photos[0];
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(cell.iso)}
              className={cn(
                "group relative aspect-square border-b border-r border-border/60 p-2 text-left transition-colors",
                "hover:bg-accent/40 focus:outline-none focus:bg-accent/60",
                isSelected && "ring-2 ring-foreground ring-inset z-10",
              )}
            >
              {firstPhoto && (
                <div
                  className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
                  style={{
                    backgroundImage: `url(${firstPhoto})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
              <div className="relative flex items-start justify-between">
                <span
                  className={cn(
                    "font-display text-lg leading-none",
                    isToday && "font-semibold",
                    firstPhoto && "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]",
                  )}
                >
                  {cell.dayNum}
                </span>
                {isToday && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    today
                  </span>
                )}
              </div>
              {hasEntries && (
                <div className="relative mt-auto flex flex-wrap gap-1 pt-6">
                  {cell.entries.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: TEMPLATES[e.templateId].colorVar }}
                      title={e.title}
                    />
                  ))}
                  {cell.entries.length > 4 && (
                    <span className="font-mono text-[9px] text-muted-foreground">
                      +{cell.entries.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}