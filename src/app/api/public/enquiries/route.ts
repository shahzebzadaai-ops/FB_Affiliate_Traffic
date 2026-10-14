import { connection } from "next/server";
import { submitPublicEnquiry } from "@/server/enquiries";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "local";
}

function rejected(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  await connection();
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return rejected(403, "This form only accepts messages from the site itself.");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return rejected(403, "This form only accepts messages from the site itself.");
    } catch {
      return rejected(403, "This form only accepts messages from the site itself.");
    }
  }
  const text = await request.text();
  if (text.length > 8000) return rejected(413, "That message is too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return rejected(400, "The message could not be read.");
  }
  if (!body || typeof body !== "object") return rejected(400, "The message could not be read.");
  const result = await submitPublicEnquiry(body, clientIp(request));
  if (!result.ok) return rejected(result.status, result.error);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
