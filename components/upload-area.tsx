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

export function UploadArea({ mode, dragActive, onDragEnter, onDragLeave, onDragOver, onDrop, onFileSelect, multiple = false }: UploadAreaProps) {
  const color = colors[mode]
  const inputId = multiple ? "file-upload-multiple" : "file-upload"
  const wrapRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<SVGRectElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) { gsap.set(wrapRef.current, { opacity: 1 }); return }
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current, { y: 50, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" })
      if (borderRef.current) gsap.to(borderRef.current, { strokeDashoffset: 40, duration: 3, ease: "none", repeat: -1 })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    const el = btnRef.current; if (!el) return
    const move = (e: MouseEvent) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.2, ease: "power2.out" }) }
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" })
    el.addEventListener("mousemove", move); el.addEventListener("mouseleave", leave)
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave) }
  }, [])

  return (
    <div ref={wrapRef} className="relative rounded-3xl opacity-0 transition-colors duration-300" style={{ background: dragActive ? `${color}08` : "#0E0E18" }} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <rect ref={borderRef} x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="24" ry="24" fill="none" stroke={dragActive ? color : `${color}20`} strokeWidth="1.5" strokeDasharray="10 8" strokeDashoffset="0" className="transition-all duration-300" />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center py-20 md:py-32 px-5 md:px-8 text-center">
        {/* Giant serif "Drop" */}
        <h2 className="font-serif text-6xl md:text-8xl leading-none mb-2">
          Drop
        </h2>
        <p className="font-serif text-xl md:text-2xl mb-12" style={{ color: "#2a2a40" }}>
          {multiple ? "your images here" : "your image here"}
        </p>

        <label htmlFor={inputId}>
          <button
            ref={btnRef} type="button"
            className="font-serif text-lg md:text-xl px-10 md:px-14 py-4 md:py-5 rounded-full cursor-pointer transition-shadow duration-300"
            style={{ background: color, color: "#06060B", boxShadow: `0 0 0 0 ${color}00` }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 60px ${color}40` }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00` }}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            Browse
          </button>
        </label>
        <input id={inputId} type="file" accept="image/*" multiple={multiple} onChange={onFileSelect} className="hidden" />
      </div>
    </div>
  )
}
