"use client";

import * as React from "react";
import { Ellipsis, Plus, Target } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSearch,
  useDeleteSearch,
  usePreviewSearch,
  useSearches,
  useUpdateSearch,
} from "@/features/searches/hooks/use-searches";
import type { SearchConfig, SearchProfile } from "@/types";

const emptyConfig: SearchConfig = {
  search_terms: [],
  title_include: [],
  title_exclude: [],
  tech_any: [],
  tech_exclude: [],
  min_years: null,
  level_exclude: [],
  unknown_level_ok: true,
  remote_policy: "remote_only",
  regions_include: [],
  regions_exclude: [],
  languages: [],
  window_hours: 72,
  sources: [],
  priority: 0,
};

export default function SearchesPage() {
  const searches = useSearches();
  const del = useDeleteSearch();
  const preview = usePreviewSearch();

  const [editing, setEditing] = React.useState<SearchProfile | null>(null);
  const [creating, setCreating] = React.useState(false);

  const items = searches.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Searches"
        description="Reusable search profiles that shape which jobs become leads."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            New search
          </Button>
        }
      />

      {searches.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {profile.name}
                    {profile.isDefault ? <Badge>default</Badge> : null}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {profile.description ?? "No description"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(profile)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        preview.mutate(
                          { id: profile.id, config: profile.config },
                          {
                            onSuccess: (result) =>
                              toast.success(
                                `${result.matched}/${result.scanned} recent leads match`,
                              ),
                          },
                        )
                      }
                    >
                      Preview matches
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() =>
                        del.mutate(profile.id, {
                          onSuccess: () => toast.success("Search deleted"),
                        })
                      }
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                <Badge variant="muted">{profile.config.remote_policy}</Badge>
                <Badge variant="muted">
                  {profile.config.title_include.length} title filters
                </Badge>
                <Badge variant="muted">
                  {profile.config.tech_any.length} tech filters
                </Badge>
                <Badge variant="muted">priority {profile.priority}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Target />}
          title="No search profiles"
          description="Create a search profile to define the roles you want collected."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New search
            </Button>
          }
        />
      )}

      {creating || editing ? (
        <SearchFormDialog
          profile={editing}
          onOpenChange={(open) => {
            if (!open) {
              setCreating(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function listToText(list: string[]) {
  return list.join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SearchFormDialog({
  profile,
  onOpenChange,
}: {
  profile: SearchProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateSearch();
  const update = useUpdateSearch();

  const [name, setName] = React.useState(profile?.name ?? "");
  const [description, setDescription] = React.useState(profile?.description ?? "");
  const [isDefault, setIsDefault] = React.useState(profile?.isDefault ?? false);
  const [priority, setPriority] = React.useState(profile?.priority ?? 0);
  const [config, setConfig] = React.useState<SearchConfig>(
    profile?.config ?? emptyConfig,
  );

  function patchConfig<K extends keyof SearchConfig>(
    key: K,
    value: SearchConfig[K],
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const payload = { name, description, isDefault, priority, config };
    const handlers = {
      onSuccess: () => {
        toast.success(profile ? "Search updated" : "Search created");
        onOpenChange(false);
      },
      onError: (error: Error) => toast.error(error.message),
    };
    if (profile) update.mutate({ id: profile.id, ...payload }, handlers);
    else create.mutate(payload, handlers);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{profile ? "Edit search" : "New search"}</DialogTitle>
          <DialogDescription>
            Filters are applied to collected jobs to decide what becomes a lead.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="search-name">Name</Label>
            <Input
              id="search-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="search-description">Description</Label>
            <Textarea
              id="search-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="search-priority">Priority</Label>
              <Input
                id="search-priority"
                type="number"
                value={priority}
                onChange={(event) => setPriority(Number(event.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="search-remote">Remote policy</Label>
              <Select
                value={config.remote_policy}
                onValueChange={(value) =>
                  patchConfig(
                    "remote_policy",
                    value as SearchConfig["remote_policy"],
                  )
                }
              >
                <SelectTrigger id="search-remote">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote_only">Remote only</SelectItem>
                  <SelectItem value="remote_or_hybrid">Remote or hybrid</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isDefault}
              onCheckedChange={(value) => setIsDefault(value === true)}
            />
            Set as default search profile
          </label>

          <ConfigField
            label="Search terms (comma separated)"
            value={listToText(config.search_terms)}
            onChange={(value) => patchConfig("search_terms", textToList(value))}
          />
          <ConfigField
            label="Title include"
            value={listToText(config.title_include)}
            onChange={(value) => patchConfig("title_include", textToList(value))}
          />
          <ConfigField
            label="Title exclude"
            value={listToText(config.title_exclude)}
            onChange={(value) => patchConfig("title_exclude", textToList(value))}
          />
          <ConfigField
            label="Tech any"
            value={listToText(config.tech_any)}
            onChange={(value) => patchConfig("tech_any", textToList(value))}
          />
          <ConfigField
            label="Tech exclude"
            value={listToText(config.tech_exclude)}
            onChange={(value) => patchConfig("tech_exclude", textToList(value))}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || update.isPending}
          >
            {profile ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfigField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
