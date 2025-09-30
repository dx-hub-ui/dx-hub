"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  ATTENTION_BOXES_SEED,
  ATTENTION_BOX_READS_SEED,
  CURRENT_OWNER_ID,
  DASHBOARD_MEMBERS,
  DASHBOARD_ORG_ID,
} from "./mock-data";
import type { AttentionBoxReadRecord, AttentionBoxRecord, DashboardMemberRole } from "./types";

const BOXES_STORAGE_KEY = "dxhub.attention.boxes";
const READS_STORAGE_KEY = "dxhub.attention.reads";

function parseBoxes(value: string | null): AttentionBoxRecord[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as AttentionBoxRecord[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse attention boxes storage", error);
  }
  return [];
}

function parseReads(value: string | null): AttentionBoxReadRecord[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as AttentionBoxReadRecord[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse attention box reads storage", error);
  }
  return [];
}

function persistBoxes(boxes: AttentionBoxRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(boxes));
}

function persistReads(reads: AttentionBoxReadRecord[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(READS_STORAGE_KEY, JSON.stringify(reads));
}

function getMemberRole(memberId: string): DashboardMemberRole {
  return DASHBOARD_MEMBERS.find((member) => member.id === memberId)?.role ?? "rep";
}

function matchesAudience(box: AttentionBoxRecord, memberId: string, memberRole: DashboardMemberRole) {
  switch (box.audience) {
    case "org":
      return true;
    case "leaders":
      return memberRole === "owner" || memberRole === "leader";
    case "reps":
      return memberRole === "rep";
    case "custom":
      return box.audienceMemberIds?.includes(memberId) ?? false;
    default:
      return false;
  }
}

function isBoxActive(box: AttentionBoxRecord, now: Date) {
  const start = new Date(box.startAt).getTime();
  const end = new Date(box.endAt).getTime();
  const current = now.getTime();
  return current >= start && current <= end;
}

export interface AttentionBoxFilters {
  status?: "active" | "future" | "expired";
  variant?: AttentionBoxRecord["variant"] | "all";
  audience?: AttentionBoxRecord["audience"] | "all";
}

export function useAttentionBoxStore(memberId: string) {
  const [boxes, setBoxes] = useState<AttentionBoxRecord[]>(ATTENTION_BOXES_SEED);
  const [reads, setReads] = useState<AttentionBoxReadRecord[]>(ATTENTION_BOX_READS_SEED);
  const memberRole = useMemo(() => getMemberRole(memberId), [memberId]);
  const readBoxIds = useMemo(() => {
    return new Set(reads.filter((record) => record.memberId === memberId).map((record) => record.attentionBoxId));
  }, [memberId, reads]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedBoxes = parseBoxes(window.localStorage.getItem(BOXES_STORAGE_KEY));
    const storedReads = parseReads(window.localStorage.getItem(READS_STORAGE_KEY));

    if (storedBoxes.length === 0) {
      persistBoxes(ATTENTION_BOXES_SEED);
      setBoxes(ATTENTION_BOXES_SEED);
    } else {
      setBoxes(storedBoxes);
    }

    if (storedReads.length === 0) {
      persistReads(ATTENTION_BOX_READS_SEED);
      setReads(ATTENTION_BOX_READS_SEED);
    } else {
      setReads(storedReads);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BOXES_STORAGE_KEY) {
        setBoxes(parseBoxes(event.newValue));
      }
      if (event.key === READS_STORAGE_KEY) {
        setReads(parseReads(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const sortedBoxes = useMemo(() => {
    return [...boxes].sort((a, b) => {
      if (a.pinned && !b.pinned) {
        return -1;
      }
      if (!a.pinned && b.pinned) {
        return 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [boxes]);

  const canView = useCallback(
    (box: AttentionBoxRecord, now = new Date()) => {
      if (box.orgId !== DASHBOARD_ORG_ID) {
        return false;
      }
      if (!isBoxActive(box, now)) {
        return false;
      }
      return matchesAudience(box, memberId, memberRole);
    },
    [memberId, memberRole],
  );

  const visibleBoxes = useMemo(() => {
    const now = new Date();
    return sortedBoxes.filter((box) => {
      if (!canView(box, now)) {
        return false;
      }
      if (box.pinned) {
        return true;
      }
      return !readBoxIds.has(box.id);
    });
  }, [canView, readBoxIds, sortedBoxes]);

  const markAsRead = useCallback(
    (boxId: string) => {
      const alreadyRead = reads.some((record) => record.attentionBoxId === boxId && record.memberId === memberId);
      if (alreadyRead) {
        return;
      }
      const nextReads: AttentionBoxReadRecord[] = [
        ...reads,
        {
          attentionBoxId: boxId,
          memberId,
          readAt: new Date().toISOString(),
        },
      ];
      setReads(nextReads);
      persistReads(nextReads);
    },
    [memberId, reads],
  );

  const upsertBox = useCallback(
    (box: AttentionBoxRecord) => {
      setBoxes((current) => {
        const index = current.findIndex((item) => item.id === box.id);
        const next = [...current];
        if (index >= 0) {
          next[index] = box;
        } else {
          next.push(box);
        }
        persistBoxes(next);
        return next;
      });
    },
    [],
  );

  const createBox = useCallback(
    (input: Omit<AttentionBoxRecord, "id" | "createdAt" | "updatedAt" | "createdByMemberId" | "orgId">) => {
      const now = new Date().toISOString();
      const box: AttentionBoxRecord = {
        id: nanoid(12),
        orgId: DASHBOARD_ORG_ID,
        createdByMemberId: memberId ?? CURRENT_OWNER_ID,
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      upsertBox(box);
      return box;
    },
    [memberId, upsertBox],
  );

  const updateBox = useCallback(
    (boxId: string, patch: Partial<Omit<AttentionBoxRecord, "id" | "orgId" | "createdByMemberId" | "createdAt">>) => {
      setBoxes((current) => {
        const index = current.findIndex((item) => item.id === boxId);
        if (index < 0) {
          return current;
        }
        const existing = current[index];
        const updated: AttentionBoxRecord = {
          ...existing,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        const next = [...current];
        next[index] = updated;
        persistBoxes(next);
        return next;
      });
    },
    [],
  );

  const deleteBox = useCallback((boxId: string) => {
    setBoxes((current) => {
      const next = current.filter((box) => box.id !== boxId);
      persistBoxes(next);
      return next;
    });
    setReads((current) => {
      const next = current.filter((record) => record.attentionBoxId !== boxId);
      persistReads(next);
      return next;
    });
  }, []);

  const resetToSeed = useCallback(() => {
    setBoxes(ATTENTION_BOXES_SEED);
    setReads(ATTENTION_BOX_READS_SEED);
    persistBoxes(ATTENTION_BOXES_SEED);
    persistReads(ATTENTION_BOX_READS_SEED);
  }, []);

  return {
    boxes: sortedBoxes,
    reads,
    readBoxIds,
    visibleBoxes,
    markAsRead,
    createBox,
    updateBox,
    deleteBox,
    resetToSeed,
    canView,
  };
}

export function filterAttentionBoxes(
  boxes: AttentionBoxRecord[],
  filters: AttentionBoxFilters,
  now = new Date(),
) {
  return boxes.filter((box) => {
    if (filters.variant && filters.variant !== "all" && box.variant !== filters.variant) {
      return false;
    }
    if (filters.audience && filters.audience !== "all" && box.audience !== filters.audience) {
      return false;
    }
    if (!filters.status || filters.status === "active") {
      if (filters.status === "active" && !isBoxActive(box, now)) {
        return false;
      }
      if (!filters.status) {
        return true;
      }
    }
    if (filters.status === "future") {
      return new Date(box.startAt).getTime() > now.getTime();
    }
    if (filters.status === "expired") {
      return new Date(box.endAt).getTime() < now.getTime();
    }
    return true;
  });
}
