"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  archiveMenuItemAction,
  saveCategoryAction,
  saveMenuItemAction,
  saveMenuOptionAction,
  saveOptionGroupAction,
} from "@/features/menu-management/actions";
import type { MenuMutationState } from "@/features/menu-management/menu-management";

const initialState: MenuMutationState = {};
const inputClass = "rounded-xl border border-line bg-white px-3 py-2.5 text-ink";

export function CategoryForm({ category }: { category?: { id: string; name: string; slug: string; description: string | null; sortOrder: number; isPublished: boolean } }) {
  const [state, action, pending] = useActionState(saveCategoryAction, initialState);
  return <form action={action} className="grid gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
    {category ? <input name="id" type="hidden" value={category.id} /> : null}
    <Field error={state.fieldErrors?.name} label="Name"><input className={inputClass} defaultValue={category?.name} maxLength={100} name="name" required /></Field>
    <Field error={state.fieldErrors?.slug} label="Slug"><input className={inputClass} defaultValue={category?.slug} maxLength={100} name="slug" placeholder="small-plates" required /></Field>
    <Field error={state.fieldErrors?.description} label="Description"><textarea className={`${inputClass} min-h-24`} defaultValue={category?.description ?? ""} maxLength={500} name="description" /></Field>
    <Field error={state.fieldErrors?.sortOrder} label="Sort order"><input className={inputClass} defaultValue={category?.sortOrder ?? 0} min={0} name="sortOrder" required type="number" /></Field>
    <Check defaultChecked={category?.isPublished} label="Published publicly" name="isPublished" />
    <FormResult state={state} successLink={state.entityId ? `/admin/menu/categories/${state.entityId}/edit` : undefined} />
    <Submit pending={pending} text="Save category" />
  </form>;
}

