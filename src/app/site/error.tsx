"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <article className="grove-prose">
      <p className="grove-kicker">Something went wrong</p>
      <h1>This page could not be shown.</h1>
      <p>The rest of the site is unchanged. Try the page again.</p>
      <div className="grove-actions">
        <button type="button" className="grove-button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </article>
  );
}
