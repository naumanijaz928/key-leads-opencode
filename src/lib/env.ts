export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isCollectorConfigured() {
  return Boolean(process.env.COLLECTOR_URL);
}

export function sourceKey(name: string) {
  return process.env[name]?.trim() || null;
}
