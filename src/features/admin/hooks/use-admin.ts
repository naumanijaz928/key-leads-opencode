"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Role } from "@/types";

export interface TeamRow {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  createdAt: string;
  memberCount: number;
}

export interface MemberRow {
  userId: string;
  role: Role;
  createdAt: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface InvitationRow {
  id: string;
  email: string;
  role: Role;
  status: string;
  teamId: string | null;
  teamName: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface SignupRequestRow {
  id: string;
  userId: string | null;
  email: string;
  fullName: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

export interface UserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  status: string;
  teamId: string | null;
  teamName: string | null;
  createdAt: string;
  lastSeenAt: string | null;
}

export function useTeams() {
  return useQuery({
    queryKey: ["admin", "teams"],
    queryFn: () => apiFetch<{ items: TeamRow[] }>("/api/v1/teams"),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch("/api/v1/teams", { method: "POST", json: { name } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "teams"] }),
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/teams?id=${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "teams"] }),
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["admin", "team-members", teamId],
    queryFn: () =>
      apiFetch<{ items: MemberRow[] }>(`/api/v1/teams/${teamId}/members`),
    enabled: Boolean(teamId),
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role: Role;
    }) =>
      apiFetch(`/api/v1/teams/${teamId}/members`, {
        method: "POST",
        json: { userId, role },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "team-members"] }),
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiFetch(`/api/v1/teams/${teamId}/members?userId=${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "team-members"] }),
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["admin", "invitations"],
    queryFn: () => apiFetch<{ items: InvitationRow[] }>("/api/v1/invitations"),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: Role; teamId?: string | null }) =>
      apiFetch<{ inviteLink: string }>("/api/v1/invitations", {
        method: "POST",
        json: input,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "invitations"] }),
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/invitations?id=${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "invitations"] }),
  });
}

export function useSignupRequests(status = "pending") {
  return useQuery({
    queryKey: ["admin", "signup-requests", status],
    queryFn: () =>
      apiFetch<{ items: SignupRequestRow[] }>(
        `/api/v1/signup-requests?status=${status}`,
      ),
  });
}

export function useDecideSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      action: "approve" | "reject";
      role?: Role;
      teamId?: string | null;
    }) =>
      apiFetch("/api/v1/signup-requests", { method: "POST", json: input }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "signup-requests"] }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch<{ items: UserRow[] }>("/api/v1/users"),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      role?: Role;
      status?: string;
      teamId?: string | null;
    }) => apiFetch("/api/v1/users", { method: "PATCH", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export interface SessionRow {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  endedAt: string | null;
}

export function useSessions() {
  return useQuery({
    queryKey: ["admin", "sessions"],
    queryFn: () => apiFetch<{ items: SessionRow[] }>("/api/v1/sessions"),
  });
}

export interface AuditRow {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiFetch<{ items: AuditRow[] }>("/api/v1/audit-logs"),
  });
}
