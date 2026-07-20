import { useEffect, useState } from 'react'
import {
  cargarHistorialPersonal,
  type MovimientoPersonal,
} from '../../supabase/api'
import './Empleado.css'

const cuando = (iso: string) =>
  new Date(iso).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Agrupa por día para que se lea como una bitácora, no como un volcado. */
function dia(iso: string) {
  const f = new Date(iso)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)
  const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (mismoDia(f, hoy)) return 'Hoy'
  if (mismoDia(f, ayer)) return 'Ayer'
  return f.toLocaleDateString('es', { day: 'numeric', month: 'long' })
}

/**
 * Historial de actividad del personal.
 *
 * Es la misma pantalla para empleado y gerente: el alcance lo decide la función
 * de la base, no esta vista. Por eso `esGerente` aquí solo cambia el texto y si
 * se muestra quién hizo cada movimiento — nunca qué datos llegan.
 */
export function Historial({ esGerente }: { esGerente: boolean }) {
  const [movs, setMovs] = useState<MovimientoPersonal[] | null>(null)
  const [error, setError] = useState(false)

  async function recargar() {
    setError(false)
    try {
      setMovs(await cargarHistorialPersonal())
    } catch {
      setMovs([])
      setError(true)
    }
  }

  useEffect(() => {
    void recargar()
  }, [])

  if (!movs) {
    return <div className="cargando">Cargando historial…</div>
  }

  // Cabecera de día, insertada al vuelo mientras se recorre la lista ordenada.
  let ultimoDia = ''

  return (
    <div className="niveles">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Historial</h1>
        <p className="cabecera__sub">
          {esGerente
            ? 'Actividad de tu equipo en las sucursales que manejas.'
            : 'Los tickets que has dado y los canjes que validaste.'}
        </p>
      </header>

      {error && (
        <div className="empleado__aviso">No se pudo cargar. Toca Actualizar.</div>
      )}

      {movs.length === 0 ? (
        <section className="tarjeta">
          <p className="empleado__ayuda">
            {esGerente
              ? 'Todavía no hay movimientos en tus sucursales.'
              : 'Aún no has dado ningún ticket. Cuando escanees a un cliente, aparecerá aquí.'}
          </p>
        </section>
      ) : (
        <ul className="bitacora">
          {movs.map((m, i) => {
            const d = dia(m.ocurrido_en)
            const nuevoDia = d !== ultimoDia
            ultimoDia = d
            return (
              <li key={`${m.ocurrido_en}-${i}`}>
                {nuevoDia && <p className="bitacora__dia">{d}</p>}
                <div className="tarjeta bitacora__fila">
                  <span
                    className={`bitacora__marca bitacora__marca--${m.tipo}`}
                    aria-hidden="true"
                  >
                    {m.tipo === 'ticket' ? '+1' : '★'}
                  </span>
                  <div className="bitacora__cuerpo">
                    <p className="bitacora__titulo">
                      {m.tipo === 'ticket'
                        ? `Ticket a ${m.cliente ?? 'cliente'}`
                        : `Premio entregado a ${m.cliente ?? 'cliente'}`}
                    </p>
                    <p className="bitacora__meta">
                      {cuando(m.ocurrido_en)} · {m.sucursal}
                      {m.detalle && ` · ${m.detalle}`}
                    </p>
                    {/* Para un empleado siempre sería él mismo: redundante. */}
                    {esGerente && (
                      <p className="bitacora__quien">{m.empleado}</p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button className="boton boton--suave" onClick={() => void recargar()}>
        Actualizar
      </button>
    </div>
  )
}
