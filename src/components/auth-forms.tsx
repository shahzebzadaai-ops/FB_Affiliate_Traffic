"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-16">
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Internal operating system</p>
      <h1 className="mt-3 font-heading text-5xl tracking-tight">AffiGrove OS</h1>
      <p className="mt-4 text-muted-foreground">Sign in with your account. There is no public registration.</p>
      <form
        className="atos-surface mt-8 space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setPending(true);
          void fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
          }).then(async (response) => {
            const body = (await response.json()) as { error?: string; user?: { role: string } };
            setPending(false);
            if (!response.ok) {
              setError(body.error ?? "Sign-in failed.");
              return;
            }
            router.push(body.user?.role === "PUBLISHING_OPERATOR" || body.user?.role === "CONTENT_OPERATOR" || body.user?.role === "DESIGNER" || body.user?.role === "VIDEO_EDITOR" ? "/staff" : "/owner");
            router.refresh();
          });
        }}
      >
        <Field label="Email" name="email" type="email" />
        <Field label="Password" name="password" type="password" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={pending} className="atos-btn">
          Sign in
        </button>
      </form>
    </main>
  );
}

export function SetupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-16">
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">One-time owner setup</p>
      <h1 className="mt-3 font-heading text-5xl tracking-tight">Create Shahzeb&apos;s account</h1>
      <p className="mt-4 text-muted-foreground">
        This screen works only while the database has no users. Choose a password of at least 12 characters. It is stored as a hash, not in Git.
      </p>
      <form
        className="atos-surface mt-8 space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setPending(true);
          void fetch("/api/auth/setup", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: data.get("name"),
              email: data.get("email"),
              password: data.get("password"),
            }),
          }).then(async (response) => {
            const body = (await response.json()) as { error?: string };
            setPending(false);
            if (!response.ok) {
              setError(body.error ?? "Setup failed.");
              return;
            }
            router.push("/owner");
            router.refresh();
          });
        }}
      >
        <Field label="Name" name="name" type="text" defaultValue="Shahzeb" />
        <Field label="Email" name="email" type="email" defaultValue="affiliateshahzeb@gmail.com" />
        <Field label="Password" name="password" type="password" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={pending} className="atos-btn">
          Create owner account
        </button>
      </form>
    </main>
  );
}

function Field({ label, name, type, defaultValue }: { label: string; name: string; type: string; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        required
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={type === "password" ? "current-password" : "username"}
        className="atos-field mt-1"
      />
    </label>
  );
}
