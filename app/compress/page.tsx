"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Download, X, Eye, ArrowRight } from "lucide-react"
import imageCompression from "browser-image-compression"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { USPs } from "@/components/usps"
import { Footer } from "@/components/footer"
import { UploadArea } from "@/components/upload-area"
import { Slider } from "@/components/ui/slider"
import gsap from "gsap"

interface CompressedImage { file: File; originalUrl: string; compressedUrl: string; originalSize: number; compressedSize: number; compressionRatio: number }
const C = "#10B981"

export default function CompressPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([])
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [convertToWebP, setConvertToWebP] = useState(false)
  const [quality, setQuality] = useState(80)
  const [previewImage, setPreviewImage] = useState<CompressedImage | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
      if (files.length) setSelectedFiles(files)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"))
      if (files.length) setSelectedFiles(files)
    }
  }

  useEffect(() => {
    if (selectedFiles.length > 0 && panelRef.current) {
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
      gsap.fromTo(panelRef.current, { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" })
    }
  }, [selectedFiles.length > 0])

  useEffect(() => {
    if (progressRef.current && isCompressing) gsap.to(progressRef.current, { width: `${compressionProgress}%`, duration: 0.35, ease: "power2.out" })
  }, [compressionProgress, isCompressing])

  useEffect(() => {
    if (compressedImages.length > 0 && resultsRef.current) {
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
      gsap.fromTo(resultsRef.current.querySelectorAll(".result-row"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power3.out" })
    }
  }, [compressedImages.length])

  const compressImageFile = async (file: File): Promise<CompressedImage> => {
    const originalUrl = URL.createObjectURL(file)
    const options = { maxSizeMB: 10, maxWidthOrHeight: 4096, useWebWorker: true, fileType: convertToWebP ? "image/webp" : file.type, initialQuality: quality / 100 }
    try {
      const comp = await imageCompression(file, options)
      return { file, originalUrl, compressedUrl: URL.createObjectURL(comp), originalSize: file.size, compressedSize: comp.size, compressionRatio: Number.parseFloat(((1 - comp.size / file.size) * 100).toFixed(1)) }
    } catch (error) { URL.revokeObjectURL(originalUrl); throw error }
  }

  const compressImages = async () => {
    if (!selectedFiles.length) return
    setIsCompressing(true); setCompressionProgress(0)
    const results: CompressedImage[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      try { results.push(await compressImageFile(selectedFiles[i])); setCompressionProgress(((i + 1) / selectedFiles.length) * 100) }
      catch (error) { console.error(`Error compressing ${selectedFiles[i].name}:`, error) }
    }
    setCompressedImages(results); setIsCompressing(false)
  }

  const downloadCompressedImage = (image: CompressedImage) => {
    const link = document.createElement("a"); link.href = image.compressedUrl
    link.download = `${image.file.name.split(".")[0]}-compressed.${convertToWebP ? "webp" : image.file.name.split(".").pop() || "jpg"}`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const downloadAllCompressed = () => compressedImages.forEach(downloadCompressedImage)
  const reset = () => { setSelectedFiles([]); setCompressedImages([]); setCompressionProgress(0) }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#06060B", color: "#EEEEF2" }}>
      <div className="mx-auto max-w-5xl px-4 md:px-10">
        <Header activeTab="compress" />
        <NavigationTabs />

        {!selectedFiles.length ? (
          <UploadArea mode="compress" dragActive={dragActive} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onFileSelect={handleFileInput} multiple />
        ) : (
          <div ref={panelRef} className="opacity-0">
            <div className="relative rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              {/* Giant ghost number */}
              <span className="absolute -top-6 -right-4 font-serif text-[10rem] md:text-[14rem] leading-none select-none pointer-events-none" style={{ color: `${C}06` }}>02</span>

              {/* Top bar */}
              <div className="relative z-10 flex items-center justify-between px-5 md:px-8 py-4 md:py-5" style={{ borderBottom: "1px solid #1A1A28" }}>
                <span className="font-serif text-sm" style={{ color: "#52525B" }}>{selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected</span>
                <button onClick={reset} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}><X className="w-4 h-4" /></button>
              </div>

              <div className="relative z-10 p-5 md:p-10">
                {/* Progress */}
                {isCompressing && (
                  <div className="mb-8">
                    <div className="flex justify-between mb-3">
                      <span className="font-serif text-lg" style={{ color: "#52525B" }}>Compressing...</span>
                      <span className="font-serif text-2xl" style={{ color: C }}>{Math.round(compressionProgress)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1A1A28" }}>
                      <div ref={progressRef} className="h-full rounded-full" style={{ width: "0%", background: `linear-gradient(90deg, ${C}, ${C}cc)`, boxShadow: `0 0 16px ${C}40` }} />
                    </div>
                  </div>
                )}

                {/* Before compression */}
                {compressedImages.length === 0 && (
                  <>
                    <h3 className="font-serif text-5xl md:text-6xl leading-[0.9] mb-2">Settings</h3>
                    <p className="font-serif text-sm mb-8" style={{ color: "#2a2a40" }}>tweak before compressing</p>

                    {/* File list */}
                    <div className="space-y-2 mb-8 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3.5 rounded-xl" style={{ background: "#06060B", border: "1px solid #1A1A28" }}>
                          <span className="font-serif text-sm truncate mr-4">{file.name}</span>
                          <span className="font-mono text-[10px] shrink-0" style={{ color: "#3f3f50" }}>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>

                    {/* Quality + WebP */}
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
                      <div>
                        <div className="flex justify-between items-end mb-4">
                          <span className="font-serif text-2xl">Quality</span>
                          <span className="font-serif text-3xl" style={{ color: C }}>{quality}%</span>
                        </div>
                        <Slider
                          value={[quality]} onValueChange={(v) => setQuality(v[0])} min={10} max={100} step={5}
                          className="[&_[data-slot=slider-track]]:bg-[#1A1A28] [&_[data-slot=slider-range]]:bg-[#10B981] [&_[data-slot=slider-thumb]]:border-[#10B981] [&_[data-slot=slider-thumb]]:bg-[#06060B]"
                        />
                        <p className="font-serif text-xs mt-3" style={{ color: "#2a2a40" }}>lower = smaller file</p>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-4 cursor-pointer">
                          <div className="w-12 h-7 rounded-full relative transition-colors cursor-pointer" style={{ background: convertToWebP ? C : "#1A1A28" }} onClick={() => setConvertToWebP(!convertToWebP)}>
                            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#EEEEF2] transition-transform duration-200" style={{ transform: convertToWebP ? "translateX(20px)" : "translateX(0)" }} />
                          </div>
                          <span className="font-serif text-lg" style={{ color: "#52525B" }}>Convert to WebP</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={compressImages} disabled={isCompressing}
                      className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl transition-all duration-300 disabled:opacity-50"
                      style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                    >
                      {isCompressing
                        ? <span className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        : <>Compress {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} <ArrowRight className="w-5 h-5" /></>
                      }
                    </button>
                  </>
                )}

                {/* Results */}
                {compressedImages.length > 0 && (
                  <div ref={resultsRef}>
                    <h3 className="font-serif text-5xl md:text-7xl leading-[0.9] mb-2" style={{ color: C }}>Compressed</h3>
                    <p className="font-serif text-lg mb-8" style={{ color: "#2a2a40" }}>here are your results</p>

                    <div className="space-y-2 mb-8 max-h-72 overflow-y-auto">
                      {compressedImages.map((image, i) => (
                        <div key={i} className="result-row flex items-center justify-between gap-3 px-5 py-4 rounded-xl" style={{ background: "#06060B", border: "1px solid #1A1A28" }}>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-sm truncate mb-1">{image.file.name}</p>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span style={{ color: "#3f3f50" }}>{(image.originalSize / 1024).toFixed(1)} KB</span>
                              <span style={{ color: C }}>&rarr;</span>
                              <span style={{ color: C }}>{(image.compressedSize / 1024).toFixed(1)} KB</span>
                              <span className="font-serif text-base font-semibold" style={{ color: C }}>&minus;{image.compressionRatio}%</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => setPreviewImage(image)} className="p-2.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}><Eye className="w-4 h-4" /></button>
                            <button onClick={() => downloadCompressedImage(image)} className="p-2.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: C }}><Download className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={downloadAllCompressed} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl mb-3 transition-all duration-300" style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}>
                      <Download className="w-5 h-5" /> Download All ({compressedImages.length})
                    </button>
                    <button onClick={reset} className="w-full py-4 rounded-2xl font-serif text-base transition-colors" style={{ border: "1px solid #1A1A28", color: "#2a2a40" }}>
                      Compress more
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <USPs />
        <Footer />
      </div>

      {/* Preview modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#06060Bdd", backdropFilter: "blur(12px)" }} onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 md:px-8 py-5" style={{ borderBottom: "1px solid #1A1A28" }}>
              <div>
                <p className="font-serif text-lg">{previewImage.file.name}</p>
                <p className="font-mono text-[11px] mt-1">
                  <span style={{ color: "#3f3f50" }}>{(previewImage.originalSize / 1024).toFixed(1)} KB &rarr; </span>
                  <span style={{ color: C }}>{(previewImage.compressedSize / 1024).toFixed(1)} KB</span>
                  <span className="ml-2 font-serif text-base font-semibold" style={{ color: C }}>&minus;{previewImage.compressionRatio}%</span>
                </p>
              </div>
              <button onClick={() => setPreviewImage(null)} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 md:p-8 overflow-auto max-h-[calc(90vh-130px)]">
              <img src={previewImage.compressedUrl} alt="Compressed preview" className="max-w-full h-auto rounded-xl mx-auto" />
            </div>
            <div className="px-5 md:px-8 py-5 flex justify-end" style={{ borderTop: "1px solid #1A1A28" }}>
              <button onClick={() => { downloadCompressedImage(previewImage); setPreviewImage(null) }} className="flex items-center gap-3 px-8 py-3.5 rounded-xl font-serif text-lg" style={{ background: C, color: "#06060B" }}>
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
