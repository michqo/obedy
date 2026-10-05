import type { Restaurant } from "@/types/menu"

export function menuSourceRequest(
  restaurant: Restaurant,
  jinaApiKey = process.env.JINA_API_KEY
): { url: string; init: RequestInit } {
  if (restaurant.id !== "dulak")
    return {
      url: restaurant.url,
      init: {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Obedy/1.0 (+https://obedy.miqal.xyz)" },
      },
    }

  const key = jinaApiKey?.trim()
  return {
    url: `https://r.jina.ai/${restaurant.url}`,
    init: {
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
      headers: {
        ...(key
          ? {
              Authorization: `Bearer ${key}`,
              "X-Proxy": "auto",
              "X-Engine": "browser",
            }
          : {}),
        "X-Respond-With": "html",
        "X-No-Cache": "true",
        "X-Wait-For-Selector": ".dnesne_menu .jedlo_polozka",
        "X-Timeout": "20",
      },
    },
  }
}
