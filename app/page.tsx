import { fetchAllMenus } from "@/lib/scraper"
import { MenuCard } from "@/components/menu-card"

export default async function Home() {
  const menus = await fetchAllMenus()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Denné Menu</h1>
        <p className="text-muted-foreground">Aktuálna ponuka obedov v okolí.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => (
          <MenuCard key={menu.id} menu={menu} />
        ))}
      </div>
    </main>
  )
}
