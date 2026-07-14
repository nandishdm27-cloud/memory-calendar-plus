import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImage, MOOD_META, newId, TEMPLATES, type Memory, type Mood, type TemplateId } from "@/lib/memories";
import { cn } from "@/lib/utils";
import { X, Upload } from "lucide-react";

interface Props {
  open: boolean;
  dateISO: string;
  editing?: Memory;
  onClose: () => void;
  onSave: (m: Memory) => void;
  onDelete?: (id: string) => void;
}

export function MemoryDialog({ open, dateISO, editing, onClose, onSave, onDelete }: Props) {
  const [templateId, setTemplateId] = useState<TemplateId>("day");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [mood, setMood] = useState<Mood>("good");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [tripName, setTripName] = useState("");
  const [subject, setSubject] = useState("");
  const [milestoneKind, setMilestoneKind] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTemplateId(editing.templateId);
      setTitle(editing.title);
      setNote(editing.note);
      setPhotos(editing.photos);
      setMood(editing.mood);
      setTags(editing.tags.join(", "));
      setLocation(editing.location ?? "");
      setTripName(editing.tripName ?? "");
      setSubject(editing.subject ?? "");
      setMilestoneKind(editing.milestoneKind ?? "");
    } else {
      setTemplateId("day");
      setTitle("");
      setNote("");
      setPhotos([]);
      setMood("good");
      setTags("");
      setLocation("");
      setTripName("");
      setSubject("");
      setMilestoneKind("");
    }
  }, [open, editing]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const results: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        const url = await compressImage(f);
        results.push(url);
      }
      setPhotos((prev) => [...prev, ...results]);
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    const m: Memory = {
      id: editing?.id ?? newId(),
      date: dateISO,
      templateId,
      title: title.trim(),
      note: note.trim(),
      photos,
      mood,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      location: location.trim() || undefined,
      tripName: tripName.trim() || undefined,
      subject: subject.trim() || undefined,
      milestoneKind: milestoneKind.trim() || undefined,
      createdAt: editing?.createdAt ?? Date.now(),
    };
    onSave(m);
    onClose();
  }

  const prettyDate = new Date(dateISO).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {prettyDate}
          </div>
          <DialogTitle className="font-display text-3xl font-normal">
            {editing ? "Edit memory" : "New memory"}
          </DialogTitle>
          <DialogDescription className="sr-only">Add a memory for this day.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Template</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.values(TEMPLATES).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "flex flex-col items-start rounded-md border border-border bg-card p-3 text-left transition-all",
                    templateId === t.id ? "border-foreground shadow-[var(--shadow-paper)]" : "hover:border-foreground/40",
                  )}
                >
                  <span className="text-xl" style={{ color: t.colorVar }}>{t.glyph}</span>
                  <span className="mt-1 font-display text-base">{t.label}</span>
                  <span className="mt-1 text-[11px] leading-tight text-muted-foreground">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                templateId === "trip" ? "Sunset walk in Lisbon" :
                templateId === "school" ? "Final chem exam" :
                templateId === "milestone" ? "Turned 20" :
                "Coffee with M."
              }
              className="mt-1 border-0 border-b border-border rounded-none px-0 text-2xl font-display focus-visible:ring-0 focus-visible:border-foreground shadow-none"
            />
          </div>

          {templateId === "trip" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trip" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Trip name</Label>
                <Input id="trip" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Portugal '26" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="loc" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Location</Label>
                <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lisbon, PT" className="mt-1" />
              </div>
            </div>
          )}
          {templateId === "school" && (
            <div>
              <Label htmlFor="subj" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Class / subject</Label>
              <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Organic Chemistry" className="mt-1" />
            </div>
          )}
          {templateId === "milestone" && (
            <div>
              <Label htmlFor="mk" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Kind</Label>
              <Input id="mk" value={milestoneKind} onChange={(e) => setMilestoneKind(e.target.value)} placeholder="Birthday · Achievement · First" className="mt-1" />
            </div>
          )}

          <div>
            <Label htmlFor="note" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made this day worth remembering?"
              rows={4}
              className="mt-1 resize-none"
            />
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Photos</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-border">
                  <img src={p} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                <Upload className="h-4 w-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
                  {uploading ? "..." : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
                />
              </label>
            </div>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mood</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(MOOD_META) as Mood[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors",
                    mood === m ? "bg-foreground text-background border-foreground" : "hover:bg-accent/60",
                  )}
                >
                  <span>{MOOD_META[m].emoji}</span>
                  <span>{MOOD_META[m].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tags" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="friends, coffee, sunset (comma-separated)" className="mt-1" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {editing && onDelete && (
                <Button
                  variant="ghost"
                  onClick={() => { onDelete(editing.id); onClose(); }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                {editing ? "Save" : "Add memory"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}