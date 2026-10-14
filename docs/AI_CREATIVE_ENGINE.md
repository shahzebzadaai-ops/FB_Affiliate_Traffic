# AI creative engine

IMPLEMENTED now: the owner Content Studio lists the next seven plan days, and the owner brief still holds copyable prompts. Prepare for Muse AI compiles a production package from the approved plan brief. No writing model is called. Muse AI — Web Studio is an EXTERNAL_MANUAL provider: the owner copies a prompt into the Muse website, downloads the file, and uploads it. Token balances are typed by hand. Approval stores the file and does not publish. Generation cost stays "Not connected" until a balance is entered. The studio screen is specified in `docs/UI_ARCHITECTURE.md`.

Novita and other API providers stay unconnected. They would use a separate adapter. Muse is not that adapter.

NOT YET: pluggable providers, attempt counts, or automatic tasks from a suggestion.

Rules for later suggestions: separate observed facts, calculated metrics and hypotheses. Do not let a model invent Meta numbers. Persist model version, evidence ids and time. Shahzeb approves, edits, rejects or saves. Approval can create Masho's task. Nothing publishes itself.

Character packs, scene continuity and British voice direction stay in the task brief until a provider is chosen.
