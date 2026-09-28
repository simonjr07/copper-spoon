import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getActiveUser } from "@/server/auth/authorization";

export const metadata: Metadata = {
  title: "Staff sign in | Copper Spoon",
  description: "Sign in to the private Copper Spoon restaurant workspace.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getActiveUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-[0_30px_80px_-45px_rgba(45,27,20,0.55)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-copper">
          Copper Spoon
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink">
          Restaurant workspace
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Sign in with an active staff account. Customer ordering does not
          require an account.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
