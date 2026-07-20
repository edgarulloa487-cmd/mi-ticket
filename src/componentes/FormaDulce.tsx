export type Forma =
  | 'paleta'
  | 'chocolate'
  | 'gomita'
  | 'bombon'
  | 'malvavisco'
  | 'caramelo'

interface Props {
  forma: Forma
  colores: [string, string]
}

const PALETAS: [string, string][] = [
  ['#FF6B9D', '#E23E6B'],
  ['#FF8FB1', '#E8436A'],
  ['#FFC46B', '#EF8F2E'],
  ['#7FE3C4', '#34A98A'],
  ['#B79BE8', '#7B5BC4'],
  ['#FF7A7A', '#D93E3E'],
]

const POR_CATEGORIA: Record<string, Forma[]> = {
  Paletas: ['paleta'],
  Chocolates: ['chocolate', 'bombon'],
  Gomitas: ['gomita'],
  Clasicos: ['malvavisco', 'caramelo'],
}

/** Hash estable: el mismo producto siempre se ve igual entre recargas. */
function hash(texto: string) {
  let h = 0
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * La ilustración se deriva del nombre y la categoría, no se guarda en la base:
 * forma y colores son andamiaje visual, no datos del negocio. Cuando haya fotos
 * reales en Storage, `imagen_url` las sustituye y esto deja de usarse.
 */
export function formaDeProducto(
  nombre: string,
  categoria: string,
): { forma: Forma; colores: [string, string] } {
  const h = hash(nombre)
  const opciones = POR_CATEGORIA[categoria] ?? ['caramelo']
  return {
    forma: opciones[h % opciones.length],
    colores: PALETAS[h % PALETAS.length],
  }
}

/**
 * Ilustración de cada producto. Sustituye a la foto real: cuando el negocio
 * entregue su catálogo fotográfico, este componente se cambia por un <img>.
 */
export function FormaDulce({ forma, colores }: Props) {
  const [claro, oscuro] = colores
  const idGrad = `g-${forma}-${claro.slice(1)}`

  return (
    <svg viewBox="0 0 120 120" className="forma-dulce" aria-hidden="true">
      <defs>
        <linearGradient id={idGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={claro} />
          <stop offset="100%" stopColor={oscuro} />
        </linearGradient>
      </defs>

      {forma === 'paleta' && (
        <>
          <rect x="56.5" y="66" width="7" height="44" rx="3.5" fill="#EBD9BE" />
          <circle cx="60" cy="46" r="34" fill={`url(#${idGrad})`} />
          {/* La separación entre vueltas (9) debe superar el grosor del trazo
              (4), o la espiral se rellena sólida. */}
          <path
            d="M60 41.5 A 4.5 4.5 0 0 1 60 50.5 A 9 9 0 0 1 60 32.5 A 13.5 13.5 0 0 1 60 59.5 A 18 18 0 0 1 60 23.5 A 22.5 22.5 0 0 1 60 68.5 A 27 27 0 0 1 60 14.5"
            fill="none"
            stroke="#FFF6E9"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".92"
          />
        </>
      )}

      {forma === 'chocolate' && (
        <>
          <rect x="26" y="18" width="68" height="84" rx="8" fill={`url(#${idGrad})`} />
          <g opacity=".26" fill="#FFF1DC">
            <rect x="34" y="26" width="24" height="32" rx="4" />
            <rect x="62" y="26" width="24" height="32" rx="4" />
            <rect x="34" y="62" width="24" height="32" rx="4" />
            <rect x="62" y="62" width="24" height="32" rx="4" />
          </g>
        </>
      )}

      {forma === 'gomita' && (
        <>
          <circle cx="44" cy="52" r="24" fill={`url(#${idGrad})`} />
          <circle cx="44" cy="52" r="10" fill="#FFF6E9" opacity=".5" />
          <circle cx="78" cy="76" r="18" fill={`url(#${idGrad})`} />
          <circle cx="78" cy="76" r="7.5" fill="#FFF6E9" opacity=".5" />
          <circle cx="82" cy="36" r="12" fill={`url(#${idGrad})`} opacity=".85" />
        </>
      )}

      {forma === 'bombon' && (
        <>
          <path
            d="M28 78h64l-5 22a4 4 0 0 1-4 3H37a4 4 0 0 1-4-3l-5-22Z"
            fill="#C9A227"
            opacity=".35"
          />
          <circle cx="60" cy="56" r="30" fill={`url(#${idGrad})`} />
          <path
            d="M44 42q16-10 32 4"
            fill="none"
            stroke="#FFF6E9"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".45"
          />
          <circle cx="60" cy="26" r="5" fill="#FFF6E9" opacity=".55" />
        </>
      )}

      {forma === 'malvavisco' && (
        <>
          <rect x="24" y="40" width="72" height="46" rx="20" fill={`url(#${idGrad})`} />
          <rect x="24" y="56" width="72" height="9" fill="#E8436A" opacity=".35" />
          <ellipse cx="45" cy="52" rx="10" ry="5" fill="#FFFFFF" opacity=".5" />
        </>
      )}

      {forma === 'caramelo' && (
        <>
          <path d="M28 60 8 44v32l20-16Z" fill={claro} />
          <path d="M92 60l20-16v32L92 60Z" fill={claro} />
          <circle cx="60" cy="60" r="32" fill={`url(#${idGrad})`} />
          <path
            d="M44 46q16-9 32 6"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".6"
          />
        </>
      )}
    </svg>
  )
}
