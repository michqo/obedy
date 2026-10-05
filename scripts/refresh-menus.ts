import { refreshAllMenus } from "../lib/scraper"
const menus = await refreshAllMenus()
for (const menu of menus)
  console.log(
    `${menu.id}: ${menu.status}; ${menu.days.length} dated menus; ${menu.lastSuccessAt ?? "no successful fetch"}`
  )
if (menus.some((menu) => menu.status !== "ok" || menu.error))
  process.exitCode = 1
