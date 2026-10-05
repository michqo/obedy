import { refreshAllMenus } from "../lib/scraper"
import { refreshSlot } from "../lib/menus/schedule"
let lastSlot: string | null = null
let running = false
async function tick() {
  const slot = refreshSlot(new Date())
  if (!slot || slot === lastSlot || running) return
  running = true
  try {
    const menus = await refreshAllMenus()
    lastSlot = slot
    console.log(
      JSON.stringify({
        slot,
        restaurants: menus.map(({ id, status }) => ({ id, status })),
      })
    )
  } catch {
    console.error("[obedy] scheduled refresh failed")
  } finally {
    running = false
  }
}
const timer = setInterval(() => {
  void tick()
}, 60000)
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    clearInterval(timer)
  })
await tick()
console.log(
  "Obedy worker ready: Europe/Bratislava, 06:00 / workdays 07:00–13:30 / 18:00"
)
