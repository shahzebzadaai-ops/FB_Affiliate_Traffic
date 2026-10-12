"use client";

import { useParams } from "next/navigation";
import { TaskWorkspace } from "@/components/task-workspace";

export default function OwnerTaskPage() {
  const params = useParams<{ contentId: string }>();
  return <TaskWorkspace contentId={params.contentId} mode="owner" />;
}
