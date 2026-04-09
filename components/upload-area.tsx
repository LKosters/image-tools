"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import gsap from "gsap"

interface UploadAreaProps {
  mode: "convert" | "compress" | "cropper"
  dragActive: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  multiple?: boolean
}

const colors = { convert: "#7C3AED", compress: "#10B981", cropper: "#F59E0B" } as const

export function UploadArea({
  mode,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  multiple = false,
}: UploadAreaProps) {
  const color = colors[mode]
  const inputId = multiple ? "file-upload-multiple" : "file-upload"
  const wrapRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<SVGRectElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // entrance + breathing border
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) {
      gsap.set(wrapRef.current, { opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current, { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" })

      if (borderRef.current) {
        gsap.to(borderRef.current, { strokeDashoffset: 40, duration: 3, ease: "none", repeat: -1 })
      }

      // inner content stagger
      if (innerRef.current) {
        gsap.fromTo(
          innerRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, delay: 0.3, ease: "power3.out" },
        )
      }
    })
    return () => ctx.revert()
  }, [])

  // magnetic button
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) return
    const el = btnRef.current
    if (!el) return

    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.2, duration: 0.25, ease: "power2.out" })
    }
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" })

    el.addEventListener("mousemove", move)
    el.addEventListener("mouseleave", leave)
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave) }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative rounded-3xl opacity-0 transition-colors duration-300"
      style={{ background: dragActive ? `${color}08` : "#0E0E18" }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* SVG animated border */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <rect
          ref={borderRef}
          x="1" y="1"
          width="calc(100% - 2px)" height="calc(100% - 2px)"
          rx="24" ry="24"
          fill="none"
          stroke={dragActive ? color : `${color}25`}
          strokeWidth="1.5"
          strokeDasharray="10 8"
          strokeDashoffset="0"
          className="transition-all duration-300"
        />
      </svg>

      <div ref={innerRef} className="relative z-10 flex flex-col items-center justify-center py-14 md:py-28 px-5 md:px-8 text-center">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
          style={{ background: `${color}10`, border: `1px solid ${color}20` }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl mb-3">
          Drop {multiple ? "images" : "an image"} here
        </h2>

        <p className="text-[#52525B] font-sans text-sm mb-10 max-w-sm">
          {multiple
            ? "Drag & drop multiple files or browse to select them"
            : "Drag & drop a file, or click below to browse"}
        </p>

        <label htmlFor={inputId}>
          <button
            ref={btnRef}
            type="button"
            className="relative font-sans text-sm font-semibold px-8 py-3.5 rounded-full cursor-pointer transition-shadow duration-300"
            style={{
              background: color,
              color: "#06060B",
              boxShadow: `0 0 0 0 ${color}00`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${color}40` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${color}00` }}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            {multiple ? "Choose Files" : "Choose File"}
          </button>
        </label>
        <input id={inputId} type="file" accept="image/*" multiple={multiple} onChange={onFileSelect} className="hidden" />
      </div>
    </div>
  )
}
