# Media retention and storage

Permanent rule: **AI recommends. Shahzeb approves. The system executes only an approved deletion.**

This document is the architecture, data model, approval workflow, and phased plan. It does not authorise a migration, a Drive connection, or any deletion. No existing file is removed by recording this plan. Publishing status and production schedules stay as they are.

The requirement is permanent. Later sessions implement it in the phases below. They do not invent a second library and they do not treat a missing decision as consent.

## What exists today

Inspected before this plan was written:

- Finished Muse files are rows in `creative_assets`. The database stores `storage_path`, a relative path under `AFFIGROVE_MEDIA_DIR` or `data/media-library`. The binary is not in PostgreSQL. Approval of an asset does not publish it.
- Story shots are rows in `story_clips`, again a relative path and a byte size. Story bibles and episode packages live in `story_series` and `story_episodes` as JSON, not as loose files.
- Render work is `production_jobs`. A job without a verified https location stays `AWAITING_STORAGE`. Owner approval copies a URL onto the task and does not mark the task scheduled or published. The assembler is `worker/atos_worker`. It is not installed as a VPS service. Temporary files are supposed to be removed only after a verified upload. That upload is not implemented.
- Google Drive OAuth is not connected. The integrations screen says so. Folder names in the staff guide are planned paths, not live folders.
- There is no retention state, no deletion approval, no quarantine, and no capacity ledger.
- `src/domain/people.ts` contains the label `shahzeb`. That list is not an account and is not an authorisation check. The deletion permission must not be inferred from it.

The VPS is for editing and encoding. It is not the long-term library. The initial permanent library named by the owner is a 5 TB Google Drive. A later move to object storage must keep the same library records and change only the storage location.

## Lifecycle

Every file the library tracks moves through:

`UPLOADED` → `PROCESSING` → `ACTIVE` → `RETENTION_REVIEW` → `DELETE_REQUESTED` → `DELETE_APPROVED` → `QUARANTINED` → `DELETED`

`DELETED` is the irreversible removal of the stored bytes. It is reached only after an explicit approval and the recovery window.

An approver can apply one of four decisions to a single file or to a selected batch:

- `KEEP` — the file stays `ACTIVE`. A later review may consider it again. Keep is not a permanent exemption unless the file is also protected.
- `ARCHIVE` — the file stays addressable and is not a candidate for the next deletion batch. It can still be read. Archive is not deletion.
- `DELETE_REJECTED` — a proposed deletion was refused. The file returns to `ACTIVE`. The refusal and its reason stay on the proposal.
- Approve deletion — the file moves to `DELETE_APPROVED`, then quarantine. Approval is the only path toward `DELETED`.

Keep, archive, and delete rejected leave the deletion path. Approval continues it.

Silence does not move a file. A proposal with no decision remains `PENDING`.

## What the intelligence engine may do

A periodic retention job may read:

- Age, from the library record's creation time.
- Whether the related content row has a stored public URL. Absence of a URL means unpublished. The job must not invent a performance result for an unpublished file.
- Whether the file belongs to a story series or episode that still exists.
- Performance metrics that are actually stored. Empty metrics stay empty in the reason. They are not estimated.
- Reuse, from recorded links to more than one content row, series, or package.
- Duplicate detection, from a content hash once a hash has been stored. A missing hash is not proof of uniqueness and not proof of a duplicate.
- Campaign status. While `uk-month-one` is `BUILD`, unpublished files for that campaign are not waste.
- Storage consumption, from the byte size on the library record and the capacity snapshots.
- Dependencies. A file that another asset still references is not eligible for a delete recommendation.

The job writes a recommendation and a reason onto a proposal. It may set the file's lifecycle to `RETENTION_REVIEW` when it opens that proposal. It must not set `DELETE_APPROVED`, `QUARANTINED`, or `DELETED`. It has no deletion credential and no worker token that can delete.

### Protected from delete recommendations

These classes are marked protected and are excluded from deletion proposals:

- Reusable character references.
- Story bibles.
- Episodes that are still active, including drafts that have not been retired.
- Licensed source materials the owner has marked as must-keep.
- Files whose stored performance is above the threshold the owner sets. Until a threshold is stored, high-performing means a file with a real stored metric the owner has flagged, not a guess.

Protection can be added by the owner. The model cannot clear it.

Story bibles and episode packages are JSON rows in `story_series` and `story_episodes`, not loose files. Character references may be files or fields inside those packages. Protection covers those rows as well as library files. A cleanup must not drop a protected bible or an active episode because it has no Drive object.

## Who may approve permanent deletion

The capability is `approve_permanent_media_deletion`.

