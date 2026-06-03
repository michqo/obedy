import { unstable_cache } from "next/cache"
import * as cheerio from "cheerio"
import { RestaurantMenu, DayMenu, MenuItem } from "@/types/menu"

const DAYS_SK = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"]

export const fetchKomin = unstable_cache(async (): Promise<RestaurantMenu> => {
  const url = "https://www.pivovarkomin.sk/denne-menu/"
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 }
    })
    const html = await res.text()
    const $ = cheerio.load(html)
    
    const days: DayMenu[] = []
    
    $("h2.elementor-heading-title").each((_, el) => {
      const title = $(el).text().trim()
      const isDay = DAYS_SK.some(d => title.toLowerCase().includes(d.toLowerCase()))
      
      if (isDay) {
        // Find the next text-editor widget containing the menu
        const container = $(el).closest('.elementor-widget-heading').next('.elementor-widget-text-editor')
        const itemsText = container.text().trim()
        
        // Split by newlines and clean up, split by number if joined
        // Add newline before numbers like 1:, 2: if they are stuck
        const formattedText = itemsText.replace(/([0-9]:)/g, '\n$1')
        const lines = formattedText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        
        const items: MenuItem[] = lines.map(line => {
          return { name: line }
        })

        days.push({
          date: title,
          items
        })
      }
    })

    return {
      id: "komin",
      name: "Pivovar Komín",
      url,
      days
    }
  } catch (error) {
    console.error("Komin fetch error:", error)
    return { id: "komin", name: "Pivovar Komín", url, days: [], error: "Nepodarilo sa načítať menu" }
  }
}, ["komin-menu"], { revalidate: 86400 })

export const fetchNostalgia = unstable_cache(async (): Promise<RestaurantMenu> => {
  const url = "https://www.nostalgianivy.sk/"
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 }
    })
    const html = await res.text()
    const $ = cheerio.load(html)

    let menuData: any = null
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}")
        if (data["@type"] === "Restaurant" && data.hasMenu) {
          menuData = data.hasMenu
        }
      } catch (e) {}
    })

    const days: DayMenu[] = []
    
    if (menuData && menuData.hasMenuSection) {
      menuData.hasMenuSection.forEach((section: any) => {
        const title = section.name || ""
        const isDay = DAYS_SK.some(d => title.toLowerCase().includes(d.toLowerCase()))
        
        if (isDay && section.hasMenuItem) {
          const items: MenuItem[] = section.hasMenuItem.map((item: any) => ({
            name: item.name,
            price: item.offers?.price ? `${item.offers.price} €` : undefined,
            description: item.description
          }))
          
          days.push({
            date: title,
            items
          })
        }
      })
    }

    return {
      id: "nostalgia",
      name: "Nostalgia Nivy",
      url,
      days
    }
  } catch (error) {
    console.error("Nostalgia fetch error:", error)
    return { id: "nostalgia", name: "Nostalgia Nivy", url, days: [], error: "Nepodarilo sa načítať menu" }
  }
}, ["nostalgia-menu"], { revalidate: 86400 });

export const fetchDulak = unstable_cache(async (): Promise<RestaurantMenu> => {
  const targetUrl = "https://restauracie.sme.sk/restauracia/dulak-kosicka_11298-ruzinov_2980/denne-menu"
  const url = `https://r.jina.ai/${targetUrl}`
  try {
    const res = await fetch(url, {
      headers: { 
        "Accept": "text/html",
        "X-Return-Format": "html"
      },
      next: { revalidate: 86400 }
    })
    
    if (!res.ok) throw new Error(`Jina AI returned ${res.status}`)
    const html = await res.text()
    
    const $ = cheerio.load(html)
    const days: DayMenu[] = []

    // Process both today and other days
    $('.dnesne_menu, .ostatne_menu').each((_, dayEl) => {
      const dateText = $(dayEl).find('h2').text().replace(/\s+/g, ' ').trim()
      
      const items: MenuItem[] = []
      $(dayEl).find('.jedlo_polozka').each((_, itemEl) => {
        const name = $(itemEl).find('.left').text().replace(/\s+/g, ' ').trim()
        const price = $(itemEl).find('.right b').text().replace(/\s+/g, ' ').trim()
        
        if (name) {
          items.push({
            name,
            price: price || undefined
          })
        }
      })

      if (dateText && items.length > 0) {
        days.push({
          date: dateText,
          items
        })
      }
    })

    return {
      id: "dulak",
      name: "Dulak",
      url: targetUrl,
      days
    }
  } catch (error) {
    console.error("Dulak fetch error:", error)
    return {
      id: "dulak",
      name: "Dulak",
      url: targetUrl,
      days: [],
      error: "Nepodarilo sa načítať menu z Dulak (Jina AI bypass zlyhal)."
    }
  }
}, ["dulak-menu"], { revalidate: 86400 })

export async function fetchAllMenus(): Promise<RestaurantMenu[]> {
  return Promise.all([
    fetchKomin(),
    fetchNostalgia(),
    fetchDulak()
  ])
}
