import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decideHost } from "@/site/host-policy";

export function proxy(request: NextRequest) {
  const decision = decideHost(request.headers.get("host"), request.nextUrl.pathname);
  if (decision.type === "next") return NextResponse.next();
  if (decision.type === "not-found") return new NextResponse("Not found", { status: 404 });
  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  if (decision.type === "redirect") return NextResponse.redirect(url);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
