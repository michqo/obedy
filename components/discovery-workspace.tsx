"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, RefreshCw } from "lucide-react"
import {
  defaultMenuDate,
  formatDate,
  shiftDate,
  validDate,
} from "@/lib/discovery"
import { CheckedTime, MenuCard } from "@/components/menu-card"
import type { RestaurantMenu } from "@/types/menu"

export function DiscoveryWorkspace({
  initialMenus,
  initialDate,
  today,
  referenceTime,
}: {
  initialMenus: RestaurantMenu[]
  initialDate: string
  today: string
  referenceTime: number
}) {
  const [menus, setMenus] = useState(initialMenus)
  const [date, setDate] = useState(initialDate)
  const [now, setNow] = useState(referenceTime)
  const [message, setMessage] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const sync = () => {
      const value =
        new URLSearchParams(window.location.search).get("date") ?? ""
      setDate(validDate(value) ? value : defaultMenuDate(initialMenus, today))
    }
    window.addEventListener("popstate", sync)
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => {
      window.removeEventListener("popstate", sync)
      window.clearInterval(timer)
    }
  }, [initialMenus, today])

  function selectDate(value: string) {
    if (!validDate(value)) return
    setDate(value)
    setMessage("")
    window.history.replaceState(null, "", `?date=${value}`)
  }

  async function refresh() {
    setRefreshing(true)
    setMessage("")
    try {
      const response = await fetch("/api/menus", {
        method: "POST",
        cache: "no-store",
      })
      if (!response.ok) throw new Error("Refresh failed")
      const updated = (await response.json()) as RestaurantMenu[]
      setMenus(updated)
      setNow(Date.now())
      setMessage(
        updated.some((menu) => menu.status !== "ok")
          ? "Niektoré zdroje sú nedostupné. Posledné uložené menu zostáva zobrazené."
          : "Menu je aktuálne."
      )
    } catch {
      setMessage(
        "Menu sa nepodarilo aktualizovať. Uložená ponuka zostáva dostupná."
      )
    } finally {
      setRefreshing(false)
    }
  }

  const dates = [
    ...new Set(menus.flatMap((menu) => menu.days.map((day) => day.date))),
  ].sort()
  const availableCount = menus.filter((menu) =>
    menu.days.some((day) => day.date === date)
  ).length
  const nextAvailable = dates.find((value) => value > date)

  return (
    <main className="obedy-workspace">
      <header className="workspace-intro">
        <p className="eyebrow">OBEDY / NIVY & RUŽINOV</p>
        <h1>
          Kam <span>na obed?</span>
        </h1>
        <p className="intro-copy">
          Komín, Nostalgia a Dulak. Denné menu na jednom mieste.
        </p>
      </header>

      <section className="date-section" aria-label="Výber dňa">
        <div className="date-heading">
          <div>
            <h2>{formatDate(date)}</h2>
            <p className="date-context">
              {date === today
                ? "Dnešná ponuka"
                : date > today
                  ? "Budúca ponuka"
                  : "Archív menu"}
            </p>
          </div>
          <div className="date-actions">
            <button
              className="icon-control"
              aria-label="Predchádzajúci deň"
              onClick={() => selectDate(shiftDate(date, -1))}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <label className="date-picker">
              <span className="sr-only">Vybrať dátum</span>
              <input
                type="date"
                value={date}
                onChange={(event) => selectDate(event.target.value)}
              />
            </label>
            <button
              className="icon-control"
              aria-label="Nasledujúci deň"
              onClick={() => selectDate(shiftDate(date, 1))}
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            {date !== today && (
              <button
                className="text-control"
                onClick={() => selectDate(today)}
              >
                Dnes
              </button>
            )}
          </div>
        </div>
      </section>

      {availableCount === 0 && (
        <div className="day-notice">
          <p>
            {[0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())
              ? "Na víkend tu nemáme denné menu."
              : "Na tento deň zatiaľ nemáme zverejnené menu."}
          </p>
          {nextAvailable && (
            <button
              className="text-link"
              onClick={() => selectDate(nextAvailable)}
            >
              Menu na{" "}
              {formatDate(nextAvailable, { day: "numeric", month: "numeric" })}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="menu-results">
        {menus.map((menu) => (
          <MenuCard
            key={menu.id}
            menu={menu}
            date={date}
            referenceTime={now}
            onDate={selectDate}
          />
        ))}
      </div>

      <div className="update-row">
        <p>Ceny a dostupnosť potvrdí reštaurácia.</p>
        <button
          className="text-control"
          disabled={refreshing}
          onClick={refresh}
        >
          <RefreshCw
            className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {refreshing ? "Kontrolujem…" : "Aktualizovať menu"}
        </button>
      </div>
      <p className="feedback-message" role="status">
        {message}
      </p>
      <details className="source-health">
        <summary>Posledná kontrola zdrojov</summary>
        <ul>
          {menus.map((menu) => (
            <li key={menu.id}>
              <span>{menu.shortName}</span>
              <span>
                {menu.status === "ok"
                  ? "Načítané"
                  : menu.status === "pending"
                    ? "Čaká na načítanie"
                    : "Posledná kontrola zlyhala"}{" "}
                · <CheckedTime value={menu.lastAttemptAt} />
              </span>
            </li>
          ))}
        </ul>
      </details>
      <footer className="workspace-footer">
        <span>Malý okruh. Dobrý obed.</span>
        <Link href="https://miqal.xyz" className="text-link">
          Súčasť /miqal <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </footer>
    </main>
  )
}
