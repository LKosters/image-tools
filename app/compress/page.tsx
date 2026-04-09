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

interface CompressedImage {
  file: File
  originalUrl: string
  compressedUrl: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

const C = "#10B981" // emerald

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

  // Panel entrance
  useEffect(() => {
    if (selectedFiles.length > 0 && panelRef.current) {
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (rm) return
      gsap.fromTo(panelRef.current, { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" })
    }
  }, [selectedFiles.length > 0])

  // Progress bar
  useEffect(() => {
    if (progressRef.current && isCompressing) {
      gsap.to(progressRef.current, { width: `${compressionProgress}%`, duration: 0.35, ease: "power2.out" })
    }
  }, [compressionProgress, isCompressing])

  // Results entrance
  useEffect(() => {
    if (compressedImages.length > 0 && resultsRef.current) {
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (rm) return
      gsap.fromTo(
        resultsRef.current.querySelectorAll(".result-row"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power3.out" },
      )
    }
  }, [compressedImages.length])

  const compressImageFile = async (file: File): Promise<CompressedImage> => {
    const originalUrl = URL.createObjectURL(file)
    const outputType = convertToWebP ? "image/webp" : file.type
    const options = { maxSizeMB: 10, maxWidthOrHeight: 4096, useWebWorker: true, fileType: outputType, initialQuality: quality / 100 }
    try {
      const compressedFile = await imageCompression(file, options)
      const compressedUrl = URL.createObjectURL(compressedFile)
      return { file, originalUrl, compressedUrl, originalSize: file.size, compressedSize: compressedFile.size, compressionRatio: Number.parseFloat(((1 - compressedFile.size / file.size) * 100).toFixed(1)) }
    } catch (error) { URL.revokeObjectURL(originalUrl); throw error }
  }

  const compressImages = async () => {
    if (!selectedFiles.length) return
    setIsCompressing(true); setCompressionProgress(0)
    const results: CompressedImage[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        results.push(await compressImageFile(selectedFiles[i]))
        setCompressionProgress(((i + 1) / selectedFiles.length) * 100)
      } catch (error) { console.error(`Error compressing ${selectedFiles[i].name}:`, error) }
    }
    setCompressedImages(results); setIsCompressing(false)
  }

  const downloadCompressedImage = (image: CompressedImage) => {
    const link = document.createElement("a")
    link.href = image.compressedUrl
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
            <div className="rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1A1A28" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: C }} />
                  <span className="font-sans text-xs" style={{ color: "#52525B" }}>{selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected</span>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 md:p-10">
                {/* Progress bar */}
                {isCompressing && (
                  <div className="mb-8">
                    <div className="flex justify-between text-xs font-sans mb-2">
                      <span style={{ color: "#52525B" }}>Compressing...</span>
                      <span style={{ color: C }}>{Math.round(compressionProgress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1A28" }}>
                      <div ref={progressRef} className="h-full rounded-full" style={{ width: "0%", background: `linear-gradient(90deg, ${C}, ${C}cc)`, boxShadow: `0 0 16px ${C}40` }} />
                    </div>
                  </div>
                )}

                {/* File list before compression */}
                {compressedImages.length === 0 && (
                  <>
                    <div className="space-y-2 mb-8 max-h-56 overflow-y-auto">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "#06060B", border: "1px solid #1A1A28" }}>
                          <span className="font-sans text-xs truncate mr-4">{file.name}</span>
                          <span className="font-mono text-[10px] shrink-0" style={{ color: "#3f3f50" }}>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>

                    {/* Quality controls */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-sans text-xs" style={{ color: "#52525B" }}>Quality</span>
                          <span className="font-mono text-xs" style={{ color: C }}>{quality}%</span>
                        </div>
                        <Slider
                          value={[quality]} onValueChange={(v) => setQuality(v[0])} min={10} max={100} step={5}
                          className="[&_[data-slot=slider-track]]:bg-[#1A1A28] [&_[data-slot=slider-range]]:bg-[#10B981] [&_[data-slot=slider-thumb]]:border-[#10B981] [&_[data-slot=slider-thumb]]:bg-[#06060B]"
                        />
                        <p className="font-sans text-[10px] mt-2" style={{ color: "#3f3f50" }}>Lower = smaller file size</p>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div
                            className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                            style={{ background: convertToWebP ? C : "#1A1A28" }}
                            onClick={() => setConvertToWebP(!convertToWebP)}
                          >
                            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#EEEEF2] transition-transform duration-200" style={{ transform: convertToWebP ? "translateX(16px)" : "translateX(0)" }} />
                          </div>
                          <span className="font-sans text-xs" style={{ color: "#52525B" }}>Convert to WebP</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={compressImages} disabled={isCompressing}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-50"
                      style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                    >
                      {isCompressing ? (
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <>Compress {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </>
                )}

                {/* Results */}
                {compressedImages.length > 0 && (
                  <div ref={resultsRef}>
                    <div className="space-y-2 mb-8 max-h-80 overflow-y-auto">
                      {compressedImages.map((image, i) => (
                        <div key={i} className="result-row flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl" style={{ background: "#06060B", border: "1px solid #1A1A28" }}>
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-xs truncate mb-0.5">{image.file.name}</p>
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <span style={{ color: "#3f3f50" }}>{(image.originalSize / 1024).toFixed(1)} KB</span>
                              <span style={{ color: C }}>→</span>
                              <span style={{ color: C }}>{(image.compressedSize / 1024).toFixed(1)} KB</span>
                              <span className="font-semibold" style={{ color: C }}>−{image.compressionRatio}%</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => setPreviewImage(image)} className="p-2 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}>
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => downloadCompressedImage(image)} className="p-2 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: C }}>
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={downloadAllCompressed}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-sans text-sm font-semibold mb-3 transition-all duration-300"
                      style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                    >
                      <Download className="w-4 h-4" /> Download All ({compressedImages.length})
                    </button>
                    <button onClick={reset} className="w-full py-3.5 rounded-2xl font-sans text-xs font-medium transition-colors" style={{ border: "1px solid #1A1A28", color: "#52525B" }}>
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
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1A1A28" }}>
              <div>
                <p className="font-sans text-sm">{previewImage.file.name}</p>
                <p className="font-mono text-[10px] mt-0.5">
                  <span style={{ color: "#3f3f50" }}>{(previewImage.originalSize / 1024).toFixed(1)} KB → </span>
                  <span style={{ color: C }}>{(previewImage.compressedSize / 1024).toFixed(1)} KB</span>
                  <span className="ml-2 font-semibold" style={{ color: C }}>−{previewImage.compressionRatio}%</span>
                </p>
              </div>
              <button onClick={() => setPreviewImage(null)} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28]" style={{ color: "#52525B" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-130px)]">
              <img src={previewImage.compressedUrl} alt="Compressed preview" className="max-w-full h-auto rounded-xl mx-auto" />
            </div>
            <div className="px-6 py-4 flex justify-end" style={{ borderTop: "1px solid #1A1A28" }}>
              <button
                onClick={() => { downloadCompressedImage(previewImage); setPreviewImage(null) }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-sans text-xs font-semibold"
                style={{ background: C, color: "#06060B" }}
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
