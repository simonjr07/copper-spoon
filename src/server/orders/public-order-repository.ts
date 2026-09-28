import "server-only";

import {
  toCustomerOrder,
  type CustomerOrderReader,
} from "@/features/order-status/order-status";
import { prisma } from "@/server/db/prisma";

export const publicOrderRepository: CustomerOrderReader = {
  async findByPublicCode(publicCode) {
    const [order, settings] = await Promise.all([
      prisma.order.findUnique({
        where: { publicCode },
        select: {
          publicCode: true,
          status: true,
          fulfilmentType: true,
          paymentMethod: true,
          paymentStatus: true,
          currency: true,
          subtotalCents: true,
          deliveryFeeCents: true,
          totalCents: true,
          placedAt: true,
          items: {
            orderBy: { createdAt: "asc" },
            select: {
              itemNameSnapshot: true,
              unitPriceCentsSnapshot: true,
              optionsTotalCentsSnapshot: true,
              quantity: true,
              lineTotalCents: true,
              selectedOptions: {
                orderBy: { createdAt: "asc" },
                select: {
                  optionGroupNameSnapshot: true,
                  optionNameSnapshot: true,
                  priceAdjustmentCentsSnapshot: true,
                },
              },
            },
          },
          statusEvents: {
            orderBy: { createdAt: "asc" },
            select: {
              toStatus: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.restaurantSettings.findUnique({
        where: { id: "restaurant-settings" },
        select: { timezone: true },
      }),
    ]);

    return order
      ? toCustomerOrder(order, settings?.timezone ?? "UTC")
      : null;
  },
};
