export type TemplateId = "trip" | "school" | "day" | "milestone";

export type Mood = "amazing" | "good" | "okay" | "meh" | "rough";

export interface Memory {
  id: string;
  date: string; // YYYY-MM-DD
  templateId: TemplateId;
  title: string;
  note: string;
  photos: string[]; // data URLs
  mood: Mood;
  tags: string[];
  // template-specific optional fields
  location?: string;
  tripName?: string;
  subject?: string;
  milestoneKind?: string;
  createdAt: number;
}

export const TEMPLATES: Record<TemplateId, {
  id: TemplateId;
  label: string;
  short: string;
  hint: string;
  colorVar: string;
  glyph: string;
}> = {
  trip: { id: "trip", label: "Trip", short: "TRIP", hint: "Location, dates, photos, itinerary", colorVar: "var(--tpl-trip)", glyph: "◇" },
  school: { id: "school", label: "School", short: "SCH", hint: "Classes, exams, campus, friends", colorVar: "var(--tpl-school)", glyph: "▲" },
  day: { id: "day", label: "Everyday", short: "DAY", hint: "A small moment with a photo + note", colorVar: "var(--tpl-day)", glyph: "•" },
  milestone: { id: "milestone", label: "Milestone", short: "MSTN", hint: "Birthdays, achievements, firsts", colorVar: "var(--tpl-milestone)", glyph: "★" },
};

export const MOOD_META: Record<Mood, { label: string; emoji: string; score: number }> = {
  amazing: { label: "Amazing", emoji: "◉", score: 5 },
  good: { label: "Good", emoji: "◎", score: 4 },
  okay: { label: "Okay", emoji: "○", score: 3 },
  meh: { label: "Meh", emoji: "◔", score: 2 },
  rough: { label: "Rough", emoji: "◕", score: 1 },
};

const STORAGE_KEY = "marginalia:memories:v1";

export function loadMemories(): Memory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMemories(memories: Memory[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (e) {
    console.error("Failed to save memories", e);
  }
}

export function fmtDateISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Downscale image via canvas to keep localStorage small.
export async function compressImage(file: File, maxDim = 1400, quality = 0.82): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  if (typeof window === "undefined") return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}