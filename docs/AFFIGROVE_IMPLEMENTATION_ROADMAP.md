# AffiGrove implementation roadmap

Status words: completed, in progress, blocked, later. Strategic choices are in `docs/AFFIGROVE_STRATEGIC_DECISIONS.md`. Publishing stays off.

## Completed

- Private OS, five candidate page identities, 180-plan catalog, owner and operator shells, campaign `uk-month-one` held in `BUILD`.
- Manual Muse desk: packages from a plan brief, private upload, typed token balance, no Muse API.
- Corporate site on affigrove.io with search indexing off.
- Mac media queue and FFmpeg assembler in `worker/atos_worker`.
- Intelligence foundation: an OpenAI-compatible language client, research-unavailable state, engine controls, Story Series Studio storage, launch and monetisation advice that refuse to invent measurements, and a clip-joining command in the existing assembler.
- Development language route through the private FreeLLMAPI router. Novita stays in the client for later use. The router is not part of the live OS release.

## In progress

- Phase 1 acceptance on the development machine through FreeLLMAPI. Production still has no language-model key, and this route has not been deployed.
- Story Series Studio screen at `/owner/stories`. It generates a pilot only after the configured language model answers. It can store an uploaded shot and leave it unassembled.

## Blocked

- Live research. No `RESEARCH_PROVIDER` and no `RESEARCH_API_KEY`. No adapter is pretended for a named provider.
- Production language generation. The live host has neither FreeLLMAPI nor `NOVITA_API_KEY` and `NOVITA_MODEL`. Local development can use the loopback router; that process is not the live OS.
- Permanent 5 TB storage. The owner named Google Drive as the initial library. OAuth and the connector are not built. Retention rules are recorded in `docs/MEDIA_RETENTION.md`. No deletion job is active. Files are not sent to Drive yet.
- VPS editing service. The assembler can join clips, and the command was checked locally with FFmpeg. It is not installed as a service on the VPS, and the editing control defaults to paused.
- External editing repository. None is named in the repository. The in-repo assembler is the selected tool. If a different repository was intended, its URL is still required.
- Five final brand names. Candidates exist. Live naming research cannot run until a search source is configured. A language model is not that source. The owner has not approved final names.
- Meta insights, affiliate networks, and CPA Whale reporting beyond an empty private report. Measured fields stay null.
- Series launch. No page is active and no watch time is stored, so the advisor stays on researching.

## Later

- Phase 2 depth: character-reference image library, season lengths beyond the five-episode pilot, and regeneration of one shot.
- Phase 3: connect the named 5 TB Google Drive library without deleting files, install one paused-by-default FFmpeg worker on the VPS, cap temporary disk and concurrency, and delete temporary files only after the permanent copy is confirmed. Retention phases in `docs/MEDIA_RETENTION.md` stay ahead of any permanent delete.
- Phase 4: brand-name research after sources exist, performance import, editorial calendar per brand, and a launch recommendation that cites stored metrics.
- Phase 5: approved-offer matching, comparison pages under the approved brand name, monetisation readiness from real traffic, and a partner report that still separates results from targets.

## VPS requirements before an editing service is installed

- Keep publishing off and keep the campaign in `BUILD`.
- Install FFmpeg on the VPS. Do not install a generative video model.
- Run one edit at a time. Keep temporary files outside the release directory and under a disk cap.
- Leave originals in the private media directory until a confirmed permanent store returns a location.
- Do not point the worker at Money Printer Turbo.

## Next action

Keep the router on loopback. Deploying it, or copying its unified key into the live OS, waits for the owner's approval. The prepared steps are in `deploy/FREELLMAPI.md`. Novita stays optional and runs only when `LANGUAGE_PROVIDER=novita`. The 5 TB library is Google Drive. The retention plan is accepted as policy and is not implemented. If the editor is not `worker/atos_worker`, the owner still needs to supply that repository URL.
