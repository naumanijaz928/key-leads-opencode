"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useHideReasons } from "@/features/leads/hooks/use-leads";
import type { Lead } from "@/types";

export function HideLeadDialog({
  lead,
  open,
  onOpenChange,
  onConfirm,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lead: Lead, reason: string, note?: string) => void;
}) {
  const reasons = useHideReasons();
  const [reason, setReason] = React.useState("not_remote");
  const [note, setNote] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hide lead</DialogTitle>
          <DialogDescription>
            {lead?.title} — hidden leads are removed from your default list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
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
          <div className="grid gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (lead) onConfirm(lead, reason, note || undefined);
              onOpenChange(false);
            }}
          >
            Hide lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
