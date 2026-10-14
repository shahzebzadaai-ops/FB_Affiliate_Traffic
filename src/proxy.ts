import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decideHost, publicRedirect } from "@/site/host-policy";

export function proxy(request: NextRequest) {
  const decision = decideHost(request.headers.get("host"), request.nextUrl.pathname);
  if (decision.type === "next") return NextResponse.next();
  if (decision.type === "not-found") return new NextResponse("Not found", { status: 404 });
  if (decision.type === "redirect") {
    return NextResponse.redirect(publicRedirect(request.headers.get("host"), decision.pathname, decision.host), 308);
  }
  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  // Nginx terminates TLS. Next then proxies an absolute rewrite to its own
  // origin, and it rewrites 127.0.0.1 to localhost, so the origins do not
  // match. The application process speaks HTTP. An https self-proxy fails.
  url.protocol = "http:";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
