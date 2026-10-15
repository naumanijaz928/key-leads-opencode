import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(
      422,
      "Validation failed",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

type Handler<Ctx> = (request: Request, context: Ctx) => Promise<Response>;

export function withRoute<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.message, error.status, error.details);
      }
      console.error("[api] unhandled error:", error);
      return fail("Internal server error", 500);
    }
  };
}
