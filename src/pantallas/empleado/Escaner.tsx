import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { otorgarTicket, type RespuestaEscaneo } from '../../supabase/api'
import './Empleado.css'

const CAJA = 'caja-escaner'

/**
 * Escáner del empleado. Lee el QR del cliente y llama `otorgar_ticket`.
 *
 * Toda la validación vive en la función de la base: quién es empleado activo, de
 * qué negocio, si el cliente ya reclamó hoy, si se está escaneando a sí mismo.
 * Aquí no se decide nada — esta pantalla solo enseña la respuesta.
 */
export function Escaner() {
  const [activo, setActivo] = useState(false)
  const [manual, setManual] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [res, setRes] = useState<RespuestaEscaneo | null>(null)
  const lector = useRef<Html5Qrcode | null>(null)
  // Evita disparar 20 veces mientras la cámara sigue viendo el mismo QR.
  const ultimo = useRef<string>('')
  // En ref y no solo en estado: el callback de la cámara se crea una vez y
  // congelaría el `ocupado` de ese render, dejando pasar llamadas en paralelo.
  const ocupadoRef = useRef(false)

  async function enviar(codigo: string) {
    const limpio = codigo.trim().toUpperCase()
    if (!limpio || ocupadoRef.current) return
    ocupadoRef.current = true
    setOcupado(true)
    setRes(null)
    try {
      setRes(await otorgarTicket(limpio))
    } catch {
      setRes({ resultado: 'error', mensaje: 'Falló la conexión' })
    }
    ocupadoRef.current = false
    setOcupado(false)
  }

  useEffect(() => {
    if (!activo) return
    const l = new Html5Qrcode(CAJA)
    lector.current = l
    let vivo = true

    l.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      (texto) => {
        if (texto === ultimo.current) return
        ultimo.current = texto
        void enviar(texto)
        setTimeout(() => (ultimo.current = ''), 2500)
      },
      () => {},
    ).catch(() => {
      if (vivo) {
        setRes({
          resultado: 'error',
          mensaje: 'No se pudo abrir la cámara. Usa el código de abajo.',
        })
        setActivo(false)
      }
    })

    return () => {
      vivo = false
      l.stop()
        .then(() => l.clear())
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo])

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Escanear</h1>
        <p className="cabecera__sub">Un ticket por cliente al día.</p>
      </header>

      <section className="tarjeta">
        <div id={CAJA} className={`camara ${activo ? 'camara--viva' : ''}`}>
          {!activo && <p className="camara__apagada">Cámara apagada</p>}
        </div>

        <button
          className={`boton ${activo ? 'boton--suave' : 'boton--principal'} escaner__toggle`}
          onClick={() => setActivo((v) => !v)}
        >
          {activo ? 'Apagar cámara' : 'Encender cámara'}
        </button>
      </section>

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">O teclea su código</h2>
        <p className="empleado__ayuda">
          El que aparece bajo su QR. Sirve si la cámara falla o la pantalla del
          cliente está rota.
        </p>
        <form
          className="empleado__form"
          onSubmit={(e) => {
            e.preventDefault()
            void enviar(manual)
            setManual('')
          }}
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            placeholder="GLS-XXXXXX"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="boton boton--principal"
            disabled={ocupado || !manual.trim()}
          >
            Dar ticket
          </button>
        </form>
      </section>

      {res && (
        <section
          className={`resultado resultado--${
            res.resultado === 'ticket_otorgado'
              ? 'ok'
              : res.resultado === 'ya_reclamado'
                ? 'aviso'
                : 'mal'
          }`}
        >
          {res.resultado === 'ticket_otorgado' && (
            <>
              <p className="resultado__titulo">Ticket sumado</p>
              <p className="resultado__detalle">
                {res.disponibles} de {res.necesarios} · {res.nivel}
              </p>
              {res.puede_canjear && (
                <p className="resultado__extra">
                  Ya puede canjear. Pídele su código de 6 letras.
                </p>
              )}
            </>
          )}
          {res.resultado === 'ya_reclamado' && (
            <>
              <p className="resultado__titulo">Ya reclamó hoy</p>
              <p className="resultado__detalle">
                {res.disponibles} de {res.necesarios} · {res.nivel}
              </p>
            </>
          )}
          {res.resultado === 'error' && (
            <>
              <p className="resultado__titulo">No se pudo</p>
              <p className="resultado__detalle">{res.mensaje}</p>
            </>
          )}
        </section>
      )}
    </div>
  )
}
