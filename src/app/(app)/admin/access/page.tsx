"use client";

import * as React from "react";
import { Mail, ShieldCheck, Trash, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateInvitation,
  useDecideSignup,
  useDeleteInvitation,
  useInvitations,
  useSignupRequests,
  useTeams,
  useUpdateUser,
  useUsers,
  type SignupRequestRow,
} from "@/features/admin/hooks/use-admin";
import type { Role } from "@/types";

const TEAM_NONE = "__none__";

export default function AccessPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Access"
        description="Approve sign-ups, send invitations, and manage roles."
      />

      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Sign-up requests</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <SignupRequests />
        </TabsContent>
        <TabsContent value="invitations">
          <Invitations />
        </TabsContent>
        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignupRequests() {
  const requests = useSignupRequests();
  const [target, setTarget] = React.useState<SignupRequestRow | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (requests.data?.items.length ?? 0) > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Note</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.data?.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.fullName ?? "—"}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell className="max-w-60 truncate text-xs text-muted-foreground">
                    {row.note ?? ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => setTarget(row)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        )}
      </CardContent>

      {target ? (
        <ApproveDialog
          request={target}
          onOpenChange={(open) => !open && setTarget(null)}
        />
      ) : null}
    </Card>
  );
}

function ApproveDialog({
  request,
  onOpenChange,
}: {
  request: SignupRequestRow;
  onOpenChange: (open: boolean) => void;
}) {
  const decide = useDecideSignup();
  const teams = useTeams();
  const [role, setRole] = React.useState<Role>("member");
  const [teamId, setTeamId] = React.useState<string>(TEAM_NONE);

  function submit(action: "approve" | "reject") {
    decide.mutate(
      {
        id: request.id,
        action,
        role,
        teamId: teamId === TEAM_NONE ? null : teamId,
      },
      {
        onSuccess: () => {
          toast.success(action === "approve" ? "Approved" : "Rejected");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{request.fullName ?? request.email}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="team_admin">Team admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TEAM_NONE}>No team</SelectItem>
                {(teams.data?.items ?? []).map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => submit("reject")}
            disabled={decide.isPending}
          >
            Reject
          </Button>
          <Button onClick={() => submit("approve")} disabled={decide.isPending}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Invitations() {
  const invitations = useInvitations();
  const teams = useTeams();
  const create = useCreateInvitation();
  const remove = useDeleteInvitation();

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("member");
  const [teamId, setTeamId] = React.useState<string>(TEAM_NONE);

  function submit() {
    create.mutate(
      { email, role, teamId: teamId === TEAM_NONE ? null : teamId },
      {
        onSuccess: (result) => {
          toast.success("Invitation sent");
          void navigator.clipboard?.writeText(result.inviteLink);
          setEmail("");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a teammate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid flex-1 gap-1.5">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
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
          <div className="grid gap-1.5">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TEAM_NONE}>No team</SelectItem>
                {(teams.data?.items ?? []).map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={create.isPending || email.length < 5}>
            <UserPlus />
            Invite
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invitations.data?.items ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <Badge variant="muted">{row.role}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.teamName ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "pending" ? "warning" : "success"}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Revoke invitation"
                    onClick={() =>
                      remove.mutate(row.id, {
                        onSuccess: () => toast.success("Invitation revoked"),
                      })
                    }
                  >
                    <Trash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UsersTable() {
  const users = useUsers();
  const teams = useTeams();
  const update = useUpdateUser();

  function setField(
    id: string,
    field: "role" | "status" | "teamId",
    value: string,
  ) {
    update.mutate(
      {
        id,
        [field]: field === "teamId" ? (value === TEAM_NONE ? null : value) : value,
      } as { id: string; role?: Role; status?: string; teamId?: string | null },
      {
        onSuccess: () => toast.success("User updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          All users
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users.data?.items ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {user.fullName ?? user.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => setField(user.id, "role", value)}
                    >
                      <SelectTrigger size="sm" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">member</SelectItem>
                        <SelectItem value="team_admin">team_admin</SelectItem>
                        <SelectItem value="super_admin">super_admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.status}
                      onValueChange={(value) => setField(user.id, "status", value)}
                    >
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="pending">pending</SelectItem>
                        <SelectItem value="suspended">suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.teamId ?? TEAM_NONE}
                      onValueChange={(value) => setField(user.id, "teamId", value)}
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TEAM_NONE}>No team</SelectItem>
                        {(teams.data?.items ?? []).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
