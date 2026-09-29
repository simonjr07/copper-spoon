"use server";

import {
  CheckoutError,
  checkoutInputSchema,
} from "@/features/checkout/checkout";
import { createAuthoritativeOrder } from "@/features/checkout/order-service";
import { prismaOrderRepository } from "@/server/orders/order-repository";
import { logOperationalError } from "@/server/observability/log";
import { checkRequestRateLimit } from "@/server/security/rate-limit";

export type CheckoutActionState = {
  status?: "success";
  publicCode?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitOrderAction(
  _previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  try {
    const rateLimit = await checkRequestRateLimit("CHECKOUT");

    if (!rateLimit.allowed) {
      return {
        message: "Too many order attempts. Please wait a few minutes and try again.",
      };
    }
  } catch (error) {
    logOperationalError("checkout.rate_limit_unavailable", error);
    return {
      message: "Checkout is temporarily unavailable. Please try again later.",
    };
  }

  let cart: unknown = null;

  try {
    cart = JSON.parse(String(formData.get("cart") ?? "null"));
  } catch {
    return {
      message: "Your cart could not be read. Refresh the page and try again.",
      fieldErrors: { cart: ["The cart payload is invalid."] },
    };
  }

  const parsed = checkoutInputSchema.safeParse({
    submissionToken: formData.get("submissionToken"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    fulfilmentType: formData.get("fulfilmentType"),
    paymentMethod: formData.get("paymentMethod"),
    deliveryAddressLine1: formData.get("deliveryAddressLine1"),
    deliveryAddressLine2: formData.get("deliveryAddressLine2"),
    deliveryCity: formData.get("deliveryCity"),
    deliveryRegion: formData.get("deliveryRegion"),
    deliveryPostalCode: formData.get("deliveryPostalCode"),
    deliveryCountry: formData.get("deliveryCountry"),
    cart,
  });

  if (!parsed.success) {
    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const order = await createAuthoritativeOrder(
      parsed.data,
      prismaOrderRepository,
    );

    return {
      status: "success",
      publicCode: order.publicCode,
    };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return {
        message: error.message,
        fieldErrors: { cart: [error.message] },
      };
    }

    logOperationalError("checkout.order_creation_failed", error);

    return {
      message: "We could not place your order. Nothing was charged; please try again.",
    };
  }
}
