import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { RESTAURANTS } from "../lib/restaurants"
import {
  emptyMenu,
  ingestRestaurant,
  fetchAllMenus,
  refreshAllMenus,
} from "../lib/scraper"
import {
  isSnapshot,
  readSnapshot,
  writeSnapshot,
} from "../lib/menus/repository"
import { authorizedJob } from "../lib/menus/job-auth"
import { normalizeItem } from "../lib/menus/normalize"
import type { RestaurantMenu } from "../types/menu"

const originalJinaKey = process.env.JINA_API_KEY
before(() => {
  process.env.JINA_API_KEY = "test-only-jina-key"
})
after(() => {
  if (originalJinaKey === undefined) delete process.env.JINA_API_KEY
  else process.env.JINA_API_KEY = originalJinaKey
})

const previous: RestaurantMenu = {
  ...emptyMenu(RESTAURANTS[2]),
  status: "ok",
  lastSuccessAt: "2026-10-03T10:00:00Z",
  days: [
    {
      date: "2026-10-02",
      sourceLabel: "Piatok 02.10.2026",
      items: [normalizeItem("Rezeň", { price: 9 })!],
    },
  ],
}
test("a fresh install initializes real menus and repeated delivery respects the refresh cooldown", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "obedy-bootstrap-"))
  const before = process.env.MENU_DATA_DIR
  const originalFetch = globalThis.fetch
  process.env.MENU_DATA_DIR = folder
  let calls = 0
  globalThis.fetch = (async (url: string | URL | Request) => {
    calls++
    const address = String(url)
    const id = address.includes("pivovarkomin")
      ? "komin"
      : address.includes("nostalgianivy")
        ? "nostalgia"
        : "dulak"
    return new Response(
      await import("node:fs/promises").then((fs) =>
        fs.readFile(new URL(`./fixtures/${id}.html`, import.meta.url), "utf8")
      )
    )
  }) as typeof fetch
  try {
    const menus = await fetchAllMenus()
    assert.equal(calls, 3)
    assert.ok(
      menus.every((menu) => menu.status === "ok" && menu.days.length === 5)
    )
    await fetchAllMenus()
    await refreshAllMenus()
    assert.equal(calls, 3)
  } finally {
    globalThis.fetch = originalFetch
    if (before === undefined) delete process.env.MENU_DATA_DIR
    else process.env.MENU_DATA_DIR = before
    await rm(folder, { recursive: true, force: true })
  }
})

test("HTTP and parser failures preserve the last good dated snapshot", async () => {
  for (const response of [
    new Response("unavailable", { status: 503 }),
    new Response("<title>Security Verification</title>"),
  ]) {
    const next = await ingestRestaurant(
      RESTAURANTS[2],
      previous,
      (async () => response) as typeof fetch
    )
    assert.deepEqual(next.days, previous.days)
    assert.equal(next.lastSuccessAt, previous.lastSuccessAt)
    assert.notEqual(next.status, "ok")
    assert.ok(next.lastAttemptAt)
  }
})
test("failed source is isolated from a successful source", async () => {
  const [failed, healthy] = await Promise.all([
    ingestRestaurant(RESTAURANTS[2], previous, (async () => {
      throw new Error("timeout")
    }) as typeof fetch),
    ingestRestaurant(
      RESTAURANTS[0],
      null,
      (async () =>
        new Response(
          await import("node:fs/promises").then((fs) =>
            fs.readFile(
              new URL("./fixtures/komin.html", import.meta.url),
              "utf8"
            )
          )
        )) as typeof fetch
    ),
  ])
  assert.equal(failed.status, "fetch-error")
  assert.equal(healthy.status, "ok")
  assert.equal(healthy.days.length, 5)
})
test("filesystem snapshots survive a read and reject invalid stored structures", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "obedy-test-"))
  const before = process.env.MENU_DATA_DIR
  process.env.MENU_DATA_DIR = folder
  try {
    await writeSnapshot(previous)
    assert.deepEqual(
      await readSnapshot("dulak"),
      JSON.parse(JSON.stringify(previous))
    )
    assert.equal(
      isSnapshot({ ...previous, days: [{ date: "bad", items: [] }] }),
      false
    )
    assert.equal(isSnapshot({ ...previous, id: "other" }), false)
    assert.equal(isSnapshot({ ...previous, lastSuccessAt: "bad" }), false)
    await assert.rejects(() =>
      writeSnapshot({ ...previous, parserVersion: 999 })
    )
  } finally {
    if (before === undefined) delete process.env.MENU_DATA_DIR
    else process.env.MENU_DATA_DIR = before
    await rm(folder, { recursive: true, force: true })
  }
})
test("job authorization requires configured secret and exact Bearer header", () => {
  const before = process.env.CRON_SECRET
  try {
    delete process.env.CRON_SECRET
    assert.equal(authorizedJob(new Request("http://localhost")), false)
    process.env.CRON_SECRET = "test-only-long-secret"
    assert.equal(
      authorizedJob(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer test-only-long-secret" },
        })
      ),
      true
    )
    assert.equal(
      authorizedJob(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer wrong" },
        })
      ),
      false
    )
  } finally {
    if (before === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = before
  }
})

test("schedule uses Bratislava clock for morning slots, weekends, and DST", async () => {
  const { refreshSlot } = await import("../lib/menus/schedule")
  assert.equal(refreshSlot(new Date("2026-10-05T05:15:00Z")), "2026-10-05:7:0")
  assert.equal(refreshSlot(new Date("2026-10-05T05:45:00Z")), "2026-10-05:7:1")
  assert.equal(refreshSlot(new Date("2026-10-04T05:15:00Z")), null)
  assert.equal(refreshSlot(new Date("2026-10-04T16:00:00Z")), "2026-10-04:18")
  assert.equal(refreshSlot(new Date("2026-10-26T06:15:00Z")), "2026-10-26:7:0")
})
