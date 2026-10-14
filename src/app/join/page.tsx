"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function JoinPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center"><p className="font-heading text-3xl">Affiliate Traffic OS</p></main>}>
      <JoinForm />
    </Suspense>
  );
}

function JoinForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="font-heading text-4xl tracking-tight">Affiliate Traffic OS</p>
      <h1 className="mt-6 font-heading text-3xl">Set your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">This invitation is for one publishing operator. It does not show anyone else&apos;s account.</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const password = String(new FormData(event.currentTarget).get("password") ?? "");
          setPending(true);
          void fetch("/api/invitations/accept", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token, password }),
          }).then(async (response) => {
            const body = (await response.json()) as { error?: string };
            setPending(false);
            if (!response.ok) {
              setError(body.error ?? "The invitation was not accepted.");
              return;
            }
            router.push("/staff");
            router.refresh();
          });
        }}
      >
        <label className="block text-sm">
          Password
          <input required name="password" type="password" minLength={12} className="mt-1 h-11 w-full border border-border bg-card px-3" />
        </label>
        <button type="submit" disabled={pending || token.length < 20} className="h-11 w-full bg-primary text-sm font-medium text-primary-foreground">
          Open my publishing desk
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </main>
  );
}
