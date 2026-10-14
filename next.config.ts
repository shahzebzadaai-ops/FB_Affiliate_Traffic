import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server allowlist includes "localhost" only. Cursor's browser
  // often requests the same server as 127.0.0.1, which blocks the dev
  // WebSocket and leaves the page on an unhydrated shell.
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0", "cursor"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const shared = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/site", headers: shared },
      { source: "/site/:path*", headers: shared },
      { source: "/api/public/:path*", headers: shared },
    ];
  },
};

export default nextConfig;
