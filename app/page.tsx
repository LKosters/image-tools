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

type ImageFormat = "png" | "jpeg" | "webp" | "bmp" | "gif"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("png")
  const [convertedUrl, setConvertedUrl] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    setSelectedFile(file)
    setConvertedUrl("")

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const convertImage = async () => {
    if (!selectedFile || !previewUrl) return

    setIsConverting(true)

    try {
      const img = new window.Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = previewUrl
      })

      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      ctx.drawImage(img, 0, 0)

      const mimeType = `image/${outputFormat === "jpeg" ? "jpeg" : outputFormat}`
      const quality = outputFormat === "jpeg" ? 0.95 : undefined

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setConvertedUrl(url)
          }
          setIsConverting(false)
        },
        mimeType,
        quality,
      )
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
    const originalName = selectedFile?.name.split(".")[0] || "converted"
    link.download = `${originalName}.${outputFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const reset = () => {
    setSelectedFile(null)
    setPreviewUrl("")
    setConvertedUrl("")
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Header activeTab="convert" />
        <NavigationTabs />

        {!selectedFile ? (
          <UploadArea
            mode="convert"
            dragActive={dragActive}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onFileSelect={handleFileInput}
          />
        ) : (
          <div className="space-y-8">
            <div className="relative bg-white/5 rounded-lg p-8 border border-white/10">
              <button
                onClick={reset}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Remove image"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="font-serif text-2xl mb-2">Original Image</h3>
                <p className="text-white/60 font-sans text-sm">
                  {selectedFile.name} • {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>

              <div className="flex justify-center mb-8">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full max-h-96 rounded border border-white/20"
                />
              </div>

              <div className="mb-6">
                <label className="block font-serif text-xl mb-4">Convert to:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(["png", "jpeg", "webp", "bmp", "gif"] as ImageFormat[]).map((format) => (
                    <button
                      key={format}
                      onClick={() => setOutputFormat(format)}
                      className={`py-3 px-4 rounded font-sans font-medium transition-colors ${
                        outputFormat === format ? "bg-[#13947D] text-white" : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {!convertedUrl ? (
                <Button
                  onClick={convertImage}
                  disabled={isConverting}
                  className="w-full bg-[#2C74E5] hover:bg-[#2C74E5]/80 text-white font-sans text-lg py-6"
                >
                  {isConverting ? "Converting..." : "Convert Image"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[#13947D]/20 border border-[#13947D] rounded-lg">
                    <p className="text-[#13947D] font-sans font-medium">Conversion complete!</p>
                  </div>
                  <Button
                    onClick={downloadImage}
                    className="w-full bg-[#CCADAC] hover:bg-[#CCADAC]/80 text-black font-sans text-lg py-6"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download {outputFormat.toUpperCase()}
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/10 font-sans bg-transparent"
                  >
                    Convert Another Image
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
