import { useMemo } from "react";
import { MOOD_META, TEMPLATES, type Memory, parseISO } from "@/lib/memories";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface Props {
  monthDate: Date;
  memories: Memory[];
}

export function RecapPanel({ monthDate, memories }: Props) {
  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const stats = useMemo(() => {
    const total = memories.length;
    const withPhotos = memories.filter((m) => m.photos.length > 0).length;
    const trips = memories.filter((m) => m.templateId === "trip").length;
    const school = memories.filter((m) => m.templateId === "school").length;
    const milestones = memories.filter((m) => m.templateId === "milestone").length;
    const days = memories.filter((m) => m.templateId === "day").length;
    const totalPhotos = memories.reduce((s, m) => s + m.photos.length, 0);
    const uniqueDays = new Set(memories.map((m) => m.date)).size;
    const moodAvg = total > 0
      ? memories.reduce((s, m) => s + MOOD_META[m.mood].score, 0) / total
      : 0;
    const tagCounts = new Map<string, number>();
    for (const m of memories) for (const t of m.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    // active week
    const weekCounts = new Map<number, number>();
    for (const m of memories) {
      const d = parseISO(m.date);
      const w = Math.ceil(d.getDate() / 7);
      weekCounts.set(w, (weekCounts.get(w) ?? 0) + 1);
    }
    let topWeek = 0, topWeekN = 0;
    for (const [w, n] of weekCounts) if (n > topWeekN) { topWeek = w; topWeekN = n; }
    return { total, withPhotos, trips, school, milestones, days, totalPhotos, uniqueDays, moodAvg, topTags, topWeek, topWeekN };
  }, [memories]);

  const photos = useMemo(() => memories.flatMap((m) => m.photos.map((p) => ({ url: p, m }))).slice(0, 12), [memories]);
  const sorted = useMemo(() => [...memories].sort((a, b) => a.date.localeCompare(b.date)), [memories]);

  if (memories.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center border border-dashed border-border bg-card p-12 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {monthLabel} · recap
        </div>
        <h3 className="mt-4 font-display text-3xl">Nothing to look back on yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Add a few memories to this month and your recap will appear here at the end.
        </p>
      </div>
    );
  }

  const moodEntry = Object.entries(MOOD_META).reduce((best, [k, v]) => {
    return Math.abs(v.score - stats.moodAvg) < Math.abs(best[1].score - stats.moodAvg) ? [k, v] as [string, typeof v] : best;
  }, ["okay", MOOD_META.okay] as [string, typeof MOOD_META.okay]);

  return (
    <div className="print-recap space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            End-of-month recap
          </div>
          <h2 className="mt-2 font-display text-5xl font-normal leading-none">{monthLabel}</h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {stats.total} {stats.total === 1 ? "memory" : "memories"} across {stats.uniqueDays} {stats.uniqueDays === 1 ? "day" : "days"} · {stats.totalPhotos} photos captured.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="no-print gap-2">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Shareable card */}
      <section
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-lift)]"
      >
        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Marginalia · {monthLabel}
            </div>
            <h3 className="mt-4 font-display text-6xl leading-[0.9]">
              A month <em className="italic">worth</em> keeping.
            </h3>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <Stat n={stats.total} label="Memories" />
              <Stat n={stats.totalPhotos} label="Photos" />
              <Stat n={stats.uniqueDays} label="Days" />
            </div>
            <div className="mt-6 flex items-center gap-3 text-sm">
              <span className="text-2xl">{moodEntry[1].emoji}</span>
              <span>Overall mood: <span className="font-medium">{moodEntry[1].label.toLowerCase()}</span></span>
            </div>
          </div>
          <CollageMini photos={photos.slice(0, 5)} />
        </div>
      </section>

      {/* Highlight collage */}
      {photos.length > 0 && (
        <section>
          <SectionHeader kicker="01" title="Highlight reel" note={`${photos.length} of ${stats.totalPhotos} photos`} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p, i) => (
              <figure key={i} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                <img src={p.url} alt={p.m.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
                    {p.m.date.slice(5)}
                  </div>
                  <div className="truncate font-display text-sm text-white">{p.m.title}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <section>
        <SectionHeader kicker="02" title="By the numbers" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Trips" n={stats.trips} color={TEMPLATES.trip.colorVar} />
          <StatCard label="School" n={stats.school} color={TEMPLATES.school.colorVar} />
          <StatCard label="Everyday" n={stats.days} color={TEMPLATES.day.colorVar} />
          <StatCard label="Milestones" n={stats.milestones} color={TEMPLATES.milestone.colorVar} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Most active</div>
            <div className="mt-2 font-display text-2xl">
              {stats.topWeekN > 0 ? `Week ${stats.topWeek}` : "—"}
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.topWeekN} {stats.topWeekN === 1 ? "memory" : "memories"} recorded
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Top tags</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stats.topTags.length === 0 && <span className="text-sm text-muted-foreground">No tags yet</span>}
              {stats.topTags.map(([tag, count]) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
                  <span>{tag}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <SectionHeader kicker="03" title="The story, in order" />
        <ol className="relative border-l border-border pl-6">
          {sorted.map((m) => {
            const t = TEMPLATES[m.templateId];
            const d = parseISO(m.date);
            return (
              <li key={m.id} className="relative mb-8 last:mb-0">
                <span
                  className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: t.colorVar }}
                />
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em]"
                    style={{ color: t.colorVar, borderColor: t.colorVar, borderWidth: 1 }}
                  >
                    <span>{t.glyph}</span>{t.short}
                  </span>
                  <span className="text-sm">{MOOD_META[m.mood].emoji}</span>
                </div>
                <h4 className="mt-1 font-display text-xl">{m.title}</h4>
                {(m.location || m.tripName || m.subject || m.milestoneKind) && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {[m.tripName, m.location, m.subject, m.milestoneKind].filter(Boolean).join(" · ")}
                  </div>
                )}
                {m.note && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/80">{m.note}</p>}
                {m.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.photos.slice(0, 5).map((p, i) => (
                      <img key={i} src={p} alt="" className="h-20 w-20 rounded object-cover border border-border" />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function SectionHeader({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{kicker}</span>
        <h3 className="font-display text-2xl">{title}</h3>
      </div>
      {note && <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{note}</span>}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl leading-none">{n}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}

function StatCard({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="mt-2 font-display text-4xl leading-none">{n}</div>
    </div>
  );
}

function CollageMini({ photos }: { photos: { url: string; m: Memory }[] }) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
        Add photos to memories<br />to fill this space
      </div>
    );
  }
  return (
    <div className="grid aspect-square grid-cols-3 grid-rows-3 gap-1.5">
      {photos[0] && <img src={photos[0].url} alt="" className="col-span-2 row-span-2 h-full w-full rounded object-cover" />}
      {photos[1] && <img src={photos[1].url} alt="" className="h-full w-full rounded object-cover" />}
      {photos[2] && <img src={photos[2].url} alt="" className="h-full w-full rounded object-cover" />}
      {photos[3] && <img src={photos[3].url} alt="" className="col-span-2 h-full w-full rounded object-cover" />}
      {photos[4] && <img src={photos[4].url} alt="" className="h-full w-full rounded object-cover" />}
    </div>
  );
}