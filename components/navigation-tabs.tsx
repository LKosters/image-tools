"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import gsap from "gsap"

const tabs = [
  { href: "/", id: "convert", label: "Convert", num: "01", color: "#7C3AED" },
  { href: "/compress", id: "compress", label: "Compress", num: "02", color: "#10B981" },
  { href: "/cropper", id: "cropper", label: "Crop", num: "03", color: "#F59E0B" },
] as const

export function NavigationTabs() {
  const pathname = usePathname()
  const activeTab = pathname === "/compress" ? "compress" : pathname === "/cropper" ? "cropper" : "convert"
  const navRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const tabEls = useRef<(HTMLAnchorElement | null)[]>([])

  // Entrance animation
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.9, ease: "power3.out" },
      )
    })
    return () => ctx.revert()
  }, [])

  // Sliding glow indicator
  useEffect(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab)
    const el = tabEls.current[idx]
    const glow = glowRef.current
    if (!el || !glow || !navRef.current) return

    const navRect = navRef.current.getBoundingClientRect()
    const tabRect = el.getBoundingClientRect()
    const left = tabRect.left - navRect.left
    const width = tabRect.width

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) {
      gsap.set(glow, { left, width, opacity: 1 })
    } else {
      gsap.to(glow, { left, width, opacity: 1, duration: 0.45, ease: "power3.out" })
    }
  }, [activeTab])

  const activeColor = tabs.find((t) => t.id === activeTab)?.color ?? "#7C3AED"

  return (
    <nav ref={navRef} className="mb-10 md:mb-14 opacity-0">
      <div className="relative flex w-full md:inline-flex items-stretch border border-[#1A1A28] rounded-2xl bg-[#0E0E18]/60 backdrop-blur-sm overflow-hidden">
        {/* glow indicator */}
        <div
          ref={glowRef}
          className="absolute inset-y-0 rounded-2xl opacity-0 pointer-events-none transition-colors"
          style={{ background: `${activeColor}0C`, boxShadow: `inset 0 0 24px ${activeColor}12, 0 0 32px ${activeColor}08` }}
        />

        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              ref={(el) => { tabEls.current[i] = el }}
              href={tab.href}
              className="relative z-10 flex flex-1 md:flex-initial items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-3.5 md:px-8 md:py-4 transition-colors duration-300 group"
            >
              <span
                className="font-mono text-[10px] tracking-wider transition-colors duration-300 hidden md:inline"
                style={{ color: isActive ? activeColor : "#3f3f50" }}
              >
                {tab.num}
              </span>
              <span
                className="font-sans text-xs md:text-sm font-medium tracking-wide transition-colors duration-300"
                style={{ color: isActive ? "#EEEEF2" : "#52525B" }}
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: activeColor, boxShadow: `0 0 8px ${activeColor}80` }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
