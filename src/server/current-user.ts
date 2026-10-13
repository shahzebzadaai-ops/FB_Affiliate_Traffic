import { cookies } from "next/headers";
import { userFromToken, type PublicUser } from "@/server/accounts";

export const SESSION_COOKIE = "atos_session";

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userFromToken(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}
