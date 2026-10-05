import { test } from "node:test"
import assert from "node:assert/strict"
import * as cheerio from "cheerio"
import { defaultMenuDate, todayInBratislava } from "../lib/discovery"
import type { RestaurantMenu } from "../types/menu"
const base = process.env.OBEDY_BASE_URL ?? "http://127.0.0.1:3000"

test("public menu API returns only the fixed restaurant set and no credentials", async () => {
  const response = await fetch(`${base}/api/menus`)
  assert.equal(response.status, 200)
  const text = await response.text()
  const menus = JSON.parse(text) as RestaurantMenu[]
  assert.deepEqual(menus.map((menu) => menu.id).sort(), [
    "dulak",
    "komin",
    "nostalgia",
  ])
  assert.ok(!text.includes("JINA_API_KEY") && !text.includes("CRON_SECRET"))
  assert.equal(response.headers.get("cache-control"), "no-store")
})
test("operator routes reject unconfigured/unauthorized callers", async () => {
  for (const route of ["refresh", "status"]) {
    const response = await fetch(`${base}/api/${route}`, {
      headers: { Authorization: "Bearer invalid-test-token" },
    })
    assert.equal(response.status, 401)
  }
})
test("SSR renders only dishes for the selected date, not every week", async () => {
  const menus = (await fetch(`${base}/api/menus`).then((response) =>
    response.json()
  )) as RestaurantMenu[]
  const date = menus
    .flatMap((menu) => menu.days.map((day) => day.date))
    .sort()[0]
  assert.ok(date, "Run menus:refresh before HTTP integration checks")
  const response = await fetch(`${base}/?date=${date}`)
  assert.equal(response.status, 200)
  const $ = cheerio.load(await response.text())
  assert.equal($("input[type=date]").attr("value"), date)
  const renderedNames = $(".menu-results .dish-name")
    .map((_, element) => $(element).text())
    .get()
  const expected = menus.flatMap((menu) =>
    menu.days
      .filter((day) => day.date === date)
      .flatMap((day) => day.items.map((item) => item.name))
  )
  assert.deepEqual(renderedNames.sort(), expected.sort())
})
test("home and invalid dates open a useful published lunch and unknown venues return 404", async () => {
  const menus = (await fetch(`${base}/api/menus`).then((response) =>
    response.json()
  )) as RestaurantMenu[]
  const home = cheerio.load(
    await fetch(base).then((response) => response.text())
  )
  const expected = defaultMenuDate(menus, todayInBratislava())
  assert.equal(home("input[type=date]").attr("value"), expected)
  const response = await fetch(`${base}/?date=2026-02-31`)
  assert.equal(response.status, 200)
  const $ = cheerio.load(await response.text())
  assert.equal($("input[type=date]").attr("value"), expected)
  assert.equal(
    (await fetch(`${base}/restauracie/not-a-restaurant`)).status,
    404
  )
})
test("an explicitly selected Sunday stays Sunday and offers the next published menu", async () => {
  const $ = cheerio.load(
    await fetch(`${base}/?date=2026-10-04`).then((response) => response.text())
  )
  assert.equal($("input[type=date]").attr("value"), "2026-10-04")
  assert.equal($(".dish-name").length, 0)
  assert.ok($(".day-notice button").text().includes("5. 10."))
})
test("public refresh is fixed-scope and preserves the loaded Dulak week", async () => {
  const response = await fetch(`${base}/api/menus`, { method: "POST" })
  assert.equal(response.status, 200)
  const menus = (await response.json()) as RestaurantMenu[]
  assert.deepEqual(menus.map((menu) => menu.id).sort(), [
    "dulak",
    "komin",
    "nostalgia",
  ])
  assert.ok(
    menus
      .find((menu) => menu.id === "dulak")
      ?.days.some((day) => day.date === "2026-10-05")
  )
})
test("restaurant detail keeps selected date and source/directions links", async () => {
  const response = await fetch(`${base}/restauracie/komin?date=2026-10-02`)
  assert.equal(response.status, 200)
  const $ = cheerio.load(await response.text())
  assert.equal($("h1").text(), "Pivovar Komín")
  assert.ok($("a[href='/?date=2026-10-02']").length)
  assert.ok($("a[href^='https://www.google.com/maps/dir/']").length)
  assert.ok($(".history-day").length)
})
