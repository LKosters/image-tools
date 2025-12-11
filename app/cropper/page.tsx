"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { USPs } from "@/components/usps"
import { Footer } from "@/components/footer"
import { UploadArea } from "@/components/upload-area"
import { Slider } from "@/components/ui/slider"

export default function CropperPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [croppedUrl, setCroppedUrl] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)
  const [cropWidth, setCropWidth] = useState<number>(800)
  const [cropHeight, setCropHeight] = useState<number>(600)
  const [zoom, setZoom] = useState<number>(100)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [previousZoom, setPreviousZoom] = useState<number>(100)
  const [cropBoxPosition, setCropBoxPosition] = useState({ x: 0, y: 0 })
  const [cropBoxSize, setCropBoxSize] = useState({ width: 400, height: 300 })
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [isDraggingCropBox, setIsDraggingCropBox] = useState(false)
  const [isResizingCropBox, setIsResizingCropBox] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

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
    setCroppedUrl("")
    setZoom(100)
    setImagePosition({ x: 0, y: 0 })
    setImageLoaded(false)

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

  const updateContainerSize = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setContainerSize({ width: rect.width, height: rect.height })
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
      setImageLoaded(true)
      updateContainerSize()

      const aspectRatio = cropWidth / cropHeight
      const maxSize = Math.min(containerSize.width * 0.8, containerSize.height * 0.8)
      const boxWidth = maxSize
      const boxHeight = boxWidth / aspectRatio

      setCropBoxSize({ width: boxWidth, height: boxHeight })
      setCropBoxPosition({
        x: (containerSize.width - boxWidth) / 2,
        y: (containerSize.height - boxHeight) / 2,
      })
    }
  }

  useEffect(() => {
    updateContainerSize()
    const handleResize = () => updateContainerSize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (imageLoaded) {
      const aspectRatio = cropWidth / cropHeight
      const newWidth = cropBoxSize.height * aspectRatio
      setCropBoxSize((prev) => ({ width: newWidth, height: prev.height }))
    }
  }, [cropWidth, cropHeight])

  const getImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }

    const baseSize = getBaseImageDisplaySize()
    return { width: baseSize.width * (zoom / 100), height: baseSize.height * (zoom / 100) }
  }

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.target !== imageRef.current) return
    e.preventDefault()
    setIsDraggingImage(true)
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
  }

  const handleCropBoxMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingCropBox(true)
    const rect = containerRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left - cropBoxPosition.x,
      y: e.clientY - rect.top - cropBoxPosition.y,
    })
  }

  const handleResizeHandleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizingCropBox(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    if (isDraggingImage) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    } else if (isDraggingCropBox) {
      const rect = containerRef.current.getBoundingClientRect()
      const newX = e.clientX - rect.left - dragStart.x
      const newY = e.clientY - rect.top - dragStart.y

      setCropBoxPosition({
        x: Math.max(0, Math.min(containerSize.width - cropBoxSize.width, newX)),
        y: Math.max(0, Math.min(containerSize.height - cropBoxSize.height, newY)),
      })
    } else if (isResizingCropBox) {
      const aspectRatio = cropWidth / cropHeight
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY > 0 ? 1 : -1)

      const newWidth = Math.max(50, Math.min(containerSize.width, cropBoxSize.width + delta))
      const newHeight = newWidth / aspectRatio

      if (newWidth <= containerSize.width && newHeight <= containerSize.height) {
        setCropBoxSize({ width: newWidth, height: newHeight })
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDraggingImage(false)
    setIsDraggingCropBox(false)
    setIsResizingCropBox(false)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingImage) {
        setImagePosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      } else if (isDraggingCropBox) {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const newX = e.clientX - rect.left - dragStart.x
        const newY = e.clientY - rect.top - dragStart.y

        setCropBoxPosition({
          x: Math.max(0, Math.min(rect.width - cropBoxSize.width, newX)),
          y: Math.max(0, Math.min(rect.height - cropBoxSize.height, newY)),
        })
      } else if (isResizingCropBox) {
        const aspectRatio = cropWidth / cropHeight
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY > 0 ? 1 : -1)

        const newWidth = Math.max(50, Math.min(containerSize.width, cropBoxSize.width + delta))
        const newHeight = newWidth / aspectRatio

        if (newWidth <= containerSize.width && newHeight <= containerSize.height) {
          setCropBoxSize({ width: newWidth, height: newHeight })
          setDragStart({ x: e.clientX, y: e.clientY })
        }
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDraggingImage(false)
      setIsDraggingCropBox(false)
      setIsResizingCropBox(false)
    }

    if (isDraggingImage || isDraggingCropBox || isResizingCropBox) {
      window.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("mouseup", handleGlobalMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDraggingImage, isDraggingCropBox, isResizingCropBox, dragStart, containerSize, cropBoxSize, cropWidth, cropHeight])

  const getBaseImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }

    const imageAspectRatio = imageNaturalSize.width / imageNaturalSize.height
    const containerAspectRatio = containerSize.width / containerSize.height

    const baseWidth = containerSize.width
    const baseHeight = containerSize.height

    let displayWidth = baseWidth
    let displayHeight = baseHeight

    if (imageAspectRatio > containerAspectRatio) {
      displayWidth = baseWidth
      displayHeight = baseWidth / imageAspectRatio
    } else {
      displayWidth = baseHeight * imageAspectRatio
      displayHeight = baseHeight
    }

    return { width: displayWidth, height: displayHeight }
  }

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0]
    const oldZoom = previousZoom
    setZoom(newZoom)
    setPreviousZoom(newZoom)

    if (!imageLoaded || oldZoom === newZoom) return

    const baseSize = getBaseImageDisplaySize()
    const oldWidth = baseSize.width * (oldZoom / 100)
    const oldHeight = baseSize.height * (oldZoom / 100)
    const newWidth = baseSize.width * (newZoom / 100)
    const newHeight = baseSize.height * (newZoom / 100)

    if (newWidth <= containerSize.width && newHeight <= containerSize.height) {
      setImagePosition({ x: 0, y: 0 })
      return
    }

    const oldCenterX = (containerSize.width - oldWidth) / 2 + imagePosition.x
    const oldCenterY = (containerSize.height - oldHeight) / 2 + imagePosition.y

    const newPosX = oldCenterX - (containerSize.width - newWidth) / 2
    const newPosY = oldCenterY - (containerSize.height - newHeight) / 2

    const minX = containerSize.width - newWidth
    const minY = containerSize.height - newHeight

    setImagePosition({
      x: Math.max(minX, Math.min(0, newPosX)),
      y: Math.max(minY, Math.min(0, newPosY)),
    })
  }

  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return

    const imageDisplaySize = getImageDisplaySize()
    
    if (imageDisplaySize.width <= containerSize.width && imageDisplaySize.height <= containerSize.height) {
      setImagePosition({ x: 0, y: 0 })
      return
    }

    const minX = containerSize.width - imageDisplaySize.width
    const minY = containerSize.height - imageDisplaySize.height
    
    setImagePosition((prev) => {
      const constrainedX = Math.max(minX, Math.min(0, prev.x))
      const constrainedY = Math.max(minY, Math.min(0, prev.y))
      
      if (prev.x !== constrainedX || prev.y !== constrainedY) {
        return { x: constrainedX, y: constrainedY }
      }
      
      return prev
    })
  }, [containerSize, imageLoaded])

  const cropImage = async () => {
    if (!previewUrl || !imageLoaded || !containerRef.current) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = previewUrl
    })

    const canvas = document.createElement("canvas")
    canvas.width = cropWidth
    canvas.height = cropHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get canvas context")

    const imageDisplaySize = getImageDisplaySize()
    const containerRect = containerRef.current.getBoundingClientRect()

    const cropBoxLeft = cropBoxPosition.x - containerRect.left
    const cropBoxTop = cropBoxPosition.y - containerRect.top

    const imageLeft = (containerSize.width - imageDisplaySize.width) / 2 + imagePosition.x
    const imageTop = (containerSize.height - imageDisplaySize.height) / 2 + imagePosition.y

    const cropXInImage = cropBoxLeft - imageLeft
    const cropYInImage = cropBoxTop - imageTop

    const scaleX = imageNaturalSize.width / imageDisplaySize.width
    const scaleY = imageNaturalSize.height / imageDisplaySize.height

    const sourceX = Math.max(0, cropXInImage * scaleX)
    const sourceY = Math.max(0, cropYInImage * scaleY)
    const sourceWidth = Math.min(imageNaturalSize.width - sourceX, (cropBoxSize.width * scaleX))
    const sourceHeight = Math.min(imageNaturalSize.height - sourceY, (cropBoxSize.height * scaleY))

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, cropWidth, cropHeight)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setCroppedUrl(url)
        }
      },
      "image/png",
      1.0,
    )
  }

  const downloadImage = () => {
    if (!croppedUrl) return

    const link = document.createElement("a")
    link.href = croppedUrl
    const originalName = selectedFile?.name.split(".")[0] || "cropped"
    link.download = `${originalName}-${cropWidth}x${cropHeight}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const reset = () => {
    setSelectedFile(null)
    setPreviewUrl("")
    setCroppedUrl("")
    setZoom(100)
    setImagePosition({ x: 0, y: 0 })
    setImageLoaded(false)
    if (croppedUrl) {
      URL.revokeObjectURL(croppedUrl)
    }
  }

  const imageDisplaySize = getImageDisplaySize()
  const aspectRatio = cropWidth / cropHeight

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Header activeTab="cropper" />
        <NavigationTabs />

        {!selectedFile ? (
          <UploadArea
            mode="cropper"
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
                <h3 className="font-serif text-2xl mb-2">Crop Image</h3>
                <p className="text-white/60 font-sans text-sm">
                  {selectedFile.name} • {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="crop-width" className="font-sans text-sm mb-2 block">
                    Width (px)
                  </Label>
                  <Input
                    id="crop-width"
                    type="number"
                    min="1"
                    value={cropWidth}
                    onChange={(e) => setCropWidth(Number.parseInt(e.target.value) || 1)}
                    className="bg-white/10 border-white/20 text-white font-sans"
                  />
                </div>
                <div>
                  <Label htmlFor="crop-height" className="font-sans text-sm mb-2 block">
                    Height (px)
                  </Label>
                  <Input
                    id="crop-height"
                    type="number"
                    min="1"
                    value={cropHeight}
                    onChange={(e) => setCropHeight(Number.parseInt(e.target.value) || 1)}
                    className="bg-white/10 border-white/20 text-white font-sans"
                  />
                </div>
              </div>

              {previewUrl && imageLoaded && (
                <div className="mb-6">
                  <Label className="font-sans text-sm mb-2 block">Zoom: {zoom}%</Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={handleZoomChange}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              <div className="mb-8">
                <div
                  ref={containerRef}
                  className="relative bg-black/50 border-2 border-white/20 rounded overflow-hidden mx-auto"
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    height: "400px",
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {previewUrl && (
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Crop preview"
                      onLoad={handleImageLoad}
                      className={`absolute select-none ${isDraggingImage ? "cursor-grabbing" : "cursor-move"}`}
                      style={{
                        width: `${imageDisplaySize.width}px`,
                        height: `${imageDisplaySize.height}px`,
                        left: `${(containerSize.width - imageDisplaySize.width) / 2 + imagePosition.x}px`,
                        top: `${(containerSize.height - imageDisplaySize.height) / 2 + imagePosition.y}px`,
                        objectFit: "contain",
                      }}
                      draggable={false}
                      onMouseDown={handleImageMouseDown}
                    />
                  )}

                  <div
                    className="absolute border-2 border-[#CCADAC] bg-[#CCADAC]/10"
                    style={{
                      left: `${cropBoxPosition.x}px`,
                      top: `${cropBoxPosition.y}px`,
                      width: `${cropBoxSize.width}px`,
                      height: `${cropBoxSize.height}px`,
                      cursor: isDraggingCropBox ? "grabbing" : "move",
                    }}
                    onMouseDown={handleCropBoxMouseDown}
                  >
                    <div
                      className="absolute -right-1 -bottom-1 w-4 h-4 bg-[#CCADAC] border-2 border-white cursor-nwse-resize"
                      onMouseDown={handleResizeHandleMouseDown}
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full px-2 py-1 bg-black/80 text-white text-xs font-sans whitespace-nowrap mt-1">
                      {cropWidth} × {cropHeight}px
                    </div>
                  </div>
                </div>
                <p className="text-white/40 font-sans text-xs mt-2 text-center">
                  Drag image to move • Drag crop box to reposition • Drag corner to resize
                </p>
              </div>

              {!croppedUrl ? (
                <Button
                  onClick={cropImage}
                  disabled={!imageLoaded}
                  className="w-full bg-[#CCADAC] hover:bg-[#CCADAC]/80 text-black font-sans text-lg py-6"
                >
                  Crop Image
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[#CCADAC]/20 border border-[#CCADAC] rounded-lg">
                    <p className="text-[#CCADAC] font-sans font-medium">Crop complete!</p>
                  </div>
                  <Button
                    onClick={downloadImage}
                    className="w-full bg-[#CCADAC] hover:bg-[#CCADAC]/80 text-black font-sans text-lg py-6"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Cropped Image
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/10 font-sans bg-transparent"
                  >
                    Crop Another Image
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
