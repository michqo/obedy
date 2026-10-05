import Link from "next/link"

import { ThemeToggle } from "./ui/theme-toggle"

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center font-mono text-sm font-semibold tracking-tight">
          <Link
            href="https://miqal.xyz"
            className="inline-flex min-h-11 items-center rounded-sm hover:text-primary"
          >
            <span className="text-primary">/</span>miqal
          </Link>
          <span className="px-1.5 text-muted-foreground">/</span>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-sm hover:text-primary"
          >
            obedy
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
