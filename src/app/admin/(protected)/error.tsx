"use client";

import Link from "next/link";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <main className="admin-container grid place-items-center">
      <section className="surface-card w-full max-w-xl p-7 text-center sm:p-10">
        <p className="eyebrow">Workspace unavailable</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">We couldn&apos;t load this operational view.</h1>
        <p className="mt-4 leading-7 text-muted">No technical details are exposed here. Retry the request or return to the dashboard.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button className="button-primary" onClick={reset} type="button">Try again</button><Link className="button-secondary" href="/admin">Dashboard</Link></div>
      </section>
    </main>
  );
}
