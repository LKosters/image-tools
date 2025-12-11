"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Download, X, Maximize, Minimize } from "lucide-react"
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
      const maxSize = Math.min(containerSize.width * 0.3, containerSize.height * 0.3)
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
    if (imageLoaded && containerSize.width > 0 && containerSize.height > 0) {
      const aspectRatio = cropWidth / cropHeight
      const maxSize = Math.min(containerSize.width * 0.3, containerSize.height * 0.3)
      const boxWidth = maxSize
      const boxHeight = boxWidth / aspectRatio

      setBaseCropBoxSize((prev) => {
        if (prev.width === 400 && prev.height === 300) {
          return { width: boxWidth, height: boxHeight }
        }
        return prev
      })
      
      setCropBoxSize((prev) => {
        const newScaledWidth = boxWidth * (zoom / 100)
        const newScaledHeight = boxHeight * (zoom / 100)
        if (prev.width === 400 && prev.height === 300) {
          return { width: newScaledWidth, height: newScaledHeight }
        }
        return prev
      })
    }
  }, [cropWidth, cropHeight, imageLoaded, containerSize, zoom])

  const getImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }

    const baseSize = getBaseImageDisplaySize()
    return { width: baseSize.width, height: baseSize.height }
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

  const handleResizeHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizingCropBox(true)
    setResizeHandle(handle)
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
      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      const currentBaseWidth = baseCropBoxSize.width
      const currentBaseHeight = baseCropBoxSize.height
      const scale = zoom / 100
      const currentScaledWidth = currentBaseWidth * scale
      const currentScaledHeight = currentBaseHeight * scale
      
      let newBaseWidth = currentBaseWidth
      let newBaseHeight = currentBaseHeight
      let newX = cropBoxPosition.x
      let newY = cropBoxPosition.y

      if (resizeHandle === "bottom-right") {
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY > 0 ? 1 : -1)
        const newScaledWidth = Math.max(50, Math.min(containerSize.width - cropBoxPosition.x, currentScaledWidth + delta))
        const newScaledHeight = newScaledWidth / aspectRatio
        newBaseWidth = newScaledWidth / scale
        newBaseHeight = newScaledHeight / scale
      } else if (resizeHandle === "top-left") {
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY < 0 ? -1 : 1)
        const oldRight = cropBoxPosition.x + currentScaledWidth
        const oldBottom = cropBoxPosition.y + currentScaledHeight
        const newScaledWidth = Math.max(50, Math.min(oldRight, currentScaledWidth - delta))
        const newScaledHeight = newScaledWidth / aspectRatio
        newBaseWidth = newScaledWidth / scale
        newBaseHeight = newScaledHeight / scale
        newX = oldRight - newScaledWidth
        newY = oldBottom - newScaledHeight
      } else if (resizeHandle === "top-right") {
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY < 0 ? 1 : -1)
        const oldBottom = cropBoxPosition.y + currentScaledHeight
        const newScaledWidth = Math.max(50, Math.min(containerSize.width - cropBoxPosition.x, currentScaledWidth + delta))
        const newScaledHeight = newScaledWidth / aspectRatio
        newBaseWidth = newScaledWidth / scale
        newBaseHeight = newScaledHeight / scale
        newY = oldBottom - newScaledHeight
      } else if (resizeHandle === "bottom-left") {
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY > 0 ? -1 : 1)
        const oldRight = cropBoxPosition.x + currentScaledWidth
        const newScaledWidth = Math.max(50, Math.min(oldRight, currentScaledWidth - delta))
        const newScaledHeight = newScaledWidth / aspectRatio
        newBaseWidth = newScaledWidth / scale
        newBaseHeight = newScaledHeight / scale
        newX = oldRight - newScaledWidth
      }

      const newScaledWidth = newBaseWidth * scale
      const newScaledHeight = newBaseHeight * scale

      if (newScaledWidth >= 50 && newScaledHeight >= 50 && newX >= 0 && newY >= 0 && 
          newX + newScaledWidth <= containerSize.width && newY + newScaledHeight <= containerSize.height) {
        setBaseCropBoxSize({ width: newBaseWidth, height: newBaseHeight })
        setCropBoxSize({ width: newScaledWidth, height: newScaledHeight })
        setCropBoxPosition({ x: newX, y: newY })
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
        if (!containerRef.current) return
        const aspectRatio = cropWidth / cropHeight
        const rect = containerRef.current.getBoundingClientRect()
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        
        const currentBaseWidth = baseCropBoxSize.width
        const currentBaseHeight = baseCropBoxSize.height
        const scale = zoom / 100
        const currentScaledWidth = currentBaseWidth * scale
        const currentScaledHeight = currentBaseHeight * scale
        
        let newBaseWidth = currentBaseWidth
        let newBaseHeight = currentBaseHeight
        let newX = cropBoxPosition.x
        let newY = cropBoxPosition.y

        if (resizeHandle === "bottom-right") {
          const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY > 0 ? 1 : -1)
          const newScaledWidth = Math.max(50, Math.min(rect.width - cropBoxPosition.x, currentScaledWidth + delta))
          const newScaledHeight = newScaledWidth / aspectRatio
          newBaseWidth = newScaledWidth / scale
          newBaseHeight = newScaledHeight / scale
        } else if (resizeHandle === "top-left") {
          const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY < 0 ? -1 : 1)
          const oldRight = cropBoxPosition.x + currentScaledWidth
          const oldBottom = cropBoxPosition.y + currentScaledHeight
          const newScaledWidth = Math.max(50, Math.min(oldRight, currentScaledWidth - delta))
          const newScaledHeight = newScaledWidth / aspectRatio
          newBaseWidth = newScaledWidth / scale
          newBaseHeight = newScaledHeight / scale
          newX = oldRight - newScaledWidth
          newY = oldBottom - newScaledHeight
        } else if (resizeHandle === "top-right") {
          const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX > 0 || deltaY < 0 ? 1 : -1)
          const oldBottom = cropBoxPosition.y + currentScaledHeight
          const newScaledWidth = Math.max(50, Math.min(rect.width - cropBoxPosition.x, currentScaledWidth + delta))
          const newScaledHeight = newScaledWidth / aspectRatio
          newBaseWidth = newScaledWidth / scale
          newBaseHeight = newScaledHeight / scale
          newY = oldBottom - newScaledHeight
        } else if (resizeHandle === "bottom-left") {
          const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX < 0 || deltaY > 0 ? -1 : 1)
          const oldRight = cropBoxPosition.x + currentScaledWidth
          const newScaledWidth = Math.max(50, Math.min(oldRight, currentScaledWidth - delta))
          const newScaledHeight = newScaledWidth / aspectRatio
          newBaseWidth = newScaledWidth / scale
          newBaseHeight = newScaledHeight / scale
          newX = oldRight - newScaledWidth
        }

        const newScaledWidth = newBaseWidth * scale
        const newScaledHeight = newBaseHeight * scale

        if (newScaledWidth >= 50 && newScaledHeight >= 50 && newX >= 0 && newY >= 0 && 
            newX + newScaledWidth <= rect.width && newY + newScaledHeight <= rect.height) {
          setBaseCropBoxSize({ width: newBaseWidth, height: newBaseHeight })
          setCropBoxSize({ width: newScaledWidth, height: newScaledHeight })
          setCropBoxPosition({ x: newX, y: newY })
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
  }, [isDraggingImage, isDraggingCropBox, isResizingCropBox, dragStart, containerSize, cropBoxSize, cropBoxPosition, cropWidth, cropHeight, resizeHandle])

  const getBaseImageDisplaySize = () => {
    if (!imageLoaded || imageNaturalSize.width === 0) return { width: 0, height: 0 }

    const imageAspectRatio = imageNaturalSize.width / imageNaturalSize.height
    const containerAspectRatio = containerSize.width / containerSize.height

    let displayWidth: number
    let displayHeight: number

    if (imageAspectRatio > containerAspectRatio) {
      displayWidth = containerSize.width
      displayHeight = containerSize.width / imageAspectRatio
    } else {
      displayWidth = containerSize.height * imageAspectRatio
      displayHeight = containerSize.height
    }

    return { width: displayWidth, height: displayHeight }
  }

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0]
    const oldZoom = zoom
    
    if (newZoom === oldZoom) return
    
    const scale = newZoom / oldZoom
    const currentBaseWidth = cropBoxSize.width / (oldZoom / 100)
    const currentBaseHeight = cropBoxSize.height / (oldZoom / 100)
    
    const newScaledWidth = currentBaseWidth * (newZoom / 100)
    const newScaledHeight = currentBaseHeight * (newZoom / 100)
    
    const currentCenterX = cropBoxPosition.x + cropBoxSize.width / 2
    const currentCenterY = cropBoxPosition.y + cropBoxSize.height / 2
    
    setZoom(newZoom)
    setPreviousZoom(newZoom)
    setBaseCropBoxSize({ width: currentBaseWidth, height: currentBaseHeight })
    setCropBoxSize({
      width: newScaledWidth,
      height: newScaledHeight,
    })
    setCropBoxPosition({
      x: currentCenterX - newScaledWidth / 2,
      y: currentCenterY - newScaledHeight / 2,
    })
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!imageLoaded) return
    
    e.preventDefault()
    e.stopPropagation()

    const delta = e.deltaY > 0 ? -5 : 5
    const oldZoom = zoom
    const newZoom = Math.max(50, Math.min(200, zoom + delta))
    
    if (newZoom === oldZoom) return

    const scale = newZoom / oldZoom
    const currentBaseWidth = cropBoxSize.width / (oldZoom / 100)
    const currentBaseHeight = cropBoxSize.height / (oldZoom / 100)
    
    const newScaledWidth = currentBaseWidth * (newZoom / 100)
    const newScaledHeight = currentBaseHeight * (newZoom / 100)
    
    const currentCenterX = cropBoxPosition.x + cropBoxSize.width / 2
    const currentCenterY = cropBoxPosition.y + cropBoxSize.height / 2
    
    setZoom(newZoom)
    setPreviousZoom(newZoom)
    setBaseCropBoxSize({ width: currentBaseWidth, height: currentBaseHeight })
    setCropBoxSize({
      width: newScaledWidth,
      height: newScaledHeight,
    })
    setCropBoxPosition({
      x: currentCenterX - newScaledWidth / 2,
      y: currentCenterY - newScaledHeight / 2,
    })
  }

  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return

    const imageDisplaySize = getImageDisplaySize()
    const scaledWidth = imageDisplaySize.width * (zoom / 100)
    const scaledHeight = imageDisplaySize.height * (zoom / 100)
    
    if (scaledWidth <= containerSize.width && scaledHeight <= containerSize.height) {
      setImagePosition({ x: 0, y: 0 })
      return
    }

    const minX = containerSize.width - scaledWidth
    const minY = containerSize.height - scaledHeight
    
    setImagePosition((prev) => {
      const constrainedX = Math.max(minX, Math.min(0, prev.x))
      const constrainedY = Math.max(minY, Math.min(0, prev.y))
      
      if (prev.x !== constrainedX || prev.y !== constrainedY) {
        return { x: constrainedX, y: constrainedY }
      }
      
      return prev
    })
  }, [containerSize, imageLoaded, zoom])

  const cropAndDownloadImage = async () => {
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

    const scaledWidth = imageDisplaySize.width * (zoom / 100)
    const scaledHeight = imageDisplaySize.height * (zoom / 100)

    const imageLeft = (containerSize.width - scaledWidth) / 2 + imagePosition.x
    const imageTop = (containerSize.height - scaledHeight) / 2 + imagePosition.y

    const cropXInImage = cropBoxLeft - imageLeft
    const cropYInImage = cropBoxTop - imageTop

    const scaleX = imageNaturalSize.width / scaledWidth
    const scaleY = imageNaturalSize.height / scaledHeight

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
          
          const link = document.createElement("a")
          link.href = url
          const originalName = selectedFile?.name.split(".")[0] || "cropped"
          link.download = `${originalName}-${cropWidth}x${cropHeight}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      },
      "image/png",
      1.0,
    )
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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen()
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen()
        }
      } catch (error) {
        console.error("Error attempting to enable fullscreen:", error)
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      } catch (error) {
        console.error("Error attempting to exit fullscreen:", error)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      
      if (isCurrentlyFullscreen !== isFullscreen && containerRef.current) {
        const oldContainerWidth = containerSize.width
        const oldContainerHeight = containerSize.height
        
        setIsFullscreen(isCurrentlyFullscreen)
        
        setTimeout(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const newContainerWidth = rect.width
            const newContainerHeight = rect.height
            
            if (oldContainerWidth > 0 && oldContainerHeight > 0 && newContainerWidth > 0 && newContainerHeight > 0) {
              const scaleX = newContainerWidth / oldContainerWidth
              const scaleY = newContainerHeight / oldContainerHeight
              
              setCropBoxPosition((prev) => ({
                x: prev.x * scaleX,
                y: prev.y * scaleY,
              }))
              
              setBaseCropBoxSize((prev) => ({
                width: prev.width * scaleX,
                height: prev.height * scaleY,
              }))
              
              setCropBoxSize((prev) => ({
                width: prev.width * scaleX,
                height: prev.height * scaleY,
              }))
            }
          }
          
          updateContainerSize()
        }, 100)
      } else {
        setIsFullscreen(isCurrentlyFullscreen)
        setTimeout(() => {
          updateContainerSize()
        }, 100)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("msfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("msfullscreenchange", handleFullscreenChange)
    }
  }, [isFullscreen, containerSize])

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
                    max={200}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              <div className="mb-8">
                {isFullscreen && (
                  <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/20 p-4">
                    <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <h3 className="font-serif text-xl text-white">Crop Image</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="crop-width-fs" className="font-sans text-sm text-white/80">
                              Width:
                            </Label>
                            <Input
                              id="crop-width-fs"
                              type="number"
                              min="1"
                              value={cropWidth}
                              onChange={(e) => setCropWidth(Number.parseInt(e.target.value) || 1)}
                              className="bg-white/10 border-white/20 text-white font-sans w-24 h-8"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="crop-height-fs" className="font-sans text-sm text-white/80">
                              Height:
                            </Label>
                            <Input
                              id="crop-height-fs"
                              type="number"
                              min="1"
                              value={cropHeight}
                              onChange={(e) => setCropHeight(Number.parseInt(e.target.value) || 1)}
                              className="bg-white/10 border-white/20 text-white font-sans w-24 h-8"
                            />
                          </div>
                        </div>
                        {previewUrl && imageLoaded && (
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <Label className="font-sans text-sm text-white/80 whitespace-nowrap">
                              Zoom: {zoom}%
                            </Label>
                            <Slider
                              value={[zoom]}
                              onValueChange={handleZoomChange}
                              min={50}
                              max={200}
                              step={5}
                              className="flex-1"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={cropAndDownloadImage}
                          disabled={!imageLoaded}
                          className="bg-[#CCADAC] hover:bg-[#CCADAC]/80 text-black font-sans"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={toggleFullscreen}
                          variant="outline"
                          className="border-white/20 hover:bg-white/10 font-sans bg-transparent"
                        >
                          <Minimize className="w-4 h-4 mr-2" />
                          Exit Fullscreen
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  ref={containerRef}
                  className={`relative border-2 border-white/20 rounded overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : "mx-auto"}`}
                  style={{
                    width: isFullscreen ? "100vw" : "100%",
                    maxWidth: isFullscreen ? "100vw" : "600px",
                    height: isFullscreen ? "calc(100vh - 80px)" : "400px",
                    marginTop: isFullscreen ? "80px" : "0",
                    backgroundImage: `
                      linear-gradient(45deg, #808080 25%, transparent 25%, transparent 75%, #808080 75%, #808080),
                      linear-gradient(45deg, #808080 25%, transparent 25%, transparent 75%, #808080 75%, #808080)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 10px 10px",
                    backgroundColor: "#404040",
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={(e) => {
                    handleMouseUp()
                    document.body.style.overflow = ""
                  }}
                  onMouseEnter={() => {
                    document.body.style.overflow = "hidden"
                  }}
                  onWheel={handleWheel}
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
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "center center",
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
                      className="absolute -left-1 -top-1 w-4 h-4 bg-[#CCADAC] border-2 border-white cursor-nwse-resize"
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "top-left")}
                    />
                    <div
                      className="absolute -right-1 -top-1 w-4 h-4 bg-[#CCADAC] border-2 border-white cursor-nesw-resize"
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "top-right")}
                    />
                    <div
                      className="absolute -left-1 -bottom-1 w-4 h-4 bg-[#CCADAC] border-2 border-white cursor-nesw-resize"
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "bottom-left")}
                    />
                    <div
                      className="absolute -right-1 -bottom-1 w-4 h-4 bg-[#CCADAC] border-2 border-white cursor-nwse-resize"
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "bottom-right")}
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full px-2 py-1 bg-black/80 text-white text-xs font-sans whitespace-nowrap mt-1">
                      {cropWidth} × {cropHeight}px
                    </div>
                  </div>
                </div>
                <p className="text-white/40 font-sans text-xs mt-2 text-center">
                  Drag image to move • Drag crop box to reposition • Drag any corner to resize • Scroll to zoom
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={cropAndDownloadImage}
                  disabled={!imageLoaded}
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
                {/* <Button
                  onClick={toggleFullscreen}
                  disabled={!imageLoaded}
                  variant="outline"
                  className="w-full border-white/20 hover:bg-white/10 font-sans bg-transparent"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="w-5 h-5 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="w-5 h-5 mr-2" />
                      Fullscreen
                    </>
                  )}
                </Button> */}
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
