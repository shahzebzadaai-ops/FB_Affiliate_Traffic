# Staff workflow

An operator opens the app and sees only assigned Pages and today's publishing tasks. Ready to publish stays empty until a real file URL is stored. They do not choose a topic or write a prompt.

A publishing task shows the Page, the UK slot, the finished file when one exists, the plan caption instruction, and manual Meta Business Suite steps. Download and thumbnail stay unavailable until a file store exists. There is no fake file link.

They confirm scheduling without a public URL, then later paste the live Facebook URL. Those are separate records. If the asset cannot be published, they report the problem or request regeneration. Neither action starts an AI job or spends money.

They cannot see another operator, affiliate offers, tracking links, postbacks, revenue, or AI spend. They cannot create a Page or change strategy.

Shahzeb invites each operator with a one-time link, assigns Pages, and can move a Page from one operator to another. The previous operator's name is not shown on the task. Training completion is visible to Shahzeb and to that operator only.

Google Drive folders are planned, not connected:

`AffiGrove OS/UK/{Page name}/{YYYY-MM}/{content ID}/`

Inside that folder: Brief, Scripts, Images, Audio, Working-Videos, Final-Videos, Thumbnails, Captions.

## Production to publishing — current gaps

The master Reel, still and thumbnail are meant to be files the Mac worker renders, Shahzeb approves, and Google Drive stores. Drive is not connected. Kokoro is not installed. No Reel has been rendered for a Page. The plan’s `captionInstructions` are a brief, not a finished caption. The worker spec copies that brief. It does not return caption text or a thumbnail URL.

What exists: a PostgreSQL job queue, owner approval of an https file URL, and task commands for schedule confirmation, a live URL, an issue note and a regeneration note. Approval of a media job writes that https URL into `assetReference` and does not change the task status. It refuses if a different https URL is already stored, so it does not keep the previous file. `flagRegeneration` appends a revision note and does not call a model, replace the file, or store an asset version.

A task appears in Ready when `assetReference` is an http(s) URL and the status is not scheduled or published. Confirming a schedule still requires status `APPROVED` as well as that URL. Media approval alone does not make the task `APPROVED`.

Masho’s desk does not show the approved URL. Download, thumbnail and copy caption stay disabled. He can open Meta Business Suite himself. He can record a schedule only after the task is approved and a file URL exists, then paste a live URL. The app does not post. There is no Masho account in this database yet; the publishing shell is the operator shell, and affiliate finance stays off it.
