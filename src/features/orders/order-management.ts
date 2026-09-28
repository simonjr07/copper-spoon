import { z } from "zod";

export const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ManagedOrderStatus = (typeof orderStatuses)[number];
export type ManagedOrderRole = "ADMIN" | "STAFF";

const normalTransitions: Partial<Record<ManagedOrderStatus, ManagedOrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  requestedStatus: z.enum(orderStatuses),
  cancellationReason: z.string().trim().max(500).optional(),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export class OrderTransitionError extends Error {
  constructor(
    public readonly code:
      | "ORDER_NOT_FOUND"
      | "STALE_ORDER"
      | "INVALID_TRANSITION"
      | "CANCELLATION_FORBIDDEN"
      | "CANCELLATION_REASON_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

export function getNormalNextStatus(status: ManagedOrderStatus) {
  return normalTransitions[status] ?? null;
}

export function canCancelOrder(
  role: ManagedOrderRole,
  status: ManagedOrderStatus,
) {
  if (role === "ADMIN") {
    return status === "PENDING" || status === "CONFIRMED" || status === "PREPARING";
  }

  return status === "PENDING" || status === "CONFIRMED";
}

export function authorizeOrderTransition({
  role,
  currentStatus,
  requestedStatus,
  cancellationReason,
}: {
  role: ManagedOrderRole;
  currentStatus: ManagedOrderStatus;
  requestedStatus: ManagedOrderStatus;
  cancellationReason?: string;
}) {
  if (requestedStatus === "CANCELLED") {
    if (!canCancelOrder(role, currentStatus)) {
      throw new OrderTransitionError(
        "CANCELLATION_FORBIDDEN",
        "This order can no longer be cancelled by your role.",
      );
    }

    const reason = cancellationReason?.trim();
    if (!reason) {
      throw new OrderTransitionError(
        "CANCELLATION_REASON_REQUIRED",
        "Enter a cancellation reason.",
      );
    }

    return { note: reason };
  }

  if (getNormalNextStatus(currentStatus) !== requestedStatus) {
    throw new OrderTransitionError(
      "INVALID_TRANSITION",
      "That status change is not allowed from the order's current status.",
    );
  }

  return { note: null };
}

export const orderQueueFilterSchema = z.object({
  view: z
    .enum(["OPEN", "ALL", ...orderStatuses])
    .catch("OPEN"),
  fulfilment: z.enum(["ALL", "PICKUP", "DELIVERY"]).catch("ALL"),
  q: z.string().trim().max(120).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export function getOrderStatusLabel(status: ManagedOrderStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

