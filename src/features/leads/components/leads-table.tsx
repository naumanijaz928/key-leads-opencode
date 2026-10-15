"use client";

import {
  CircleCheck,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelative } from "@/lib/utils";
import type { Lead } from "@/types";

function sourceVariant(source: string) {
  switch (source) {
    case "linkedin":
      return "default" as const;
    case "wellfound":
      return "success" as const;
    case "indeed":
    case "glassdoor":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export function LeadsTable({
  leads,
  onSelect,
  onApply,
  onUnapply,
  onHide,
  onUnhide,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onApply: (lead: Lead) => void;
  onUnapply: (lead: Lead) => void;
  onHide: (lead: Lead) => void;
  onUnhide: (lead: Lead) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Stack</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer"
              onClick={() => onSelect(lead)}
            >
              <TableCell className="max-w-72 whitespace-normal">
                <div className="flex items-start gap-2.5">
                  {lead.companyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lead.companyLogo}
                      alt=""
                      className="mt-0.5 size-6 rounded-md border border-border object-contain"
                    />
                  ) : (
                    <div className="mt-0.5 size-6 rounded-md border border-border bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium">{lead.title}</p>
                      {lead.applied ? (
                        <CircleCheck className="size-3.5 shrink-0 text-success" />
                      ) : null}
                      {!lead.viewed ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.companyName ?? "Unknown company"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={sourceVariant(lead.source)}>{lead.source}</Badge>
              </TableCell>
              <TableCell>
                {lead.location ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {lead.workMode ?? lead.location}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {lead.workMode ?? "—"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {lead.tech.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="muted">
                      {tech}
                    </Badge>
                  ))}
                  {lead.tech.length > 3 ? (
                    <Badge variant="muted">+{lead.tech.length - 3}</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatRelative(lead.postedAt ?? lead.createdAt)}
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onSelect(lead)}>
                      <Eye />
                      Open details
                    </DropdownMenuItem>
                    {lead.url ? (
                      <DropdownMenuItem asChild>
                        <a href={lead.url} target="_blank" rel="noreferrer">
                          <ExternalLink />
                          Open original
                        </a>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    {lead.applied ? (
                      <DropdownMenuItem onSelect={() => onUnapply(lead)}>
                        <CircleCheck />
                        Undo applied
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => onApply(lead)}>
                        <CircleCheck />
                        Mark applied
                      </DropdownMenuItem>
                    )}
                    {lead.hidden ? (
                      <DropdownMenuItem onSelect={() => onUnhide(lead)}>
                        <EyeOff />
                        Unhide
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => onHide(lead)}
                      >
                        <EyeOff />
                        Hide lead
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
