import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { MANDALA_GOAL, MANDALA_PILLARS } from "../domain/mandala.ts";

const UK_PAGES = [
  ["BGUK", "Back in the Game UK", "back-in-the-game-uk", "Divorced or separated adults who are dating again after a long relationship."],
  ["AHSUK", "After Hours Singles UK", "after-hours-singles-uk", "Busy professionals who have careers, independence and disposable income, but limited time for dating."],
  ["SPSUK", "Single Parent Stories UK", "single-parent-stories-uk", "Single or divorced mums and dads balancing children, co-parenting, work and dating."],
  ["SGIUK", "Still Got It UK", "still-got-it-uk", "Mature singles, including divorced, widowed and long-term single adults, who value companionship and independence."],
  ["CBCUK", "Casual By Choice UK", "casual-by-choice-uk", "Men over 30 who value independence and may prefer casual or low-pressure dating rather than immediate commitment."],
] as const;

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
    for (const id of ["0001_foundation", "0002_operators", "0003_media_worker", "0004_public_enquiries"]) {
      const migration = readFileSync(path.join(process.cwd(), "drizzle", `${id}.sql`), "utf8");
      await sql.unsafe(migration);
      await sql`insert into schema_migrations (id) values (${id}) on conflict do nothing`;
    }
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
    for (const [code, name, slug, persona] of UK_PAGES) {
      await sql`
        insert into social_pages (code, name, country_code, slug, status, persona)
        values (${code}, ${name}, 'UK', ${slug}, 'ACTIVE', ${persona})
        on conflict (code) do update set
          name = excluded.name,
          slug = excluded.slug,
          persona = excluded.persona
      `;
    }
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
        production_jobs,
        media_workers,
        invitations,
        page_assignments,
        social_pages,
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
        public_enquiries,
        public_enquiry_attempts,
        users
      restart identity cascade
    `;
  } finally {
    await sql.end();
  }
}
