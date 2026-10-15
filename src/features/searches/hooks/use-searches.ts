"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { SearchConfig, SearchProfile } from "@/types";

export function useSearches() {
  return useQuery({
    queryKey: ["searches"],
    queryFn: () => apiFetch<{ items: SearchProfile[] }>("/api/v1/searches"),
  });
}

export interface SearchInput {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  priority?: number;
  config?: Partial<SearchConfig>;
}

export function useCreateSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SearchInput) =>
      apiFetch("/api/v1/searches", { method: "POST", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["searches"] }),
  });
}

export function useUpdateSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SearchInput & { id: string }) =>
      apiFetch(`/api/v1/searches/${id}`, { method: "PATCH", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["searches"] }),
  });
}

export function useDeleteSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/searches/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["searches"] }),
  });
}

export function usePreviewSearch() {
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: SearchConfig }) =>
      apiFetch<{ scanned: number; matched: number; sample: string[] }>(
        `/api/v1/searches/${id}/preview`,
        { method: "POST", json: { config } },
      ),
  });
}
