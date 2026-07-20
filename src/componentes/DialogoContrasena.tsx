import { useCallback, useState, type FormEvent, type ReactNode } from 'react'
import { verificarContrasena } from '../supabase/api'
import './DialogoContrasena.css'

interface Pendiente {
  titulo: string
  detalle: string
  accion: () => Promise<void>
}

/**
 * Puerta de contraseña para acciones sensibles (crear, agregar, borrar).
 *
 * `pedir(accion, {titulo, detalle})` abre el diálogo; la acción solo corre si la
 * contraseña es correcta. Es una capa de "confirma que eres tú ahora" contra el
 * teléfono desatendido en el mostrador — la RLS sigue siendo la barrera real.
 */
export function useContrasenaGate(): {
  pedir: (accion: () => Promise<void>, opts: { titulo: string; detalle: string }) => void
  dialogo: ReactNode
} {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const pedir = useCallback(
    (accion: () => Promise<void>, opts: { titulo: string; detalle: string }) => {
      setPendiente({ accion, ...opts })
      setClave('')
      setError(null)
    },
    [],
  )

  function cerrar() {
    if (ocupado) return
    setPendiente(null)
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    if (!pendiente || ocupado) return
    setOcupado(true)
    setError(null)

    const ok = await verificarContrasena(clave)
    if (!ok) {
      setError('Contraseña incorrecta')
      setOcupado(false)
      return
    }

    try {
      await pendiente.accion()
      setPendiente(null)
    } catch {
      setError('No se pudo completar la acción')
    }
    setOcupado(false)
  }

  const dialogo = pendiente ? (
    <div className="modal-fondo" onClick={cerrar}>
      <form className="modal" onSubmit={confirmar} onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__titulo">{pendiente.titulo}</h2>
        <p className="modal__detalle">{pendiente.detalle}</p>
        <p className="modal__seguridad">Confirma con tu contraseña de gerente.</p>

        <input
          className="modal__clave"
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          autoFocus
        />

        {error && <p className="modal__error">{error}</p>}

        <div className="modal__botones">
          <button
            type="button"
            className="boton boton--suave"
            onClick={cerrar}
            disabled={ocupado}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="boton boton--principal"
            disabled={ocupado || !clave}
          >
            {ocupado ? 'Verificando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  ) : null

  return { pedir, dialogo }
}
