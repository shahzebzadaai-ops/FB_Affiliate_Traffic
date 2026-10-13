import { connection } from "next/server";
import type { ContentFormat } from "@/domain/types";
import { getCurrentUser } from "@/server/current-user";
import { loadWork, saveTask, saveTraining } from "@/server/work";
import type { MetricEntry, TaskState } from "@/preview/task-state";
import type { TaskCommand } from "@/server/task-commands";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  return Response.json(await loadWork(user));
}

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as
    | { type: "training"; lessonKey?: string; completed?: boolean }
    | { type: "task"; contentId?: string; command?: TaskCommand }
    | null;
  if (body?.type === "training") {
    const result = await saveTraining(user, body.lessonKey ?? "", Boolean(body.completed));
    if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
    return Response.json({ ok: true });
  }
  if (body?.type !== "task" || !body.contentId || !body.command || !isCommand(body.command)) {
    return Response.json({ error: "Unknown work action." }, { status: 400 });
  }
  const result = await saveTask(user, body.contentId, body.command);
  if (!result.ok) return Response.json({ error: result.error, blockers: result.blockers }, { status: result.status });
  return Response.json({ state: result.state });
}

function isCommand(command: TaskCommand): command is TaskCommand {
  if (command.action === "toggle") return (command.kind === "checklist" || command.kind === "qualityChecks") && typeof command.id === "string";
  if (command.action === "draft") return typeof command.patch === "object";
  if (command.action === "submit") return typeof (command as { format?: ContentFormat }).format === "string";
  if (command.action === "saveMetrics") return typeof (command as { entry?: MetricEntry }).entry === "object";
  if (command.action === "approve") return typeof (command as { assigneeId?: string }).assigneeId === "string";
  return [
    "start",
    "requestRevision",
    "postpone",
    "cancel",
    "publish",
  ].includes(command.action);
}

export type { TaskState };
