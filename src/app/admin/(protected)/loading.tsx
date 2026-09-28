export default function LoadingWorkspace() {
  return (
    <main aria-busy="true" aria-label="Loading restaurant workspace" className="admin-container animate-pulse">
      <div className="h-28 rounded-2xl border border-line bg-surface/70" />
      <div className="mt-10 h-5 w-36 rounded-full bg-line" />
      <div className="mt-4 h-12 max-w-lg rounded-xl bg-line/70" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div className="h-28 rounded-2xl bg-line/60" key={index} />)}
      </div>
      <div className="mt-7 grid gap-7 lg:grid-cols-2"><div className="h-72 rounded-2xl bg-line/55" /><div className="h-72 rounded-2xl bg-line/55" /></div>
      <p className="sr-only">Loading restaurant workspace</p>
    </main>
  );
}
