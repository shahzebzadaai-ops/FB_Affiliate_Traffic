import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildCatalog } from "@/content/build-catalog";
import { parsePlanText } from "@/content/parse-plan";
import { STAFF } from "@/domain/people";

const root = path.resolve(import.meta.dirname, "..");
const source = readFileSync(path.join(root, "data/source/uk-audience-network-plan.txt"), "utf8");
const rows = parsePlanText(source);
const catalog = buildCatalog(rows, STAFF);
const destination = path.join(root, "src/content/plan.generated.json");
writeFileSync(destination, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(
  `Imported ${catalog.report.successfullyImported} of ${catalog.report.expectedRecords}. Unresolved ${catalog.report.unresolved.length}. Duplicates ${catalog.report.duplicates.length}. Missing ${catalog.report.missingFields.length}.`,
);
