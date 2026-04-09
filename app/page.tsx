"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Download, X, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { USPs } from "@/components/usps"
import { Footer } from "@/components/footer"
import { UploadArea } from "@/components/upload-area"
import gsap from "gsap"

type ImageFormat = "png" | "jpeg" | "webp" | "bmp" | "gif"
const C = "#7C3AED"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("png")
  const [convertedUrl, setConvertedUrl] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
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
    setSelectedFile(file); setConvertedUrl("")
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
    if (!convertedUrl || !successRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
    gsap.fromTo(successRef.current, { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" })
  }, [convertedUrl])

  const convertImage = async () => {
    if (!selectedFile || !previewUrl) return
    setIsConverting(true)
    try {
      const img = new window.Image(); img.crossOrigin = "anonymous"
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = previewUrl })
      const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No ctx"); ctx.drawImage(img, 0, 0)
      const mimeType = `image/${outputFormat === "jpeg" ? "jpeg" : outputFormat}`
      const quality = outputFormat === "jpeg" ? 0.95 : undefined
      canvas.toBlob((blob) => { if (blob) setConvertedUrl(URL.createObjectURL(blob)); setIsConverting(false) }, mimeType, quality)
    } catch { alert("Error converting image."); setIsConverting(false) }
  }

  const downloadImage = () => {
    if (!convertedUrl) return
    const link = document.createElement("a"); link.href = convertedUrl
    link.download = `${selectedFile?.name.split(".")[0] || "converted"}.${outputFormat}`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const reset = () => { if (convertedUrl) URL.revokeObjectURL(convertedUrl); setSelectedFile(null); setPreviewUrl(""); setConvertedUrl("") }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#06060B", color: "#EEEEF2" }}>
      <div className="mx-auto max-w-5xl px-4 md:px-10">
        <Header activeTab="convert" />
        <NavigationTabs />

        {!selectedFile ? (
          <UploadArea mode="convert" dragActive={dragActive} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onFileSelect={handleFileInput} />
        ) : (
          <div ref={panelRef} className="opacity-0">
            <div className="relative rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              {/* Giant ghost number */}
              <span className="absolute -top-6 -right-4 font-serif text-[10rem] md:text-[14rem] leading-none select-none pointer-events-none" style={{ color: `${C}06` }}>01</span>

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
                  {!convertedUrl ? (
                    <>
                      <h3 className="font-serif text-5xl md:text-6xl leading-[0.9] mb-2">Output</h3>
                      <p className="font-serif text-sm mb-8" style={{ color: "#2a2a40" }}>pick a format</p>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
                        {(["png", "jpeg", "webp", "bmp", "gif"] as ImageFormat[]).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setOutputFormat(fmt)}
                            className="py-3.5 rounded-xl font-serif text-base transition-all duration-200"
                            style={{
                              background: outputFormat === fmt ? `${C}15` : "#06060B",
                              border: `1px solid ${outputFormat === fmt ? `${C}50` : "#1A1A28"}`,
                              color: outputFormat === fmt ? C : "#52525B",
                              boxShadow: outputFormat === fmt ? `0 0 20px ${C}10` : "none",
                            }}
                          >
                            {fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={convertImage} disabled={isConverting}
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl transition-all duration-300 disabled:opacity-50"
                        style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                      >
                        {isConverting
                          ? <span className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          : <>Convert <ArrowRight className="w-5 h-5" /></>
                        }
                      </button>
                    </>
                  ) : (
                    <div ref={successRef} className="opacity-0">
                      <h3 className="font-serif text-5xl md:text-7xl leading-[0.9] mb-2" style={{ color: "#10B981" }}>Done</h3>
                      <p className="font-serif text-lg mb-8" style={{ color: "#2a2a40" }}>your {outputFormat.toUpperCase()} is ready</p>

                      <button onClick={downloadImage} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl mb-3 transition-all duration-300" style={{ background: "#10B981", color: "#06060B", boxShadow: "0 0 40px #10B98125" }}>
                        <Download className="w-5 h-5" /> Download
                      </button>
                      <button onClick={reset} className="w-full py-4 rounded-2xl font-serif text-base transition-colors" style={{ border: "1px solid #1A1A28", color: "#2a2a40" }}>
                        Convert another
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <USPs />
        <Footer />
      </div>
    </main>
  )
}
