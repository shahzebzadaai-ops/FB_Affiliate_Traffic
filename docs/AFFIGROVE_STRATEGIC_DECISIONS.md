# AffiGrove strategic decisions

This file is the strategic source of truth for later implementation sessions. Earlier decisions stay in `docs/DECISION_LOG.md`. A change to an approved decision is recorded here with the owner's reason. Do not silently replace one.

Company: AffiGrove Media Group. Product: AffiGrove OS. Primary market: United Kingdom. Status: development and pre-launch.

## Audience-first affiliate media

The operating idea is attract, entertain, retain, build trust, then monetise. Five Facebook media brands are planned, each with a matching website and comparison pages that use the same approved name. Short-form reels and episodic entertainment are the priority formats. Images, carousels, and discussion posts stay in the mix and do not define the architecture.

Affiliate marketing is the primary monetisation path. Facebook creator payouts are not the plan. No affiliate approval, offer, earning, or performance figure is invented. Dating offers are considered only after an audience has been demonstrated, and only from approved partners. Fictional characters are not presented as people waiting on a dating site. A dating call to action is not added to every episode.

The five names already in the plan — Back in the Game UK, After Hours Singles UK, Single Parent Stories UK, Still Got It UK, and Casual By Choice UK — remain candidates. They are not approved final Facebook or domain names. No page or domain is created from this file. The owner approves the five final names.

## Provider roles

The language layer is an OpenAI-compatible chat client. In development it calls the private FreeLLMAPI router at `http://127.0.0.1:3001/v1` when `FREELLMAPI_API_KEY` and `FREELLMAPI_MODEL` are set. `FREELLMAPI_FALLBACK_MODEL` names a second model on that same router. The router holds provider credentials, encrypted, and AffiGrove stores only the router's unified key. Groq is the free provider configured in the local router. Novita remains implemented. It is used when FreeLLMAPI is unset, and it is the next attempt when the router fails and `NOVITA_API_KEY` plus `NOVITA_MODEL` are set. A model is not assumed to know today's web.

Live research is a separate adapter. It is responsible for current sources. The language model may analyse text that was supplied to it, and that record is marked as not a web search. If no authorised search API is configured, the product says live research is unavailable. Engagement numbers are not estimated and then described as facts.

Muse AI is the manual video and image studio. One account is advertised with 1,000,000,000 tokens. That figure is a seller's label, not a measured balance. Muse is used through its website. There is no Muse API, no stored Muse password, and no scripted control of the Muse site. The operator copies a prepared prompt, downloads the file, and uploads it.

The VPS edits and encodes. It is not the place for a heavy generative video model, and it is not the long-term library.

Permanent storage is a separate 5 TB destination. Its type is not confirmed. This architecture does not assume Google Drive, S3, a mounted disk, or a NAS. The earlier note that Google Drive was the 5 TB store is withdrawn until the owner names the service. Uploads stay on the application host until that service exists.

## Story production

Original episodic romance is a priority format. Story Series Studio keeps a story bible, a season plan, and episode packages for Muse. Stories are original, licensed, or suitable public-domain works. Copyrighted novels are not copied and protected plots are not adapted.

A series is not launched because five pages exist. The Series Launch Advisor can recommend research, preparation, a pilot, continued testing, a launch, or a pause. Only the owner approves a launch. A daily series should have at least seven finished episodes prepared. Seven to fourteen days of evidence is a planning reference, not a rule. Recommendations must separate measured platform data from assumptions.

## Editing

Money Printer Turbo is not the preferred production system. It was already excluded from this repository. The selected editor inside the repository is `worker/atos_worker`, which calls the system FFmpeg with an argument list and `shell=False`. No external editing-repository URL is recorded. A clip-joining command now lives in that same assembler. The VPS service that would run it is not installed.

## Controls

Four controls stay separate:

- AI intelligence starts or pauses research interpretation and script preparation.
- Creative production starts or pauses internal production preparation.
- The video editing worker starts or pauses queued editing.
- Publishing is off until the owner uses the existing campaign start.

Starting an intelligence engine is not permission to publish, create a page, boost a post, or activate an affiliate campaign.

## Evidence

The database stores source URLs, retrieval time, and geography when a real research adapter returns them. It does not store fabricated popularity. Performance recommendations wait for exported or manually entered analytics, or for a permitted Meta insights connection. Individual viewer behaviour that a platform does not expose is not claimed. Conversions and revenue stay empty until a configured network reports them.
