"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Company, Paginated } from "@/types";

export interface CompanyFilters {
  q?: string;
  status?: string;
  page?: number;
}

export function useCompanies(filters: CompanyFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return useQuery({
    queryKey: ["companies", filters],
    queryFn: () =>
      apiFetch<Paginated<Company>>(`/api/v1/companies?${params.toString()}`),
    placeholderData: (previous) => previous,
  });
}

export function useCompany(id: string | null) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: () =>
      apiFetch<{
        company: Company;
        leads: { id: string; title: string; source: string }[];
      }>(`/api/v1/companies/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status?: string;
      ownerId?: string | null;
      notes?: string | null;
      website?: string | null;
      location?: string | null;
    }) => apiFetch(`/api/v1/companies/${id}`, { method: "PATCH", json: body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
}
