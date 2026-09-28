import {
  getOrderStatusLabel,
  type ManagedOrderStatus,
} from "@/features/orders/order-management";

const tones: Record<ManagedOrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-800",
  PREPARING: "border-orange-200 bg-orange-50 text-orange-900",
  READY: "border-green-200 bg-green-50 text-green-800",
  COMPLETED: "border-stone-200 bg-stone-100 text-stone-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

export function OrderStatusBadge({ status }: { status: ManagedOrderStatus }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${tones[status]}`}>
      {getOrderStatusLabel(status)}
    </span>
  );
}
