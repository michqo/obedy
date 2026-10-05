import { test } from "node:test"
import assert from "node:assert/strict"
import {
  defaultMenuDate,
  parseMenuDate,
  parsePrice,
  shiftDate,
  todayInBratislava,
  weekDates,
} from "../lib/discovery"
import { RESTAURANTS } from "../lib/restaurants"
import { normalizeItem } from "../lib/menus/normalize"
import type { RestaurantMenu } from "../types/menu"

const date = "2026-10-05"
const makeMenu = (
  index: number,
  names: string[],
  prices: unknown[]
): RestaurantMenu => ({
  ...RESTAURANTS[index],
  status: "ok",
  parserVersion: 1,
  days: [
    {
      date,
      sourceLabel: "Pondelok 05.10.2026",
      items: names.map((name, i) => normalizeItem(name, { price: prices[i] })!),
    },
  ],
})
const menus = [
  makeMenu(
    0,
    ["Kurací rezeň", "Vegetariánske menu: Lasagne", "0,33l Vývar"],
    [8.9, "8,90 €", 2]
  ),
  makeMenu(1, ["Dusené hovädzie", "Krémové rizoto"], ["8,20 €", undefined]),
  makeMenu(2, ["Kuracie kari"], ["od 7,00 €"]),
]

test("date parsing requires explicit year and verifies actual calendar and weekday", () => {
  assert.equal(parseMenuDate("DENNÉ MENU PONDELOK 05.10.2026"), date)
  assert.equal(parseMenuDate("Pondelok 06.10.2026"), null)
  assert.equal(parseMenuDate("Pondelok 31.02.2026"), null)
  assert.equal(parseMenuDate("Pondelok 05.10."), null)
  assert.equal(parseMenuDate("Štvrtok 01.10.2026"), "2026-10-01")
})
test("Bratislava today survives midnight and DST boundaries", () => {
  assert.equal(todayInBratislava(new Date("2026-10-04T22:30:00Z")), date)
  assert.equal(
    todayInBratislava(new Date("2026-03-28T23:30:00Z")),
    "2026-03-29"
  )
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01")
  assert.deepEqual(weekDates("2026-10-04"), [
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
  ])
})
test("Sunday opens the next published lunch, while explicit dates and today remain selectable", () => {
  assert.equal(defaultMenuDate(menus, "2026-10-04"), "2026-10-05")
  assert.equal(defaultMenuDate(menus, date), date)
  assert.equal(defaultMenuDate(menus, "2026-10-06"), date)
  assert.equal(defaultMenuDate(menus, "2026-10-20"), "2026-10-20")
  assert.equal(defaultMenuDate([], "2026-10-04"), "2026-10-04")
})
test("price parsing rejects malformed, negative and unknown amounts", () => {
  assert.equal(parsePrice("8,90 €"), 890)
  assert.equal(parsePrice(8.2), 820)
  for (const value of [
    "",
    "zdarma",
    "-1",
    "0",
    "8.999",
    "8 € alebo 10 €",
    {},
    NaN,
  ])
    assert.equal(parsePrice(value), undefined)
})
