import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { MANDALA_GOAL, MANDALA_PILLARS } from "../domain/mandala.ts";

const INITIAL_TASK = {
  status: "ASSIGNED",
  checklist: {},
  qualityChecks: {},
  submissionNote: "",
  assetReference: "",
  facebookUrl: "",
  revisions: [],
  metrics: [],
};

export async function migrateDatabase(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const migration = readFileSync(path.join(process.cwd(), "drizzle", "0001_foundation.sql"), "utf8");
    await sql.unsafe(migration);
    await sql`insert into schema_migrations (id) values ('0001_foundation') on conflict do nothing`;
  } finally {
    await sql.end();
  }
}

export async function seedDatabase(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const catalog = JSON.parse(readFileSync(path.join(process.cwd(), "src", "content", "plan.generated.json"), "utf8")) as {
      records: Array<{
        contentId: string;
        sourceId: string;
        pageCode: string;
        assigneeId: string;
        publicationStatus: string;
        unresolved: string[];
      }>;
    };
    for (const record of catalog.records) {
      await sql`
        insert into content_items (content_id, source_id, page_code, assignee_id, publication_status, unresolved, record)
        values (
          ${record.contentId},
          ${record.sourceId},
          ${record.pageCode},
          ${record.assigneeId},
          ${record.publicationStatus},
          ${sql.json(record.unresolved)},
          ${sql.json(record)}
        )
        on conflict (content_id) do update set
          source_id = excluded.source_id,
          page_code = excluded.page_code,
          assignee_id = excluded.assignee_id,
          publication_status = excluded.publication_status,
          unresolved = excluded.unresolved,
          record = excluded.record
      `;
      await sql`
        insert into task_states (content_id, state)
        values (${record.contentId}, ${sql.json(INITIAL_TASK)})
        on conflict (content_id) do nothing
      `;
    }
    await sql`
      insert into campaigns (id, status, started_at, time_zone, plan_version)
      values ('uk-month-one', 'BUILD', null, 'Europe/London', 'month-one-pdf-v1')
      on conflict (id) do nothing
    `;
    await sql`
      insert into mandala_goals (id, title, target_amount_cents, currency, deadline, notes)
      values (${MANDALA_GOAL.id}, ${MANDALA_GOAL.title}, ${MANDALA_GOAL.targetAmountCents}, ${MANDALA_GOAL.currency}, ${MANDALA_GOAL.deadline}, ${MANDALA_GOAL.notes})
      on conflict (id) do nothing
    `;
    for (const pillar of MANDALA_PILLARS) {
      await sql`
        insert into mandala_pillars (id, goal_id, position, title)
        values (${pillar.id}, ${pillar.goalId}, ${pillar.position}, ${pillar.title})
        on conflict (id) do nothing
      `;
      for (const action of pillar.actions) {
        await sql`
          insert into mandala_actions (
            id, pillar_id, position, title, description, success_criterion, owner_label, priority, status, dependencies, evidence
          ) values (
            ${action.id}, ${action.pillarId}, ${action.position}, ${action.title}, ${action.description},
            ${action.successCriterion}, ${action.ownerLabel}, ${action.priority}, ${action.status},
            ${sql.json([])}, ${sql.json([])}
          )
          on conflict (id) do update set
            title = excluded.title,
            owner_label = excluded.owner_label,
            description = excluded.description,
            success_criterion = excluded.success_criterion
          where mandala_actions.status = 'NOT_STARTED'
        `;
      }
    }
  } finally {
    await sql.end();
  }
}

export async function resetDatabase(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql`
      truncate table
        audit_events,
        login_attempts,
        training_progress,
        sessions,
        task_states,
        content_items,
        campaigns,
        mandala_actions,
        mandala_pillars,
        mandala_goals,
        users
      restart identity cascade
    `;
  } finally {
    await sql.end();
  }
}
