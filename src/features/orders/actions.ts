"use server";

import { revalidatePath } from "next/cache";

import {
  orderStatusUpdateSchema,
  OrderTransitionError,
} from "@/features/orders/order-management";
import { updateManagedOrderStatus } from "@/features/orders/order-service";
import { requirePermission } from "@/server/auth/authorization";
import { prismaAdminOrderRepository } from "@/server/orders/admin-order-repository";

export type OrderStatusActionState = {
  status?: "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function updateOrderStatusAction(
  _previousState: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  const user = await requirePermission("orders:update-status");
  const parsed = orderStatusUpdateSchema.safeParse({
    orderId: formData.get("orderId"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    requestedStatus: formData.get("requestedStatus"),
    cancellationReason: formData.get("cancellationReason") ?? undefined,
  });

  if (!parsed.success) {
    return {
      message: "Check the update details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateManagedOrderStatus(parsed.data, user, prismaAdminOrderRepository);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { status: "success", message: "Order status updated." };
  } catch (error) {
    if (error instanceof OrderTransitionError) {
      return { message: error.message };
    }
    return { message: "The order could not be updated. Refresh the page and try again." };
  }
}
