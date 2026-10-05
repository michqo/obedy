import { test } from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { menuSourceRequest } from "../lib/menus/source-request"
import { ingestRestaurant, snapshotFromHtml } from "../lib/scraper"
import { RESTAURANTS } from "../lib/restaurants"

test("Dulak uses authenticated Jina browser/proxy HTML retrieval and retains hidden weekly menus", () => {
  const { url, init } = menuSourceRequest(RESTAURANTS[2], " test-secret ")
  assert.equal(url, `https://r.jina.ai/${RESTAURANTS[2].url}`)
  assert.equal(init.cache, "no-store")
  assert.ok(init.signal instanceof AbortSignal)
  const headers = new Headers(init.headers)
  assert.equal(headers.get("authorization"), "Bearer test-secret")
  assert.equal(headers.get("x-respond-with"), "html")
  assert.equal(headers.get("x-engine"), "browser")
  assert.equal(headers.get("x-proxy"), "auto")
  assert.equal(headers.get("x-no-cache"), "true")
  assert.equal(
    headers.get("x-wait-for-selector"),
    ".dnesne_menu .jedlo_polozka"
  )
  assert.equal(headers.get("x-timeout"), "20")
  for (const header of [
    "x-detach-invisibles",
    "x-target-selector",
    "x-return-format",
  ])
    assert.equal(headers.has(header), false)
  assert.equal(url.includes("test-secret"), false)
})

test("Jina credentials are never forwarded to the other two restaurants", () => {
  for (const restaurant of RESTAURANTS.slice(0, 2)) {
    const { url, init } = menuSourceRequest(restaurant, "test-secret")
    assert.equal(url, restaurant.url)
    assert.equal(new Headers(init.headers).has("authorization"), false)
    assert.equal(new Headers(init.headers).has("x-proxy"), false)
  }
})

test("keyless Jina ingestion fetches HTML and preserves the last menu on blocked sources", async () => {
  const keyBefore = process.env.JINA_API_KEY
  delete process.env.JINA_API_KEY
  const html = await readFile(
    new URL("./fixtures/dulak.html", import.meta.url),
    "utf8"
  )
  try {
    const previous = snapshotFromHtml(
      RESTAURANTS[2],
      html,
      new Date("2026-10-04T18:00:00Z")
    )
    let calls = 0
    const next = await ingestRestaurant(RESTAURANTS[2], previous, (async (
      _url,
      init
    ) => {
      calls++
      const headers = new Headers(init?.headers)
      assert.equal(headers.has("authorization"), false)
      assert.equal(headers.has("x-proxy"), false)
      assert.equal(headers.has("x-engine"), false)
      assert.equal(headers.get("x-respond-with"), "html")
      return new Response(html)
    }) as typeof fetch)
    assert.equal(calls, 1)
    assert.equal(next.status, "ok")
    assert.equal(next.days.length, 5)
    const blocked = await ingestRestaurant(
      RESTAURANTS[2],
      next,
      (async () =>
        new Response(
          "<title>Security Verification | SME</title>"
        )) as typeof fetch
    )
    assert.equal(blocked.status, "parse-error")
    assert.deepEqual(blocked.days, next.days)
    assert.equal(blocked.lastSuccessAt, next.lastSuccessAt)
  } finally {
    if (keyBefore === undefined) delete process.env.JINA_API_KEY
    else process.env.JINA_API_KEY = keyBefore
  }
})

test("authenticated ingestion publishes five real dates without exposing provider credentials or errors", async () => {
  const keyBefore = process.env.JINA_API_KEY
  process.env.JINA_API_KEY = "test-only-private-key"
  try {
    const healthy = await ingestRestaurant(RESTAURANTS[2], null, (async (
      url,
      init
    ) => {
      assert.equal(String(url), `https://r.jina.ai/${RESTAURANTS[2].url}`)
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        "Bearer test-only-private-key"
      )
      return new Response(
        await readFile(
          new URL("./fixtures/dulak.html", import.meta.url),
          "utf8"
        )
      )
    }) as typeof fetch)
    assert.equal(healthy.status, "ok")
    assert.deepEqual(
      healthy.days.map((day) => day.date),
      ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"]
    )
    assert.equal(healthy.days[4].items.filter((item) => item.weekly).length, 3)
    for (const response of [
      new Response("test-only-private-key: invalid", { status: 401 }),
      new Response("<title>Security Verification | SME</title>"),
    ]) {
      const next = await ingestRestaurant(
        RESTAURANTS[2],
        healthy,
        (async () => response) as typeof fetch
      )
      assert.deepEqual(next.days, healthy.days)
      assert.equal(next.lastSuccessAt, healthy.lastSuccessAt)
      assert.notEqual(next.status, "ok")
      assert.equal(
        JSON.stringify(next).includes("test-only-private-key"),
        false
      )
      assert.equal(JSON.stringify(next).includes("Authorization"), false)
    }
    assert.equal(
      JSON.stringify(healthy).includes("test-only-private-key"),
      false
    )
  } finally {
    if (keyBefore === undefined) delete process.env.JINA_API_KEY
    else process.env.JINA_API_KEY = keyBefore
  }
})
