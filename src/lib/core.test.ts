import { describe, expect, it } from "vitest";

import { initials, slugify } from "@/lib/utils";
import {
  detectTech,
  detectWorkMode,
  domainFromUrl,
  parseSalary,
  stripHtml,
} from "@/features/runs/normalize";
import { matchesConfig, normalizeConfig } from "@/features/searches/api/queries";
import { searchConfigSchema, signupSchema } from "@/lib/validators";

describe("utils", () => {
  it("slugifies names", () => {
    expect(slugify("Stripe, Inc.")).toBe("stripe-inc");
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });

  it("derives initials", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("")).toBe("?");
  });
});

describe("validators", () => {
  it("accepts a valid signup", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("fills search config defaults", () => {
    const config = searchConfigSchema.parse({});
    expect(config.remote_policy).toBe("remote_only");
    expect(config.window_hours).toBe(72);
    expect(config.search_terms).toEqual([]);
  });
});

describe("normalize", () => {
  it("detects tech keywords", () => {
    expect(detectTech("Senior React & Node.js engineer")).toEqual(
      expect.arrayContaining(["react", "node.js"]),
    );
  });

  it("detects work mode", () => {
    expect(detectWorkMode("Fully remote role")).toBe("remote");
    expect(detectWorkMode("Hybrid in Berlin")).toBe("hybrid");
    expect(detectWorkMode("On-site only")).toBe("onsite");
  });

  it("parses salary ranges", () => {
    const salary = parseSalary("$120,000 - $160,000");
    expect(salary.min).toBe(120000);
    expect(salary.max).toBe(160000);
    expect(salary.currency).toBe("$");
  });

  it("strips html", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("extracts domains", () => {
    expect(domainFromUrl("https://www.stripe.com/jobs")).toBe("stripe.com");
  });
});

describe("search matcher", () => {
  const config = normalizeConfig({
    title_include: ["engineer"],
    tech_any: ["react"],
    remote_policy: "remote_only",
  });

  it("matches jobs that satisfy every filter", () => {
    expect(
      matchesConfig(config, {
        title: "Senior Engineer",
        tech: ["react", "typescript"],
        workMode: "remote",
        minYears: 3,
      }),
    ).toBe(true);
  });

  it("rejects jobs that miss required tech", () => {
    expect(
      matchesConfig(config, {
        title: "Senior Engineer",
        tech: ["python"],
        workMode: "remote",
        minYears: 3,
      }),
    ).toBe(false);
  });

  it("rejects non-remote jobs under remote_only", () => {
    expect(
      matchesConfig(config, {
        title: "Senior Engineer",
        tech: ["react"],
        workMode: "onsite",
        minYears: 3,
      }),
    ).toBe(false);
  });
});
