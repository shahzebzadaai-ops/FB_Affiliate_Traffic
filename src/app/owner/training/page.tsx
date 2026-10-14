import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TRAINING_LESSONS } from "@/domain/training";
import { can } from "@/domain/permissions";
import { getCurrentUser } from "@/server/current-user";
import { listTraineeProgress } from "@/server/work";

export default function OwnerTrainingPage() {
  return (
    <Suspense fallback={<p className="font-heading text-3xl">Training</p>}>
      <OwnerTraining />
    </Suspense>
  );
}

async function OwnerTraining() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user.role, "view_training_completion")) redirect("/staff");
  const trainees = await listTraineeProgress();
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Owner</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Training</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Each operator sees only their own lessons. Completion stays on their account. A training or internship period is not automatically lawful. Confirm employment rules before anyone starts.
        </p>
      </header>
      {trainees.length === 0 ? <p className="border-y py-8 text-sm text-muted-foreground">No publishing operators yet.</p> : null}
      <ul className="divide-y border-y">
        {trainees.map((trainee) => (
          <li key={trainee.id} className="py-4">
            <p className="font-medium">{trainee.name}</p>
            <p className="text-sm text-muted-foreground">{trainee.completed} of {TRAINING_LESSONS.length} lessons marked complete.</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
