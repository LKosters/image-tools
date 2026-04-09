"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    num: "01",
    color: "#7C3AED",
    title: "Every Format",
    body: "PNG, JPEG, WebP, BMP, GIF — convert and compress across all major formats instantly in your browser.",
  },
  {
    num: "02",
    color: "#10B981",
    title: "Zero Compromise",
    body: "Studio-grade algorithms that maintain visual fidelity. Your images stay sharp, even at aggressive compression.",
  },
  {
    num: "03",
    color: "#F59E0B",
    title: "Fully Private",
    body: "Nothing ever leaves your device. Every byte is processed locally — no servers, no uploads, no tracking.",
  },
]

export function USPs() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) {
      cards.current.forEach((c) => c && gsap.set(c, { opacity: 1 }))
      return
    }

    const ctx = gsap.context(() => {
      cards.current.forEach((card, i) => {
        if (!card) return
        gsap.fromTo(
          card,
          { y: 60, opacity: 0, rotateX: 8 },
          {
            y: 0, opacity: 1, rotateX: 0,
            duration: 0.8,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 88%" },
          },
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // 3-d tilt
  const onMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) return
    const c = cards.current[i]
    if (!c) return
    const r = c.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(c, { rotateY: x * 10, rotateX: y * -10, duration: 0.3, ease: "power2.out" })
  }

  const onLeave = (i: number) => {
    const c = cards.current[i]
    if (!c) return
    gsap.to(c, { rotateY: 0, rotateX: 0, duration: 0.5, ease: "power3.out" })
  }

  return (
    <section ref={sectionRef} className="mt-16 md:mt-28 mb-8" style={{ perspective: "1000px" }}>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {features.map((f, i) => (
          <div
            key={f.num}
            ref={(el) => { cards.current[i] = el }}
            className="relative rounded-2xl p-7 opacity-0 group cursor-default"
            style={{
              background: "#0E0E18",
              border: "1px solid #1A1A28",
              transformStyle: "preserve-3d",
            }}
            onMouseMove={(e) => onMove(e, i)}
            onMouseLeave={() => onLeave(i)}
          >
            {/* top accent line */}
            <div
              className="absolute top-0 left-7 right-7 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)` }}
            />

            <span className="font-mono text-[10px] tracking-wider mb-5 block" style={{ color: f.color }}>
              {f.num}
            </span>

            <h3 className="font-serif text-2xl mb-3">{f.title}</h3>

            <p className="font-sans text-sm leading-relaxed" style={{ color: "#52525B" }}>
              {f.body}
            </p>

            {/* hover corner glow */}
            <div
              className="absolute -top-px -right-px w-24 h-24 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at top right, ${f.color}15, transparent 70%)` }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
