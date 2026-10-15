"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { SourceRow } from "@/types";

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: () => apiFetch<{ items: SourceRow[] }>("/api/v1/sources"),
  });
}

export function useToggleSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiFetch(`/api/v1/sources/${id}`, {
        method: "PATCH",
        json: { enabled },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }),
  });
}
