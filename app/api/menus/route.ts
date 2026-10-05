import { fetchAllMenus, refreshAllMenus } from "@/lib/scraper"
export const dynamic = "force-dynamic"
export const maxDuration = 90
export async function GET() {
  return Response.json(await fetchAllMenus(), {
    headers: { "Cache-Control": "no-store" },
  })
}
export async function POST() {
  return Response.json(await refreshAllMenus(), {
    headers: { "Cache-Control": "no-store" },
  })
}
