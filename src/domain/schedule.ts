export const UK_MARKET = {
  code: "UK",
  name: "United Kingdom",
  timeZone: "Europe/London",
  launchDate: "2026-10-12",
  sprintDays: 30,
  vertical: "dating-affiliate-publishing",
} as const;

const WEEKLY_RHYTHM: { dayOffset: number; time: string; format: "REEL" | "IMAGE_POST" | "POLL" | "CAROUSEL" }[] = [
  { dayOffset: 0, time: "19:00", format: "REEL" },
  { dayOffset: 1, time: "12:30", format: "IMAGE_POST" },
  { dayOffset: 2, time: "12:30", format: "REEL" },
  { dayOffset: 2, time: "19:00", format: "POLL" },
  { dayOffset: 3, time: "19:00", format: "IMAGE_POST" },
  { dayOffset: 4, time: "12:30", format: "REEL" },
  { dayOffset: 5, time: "12:30", format: "IMAGE_POST" },
  { dayOffset: 5, time: "19:00", format: "REEL" },
  { dayOffset: 6, time: "18:30", format: "CAROUSEL" },
];

const PAGE_STAGGER_MINUTES: Record<string, number> = {
  SGIUK: 0,
  BGUK: 12,
  AHSUK: 24,
  SPSUK: 36,
  CBCUK: 48,
};

export function addCivilDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function londonToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("Could not read the London date");
  }
  return `${year}-${month}-${day}`;
}

export function launchDayNumber(today = londonToday(), launchDate: string = UK_MARKET.launchDate): number {
  const start = Date.parse(`${launchDate}T00:00:00Z`);
  const current = Date.parse(`${today}T00:00:00Z`);
  return Math.round((current - start) / 86_400_000) + 1;
}

export function londonDateTimeToUtc(ymd: string, time: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(utc)).map((part) => [part.type, part.value]),
    );
    const actual = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    const wanted = Date.UTC(year, month - 1, day, hour, minute);
    const delta = wanted - actual;
    if (delta === 0) break;
    utc += delta;
  }

  return new Date(utc);
}

export function formatLondon(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function londonDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_MARKET.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function slotForPost(sourceId: string): {
  week: 1 | 2 | 3 | 4;
  publishAt: string;
  dueAt: string;
  expectedFormat: "REEL" | "IMAGE_POST" | "POLL" | "CAROUSEL";
} {
  const [pageCode, numberText] = sourceId.split("-");
  const number = Number(numberText);
  const slot = WEEKLY_RHYTHM[(number - 1) % 9];
  const week = (Math.floor((number - 1) / 9) + 1) as 1 | 2 | 3 | 4;
  const day = addCivilDays(UK_MARKET.launchDate, (week - 1) * 7 + slot.dayOffset);
  const [hourText, minuteText] = slot.time.split(":");
  const minutes = Number(hourText) * 60 + Number(minuteText) + (PAGE_STAGGER_MINUTES[pageCode] ?? 0);
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  const publishAt = londonDateTimeToUtc(day, `${hour}:${minute}`).toISOString();
  const dueAt = new Date(Date.parse(publishAt) - 3 * 60 * 60 * 1000).toISOString();
  return { week, publishAt, dueAt, expectedFormat: slot.format };
}

export function greetingForLondonHour(now = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UK_MARKET.timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
