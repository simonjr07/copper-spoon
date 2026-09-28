export default function MenuLoading() {
  return (
    <main aria-busy="true" className="mx-auto min-h-screen w-full max-w-7xl animate-pulse px-5 py-12 sm:px-8 lg:px-12" id="main-content" tabIndex={-1}>
      <div className="h-4 w-28 rounded-full bg-line" />
      <div className="mt-6 h-14 max-w-2xl rounded-2xl bg-line/70" />
      <div className="mt-4 h-6 max-w-xl rounded-xl bg-line/50" />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div className="h-96 rounded-[1.4rem] bg-line/55" key={item} />
        ))}
      </div>
      <p className="sr-only">Loading the menu</p>
    </main>
  );
}
