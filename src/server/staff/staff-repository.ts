import "server-only";

import type { StaffManagementRepository } from "@/features/staff-management/staff-service";
import { prisma } from "@/server/db/prisma";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} as const;

export function listManagedUsers() {
  return prisma.user.findMany({
    orderBy: [{ status: "asc" }, { role: "asc" }, { name: "asc" }],
    select: { ...safeUserSelect, createdAt: true, lastLoginAt: true },
  });
}

export function getManagedUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { ...safeUserSelect, createdAt: true, lastLoginAt: true },
  });
}

export const prismaStaffManagementRepository: StaffManagementRepository = {
  create(input) {
    return prisma.user.create({
      data: { ...input, status: "ACTIVE" },
      select: safeUserSelect,
    });
  },
  transaction(work) {
    return prisma.$transaction(
      async (database) => work({
        findUser(id) {
          return database.user.findUnique({ where: { id }, select: safeUserSelect });
        },
        countActiveAdmins() {
          return database.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
        },
        updateProfile(input) {
          return database.user.update({
            where: { id: input.id },
            data: { name: input.name, email: input.email, role: input.role },
            select: safeUserSelect,
          });
        },
        updateStatus(input) {
          return database.user.update({
            where: { id: input.id },
            data: { status: input.status },
            select: safeUserSelect,
          });
        },
      }),
      { isolationLevel: "Serializable" },
    );
  },
  async updatePassword(id, passwordHash) {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    });
  },
};

