"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { BUILD_CAMPAIGN, type CampaignRecord } from "@/domain/campaign";

type Snapshot = {
  ready: boolean;
  record: CampaignRecord;
  error: string | null;
};

const SERVER_SNAPSHOT: Snapshot = { ready: false, record: BUILD_CAMPAIGN, error: null };
let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let loading = false;

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function refresh() {
  try {
    const response = await fetch("/api/campaign", { cache: "no-store" });
    if (response.status === 401) {
      emit({ ready: true, record: BUILD_CAMPAIGN, error: null });
      return;
    }
    if (!response.ok) throw new Error("Campaign status could not be read.");
    const record = (await response.json()) as CampaignRecord;
    emit({ ready: true, record, error: null });
  } catch (error) {
    emit({
      ready: true,
      record: BUILD_CAMPAIGN,
      error: error instanceof Error ? error.message : "Campaign status could not be read.",
    });
  }
}

function getClientSnapshot(): Snapshot {
  if (!loading && typeof window !== "undefined") {
    loading = true;
    void refresh();
  }
  return snapshot;
}

export async function confirmCampaignStart(): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch("/api/campaign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true }),
  });
  const payload = (await response.json()) as CampaignRecord & { error?: string; record?: CampaignRecord };
  if (!response.ok) {
    emit({ ready: true, record: payload.record ?? snapshot.record, error: payload.error ?? "The campaign was not started." });
    return { ok: false, error: payload.error };
  }
  emit({ ready: true, record: payload, error: null });
  return { ok: true };
}

const CampaignContext = createContext<Snapshot | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const current = useSyncExternalStore(subscribe, getClientSnapshot, () => SERVER_SNAPSHOT);
  return <CampaignContext.Provider value={current}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): Snapshot {
  const value = useContext(CampaignContext);
  if (!value) throw new Error("CampaignProvider is missing");
  return value;
}
