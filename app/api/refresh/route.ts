import { refreshAllMenus } from "@/lib/scraper"
import { authorizedJob } from "@/lib/menus/job-auth"
export const dynamic = "force-dynamic"
export const maxDuration = 90
async function refresh(request: Request) {
  if (!authorizedJob(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  const menus = await refreshAllMenus()
  const healthy = menus.every((menu) => menu.status === "ok" && !menu.error)
  return Response.json(
    {
      healthy,
      restaurants: menus.map(
        ({ id, status, error, lastAttemptAt, lastSuccessAt, days }) => ({
          id,
          status,
          error,
          lastAttemptAt,
          lastSuccessAt,
          dates: days.map((day) => day.date),
        })
      ),
    },
    { status: healthy ? 200 : 207, headers: { "Cache-Control": "no-store" } }
  )
}
export const GET = refresh
export const POST = refresh
