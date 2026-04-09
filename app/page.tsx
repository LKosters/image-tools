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

const C = "#7C3AED" // violet

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
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return }
    setSelectedFile(file)
    setConvertedUrl("")
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  // Panel entrance
  useEffect(() => {
    if (!selectedFile || !panelRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) return
    gsap.fromTo(panelRef.current, { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" })
  }, [selectedFile])

  // Success animation
  useEffect(() => {
    if (!convertedUrl || !successRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) return
    gsap.fromTo(successRef.current, { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" })
  }, [convertedUrl])

  const convertImage = async () => {
    if (!selectedFile || !previewUrl) return
    setIsConverting(true)
    try {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = previewUrl })
      const canvas = document.createElement("canvas")
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")
      ctx.drawImage(img, 0, 0)
      const mimeType = `image/${outputFormat === "jpeg" ? "jpeg" : outputFormat}`
      const quality = outputFormat === "jpeg" ? 0.95 : undefined
      canvas.toBlob((blob) => { if (blob) setConvertedUrl(URL.createObjectURL(blob)); setIsConverting(false) }, mimeType, quality)
    } catch (error) {
      console.error("Error converting image:", error)
      alert("Error converting image. Please try again.")
      setIsConverting(false)
    }
  }

  const downloadImage = () => {
    if (!convertedUrl) return
    const link = document.createElement("a")
    link.href = convertedUrl
    link.download = `${selectedFile?.name.split(".")[0] || "converted"}.${outputFormat}`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const reset = () => {
    setSelectedFile(null); setPreviewUrl(""); setConvertedUrl("")
    if (convertedUrl) URL.revokeObjectURL(convertedUrl)
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#06060B", color: "#EEEEF2" }}>
      <div className="mx-auto max-w-5xl px-4 md:px-10">
        <Header activeTab="convert" />
        <NavigationTabs />

        {!selectedFile ? (
          <UploadArea mode="convert" dragActive={dragActive} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onFileSelect={handleFileInput} />
        ) : (
          <div ref={panelRef} className="opacity-0">
            {/* Two-column layout: preview + controls */}
            <div className="rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1A1A28" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: C }} />
                  <span className="font-sans text-xs truncate max-w-[200px]" style={{ color: "#52525B" }}>{selectedFile.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#3f3f50" }}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2">
                {/* Left: image preview */}
                <div className="flex items-center justify-center p-5 md:p-12" style={{ borderRight: "1px solid #1A1A28" }}>
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-w-full max-h-80 rounded-xl object-contain" style={{ border: "1px solid #1A1A28" }} />
                </div>

                {/* Right: controls */}
                <div className="p-5 md:p-10 flex flex-col justify-center">
                  {!convertedUrl ? (
                    <>
                      <h3 className="font-serif text-2xl mb-1">Output format</h3>
                      <p className="text-xs mb-6" style={{ color: "#52525B" }}>Choose your target format below</p>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
                        {(["png", "jpeg", "webp", "bmp", "gif"] as ImageFormat[]).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setOutputFormat(fmt)}
                            className="relative py-2.5 rounded-xl font-mono text-xs font-medium transition-all duration-200"
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
                        onClick={convertImage}
                        disabled={isConverting}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-50"
                        style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                      >
                        {isConverting ? (
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <>Convert <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </>
                  ) : (
                    <div ref={successRef} className="opacity-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "#10B98115", border: "1px solid #10B98130" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <h3 className="font-serif text-2xl mb-1">Done</h3>
                      <p className="text-xs mb-8" style={{ color: "#52525B" }}>Your {outputFormat.toUpperCase()} is ready to download</p>

                      <button
                        onClick={downloadImage}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-sans text-sm font-semibold mb-3 transition-all duration-300"
                        style={{ background: "#10B981", color: "#06060B", boxShadow: "0 0 40px #10B98125" }}
                      >
                        <Download className="w-4 h-4" /> Download {outputFormat.toUpperCase()}
                      </button>
                      <button
                        onClick={reset}
                        className="w-full py-3.5 rounded-2xl font-sans text-xs font-medium transition-colors"
                        style={{ border: "1px solid #1A1A28", color: "#52525B" }}
                      >
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
