import type { Restaurant, RestaurantId } from "@/types/menu"

// Deliberately a fixed shortlist. Addresses verified on 2026-10-04.
export const RESTAURANTS: Restaurant[] = [
  {
    id: "komin",
    name: "Pivovar Komín",
    shortName: "Komín",
    area: "Ružinov",
    address: "Miletičova 17/A, Bratislava",
    url: "https://www.pivovarkomin.sk/denne-menu/",
    serviceHours: "11:00 – 14:00",
  },
  {
    id: "nostalgia",
    name: "Nostalgia Nivy",
    shortName: "Nostalgia",
    area: "Nivy",
    address: "Súťažná 18, Bratislava",
    url: "https://www.nostalgianivy.sk/",
  },
  {
    id: "dulak",
    name: "Dulak Košická",
    shortName: "Dulak",
    area: "Nivy",
    address: "Košická 39, Bratislava",
    url: "https://restauracie.sme.sk/restauracia/dulak-kosicka_11298-ruzinov_2980/denne-menu",
  },
]
export function restaurantById(id: string) {
  return RESTAURANTS.find((restaurant) => restaurant.id === id)
}
export function directionsUrl(id: RestaurantId) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurantById(id)!.address)}`
}
