"use client"
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="obedy-workspace">
      <h1 className="text-3xl font-semibold">Prehľad sa nepodarilo načítať.</h1>
      <p className="my-5 text-muted-foreground">
        Skúste ho načítať znova. Reštaurácie nájdete aj priamo na ich stránkach.
      </p>
      <button className="primary-control" onClick={reset}>
        Skúsiť znova
      </button>
      <div className="mt-6 flex flex-wrap gap-5">
        <a className="text-link" href="https://www.pivovarkomin.sk/denne-menu/">
          Komín
        </a>
        <a className="text-link" href="https://www.nostalgianivy.sk/">
          Nostalgia
        </a>
        <a
          className="text-link"
          href="https://restauracie.sme.sk/restauracia/dulak-kosicka_11298-ruzinov_2980/denne-menu"
        >
          Dulak
        </a>
      </div>
    </main>
  )
}
