"use server";

import { revalidatePath } from "next/cache";

import {
  createStaffUserSchema,
  editStaffUserSchema,
  resetStaffPasswordSchema,
  setStaffStatusSchema,
  StaffManagementError,
  type StaffMutationState,
} from "@/features/staff-management/staff-management";
import {
  createManagedUser,
  editManagedUser,
  resetManagedUserPassword,
  setManagedUserStatus,
} from "@/features/staff-management/staff-service";
import { requirePermission } from "@/server/auth/authorization";
import { hashPassword } from "@/server/auth/password";
import { prismaStaffManagementRepository } from "@/server/staff/staff-repository";

export async function createStaffUserAction(
  _state: StaffMutationState,
  formData: FormData,
): Promise<StaffMutationState> {
  const actor = await requirePermission("staff:manage");
  const parsed = createStaffUserSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), role: formData.get("role"),
  });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  const passwordHash = await hashPassword(parsed.data.password);
  return perform(async () => {
    const user = await createManagedUser({ name: parsed.data.name, email: parsed.data.email, passwordHash, role: parsed.data.role }, actor, prismaStaffManagementRepository);
    return user.id;
  }, "Staff account created.");
}

export async function editStaffUserAction(
  _state: StaffMutationState,
  formData: FormData,
): Promise<StaffMutationState> {
  const actor = await requirePermission("staff:manage");
  const parsed = editStaffUserSchema.safeParse({ id: formData.get("id"), name: formData.get("name"), email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  return perform(async () => (await editManagedUser(parsed.data, actor, prismaStaffManagementRepository)).id, "Staff profile saved.");
}

export async function setStaffUserStatusAction(
  _state: StaffMutationState,
  formData: FormData,
): Promise<StaffMutationState> {
  const actor = await requirePermission("staff:manage");
  const parsed = setStaffStatusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  return perform(async () => (await setManagedUserStatus(parsed.data, actor, prismaStaffManagementRepository)).id, parsed.data.status === "ACTIVE" ? "Account reactivated." : "Account disabled.");
}

export async function resetStaffPasswordAction(
  _state: StaffMutationState,
  formData: FormData,
): Promise<StaffMutationState> {
  const actor = await requirePermission("staff:manage");
  const parsed = resetStaffPasswordSchema.safeParse({ id: formData.get("id"), password: formData.get("password") });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  const passwordHash = await hashPassword(parsed.data.password);
  return perform(async () => {
    await resetManagedUserPassword({ id: parsed.data.id, passwordHash }, actor, prismaStaffManagementRepository);
    return parsed.data.id;
  }, "Password replaced. Share it through an approved private channel; it will not be shown again.");
}

async function perform(mutation: () => Promise<string>, message: string): Promise<StaffMutationState> {
  try {
    const userId = await mutation();
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}/edit`);
    return { status: "success", message, userId };
  } catch (error) {
    if (error instanceof StaffManagementError) return { message: error.message };
    return { message: "The staff account change could not be saved. Refresh and try again." };
  }
}

function invalid(fieldErrors: Record<string, string[] | undefined>): StaffMutationState {
  return { message: "Check the highlighted fields and try again.", fieldErrors };
}
