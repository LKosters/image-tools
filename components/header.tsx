interface HeaderProps {
  activeTab: "convert" | "compress" | "cropper"
}

export function Header({ activeTab }: HeaderProps) {
  const getTitle = () => {
    if (activeTab === "convert") return "Converter"
    if (activeTab === "compress") return "Compressor"
    return "Cropper"
  }

  const getColor = () => {
    if (activeTab === "convert") return "text-[#2C74E5]"
    if (activeTab === "compress") return "text-[#13947D]"
    return "text-[#CCADAC]"
  }

  const getSubtitle = () => {
    if (activeTab === "convert") return "Transform between formats"
    if (activeTab === "compress") return "Optimize without compromise"
    return "Crop with precision"
  }

  return (
    <header className="text-center mb-16">
      <h1 className="font-serif text-7xl md:text-8xl mb-8 tracking-tight leading-none">
        Image&nbsp;
        <span className={getColor()}>{getTitle()}</span>
      </h1>
      <p className="font-sans text-lg text-white/50 tracking-[0.2em] uppercase">{getSubtitle()}</p>
    </header>
  )
}
