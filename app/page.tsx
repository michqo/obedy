import { DiscoveryWorkspace } from "@/components/discovery-workspace"
import { defaultMenuDate, validDate } from "@/lib/discovery"
import { fetchMenuContext } from "@/lib/scraper"

export const dynamic = "force-dynamic"
export const maxDuration = 90
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query))
    if (typeof value === "string") params.set(key, value)
  const { menus, today, referenceTime } = await fetchMenuContext()
  return (
    <DiscoveryWorkspace
      key={params.toString()}
      initialMenus={menus}
      initialDate={
        validDate(params.get("date") ?? "")
          ? params.get("date")!
          : defaultMenuDate(menus, today)
      }
      today={today}
      referenceTime={referenceTime}
    />
  )
}
