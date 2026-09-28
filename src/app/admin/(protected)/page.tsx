import Link from "next/link";

import { AdminHeader } from "@/components/admin-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  dashboardStatuses,
  formatDashboardDay,
  formatDashboardTime,
  type DashboardStatus,
} from "@/features/analytics/dashboard-analytics";
import { getOrderStatusLabel } from "@/features/orders/order-management";
import { formatMoney } from "@/lib/money";
import { getDashboardAnalytics } from "@/server/analytics/dashboard-repository";
import { requirePermission } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requirePermission("analytics:read");
  const analytics = await getDashboardAnalytics();
  const maxStatus = Math.max(1, ...Object.values(analytics.statusCounts));
  const maxActivity = Math.max(1, ...analytics.activity.map((day) => day.count));

  return (
    <main className="admin-container">
      <AdminHeader user={user} />
      <section className="py-8" id="workspace-content" tabIndex={-1}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Restaurant operations</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Today at Copper Spoon</h1>
            <p className="mt-3 text-muted">Fresh order activity grouped in {analytics.timezone}.</p>
          </div>
          <Link className="button-primary w-fit" href="/admin/orders">Open order queue</Link>
        </div>

        <section aria-label="Order metrics" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Total orders" value={analytics.totalOrders} />
          <MetricCard label="Orders today" value={analytics.ordersToday} />
          <MetricCard label="Waiting" value={analytics.statusCounts.PENDING} />
          <MetricCard label="Ready now" value={analytics.statusCounts.READY} />
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-2">
          <DashboardSection title="Current status distribution">
            <div className="space-y-4">
              {dashboardStatuses.map((status) => <BarRow key={status} label={getOrderStatusLabel(status)} maximum={maxStatus} tone={statusTone(status)} value={analytics.statusCounts[status]} />)}
            </div>
          </DashboardSection>
          <DashboardSection title="Last 7 days">
            <div aria-label="Daily order counts" className="grid grid-cols-7 items-end gap-1.5 pt-4 sm:gap-2">
              {analytics.activity.map((day) => (
                <div className="grid min-w-0 gap-2 text-center" key={day.day}>
                  <span className="text-sm font-semibold text-ink">{day.count}</span>
                  <div aria-hidden="true" className="mx-auto w-full max-w-10 rounded-t-lg bg-copper/75" style={{ height: `${Math.max(4, (day.count / maxActivity) * 112)}px` }} />
                  <span className="truncate text-[0.65rem] leading-tight text-muted sm:text-[0.7rem]">{formatDashboardDay(day.day)}</span>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>

        <div className="mt-7 grid gap-7 xl:grid-cols-[1.4fr_0.8fr]">
          <DashboardSection action={<Link className="text-sm font-semibold text-copper hover:underline" href="/admin/orders">View all</Link>} title="Recent orders">
            {analytics.recentOrders.length ? (
              <div className="divide-y divide-line">
                {analytics.recentOrders.map((order) => (
                  <Link className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1fr)_auto_auto]" href={order.detailHref} key={order.publicCode}>
                    <div className="min-w-0"><p className="font-mono text-sm font-semibold text-copper">{order.publicCode}</p><p className="mt-1 text-sm text-muted">{order.fulfilmentType === "PICKUP" ? "Pickup" : "Delivery"} · {formatDashboardTime(order.placedAt, analytics.timezone)}</p></div>
                    <OrderStatusBadge status={order.status} />
                    <p className="font-semibold sm:text-right">{formatMoney(order.totalCents, order.currency)}</p>
                  </Link>
                ))}
              </div>
            ) : <EmptyState message="New orders will appear here as soon as they are placed." />}
          </DashboardSection>

          <div className="space-y-7">
            <DashboardSection title="Fulfilment mix"><div className="grid grid-cols-2 gap-3"><MetricCard compact label="Pickup" value={analytics.fulfilment.PICKUP} /><MetricCard compact label="Delivery" value={analytics.fulfilment.DELIVERY} /></div></DashboardSection>
            <DashboardSection title="Popular items">
              <p className="mb-4 text-xs leading-5 text-muted">Non-cancelled orders, grouped by historical item snapshot.</p>
              {analytics.popularItems.length ? (
                <ol className="space-y-3">
                  {analytics.popularItems.map((item, index) => <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center" key={item.itemName}><span className="text-sm font-semibold text-copper">{index + 1}</span><span className="min-w-0 font-medium">{item.itemName}</span><span className="col-start-2 text-sm text-muted sm:col-start-auto">{item.quantity} sold · {item.orderCount} orders</span></li>)}
                </ol>
              ) : <EmptyState message="Popular items will appear after non-cancelled orders are placed." />}
            </DashboardSection>
          </div>
        </div>

        <section aria-label="Workspace shortcuts" className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink description="Review and progress current orders." href="/admin/orders" label="Orders" />
          <QuickLink description="View catalog publication and availability." href="/admin/menu" label="Menu" />
          {user.role === "ADMIN" ? <QuickLink description="Manage staff account access." href="/admin/users" label="Staff" /> : null}
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  return <article className={`surface-card ${compact ? "p-4" : "p-4 sm:p-5"}`}><p className="text-xs leading-5 text-muted sm:text-sm">{label}</p><p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl sm:text-4xl"} font-semibold tracking-[-0.04em]`}>{value.toLocaleString("en-US")}</p></article>;
}

function DashboardSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="surface-card p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{title}</h2>{action}</div>{children}</section>;
}

function BarRow({ label, value, maximum, tone }: { label: string; value: number; maximum: number; tone: string }) {
  return <div><div className="mb-1.5 flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-line/60"><div aria-hidden="true" className={`h-full rounded-full ${tone}`} style={{ width: `${(value / maximum) * 100}%` }} /></div></div>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-line bg-background/50 p-5 text-center text-sm leading-6 text-muted">{message}</p>;
}

function QuickLink({ label, description, href }: { label: string; description: string; href: string }) {
  return <Link className="surface-card p-5 transition hover:-translate-y-0.5 hover:border-copper hover:shadow-md" href={href}><h2 className="font-semibold">{label}</h2><p className="mt-1 text-sm leading-6 text-muted">{description}</p></Link>;
}

function statusTone(status: DashboardStatus) {
  const tones: Record<DashboardStatus, string> = { PENDING: "bg-amber-500", CONFIRMED: "bg-blue-500", PREPARING: "bg-orange-500", READY: "bg-green-600", COMPLETED: "bg-stone-500", CANCELLED: "bg-red-500" };
  return tones[status];
}
