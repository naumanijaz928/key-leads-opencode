import { EventEmitter } from "node:events";

export interface RunEvent {
  type: "source" | "progress" | "done" | "error";
  runId: string;
  sourceKey?: string;
  status?: string;
  fetched?: number;
  matched?: number;
  newLeads?: number;
  error?: string | null;
  timestamp: string;
}

class RunBus {
  private emitter = new EventEmitter();
  private history = new Map<string, RunEvent[]>();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  publish(event: RunEvent) {
    const events = this.history.get(event.runId) ?? [];
    events.push(event);
    this.history.set(event.runId, events.slice(-200));
    this.emitter.emit(event.runId, event);
  }

  subscribe(runId: string, listener: (event: RunEvent) => void) {
    this.emitter.on(runId, listener);
    return () => {
      this.emitter.off(runId, listener);
    };
  }

  replay(runId: string) {
    return this.history.get(runId) ?? [];
  }

  clear(runId: string) {
    this.history.delete(runId);
  }
}

const globalForBus = globalThis as unknown as { runBus?: RunBus };

export const runBus = globalForBus.runBus ?? new RunBus();
if (process.env.NODE_ENV !== "production") globalForBus.runBus = runBus;
