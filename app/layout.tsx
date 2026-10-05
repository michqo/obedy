import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { NavBar } from "@/components/nav-bar"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Obedy — dobrý obed pri Nivách / miqal",
  metadataBase: new URL("https://obedy.miqal.xyz"),
  openGraph: {
    title: "Obedy / miqal",
    description:
      "Tri známe miesta. Jeden prehľad. Komín, Nostalgia a Dulak pri Nivách.",
    locale: "sk_SK",
    type: "website",
    images: [
      {
        url: "/preview.jpg",
        width: 1280,
        height: 1000,
        alt: "Obedy — denné menu troch reštaurácií",
      },
    ],
  },
  description:
    "Komín, Nostalgia a Dulak. Pozrite si ich denné obedové menu a ceny na vybraný deň.",
  twitter: { card: "summary_large_image", images: ["/preview.jpg"] },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sk"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, geist.variable)}
    >
      <body>
        <ThemeProvider>
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
