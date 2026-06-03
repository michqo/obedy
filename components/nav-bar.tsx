"use client"

import { useState, useEffect } from "react"
import { ThemeToggle } from "./ui/theme-toggle"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"

const FLOAT_IN = 80
const FLOAT_OUT = 40
const EASE = { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as const

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      setScrolled((prev) => {
        if (!prev && y > FLOAT_IN) return true
        if (prev && y < FLOAT_OUT) return false
        return prev
      })
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  return (
    <div className="sticky top-0 z-50 w-full">
      <motion.div
        initial={{
          opacity: 0,
          y: -12,
          width: "100%",
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
        }}
        animate={{
          opacity: 1,
          y: 0,
          width: scrolled ? "672px" : "100%",
          paddingLeft: scrolled ? 16 : 0,
          paddingRight: scrolled ? 16 : 0,
          paddingTop: scrolled ? 8 : 0,
        }}
        transition={{
          opacity: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
          y: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
          width: EASE,
          paddingLeft: EASE,
          paddingRight: EASE,
          paddingTop: EASE,
        }}
        style={{ maxWidth: "100%" }}
        className="mx-auto"
      >
        <motion.header
          animate={{ borderRadius: scrolled ? 12 : 0 }}
          transition={EASE}
          className={cn(
            "border-border/50 bg-background/80 backdrop-blur-md transition-[box-shadow,border] duration-500",
            scrolled
              ? "border shadow-lg shadow-black/8 dark:shadow-black/20"
              : "border-b"
          )}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <Link
                href="https://miqal.xyz"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                miqal
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/" className="transition-colors hover:text-primary">
                obedy
              </Link>
            </div>

            <div className="flex items-stretch gap-2">
              <ThemeToggle />
            </div>
          </div>
        </motion.header>
      </motion.div>
    </div>
  )
}
