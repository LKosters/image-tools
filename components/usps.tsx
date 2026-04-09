"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const features = [
  { num: "01", color: "#7C3AED", title: "Every\nFormat", body: "PNG, JPEG, WebP, BMP, GIF — all major formats, converted instantly." },
  { num: "02", color: "#10B981", title: "Zero\nCompromise", body: "Studio-grade algorithms. Your images stay sharp at any compression." },
  { num: "03", color: "#F59E0B", title: "Fully\nPrivate", body: "Nothing leaves your device. Every byte processed in your browser." },
]

export function USPs() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) { cards.current.forEach((c) => c && gsap.set(c, { opacity: 1 })); return }
    const ctx = gsap.context(() => {
      cards.current.forEach((card, i) => {
        if (!card) return
        gsap.fromTo(card, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: i * 0.15, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 88%" } })
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const onMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    const c = cards.current[i]; if (!c) return; const r = c.getBoundingClientRect()
    gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10, rotateX: ((e.clientY - r.top) / r.height - 0.5) * -10, duration: 0.3, ease: "power2.out" })
  }
  const onLeave = (i: number) => { const c = cards.current[i]; if (c) gsap.to(c, { rotateY: 0, rotateX: 0, duration: 0.5, ease: "power3.out" }) }

  return (
    <section ref={sectionRef} className="mt-20 md:mt-36 mb-8" style={{ perspective: "1000px" }}>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {features.map((f, i) => (
          <div
            key={f.num}
            ref={(el) => { cards.current[i] = el }}
            className="relative rounded-2xl p-6 md:p-8 opacity-0 group cursor-default overflow-hidden"
            style={{ background: "#0E0E18", border: "1px solid #1A1A28", transformStyle: "preserve-3d" }}
            onMouseMove={(e) => onMove(e, i)} onMouseLeave={() => onLeave(i)}
          >
            {/* Giant background number */}
            <span className="absolute -top-4 -right-2 font-serif text-[8rem] md:text-[10rem] leading-none select-none pointer-events-none" style={{ color: `${f.color}08` }}>{f.num}</span>

            <div className="relative z-10">
              <h3 className="font-serif text-4xl md:text-5xl leading-[0.9] mb-4 whitespace-pre-line" style={{ color: f.color }}>{f.title}</h3>
              <p className="font-sans text-sm leading-relaxed" style={{ color: "#52525B" }}>{f.body}</p>
            </div>

            <div className="absolute -top-px -right-px w-32 h-32 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${f.color}12, transparent 70%)` }} />
          </div>
        ))}
      </div>
    </section>
  )
}
