"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { USPs } from "@/components/usps"
import { Footer } from "@/components/footer"
import { UploadArea } from "@/components/upload-area"

interface CompressedImage {
  file: File
  originalUrl: string
  compressedUrl: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export default function CompressPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([])
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
      if (files.length > 0) {
        setSelectedFiles(files)
      }
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"))
      if (files.length > 0) {
        setSelectedFiles(files)
      }
    }
  }

  const compressImageFile = async (file: File): Promise<CompressedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          const canvas = document.createElement("canvas")

          let width = img.width
          let height = img.height
          const maxDimension = 2000

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedUrl = URL.createObjectURL(blob)
                const compressionRatio = ((1 - blob.size / file.size) * 100).toFixed(1)

                resolve({
                  file,
                  originalUrl: e.target?.result as string,
                  compressedUrl,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio: Number.parseFloat(compressionRatio),
                })
              } else {
                reject(new Error("Failed to compress image"))
              }
            },
            "image/webp",
            0.82,
          )
        }

        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target?.result as string
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const compressImages = async () => {
    if (selectedFiles.length === 0) return

    setIsCompressing(true)
    setCompressionProgress(0)
    const results: CompressedImage[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const compressed = await compressImageFile(selectedFiles[i])
        results.push(compressed)
        setCompressionProgress(((i + 1) / selectedFiles.length) * 100)
      } catch (error) {
        console.error(`Error compressing ${selectedFiles[i].name}:`, error)
      }
    }

    setCompressedImages(results)
    setIsCompressing(false)
  }

  const downloadCompressedImage = (image: CompressedImage) => {
    const link = document.createElement("a")
    link.href = image.compressedUrl
    const originalName = image.file.name.split(".")[0]
    link.download = `${originalName}-compressed.webp`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllCompressed = () => {
    compressedImages.forEach((image) => {
      downloadCompressedImage(image)
    })
  }

  const reset = () => {
    setSelectedFiles([])
    setCompressedImages([])
    setCompressionProgress(0)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Header activeTab="compress" />
        <NavigationTabs />

        {selectedFiles.length === 0 ? (
          <UploadArea
            mode="compress"
            dragActive={dragActive}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onFileSelect={handleFileInput}
            multiple
          />
        ) : (
          <div className="space-y-8">
            <div className="relative bg-white/5 rounded-lg p-8 border border-white/10">
              <button
                onClick={reset}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Remove images"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="font-serif text-2xl mb-2">
                  {compressedImages.length > 0 ? "Compressed Images" : "Selected Images"}
                </h3>
                <p className="text-white/60 font-sans text-sm">{selectedFiles.length} images selected</p>
              </div>

              {isCompressing && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm font-sans mb-2">
                    <span className="text-white/60">Compressing...</span>
                    <span className="text-[#13947D]">{Math.round(compressionProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#13947D] h-full transition-all duration-300 ease-out"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {compressedImages.length === 0 ? (
                <div className="space-y-3 mb-8 max-h-64 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm truncate">{file.name}</p>
                        <p className="text-white/40 font-sans text-xs">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 mb-8 max-h-96 overflow-y-auto">
                  {compressedImages.map((image, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded border border-white/10">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm truncate mb-1">{image.file.name}</p>
                          <div className="flex gap-4 text-xs font-sans">
                            <span className="text-white/40">{(image.originalSize / 1024).toFixed(2)} KB</span>
                            <span className="text-[#13947D]">→</span>
                            <span className="text-[#13947D]">{(image.compressedSize / 1024).toFixed(2)} KB</span>
                            <span className="text-[#13947D] font-medium">({image.compressionRatio}% smaller)</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => downloadCompressedImage(image)}
                          size="sm"
                          className="bg-[#CCADAC] hover:bg-[#CCADAC]/80 text-black font-sans shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {compressedImages.length === 0 ? (
                <Button
                  onClick={compressImages}
                  disabled={isCompressing}
                  className="w-full bg-[#13947D] hover:bg-[#13947D]/80 text-white font-sans text-lg py-6"
                >
                  {isCompressing
                    ? "Compressing..."
                    : `Compress ${selectedFiles.length} Image${selectedFiles.length > 1 ? "s" : ""}`}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={downloadAllCompressed}
                    className="w-full bg-[#CCADAC] hover:bg-[#CCADAC]/80 text-black font-sans text-lg py-6"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download All ({compressedImages.length} files)
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/10 font-sans bg-transparent"
                  >
                    Compress More Images
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <USPs />
        <Footer />
      </div>
    </main>
  )
}
