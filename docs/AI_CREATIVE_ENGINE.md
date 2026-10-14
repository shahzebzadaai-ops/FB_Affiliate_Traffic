# AI creative engine

IMPLEMENTED now: the owner Content Studio lists the next seven plan days, and the owner brief still holds copyable prompts. Prepare for Muse AI compiles a production package from the approved plan brief. No writing model is called. Muse AI — Web Studio is an EXTERNAL_MANUAL provider: the owner copies a prompt into the Muse website, downloads the file, and uploads it. Token balances are typed by hand. Approval stores the file and does not publish. Generation cost stays "Not connected" until a balance is entered. The studio screen is specified in `docs/UI_ARCHITECTURE.md`.

Novita is the language-model adapter. It calls `https://api.novita.ai/openai/v1/chat/completions` only when `NOVITA_API_KEY` and `NOVITA_MODEL` are set and the intelligence engine is started. Those values are not set, so the desk says Novita is not configured. Live research is a different adapter and is unavailable. Muse is not an API adapter.

NOT YET: pluggable providers, attempt counts, or automatic tasks from a suggestion.

Rules for later suggestions: separate observed facts, calculated metrics and hypotheses. Do not let a model invent Meta numbers. Persist model version, evidence ids and time. Shahzeb approves, edits, rejects or saves. Approval can create Masho's task. Nothing publishes itself.

Character packs, scene continuity and British voice direction stay in the task brief until a provider is chosen.
