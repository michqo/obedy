import { fetchAllMenus } from "@/lib/scraper"
import { authorizedJob } from "@/lib/menus/job-auth"
import { todayInBratislava } from "@/lib/discovery"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  if (!authorizedJob(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  const menus = await fetchAllMenus()
  const date = todayInBratislava()
  return Response.json(
    {
      date,
      storage: "filesystem",
      restaurants: menus.map((menu) => ({
        id: menu.id,
        status: menu.status,
        error: menu.error,
        lastAttemptAt: menu.lastAttemptAt,
        lastSuccessAt: menu.lastSuccessAt,
        publishedToday: menu.days.some((day) => day.date === date),
        knownPriceCount: menu.days
          .flatMap((day) => day.items)
          .filter((item) => item.priceCents !== undefined).length,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
