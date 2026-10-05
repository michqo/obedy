import { parsePrice, stableId } from "@/lib/discovery"
import type { MenuItem } from "@/types/menu"

export function normalizeItem(
  sourceText: string,
  options: {
    price?: unknown
    includesWater?: boolean
    priceKind?: "exact" | "from"
    includesSoup?: boolean
    vegetarian?: boolean
    weekly?: boolean
    description?: string
    trailingAllergens?: boolean
  } = {}
): MenuItem | null {
  const raw = sourceText.replace(/\s+/g, " ").trim()
  if (!raw || raw.length > 2000) return null
  const embeddedPrice = raw.match(/(?:od\s*)?(\d+[.,]\d{2})\s*(?:€|EUR)\s*$/i)
  const priceCents = parsePrice(options.price) ?? parsePrice(embeddedPrice?.[1])
  let portion = raw.match(
    /\b\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)*\s*(?:g|ml|l)\b/i
  )?.[0]
  const allergenMatch =
    raw.match(/(?:\/\s*)?A:\s*([\d,\s]+)(?:\/|$)/i) ??
    raw.match(/\(([\d,\s]+)\)/) ??
    (options.trailingAllergens
      ? raw.match(/\s+(\d{1,2}(?:,\s*\d{1,2})*)$/)
      : null)
  const allergens = allergenMatch
    ? allergenMatch[1]
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((n) => n >= 1 && n <= 14)
    : []
  const includesSoup = options.includesSoup ?? /\+\s*polievka/i.test(raw)
  const category = /(?:polievka\s*:|\d[.,]\d+\s*l\b|\d+\s*ml\b)/i.test(raw)
    ? "soup"
    : "main"
  let name = raw.replace(
    /^(?:[IVX]+\.|\d+\s*:|(?:Prémium|Vegetariánske)\s+menu\s*:|Polievka\s*:)\s*/i,
    ""
  )
  if (embeddedPrice) name = name.replace(embeddedPrice[0], "")
  if (allergenMatch) name = name.replace(allergenMatch[0], "")
  name = name.replace(/\+\s*polievka/gi, "")
  // Some source portions omit their unit; retain the published numbers without guessing one.
  portion ??= name
    .match(/\b\d+(?:\/\d+)+\s*\/?\s*$/)?.[0]
    .replace(/\s*\/\s*$/, "")
    .trim()
  if (portion) name = name.replace(portion, "")
  name = name
    .replace(/\+\s*polievka/gi, "")
    .replace(/\s*\/\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!name) return null
  return {
    id: stableId(raw),
    name,
    sourceText: raw,
    category,
    priceCents,
    priceKind:
      options.priceKind ??
      (/\bod\s*\d/i.test(`${options.price ?? ""} ${embeddedPrice?.[0] ?? ""}`)
        ? "from"
        : "exact"),
    portion,
    allergens: [...new Set(allergens)],
    includesWater: category === "main" && options.includesWater,
    includesSoup: category === "main" && includesSoup,
    vegetarian: options.vegetarian ?? /vegetariánske\s+menu/i.test(raw),
    weekly: options.weekly,
    description: options.description,
  }
}
