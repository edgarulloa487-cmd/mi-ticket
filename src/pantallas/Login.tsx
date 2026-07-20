import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase/cliente'
import './Login.css'

/** Atajos de desarrollo. La etiqueta lleva el ROL, no el puesto: quien prueba
 *  necesita saber qué app va a ver, no cómo se llama el cargo. */
const CUENTAS = [
  { correo: 'ana@correo.com', etiqueta: 'Ana · clienta' },
  { correo: 'luis@correo.com', etiqueta: 'Luis · gerente' },
  { correo: 'sofia@correo.com', etiqueta: 'Sofía · empleada' },
]

/**
 * Login del prototipo: correo y contraseña, porque funciona al instante para
 * demostrar el sistema.
 *
 * En producción esto debería ser magic link. Pedirle contraseña a alguien para
 * ganar un sello de café es demasiada fricción, y la tasa de registro es lo que
 * decide si el negocio siente que el sistema sirvió.
 */
export function Login() {
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setCargando(false)
    }
    // Si entra, onAuthStateChange en App.tsx se encarga del resto.
  }

  return (
    <div className="login">
      <div className="login__marca">
        <img src="/favicon.svg" alt="" width="56" height="56" />
        <h1 className="login__titulo">Mi Ticket</h1>
        <p className="login__lema">Junta tickets, gana premios</p>
      </div>

      <form className="tarjeta login__form" onSubmit={entrar}>
        <label className="campo">
          <span className="campo__etiqueta">Correo</span>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Contraseña</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="login__error">{error}</p>}

        <button
          type="submit"
          className="boton boton--principal login__enviar"
          disabled={cargando}
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="demo login__demo">
        <p className="demo__titulo">Cuentas de prueba</p>
        <p className="demo__nota">
          Datos de desarrollo. Cada rol entra a una app distinta: Ana ve su
          tarjeta; Luis y Sofía ven el panel de caja, y solo Luis tiene Equipo.
        </p>
        <div className="login__cuentas">
          {CUENTAS.map((c) => (
            <button
              key={c.correo}
              type="button"
              className="boton boton--suave"
              onClick={() => {
                setCorreo(c.correo)
                setClave('prueba1234')
              }}
            >
              {c.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
