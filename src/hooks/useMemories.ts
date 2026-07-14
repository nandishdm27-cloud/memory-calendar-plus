import { useCallback, useEffect, useState } from "react";
import { loadMemories, saveMemories, type Memory } from "@/lib/memories";

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMemories(loadMemories());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveMemories(memories);
  }, [memories, hydrated]);

  const upsert = useCallback((m: Memory) => {
    setMemories((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx === -1) return [...prev, m];
      const next = prev.slice();
      next[idx] = m;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { memories, upsert, remove, hydrated };
}