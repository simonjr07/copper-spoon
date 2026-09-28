import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { OrderManagementRepository } from "@/features/orders/order-service";
import type { ManagedOrderStatus } from "@/features/orders/order-management";
import { prisma } from "@/server/db/prisma";

export const ADMIN_ORDER_PAGE_SIZE = 20;

export type AdminOrderQueueInput = {
  view: "OPEN" | "ALL" | ManagedOrderStatus;
  fulfilment: "ALL" | "PICKUP" | "DELIVERY";
  q: string;
  page: number;
};

export async function listAdminOrders(input: AdminOrderQueueInput) {
  const where: Prisma.OrderWhereInput = {
    ...(input.view === "OPEN"
      ? { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] } }
      : input.view === "ALL"
        ? {}
        : { status: input.view }),
    ...(input.fulfilment === "ALL" ? {} : { fulfilmentType: input.fulfilment }),
    ...(input.q
      ? {
          OR: [
            { publicCode: { contains: input.q, mode: "insensitive" } },
            { customerName: { contains: input.q, mode: "insensitive" } },
            { customerEmail: { contains: input.q, mode: "insensitive" } },
            { customerPhone: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: input.view === "OPEN" ? { placedAt: "asc" } : { placedAt: "desc" },
      skip: (input.page - 1) * ADMIN_ORDER_PAGE_SIZE,
      take: ADMIN_ORDER_PAGE_SIZE,
      select: {
        id: true,
        publicCode: true,
        status: true,
        fulfilmentType: true,
        placedAt: true,
        customerName: true,
        totalCents: true,
        currency: true,
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function getAdminOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      publicCode: true,
      status: true,
      fulfilmentType: true,
      paymentMethod: true,
      paymentStatus: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      deliveryAddressLine1: true,
      deliveryAddressLine2: true,
      deliveryCity: true,
      deliveryRegion: true,
      deliveryPostalCode: true,
      deliveryCountry: true,
      customerNote: true,
      currency: true,
      subtotalCents: true,
      deliveryFeeCents: true,
      totalCents: true,
      placedAt: true,
      completedAt: true,
      cancelledAt: true,
      updatedAt: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          itemNameSnapshot: true,
          unitPriceCentsSnapshot: true,
          optionsTotalCentsSnapshot: true,
          quantity: true,
          lineTotalCents: true,
          customerNote: true,
          selectedOptions: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              optionGroupNameSnapshot: true,
              optionNameSnapshot: true,
              priceAdjustmentCentsSnapshot: true,
            },
          },
        },
      },
      statusEvents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          note: true,
          createdAt: true,
          changedBy: { select: { name: true, role: true } },
        },
      },
    },
  });
}

export const prismaAdminOrderRepository: OrderManagementRepository = {
  transaction(work) {
    return prisma.$transaction(
      async (database) =>
        work({
          findCurrentOrder(orderId) {
            return database.order.findUnique({
              where: { id: orderId },
              select: { id: true, status: true, updatedAt: true },
            });
          },
          async updateIfCurrent(input) {
            const result = await database.order.updateMany({
              where: {
                id: input.orderId,
                status: input.fromStatus,
                updatedAt: input.expectedDatabaseUpdatedAt,
              },
              data: {
                status: input.toStatus,
                ...(input.toStatus === "COMPLETED"
                  ? { completedAt: input.changedAt }
                  : {}),
                ...(input.toStatus === "CANCELLED"
                  ? { cancelledAt: input.changedAt }
                  : {}),
              },
            });
            return result.count === 1;
          },
          async createStatusEvent(input) {
            await database.orderStatusEvent.create({
              data: {
                orderId: input.orderId,
                fromStatus: input.fromStatus,
                toStatus: input.toStatus,
                changedByUserId: input.changedByUserId,
                note: input.note,
                createdAt: input.changedAt,
              },
            });
          },
        }),
      { isolationLevel: "Serializable" },
    );
  },
};
