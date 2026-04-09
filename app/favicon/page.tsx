"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Download, X, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { USPs } from "@/components/usps"
import { USPCard, features } from "@/components/usps"
import { Footer } from "@/components/footer"
import { UploadArea } from "@/components/upload-area"
import gsap from "gsap"

const C = "#F59E0B"
const SIZES = [16, 32, 48, 64, 128, 256] as const

function buildIco(pngBlobs: { size: number; data: Uint8Array }[]): Blob {
  const count = pngBlobs.length
  const headerSize = 6
  const entrySize = 16
  const dirSize = headerSize + entrySize * count
  let totalSize = dirSize
  for (const b of pngBlobs) totalSize += b.data.byteLength

  const buf = new ArrayBuffer(totalSize)
  const view = new DataView(buf)

  // ICONDIR header
  view.setUint16(0, 0, true)      // reserved
  view.setUint16(2, 1, true)      // type = ICO
  view.setUint16(4, count, true)  // image count

  let dataOffset = dirSize
  for (let i = 0; i < count; i++) {
    const { size, data } = pngBlobs[i]
    const entryOffset = headerSize + i * entrySize
    // width & height: 0 means 256
    view.setUint8(entryOffset, size >= 256 ? 0 : size)
    view.setUint8(entryOffset + 1, size >= 256 ? 0 : size)
    view.setUint8(entryOffset + 2, 0)  // color palette
    view.setUint8(entryOffset + 3, 0)  // reserved
    view.setUint16(entryOffset + 4, 1, true)  // color planes
    view.setUint16(entryOffset + 6, 32, true) // bits per pixel
    view.setUint32(entryOffset + 8, data.byteLength, true)  // image data size
    view.setUint32(entryOffset + 12, dataOffset, true)       // image data offset
    dataOffset += data.byteLength
  }

  // Write PNG data
  const bytes = new Uint8Array(buf)
  let offset = dirSize
  for (const { data } of pngBlobs) {
    bytes.set(data, offset)
    offset += data.byteLength
  }

  return new Blob([buf], { type: "image/x-icon" })
}

