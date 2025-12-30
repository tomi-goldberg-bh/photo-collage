"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"

interface CollageCanvasProps {
  images: string[]
  aspectRatio: "1:1" | "16:9" | "9:16" | "1:3" | "3:1" // Added 3:1 aspect ratio
}

interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
  imageIndex: number
}

export const CollageCanvas = forwardRef<HTMLCanvasElement, CollageCanvasProps>(({ images, aspectRatio }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => canvasRef.current!)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || images.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions based on aspect ratio
    let canvasWidth = 1200
    let canvasHeight = 1200

    if (aspectRatio === "16:9") {
      canvasWidth = 1920
      canvasHeight = 1080
    } else if (aspectRatio === "9:16") {
      canvasWidth = 1080
      canvasHeight = 1920
    } else if (aspectRatio === "1:3") {
      canvasWidth = 1080
      canvasHeight = 3240
    } else if (aspectRatio === "3:1") {
      canvasWidth = 3240
      canvasHeight = 1080
    }

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Generate layout
    const layout = generateOptimalLayout(images.length, canvasWidth, canvasHeight)

    // Load and draw images
    const loadedImages: HTMLImageElement[] = []
    let loadedCount = 0

    images.forEach((src, index) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        loadedImages[index] = img
        loadedCount++

        if (loadedCount === images.length) {
          drawCollage(ctx, loadedImages, layout)
        }
      }
      img.src = src
    })

    return () => {
      // Cleanup
      loadedImages.forEach((img) => {
        img.src = ""
      })
    }
  }, [images, aspectRatio])

  return (
    <canvas
      ref={canvasRef}
      className="max-h-[80vh] w-full max-w-full rounded-none shadow-2xl"
      style={{ objectFit: "contain" }}
    />
  )
})

CollageCanvas.displayName = "CollageCanvas"

function generateOptimalLayout(imageCount: number, canvasWidth: number, canvasHeight: number): LayoutRect[] {
  const layouts: LayoutRect[] = []

  const imageIndices = Array.from({ length: imageCount }, (_, i) => i)
  for (let i = imageIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[imageIndices[i], imageIndices[j]] = [imageIndices[j], imageIndices[i]]
  }

  // Función recursiva para dividir el espacio
  function splitSpace(x: number, y: number, width: number, height: number, depth = 0): void {
    if (imageIndices.length === 0) return

    // Si solo queda una imagen, asignarle todo el espacio restante
    if (imageIndices.length === 1) {
      layouts.push({
        x,
        y,
        width,
        height,
        imageIndex: imageIndices.pop()!,
      })
      return
    }

    // Decidir si dividir horizontal o verticalmente basado en las proporciones
    const aspectRatio = width / height
    const shouldSplitVertically = aspectRatio > 1.2 || (aspectRatio > 0.8 && Math.random() > 0.5)

    if (shouldSplitVertically) {
      // División vertical (dos columnas lado a lado)
      // Variar el punto de división entre 30% y 70%
      const splitRatio = 0.3 + Math.random() * 0.4
      const leftWidth = width * splitRatio

      // Decidir cuántas imágenes van a cada lado
      const leftCount = Math.ceil(imageIndices.length * splitRatio)
      const rightCount = imageIndices.length - leftCount

      if (leftCount > 0 && rightCount > 0) {
        // Separar las imágenes
        const leftImages = imageIndices.splice(0, leftCount)
        const rightImages = [...imageIndices]
        imageIndices.length = 0
        imageIndices.push(...leftImages)

        // Dividir lado izquierdo
        splitSpace(x, y, leftWidth, height, depth + 1)

        // Dividir lado derecho
        imageIndices.length = 0
        imageIndices.push(...rightImages)
        splitSpace(x + leftWidth, y, width - leftWidth, height, depth + 1)
      } else {
        // Si no se puede dividir bien, poner una imagen y continuar
        layouts.push({
          x,
          y,
          width,
          height,
          imageIndex: imageIndices.pop()!,
        })
      }
    } else {
      // División horizontal (dos filas una arriba de la otra)
      // Variar el punto de división entre 30% y 70%
      const splitRatio = 0.3 + Math.random() * 0.4
      const topHeight = height * splitRatio

      // Decidir cuántas imágenes van arriba y abajo
      const topCount = Math.ceil(imageIndices.length * splitRatio)
      const bottomCount = imageIndices.length - topCount

      if (topCount > 0 && bottomCount > 0) {
        // Separar las imágenes
        const topImages = imageIndices.splice(0, topCount)
        const bottomImages = [...imageIndices]
        imageIndices.length = 0
        imageIndices.push(...topImages)

        // Dividir parte superior
        splitSpace(x, y, width, topHeight, depth + 1)

        // Dividir parte inferior
        imageIndices.length = 0
        imageIndices.push(...bottomImages)
        splitSpace(x, y + topHeight, width, height - topHeight, depth + 1)
      } else {
        // Si no se puede dividir bien, poner una imagen y continuar
        layouts.push({
          x,
          y,
          width,
          height,
          imageIndex: imageIndices.pop()!,
        })
      }
    }
  }

  // Iniciar la división recursiva
  splitSpace(0, 0, canvasWidth, canvasHeight)

  return layouts
}

function drawCollage(ctx: CanvasRenderingContext2D, images: HTMLImageElement[], layout: LayoutRect[]) {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Draw each image in its layout position
  layout.forEach((rect) => {
    const img = images[rect.imageIndex]
    if (!img) return

    // Calculate how to crop/scale the image to fill the rect
    const imgAspect = img.width / img.height
    const rectAspect = rect.width / rect.height

    let sx = 0
    let sy = 0
    let sWidth = img.width
    let sHeight = img.height

    if (imgAspect > rectAspect) {
      // Image is wider than rect, crop width
      sWidth = img.height * rectAspect
      sx = (img.width - sWidth) / 2
    } else {
      // Image is taller than rect, crop height
      sHeight = img.width / rectAspect
      sy = (img.height - sHeight) / 2
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, rect.x, rect.y, rect.width, rect.height)
  })
}
