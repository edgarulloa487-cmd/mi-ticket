import { useEffect, useState } from 'react'
import {
  cargarEquipo,
  desactivarEmpleado,
  reactivarEmpleado,
  type Empleado,
  type MiembroEquipo,
} from '../../supabase/api'
import { useContrasenaGate } from '../../componentes/DialogoContrasena'
import './Empleado.css'

/**
 * Equipo — solo gerentes. La RLS decide el alcance: devuelve la gente de las
 * sucursales que este gerente maneja, y nada más. Un gerente puede llevar una o
 * varias, por eso se agrupa por sucursal.
 */
export function Equipo({ yo }: { yo: Empleado }) {
  const [equipo, setEquipo] = useState<MiembroEquipo[] | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const { pedir, dialogo } = useContrasenaGate()

  async function recargar() {
    try {
      setEquipo(await cargarEquipo())
    } catch {
      setEquipo([])
    }
  }

  useEffect(() => {
    void recargar()
  }, [])

  // Cambiar el permiso de escanear es una acción sensible: pide contraseña.
  function alternar(e: MiembroEquipo) {
    pedir(
      async () => {
        setOcupado(e.empleado_id)
        try {
          const r = e.activo
            ? await desactivarEmpleado(e.empleado_id)
            : await reactivarEmpleado(e.empleado_id)
          setAviso(r.mensaje ?? null)
          await recargar()
        } finally {
          setOcupado(null)
        }
      },
      {
        titulo: e.activo
          ? `¿Quitar el permiso a ${e.nombre}?`
          : `¿Devolver el permiso a ${e.nombre}?`,
        detalle: e.activo
          ? 'Dejará de poder escanear. Su cuenta de cliente no se toca.'
          : 'Volverá a poder escanear en tu negocio.',
      },
    )
  }

  if (!equipo) {
    return (
      <div className="pantalla">
        <div className="cargando">Cargando equipo…</div>
      </div>
    )
  }

  // Agrupado por sucursal: un gerente puede llevar varias, y hay que ver de cuál
  // es cada persona antes de quitarle nada.
  const porSucursal = equipo.reduce<Record<string, MiembroEquipo[]>>((acc, e) => {
    ;(acc[e.sucursal] ??= []).push(e)
    return acc
  }, {})
  const sucursales = Object.keys(porSucursal).sort()

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Equipo</h1>
        <p className="cabecera__sub">
          Quién puede escanear en {sucursales.length === 1 ? 'tu sucursal' : 'tus sucursales'}.
        </p>
      </header>

      {aviso && <div className="empleado__aviso">{aviso}</div>}

      {sucursales.map((suc) => (
        <section key={suc}>
          {sucursales.length > 1 && <p className="equipo__sucursal">{suc}</p>}
          <ul className="equipo">
            {porSucursal[suc].map((e) => (
              <li key={e.empleado_id} className="equipo__fila tarjeta">
                <div className="equipo__quien">
                  <p className="equipo__nombre">
                    {e.nombre}
                    {e.empleado_id === yo.empleado_id && (
                      <span className="equipo__tu">tú</span>
                    )}
                  </p>
                  <p className="equipo__cargo">
                    {e.cargo ?? 'Sin cargo'}
                    {e.rol === 'gerente' && ' · gerente'}
                  </p>
                  <p
                    className={`equipo__estado ${
                      e.activo ? 'equipo__estado--si' : 'equipo__estado--no'
                    }`}
                  >
                    {e.activo ? 'Puede escanear' : 'Sin permiso de escanear'}
                  </p>
                </div>

                {e.empleado_id !== yo.empleado_id && (
                  <button
                    className={`boton ${e.activo ? 'boton--suave' : 'boton--principal'} equipo__accion`}
                    onClick={() => void alternar(e)}
                    disabled={ocupado === e.empleado_id}
                  >
                    {e.activo ? 'Quitar permiso' : 'Devolver permiso'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* El gerente va a creer que "quitar" borra a la persona. No lo hace, y si
          no se lo decimos aquí, el malentendido lo creamos nosotros. */}
      <section className="tarjeta empleado__nota">
        <p>
          <strong>Quitar el permiso no borra a nadie.</strong> La persona
          conserva su cuenta y, si es clienta, sus tickets y premios siguen
          intactos: se los ganó comprando, no trabajando. Lo único que pierde es
          poder escanear, y se le puede devolver cuando quieras.
        </p>
      </section>

      {dialogo}
    </div>
  )
}
