interface PropsIcono {
  activo?: boolean
}

/**
 * Iconos de la barra de pestañas. El relleno aparece solo en el icono activo;
 * el resto queda en trazo para que el seleccionado se distinga de un vistazo.
 */

export function IconoUbicacion({ activo }: PropsIcono) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M12 21.5s7-6.1 7-11.2A7 7 0 0 0 5 10.3c0 5.1 7 11.2 7 11.2Z"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.6"
        fill={activo ? '#0a0618' : 'none'}
        stroke={activo ? 'none' : 'currentColor'}
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function IconoCarrito({ activo }: PropsIcono) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M5.5 8h13l-1.2 9.1a2 2 0 0 1-2 1.7H8.7a2 2 0 0 1-2-1.7L5.5 8Z"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 10V7a3 3 0 0 1 6 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconoTicket({ activo }: PropsIcono) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v2.2a2.3 2.3 0 0 0 0 4.6v2.2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2.2a2.3 2.3 0 0 0 0-4.6V7.5Z"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 9.2v1.6M14 13.2v1.6"
        stroke={activo ? '#0a0618' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconoPerfil({ activo }: PropsIcono) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle
        cx="12"
        cy="8.2"
        r="3.6"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.8 19.4a7.2 7.2 0 0 1 14.4 0"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* Iconos sueltos usados dentro de las pantallas */

export function IconoTelefono() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M6.6 4h3l1.5 3.8-1.9 1.4a11 11 0 0 0 4.6 4.6l1.4-1.9L19 13.4v3a1.6 1.6 0 0 1-1.8 1.6A14.2 14.2 0 0 1 5 5.8 1.6 1.6 0 0 1 6.6 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconoRuta() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="m20.5 3.5-7 17-2.6-6.9-6.9-2.6 16.5-7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconoReloj() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5V12l3 1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconoChevron() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="m9.5 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
