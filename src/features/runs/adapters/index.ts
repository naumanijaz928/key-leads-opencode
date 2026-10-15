import { collectorAdapters } from "@/features/runs/adapters/collector";
import { keyedAdapters } from "@/features/runs/adapters/keyed";
import { keylessAdapters } from "@/features/runs/adapters/keyless";
import { providerAdapters } from "@/features/runs/adapters/provider";
import type { SourceAdapter } from "@/features/runs/adapters/types";

export const ADAPTERS: SourceAdapter[] = [
  ...keylessAdapters,
  ...keyedAdapters,
  ...providerAdapters,
  ...collectorAdapters,
];

export const manualAdapter: SourceAdapter = {
  key: "manual",
  name: "Manual import",
  category: "manual",
  requiresKey: false,
  isConfigured: () => true,
  collect: async () => [],
};

export function getAdapter(key: string): SourceAdapter | undefined {
  return ADAPTERS.find((adapter) => adapter.key === key);
}

export function adapterCatalog() {
  return [...ADAPTERS, manualAdapter].map((adapter) => ({
    key: adapter.key,
    name: adapter.name,
    category: adapter.category,
    requiresKey: adapter.requiresKey,
    keyEnvVar: adapter.keyEnvVar ?? null,
    configured: adapter.isConfigured(),
  }));
}

export type { SourceAdapter, NormalizedJob } from "@/features/runs/adapters/types";
