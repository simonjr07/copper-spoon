"use client";

import { useActionState } from "react";

import {
  updateOrderStatusAction,
  type OrderStatusActionState,
} from "@/features/orders/actions";
import { getOrderStatusLabel, type ManagedOrderStatus } from "@/features/orders/order-management";

const initialState: OrderStatusActionState = {};

export function OrderStatusActionForm({
  orderId,
  expectedUpdatedAt,
  requestedStatus,
  cancellation = false,
}: {
  orderId: string;
  expectedUpdatedAt: string;
  requestedStatus: ManagedOrderStatus;
  cancellation?: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateOrderStatusAction,
    initialState,
  );

  const fields = (
    <>
      <input name="orderId" type="hidden" value={orderId} />
      <input name="expectedUpdatedAt" type="hidden" value={expectedUpdatedAt} />
      <input name="requestedStatus" type="hidden" value={requestedStatus} />
    </>
  );

  if (cancellation) {
    return (
      <details className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <summary className="cursor-pointer font-semibold text-red-900">
          Cancel order
        </summary>
        <form action={action} className="mt-4 space-y-3">
          {fields}
          <p className="text-sm leading-6 text-red-900">
            Cancellation is final and visible to the customer. State the operational reason.
          </p>
          <label className="block text-sm font-medium text-red-950" htmlFor="cancellationReason">
            Cancellation reason
          </label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-ink"
            id="cancellationReason"
            maxLength={500}
            name="cancellationReason"
            required
          />
          <ActionMessage state={state} />
          <button
            className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </form>
      </details>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-4">
      {fields}
      <p className="text-sm text-muted">Move this order to the next workflow stage.</p>
      <ActionMessage state={state} />
      <button
        className="mt-3 rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Updating…" : `Mark ${getOrderStatusLabel(requestedStatus)}`}
      </button>
    </form>
  );
}

function ActionMessage({ state }: { state: OrderStatusActionState }) {
  if (!state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`mt-3 text-sm ${state.status === "success" ? "text-green-800" : "text-red-800"}`}
    >
      {state.message}
    </p>
  );
}

