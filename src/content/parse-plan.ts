export type ParsedPlanRow = {
  sourceId: string;
  formatRaw: "Reel" | "Image" | "Poll" | "Carousel";
  pillar: string;
  hook: string;
  brief: string;
  cta: string;
};

const ROW_START =
  /^\s+((?:BGUK|AHSUK|SPSUK|SGIUK|CBCUK)-\d{3})\s+(Reel|Image|Poll|Carousel)\s+/;

type Columns = {
  pillar: number;
  hook: number;
  staff: number;
  cta: number;
};

function sliceColumn(line: string, start: number, end: number | null): string {
  if (start < 0 || line.length <= start) return "";
  const chunk = end && end > start ? line.slice(start, end) : line.slice(start);
  return chunk.trim();
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function parsePlanText(source: string): ParsedPlanRow[] {
  const lines = source.replaceAll("\f", "").split(/\r?\n/);
  let columns: Columns | null = null;
  let current: ParsedPlanRow | null = null;
  const rows: ParsedPlanRow[] = [];

  const flush = () => {
    if (!current) return;
    current.pillar = collapse(current.pillar);
    current.hook = collapse(current.hook);
    current.brief = collapse(current.brief);
    current.cta = collapse(current.cta);
    rows.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replaceAll("\f", "");
    if (line.includes("Hook / content idea") && line.includes("Format") && line.includes("Pillar")) {
      flush();
      columns = {
        pillar: line.indexOf("Pillar"),
        hook: line.indexOf("Hook"),
        staff: line.indexOf("Staff"),
        cta: line.indexOf("CTA"),
      };
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    if (line.includes("UK Audience Network")) continue;

    const match = line.match(ROW_START);
    if (match && columns) {
      flush();
      current = {
        sourceId: match[1],
        formatRaw: match[2] as ParsedPlanRow["formatRaw"],
        pillar: sliceColumn(line, columns.pillar, columns.hook),
        hook: sliceColumn(line, columns.hook, columns.staff),
        brief: sliceColumn(line, columns.staff, columns.cta),
        cta: sliceColumn(line, columns.cta, null),
      };
      continue;
    }

    if (!current || !columns) continue;
    if (/^\s*(Week \d+|10\.\d+|11\.|12\.|13\.|14\.|15\.|16\.|17\.)/.test(line)) {
      flush();
      continue;
    }

    const pillar = sliceColumn(line, columns.pillar, columns.hook);
    const hook = sliceColumn(line, columns.hook, columns.staff);
    const brief = sliceColumn(line, columns.staff, columns.cta);
    const cta = sliceColumn(line, columns.cta, null);
    if (pillar) current.pillar += ` ${pillar}`;
    if (hook) current.hook += ` ${hook}`;
    if (brief) current.brief += ` ${brief}`;
    if (cta) current.cta += ` ${cta}`;
  }

  flush();
  return rows;
}
