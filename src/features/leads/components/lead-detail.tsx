"use client";

import * as React from "react";
import { CircleCheck, ExternalLink, EyeOff, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useHideReasons, useLead } from "@/features/leads/hooks/use-leads";
import { formatDate, formatRelative } from "@/lib/utils";
import type { Lead } from "@/types";

export function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  onApply,
  onUnapply,
  onHide,
  onUnhide,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (lead: Lead) => void;
  onUnapply: (lead: Lead) => void;
  onHide: (lead: Lead, reason: string) => void;
  onUnhide: (lead: Lead) => void;
}) {
  const detail = useLead(open && lead ? lead.id : null);
  const reasons = useHideReasons();
  const [reason, setReason] = React.useState("not_remote");

  const current = detail.data?.lead ?? lead;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {current ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                {current.companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.companyLogo}
                    alt=""
                    className="size-10 rounded-lg border border-border object-contain"
                  />
                ) : (
                  <div className="size-10 rounded-lg border border-border bg-muted" />
                )}
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="text-lg">{current.title}</DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2">
                    <span>{current.companyName ?? "Unknown company"}</span>
                    {current.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {current.location}
                      </span>
                    ) : null}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{current.source}</Badge>
              {current.workMode ? (
                <Badge variant="outline">{current.workMode}</Badge>
              ) : null}
              {current.seniority ? (
                <Badge variant="outline">{current.seniority}</Badge>
              ) : null}
              {current.minYears ? (
                <Badge variant="outline">{current.minYears}+ yrs</Badge>
              ) : null}
              {current.pipeline !== "new" ? (
                <Badge variant="default">{current.pipeline}</Badge>
              ) : null}
            </div>

            {current.tech.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {current.tech.map((tech) => (
                  <Badge key={tech} variant="muted">
                    {tech}
                  </Badge>
                ))}
              </div>
            ) : null}

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Posted</p>
                <p>{formatDate(current.postedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p>{formatRelative(current.createdAt)}</p>
              </div>
              {current.salaryText ?? current.salaryMin ? (
                <div>
                  <p className="text-xs text-muted-foreground">Salary</p>
                  <p>
                    {current.salaryText ??
                      `${current.salaryCurrency ?? ""} ${current.salaryMin ?? ""}–${current.salaryMax ?? ""}`}
                  </p>
                </div>
              ) : null}
            </div>

            {current.shortJd || current.description ? (
              <>
                <Separator />
                <div className="max-h-56 overflow-y-auto scrollbar-thin whitespace-pre-wrap text-sm text-muted-foreground">
                  {current.description || current.shortJd}
                </div>
              </>
            ) : null}

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="hide-reason">Hide reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="hide-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(reasons.data?.items ?? []).map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild disabled={!current.applyUrl && !current.url}>
                  <a
                    href={current.applyUrl ?? current.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink />
                    Open / apply
                  </a>
                </Button>

                {current.applied ? (
                  <Button variant="outline" onClick={() => onUnapply(current)}>
                    <CircleCheck />
                    Undo applied
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => onApply(current)}>
                    <CircleCheck />
                    Mark applied
                  </Button>
                )}

                {current.hidden ? (
                  <Button variant="outline" onClick={() => onUnhide(current)}>
                    <EyeOff />
                    Unhide
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => onHide(current, reason)}
                  >
                    <EyeOff />
                    Hide
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
