import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicHeader } from "@/components/public-header";
import { normalizePublicOrderCode } from "@/features/order-status/order-status";

export const metadata: Metadata = {
  title: "Track an order | Copper Spoon",
  description: "Open a fictional Copper Spoon order using its public order code.",
};

type TrackOrderPageProps = {
  searchParams: Promise<{ code?: string | string[] }>;
};

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const { code } = await searchParams;
  const submittedCode = Array.isArray(code) ? code[0] : code;
  const normalizedCode = submittedCode
    ? normalizePublicOrderCode(submittedCode)
    : null;

  if (normalizedCode) {
    redirect(`/order/${normalizedCode}`);
  }

  const hasInvalidCode = typeof submittedCode === "string";

  return (
    <>
      <PublicHeader />
      <main className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-5 py-16 sm:px-8">
        <section className="w-full rounded-[1.75rem] border border-[#3e2920]/10 bg-[#fffaf2] p-6 shadow-[0_28px_80px_-55px_rgba(45,27,20,0.75)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Order status
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
            Track your order
          </h1>
          <p className="mt-5 max-w-lg leading-7 text-muted">
            Enter the public code from your confirmation, such as CS-A7K4P2. No customer account is required.
          </p>

          <form className="mt-8" method="get">
            <label className="block text-sm font-medium text-ink" htmlFor="code">
              Public order code
            </label>
            <input
              aria-describedby={hasInvalidCode ? "code-error" : "code-help"}
              aria-invalid={hasInvalidCode}
              autoCapitalize="characters"
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 font-mono uppercase text-ink outline-none transition placeholder:font-sans placeholder:normal-case focus:border-copper focus:ring-2 focus:ring-copper/20"
              defaultValue={submittedCode ?? ""}
              id="code"
              inputMode="text"
              maxLength={15}
              name="code"
              placeholder="CS-A7K4P2"
              required
            />
            {hasInvalidCode ? (
              <p className="mt-2 text-sm text-red-700" id="code-error" role="alert">
                Enter CS- followed by 6–12 letters or numbers.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted" id="code-help">
                Codes are normalized to uppercase.
              </p>
            )}
            <button
              className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
              type="submit"
            >
              View order status
            </button>
          </form>

          <Link
            className="mt-5 flex justify-center rounded-md text-sm font-semibold text-ink underline decoration-copper/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
            href="/menu"
          >
            Browse the menu
          </Link>
        </section>
      </main>
    </>
  );
}
