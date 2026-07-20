import { useState } from 'react'
import { validarCodigo, type RespuestaCanje } from '../../supabase/api'
import './Empleado.css'

/**
 * Canje: el empleado teclea el código de 6 letras que dicta el cliente.
 *
 * Es un acto deliberado y aparte del escaneo a propósito. Si el escaneo canjeara
 * solo, el sistema daría por entregado un premio que nadie sacó del mostrador.
 * Y que el cliente tenga que dictar el código prueba que estuvo de acuerdo:
 * nadie puede canjearle el premio a sus espaldas.
 */
export function Validar() {
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [res, setRes] = useState<RespuestaCanje | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo.trim() || ocupado) return
    setOcupado(true)
    setRes(null)
    try {
      setRes(await validarCodigo(codigo))
    } catch {
      setRes({ resultado: 'error', mensaje: 'Falló la conexión' })
    }
    setOcupado(false)
    setCodigo('')
  }

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Canjear</h1>
        <p className="cabecera__sub">Entrega el premio y valida el código.</p>
      </header>

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">Código del cliente</h2>
        <p className="empleado__ayuda">
          Seis letras, sin guion. Vence a los 10 minutos de que él lo pide.
        </p>
        <form className="empleado__form" onSubmit={enviar}>
          <input
            className="validar__campo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="boton boton--principal"
            disabled={ocupado || codigo.trim().length < 6}
          >
            {ocupado ? 'Validando…' : 'Validar'}
          </button>
        </form>
      </section>

      {res && (
        <section
          className={`resultado resultado--${
            res.resultado === 'canje_realizado' ? 'ok' : 'mal'
          }`}
        >
          {res.resultado === 'canje_realizado' ? (
            <>
              <p className="resultado__titulo">Canje válido</p>
              <p className="resultado__detalle">
                Entrégale: <strong>{res.premio}</strong>
              </p>
              <p className="resultado__extra">
                Se usaron {res.tickets_usados} tickets
                {res.sobrantes ? ` · le quedan ${res.sobrantes}` : ''}
              </p>
            </>
          ) : (
            <>
              <p className="resultado__titulo">No entregues nada</p>
              <p className="resultado__detalle">{res.mensaje}</p>
            </>
          )}
        </section>
      )}

      <section className="tarjeta empleado__nota">
        <p>
          Valida <strong>después</strong> de entregar el premio. El sistema ya
          comprobó que el cliente tiene los tickets: si el código no sirve, no le
          des nada.
        </p>
      </section>
    </div>
  )
}
