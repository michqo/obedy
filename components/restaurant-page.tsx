import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MenuCard } from "@/components/menu-card"
import { formatDate, validDate } from "@/lib/discovery"
import { restaurantById } from "@/lib/restaurants"
import { fetchMenuContext } from "@/lib/scraper"
import type { Metadata } from "next"
import type { RestaurantId } from "@/types/menu"
export function restaurantMetadata(id: RestaurantId): Metadata {
  const restaurant = restaurantById(id)!
  return {
    title: `${restaurant.name} — Obedy / miqal`,
    description: `Dátumované obedové menu ${restaurant.name}, ${restaurant.address}.`,
  }
}
export default async function RestaurantPage({
  id,
  searchParams,
}: {
  id: RestaurantId
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { menus, today, referenceTime } = await fetchMenuContext()
  const menu = menus.find((restaurant) => restaurant.id === id)!
  const query = await searchParams
  const date =
    typeof query.date === "string" && validDate(query.date) ? query.date : today
  return (
    <main className="obedy-workspace restaurant-detail">
      <Link href={`/?date=${date}`} className="text-link">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Späť na prehľad
      </Link>
      <div className="detail-heading">
        <p className="eyebrow">{menu.area} / BRATISLAVA</p>
        <h1>{menu.name}</h1>
        <p className="mt-3 text-muted-foreground">{menu.address}</p>
      </div>
      <section aria-label="Menu na vybraný deň">
        <p className="section-label">{formatDate(date)}</p>
        <MenuCard menu={menu} date={date} referenceTime={referenceTime} />
      </section>
      <section className="dated-history" aria-label="Ďalšie zverejnené menu">
        <h2>Zverejnené dni</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Každá ponuka patrí ku konkrétnemu dátumu. Staršie dni nie sú dnešným
          menu.
        </p>
        {menu.days.length ? (
          <div className="mt-6">
            {menu.days
              .filter((day) => day.date !== date)
              .map((day) => (
                <details key={day.date} className="history-day">
                  <summary>
                    {formatDate(day.date, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    <span>{day.items.length} jedál</span>
                  </summary>
                  <MenuCard
                    menu={menu}
                    date={day.date}
                    referenceTime={referenceTime}
                  />
                </details>
              ))}
          </div>
        ) : (
          <p className="menu-empty">
            Zatiaľ nie je uložené žiadne platné menu.
          </p>
        )}
      </section>
    </main>
  )
}
