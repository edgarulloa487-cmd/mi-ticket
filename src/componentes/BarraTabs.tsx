import {
  IconoCarrito,
  IconoPerfil,
  IconoTicket,
  IconoUbicacion,
} from './Iconos'
import './BarraTabs.css'

export type Pestana = 'ubicacion' | 'productos' | 'ticket' | 'perfil'

const PESTANAS: {
  id: Pestana
  etiqueta: string
  Icono: (props: { activo?: boolean }) => React.ReactElement
}[] = [
  { id: 'ubicacion', etiqueta: 'Ubicación', Icono: IconoUbicacion },
  { id: 'productos', etiqueta: 'Productos', Icono: IconoCarrito },
  { id: 'ticket', etiqueta: 'Mi ticket', Icono: IconoTicket },
  { id: 'perfil', etiqueta: 'Perfil', Icono: IconoPerfil },
]

interface Props {
  activa: Pestana
  alCambiar: (p: Pestana) => void
  /** Tickets acumulados: se muestran como globo sobre el icono del ticket. */
  tickets: number
}

export function BarraTabs({ activa, alCambiar, tickets }: Props) {
  return (
    <nav className="tabs" aria-label="Navegación principal">
      {/* La forma líquida real (blur + contrast, como .contenedor-efecto-parte-uno
          en Tema-9). Va en un div propio, no en el fondo de .tabs, porque el
          filter: contrast() de acá adentro NO debe tocar los iconos/etiquetas
          nítidos de los botones. */}
      <div className="tabs__burbuja" aria-hidden="true" />
      {PESTANAS.map(({ id, etiqueta, Icono }) => {
        const esActiva = id === activa
        return (
          <button
            key={id}
            className={`tab ${esActiva ? 'tab--activa' : ''}`}
            onClick={() => alCambiar(id)}
            aria-current={esActiva ? 'page' : undefined}
          >
            <span className="tab__icono">
              <Icono activo={esActiva} />
              {id === 'ticket' && tickets > 0 && (
                <span className="tab__globo">{tickets}</span>
              )}
            </span>
            <span className="tab__etiqueta">{etiqueta}</span>
          </button>
        )
      })}
    </nav>
  )
}
