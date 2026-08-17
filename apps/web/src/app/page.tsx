export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 shadow-sm">
        <p className="mb-3 text-sm font-semibold tracking-wide text-[var(--brand)] uppercase">
          OpsDesk
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Operações de suporte em um só lugar.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
          A fundação do produto está pronta. Os próximos módulos serão entregues
          de forma incremental.
        </p>
      </section>
    </main>
  );
}
