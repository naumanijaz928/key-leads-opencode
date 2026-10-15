"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Lead, Paginated } from "@/types";
import type { LeadFilters } from "@/features/leads/api/queries";

export interface LeadFacets {
  sources: { value: string; total: number }[];
  pipelines: { value: string; total: number }[];
}

function buildQuery(filters: LeadFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () =>
      apiFetch<Paginated<Lead>>(`/api/v1/leads?${buildQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => apiFetch<{ lead: Lead }>(`/api/v1/leads/${id}`),
    enabled: Boolean(id),
  });
}

export function useLeadFacets() {
  return useQuery({
    queryKey: ["lead-facets"],
    queryFn: () => apiFetch<LeadFacets>("/api/v1/leads/roles"),
  });
}

export function useHideReasons() {
  return useQuery({
    queryKey: ["hide-reasons"],
    queryFn: () =>
      apiFetch<{ items: { key: string; label: string }[] }>(
        "/api/v1/hide-reasons",
      ),
  });
}

function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["lead-facets"] });
  };
}

export function useMarkViewed() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/view`, { method: "POST" }),
  });
}

export function useApplyLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/apply`, {
        method: "POST",
        json: { status: "applied" },
      }),
    onSuccess: invalidate,
  });
}

export function useUnapplyLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/apply`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useHideLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, reason, note }: { id: string; reason: string; note?: string }) =>
      apiFetch(`/api/v1/leads/${id}/hide`, {
        method: "POST",
        json: { reason, note },
      }),
    onSuccess: invalidate,
  });
}

export function useUnhideLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/leads/${id}/hide`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
