import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BarraTabs, type Pestana } from './componentes/BarraTabs'
import { Login } from './pantallas/Login'
import { MiTicket } from './pantallas/MiTicket'
import { Perfil } from './pantallas/Perfil'
import { Productos } from './pantallas/Productos'
import { Ubicacion } from './pantallas/Ubicacion'
// Carga aparte: el lector de QR pesa ~380 kB y solo lo usa el personal. Sin
// esto, cada cliente se descarga un escáner que nunca va a abrir.
const AppEmpleado = lazy(() =>
  import('./AppEmpleado').then((m) => ({ default: m.AppEmpleado })),
)
import { supabase } from './supabase/cliente'
import {
  cargarEstadoTicket,
  cargarNegocio,
  miEmpleado,
  suscribirseACambios,
  type Empleado,
  type EstadoTicket,
} from './supabase/api'
import type { Negocio, Sucursal } from './supabase/tipos'
import './App.css'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [pestana, setPestana] = useState<Pestana>('ticket')

  // Quién eres decide qué app ves. Una misma persona puede ser empleada y
  // clienta: por eso `modoCliente` existe, para que pueda mirar su tarjeta.
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [modoCliente, setModoCliente] = useState(false)

  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [estado, setEstado] = useState<EstadoTicket | null>(null)
  const [error, setError] = useState<string | null>(null)

  // `aviso` es el banner "+1 ticket" cuando el cliente está en otra pestaña.
  // `pestanaRef` deja leer la pestaña actual dentro de la suscripción Realtime,
  // que se arma una sola vez. (La celebración de la pieza vive en MiTicket: se
  // dispara sola cuando los datos muestran una pieza más.)
  const [aviso, setAviso] = useState(false)
  const pestanaRef = useRef(pestana)
  useEffect(() => {
    pestanaRef.current = pestana
  }, [pestana])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargandoSesion(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const recargar = useCallback(async () => {
    try {
      const [{ negocio, sucursales }, emp] = await Promise.all([
        cargarNegocio(),
        miEmpleado(),
      ])
      setNegocio(negocio)
      setSucursales(sucursales)
      setEmpleado(emp)
      setEstado(await cargarEstadoTicket(negocio.negocio_id))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos')
    }
  }, [])

  // Recargar cuando cambia QUIÉN está logueado — no cada vez que el objeto de
  // sesión se renueva. signInWithPassword (la puerta de contraseña del gerente)
  // y el refresco de token emiten sesiones nuevas con el MISMO usuario, y no
  // deben recargar media app a mitad de una acción.
  const uid = session?.user?.id
  useEffect(() => {
    if (uid) void recargar()
    else {
      setEmpleado(null)
      setModoCliente(false)
    }
  }, [uid, recargar])

  // Realtime: el empleado escaneó/validó y la app del cliente reacciona sola.
  useEffect(() => {
    if (!uid) return
    return suscribirseACambios(uid, (info) => {
      void recargar()
      // Ganar un ticket mueve al cliente hacia el rompecabezas; canjear o el
      // cambio de rol solo refrescan en silencio.
      if (info.tabla === 'tickets' && info.evento === 'INSERT') {
        if (pestanaRef.current === 'perfil') setPestana('ticket')
        else if (pestanaRef.current !== 'ticket') setAviso(true)
      }
    })
  }, [uid, recargar])

  // El banner se retira solo.
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(false), 6000)
    return () => clearTimeout(t)
  }, [aviso])

  if (cargandoSesion) {
    return (
      <div className="app">
        <div className="cargando">Cargando…</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app">
        <Login />
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="cargando">
          <p>{error}</p>
          <button className="boton boton--suave" onClick={() => void recargar()}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!negocio || !estado) {
    return (
      <div className="app">
        <div className="cargando">Cargando…</div>
      </div>
    )
  }

  // El personal entra a SU app, no a la de cliente.
  if (empleado && !modoCliente) {
    return (
      <Suspense
        fallback={
          <div className="app">
            <div className="cargando">Abriendo panel…</div>
          </div>
        }
      >
        <AppEmpleado
          empleado={empleado}
          negocioId={negocio.negocio_id}
          alVerComoCliente={() => setModoCliente(true)}
        />
      </Suspense>
    )
  }

  return (
    <div className="app">
      {empleado && modoCliente && (
        <button className="volver-empleado" onClick={() => setModoCliente(false)}>
          ← Volver a mi panel de {empleado.rol === 'gerente' ? 'gerente' : 'empleado'}
        </button>
      )}

      <div className="app__plano">
        <main className="app__vista">
          {pestana === 'ubicacion' && (
            <Ubicacion negocio={negocio} sucursales={sucursales} />
          )}
          {pestana === 'productos' && <Productos negocioId={negocio.negocio_id} />}
          {pestana === 'ticket' && (
            <MiTicket negocioId={negocio.negocio_id} estado={estado} />
          )}
          {pestana === 'perfil' && (
            <Perfil estado={estado} negocioId={negocio.negocio_id} />
          )}
        </main>

        {aviso && (
          <button
            className="aviso-ticket"
            onClick={() => {
              setPestana('ticket')
              setAviso(false)
            }}
          >
            🎟️ ¡Ganaste un ticket! Toca para verlo
          </button>
        )}

        <BarraTabs
          activa={pestana}
          alCambiar={setPestana}
          tickets={estado.disponibles}
        />
      </div>
    </div>
  )
}
