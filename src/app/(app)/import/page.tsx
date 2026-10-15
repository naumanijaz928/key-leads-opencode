"use client";

import * as React from "react";
import { Link2, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";

export default function ImportPage() {
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [source, setSource] = React.useState("manual");
  const [location, setLocation] = React.useState("");
  const [tech, setTech] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    try {
      await apiFetch("/api/v1/leads/import", {
        method: "POST",
        json: {
          url,
          title: title || undefined,
          company: company || undefined,
          source,
          location: location || undefined,
          tech: tech
            ? tech
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : undefined,
        },
      });
      toast.success("Lead imported");
      setUrl("");
      setTitle("");
      setCompany("");
      setLocation("");
      setTech("");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Add from LinkedIn"
        description="Paste a job URL to add it as a lead manually. Works with any board."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            Paste a job link
          </CardTitle>
          <CardDescription>
            The URL is stored as-is; we never scrape your LinkedIn account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="import-url">Job URL</Label>
            <Input
              id="import-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="import-title">Title (optional)</Label>
              <Input
                id="import-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="import-company">Company (optional)</Label>
              <Input
                id="import-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="import-source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="import-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="wellfound">Wellfound</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="glassdoor">Glassdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="import-location">Location (optional)</Label>
              <Input
                id="import-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="import-tech">Tech (comma separated)</Label>
            <Textarea
              id="import-tech"
              value={tech}
              onChange={(event) => setTech(event.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={submit} disabled={pending || url.length < 4}>
            <Upload />
            Import lead
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