export function MenuItemForm({ item, categories }: { item?: { id: string; categoryId: string; name: string; slug: string; description: string; priceCents: number; imageUrl: string | null; sortOrder: number; isPublished: boolean; isAvailable: boolean; isArchived: boolean }; categories: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(saveMenuItemAction, initialState);
  return <form action={action} className="grid gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
    {item ? <input name="id" type="hidden" value={item.id} /> : null}
    <Field error={state.fieldErrors?.categoryId} label="Category"><select className={inputClass} defaultValue={item?.categoryId} name="categoryId" required><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
    <Field error={state.fieldErrors?.name} label="Name"><input className={inputClass} defaultValue={item?.name} maxLength={120} name="name" required /></Field>
    <Field error={state.fieldErrors?.slug} label="Slug"><input className={inputClass} defaultValue={item?.slug} maxLength={120} name="slug" placeholder="copper-spoon-burger" required /></Field>
    <Field error={state.fieldErrors?.description} label="Public description"><textarea className={`${inputClass} min-h-28`} defaultValue={item?.description} maxLength={1000} name="description" required /></Field>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field error={state.fieldErrors?.price} label="Base price"><div className="flex items-center rounded-xl border border-line bg-white"><span className="pl-3 text-muted">$</span><input className="min-w-0 flex-1 bg-transparent px-2 py-2.5 outline-none" defaultValue={item ? (item.priceCents / 100).toFixed(2) : "0.00"} inputMode="decimal" name="price" required /></div></Field>
      <Field error={state.fieldErrors?.sortOrder} label="Sort order"><input className={inputClass} defaultValue={item?.sortOrder ?? 0} min={0} name="sortOrder" required type="number" /></Field>
    </div>
    <Field error={state.fieldErrors?.imageUrl} label="Local image path"><input className={inputClass} defaultValue={item?.imageUrl ?? ""} name="imageUrl" placeholder="/images/menu/dish.webp" /></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Check defaultChecked={item?.isPublished} label="Published" name="isPublished" /><Check defaultChecked={item ? item.isAvailable : true} label="Available" name="isAvailable" /></div>
    <p className="text-sm text-muted">Sold-out items remain visible when published. Use the separate confirmed action below to archive an item.</p>
    <FormResult state={state} successLink={!item && state.entityId ? `/admin/menu/items/${state.entityId}/edit` : undefined} />
    <Submit pending={pending} text="Save menu item" />
  </form>;
}

export function OptionGroupForm({ menuItemId, group }: { menuItemId: string; group?: { id: string; name: string; selectionType: "SINGLE" | "MULTIPLE"; minSelections: number; maxSelections: number; sortOrder: number; isActive: boolean } }) {
  const [state, action, pending] = useActionState(saveOptionGroupAction, initialState);
  return <form action={action} className="grid gap-3 rounded-xl border border-line bg-white/60 p-4">
    <input name="menuItemId" type="hidden" value={menuItemId} />{group ? <input name="id" type="hidden" value={group.id} /> : null}
    <div className="grid gap-3 md:grid-cols-[1fr_10rem_7rem_7rem_7rem]"><Field error={state.fieldErrors?.name} label="Group name"><input className={inputClass} defaultValue={group?.name} name="name" required /></Field><Field error={state.fieldErrors?.selectionType} label="Selection"><select className={inputClass} defaultValue={group?.selectionType ?? "SINGLE"} name="selectionType"><option value="SINGLE">Single</option><option value="MULTIPLE">Multiple</option></select></Field><Field error={state.fieldErrors?.minSelections} label="Minimum"><input className={inputClass} defaultValue={group?.minSelections ?? 0} min={0} name="minSelections" type="number" /></Field><Field error={state.fieldErrors?.maxSelections} label="Maximum"><input className={inputClass} defaultValue={group?.maxSelections ?? 1} min={1} name="maxSelections" type="number" /></Field><Field error={state.fieldErrors?.sortOrder} label="Order"><input className={inputClass} defaultValue={group?.sortOrder ?? 0} min={0} name="sortOrder" type="number" /></Field></div>
    <Check defaultChecked={group?.isActive} label="Active publicly" name="isActive" /><p className="text-xs text-muted">Create new groups inactive, add their choices, then activate them.</p><FormResult state={state} /><Submit pending={pending} text={group ? "Update group" : "Add group"} />
  </form>;
}

export function MenuOptionForm({ menuItemId, optionGroupId, option }: { menuItemId: string; optionGroupId: string; option?: { id: string; name: string; priceAdjustmentCents: number; sortOrder: number; isAvailable: boolean } }) {
  const [state, action, pending] = useActionState(saveMenuOptionAction, initialState);
  return <form action={action} className="grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-[1fr_10rem_7rem_auto] md:items-end">
    <input name="menuItemId" type="hidden" value={menuItemId} /><input name="optionGroupId" type="hidden" value={optionGroupId} />{option ? <input name="id" type="hidden" value={option.id} /> : null}
    <Field error={state.fieldErrors?.name} label={option ? "Option" : "New option"}><input className={inputClass} defaultValue={option?.name} name="name" required /></Field>
    <Field error={state.fieldErrors?.priceAdjustment} label="Price adjustment"><input className={inputClass} defaultValue={option ? (option.priceAdjustmentCents / 100).toFixed(2) : "0.00"} inputMode="decimal" name="priceAdjustment" required /></Field>
    <Field error={state.fieldErrors?.sortOrder} label="Order"><input className={inputClass} defaultValue={option?.sortOrder ?? 0} min={0} name="sortOrder" type="number" /></Field>
    <div className="grid gap-2"><Check defaultChecked={option ? option.isAvailable : true} label="Available" name="isAvailable" /><Submit pending={pending} text={option ? "Update" : "Add"} /></div>
    <div className="md:col-span-4"><FormResult state={state} /></div>
  </form>;
}

export function ArchiveItemForm({ id, archived }: { id: string; archived: boolean }) {
  const [state, action, pending] = useActionState(archiveMenuItemAction, initialState);
  if (archived) return <p className="rounded-xl bg-background p-4 text-sm text-muted">This item is archived and absent from the public menu.</p>;
  return <details className="rounded-2xl border border-red-200 bg-red-50 p-5"><summary className="cursor-pointer font-semibold text-red-900">Archive menu item</summary><form action={action} className="mt-4"><input name="id" type="hidden" value={id} /><p className="text-sm text-red-900">This unpublishes the item. Historical order snapshots remain unchanged.</p><FormResult state={state} /><button className="mt-3 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Archiving…" : "Confirm archive"}</button></form></details>;
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-medium text-ink">{label}{children}{error?.map((message) => <span className="text-xs text-red-700" key={message}>{message}</span>)}</label>; }
function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) { return <label className="flex items-center gap-2 text-sm font-medium"><input defaultChecked={defaultChecked} name={name} type="checkbox" />{label}</label>; }
function Submit({ pending, text }: { pending: boolean; text: string }) { return <button className="w-fit rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : text}</button>; }
function FormResult({ state, successLink }: { state: MenuMutationState; successLink?: string }) { if (!state.message) return null; return <p aria-live="polite" className={`text-sm ${state.status === "success" ? "text-green-800" : "text-red-800"}`}>{state.message}{successLink ? <> <Link className="font-semibold underline" href={successLink}>Continue editing</Link></> : null}</p>; }
