"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export const features = [
  { num: "01", color: "#7C3AED", title: "Every\nFormat", body: "PNG, JPEG, WebP, BMP, GIF — all major formats, converted instantly." },
  { num: "02", color: "#10B981", title: "Zero\nCompromise", body: "Studio-grade algorithms. Your images stay sharp at any compression." },
  { num: "03", color: "#F59E0B", title: "Fully\nPrivate", body: "Nothing leaves your device. Every byte processed in your browser." },
]

export function USPCard({ feature, index, className, style }: { feature: typeof features[number]; index: number; className?: string; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current; if (!card) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) { gsap.set(card, { opacity: 1 }); return }
    const ctx = gsap.context(() => {
      gsap.fromTo(card, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: index * 0.15, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 88%" } })
    })
    return () => ctx.revert()
  }, [index])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    const c = cardRef.current; if (!c) return; const r = c.getBoundingClientRect()
    gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10, rotateX: ((e.clientY - r.top) / r.height - 0.5) * -10, duration: 0.3, ease: "power2.out" })
  }
  const onLeave = () => { const c = cardRef.current; if (c) gsap.to(c, { rotateY: 0, rotateX: 0, duration: 0.5, ease: "power3.out" }) }

  return (
    <div
      ref={cardRef}
      className={`relative rounded-2xl p-6 md:p-8 opacity-0 group cursor-default overflow-hidden ${className ?? ""}`}
      style={{ background: "#0E0E18", border: "1px solid #1A1A28", transformStyle: "preserve-3d", ...style }}
      onMouseMove={onMove} onMouseLeave={onLeave}
    >
      <span className="absolute -top-4 -right-2 font-serif text-[8rem] md:text-[10rem] leading-none select-none pointer-events-none" style={{ color: `${feature.color}08` }}>{feature.num}</span>
      <div className="relative z-10">
        <h3 className="font-serif text-4xl md:text-5xl leading-[0.9] mb-4 whitespace-pre-line" style={{ color: feature.color }}>{feature.title}</h3>
        <p className="font-sans text-sm leading-relaxed" style={{ color: "#52525B" }}>{feature.body}</p>
      </div>
      <div className="absolute -top-px -right-px w-32 h-32 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${feature.color}12, transparent 70%)` }} />
    </div>
  )
}

export function USPs() {
  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <section ref={sectionRef} className="mt-20 md:mt-36 mb-8" style={{ perspective: "1000px" }}>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {features.map((f, i) => (
          <USPCard key={f.num} feature={f} index={i} />
        ))}
      </div>
    </section>
  )
}
