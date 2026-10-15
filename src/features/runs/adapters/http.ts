export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "user-agent": "KeyLeads/1.0 (+https://keyleads.app)",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }

  return (await response.json()) as T;
}

export function asArray(value: unknown, key: string): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === "object") {
    const nested = (value as Record<string, unknown>)[key];
    if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  }
  return [];
}

export function str(
  source: Record<string, unknown> | undefined | null,
  ...keys: string[]
): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

export function strList(
  source: Record<string, unknown> | undefined | null,
  ...keys: string[]
): string[] {
  if (!source) return [];
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}