It is specified here and is not yet a value in `src/domain/permissions.ts`. `SUPER_ADMIN` receives every capability in that list, so adding the value before the review screen exists would grant deletion approval with nothing to approve. Phase 4 adds it with the approver table.

It is not included in `PUBLISHING_OPERATOR`, `CONTENT_OPERATOR`, `DESIGNER`, `VIDEO_EDITOR`, `ANALYST`, or any worker token. An AI job does not receive it.

Two human paths may hold it:

- The owner account, the Super Admin that administers users.
- A user id the owner has explicitly inserted into `media_deletion_approvers`.

The owner maps Shahzeb's account by user id when that account is known. Until that row exists, the product must not label any login as Shahzeb's deletion authority because of a display name, an email, or the `shahzeb` staff label. Operators cannot grant the capability to themselves.

Approval is per file or per selected batch. A batch approval stores one decision row per file. It does not approve files that were added to the review after the decision.

## Monthly review, and earlier reviews

On the first day of each month the system opens one review for the previous month. The review lists each proposal with:

- The file's stable id and name.
- The recommendation and the reason.
- File size.
- Estimated recoverable space, the sum of bytes that would leave the permanent library if that proposal were approved and later executed. Quarantine does not count as already recovered.
- Brand and campaign, when the file is linked to them.
- Current publishing status from the content row. Deleting a production file does not change that status and does not delete a live social post.
- Last-used date.
- Dependencies.
- Actions: approve deletion, reject, retain, or archive.

If projected growth would exhaust free space before the next monthly review, the system opens an extra review immediately and alerts the approvers. That review uses the same actions. It still does not treat silence as approval.

## Safe deletion

Execution runs only when all of the following are true for that file id:

- A proposal decision is `APPROVED`, with an approver id and an approval time.
- The approver held `approve_permanent_media_deletion` at decision time.
- A fresh dependency check finds no remaining dependent asset.
- The file is not protected.
- The id being removed matches the approved proposal's file id. A path or filename match is not enough.
- The deletion reason stored on the proposal is still the reason recorded on the audit event.

The first execution step is quarantine, not irreversible removal. The proposed recovery period is 30 days, stored as policy so the owner can change it before the phase is enabled. Where the backend has a trash, quarantine uses that trash and records its locator. Where it does not, the bytes stay in place, marked quarantined, and are not copied into a second full-size archive. During quarantine the bytes stay restorable and production uploads do not treat the space as free. After the period, with the approval still valid and the checks repeated, the permanent backend object may be removed.

The library row, performance history, proposal, and deletion audit remain. The audit records the approver, the approval time, and the reason. `DELETED` means the bytes are gone. The metadata is not.

Removing the archived production file does not call Meta and does not clear a publication URL.

## VPS temporary storage

Temporary render files stay outside the release directory and under a disk cap. A cleanup task may remove a temporary object only after:

- The permanent copy's location is stored.
- A size or hash check has marked that copy verified.

Cleanup must refuse to delete a location that is the last verified copy of an original or a final asset. A failed transfer leaves the temporary file in place and the job in `AWAITING_STORAGE`.

## Capacity

The capacity ledger records, per backend and in total:

- Storage used and free space.
- Growth rate, from successive snapshots.
- Usage per brand, per operator, and per series, from the library links.
- Reclaimable bytes: the sum of sizes in open delete proposals that are not yet approved. Approved items still in quarantine are reported separately and are not free space.
- Projected time until the free space is exhausted, from the observed growth rate. If there is no growth history, the projection says it cannot be calculated.

Alerts start at 70, 85, and 95 percent used. The percentages are policy values.

When free space is below the pause line, new production uploads and new render completions that need disk are refused with a stored reason. The campaign status, publishing control, and existing schedules are not changed. Reads, approvals, and already published posts continue.

## Storage boundary

`media_objects` is the library. `media_locations` is where the bytes live. The first permanent backend to implement is Google Drive, using a file id stored as the locator. Application-host paths and VPS temporary paths are other backends on the same table. A later object store adds a backend value and new location rows. The library id does not change, so the media library is not rebuilt for that move.

Drive OAuth, when it is built, uses a company credential. It does not store a personal password. This plan does not connect it.

## Proposed data model

These tables are not in `drizzle/` and must not be added there until a later phase is accepted. `scripts/db-production.ts` applies every SQL file in the migrate list. Adding a file would change production on the next release.

`media_objects`

- `id` uuid primary key. This is the identifier deletion checks.
- `lifecycle` as listed above.
- `protected` boolean, default false.
- `protection_reason` text.
- `bytes` bigint.
- `content_hash` text, nullable.
- `original_filename` text.
- `content_type` text.
- `brand_code` text, nullable, matching `social_pages.code` when known.
- `campaign_id` text, nullable.
- `content_id` text, nullable.
- `series_id` uuid, nullable.
- `episode_id` uuid, nullable.
- `operator_user_id` uuid, nullable.
- `source_table` and `source_id`, so a row can point at an existing `creative_assets` or `story_clips` id without copying the file.
- `last_used_at` timestamptz, nullable.
- `created_at` timestamptz.

