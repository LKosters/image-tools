"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface HeaderProps {
  activeTab: "convert" | "compress" | "cropper"
}

const config = {
  convert: { label: "Convert", color: "#7C3AED", tagline: "Transform between formats" },
  compress: { label: "Compress", color: "#10B981", tagline: "Optimize without compromise" },
  cropper: { label: "Crop", color: "#F59E0B", tagline: "Precision cropping tools" },
} as const

export function Header({ activeTab }: HeaderProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const orb1 = useRef<HTMLDivElement>(null)
  const orb2 = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLHeadingElement>(null)
  const toolRef = useRef<HTMLSpanElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLParagraphElement>(null)

  const { label, color, tagline } = config[activeTab]

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) {
      // just show everything
      gsap.set([wordRef.current, toolRef.current, tagRef.current, lineRef.current, orb1.current, orb2.current], { opacity: 1, y: 0, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } })

      // orbs fade in and start floating
      tl.fromTo([orb1.current, orb2.current], { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, stagger: 0.2 }, 0)

      // "BORIUM" letters clip-path reveal
      const letters = wordRef.current?.querySelectorAll(".b-letter")
      if (letters?.length) {
        tl.fromTo(
          letters,
          { y: 120, opacity: 0, rotateX: 50 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.04 },
          0.15,
        )
      }

      // tool name slides in from right
      tl.fromTo(toolRef.current, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9 }, 0.5)

      // accent line grows
      tl.fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, 0.7)

      // tagline fades up
      tl.fromTo(tagRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.85)

      // perpetual orb float
      gsap.to(orb1.current, { y: -18, x: 10, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 })
      gsap.to(orb2.current, { y: 14, x: -8, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 })
    }, wrapRef)

    return () => ctx.revert()
  }, [activeTab])

  return (
    <div ref={wrapRef} className="relative pt-8 pb-12 md:pt-20 md:pb-28">
      {/* Gradient orbs */}
      <div
        ref={orb1}
        className="absolute -top-24 -left-24 w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full opacity-0 pointer-events-none blur-[80px] md:blur-[100px]"
        style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }}
      />
      <div
        ref={orb2}
        className="absolute -bottom-24 -right-24 w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-full opacity-0 pointer-events-none blur-[80px] md:blur-[100px]"
        style={{ background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }}
      />

      {/* Main heading block */}
      <div className="relative z-10 flex flex-col items-start gap-1">
        <h1
          ref={wordRef}
          className="font-serif text-[clamp(3.5rem,12vw,12rem)] leading-[0.85] tracking-[-0.04em] select-none"
          style={{ perspective: "600px" }}
        >
          {"BORIUM".split("").map((ch, i) => (
            <span key={i} className="b-letter inline-block opacity-0" style={{ transformStyle: "preserve-3d" }}>
              {ch}
            </span>
          ))}
        </h1>

        <div className="flex items-center gap-5 mt-2">
          <div
            ref={lineRef}
            className="h-[3px] w-16 rounded-full origin-left"
            style={{ background: color }}
          />
          <span
            ref={toolRef}
            className="font-sans text-sm md:text-base font-semibold uppercase tracking-[0.25em] opacity-0"
            style={{ color }}
          >
            {label}
          </span>
        </div>

        <p
          ref={tagRef}
          className="font-sans text-sm md:text-base mt-6 max-w-xs opacity-0"
          style={{ color: "#52525B" }}
        >
          {tagline}
        </p>
      </div>
    </div>
  )
}
