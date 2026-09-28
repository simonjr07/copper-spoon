export default function LoadingOrders() {
  return <main aria-busy="true" aria-label="Loading orders" className="admin-container animate-pulse"><div className="h-28 rounded-2xl bg-line/60" /><div className="mt-10 h-36 rounded-2xl bg-line/60" /><div className="mt-4 h-28 rounded-2xl bg-line/60" /><p className="sr-only">Loading orders</p></main>;
}
