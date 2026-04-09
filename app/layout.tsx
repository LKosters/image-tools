import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono, Space_Grotesk, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NavigationTabs } from "@/components/navigation-tabs"
import "./globals.css"

const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })
const _instrumentSerif = Instrument_Serif({ weight: ["400"], subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Borium",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <NavigationTabs />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
