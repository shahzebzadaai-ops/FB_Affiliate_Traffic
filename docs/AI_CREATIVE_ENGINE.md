# AI creative engine

IMPLEMENTED now: the owner Content Studio lists the next seven plan days, and the owner brief still holds copyable prompts. Prepare for Muse AI compiles a production package from the approved plan brief. No writing model is called. Muse AI — Web Studio is an EXTERNAL_MANUAL provider: the owner copies a prompt into the Muse website, downloads the file, and uploads it. Token balances are typed by hand. Approval stores the file and does not publish. Generation cost stays "Not connected" until a balance is entered. The studio screen is specified in `docs/UI_ARCHITECTURE.md`.

The language-model adapter is OpenAI-compatible. Development uses the private FreeLLMAPI router on `127.0.0.1:3001` when `LANGUAGE_PROVIDER` is empty or `freellmapi`, `FREELLMAPI_API_KEY` and `FREELLMAPI_MODEL` are set, and the intelligence engine is started. A fallback model on that router can be named with `FREELLMAPI_FALLBACK_MODEL`. Novita remains an optional adapter and is used only when `LANGUAGE_PROVIDER=novita`. A story is built from separate concept, story bible, season outline, and episode calls. A cut-off or invalid reply is retried or sent to the fallback model. It is not rewritten into missing prose. Live research is a different adapter and is unavailable. A language reply about pasted notes is not live research. Muse is not an API adapter. The Muse package for a generated episode is still built by `episodePackage` from the story the model returned.

NOT YET: pluggable providers, attempt counts, or automatic tasks from a suggestion.

Rules for later suggestions: separate observed facts, calculated metrics and hypotheses. Do not let a model invent Meta numbers. Persist model version, evidence ids and time. Shahzeb approves, edits, rejects or saves. Approval can create Masho's task. Nothing publishes itself.

Character packs, scene continuity and British voice direction stay in the task brief until a provider is chosen.
