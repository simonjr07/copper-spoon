import {
  enforceLastActiveAdmin,
  enforceSelfRoleProtection,
  enforceSelfStatusProtection,
  requireAdminActor,
  StaffManagementError,
  staffPersistenceError,
  type SafeManagedUser,
  type StaffActor,
  type StaffRole,
  type StaffStatus,
} from "@/features/staff-management/staff-management";

export type StaffManagementTransaction = {
  findUser(id: string): Promise<SafeManagedUser | null>;
  countActiveAdmins(): Promise<number>;
  updateProfile(input: { id: string; name: string; email: string; role: StaffRole }): Promise<SafeManagedUser>;
  updateStatus(input: { id: string; status: StaffStatus }): Promise<SafeManagedUser>;
};

export type StaffManagementRepository = {
  create(input: { name: string; email: string; passwordHash: string; role: StaffRole }): Promise<SafeManagedUser>;
  transaction<T>(work: (transaction: StaffManagementTransaction) => Promise<T>): Promise<T>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
};

export async function createManagedUser(input: { name: string; email: string; passwordHash: string; role: StaffRole }, actor: StaffActor, repository: StaffManagementRepository) {
  requireAdminActor(actor);
  try { return await repository.create(input); }
  catch (error) { throw staffPersistenceError(error) ?? error; }
}

export async function editManagedUser(input: { id: string; name: string; email: string; role: StaffRole }, actor: StaffActor, repository: StaffManagementRepository) {
  requireAdminActor(actor);
  try {
    return await repository.transaction(async (transaction) => {
      const target = await transaction.findUser(input.id);
      if (!target) throw new StaffManagementError("NOT_FOUND", "The staff account no longer exists.");
      enforceSelfRoleProtection(actor.id, target, input.role);
      if (target.role === "ADMIN" && target.status === "ACTIVE" && input.role !== "ADMIN") {
        enforceLastActiveAdmin(target, { role: input.role, status: target.status }, await transaction.countActiveAdmins());
      }
      return transaction.updateProfile(input);
    });
  } catch (error) { throw staffPersistenceError(error) ?? error; }
}

export async function setManagedUserStatus(input: { id: string; status: StaffStatus }, actor: StaffActor, repository: StaffManagementRepository) {
  requireAdminActor(actor);
  enforceSelfStatusProtection(actor.id, input.id, input.status);
  try {
    return await repository.transaction(async (transaction) => {
      const target = await transaction.findUser(input.id);
      if (!target) throw new StaffManagementError("NOT_FOUND", "The staff account no longer exists.");
      if (target.role === "ADMIN" && target.status === "ACTIVE" && input.status === "DISABLED") {
        enforceLastActiveAdmin(target, { role: target.role, status: input.status }, await transaction.countActiveAdmins());
      }
      return transaction.updateStatus(input);
    });
  } catch (error) { throw staffPersistenceError(error) ?? error; }
}

export async function resetManagedUserPassword(input: { id: string; passwordHash: string }, actor: StaffActor, repository: StaffManagementRepository) {
  requireAdminActor(actor);
  if (actor.id === input.id) throw new StaffManagementError("SELF_PASSWORD_RESET", "Use the controlled account-recovery process to change your own password.");
  try { await repository.updatePassword(input.id, input.passwordHash); }
  catch (error) { throw staffPersistenceError(error) ?? error; }
}
