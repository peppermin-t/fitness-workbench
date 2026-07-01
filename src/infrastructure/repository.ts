import { invoke } from "@tauri-apps/api/core";
import { createDefaultData } from "../domain/seed";
import type { AppData } from "../domain/types";

const isTauri = "__TAURI_INTERNALS__" in window;

let memoryData: AppData = createDefaultData();

export async function loadAppData(): Promise<AppData> {
  if (!isTauri) return structuredClone(memoryData);
  const json = await invoke<string>("load_app_data");
  const parsed = JSON.parse(json) as AppData;
  return normalizeData(parsed);
}

export async function saveAppData(data: AppData): Promise<AppData> {
  const normalized = normalizeData(data);
  if (!isTauri) {
    memoryData = structuredClone(normalized);
    return normalized;
  }
  await invoke("save_app_data", { dataJson: JSON.stringify(normalized) });
  return normalized;
}

export async function exportBackupJson(data: AppData): Promise<string> {
  return JSON.stringify(normalizeData(data), null, 2);
}

export function normalizeData(input: AppData): AppData {
  const base = createDefaultData();
  return {
    ...base,
    ...input,
    gyms: input.gyms?.length ? input.gyms : base.gyms,
    goals: input.goals ?? [],
    plan: input.plan ?? null,
    sessions: input.sessions ?? [],
    exerciseLogs: input.exerciseLogs ?? [],
    metrics: input.metrics ?? [],
    nutritionLogs: input.nutritionLogs ?? [],
    advice: input.advice ?? [],
    revisions: input.revisions ?? [],
    backupSnapshots: input.backupSnapshots ?? []
  };
}
