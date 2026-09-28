"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createStaffUserAction, editStaffUserAction, resetStaffPasswordAction, setStaffUserStatusAction } from "@/features/staff-management/actions";
import type { StaffMutationState } from "@/features/staff-management/staff-management";

const initialState: StaffMutationState = {};
const inputClass = "rounded-xl border border-line bg-white px-3 py-2.5 text-ink";

export function StaffProfileForm({ user, isSelf = false }: { user?: { id: string; name: string; email: string; role: "ADMIN" | "STAFF" }; isSelf?: boolean }) {
  const [state, formAction, pending] = useActionState(user ? editStaffUserAction : createStaffUserAction, initialState);
  return <form action={formAction} className="grid gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">{user ? <input name="id" type="hidden" value={user.id} /> : null}<Field error={state.fieldErrors?.name} label="Name"><input autoComplete="name" className={inputClass} defaultValue={user?.name} maxLength={120} name="name" required /></Field><Field error={state.fieldErrors?.email} label="Email"><input autoComplete="email" className={inputClass} defaultValue={user?.email} maxLength={254} name="email" required type="email" /></Field><Field error={state.fieldErrors?.role} label="Role">{isSelf ? <><input name="role" type="hidden" value={user?.role} /><input className={`${inputClass} bg-stone-100`} disabled value={user?.role} /></> : <select className={inputClass} defaultValue={user?.role ?? "STAFF"} name="role"><option value="STAFF">Staff</option><option value="ADMIN">Admin</option></select>}</Field>{!user ? <Field error={state.fieldErrors?.password} label="Temporary password"><input autoComplete="new-password" className={inputClass} minLength={12} name="password" required type="password" /><span className="text-xs font-normal text-muted">At least 12 characters with a letter, number, and symbol; maximum 72 UTF-8 bytes.</span></Field> : null}{isSelf ? <p className="rounded-xl bg-background p-3 text-sm text-muted">You can update your name and email, but cannot change your own role or status.</p> : null}<FormResult state={state} successLink={!user && state.userId ? `/admin/users/${state.userId}/edit` : undefined} /><button className="w-fit rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : user ? "Save profile" : "Create account"}</button></form>;
}

export function StaffStatusForm({ id, status, isSelf }: { id: string; status: "ACTIVE" | "DISABLED"; isSelf: boolean }) {
  const [state, action, pending] = useActionState(setStaffUserStatusAction, initialState);
  if (isSelf) return <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">Your own account cannot be disabled from staff management.</p>;
  const nextStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  return <details className={`rounded-2xl border p-5 ${nextStatus === "DISABLED" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}><summary className="cursor-pointer font-semibold">{nextStatus === "DISABLED" ? "Disable account" : "Reactivate account"}</summary><form action={action} className="mt-4"><input name="id" type="hidden" value={id} /><input name="status" type="hidden" value={nextStatus} /><p className="text-sm">{nextStatus === "DISABLED" ? "The user will lose protected access on their next server-side authorization check." : "The user will be able to authenticate again using their current password."}</p><FormResult state={state} /><button className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${nextStatus === "DISABLED" ? "bg-red-800" : "bg-green-800"}`} disabled={pending} type="submit">{pending ? "Saving…" : `Confirm ${nextStatus === "DISABLED" ? "disable" : "reactivation"}`}</button></form></details>;
}

export function StaffPasswordResetForm({ id, isSelf }: { id: string; isSelf: boolean }) {
  const [state, action, pending] = useActionState(resetStaffPasswordAction, initialState);
  if (isSelf) return null;
  return <details className="rounded-2xl border border-line bg-surface p-5"><summary className="cursor-pointer font-semibold">Replace password</summary><form action={action} className="mt-4 grid gap-3"><input name="id" type="hidden" value={id} /><Field error={state.fieldErrors?.password} label="New temporary password"><input autoComplete="new-password" className={inputClass} minLength={12} name="password" required type="password" /></Field><p className="text-sm text-muted">The existing password is never displayed. Share the replacement through an approved private channel.</p><FormResult state={state} /><button className="w-fit rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Replacing…" : "Replace password"}</button></form></details>;
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-medium">{label}{children}{error?.map((message) => <span className="text-xs text-red-700" key={message}>{message}</span>)}</label>; }
function FormResult({ state, successLink }: { state: StaffMutationState; successLink?: string }) { if (!state.message) return null; return <p aria-live="polite" className={`text-sm ${state.status === "success" ? "text-green-800" : "text-red-800"}`}>{state.message}{successLink ? <> <Link className="font-semibold underline" href={successLink}>Edit account</Link></> : null}</p>; }

