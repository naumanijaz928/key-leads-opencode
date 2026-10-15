import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { hideReasons, searches, settings, sources, teams } from "@/lib/db/schema";
import { HIDE_REASONS, SOURCE_CATALOG } from "@/lib/sources-catalog";

async function seed() {
  const database = db();

  console.info("Seeding sources…");
  for (const source of SOURCE_CATALOG) {
    await database
      .insert(sources)
      .values({
        key: source.key,
        name: source.name,
        category: source.category,
        description: source.description,
        requiresKey: source.requiresKey,
        keyEnvVar: source.keyEnvVar,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: sources.key,
        set: {
          name: source.name,
          category: source.category,
          description: source.description,
          requiresKey: source.requiresKey,
          keyEnvVar: source.keyEnvVar,
        },
      });
  }

  console.info("Seeding hide reasons…");
  for (const reason of HIDE_REASONS) {
    await database
      .insert(hideReasons)
      .values(reason)
      .onConflictDoUpdate({
        target: hideReasons.key,
        set: { label: reason.label, sort: reason.sort },
      });
  }

  const [existingTeam] = await database
    .select({ id: teams.id })
    .from(teams)
    .limit(1);

  let teamId = existingTeam?.id;

  if (!teamId) {
    console.info("Creating default team…");
    const [team] = await database
      .insert(teams)
      .values({ name: "Default team", slug: "default" })
      .returning();
    teamId = team.id;
  }

  await database
    .insert(settings)
    .values({
      teamId,
      data: {
        timezone: "Asia/Karachi",
        sheet_export: false,
        default_window_hours: 72,
      },
    })
    .onConflictDoNothing();

  const existingSearch = await database
    .select({ id: searches.id })
    .from(searches)
    .limit(1);

  if (existingSearch.length === 0) {
    console.info("Creating default search profile…");
    await database.insert(searches).values({
      teamId,
      name: "Remote engineering",
      description: "Default broad remote software search.",
      isDefault: true,
      priority: 50,
      config: {
        search_terms: ["software engineer", "developer", "programmer"],
        title_include: [],
        title_exclude: ["intern", "unpaid"],
        tech_any: [],
        tech_exclude: [],
        min_years: null,
        level_exclude: ["intern"],
        unknown_level_ok: true,
        remote_policy: "remote_only",
        regions_include: [],
        regions_exclude: [],
        languages: ["English"],
        window_hours: 72,
        sources: [],
        priority: 50,
      },
    });
  }

  const [{ value: sourceCount }] = await database
    .select({ value: sql<number>`count(*)::int` })
    .from(sources);

  console.info(`Seed complete. ${sourceCount} sources available.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
