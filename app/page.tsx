"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Download, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollageCanvas } from "@/components/collage-canvas"

export default function CollageMaker() {
  const [images, setImages] = useState<string[]>([])
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "1:3" | "3:1">("1:1")
  const [regenerateKey, setRegenerateKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const imageUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        imageUrls.push(url)
      }
    }
    setImages((prev) => [...prev, ...imageUrls])
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = e.dataTransfer.files

    const imageUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        imageUrls.push(url)
      }
    }
    setImages((prev) => [...prev, ...imageUrls])
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const clearImages = () => {
    images.forEach((url) => URL.revokeObjectURL(url))
    setImages([])
  }

  const regenerateCollage = () => {
    setRegenerateKey((prev) => prev + 1)
  }

  const downloadCollage = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.download = `collage-${aspectRatio}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h1 className="font-sans text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Collage Maker</h1>
          <p className="mt-3 text-lg text-muted-foreground">Cargá tus fotos y creá un collage automático</p>
        </header>

        <div className="mb-8 flex flex-col items-center gap-6">
          {/* Canvas Ratio Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm font-medium text-foreground">Tamaño del lienzo:</span>
            {(["1:1", "16:9", "9:16", "1:3", "3:1"] as const).map((ratio) => (
              <Button
                key={ratio}
                variant={aspectRatio === ratio ? "default" : "outline"}
                size="sm"
                onClick={() => setAspectRatio(ratio)}
                className="min-w-20"
              >
                {ratio}
              </Button>
            ))}
          </div>

          {/* Upload Area */}
          {images.length === 0 && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-16 transition-colors hover:border-primary/50 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-center text-base font-medium text-foreground">
                Arrastrá tus fotos acá o hacé click para seleccionar
              </p>
              <p className="text-center text-sm text-muted-foreground">Podés cargar todas las fotos que quieras</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action Buttons */}
          {images.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Agregar más fotos
              </Button>
              <Button variant="outline" size="sm" onClick={clearImages}>
                Limpiar todo
              </Button>
              <Button variant="outline" size="sm" onClick={regenerateCollage}>
                <Shuffle className="mr-2 h-4 w-4" />
                Regenerar
              </Button>
              <Button size="sm" onClick={downloadCollage}>
                <Download className="mr-2 h-4 w-4" />
                Descargar collage
              </Button>
            </div>
          )}
        </div>

        {/* Collage Display */}
        {images.length > 0 && (
          <div className="flex justify-center">
            <CollageCanvas key={regenerateKey} images={images} aspectRatio={aspectRatio} ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  )
}
