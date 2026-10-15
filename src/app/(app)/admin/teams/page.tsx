"use client";

import * as React from "react";
import { Plus, Trash, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddTeamMember,
  useCreateTeam,
  useDeleteTeam,
  useRemoveTeamMember,
  useTeamMembers,
  useTeams,
  useUsers,
} from "@/features/admin/hooks/use-admin";
import { initials } from "@/lib/utils";
import type { Role } from "@/types";

export default function TeamsPage() {
  const teams = useTeams();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();

  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);
  const [newTeamOpen, setNewTeamOpen] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");

  const items = teams.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Teams"
        description="Organize members into teams and control who belongs where."
        actions={
          <Button onClick={() => setNewTeamOpen(true)}>
            <Plus />
            New team
          </Button>
        }
      />

      {teams.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {items.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeam(team.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors ${
                  selectedTeam === team.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team.memberCount} members
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete team"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteTeam.mutate(team.id, {
                      onSuccess: () => {
                        toast.success("Team deleted");
                        if (selectedTeam === team.id) setSelectedTeam(null);
                      },
                      onError: (error) => toast.error(error.message),
                    });
                  }}
                >
                  <Trash />
                </Button>
              </button>
            ))}
          </div>

          <TeamMembers teamId={selectedTeam ?? items[0]?.id ?? null} />
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title="No teams yet"
          description="Create your first team to start adding members."
          action={<Button onClick={() => setNewTeamOpen(true)}>New team</Button>}
        />
      )}

      <Dialog open={newTeamOpen} onOpenChange={setNewTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTeamOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createTeam.mutate(teamName, {
                  onSuccess: () => {
                    toast.success("Team created");
                    setTeamName("");
                    setNewTeamOpen(false);
                  },
                  onError: (error) => toast.error(error.message),
                })
              }
              disabled={teamName.length < 2}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamMembers({ teamId }: { teamId: string | null }) {
  const members = useTeamMembers(teamId);
  const users = useUsers();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [userId, setUserId] = React.useState("");
  const [role, setRole] = React.useState<Role>("member");

  const memberIds = new Set((members.data?.items ?? []).map((item) => item.userId));
  const candidates = (users.data?.items ?? []).filter(
    (user) => !memberIds.has(user.id),
  );

  if (!teamId) {
    return (
      <EmptyState icon={<Users />} title="Select a team" description="Pick a team to manage members." />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="space-y-2">
            {(members.data?.items ?? []).map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="size-8">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {initials(member.fullName ?? member.email ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.fullName ?? member.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{member.role}</Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove member"
                    onClick={() =>
                      removeMember.mutate(
                        { teamId, userId: member.userId },
                        { onError: (error) => toast.error(error.message) },
                      )
                    }
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            ))}
            {members.data?.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <div className="grid flex-1 gap-1.5">
            <Label>Add user</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName ?? user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="team_admin">Team admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!userId}
            onClick={() =>
              addMember.mutate(
                { teamId, userId, role },
                {
                  onSuccess: () => {
                    toast.success("Member added");
                    setUserId("");
                  },
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          >
            <UserPlus />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
