import {
  authorizeOrderTransition,
  OrderTransitionError,
  type ManagedOrderRole,
  type ManagedOrderStatus,
  type OrderStatusUpdateInput,
} from "@/features/orders/order-management";

export type CurrentOrderForUpdate = {
  id: string;
  status: ManagedOrderStatus;
  updatedAt: Date;
};

export type OrderManagementTransaction = {
  findCurrentOrder(orderId: string): Promise<CurrentOrderForUpdate | null>;
  updateIfCurrent(input: {
    orderId: string;
    fromStatus: ManagedOrderStatus;
    expectedDatabaseUpdatedAt: Date;
    toStatus: ManagedOrderStatus;
    changedAt: Date;
  }): Promise<boolean>;
  createStatusEvent(input: {
    orderId: string;
    fromStatus: ManagedOrderStatus;
    toStatus: ManagedOrderStatus;
    changedByUserId: string;
    note: string | null;
    changedAt: Date;
  }): Promise<void>;
};

export type OrderManagementRepository = {
  transaction<T>(work: (transaction: OrderManagementTransaction) => Promise<T>): Promise<T>;
};

export async function updateManagedOrderStatus(
  input: OrderStatusUpdateInput,
  actor: { id: string; role: ManagedOrderRole },
  repository: OrderManagementRepository,
  now: () => Date = () => new Date(),
) {
  try {
    return await repository.transaction(async (transaction) => {
      const order = await transaction.findCurrentOrder(input.orderId);
      if (!order) {
        throw new OrderTransitionError("ORDER_NOT_FOUND", "Order not found.");
      }

      if (order.updatedAt.toISOString() !== input.expectedUpdatedAt) {
        throw new OrderTransitionError(
          "STALE_ORDER",
          "This order changed since the page loaded. Review the latest status and try again.",
        );
      }

      const { note } = authorizeOrderTransition({
        role: actor.role,
        currentStatus: order.status,
        requestedStatus: input.requestedStatus,
        cancellationReason: input.cancellationReason,
      });
      const changedAt = now();
      const updated = await transaction.updateIfCurrent({
        orderId: order.id,
        fromStatus: order.status,
        expectedDatabaseUpdatedAt: order.updatedAt,
        toStatus: input.requestedStatus,
        changedAt,
      });

      if (!updated) {
        throw new OrderTransitionError(
          "STALE_ORDER",
          "This order changed while the update was being saved. Review the latest status and try again.",
        );
      }

      await transaction.createStatusEvent({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.requestedStatus,
        changedByUserId: actor.id,
        note,
        changedAt,
      });

      return { status: input.requestedStatus };
    });
  } catch (error) {
    if (isSerializationConflict(error)) {
      throw new OrderTransitionError(
        "STALE_ORDER",
        "This order changed while the update was being saved. Review the latest status and try again.",
      );
    }
    throw error;
  }
}

function isSerializationConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2034");
}