`media_locations`

- `id` uuid.
- `media_object_id` uuid.
- `backend` text: `APPLICATION_HOST`, `GOOGLE_DRIVE`, `OBJECT_STORAGE`, `VPS_TEMP`.
- `locator` text.
- `bytes` bigint.
- `verified_at` timestamptz, nullable.
- `last_verified_copy` boolean.

`media_dependencies`

- `media_object_id` uuid.
- `depends_on_id` uuid.
- `reason` text.

`media_retention_reviews`

- `id` uuid.
- `kind` text: `MONTHLY` or `CAPACITY`.
- `status` text: `OPEN` or `CLOSED`.
- `period_start` and `period_end`.
- `opened_at` timestamptz.
- `projection_note` text.

`media_retention_proposals`

- `id` uuid.
- `review_id` uuid.
- `media_object_id` uuid.
- `recommendation` text: `DELETE`, `KEEP`, or `ARCHIVE`.
- `reason` text.
- `bytes` bigint.
- `publishing_status` text, a snapshot.
- `dependency_summary` text.
- `decision` text: `PENDING`, `APPROVED`, `REJECTED`, `RETAINED`, or `ARCHIVED`. Default `PENDING`. `RETAINED` is keep. `ARCHIVED` is the archive decision. `REJECTED` is delete rejected.
- `decided_by` uuid, nullable.
- `decided_at` timestamptz, nullable.

`media_deletion_approvers`

- `user_id` uuid primary key.
- `granted_by` uuid.
- `granted_at` timestamptz.
- `revoked_at` timestamptz, nullable.

`media_deletion_events`

- `id` uuid.
- `media_object_id` uuid.
- `proposal_id` uuid.
- `approver_id` uuid.
- `approved_at` timestamptz.
- `reason` text.
- `quarantine_until` timestamptz.
- `executed_at` timestamptz, nullable.
- `recovered_at` timestamptz, nullable.
- `snapshot` jsonb. Performance history and the file description at approval time.

`media_capacity_snapshots`

- `id` uuid.
- `recorded_at` timestamptz.
- `backend` text.
- `used_bytes` and `free_bytes` bigint.

`media_capacity_policy`

- One row. Initial alert levels 70, 85, and 95. Initial quarantine length 30 days. The pause line is unset until the owner sets the free-space floor. An unset pause line does not mean uploads run until the disk is full. Phase 4 refuses to enable the pause until the floor is set.

Existing `creative_assets.approval_status` and `production_jobs.status` stay the production and review states they already are. They are not overloaded with retention states.

## Approval workflow

1. The monthly job, or the capacity job, opens a review and writes proposals. Protected files are omitted from `DELETE` proposals.
2. An approver opens the review. Pending rows are undecided.
3. Approve deletion, reject, retain, or archive. Each action stores the user id and the time. A batch applies only to the ids the approver selected.
4. An execution job later selects `APPROVED` proposals whose file is still unprotected and independent. It moves the bytes to quarantine and writes the event.
5. During the recovery window an approver may restore. Restore returns the file to `ACTIVE` and records `recovered_at`.
6. After the window the same checks run again. Only then may the permanent object be removed and the lifecycle set to `DELETED`.

No step runs because a review went unanswered.

## Phased implementation

Phase 0, this delivery. The decision and this plan are recorded. No SQL file, no delete route, no change to campaign or publishing.

Phase 1. Additive tables only, after this plan is accepted. Register existing `creative_assets` and `story_clips` as library rows that point at the current paths. Do not move or delete bytes.

Phase 2. Google Drive connector for the company library: OAuth, file id, and capacity snapshots. Still no deletion and no upload of the historical library until the owner starts that copy.

Phase 3. The recommendation job and the review screen. Decisions can be stored. Execution stays disabled.

Phase 4. Approver mapping, monthly and capacity reviews, threshold alerts, and the upload pause once the free-space floor is set.

Phase 5. Quarantine and, after the recovery window, irreversible removal of approved objects only. Audit rows remain.

Phase 6. An object-storage backend on `media_locations` when the owner leaves Drive. Library ids stay.

## Out of scope for every phase

- Deleting a live Facebook post because its production file was removed.
- Granting permanent delete to operators, editors, or the model.
- Guessing which user is Shahzeb.
- Inventing performance, reuse, or duplicate claims when the stored evidence is missing.
- Replacing the database or seeding media.
