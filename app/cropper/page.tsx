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

const C = "#F59E0B"

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

  useEffect(() => {
    if (!selectedFile || !panelRef.current) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (rm) return
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
      setImageLoaded(true); updateContainerSize()
      const aspectRatio = cropWidth / cropHeight
      const maxSize = Math.min(containerSize.width * 0.3, containerSize.height * 0.3)
      const boxWidth = maxSize, boxHeight = boxWidth / aspectRatio
      setCropBoxSize({ width: boxWidth, height: boxHeight })
      setCropBoxPosition({ x: (containerSize.width - boxWidth) / 2, y: (containerSize.height - boxHeight) / 2 })
    }
  }

  useEffect(() => { updateContainerSize(); const h = () => updateContainerSize(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h) }, [])

  useEffect(() => {
    const container = containerRef.current; if (!container || !imageLoaded) return
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault(); e.stopPropagation()
      const delta = e.deltaY > 0 ? -5 : 5, oldZoom = zoomRef.current, newZoom = Math.max(50, Math.min(200, oldZoom + delta))
      if (newZoom === oldZoom) return
      const cs = cropBoxSizeRef.current, cp = cropBoxPositionRef.current
      const cbw = cs.width / (oldZoom / 100), cbh = cs.height / (oldZoom / 100)
      const nsw = cbw * (newZoom / 100), nsh = cbh * (newZoom / 100)
      const cx = cp.x + cs.width / 2, cy = cp.y + cs.height / 2
      setZoom(newZoom); setPreviousZoom(newZoom)
      setBaseCropBoxSize({ width: cbw, height: cbh }); setCropBoxSize({ width: nsw, height: nsh })
      setCropBoxPosition({ x: cx - nsw / 2, y: cy - nsh / 2 })
    }
    container.addEventListener("wheel", wheelHandler, { passive: false })
    return () => { container.removeEventListener("wheel", wheelHandler) }
  }, [imageLoaded])

  useEffect(() => {
    if (imageLoaded && containerSize.width > 0 && containerSize.height > 0) {
      const ar = cropWidth / cropHeight, ms = Math.min(containerSize.width * 0.3, containerSize.height * 0.3)
      const bw = ms, bh = bw / ar
      setBaseCropBoxSize((p) => p.width === 400 && p.height === 300 ? { width: bw, height: bh } : p)
      setCropBoxSize((p) => p.width === 400 && p.height === 300 ? { width: bw * (zoom / 100), height: bh * (zoom / 100) } : p)
    }
  }, [cropWidth, cropHeight, imageLoaded, containerSize, zoom])

  const getBaseImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }
    const iar = imageNaturalSize.width / imageNaturalSize.height, car = containerSize.width / containerSize.height
    return iar > car ? { width: containerSize.width, height: containerSize.width / iar } : { width: containerSize.height * iar, height: containerSize.height }
  }
  const getImageDisplaySize = () => getBaseImageDisplaySize()

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.target !== imageRef.current) return; e.preventDefault()
    setIsDraggingImage(true); setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
  }
  const handleCropBoxMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return; e.preventDefault(); e.stopPropagation()
    setIsDraggingCropBox(true); const r = containerRef.current.getBoundingClientRect()
    setDragStart({ x: e.clientX - r.left - cropBoxPosition.x, y: e.clientY - r.top - cropBoxPosition.y })
  }
  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!containerRef.current) return; e.preventDefault(); e.stopPropagation()
    setIsResizingCropBox(true); setResizeHandle(handle); setDragStart({ x: e.clientX, y: e.clientY })
  }

  const performResize = (deltaX: number, deltaY: number, handle: string, cW: number, cH: number) => {
    const ar = cropWidth / cropHeight, scale = zoom / 100
    const csw = baseCropBoxSize.width * scale, csh = baseCropBoxSize.height * scale
    let nbw = baseCropBoxSize.width, nbh = baseCropBoxSize.height, nx = cropBoxPosition.x, ny = cropBoxPosition.y
    if (handle === "bottom-right") { const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY > 0 ? 1 : -1); const nsw = Math.max(50, Math.min(cW - nx, csw + d)); nbw = nsw / scale; nbh = (nsw / ar) / scale }
    else if (handle === "top-left") { const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY < 0 ? -1 : 1); const oR = nx + csw, oB = ny + csh; const nsw = Math.max(50, Math.min(oR, csw - d)); nbw = nsw / scale; nbh = (nsw / ar) / scale; nx = oR - nsw; ny = oB - nsw / ar }
    else if (handle === "top-right") { const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY < 0 ? 1 : -1); const oB = ny + csh; const nsw = Math.max(50, Math.min(cW - nx, csw + d)); nbw = nsw / scale; nbh = (nsw / ar) / scale; ny = oB - nsw / ar }
    else if (handle === "bottom-left") { const d = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY > 0 ? -1 : 1); const oR = nx + csw; const nsw = Math.max(50, Math.min(oR, csw - d)); nbw = nsw / scale; nbh = (nsw / ar) / scale; nx = oR - nsw }
    const fw = nbw * scale, fh = nbh * scale
    if (fw >= 50 && fh >= 50 && nx >= 0 && ny >= 0 && nx + fw <= cW && ny + fh <= cH) {
      setBaseCropBoxSize({ width: nbw, height: nbh }); setCropBoxSize({ width: fw, height: fh }); setCropBoxPosition({ x: nx, y: ny }); return true
    }
    return false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    if (isDraggingImage) setImagePosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    else if (isDraggingCropBox) { const r = containerRef.current.getBoundingClientRect(); setCropBoxPosition({ x: Math.max(0, Math.min(containerSize.width - cropBoxSize.width, e.clientX - r.left - dragStart.x)), y: Math.max(0, Math.min(containerSize.height - cropBoxSize.height, e.clientY - r.top - dragStart.y)) }) }
    else if (isResizingCropBox) { if (performResize(e.clientX - dragStart.x, e.clientY - dragStart.y, resizeHandle, containerSize.width, containerSize.height)) setDragStart({ x: e.clientX, y: e.clientY }) }
  }
  const handleMouseUp = () => { setIsDraggingImage(false); setIsDraggingCropBox(false); setIsResizingCropBox(false) }

  useEffect(() => {
    const gmm = (e: MouseEvent) => {
      if (isDraggingImage) setImagePosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
      else if (isDraggingCropBox) { if (!containerRef.current) return; const r = containerRef.current.getBoundingClientRect(); setCropBoxPosition({ x: Math.max(0, Math.min(r.width - cropBoxSize.width, e.clientX - r.left - dragStart.x)), y: Math.max(0, Math.min(r.height - cropBoxSize.height, e.clientY - r.top - dragStart.y)) }) }
      else if (isResizingCropBox) { if (!containerRef.current) return; const r = containerRef.current.getBoundingClientRect(); if (performResize(e.clientX - dragStart.x, e.clientY - dragStart.y, resizeHandle, r.width, r.height)) setDragStart({ x: e.clientX, y: e.clientY }) }
    }
    const gmu = () => { setIsDraggingImage(false); setIsDraggingCropBox(false); setIsResizingCropBox(false) }
    if (isDraggingImage || isDraggingCropBox || isResizingCropBox) { window.addEventListener("mousemove", gmm); window.addEventListener("mouseup", gmu) }
    return () => { window.removeEventListener("mousemove", gmm); window.removeEventListener("mouseup", gmu) }
  }, [isDraggingImage, isDraggingCropBox, isResizingCropBox, dragStart, containerSize, cropBoxSize, cropBoxPosition, cropWidth, cropHeight, resizeHandle, baseCropBoxSize, zoom])

  const handleZoomChange = (value: number[]) => {
    const nz = value[0], oz = zoom; if (nz === oz) return
    const cbw = cropBoxSize.width / (oz / 100), cbh = cropBoxSize.height / (oz / 100)
    const nsw = cbw * (nz / 100), nsh = cbh * (nz / 100)
    const cx = cropBoxPosition.x + cropBoxSize.width / 2, cy = cropBoxPosition.y + cropBoxSize.height / 2
    setZoom(nz); setPreviousZoom(nz); setBaseCropBoxSize({ width: cbw, height: cbh })
    setCropBoxSize({ width: nsw, height: nsh }); setCropBoxPosition({ x: cx - nsw / 2, y: cy - nsh / 2 })
  }

  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return
    const ids = getImageDisplaySize(), sw = ids.width * (zoom / 100), sh = ids.height * (zoom / 100)
    if (sw <= containerSize.width && sh <= containerSize.height) { setImagePosition({ x: 0, y: 0 }); return }
    const minX = containerSize.width - sw, minY = containerSize.height - sh
    setImagePosition((p) => { const cx = Math.max(minX, Math.min(0, p.x)), cy = Math.max(minY, Math.min(0, p.y)); return p.x !== cx || p.y !== cy ? { x: cx, y: cy } : p })
  }, [containerSize, imageLoaded, zoom])

  const cropAndDownloadImage = async () => {
    if (!previewUrl || !imageLoaded || !containerRef.current) return
    const img = new window.Image(); img.crossOrigin = "anonymous"
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = previewUrl })
    const canvas = document.createElement("canvas"); canvas.width = cropWidth; canvas.height = cropHeight
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No ctx")
    const ids = getImageDisplaySize(), sw = ids.width * (zoom / 100), sh = ids.height * (zoom / 100)
    const il = (containerSize.width - sw) / 2 + imagePosition.x, it = (containerSize.height - sh) / 2 + imagePosition.y
    const cxi = cropBoxPosition.x - il, cyi = cropBoxPosition.y - it
    const scX = imageNaturalSize.width / sw, scY = imageNaturalSize.height / sh
    const sx = Math.max(0, cxi * scX), sy = Math.max(0, cyi * scY)
    ctx.drawImage(img, sx, sy, Math.min(imageNaturalSize.width - sx, cropBoxSize.width * scX), Math.min(imageNaturalSize.height - sy, cropBoxSize.height * scY), 0, 0, cropWidth, cropHeight)
    canvas.toBlob((blob) => {
      if (blob) { const url = URL.createObjectURL(blob); setCroppedUrl(url); const link = document.createElement("a"); link.href = url; link.download = `${selectedFile?.name.split(".")[0] || "cropped"}-${cropWidth}x${cropHeight}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link) }
    }, "image/png", 1.0)
  }

  const reset = () => { if (croppedUrl) URL.revokeObjectURL(croppedUrl); setSelectedFile(null); setPreviewUrl(""); setCroppedUrl(""); setZoom(100); setImagePosition({ x: 0, y: 0 }); setImageLoaded(false) }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!isFullscreen) { try { await (containerRef.current.requestFullscreen?.() || (containerRef.current as any).webkitRequestFullscreen?.()) } catch {} }
    else { try { await (document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.()) } catch {} }
  }

  useEffect(() => {
    const handler = () => {
      const isCurr = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      if (isCurr !== isFullscreen && containerRef.current) {
        const ow = containerSize.width, oh = containerSize.height; setIsFullscreen(isCurr)
        setTimeout(() => { if (containerRef.current) { const r = containerRef.current.getBoundingClientRect(); if (ow > 0 && oh > 0 && r.width > 0 && r.height > 0) { const sx = r.width / ow, sy = r.height / oh; setCropBoxPosition((p) => ({ x: p.x * sx, y: p.y * sy })); setBaseCropBoxSize((p) => ({ width: p.width * sx, height: p.height * sy })); setCropBoxSize((p) => ({ width: p.width * sx, height: p.height * sy })) } }; updateContainerSize() }, 100)
      } else { setIsFullscreen(isCurr); setTimeout(updateContainerSize, 100) }
    }
    document.addEventListener("fullscreenchange", handler); document.addEventListener("webkitfullscreenchange", handler)
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
            <div className="relative rounded-3xl overflow-hidden" style={{ background: "#0E0E18", border: "1px solid #1A1A28" }}>
              {/* Giant ghost number */}
              <span className="absolute -top-6 -right-4 font-serif text-[10rem] md:text-[14rem] leading-none select-none pointer-events-none" style={{ color: `${C}06` }}>03</span>

              {/* Top bar */}
              <div className="relative z-10 flex items-center justify-between px-5 md:px-8 py-4 md:py-5" style={{ borderBottom: "1px solid #1A1A28" }}>
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-serif text-sm truncate" style={{ color: "#52525B" }}>{selectedFile.name}</span>
                  <span className="font-mono text-[10px] shrink-0" style={{ color: "#3f3f50" }}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg transition-colors hover:bg-[#1A1A28] shrink-0" style={{ color: "#52525B" }}><X className="w-4 h-4" /></button>
              </div>

              <div className="relative z-10 p-5 md:p-10">
                <h3 className="font-serif text-5xl md:text-6xl leading-[0.9] mb-2">Crop</h3>
                <p className="font-serif text-sm mb-8" style={{ color: "#2a2a40" }}>set dimensions & adjust</p>

                {/* Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div>
                    <Label htmlFor="crop-width" className="font-serif text-xs mb-2 block" style={{ color: "#2a2a40" }}>Width</Label>
                    <Input id="crop-width" type="number" min="1" value={cropWidth} onChange={(e) => setCropWidth(Number.parseInt(e.target.value) || 1)} className="bg-[#06060B] border-[#1A1A28] text-[#EEEEF2] font-mono text-sm h-11" />
                  </div>
                  <div>
                    <Label htmlFor="crop-height" className="font-serif text-xs mb-2 block" style={{ color: "#2a2a40" }}>Height</Label>
                    <Input id="crop-height" type="number" min="1" value={cropHeight} onChange={(e) => setCropHeight(Number.parseInt(e.target.value) || 1)} className="bg-[#06060B] border-[#1A1A28] text-[#EEEEF2] font-mono text-sm h-11" />
                  </div>
                  {previewUrl && imageLoaded && (
                    <div className="col-span-2">
                      <Label className="font-serif text-xs mb-2 block" style={{ color: "#2a2a40" }}>Zoom</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[zoom]} onValueChange={handleZoomChange} min={50} max={200} step={5} className="flex-1 mt-1 [&_[data-slot=slider-track]]:bg-[#1A1A28] [&_[data-slot=slider-range]]:bg-[#F59E0B] [&_[data-slot=slider-thumb]]:border-[#F59E0B] [&_[data-slot=slider-thumb]]:bg-[#06060B]" />
                        <span className="font-serif text-2xl w-16 text-right" style={{ color: C }}>{zoom}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Canvas */}
                <div className="mb-6">
                  {isFullscreen && (
                    <div className="fixed top-0 left-0 right-0 z-50 p-4" style={{ background: "#06060Bee", borderBottom: "1px solid #1A1A28", backdropFilter: "blur(12px)" }}>
                      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-serif text-2xl">Crop</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2"><Label htmlFor="cw-fs" className="font-serif text-xs" style={{ color: "#52525B" }}>W</Label><Input id="cw-fs" type="number" min="1" value={cropWidth} onChange={(e) => setCropWidth(Number.parseInt(e.target.value) || 1)} className="bg-[#0E0E18] border-[#1A1A28] text-[#EEEEF2] font-mono text-xs w-20 h-8" /></div>
                            <div className="flex items-center gap-2"><Label htmlFor="ch-fs" className="font-serif text-xs" style={{ color: "#52525B" }}>H</Label><Input id="ch-fs" type="number" min="1" value={cropHeight} onChange={(e) => setCropHeight(Number.parseInt(e.target.value) || 1)} className="bg-[#0E0E18] border-[#1A1A28] text-[#EEEEF2] font-mono text-xs w-20 h-8" /></div>
                          </div>
                          {previewUrl && imageLoaded && <div className="flex items-center gap-2 flex-1 max-w-xs"><Label className="font-serif text-xs whitespace-nowrap" style={{ color: "#52525B" }}>Zoom {zoom}%</Label><Slider value={[zoom]} onValueChange={handleZoomChange} min={50} max={200} step={5} className="flex-1 [&_[data-slot=slider-track]]:bg-[#1A1A28] [&_[data-slot=slider-range]]:bg-[#F59E0B] [&_[data-slot=slider-thumb]]:border-[#F59E0B]" /></div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={cropAndDownloadImage} disabled={!imageLoaded} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-serif text-sm" style={{ background: C, color: "#06060B" }}><Download className="w-3.5 h-3.5" /> Download</button>
                          <button onClick={toggleFullscreen} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif text-sm" style={{ border: "1px solid #1A1A28", color: "#52525B" }}><Minimize className="w-3.5 h-3.5" /> Exit</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    ref={containerRef}
                    className={`relative rounded-2xl overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : "mx-auto"}`}
                    style={{
                      width: isFullscreen ? "100vw" : "100%", maxWidth: isFullscreen ? "100vw" : "100%",
                      height: isFullscreen ? "calc(100vh - 80px)" : "420px", marginTop: isFullscreen ? "80px" : "0",
                      border: isFullscreen ? "none" : "1px solid #1A1A28",
                      backgroundImage: "linear-gradient(45deg, #16162a 25%, transparent 25%, transparent 75%, #16162a 75%), linear-gradient(45deg, #16162a 25%, transparent 25%, transparent 75%, #16162a 75%)",
                      backgroundSize: "20px 20px", backgroundPosition: "0 0, 10px 10px", backgroundColor: "#0c0c1a",
                    }}
                    onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                    onMouseLeave={() => { handleMouseUp(); document.body.style.overflow = "" }}
                    onMouseEnter={() => { document.body.style.overflow = "hidden" }}
                  >
                    {previewUrl && <img ref={imageRef} src={previewUrl} alt="Crop preview" onLoad={handleImageLoad} className={`absolute select-none ${isDraggingImage ? "cursor-grabbing" : "cursor-move"}`} style={{ width: `${imageDisplaySize.width}px`, height: `${imageDisplaySize.height}px`, left: `${(containerSize.width - imageDisplaySize.width) / 2 + imagePosition.x}px`, top: `${(containerSize.height - imageDisplaySize.height) / 2 + imagePosition.y}px`, transform: `scale(${zoom / 100})`, transformOrigin: "center center" }} draggable={false} onMouseDown={handleImageMouseDown} />}
                    <div className="absolute" style={{ left: `${cropBoxPosition.x}px`, top: `${cropBoxPosition.y}px`, width: `${cropBoxSize.width}px`, height: `${cropBoxSize.height}px`, cursor: isDraggingCropBox ? "grabbing" : "move", border: `2px solid ${C}`, background: `${C}08`, boxShadow: `0 0 0 9999px rgba(6,6,11,0.6), 0 0 20px ${C}15` }} onMouseDown={handleCropBoxMouseDown}>
                      {["top-left", "top-right", "bottom-left", "bottom-right"].map((h) => (<div key={h} className={`absolute w-3.5 h-3.5 rounded-sm ${h.includes("left") ? "-left-[6px]" : "-right-[6px]"} ${h.includes("top") ? "-top-[6px]" : "-bottom-[6px]"}`} style={{ background: C, cursor: h === "top-left" || h === "bottom-right" ? "nwse-resize" : "nesw-resize" }} onMouseDown={(e) => handleResizeHandleMouseDown(e, h)} />))}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-0.5 rounded font-mono text-[10px] whitespace-nowrap" style={{ background: "#06060Bee", color: "#52525B" }}>{cropWidth} x {cropHeight}</div>
                    </div>
                  </div>
                  <p className="font-serif text-xs mt-3 text-center" style={{ color: "#2a2a40" }}>
                    drag image to move &middot; drag crop box to reposition &middot; corners to resize &middot; scroll to zoom
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={cropAndDownloadImage} disabled={!imageLoaded} className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-serif text-xl transition-all duration-300 disabled:opacity-50" style={{ background: C, color: "#06060B", boxShadow: `0 0 40px ${C}25` }}>
                    <Download className="w-5 h-5" /> Download Crop
                  </button>
                  <button onClick={reset} className="px-8 py-5 rounded-2xl font-serif text-base transition-colors" style={{ border: "1px solid #1A1A28", color: "#2a2a40" }}>Reset</button>
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
