"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Download, X, Minimize } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { USPs } from "@/components/usps"
import { Footer } from "@/components/footer"
import { UploadArea } from "@/components/upload-area"
import { Slider } from "@/components/ui/slider"
import gsap from "gsap"

const C = "#F59E0B" // amber

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
  const [baseCropBoxSize, setBaseCropBoxSize] = useState({ width: 400, height: 300 })
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [isDraggingCropBox, setIsDraggingCropBox] = useState(false)
  const [isResizingCropBox, setIsResizingCropBox] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>("")
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const zoomRef = useRef(zoom)
  const cropBoxSizeRef = useRef(cropBoxSize)
  const cropBoxPositionRef = useRef(cropBoxPosition)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { cropBoxSizeRef.current = cropBoxSize }, [cropBoxSize])
  useEffect(() => { cropBoxPositionRef.current = cropBoxPosition }, [cropBoxPosition])

  // Panel entrance
  useEffect(() => {
    if (!selectedFile || !panelRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (rm) return
    gsap.fromTo(panelRef.current, { y: 50, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" })
  }, [selectedFile])

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
    setSelectedFile(file); setCroppedUrl(""); setZoom(100); setImagePosition({ x: 0, y: 0 }); setImageLoaded(false)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }

  const updateContainerSize = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setContainerSize({ width: rect.width, height: rect.height })
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageNaturalSize({ width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight })
      setImageLoaded(true)
      updateContainerSize()
      const aspectRatio = cropWidth / cropHeight
      const maxSize = Math.min(containerSize.width * 0.3, containerSize.height * 0.3)
      const boxWidth = maxSize
      const boxHeight = boxWidth / aspectRatio
      setCropBoxSize({ width: boxWidth, height: boxHeight })
      setCropBoxPosition({ x: (containerSize.width - boxWidth) / 2, y: (containerSize.height - boxHeight) / 2 })
    }
  }

  useEffect(() => {
    updateContainerSize()
    const handleResize = () => updateContainerSize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !imageLoaded) return
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault(); e.stopPropagation()
      const delta = e.deltaY > 0 ? -5 : 5
      const oldZoom = zoomRef.current
      const newZoom = Math.max(50, Math.min(200, oldZoom + delta))
      if (newZoom === oldZoom) return
      const currentSize = cropBoxSizeRef.current
      const currentPos = cropBoxPositionRef.current
      const currentBaseWidth = currentSize.width / (oldZoom / 100)
      const currentBaseHeight = currentSize.height / (oldZoom / 100)
      const newScaledWidth = currentBaseWidth * (newZoom / 100)
      const newScaledHeight = currentBaseHeight * (newZoom / 100)
      const currentCenterX = currentPos.x + currentSize.width / 2
      const currentCenterY = currentPos.y + currentSize.height / 2
      setZoom(newZoom); setPreviousZoom(newZoom)
      setBaseCropBoxSize({ width: currentBaseWidth, height: currentBaseHeight })
      setCropBoxSize({ width: newScaledWidth, height: newScaledHeight })
      setCropBoxPosition({ x: currentCenterX - newScaledWidth / 2, y: currentCenterY - newScaledHeight / 2 })
    }
    container.addEventListener("wheel", wheelHandler, { passive: false })
    return () => { container.removeEventListener("wheel", wheelHandler) }
  }, [imageLoaded])

  useEffect(() => {
    if (imageLoaded && containerSize.width > 0 && containerSize.height > 0) {
      const aspectRatio = cropWidth / cropHeight
      const maxSize = Math.min(containerSize.width * 0.3, containerSize.height * 0.3)
      const boxWidth = maxSize
      const boxHeight = boxWidth / aspectRatio
      setBaseCropBoxSize((prev) => prev.width === 400 && prev.height === 300 ? { width: boxWidth, height: boxHeight } : prev)
      setCropBoxSize((prev) => {
        const nw = boxWidth * (zoom / 100); const nh = boxHeight * (zoom / 100)
        return prev.width === 400 && prev.height === 300 ? { width: nw, height: nh } : prev
      })
    }
  }, [cropWidth, cropHeight, imageLoaded, containerSize, zoom])

  const getBaseImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }
    const iar = imageNaturalSize.width / imageNaturalSize.height
    const car = containerSize.width / containerSize.height
    if (iar > car) return { width: containerSize.width, height: containerSize.width / iar }
    return { width: containerSize.height * iar, height: containerSize.height }
  }

  const getImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }
    return getBaseImageDisplaySize()
  }

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.target !== imageRef.current) return
    e.preventDefault(); setIsDraggingImage(true)
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
  }

  const handleCropBoxMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    e.preventDefault(); e.stopPropagation(); setIsDraggingCropBox(true)
    const rect = containerRef.current.getBoundingClientRect()
    setDragStart({ x: e.clientX - rect.left - cropBoxPosition.x, y: e.clientY - rect.top - cropBoxPosition.y })
  }

  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!containerRef.current) return
    e.preventDefault(); e.stopPropagation(); setIsResizingCropBox(true); setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const performResize = (deltaX: number, deltaY: number, handle: string, cWidth: number, cHeight: number) => {
    const aspectRatio = cropWidth / cropHeight
    const scale = zoom / 100
    const currentScaledWidth = baseCropBoxSize.width * scale
    const currentScaledHeight = baseCropBoxSize.height * scale
    let newBaseWidth = baseCropBoxSize.width, newBaseHeight = baseCropBoxSize.height
    let newX = cropBoxPosition.x, newY = cropBoxPosition.y

    if (handle === "bottom-right") {
      const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY > 0 ? 1 : -1)
      const nsw = Math.max(50, Math.min(cWidth - cropBoxPosition.x, currentScaledWidth + d))
      newBaseWidth = nsw / scale; newBaseHeight = (nsw / aspectRatio) / scale
    } else if (handle === "top-left") {
      const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY < 0 ? -1 : 1)
      const oldRight = cropBoxPosition.x + currentScaledWidth, oldBottom = cropBoxPosition.y + currentScaledHeight
      const nsw = Math.max(50, Math.min(oldRight, currentScaledWidth - d))
      newBaseWidth = nsw / scale; newBaseHeight = (nsw / aspectRatio) / scale
      newX = oldRight - nsw; newY = oldBottom - nsw / aspectRatio
    } else if (handle === "top-right") {
      const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY < 0 ? 1 : -1)
      const oldBottom = cropBoxPosition.y + currentScaledHeight
      const nsw = Math.max(50, Math.min(cWidth - cropBoxPosition.x, currentScaledWidth + d))
      newBaseWidth = nsw / scale; newBaseHeight = (nsw / aspectRatio) / scale
      newY = oldBottom - nsw / aspectRatio
    } else if (handle === "bottom-left") {
      const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY > 0 ? -1 : 1)
      const oldRight = cropBoxPosition.x + currentScaledWidth
      const nsw = Math.max(50, Math.min(oldRight, currentScaledWidth - d))
      newBaseWidth = nsw / scale; newBaseHeight = (nsw / aspectRatio) / scale
      newX = oldRight - nsw
    }

    const fw = newBaseWidth * scale, fh = newBaseHeight * scale
    if (fw >= 50 && fh >= 50 && newX >= 0 && newY >= 0 && newX + fw <= cWidth && newY + fh <= cHeight) {
      setBaseCropBoxSize({ width: newBaseWidth, height: newBaseHeight })
      setCropBoxSize({ width: fw, height: fh })
      setCropBoxPosition({ x: newX, y: newY })
      return true
    }
    return false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    if (isDraggingImage) {
      setImagePosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    } else if (isDraggingCropBox) {
      const rect = containerRef.current.getBoundingClientRect()
      setCropBoxPosition({
        x: Math.max(0, Math.min(containerSize.width - cropBoxSize.width, e.clientX - rect.left - dragStart.x)),
        y: Math.max(0, Math.min(containerSize.height - cropBoxSize.height, e.clientY - rect.top - dragStart.y)),
      })
    } else if (isResizingCropBox) {
      if (performResize(e.clientX - dragStart.x, e.clientY - dragStart.y, resizeHandle, containerSize.width, containerSize.height)) {
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }

  const handleMouseUp = () => { setIsDraggingImage(false); setIsDraggingCropBox(false); setIsResizingCropBox(false) }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingImage) {
        setImagePosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
      } else if (isDraggingCropBox) {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setCropBoxPosition({
          x: Math.max(0, Math.min(rect.width - cropBoxSize.width, e.clientX - rect.left - dragStart.x)),
          y: Math.max(0, Math.min(rect.height - cropBoxSize.height, e.clientY - rect.top - dragStart.y)),
        })
      } else if (isResizingCropBox) {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        if (performResize(e.clientX - dragStart.x, e.clientY - dragStart.y, resizeHandle, rect.width, rect.height)) {
          setDragStart({ x: e.clientX, y: e.clientY })
        }
      }
    }
    const handleGlobalMouseUp = () => { setIsDraggingImage(false); setIsDraggingCropBox(false); setIsResizingCropBox(false) }
    if (isDraggingImage || isDraggingCropBox || isResizingCropBox) {
      window.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("mouseup", handleGlobalMouseUp)
    }
    return () => { window.removeEventListener("mousemove", handleGlobalMouseMove); window.removeEventListener("mouseup", handleGlobalMouseUp) }
  }, [isDraggingImage, isDraggingCropBox, isResizingCropBox, dragStart, containerSize, cropBoxSize, cropBoxPosition, cropWidth, cropHeight, resizeHandle, baseCropBoxSize, zoom])

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0]; const oldZoom = zoom
    if (newZoom === oldZoom) return
    const cbw = cropBoxSize.width / (oldZoom / 100), cbh = cropBoxSize.height / (oldZoom / 100)
    const nsw = cbw * (newZoom / 100), nsh = cbh * (newZoom / 100)
    const cx = cropBoxPosition.x + cropBoxSize.width / 2, cy = cropBoxPosition.y + cropBoxSize.height / 2
    setZoom(newZoom); setPreviousZoom(newZoom)
    setBaseCropBoxSize({ width: cbw, height: cbh })
    setCropBoxSize({ width: nsw, height: nsh })
    setCropBoxPosition({ x: cx - nsw / 2, y: cy - nsh / 2 })
  }

  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return
    const ids = getImageDisplaySize()
    const sw = ids.width * (zoom / 100), sh = ids.height * (zoom / 100)
    if (sw <= containerSize.width && sh <= containerSize.height) { setImagePosition({ x: 0, y: 0 }); return }
    const minX = containerSize.width - sw, minY = containerSize.height - sh
    setImagePosition((prev) => {
      const cx = Math.max(minX, Math.min(0, prev.x)), cy = Math.max(minY, Math.min(0, prev.y))
      return prev.x !== cx || prev.y !== cy ? { x: cx, y: cy } : prev
    })
  }, [containerSize, imageLoaded, zoom])

  const cropAndDownloadImage = async () => {
    if (!previewUrl || !imageLoaded || !containerRef.current) return
    const img = new window.Image(); img.crossOrigin = "anonymous"
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = previewUrl })
    const canvas = document.createElement("canvas"); canvas.width = cropWidth; canvas.height = cropHeight
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Could not get canvas context")
    const ids = getImageDisplaySize()
    const sw = ids.width * (zoom / 100), sh = ids.height * (zoom / 100)
    const il = (containerSize.width - sw) / 2 + imagePosition.x, it = (containerSize.height - sh) / 2 + imagePosition.y
    const cxi = cropBoxPosition.x - il, cyi = cropBoxPosition.y - it
    const scaleX = imageNaturalSize.width / sw, scaleY = imageNaturalSize.height / sh
    const sx = Math.max(0, cxi * scaleX), sy = Math.max(0, cyi * scaleY)
    const swidth = Math.min(imageNaturalSize.width - sx, cropBoxSize.width * scaleX)
    const sheight = Math.min(imageNaturalSize.height - sy, cropBoxSize.height * scaleY)
    ctx.drawImage(img, sx, sy, swidth, sheight, 0, 0, cropWidth, cropHeight)
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob); setCroppedUrl(url)
        const link = document.createElement("a"); link.href = url
        link.download = `${selectedFile?.name.split(".")[0] || "cropped"}-${cropWidth}x${cropHeight}.png`
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
      }
    }, "image/png", 1.0)
  }

  const reset = () => {
    setSelectedFile(null); setPreviewUrl(""); setCroppedUrl(""); setZoom(100)
    setImagePosition({ x: 0, y: 0 }); setImageLoaded(false)
    if (croppedUrl) URL.revokeObjectURL(croppedUrl)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      try { await (containerRef.current.requestFullscreen?.() || (containerRef.current as any).webkitRequestFullscreen?.()) } catch {}
    } else {
      try { await (document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.()) } catch {}
    }
  }

  useEffect(() => {
    const handler = () => {
      const isCurrent = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (isCurrent !== isFullscreen && containerRef.current) {
        const ow = containerSize.width, oh = containerSize.height
        setIsFullscreen(isCurrent)
        setTimeout(() => {
          if (containerRef.current) {
            const r = containerRef.current.getBoundingClientRect()
            if (ow > 0 && oh > 0 && r.width > 0 && r.height > 0) {
              const sx = r.width / ow, sy = r.height / oh
              setCropBoxPosition((p) => ({ x: p.x * sx, y: p.y * sy }))
              setBaseCropBoxSize((p) => ({ width: p.width * sx, height: p.height * sy }))
              setCropBoxSize((p) => ({ width: p.width * sx, height: p.height * sy }))
            }
          }
          updateContainerSize()
        }, 100)
      } else { setIsFullscreen(isCurrent); setTimeout(updateContainerSize, 100) }
    }
    document.addEventListener("fullscreenchange", handler)
    document.addEventListener("webkitfullscreenchange", handler)
    return () => { document.removeEventListener("fullscreenchange", handler); document.removeEventListener("webkitfullscreenchange", handler) }
  }, [isFullscreen, containerSize])

  const imageDisplaySize = getImageDisplaySize()

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#06060B", color: "#EEEEF2" }}>
      <div className="mx-auto max-w-5xl px-4 md:px-10">
        <Header activeTab="cropper" />
        <NavigationTabs />

        {!selectedFile ? (
          <UploadArea mode="cropper" dragActive={dragActive} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onFileSelect={handleFileInput} />
        ) : (
          <div ref={panelRef} className="opacity-0">
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

              <div className="p-5 md:p-10">
                {/* Controls row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="crop-width" className="font-sans text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#3f3f50" }}>Width</Label>
                    <Input id="crop-width" type="number" min="1" value={cropWidth} onChange={(e) => setCropWidth(Number.parseInt(e.target.value) || 1)} className="bg-[#06060B] border-[#1A1A28] text-[#EEEEF2] font-mono text-sm h-10" />
                  </div>
                  <div>
                    <Label htmlFor="crop-height" className="font-sans text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#3f3f50" }}>Height</Label>
                    <Input id="crop-height" type="number" min="1" value={cropHeight} onChange={(e) => setCropHeight(Number.parseInt(e.target.value) || 1)} className="bg-[#06060B] border-[#1A1A28] text-[#EEEEF2] font-mono text-sm h-10" />
                  </div>
                  {previewUrl && imageLoaded && (
                    <div className="col-span-2">
                      <Label className="font-sans text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "#3f3f50" }}>Zoom {zoom}%</Label>
                      <Slider
                        value={[zoom]} onValueChange={handleZoomChange} min={50} max={200} step={5}
                        className="mt-3 [&_[data-slot=slider-track]]:bg-[#1A1A28] [&_[data-slot=slider-range]]:bg-[#F59E0B] [&_[data-slot=slider-thumb]]:border-[#F59E0B] [&_[data-slot=slider-thumb]]:bg-[#06060B]"
                      />
                    </div>
                  )}
                </div>

                {/* Crop canvas */}
                <div className="mb-6">
                  {isFullscreen && (
                    <div className="fixed top-0 left-0 right-0 z-50 p-4" style={{ background: "#06060Bee", borderBottom: "1px solid #1A1A28", backdropFilter: "blur(12px)" }}>
                      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-serif text-lg">Crop</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="crop-width-fs" className="font-sans text-[10px]" style={{ color: "#52525B" }}>W</Label>
                              <Input id="crop-width-fs" type="number" min="1" value={cropWidth} onChange={(e) => setCropWidth(Number.parseInt(e.target.value) || 1)} className="bg-[#0E0E18] border-[#1A1A28] text-[#EEEEF2] font-mono text-xs w-20 h-8" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="crop-height-fs" className="font-sans text-[10px]" style={{ color: "#52525B" }}>H</Label>
                              <Input id="crop-height-fs" type="number" min="1" value={cropHeight} onChange={(e) => setCropHeight(Number.parseInt(e.target.value) || 1)} className="bg-[#0E0E18] border-[#1A1A28] text-[#EEEEF2] font-mono text-xs w-20 h-8" />
                            </div>
                          </div>
                          {previewUrl && imageLoaded && (
                            <div className="flex items-center gap-2 flex-1 max-w-xs">
                              <Label className="font-sans text-[10px] whitespace-nowrap" style={{ color: "#52525B" }}>Zoom {zoom}%</Label>
                              <Slider value={[zoom]} onValueChange={handleZoomChange} min={50} max={200} step={5} className="flex-1 [&_[data-slot=slider-track]]:bg-[#1A1A28] [&_[data-slot=slider-range]]:bg-[#F59E0B] [&_[data-slot=slider-thumb]]:border-[#F59E0B]" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={cropAndDownloadImage} disabled={!imageLoaded} className="flex items-center gap-2 px-5 py-2 rounded-xl font-sans text-xs font-semibold" style={{ background: C, color: "#06060B" }}>
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-xs" style={{ border: "1px solid #1A1A28", color: "#52525B" }}>
                            <Minimize className="w-3.5 h-3.5" /> Exit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    ref={containerRef}
                    className={`relative rounded-2xl overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : "mx-auto"}`}
                    style={{
                      width: isFullscreen ? "100vw" : "100%",
                      maxWidth: isFullscreen ? "100vw" : "100%",
                      height: isFullscreen ? "calc(100vh - 80px)" : "420px",
                      marginTop: isFullscreen ? "80px" : "0",
                      border: isFullscreen ? "none" : "1px solid #1A1A28",
                      backgroundImage: `linear-gradient(45deg, #16162a 25%, transparent 25%, transparent 75%, #16162a 75%), linear-gradient(45deg, #16162a 25%, transparent 25%, transparent 75%, #16162a 75%)`,
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 10px 10px",
                      backgroundColor: "#0c0c1a",
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => { handleMouseUp(); document.body.style.overflow = "" }}
                    onMouseEnter={() => { document.body.style.overflow = "hidden" }}
                  >
                    {previewUrl && (
                      <img
                        ref={imageRef} src={previewUrl} alt="Crop preview" onLoad={handleImageLoad}
                        className={`absolute select-none ${isDraggingImage ? "cursor-grabbing" : "cursor-move"}`}
                        style={{
                          width: `${imageDisplaySize.width}px`, height: `${imageDisplaySize.height}px`,
                          left: `${(containerSize.width - imageDisplaySize.width) / 2 + imagePosition.x}px`,
                          top: `${(containerSize.height - imageDisplaySize.height) / 2 + imagePosition.y}px`,
                          transform: `scale(${zoom / 100})`, transformOrigin: "center center",
                        }}
                        draggable={false} onMouseDown={handleImageMouseDown}
                      />
                    )}

                    <div
                      className="absolute"
                      style={{
                        left: `${cropBoxPosition.x}px`, top: `${cropBoxPosition.y}px`,
                        width: `${cropBoxSize.width}px`, height: `${cropBoxSize.height}px`,
                        cursor: isDraggingCropBox ? "grabbing" : "move",
                        border: `2px solid ${C}`,
                        background: `${C}08`,
                        boxShadow: `0 0 0 9999px rgba(6,6,11,0.6), 0 0 20px ${C}15`,
                      }}
                      onMouseDown={handleCropBoxMouseDown}
                    >
                      {["top-left", "top-right", "bottom-left", "bottom-right"].map((h) => (
                        <div
                          key={h}
                          className={`absolute w-3 h-3 rounded-sm ${h.includes("left") ? "-left-[5px]" : "-right-[5px]"} ${h.includes("top") ? "-top-[5px]" : "-bottom-[5px]"}`}
                          style={{ background: C, cursor: h === "top-left" || h === "bottom-right" ? "nwse-resize" : "nesw-resize" }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, h)}
                        />
                      ))}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-0.5 rounded font-mono text-[10px] whitespace-nowrap" style={{ background: "#06060Bee", color: "#52525B" }}>
                        {cropWidth} x {cropHeight}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] mt-3 text-center font-sans" style={{ color: "#3f3f50" }}>
                    Drag image to move &middot; Drag crop box to reposition &middot; Corners to resize &middot; Scroll to zoom
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={cropAndDownloadImage} disabled={!imageLoaded}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-50"
                    style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}
                  >
                    <Download className="w-4 h-4" /> Download Crop
                  </button>
                  <button onClick={reset} className="px-6 py-4 rounded-2xl font-sans text-xs font-medium transition-colors" style={{ border: "1px solid #1A1A28", color: "#52525B" }}>
                    Reset
                  </button>
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
