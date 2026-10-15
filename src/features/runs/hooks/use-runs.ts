"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Run, RunSource } from "@/types";

export interface RunSnapshot {
  run: Run;
  sources: RunSource[];
}

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: () => apiFetch<{ items: Run[] }>("/api/v1/runs"),
  });
}

export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { searchId?: string | null; sources?: string[] }) =>
      apiFetch<{ run: Run }>("/api/v1/runs", { method: "POST", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["runs"] }),
  });
}

export function useCancelRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/runs/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["runs"] }),
  });
}

export function useRunStream(runId: string | null) {
  const [frame, setFrame] = React.useState<{ id: string; data: RunSnapshot } | null>(
    null,
  );
  const [live, setLive] = React.useState(false);

  React.useEffect(() => {
    if (!runId) return;

    const source = new EventSource(`/api/v1/runs/${runId}/stream`);

    const onSnapshot = (event: MessageEvent) => {
      try {
        setFrame({ id: runId, data: JSON.parse(event.data) as RunSnapshot });
      } catch {
        // ignore malformed frame
      }
    };

    const onDone = () => {
      setLive(false);
      source.close();
    };

    source.onopen = () => setLive(true);
    source.onerror = onDone;
    source.addEventListener("snapshot", onSnapshot as unknown as EventListener);
    source.addEventListener("done", onDone);

    return () => {
      source.close();
    };
  }, [runId]);

  return {
    snapshot: frame && frame.id === runId ? frame.data : null,
    live,
  };
}
