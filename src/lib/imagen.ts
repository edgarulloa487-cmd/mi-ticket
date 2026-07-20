/**
 * Reduce una imagen a un cuadrado de como máximo `lado` px y la devuelve como
 * JPEG. Los premios se muestran como rompecabezas cuadrado, así que se recorta
 * al centro. Sin esto, una foto de celular (4 MB) se subiría entera y cada nivel
 * cargaría lentísimo.
 */
export async function prepararImagenPremio(
  archivo: File,
  lado = 800,
): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo)

  // Recorte cuadrado centrado.
  const corte = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - corte) / 2
  const sy = (bitmap.height - corte) / 2

  const canvas = document.createElement('canvas')
  canvas.width = lado
  canvas.height = lado
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(bitmap, sx, sy, corte, corte, 0, 0, lado, lado)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar'))),
      'image/jpeg',
      0.85,
    )
  })
}
