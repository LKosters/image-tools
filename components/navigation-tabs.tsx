"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

const tabs = [
  { href: "/", id: "convert", label: "Convert", color: "#7C3AED" },
  { href: "/compress", id: "compress", label: "Compress", color: "#10B981" },
  { href: "/cropper", id: "cropper", label: "Crop", color: "#F59E0B" },
] as const

export function NavigationTabs() {
  const pathname = usePathname()
  const activeTab = pathname === "/compress" ? "compress" : pathname === "/cropper" ? "cropper" : "convert"
  const barRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const tabEls = useRef<(HTMLAnchorElement | null)[]>([])
  const [scrolled, setScrolled] = useState(false)

  // Scroll detection for bg transition
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    handler()
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  // Entrance animation
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    const ctx = gsap.context(() => { gsap.fromTo(barRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.8, ease: "power3.out" }) })
    return () => ctx.revert()
  }, [])

  // Animated underline
  useEffect(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab)
    const el = tabEls.current[idx]; const line = lineRef.current
    if (!el || !line || !navRef.current) return
    const navRect = navRef.current.getBoundingClientRect(); const tabRect = el.getBoundingClientRect()
    const props = { left: tabRect.left - navRect.left, width: tabRect.width, opacity: 1 }
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    rm ? gsap.set(line, props) : gsap.to(line, { ...props, duration: 0.4, ease: "power3.out" })
  }, [activeTab])

  const activeColor = tabs.find((t) => t.id === activeTab)?.color ?? "#7C3AED"

  return (
    <nav
      ref={barRef}
      className="sticky top-0 z-40 w-full opacity-0 transition-[background-color,border-color,backdrop-filter] duration-300"
      style={{
        background: scrolled ? "#06060Bee" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #1A1A28" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 md:px-10 flex items-center justify-between py-4 md:py-5">
        {/* Wordmark */}
        <Link href="/" className="font-serif text-xl tracking-[-0.04em] select-none" style={{ color: "#EEEEF2" }}>
          BORIUM
        </Link>

        {/* Tab links */}
        <div ref={navRef} className="relative flex gap-1 md:gap-0">
          <div ref={lineRef} className="absolute bottom-0 h-[3px] rounded-full opacity-0 pointer-events-none" style={{ background: activeColor, boxShadow: `0 0 16px ${activeColor}60` }} />
          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id
            return (
              <Link key={tab.id} ref={(el) => { tabEls.current[i] = el }} href={tab.href} className="pb-3 md:pb-4 px-3 md:px-5 transition-colors duration-300">
                <span className="font-serif text-base md:text-lg transition-colors duration-300" style={{ color: isActive ? "#EEEEF2" : "#2a2a40" }}>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
