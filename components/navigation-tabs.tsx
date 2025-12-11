"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavigationTabs() {
  const pathname = usePathname()
  const activeTab = pathname === "/compress" ? "compress" : pathname === "/cropper" ? "cropper" : "convert"

  return (
    <div className="mb-16">
      <div className="flex gap-12 justify-center border-b border-white/10">
        <Link
          href="/"
          className={`pb-4 font-serif text-2xl transition-all relative ${
            activeTab === "convert" ? "text-[#2C74E5]" : "text-white/40 hover:text-white/70"
          }`}
        >
          Convert
          {activeTab === "convert" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C74E5]" />}
        </Link>
        <Link
          href="/compress"
          className={`pb-4 font-serif text-2xl transition-all relative ${
            activeTab === "compress" ? "text-[#13947D]" : "text-white/40 hover:text-white/70"
          }`}
        >
          Compress
          {activeTab === "compress" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#13947D]" />}
        </Link>
        <Link
          href="/cropper"
          className={`pb-4 font-serif text-2xl transition-all relative ${
            activeTab === "cropper" ? "text-[#CCADAC]" : "text-white/40 hover:text-white/70"
          }`}
        >
          Cropper
          {activeTab === "cropper" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CCADAC]" />}
        </Link>
      </div>
    </div>
  )
}
