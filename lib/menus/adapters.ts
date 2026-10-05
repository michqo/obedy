import * as cheerio from "cheerio"
import {
  parseMenuDate,
  searchable,
  shiftDate,
  todayInBratislava,
} from "@/lib/discovery"
import { normalizeItem } from "./normalize"
import type { DayMenu, MenuItem, RestaurantId } from "@/types/menu"

export class MenuParseError extends Error {}
const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value ? [value] : []

export function parseKomin(html: string): DayMenu[] {
  const $ = cheerio.load(html)
  const headingText = $("h3").text().replace(/\s+/g, " ")
  const price = headingText.match(/Jednotná cena\s*(\d+[.,]\d{2})\s*€/i)?.[1]
  const includesSoup = /V cene Menu je Polievka/i.test(headingText)
  const days: DayMenu[] = []
  const weekly: MenuItem[] = []
  $("h2.elementor-heading-title").each((_, element) => {
    const title = $(element).text().trim()
    const date = parseMenuDate(title)
    const isWeekly = /Menu týždňa/i.test(title)
    if (!date && !isWeekly) return
    const container = $(element)
      .closest(".elementor-widget-heading")
      .nextAll(".elementor-widget-text-editor")
      .first()
      .clone()
    // HTML formatting whitespace is not a menu boundary. Only paragraphs and
    // explicit line breaks separate dishes.
    container
      .find("*")
      .addBack()
      .contents()
      .each((_, node) => {
        if (node.type === "text") node.data = node.data.replace(/\s+/g, " ")
      })
    container.find("br").replaceWith("\n")
    container.find("p,li").each((_, paragraph) => {
      $(paragraph).append("\n")
    })
    const lines = container
      .text()
      .replace(/(?<!\d)(\d\s*:)/g, "\n$1")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    const items = lines
      .map((line) =>
        normalizeItem(line, {
          price: /€|EUR|\d[.,]\d+\s*l\b|\d+\s*ml\b/i.test(line)
            ? undefined
            : price,
          includesWater: /2\s*dcl\s+vody/i.test(headingText),
          includesSoup,
          weekly: isWeekly,
        })
      )
      .filter((item): item is MenuItem => item !== null)
    if (isWeekly)
      weekly.push(...items.filter((item) => item.category === "main"))
    else if (date) days.push({ date, sourceLabel: title, items })
  })
  const latest = days
    .filter(
      (day) => ![0, 6].includes(new Date(`${day.date}T12:00:00Z`).getUTCDay())
    )
    .map((day) => day.date)
    .sort()
    .at(-1)
  if (latest) {
    const weekday = new Date(`${latest}T12:00:00Z`).getUTCDay()
    const start = shiftDate(latest, 1 - weekday)
    for (const day of days)
      if (day.date >= start && day.date <= shiftDate(start, 4))
        day.items.push(...weekly)
  }
  return days
}
function findRestaurant(value: unknown): Record<string, unknown> | null {
  for (const node of array(value)) {
    const object = record(node)
    if (!object) continue
    if (array(object["@type"]).includes("Restaurant") && object.hasMenu)
      return object
    const nested = findRestaurant(object["@graph"])
    if (nested) return nested
  }
  return null
}
export function parseNostalgia(html: string): DayMenu[] {
  const $ = cheerio.load(html)
  const priceKinds = new Map<string, "exact" | "from">()
  $(".m-item__title").each((_, element) => {
    const title = searchable($(element).text())
    const display = $(element)
      .closest(".m-item")
      .find(".add-button")
      .text()
      .trim()
    if (display)
      priceKinds.set(title, /^od\b/i.test(display) ? "from" : "exact")
  })
  let restaurant: Record<string, unknown> | null = null
  $("script[type='application/ld+json']").each((_, element) => {
    try {
      restaurant ??= findRestaurant(JSON.parse($(element).text()) as unknown)
    } catch {
      /* Unrelated scripts may be malformed. */
    }
  })
  if (!restaurant)
    throw new MenuParseError("Restaurant structured menu missing")
  const menu = record((restaurant as Record<string, unknown>).hasMenu)
  return array(menu?.hasMenuSection).flatMap((sectionValue) => {
    const section = record(sectionValue)
    const label = typeof section?.name === "string" ? section.name : ""
    const date = parseMenuDate(label)
    if (!date) return []
    const items = array(section?.hasMenuItem).flatMap((value) => {
      const item = record(value)
      if (typeof item?.name !== "string") return []
      const offer = record(array(item.offers)[0])
      const normalized = normalizeItem(item.name, {
        priceKind: priceKinds.get(searchable(item.name)),
        price:
          offer?.priceCurrency === "EUR" || !offer?.priceCurrency
            ? offer?.price
            : undefined,
        description:
          typeof item.description === "string" ? item.description : undefined,
      })
      return normalized ? [normalized] : []
    })
    return [{ date, sourceLabel: label, items }]
  })
}
export function parseDulak(html: string): DayMenu[] {
  const $ = cheerio.load(html)
  if (/Security Verification|Just a moment|captcha/i.test($("title").text()))
    throw new MenuParseError("Source returned verification page")
  const days: DayMenu[] = []
  $(".dnesne_menu, .ostatne_menu").each((_, element) => {
    const label = $(element).find("h2").text().replace(/\s+/g, " ").trim()
    const date = parseMenuDate(label)
    if (!date) return
    const items: MenuItem[] = []
    let weekly = false
    $(element)
      .find(".jedlo_polozka")
      .each((_, itemElement) => {
        const text = $(itemElement)
          .find(".left")
          .text()
          .replace(/\s+/g, " ")
          .trim()
        if (/Stála ponuka na tento týždeň/i.test(text)) {
          weekly = true
          return
        }
        if (/^VEGE VARIANT:/i.test(text)) return
        const item = normalizeItem(text, {
          price: $(itemElement).find(".right b").text(),
          trailingAllergens: true,
          weekly,
        })
        if (item) items.push(item)
      })
    days.push({ date, sourceLabel: label, items })
  })
  return days
}
export function parseSource(
  id: RestaurantId,
  html: string,
  now = new Date()
): DayMenu[] {
  const days = {
    komin: parseKomin,
    nostalgia: parseNostalgia,
    dulak: parseDulak,
  }[id](html)
  const today = todayInBratislava(now)
  const normalized = days.filter(
    (day) =>
      day.date >= shiftDate(today, -35) &&
      day.date <= shiftDate(today, 35) &&
      day.items.some((item) => item.category === "main")
  )
  const dates = new Set<string>()
  for (const day of normalized) {
    if (dates.has(day.date))
      throw new MenuParseError("Duplicate dated sections")
    if (day.items.length > 50) throw new MenuParseError("Unexpected item count")
    dates.add(day.date)
  }
  if (!normalized.length) throw new MenuParseError("No valid dated menus found")
  return normalized.sort((a, b) => a.date.localeCompare(b.date))
}
