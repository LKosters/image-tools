# 🖼️ Image Tools

A browser-based image manipulation toolkit providing format conversion, compression, and cropping — all processed client-side for privacy and speed. Built with Next.js, React, and TypeScript.

## ⚡ Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Directory structure tree

```
image-tools/
├── app/
│   ├── compress/                # Image compression page
│   ├── cropper/                 # Image cropping page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout with metadata & analytics
│   └── page.tsx                 # Home page (Image Converter)
├── components/
│   ├── ui/                      # shadcn/ui reusable components
│   ├── footer.tsx               # Footer component
│   ├── header.tsx               # Dynamic header per tool
│   ├── navigation-tabs.tsx      # Navigation between tools
│   ├── theme-provider.tsx       # Dark/light theme management
│   ├── upload-area.tsx          # Drag-and-drop upload component
│   └── usps.tsx                 # Unique selling points section
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
├── public/                      # Static assets (favicons, icons, logos)
├── styles/                      # Additional stylesheets
├── Dockerfile                   # Multi-stage Docker build
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies & scripts
└── tsconfig.json                # TypeScript configuration
```

## 🔐 Required .env credentials

No environment variables or credentials are required. All image processing happens client-side in the browser.

## 📜 Available scripts

- `npm run dev` - Start the Next.js development server
- `npm run build` - Create a production build
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint across the project
