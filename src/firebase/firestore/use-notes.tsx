"use client";

import { useMemo } from "react";
import { collection, query } from "firebase/firestore";
import { useCollection, WithId } from "./use-collection";
import { useFirestore, useMemoFirebase } from "../provider";
import type { Note } from "@/lib/types";

export function useNotes(userId?: string, mindmapId?: string | null) {
  const firestore = useFirestore();

  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !userId || !mindmapId) return null;
    return query(
      collection(firestore, `users/${userId}/mindmaps/${mindmapId}/notes`)
    );
  }, [firestore, userId, mindmapId]);

  const { data: notes, isLoading, error } = useCollection<Note>(notesQuery);

  return { notes, isLoading, error };
}
