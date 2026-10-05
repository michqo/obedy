import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { PARSER_VERSION, validDate } from "@/lib/discovery"
import { RESTAURANTS } from "@/lib/restaurants"
import type { RestaurantMenu } from "@/types/menu"

const storageRoot = () =>
  process.env.MENU_DATA_DIR ?? path.join(process.cwd(), ".cache", "menus")
const memory = new Map<string, RestaurantMenu>()
const memoryKey = (id: string) => path.join(storageRoot(), id)

export function isSnapshot(value: unknown): value is RestaurantMenu {
  if (!value || typeof value !== "object") return false
  const candidate = value as RestaurantMenu
  return (
    RESTAURANTS.some((restaurant) => restaurant.id === candidate.id) &&
    candidate.parserVersion === PARSER_VERSION &&
    ["ok", "pending", "fetch-error", "parse-error"].includes(
      candidate.status
    ) &&
    [candidate.lastSuccessAt, candidate.lastAttemptAt].every(
      (date) =>
        date === undefined ||
        (typeof date === "string" && !Number.isNaN(Date.parse(date)))
    ) &&
    Array.isArray(candidate.days) &&
    (candidate.status !== "ok" || candidate.days.length > 0) &&
    new Set(candidate.days.map((day) => day.date)).size ===
      candidate.days.length &&
    candidate.days.every(
      (day) =>
        validDate(day.date) &&
        typeof day.sourceLabel === "string" &&
        Array.isArray(day.items) &&
        day.items.length > 0 &&
        day.items.length <= 50 &&
        day.items.some((item) => item.category === "main") &&
        day.items.every(
          (item) =>
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.sourceText === "string" &&
            ["main", "soup"].includes(item.category) &&
            ["from", "exact"].includes(item.priceKind) &&
            [item.description, item.portion].every(
              (text) => text === undefined || typeof text === "string"
            ) &&
            (item.includesWater === undefined ||
              typeof item.includesWater === "boolean") &&
            typeof item.includesSoup === "boolean" &&
            typeof item.vegetarian === "boolean" &&
            Array.isArray(item.allergens) &&
            item.allergens.every(
              (n) => Number.isInteger(n) && n >= 1 && n <= 14
            ) &&
            (item.priceCents === undefined ||
              (Number.isInteger(item.priceCents) &&
                item.priceCents > 0 &&
                item.priceCents <= 100000))
        )
    )
  )
}

export async function readSnapshot(id: string): Promise<RestaurantMenu | null> {
  try {
    const value: unknown = JSON.parse(
      await readFile(path.join(storageRoot(), `${id}.json`), "utf8")
    )
    if (isSnapshot(value) && value.id === id) {
      memory.set(memoryKey(id), value)
      return value
    }
    throw new Error("Invalid stored menu")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("Snapshot read unavailable", id)
    return memory.get(memoryKey(id)) ?? null
  }
}

export async function writeSnapshot(snapshot: RestaurantMenu) {
  if (!isSnapshot(snapshot)) throw new Error("Refusing invalid snapshot")
  memory.set(memoryKey(snapshot.id), snapshot)
  await mkdir(storageRoot(), { recursive: true })
  const destination = path.join(storageRoot(), `${snapshot.id}.json`)
  const temporary = `${destination}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(snapshot), { mode: 0o600 })
  await rename(temporary, destination)
}
