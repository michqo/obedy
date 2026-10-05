import Link from "next/link"
import { ArrowUpRight, MapPin } from "lucide-react"
import { formatDate, formatPrice } from "@/lib/discovery"
import { directionsUrl } from "@/lib/restaurants"
import type { MenuItem, RestaurantMenu } from "@/types/menu"

export function DishRow({ item }: { item: MenuItem }) {
  return (
    <li className="dish-row">
      <div className="min-w-0">
        <p className="dish-name">{item.name}</p>
        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {(item.category === "soup" || item.includesSoup) && (
          <p className="dish-meta">
            {item.category === "soup" ? "Polievka" : "Polievka v cene"}
          </p>
        )}
      </div>
      <span
        className={`dish-price ${item.priceCents === undefined ? "text-muted-foreground" : ""}`}
      >
        {formatPrice(item)}
      </span>
    </li>
  )
}

export function CheckedTime({ value }: { value?: string }) {
  if (!value) return <>Zatiaľ neskontrolované</>
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("sk-SK", {
        timeZone: "Europe/Bratislava",
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))}
    </time>
  )
}

export function MenuCard({
  menu,
  date,
  onDate,
  referenceTime,
}: {
  menu: RestaurantMenu
  date: string
  referenceTime: number
  onDate?: (date: string) => void
}) {
  const day = menu.days.find((candidate) => candidate.date === date)
  const shown = day?.items ?? []
  const stale =
    menu.status !== "ok" ||
    Boolean(
      menu.lastSuccessAt &&
      referenceTime - Date.parse(menu.lastSuccessAt) > 2 * 60 * 60 * 1000
    )
  const available = menu.days.map((candidate) => candidate.date).sort()
  const alternative =
    available.find((candidate) => candidate > date) ?? available.at(-1)
  return (
    <article
      className="restaurant-section"
      aria-labelledby={`restaurant-${menu.id}`}
    >
      <header className="restaurant-header">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="area-label">{menu.area}</span>
            <span
              className={
                day && !stale ? "text-success" : "text-muted-foreground"
              }
            >
              {day
                ? stale
                  ? "Posledné uložené menu"
                  : "Menu na vybraný deň"
                : menu.status === "pending"
                  ? "Čaká na načítanie"
                  : menu.status !== "ok"
                    ? "Zdroj nedostupný"
                    : "Bez uloženého menu na tento deň"}
            </span>
          </div>
          <h2 id={`restaurant-${menu.id}`} className="restaurant-title">
            <Link href={`/restauracie/${menu.id}?date=${date}`}>
              {menu.name}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {menu.address}
            {menu.serviceHours && (
              <span className="ml-3 inline-block">
                Obedy {menu.serviceHours}
              </span>
            )}
          </p>
        </div>
      </header>
      {day ? (
        <>
          {stale && (
            <p className="menu-notice">
              {menu.status !== "ok"
                ? "Automatická aktualizácia zdroja neprešla."
                : "Kontrola zdroja je staršia ako dve hodiny."}{" "}
              Uložené menu na{" "}
              {formatDate(date, { day: "numeric", month: "long" })} zostáva
              dostupné.
            </p>
          )}
          <ul className="dish-list">
            {shown.map((item, i) => (
              <DishRow key={`${item.id}-${i}`} item={item} />
            ))}
          </ul>
          <details className="original-menu">
            <summary>Podrobnosti menu a alergény</summary>
            <ul>
              {day.items.map((item, i) => (
                <li key={`${item.id}-${i}`}>
                  <p>{item.sourceText}</p>
                  <p>
                    {[
                      item.portion,
                      item.allergens.length
                        ? `Alergény: ${item.allergens.join(", ")}`
                        : "",
                      item.includesWater ? "2 dl vody v cene" : "",
                      item.vegetarian ? "Vegetariánske podľa zdroja" : "",
                      item.weekly ? "Týždenná ponuka" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : (
        <div className="menu-empty">
          <p className="font-medium">
            {menu.status === "pending"
              ? "Menu ešte nebolo načítané."
              : menu.status !== "ok"
                ? "Menu sa nepodarilo overiť."
                : "Na tento deň zatiaľ nemáme menu."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {menu.error ??
              "Ponuku si môžete pozrieť priamo na stránke reštaurácie."}
          </p>
          {alternative && alternative !== date && (
            <div className="mt-3">
              {onDate ? (
                <button
                  className="text-link"
                  onClick={() => onDate(alternative)}
                >
                  Pozrieť menu:{" "}
                  {formatDate(alternative, {
                    weekday: "short",
                    day: "numeric",
                    month: "numeric",
                  })}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </button>
              ) : (
                <Link className="text-link" href={`?date=${alternative}`}>
                  Pozrieť menu:{" "}
                  {formatDate(alternative, {
                    day: "numeric",
                    month: "numeric",
                  })}
                </Link>
              )}
            </div>
          )}
        </div>
      )}
      <footer className="restaurant-footer">
        <span className="text-xs text-muted-foreground">
          Posledná kontrola: <CheckedTime value={menu.lastAttemptAt} />
          {menu.status !== "ok" && menu.lastSuccessAt && (
            <>
              {" "}
              · úspešne <CheckedTime value={menu.lastSuccessAt} />
            </>
          )}
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <a
            className="text-link"
            href={menu.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Zdroj menu
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
          <a
            className="text-link"
            href={directionsUrl(menu.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin className="size-3.5" aria-hidden="true" />
            Trasa
          </a>
        </div>
      </footer>
    </article>
  )
}
