"use client";

import Link from "next/link";

import { PublicHeader } from "@/components/public-header";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-5 py-16 text-center sm:px-8" id="main-content" tabIndex={-1}>
        <section className="surface-card w-full p-7 sm:p-10">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">We couldn&apos;t load this page.</h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-muted">Your information has not been displayed. Try again, or return to the menu.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button className="button-primary" onClick={reset} type="button">Try again</button><Link className="button-secondary" href="/menu">Browse the menu</Link></div>
        </section>
      </main>
    </>
  );
}
