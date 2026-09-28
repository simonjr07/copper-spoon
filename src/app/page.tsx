const foundationAreas = [
  "Customer ordering",
  "Restaurant operations",
  "Menu management",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20 sm:px-10 lg:px-16">
      <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-copper">
        Copper Spoon
      </p>
      <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-ink sm:text-7xl">
        A warmer way to order, from kitchen to table.
      </h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
        The product foundation is in place. Customer ordering and restaurant
        operations will be delivered in focused, tested increments.
      </p>

      <ul className="mt-12 grid gap-4 sm:grid-cols-3" aria-label="Planned product areas">
        {foundationAreas.map((area, index) => (
          <li
            key={area}
            className="rounded-2xl border border-line bg-surface p-6 shadow-[0_18px_50px_-34px_rgba(45,27,20,0.45)]"
          >
            <span className="text-sm font-medium text-copper">0{index + 1}</span>
            <p className="mt-7 text-lg font-medium text-ink">{area}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
