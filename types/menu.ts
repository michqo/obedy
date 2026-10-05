export type RestaurantId = "komin" | "nostalgia" | "dulak"
export interface Restaurant {
  id: RestaurantId
  name: string
  shortName: string
  area: string
  address: string
  url: string
  serviceHours?: string
}
export interface MenuItem {
  id: string
  name: string
  sourceText: string
  category: "soup" | "main"
  priceCents?: number
  priceKind: "exact" | "from"
  portion?: string
  allergens: number[]
  includesWater?: boolean
  includesSoup: boolean
  vegetarian: boolean
  weekly?: boolean
  description?: string
}
export interface DayMenu {
  date: string
  sourceLabel: string
  items: MenuItem[]
}
export interface RestaurantMenu extends Restaurant {
  days: DayMenu[]
  lastAttemptAt?: string
  lastSuccessAt?: string
  status: "ok" | "fetch-error" | "parse-error" | "pending"
  error?: string
  contentHash?: string
  parserVersion: number
}
