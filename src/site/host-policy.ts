export const CORPORATE_HOSTS = new Set(["affigrove.io", "www.affigrove.io"]);
export const OS_HOSTS = new Set(["os.affigrove.io"]);
const UNPURCHASED_HOSTS = new Set(["affigrove.com", "www.affigrove.com"]);

const PRIVATE_PREFIXES = ["/owner", "/staff", "/setup", "/join", "/api"];

const PRETTY_TO_SITE: Record<string, string> = {
  "/": "/site",
  "/about": "/site/about",
  "/what-we-do": "/site/what-we-do",
  "/approach": "/site/approach",
  "/careers": "/site/careers",
  "/contact": "/site/contact",
  "/privacy": "/site/privacy",
  "/terms": "/site/terms",
};

export type HostDecision =
  | { type: "next" }
  | { type: "rewrite"; pathname: string }
  | { type: "redirect"; pathname: string }
  | { type: "not-found" };

export function hostnameOf(hostHeader: string | null): string {
  if (!hostHeader) return "";
  const host = hostHeader.trim().toLowerCase();
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host : host.slice(0, end + 1);
  }
  return host.split(":")[0] ?? "";
}

function isPrivate(pathname: string): boolean {
  if (pathname === "/api/public" || pathname.startsWith("/api/public/")) return false;
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function decideHost(hostHeader: string | null, pathname: string): HostDecision {
  const host = hostnameOf(hostHeader);
  if (UNPURCHASED_HOSTS.has(host)) return { type: "not-found" };
  if (OS_HOSTS.has(host) && (pathname === "/site" || pathname.startsWith("/site/"))) return { type: "not-found" };
  if (!CORPORATE_HOSTS.has(host)) return { type: "next" };
  if (pathname === "/site") return { type: "redirect", pathname: "/" };
  if (pathname.startsWith("/site/")) return { type: "redirect", pathname: pathname.slice("/site".length) };
  if (isPrivate(pathname)) return { type: "not-found" };
  const internal = PRETTY_TO_SITE[pathname];
  if (internal) return { type: "rewrite", pathname: internal };
  return { type: "next" };
}
