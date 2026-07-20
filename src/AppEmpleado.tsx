import { useState } from 'react'
import { Escaner } from './pantallas/empleado/Escaner'
import { Validar } from './pantallas/empleado/Validar'
import { Equipo } from './pantallas/empleado/Equipo'
import { Niveles } from './pantallas/empleado/Niveles'
import { supabase } from './supabase/cliente'
import type { Empleado } from './supabase/api'
import './pantallas/empleado/Empleado.css'

type Vista = 'escanear' | 'canjear' | 'panel' | 'cuenta'
type SeccionPanel = 'niveles' | 'equipo'

function IconoCamara({ activo }: { activo?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M4 8.5h3l1.4-2h7.2L17 8.5h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13.5"
        r="3.2"
        fill={activo ? 'var(--papel)' : 'none'}
        stroke={activo ? 'none' : 'currentColor'}
        strokeWidth="1.8"
      />
    </svg>
  )
}

function IconoTeclado({ activo }: { activo?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect
        x="2.5"
        y="6"
        width="19"
        height="12"
        rx="2"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M8 14h8"
        stroke={activo ? 'var(--papel)' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconoPanel({ activo }: { activo?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.6"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.6"
        fill={activo ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function IconoCuenta({ activo }: { activo?: boolean }) {
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

interface Props {
  empleado: Empleado
  negocioId: string
  /** Luis también compra dulces: puede mirar su propia tarjeta de cliente. */
  alVerComoCliente: () => void
}

export function AppEmpleado({ empleado, negocioId, alVerComoCliente }: Props) {
  const [vista, setVista] = useState<Vista>('escanear')
  const [seccion, setSeccion] = useState<SeccionPanel>('niveles')
  const esGerente = empleado.rol === 'gerente'

  const tabs: { id: Vista; etiqueta: string; Icono: typeof IconoCamara }[] = [
    { id: 'escanear', etiqueta: 'Escanear', Icono: IconoCamara },
    { id: 'canjear', etiqueta: 'Canjear', Icono: IconoTeclado },
    ...(esGerente
      ? [{ id: 'panel' as Vista, etiqueta: 'Panel', Icono: IconoPanel }]
      : []),
    { id: 'cuenta', etiqueta: 'Cuenta', Icono: IconoCuenta },
  ]

  return (
    <div className="app app--empleado">
      <div className="franja-empleado">
        {esGerente ? 'Gerente' : 'Empleado'} · {empleado.nombre}
      </div>

      <main className="app__vista">
        {vista === 'escanear' && <Escaner />}
        {vista === 'canjear' && <Validar />}
        {vista === 'panel' && esGerente && (
          <>
            <div className="panel-nav">
              <button
                className={`panel-nav__tab ${seccion === 'niveles' ? 'panel-nav__tab--activa' : ''}`}
                onClick={() => setSeccion('niveles')}
              >
                Niveles
              </button>
              <button
                className={`panel-nav__tab ${seccion === 'equipo' ? 'panel-nav__tab--activa' : ''}`}
                onClick={() => setSeccion('equipo')}
              >
                Equipo
              </button>
            </div>
            {seccion === 'niveles' && <Niveles negocioId={negocioId} />}
            {seccion === 'equipo' && <Equipo yo={empleado} />}
          </>
        )}
        {vista === 'cuenta' && (
          <div className="pantalla">
            <header className="cabecera">
              <h1 className="cabecera__titulo">Mi cuenta</h1>
            </header>

            <section className="tarjeta perfil__identidad">
              <div className="perfil__avatar perfil__avatar--empleado">
                {empleado.nombre
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <h2 className="perfil__nombre">{empleado.nombre}</h2>
                <p className="perfil__correo">
                  {empleado.cargo ?? 'Sin cargo'}
                  {esGerente && ' · gerente'}
                </p>
              </div>
            </section>

            <section className="tarjeta">
              <h2 className="tarjeta__titulo">Mi tarjeta de cliente</h2>
              <p className="empleado__ayuda">
                Trabajar aquí no te quita ser clienta o cliente: puedes juntar
                tickets como cualquiera, en tu día libre. Lo único que no puedes
                es escanearte a ti mismo.
              </p>
              <button
                className="boton boton--suave equipo__accion"
                onClick={alVerComoCliente}
              >
                Ver mi tarjeta
              </button>
            </section>

            <button
              className="boton boton--texto"
              onClick={() => void supabase.auth.signOut()}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </main>

      <nav className="tabs" aria-label="Navegación del personal">
        {tabs.map(({ id, etiqueta, Icono }) => {
          const activa = id === vista
          return (
            <button
              key={id}
              className={`tab ${activa ? 'tab--activa' : ''}`}
              onClick={() => setVista(id)}
              aria-current={activa ? 'page' : undefined}
            >
              <span className="tab__icono">
                <Icono activo={activa} />
              </span>
              <span className="tab__etiqueta">{etiqueta}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