export default function FaviconPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set(SIZES))
  const [isGenerating, setIsGenerating] = useState(false)
  const [icoUrl, setIcoUrl] = useState<string>("")
  const panelRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return }
    setSelectedFile(file); setIcoUrl(""); setSelectedSizes(new Set(SIZES))
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }

  useEffect(() => {
    if (!selectedFile || !panelRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    gsap.fromTo(panelRef.current, { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" })
  }, [selectedFile])

  useEffect(() => {
    if (!icoUrl || !successRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    gsap.fromTo(successRef.current, { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" })
  }, [icoUrl])

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev)
      if (next.has(size)) { if (next.size > 1) next.delete(size) }
      else next.add(size)
      return next
    })
  }

  const renderToBlob = (img: HTMLImageElement, size: number): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("No canvas context")); return }
      ctx.drawImage(img, 0, 0, size, size)
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Blob creation failed")); return }
        blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab))).catch(reject)
      }, "image/png")
    })
  }

  const generateFavicon = async () => {
    if (!previewUrl || selectedSizes.size === 0) return
    setIsGenerating(true)
    try {
      const img = new window.Image(); img.crossOrigin = "anonymous"
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = previewUrl })

      const sizes = Array.from(selectedSizes).sort((a, b) => a - b)
      const pngBlobs: { size: number; data: Uint8Array }[] = []
      for (const size of sizes) {
        const data = await renderToBlob(img, size)
        pngBlobs.push({ size, data })
      }

      const ico = buildIco(pngBlobs)
      setIcoUrl(URL.createObjectURL(ico))
    } catch {
      alert("Error generating favicon.")
    }
    setIsGenerating(false)
  }

  const downloadFavicon = () => {
    if (!icoUrl) return
    const link = document.createElement("a"); link.href = icoUrl
    link.download = "favicon.ico"
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const reset = () => {
    if (icoUrl) URL.revokeObjectURL(icoUrl)
    setSelectedFile(null); setPreviewUrl(""); setIcoUrl("")
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#06060B", color: "#EEEEF2" }}>
      <div className="mx-auto max-w-5xl px-4 md:px-10">
        <Header activeTab="favicon" />

        {!selectedFile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 md:[grid-template-rows:1fr_1fr_auto] mb-10 md:mb-16" style={{ perspective: "1000px" }}>
            <div className="md:col-span-2 md:row-span-2 [&>div]:h-full">
              <UploadArea mode="favicon" dragActive={dragActive} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onFileSelect={handleFileInput} />
            </div>
            <USPCard feature={features[0]} index={0} className="h-full" />
            <USPCard feature={features[1]} index={1} className="h-full" />
            <USPCard feature={features[2]} index={2} className="h-full" />
            <div className="md:col-span-2 rounded-2xl" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              <Footer compact />
            </div>
          </div>
        ) : (
          <div ref={panelRef} className="opacity-0">
            <div className="relative rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              <span className="absolute -top-6 -right-4 font-serif text-[10rem] md:text-[14rem] leading-none select-none pointer-events-none" style={{ color: `${C}06` }}>03</span>

              {/* Top bar */}
              <div className="relative z-10 flex items-center justify-between px-5 md:px-8 py-4 md:py-5" style={{ borderBottom: "1px solid #1A1A28" }}>
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-serif text-sm truncate" style={{ color: "#52525B" }}>{selectedFile.name}</span>
                  <span className="font-mono text-[10px] shrink-0" style={{ color: "#3f3f50" }}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28] shrink-0" style={{ color: "#52525B" }}><X className="w-4 h-4" /></button>
              </div>

              <div className="relative z-10 grid md:grid-cols-2">
                {/* Preview */}
                <div className="flex items-center justify-center p-5 md:p-10 md:border-r" style={{ borderColor: "#1A1A28" }}>
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-w-full max-h-72 md:max-h-80 rounded-xl object-contain" style={{ border: "1px solid #1A1A28" }} />
                </div>

                {/* Controls */}
                <div className="p-5 md:p-10 flex flex-col justify-center">
                  {!icoUrl ? (
                    <>
                      <h3 className="font-serif text-5xl md:text-6xl leading-[0.9] mb-2">Sizes</h3>
                      <p className="font-serif text-sm mb-8" style={{ color: "#2a2a40" }}>pick your favicon sizes</p>

                      <div className="grid grid-cols-3 gap-2 mb-8">
                        {SIZES.map((size) => (
                          <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className="py-3.5 rounded-xl font-serif text-base transition-all duration-200"
                            style={{
                              background: selectedSizes.has(size) ? `${C}15` : "#06060B",
                              border: `1px solid ${selectedSizes.has(size) ? `${C}50` : "#1A1A28"}`,
                              color: selectedSizes.has(size) ? C : "#52525B",
                              boxShadow: selectedSizes.has(size) ? `0 0 20px ${C}10` : "none",
                            }}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={generateFavicon} disabled={isGenerating || selectedSizes.size === 0}
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl transition-all duration-300 disabled:opacity-50"
                        style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                      >
                        {isGenerating
                          ? <span className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          : <>Generate Favicon <ArrowRight className="w-5 h-5" /></>
                        }
                      </button>
                    </>
                  ) : (
                    <div ref={successRef} className="opacity-0">
                      <h3 className="font-serif text-5xl md:text-7xl leading-[0.9] mb-2" style={{ color: "#10B981" }}>Done</h3>
                      <p className="font-serif text-lg mb-2" style={{ color: "#2a2a40" }}>your favicon.ico is ready</p>
                      <p className="font-mono text-xs mb-8" style={{ color: "#3f3f50" }}>
                        {Array.from(selectedSizes).sort((a, b) => a - b).map((s) => `${s}px`).join(" \u00b7 ")}
                      </p>

                      <button onClick={downloadFavicon} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl mb-3 transition-all duration-300" style={{ background: "#10B981", color: "#06060B", boxShadow: "0 0 40px #10B98125" }}>
                        <Download className="w-5 h-5" /> Download .ico
                      </button>
                      <button onClick={reset} className="w-full py-4 rounded-2xl font-serif text-base transition-colors" style={{ border: "1px solid #1A1A28", color: "#2a2a40" }}>
                        Generate another
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedFile && (
          <>
            <USPs />
            <Footer />
          </>
        )}
      </div>
    </main>
  )
}
