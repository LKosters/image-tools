"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import gsap from "gsap"

const tabs = [
  { href: "/", id: "convert", label: "Convert", color: "#7C3AED" },
  { href: "/compress", id: "compress", label: "Compress", color: "#10B981" },
  { href: "/cropper", id: "cropper", label: "Crop", color: "#F59E0B" },
] as const

export function NavigationTabs() {
  const pathname = usePathname()
  const activeTab = pathname === "/compress" ? "compress" : pathname === "/cropper" ? "cropper" : "convert"
  const navRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const tabEls = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    const ctx = gsap.context(() => { gsap.fromTo(navRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.8, ease: "power3.out" }) })
    return () => ctx.revert()
  }, [])

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
    <nav ref={navRef} className="mb-10 md:mb-16 opacity-0">
      <div className="relative flex w-full md:w-auto md:inline-flex gap-1 md:gap-0">
        <div ref={lineRef} className="absolute bottom-0 h-[3px] rounded-full opacity-0 pointer-events-none" style={{ background: activeColor, boxShadow: `0 0 16px ${activeColor}60` }} />
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.id
          return (
            <Link key={tab.id} ref={(el) => { tabEls.current[i] = el }} href={tab.href} className="flex-1 md:flex-initial pb-3 md:pb-4 md:pr-12 transition-colors duration-300">
              <span className="font-serif text-2xl md:text-3xl transition-colors duration-300" style={{ color: isActive ? "#EEEEF2" : "#2a2a40" }}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
