import { todayInBratislava } from "@/lib/discovery"

// A slot is refreshed once per worker. Sources publish on different schedules;
// early/evening checks also pick up the next workday's menu on a weekend.
export function refreshSlot(now: Date): string | null {
  const date = todayInBratislava(now)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bratislava",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const hour = Number(parts.find((part) => part.type === "hour")?.value)
  const minute = Number(parts.find((part) => part.type === "minute")?.value)
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  if (hour === 6 || hour === 18) return `${date}:${hour}`
  if (day > 0 && day < 6 && hour >= 7 && hour < 14)
    return `${date}:${hour}:${Math.floor(minute / 30)}`
  return null
}
