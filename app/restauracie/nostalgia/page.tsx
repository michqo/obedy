import RestaurantPage, {
  restaurantMetadata,
} from "@/components/restaurant-page"
export const dynamic = "force-dynamic"
export const maxDuration = 90
export const metadata = restaurantMetadata("nostalgia")
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <RestaurantPage id="nostalgia" searchParams={searchParams} />
}
