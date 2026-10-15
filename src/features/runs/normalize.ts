import type { WorkMode } from "@/types";

const TECH_KEYWORDS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "svelte",
  "node",
  "node.js",
  "express",
  "nestjs",
  "python",
  "django",
  "flask",
  "fastapi",
  "ruby",
  "rails",
  "php",
  "laravel",
  "java",
  "spring",
  "kotlin",
  "swift",
  "go",
  "golang",
  "rust",
  "c++",
  "c#",
  ".net",
  "sql",
  "postgresql",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "graphql",
  "rest",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "terraform",
  "react native",
  "flutter",
  "dart",
  "elixir",
  "scala",
  "kafka",
  "spark",
  "airflow",
  "pytorch",
  "tensorflow",
  "llm",
  "openai",
  "langchain",
];

export function detectTech(...chunks: (string | null | undefined)[]): string[] {
  const haystack = chunks.filter(Boolean).join(" ").toLowerCase();
  const found = new Set<string>();
  for (const keyword of TECH_KEYWORDS) {
    if (haystack.includes(keyword)) {
      found.add(keyword === "nextjs" ? "next.js" : keyword);
    }
  }
  return Array.from(found);
}

export function detectWorkMode(
  ...chunks: (string | null | undefined)[]
): WorkMode | null {
  const haystack = chunks.filter(Boolean).join(" ").toLowerCase();
  if (/\bhybrid\b/.test(haystack)) return "hybrid";
  if (/\b(remote|anywhere|distributed|work from home|wfh)\b/.test(haystack))
    return "remote";
  if (/\b(on-?site|in-?office|in person)\b/.test(haystack)) return "onsite";
  return null;
}

export function parseSalary(text: string | null | undefined): {
  min: number | null;
  max: number | null;
  currency: string | null;
  text: string | null;
} {
  if (!text) return { min: null, max: null, currency: null, text: null };
  const currencyMatch = text.match(/(\$|€|£|usd|eur|gbp)/i);
  const currency =
    currencyMatch?.[0].toLowerCase().replace("usd", "$").replace("eur", "€").replace("gbp", "£") ??
    null;

  const numbers = text
    .replace(/,/g, "")
    .match(/\d{2,7}/g)
    ?.map(Number)
    .filter((value) => value >= 1000) ?? [];

  const kScale = /k\b/i.test(text);
  const scaled = numbers.map((value) => (kScale && value < 1000 ? value * 1000 : value));

  return {
    min: scaled[0] ?? null,
    max: scaled[1] ?? scaled[0] ?? null,
    currency,
    text: text.trim(),
  };
}

export function stripHtml(input: string | null | undefined, max = 4000): string | null {
  if (!input) return null;
  const text = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max);
}

export function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
