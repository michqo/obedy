import { readFile } from "node:fs/promises"
import { restaurantById } from "../lib/restaurants"
import { snapshotFromHtml } from "../lib/scraper"
import { writeSnapshot } from "../lib/menus/repository"

const [id, file] = process.argv.slice(2)
const restaurant = restaurantById(id)
if (!restaurant || !file)
  throw new Error(
    "Usage: pnpm menus:import <komin|nostalgia|dulak> <saved-source.html>"
  )
// Import an actual browser-saved public source through the same parser and validation.
// It is an explicit successful observation, not an invented fallback menu.
const menu = snapshotFromHtml(restaurant, await readFile(file, "utf8"))
await writeSnapshot(menu)
console.log(
  `${id}: imported ${menu.days.length} dated menus (${menu.days[0].date} – ${menu.days.at(-1)!.date})`
)
