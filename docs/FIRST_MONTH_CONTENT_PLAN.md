# First-month content plan

Source: `data/source/uk-audience-network-plan.txt`, extracted from the UK Audience Network master plan PDF. The importer is `src/content/parse-plan.ts` and `src/content/build-catalog.ts`. Regenerate with `npm run import:plan`.

Expected records: 180. Successfully imported: 180. Duplicate source IDs: 0. Rows dropped for missing fields: 0.

The PDF mix is 16 Reels, 12 image/story posts, 4 polls and 4 carousels per Page. The later build prompt suggested 14 Reels, 14 text/image posts, 4 polls and 4 carousels. The calendar keeps the PDF's 180 posts until Shahzeb approves a different allocation. There are no standalone text-only posts in the PDF. Image/story cards are imported as image posts.

76 imported posts carry unresolved notes:

- The format column sometimes disagrees with the specific sentence in the staff brief. Production follows the format column, which matches the weekly rhythm.
- Poll answer choices are not written in the plan.
- Carousel teaching points are not written out.

Unresolved posts are still imported. Shahzeb can postpone, edit or cancel them. Masho should not invent poll choices or slide copy and present them as already approved.

Launch date: Monday 12 October 2026, Europe/London. The sprint length is 30 days. Publishing follows the PDF week: Monday Reel, Tuesday image, Wednesday Reel and poll, Thursday image, Friday Reel, Saturday image and Reel, Sunday carousel. Lunch posts are 12:30 and evening posts are 19:00, with a short stagger by Page. Still Got It UK keeps the 19:00 slot. Production is due three hours before publish.

Permanent IDs look like `UK-SGIUK-001`. All 180 are assigned to the active UK content operator, Masho, and reviewed by Shahzeb.
