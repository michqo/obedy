import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parseDulak, parseSource } from "../lib/menus/adapters"
import { normalizeItem } from "../lib/menus/normalize"
const observed = new Date("2026-10-04T10:00:00Z")
const fixture = (id: string) =>
  readFileSync(new URL(`./fixtures/${id}.html`, import.meta.url), "utf8")

test("real Komín fixture retains shared bundle, weekly prices and date boundaries", () => {
  const days = parseSource("komin", fixture("komin"), observed)
  assert.equal(days.length, 5)
  const monday = days[0]
  assert.equal(monday.date, "2026-09-28")
  assert.equal(
    monday.items.filter((item) => item.category === "main" && !item.weekly)
      .length,
    3
  )
  assert.equal(
    monday.items.find((item) => item.category === "soup")?.priceCents,
    undefined
  )
  assert.ok(
    monday.items
      .filter((item) => item.category === "main")
      .every((item) => item.includesSoup)
  )
  assert.equal(monday.items.find((item) => item.vegetarian)?.priceCents, 890)
  assert.equal(
    monday.items.find((item) => item.name.includes("Teľací"))?.priceCents,
    1490
  )
})
test("real Nostalgia fixture normalizes portions, allergens, soup and all published dates", () => {
  const days = parseSource("nostalgia", fixture("nostalgia"), observed)
  assert.ok(days.some((day) => day.date === "2026-10-05"))
  assert.ok(days.some((day) => day.date === "2026-10-09"))
  const monday = days.find((day) => day.date === "2026-10-05")!
  assert.equal(monday.items[0].priceCents, 820)
  assert.equal(monday.items[0].priceKind, "from")
  assert.equal(monday.items[0].includesSoup, true)
  assert.equal(monday.items[0].portion, "240/200g")
  assert.deepEqual(monday.items[0].allergens, [7])
  assert.ok(!monday.items[0].name.includes("A:"))
  assert.equal(monday.items[3].portion, "140/250")
  assert.ok(!monday.items[3].name.includes("140/250"))
  assert.equal(monday.items[4].portion, "240/120/120")
  assert.equal(monday.items.at(-1)?.category, "soup")
  assert.equal(monday.items.at(-1)?.priceCents, 210)
})
test("JSON-LD graph and malformed unrelated script are supported", () => {
  const html =
    '<script type="application/ld+json">bad</script><script type="application/ld+json">{"@graph":[{"@type":["Restaurant"],"hasMenu":{"hasMenuSection":[{"name":"Pondelok 05.10.2026","hasMenuItem":[{"name":"Jedlo","offers":{"price":9,"priceCurrency":"EUR"}}]}]}}]}</script>'
  assert.equal(
    parseSource("nostalgia", html, observed)[0].items[0].priceCents,
    900
  )
})
test("Dulak selector contract works and verification/empty pages are failures", () => {
  // Synthetic selector contract: live source returned a verification page.
  const html =
    '<div class="dnesne_menu"><h2>Pondelok (05.10.2026)</h2><div class="jedlo_polozka"><div class="left">150g Kuracie kari (1,7)</div><div class="right"><b>9.00 €</b></div></div></div>'
  assert.equal(parseDulak(html)[0].items[0].priceCents, 900)
  assert.throws(() =>
    parseSource("dulak", "<title>Security Verification | SME</title>", observed)
  )
  assert.throws(() => parseSource("komin", "<h2>No menu</h2>", observed))
  assert.throws(() =>
    parseSource(
      "nostalgia",
      fixture("nostalgia"),
      new Date("2027-01-01T10:00:00Z")
    )
  )
})
test("real browser-observed Dulak week excludes headings and extracts unbracketed allergens", () => {
  const days = parseSource("dulak", fixture("dulak"), observed)
  assert.equal(days.length, 5)
  assert.equal(days[0].date, "2026-10-05")
  assert.equal(days.at(-1)?.date, "2026-10-09")
  assert.equal(days[0].items.length, 6)
  assert.equal(days[0].items[0].category, "soup")
  assert.equal(days[0].items[1].priceCents, 900)
  assert.equal(days[0].items[1].portion, "350g")
  assert.deepEqual(days[0].items[1].allergens, [1, 3, 7])
  assert.equal(
    days[0].items[1].name,
    "Penne alla Norma, paradajková omáčka, ricotta, baklažán, bazalka"
  )
  assert.equal(days[0].items.filter((item) => item.weekly).length, 3)
})
test("normalization preserves raw text and never guesses vegetarian from a dish name", () => {
  const item = normalizeItem("II. Penne so syrom 400g /A: 1,3,7 / + polievka", {
    price: "od 8,20 €",
  })!
  assert.equal(item.vegetarian, false)
  assert.equal(item.priceKind, "from")
  assert.equal(item.name, "Penne so syrom")
  assert.equal(item.includesSoup, true)
  assert.equal(
    item.sourceText,
    "II. Penne so syrom 400g /A: 1,3,7 / + polievka"
  )
})
