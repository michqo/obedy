"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  { id: "light", label: "Svetlá", Icon: Sun },
  { id: "dark", label: "Tmavá", Icon: Moon },
  { id: "system", label: "Podľa systému", Icon: SunMoon },
] as const

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const TriggerIcon = !mounted ? SunMoon : resolvedTheme === "dark" ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zmeniť vzhľad"
          className="size-11 cursor-pointer rounded-md"
        >
          <TriggerIcon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1">
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={setTheme}
        >
          {themes.map(({ id, label, Icon }) => (
            <DropdownMenuRadioItem
              key={id}
              value={id}
              className="min-h-11 cursor-pointer pr-8 pl-3 text-sm data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
