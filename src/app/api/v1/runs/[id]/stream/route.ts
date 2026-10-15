import { withRoute } from "@/lib/api/http";
import { requireUser } from "@/lib/api/auth-guard";
import { getRunWithSources } from "@/features/runs/executor";
import { runBus } from "@/features/runs/bus";

type Ctx = { params: Promise<{ id: string }> };

const TERMINAL = new Set(["done", "failed", "cancelled"]);

export const GET = withRoute<Ctx>(async (request, context) => {
  await requireUser();
  const { id } = await context.params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let unsubscribe = () => {};
      let interval: ReturnType<typeof setInterval> | null = null;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          finish();
        }
      };

      const finish = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const snapshot = await getRunWithSources(id);
      if (!snapshot) {
        send("error", { error: "Run not found" });
        finish();
        return;
      }

      send("snapshot", snapshot);
      if (TERMINAL.has(snapshot.run.status)) {
        finish();
        return;
      }

      unsubscribe = runBus.subscribe(id, (event) => {
        send(event.type, event);
        if (event.type === "done" || event.type === "error") finish();
      });

      interval = setInterval(async () => {
        if (closed) return;
        try {
          const fresh = await getRunWithSources(id);
          if (!fresh) return;
          send("snapshot", fresh);
          if (TERMINAL.has(fresh.run.status)) finish();
        } catch {
          // transient DB error; retry next tick
        }
      }, 1500);

      request.signal.addEventListener("abort", finish);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
});
