"use client";

import { TRAINING_LESSONS } from "@/domain/training";
import { Checkbox } from "@/components/ui/checkbox";
import { usePreview } from "@/preview/preview-context";

export function TrainingBoard({ mode }: { mode: "staff" | "owner" }) {
  const preview = usePreview();
  const personId = mode === "owner" ? "masho" : preview.user?.personKey ?? "masho";
  const done = TRAINING_LESSONS.filter((lesson) => preview.training[`${personId}:${lesson.id}`]).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Seven-day training</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {mode === "owner"
            ? `Masho has marked ${done} of ${TRAINING_LESSONS.length} lessons complete. This is stored with his account.`
            : "These lessons are for publishing finished assets. You do not write prompts, generate images or edit Reels."}
        </p>
      </header>
      <ol className="space-y-4">
        {TRAINING_LESSONS.map((lesson) => {
          const key = `${personId}:${lesson.id}`;
          return (
            <li key={lesson.id} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={Boolean(preview.training[key])}
                  onCheckedChange={(checked) => preview.setTraining(key, checked === true)}
                  disabled={mode === "owner"}
                  id={key}
                />
                <div>
                  <label htmlFor={key} className="font-heading text-2xl">Day {lesson.day}. {lesson.title}</label>
                  <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>
                </div>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {lesson.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm">Example: {lesson.example}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
