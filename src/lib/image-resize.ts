// Executado no NAVEGADOR: reduz e comprime a imagem antes do envio.
// Fotos de celular (5–15 MB) viram arquivos de ~200–600 KB.

type ResizeOptions = { width: number; height: number; crop: boolean; quality?: number };

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function resizeImage(file: File, { width, height, crop, quality = 0.86 }: ResizeOptions): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não conseguimos ler esta imagem. Use uma foto JPG, PNG ou WEBP.");
  }

  const { width: sw, height: sh } = bitmap;
  let sx = 0;
  let sy = 0;
  let cropW = sw;
  let cropH = sh;

  if (crop) {
    // Recorte central na proporção de destino (ex.: quadrado para a foto de perfil).
    const target = width / height;
    if (sw / sh > target) {
      cropW = Math.round(sh * target);
      sx = Math.round((sw - cropW) / 2);
    } else {
      cropH = Math.round(sw / target);
      sy = Math.round((sh - cropH) / 2);
    }
  }

  const scale = Math.min(1, width / cropW, height / cropH);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropW * scale));
  canvas.height = Math.max(1, Math.round(cropH * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // WEBP quando suportado; senão JPEG (Safari antigo não gera WEBP).
  const webp = await canvasToBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
  if (jpeg) return jpeg;
  throw new Error("Seu navegador não conseguiu processar a imagem.");
}
