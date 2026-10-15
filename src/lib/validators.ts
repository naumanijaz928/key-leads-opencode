import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email(),
  password: z.string().min(8).max(200),
  note: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(200),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(200),
});

export const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["member", "team_admin", "super_admin"]).default("member"),
  teamId: z.uuid().optional().nullable(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().max(500).optional().nullable(),
  timezone: z.string().max(64).optional(),
});

export const searchConfigSchema = z.object({
  search_terms: z.array(z.string()).default([]),
  title_include: z.array(z.string()).default([]),
  title_exclude: z.array(z.string()).default([]),
  tech_any: z.array(z.string()).default([]),
  tech_exclude: z.array(z.string()).default([]),
  min_years: z.number().int().min(0).max(40).nullable().default(null),
  level_exclude: z.array(z.string()).default([]),
  unknown_level_ok: z.boolean().default(true),
  remote_policy: z
    .enum(["remote_only", "remote_or_hybrid", "any"])
    .default("remote_only"),
  regions_include: z.array(z.string()).default([]),
  regions_exclude: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  window_hours: z.number().int().min(1).max(720).default(72),
  sources: z.array(z.string()).default([]),
  priority: z.number().int().min(0).max(100).default(0),
});

export const searchSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  config: searchConfigSchema.partial().optional(),
});

export const companyUpdateSchema = z.object({
  status: z.string().max(40).optional(),
  ownerId: z.uuid().nullable().optional(),
  notes: z.string().max(4000).optional().nullable(),
  website: z.string().max(300).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
});

export const hideLeadSchema = z.object({
  reason: z.string().max(40).default("other"),
  note: z.string().max(500).optional().nullable(),
});

export const applyLeadSchema = z.object({
  status: z.string().max(40).default("applied"),
  note: z.string().max(500).optional().nullable(),
});

export const importLeadSchema = z.object({
  url: z.string().min(4).max(1000),
  title: z.string().min(2).max(300).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(60).default("manual"),
  tech: z.array(z.string()).optional(),
  location: z.string().max(200).optional(),
});

export const createRunSchema = z.object({
  searchId: z.uuid().optional().nullable(),
  sources: z.array(z.string()).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(120).optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2).max(120),
});

export const createTeamMemberSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["member", "team_admin", "super_admin"]).default("member"),
});

export const approveSignupSchema = z.object({
  id: z.uuid(),
  role: z.enum(["member", "team_admin", "super_admin"]).default("member"),
  teamId: z.uuid().optional().nullable(),
  action: z.enum(["approve", "reject"]),
});

export const teamMemberSchema = z.object({
  teamId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(["member", "team_admin", "super_admin"]).default("member"),
});

export const adminUpdateUserSchema = z.object({
  id: z.uuid(),
  role: z.enum(["member", "team_admin", "super_admin"]).optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  teamId: z.uuid().nullable().optional(),
});

export const settingsSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});
