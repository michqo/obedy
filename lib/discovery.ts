import type { MenuItem, RestaurantMenu } from "@/types/menu"

export const PARSER_VERSION = 1
const weekdays = [
  "nedela",
  "pondelok",
  "utorok",
  "streda",
  "stvrtok",
  "piatok",
  "sobota",
]
export function searchable(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}
export function todayInBratislava(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bratislava",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  )
}
export function parseMenuDate(label: string) {
  const match = label.match(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/)
  if (!match) return null
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
  if (!validDate(iso)) return null
  const normalized = searchable(label)
  const namedDay = weekdays.findIndex((day) => normalized.includes(day))
  if (namedDay >= 0 && new Date(`${iso}T12:00:00Z`).getUTCDay() !== namedDay)
    return null
  return iso
}
export function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}
export function weekDates(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  const monday = shiftDate(date, weekday === 0 ? -6 : 1 - weekday)
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i))
}
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  }
) {
  return new Intl.DateTimeFormat("sk-SK", {
    ...options,
    timeZone: "Europe/Bratislava",
  }).format(new Date(`${date}T12:00:00Z`))
}
export function formatPrice(item: Pick<MenuItem, "priceCents" | "priceKind">) {
  if (item.priceCents === undefined) return "Cena neuvedená"
  return `${item.priceKind === "from" ? "od " : ""}${new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(item.priceCents / 100)}`
}
export function parsePrice(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined
  const text = String(value)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/(?:€|EUR)$/i, "")
    .replace(/^od/i, "")
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return undefined
  const cents = Math.round(Number(text) * 100)
  return cents > 0 && cents <= 100000 ? cents : undefined
}
export function stableId(text: string) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}
export function defaultMenuDate(menus: RestaurantMenu[], today: string) {
  const dates = [
    ...new Set(menus.flatMap((menu) => menu.days.map((day) => day.date))),
  ].sort()
  if (dates.includes(today)) return today
  // On weekends (or before today's publication), open the nearest published
  // lunch. The selected date is always visible; historical menus keep their date.
  return (
    dates.find((date) => date > today && date <= shiftDate(today, 7)) ??
    dates
      .filter((date) => date < today && date >= shiftDate(today, -7))
      .at(-1) ??
    today
  )
}
