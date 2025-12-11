export function USPs() {
  return (
    <div className="mt-16 pt-12 border-t border-white/10">
      <div className="grid md:grid-cols-3 gap-12">
        <div>
          <div className="h-1 w-12 bg-[#13947D] mb-4" />
          <h3 className="font-serif text-xl mb-2">Multiple Formats</h3>
          <p className="text-white/60 font-sans text-sm leading-relaxed">
            Support for PNG, JPEG, WebP, BMP, and GIF. Convert between any format instantly.
          </p>
        </div>
        <div>
          <div className="h-1 w-12 bg-[#2C74E5] mb-4" />
          <h3 className="font-serif text-xl mb-2">No Quality Loss</h3>
          <p className="text-white/60 font-sans text-sm leading-relaxed">
            High-quality conversion and compression that maintains visual fidelity.
          </p>
        </div>
        <div>
          <div className="h-1 w-12 bg-[#CCADAC] mb-4" />
          <h3 className="font-serif text-xl mb-2">Client-side Processing</h3>
          <p className="text-white/60 font-sans text-sm leading-relaxed">
            Your images never leave your browser. Everything happens locally for complete privacy.
          </p>
        </div>
      </div>
    </div>
  )
}
