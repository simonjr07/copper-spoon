import "server-only";

import type { OrderCreationRepository } from "@/features/checkout/order-service";
import { prisma } from "@/server/db/prisma";

export const prismaOrderRepository: OrderCreationRepository = {
  transaction(work) {
    return prisma.$transaction(
      async (database) =>
        work({
          findOrderByCheckoutToken(checkoutToken) {
            return database.order.findUnique({
              where: { checkoutToken },
              select: { publicCode: true },
            });
          },
          getSettings() {
            return database.restaurantSettings.findUnique({
              where: { id: "restaurant-settings" },
              select: {
                currency: true,
                pickupEnabled: true,
                deliveryEnabled: true,
                payOnPickupEnabled: true,
                payOnDeliveryEnabled: true,
                demoCardEnabled: true,
                deliveryFeeCents: true,
                minimumDeliveryOrderCents: true,
              },
            });
          },
          getCatalogItems(ids) {
            return database.menuItem.findMany({
              where: { id: { in: ids } },
              select: {
                id: true,
                name: true,
                priceCents: true,
                currency: true,
                isPublished: true,
                isAvailable: true,
                isArchived: true,
                category: { select: { isPublished: true } },
                optionGroups: {
                  select: {
                    id: true,
                    name: true,
                    selectionType: true,
                    minSelections: true,
                    maxSelections: true,
                    isActive: true,
                    options: {
                      select: {
                        id: true,
                        name: true,
                        priceAdjustmentCents: true,
                        isAvailable: true,
                      },
                    },
                  },
                },
              },
            });
          },
          async createOrder(prepared, publicCode) {
            return database.order.create({
              data: {
                checkoutToken: prepared.checkoutToken,
                publicCode,
                status: prepared.status,
                fulfilmentType: prepared.fulfilmentType,
                paymentMethod: prepared.paymentMethod,
                paymentStatus: prepared.paymentStatus,
                customerName: prepared.customerName,
                customerEmail: prepared.customerEmail,
                customerPhone: prepared.customerPhone,
                deliveryAddressLine1: prepared.deliveryAddressLine1,
                deliveryAddressLine2: prepared.deliveryAddressLine2,
                deliveryCity: prepared.deliveryCity,
                deliveryRegion: prepared.deliveryRegion,
                deliveryPostalCode: prepared.deliveryPostalCode,
                deliveryCountry: prepared.deliveryCountry,
                currency: prepared.currency,
                subtotalCents: prepared.subtotalCents,
                deliveryFeeCents: prepared.deliveryFeeCents,
                totalCents: prepared.totalCents,
                items: {
                  create: prepared.items.map((item) => ({
                    menuItemId: item.menuItemId,
                    itemNameSnapshot: item.itemNameSnapshot,
                    unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
                    quantity: item.quantity,
                    optionsTotalCentsSnapshot: item.optionsTotalCentsSnapshot,
                    lineTotalCents: item.lineTotalCents,
                    selectedOptions: {
                      create: item.selectedOptions.map((option) => ({
                        menuItemOptionId: option.menuItemOptionId,
                        optionGroupNameSnapshot: option.optionGroupNameSnapshot,
                        optionNameSnapshot: option.optionNameSnapshot,
                        priceAdjustmentCentsSnapshot:
                          option.priceAdjustmentCentsSnapshot,
                      })),
                    },
                  })),
                },
                statusEvents: {
                  create: prepared.initialStatusEvent,
                },
              },
              select: { publicCode: true },
            });
          },
        }),
      { isolationLevel: "Serializable" },
    );
  },
};

export async function getCheckoutSettings() {
  return prisma.restaurantSettings.findUnique({
    where: { id: "restaurant-settings" },
    select: {
      currency: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      payOnPickupEnabled: true,
      payOnDeliveryEnabled: true,
      demoCardEnabled: true,
      deliveryFeeCents: true,
      minimumDeliveryOrderCents: true,
    },
  });
}
