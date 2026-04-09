"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface HeaderProps {
  activeTab: "convert" | "compress" | "favicon"
}

const config = {
  convert: { label: "Convert", color: "#7C3AED", num: "01", tagline: "Drag. Drop. Done." },
  compress: { label: "Compress", color: "#10B981", num: "02", tagline: "Same beauty. Tiny file." },
  favicon: { label: "Favicon", color: "#F59E0B", num: "03", tagline: "One click. Every size." },
} as const

export function Header({ activeTab }: HeaderProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const orb1 = useRef<HTMLDivElement>(null)
  const orb2 = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLHeadingElement>(null)
  const toolRef = useRef<HTMLDivElement>(null)

  const { label, color, num, tagline } = config[activeTab]

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) {
      gsap.set([wordRef.current, toolRef.current, orb1.current, orb2.current], { opacity: 1, y: 0, scale: 1 })
      return
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } })
      tl.fromTo([orb1.current, orb2.current], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, stagger: 0.2 }, 0)
      const letters = wordRef.current?.querySelectorAll(".b-letter")
      if (letters?.length) tl.fromTo(letters, { y: 140, opacity: 0, rotateX: 60 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.05 }, 0.1)
      if (toolRef.current) {
        const els = toolRef.current.children
        tl.fromTo(els, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.5)
      }
      gsap.to(orb1.current, { y: -20, x: 12, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 })
      gsap.to(orb2.current, { y: 16, x: -10, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 })
    }, wrapRef)
    return () => ctx.revert()
  }, [activeTab])

  return (
    <div ref={wrapRef} className="relative pt-6 pb-4 md:pt-10 md:pb-6">
      <div ref={orb1} className="absolute -top-24 -left-24 w-[320px] h-[320px] md:w-[500px] md:h-[500px] rounded-full opacity-0 pointer-events-none blur-[80px] md:blur-[120px]" style={{ background: `radial-gradient(circle, ${color}25 0%, transparent 70%)` }} />
      <div ref={orb2} className="absolute -bottom-32 -right-32 w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full opacity-0 pointer-events-none blur-[80px] md:blur-[120px]" style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }} />

      <div className="relative z-10">
        {/* Giant BORIUM */}
        <h1 ref={wordRef} className="font-serif text-[clamp(4rem,15vw,14rem)] leading-[0.8] tracking-[-0.05em] select-none" style={{ perspective: "600px" }}>
          {"BORIUM".split("").map((ch, i) => (
            <span key={i} className="b-letter inline-block opacity-0" style={{ transformStyle: "preserve-3d" }}>{ch}</span>
          ))}
        </h1>

        {/* Tool info row: giant number + tool name + tagline */}
        <div ref={toolRef} className="flex items-end gap-3 md:gap-5 mt-3 md:mt-4 flex-wrap">
          <span className="font-serif text-5xl md:text-7xl leading-none" style={{ color: `${color}30` }}>{num}</span>
          <span className="font-serif text-3xl md:text-5xl leading-none" style={{ color }}>{label}</span>
          <span className="font-serif text-lg md:text-2xl leading-none pb-0.5 md:pb-1" style={{ color: "#2a2a40" }}>{tagline}</span>
        </div>
      </div>
    </div>
  )
}
