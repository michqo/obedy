import { createHash } from "node:crypto"
import { PARSER_VERSION, todayInBratislava } from "@/lib/discovery"
import { RESTAURANTS } from "@/lib/restaurants"
import { MenuParseError, parseSource } from "@/lib/menus/adapters"
import { readSnapshot, writeSnapshot } from "@/lib/menus/repository"
import { menuSourceRequest } from "@/lib/menus/source-request"
import type { Restaurant, RestaurantMenu } from "@/types/menu"

const inFlight = new Map<string, Promise<RestaurantMenu>>()
const lastRefresh = new Map<string, number>()
const COOLDOWN = 5 * 60 * 1000
const DELIVERY_REFRESH_INTERVAL = 30 * 60 * 1000

export function emptyMenu(restaurant: Restaurant): RestaurantMenu {
  return {
    ...restaurant,
    days: [],
    status: "pending",
    parserVersion: PARSER_VERSION,
  }
}
export function snapshotFromHtml(
  restaurant: Restaurant,
  html: string,
  checkedAt = new Date()
): RestaurantMenu {
  if (html.length > 2000000) throw new MenuParseError("Source too large")
  const days = parseSource(restaurant.id, html, checkedAt)
  return {
    ...restaurant,
    days,
    status: "ok",
    parserVersion: PARSER_VERSION,
    lastAttemptAt: checkedAt.toISOString(),
    lastSuccessAt: checkedAt.toISOString(),
    contentHash: createHash("sha256")
      .update(JSON.stringify(days))
      .digest("hex"),
  }
}

export async function ingestRestaurant(
  restaurant: Restaurant,
  previous: RestaurantMenu | null,
  fetcher: typeof fetch = fetch
): Promise<RestaurantMenu> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const { url, init } = menuSourceRequest(restaurant)
    const response = await fetcher(url, init)
    if (!response.ok) throw new Error(`Source HTTP ${response.status}`)
    const html = await response.text()
    return snapshotFromHtml(restaurant, html, new Date(lastAttemptAt))
  } catch (error) {
    const parseFailure = error instanceof MenuParseError
    console.error(
      `[obedy:${restaurant.id}] ${parseFailure ? "parse" : "fetch"} failed`
    )
    return {
      ...emptyMenu(restaurant),
      ...previous,
      ...restaurant,
      lastAttemptAt,
      status: parseFailure ? "parse-error" : "fetch-error",
      error: parseFailure
        ? "Zo zdroja sa nepodarilo overiť platné denné menu."
        : "Zdroj menu sa nepodarilo načítať.",
    }
  }
}

async function storedMenu(restaurant: Restaurant) {
  try {
    return await readSnapshot(restaurant.id)
  } catch {
    return {
      ...emptyMenu(restaurant),
      status: "fetch-error" as const,
      error: "Uložené menu je dočasne nedostupné.",
    }
  }
}

async function refreshRestaurant(
  restaurant: Restaurant
): Promise<RestaurantMenu> {
  const running = inFlight.get(restaurant.id)
  if (running) return running
  const task = (async () => {
    const previous = await storedMenu(restaurant)
    const latest = Math.max(
      lastRefresh.get(restaurant.id) ?? 0,
      Date.parse(previous?.lastAttemptAt ?? "") || 0
    )
    if (previous && Date.now() - latest < COOLDOWN) return previous
    lastRefresh.set(restaurant.id, Date.now())
    const next = await ingestRestaurant(restaurant, previous)
    try {
      await writeSnapshot(next)
    } catch {
      console.error(`[obedy:${restaurant.id}] snapshot persistence failed`)
      return {
        ...next,
        error: "Menu sa načítalo, ale nepodarilo sa uložiť aktualizáciu.",
      }
    }
    return next
  })()
  inFlight.set(restaurant.id, task)
  try {
    return await task
  } finally {
    inFlight.delete(restaurant.id)
  }
}

export async function refreshAllMenus() {
  return Promise.all(RESTAURANTS.map(refreshRestaurant))
}

export async function fetchAllMenus(): Promise<RestaurantMenu[]> {
  const menus = await Promise.all(
    RESTAURANTS.map(async (restaurant) => ({
      ...emptyMenu(restaurant),
      ...(await storedMenu(restaurant)),
      ...restaurant,
    }))
  )
  // A fresh install and an unscheduled local preview must remain useful.
  // Refresh only stale attempts; cooldown/coalescing also covers the public button.
  if (
    menus.some(
      (menu) =>
        !menu.lastAttemptAt ||
        Date.now() - Date.parse(menu.lastAttemptAt) > DELIVERY_REFRESH_INTERVAL
    )
  )
    return refreshAllMenus()
  return menus
}

// Capture the request clock outside React rendering and pass it as data.
export async function fetchMenuContext() {
  const referenceTime = Date.now()
  return {
    menus: await fetchAllMenus(),
    referenceTime,
    today: todayInBratislava(new Date(referenceTime)),
  }
}
