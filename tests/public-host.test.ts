import { describe, expect, it } from "vitest";
import { decideHost, publicRedirect } from "@/site/host-policy";

describe("public host policy", () => {
  it("leaves local and the private host on the operating system", () => {
    expect(decideHost("127.0.0.1:3000", "/")).toEqual({ type: "next" });
    expect(decideHost("localhost:3000", "/owner")).toEqual({ type: "next" });
    expect(decideHost("os.affigrove.io", "/owner")).toEqual({ type: "next" });
    expect(decideHost("os.affigrove.io", "/api/work")).toEqual({ type: "next" });
  });

  it("serves the corporate site on affigrove.io and www only", () => {
    expect(decideHost("affigrove.io", "/")).toEqual({ type: "rewrite", pathname: "/site" });
    expect(decideHost("www.affigrove.io", "/about")).toEqual({ type: "redirect", pathname: "/about", host: "affigrove.io" });
    expect(decideHost("www.affigrove.io", "/")).toEqual({ type: "redirect", pathname: "/", host: "affigrove.io" });
    expect(decideHost("www.affigrove.io", "/site/contact")).toEqual({ type: "redirect", pathname: "/contact", host: "affigrove.io" });
    expect(decideHost("affigrove.io", "/site/contact")).toEqual({ type: "redirect", pathname: "/contact" });
    expect(publicRedirect("affigrove.io", "/contact")).toBe("https://affigrove.io/contact");
    expect(publicRedirect("www.affigrove.io", "/", "affigrove.io")).toBe("https://affigrove.io/");
    expect(decideHost("www.affigrove.io", "/api/public/enquiries")).toEqual({
      type: "redirect",
      pathname: "/api/public/enquiries",
      host: "affigrove.io",
    });
  });

  it("hides private routes on the public hosts and ignores the unpurchased domain", () => {
    expect(decideHost("affigrove.io", "/owner")).toEqual({ type: "not-found" });
    expect(decideHost("www.affigrove.io", "/staff/tasks/UK-SGIUK-001")).toEqual({ type: "not-found" });
    expect(decideHost("www.affigrove.io", "/owner")).toEqual({ type: "not-found" });
    expect(decideHost("affigrove.io", "/api/finance")).toEqual({ type: "not-found" });
    expect(decideHost("os.affigrove.io", "/site")).toEqual({ type: "not-found" });
    expect(decideHost("affigrove.com", "/")).toEqual({ type: "not-found" });
    expect(decideHost("www.affigrove.com", "/site")).toEqual({ type: "not-found" });
  });
});
