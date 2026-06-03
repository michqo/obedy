export interface MenuItem {
  name: string
  price?: string
  description?: string
  allergens?: string
}

export interface DayMenu {
  date: string
  items: MenuItem[]
}

export interface RestaurantMenu {
  id: string
  name: string
  url: string
  days: DayMenu[]
  error?: string
}
