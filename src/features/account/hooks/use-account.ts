"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@/types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ user: SessionUser }>("/api/v1/me"),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      fullName?: string;
      avatarUrl?: string | null;
      timezone?: string;
    }) => apiFetch("/api/v1/me", { method: "PATCH", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

export interface AppSettings {
  default_window_hours: number;
  default_remote_policy: string;
  email_notifications: boolean;
  export_format: string;
  attribution_enabled: boolean;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      apiFetch<{ data: AppSettings; teamId: string | null }>("/api/v1/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) =>
      apiFetch("/api/v1/settings", { method: "PATCH", json: { data } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}
