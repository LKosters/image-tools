"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

interface UploadAreaProps {
  mode: "convert" | "compress" | "cropper"
  dragActive: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  multiple?: boolean
}

export function UploadArea({
  mode,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  multiple = false,
}: UploadAreaProps) {
  const borderColor = mode === "convert" ? "#2C74E5" : mode === "compress" ? "#13947D" : "#CCADAC"
  const inputId = multiple ? "file-upload-multiple" : "file-upload"

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors`}
      style={{
        borderColor: dragActive ? borderColor : `${borderColor}66`,
        backgroundColor: dragActive ? `${borderColor}1A` : "transparent",
      }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <h2 className="font-serif text-3xl mb-4">Drop your {multiple ? "images" : "image"} here</h2>
      <p className="text-white/60 mb-6 font-sans">
        {multiple ? "Select multiple images to compress at once" : "or click to browse your files"}
      </p>
      <label htmlFor={inputId}>
        <Button className="hover:opacity-80 text-black font-sans" style={{ backgroundColor: borderColor }} asChild>
          <span className="cursor-pointer">{multiple ? "Choose Files" : "Choose File"}</span>
        </Button>
      </label>
      <input id={inputId} type="file" accept="image/*" multiple={multiple} onChange={onFileSelect} className="hidden" />
    </div>
  )
}
