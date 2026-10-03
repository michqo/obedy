import { RestaurantMenu } from "@/types/menu"
import { Card, CardContent, CardHeader } from "./ui/card"
import { ExternalLink, UtensilsCrossed, AlertCircle } from "lucide-react"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"

interface MenuCardProps {
  menu: RestaurantMenu
}

export function MenuCard({ menu }: MenuCardProps) {
  return (
    <Card className="flex h-full flex-col bg-card shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <UtensilsCrossed
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-primary"
          />
          <h2 className="font-heading text-xl font-semibold">{menu.name}</h2>
        </div>
        <a
          href={menu.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Menu: ${menu.name}`}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {menu.error ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive/80" />
            <p className="text-sm">{menu.error}</p>
          </div>
        ) : menu.days.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Menu nie je dostupné.
          </div>
        ) : (
          menu.days.map((day, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-xs">
                  {day.date.replace(/DENNÉ MENU/i, "").trim()}
                </Badge>
                <Separator className="flex-1" />
              </div>
              <ul className="space-y-3 text-sm">
                {day.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex justify-between gap-4 leading-relaxed"
                  >
                    <span className="text-muted-foreground">{item.name}</span>
                    {item.price && (
                      <span className="font-medium whitespace-nowrap text-foreground">
                        {item.price}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
