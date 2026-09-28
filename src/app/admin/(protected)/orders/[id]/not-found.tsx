import Link from "next/link";

export default function OrderNotFound() {
  return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Order unavailable</p><h1 className="mt-3 text-4xl font-semibold">We could not find that order.</h1><p className="mt-3 text-muted">It may have been removed or the link may be incorrect.</p><Link className="mx-auto mt-6 rounded-xl bg-copper px-5 py-3 font-semibold text-white" href="/admin/orders">Return to order queue</Link></main>;
}
