export default function Loading() {
  return (
    <main
      className="obedy-workspace"
      aria-busy="true"
      aria-label="Načítavanie menu"
    >
      <div className="h-44 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 h-28 animate-pulse rounded-lg bg-muted" />
      <p className="mt-8 text-muted-foreground" role="status">
        Pripravujeme váš obedový prehľad…
      </p>
    </main>
  )
}
