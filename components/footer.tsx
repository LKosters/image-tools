"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function Footer() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) { gsap.set(ref.current, { opacity: 1 }); return }
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 95%" } })
    })
    return () => ctx.revert()
  }, [])

  return (
    <footer ref={ref} className="relative pt-16 pb-10 opacity-0">
      <div className="h-px mb-10" style={{ background: "linear-gradient(90deg, transparent, #1A1A28 30%, #1A1A28 70%, transparent)" }} />

      <div className="flex items-end justify-between">
        <div>
          <span className="font-serif text-4xl md:text-5xl tracking-[-0.04em] select-none" style={{ color: "#1A1A28" }}>BORIUM</span>
          <div className="mt-2">
            <Link href="https://www.laurenskosters.nl/" target="_blank" className="font-serif text-xs transition-colors hover:text-[#EEEEF2]" style={{ color: "#2a2a40" }}>
              by Laurens Kosters
            </Link>
          </div>
        </div>
        <Link href="https://github.com/lkosters" target="_blank" className="transition-colors hover:text-[#EEEEF2] pb-1" style={{ color: "#2a2a40" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2" /></svg>
        </Link>
      </div>
    </footer>
  )
}
