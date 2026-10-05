import RestaurantPage, {
  restaurantMetadata,
} from "@/components/restaurant-page"
export const dynamic = "force-dynamic"
export const maxDuration = 90
export const metadata = restaurantMetadata("komin")
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <RestaurantPage id="komin" searchParams={searchParams} />
}
