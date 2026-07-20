import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabase/cliente'
import {
  cargarTicketsGanados,
  type EstadoTicket,
  type TicketGanado,
} from '../supabase/api'
import './Perfil.css'

const mesAno = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { month: 'long', year: 'numeric' })

const diaMes = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

export function Perfil({
  estado,
  negocioId,
}: {
  estado: EstadoTicket
  negocioId: string
}) {
  const { perfil, disponibles, canjes } = estado
  const nombre = perfil.nombre ?? 'Cliente'
  const iniciales = nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  // El historial de tickets ganados. Se recarga cuando cambian los canjes o los
  // tickets disponibles (o sea, cuando el empleado escaneó o validó en vivo).
  const [ganados, setGanados] = useState<TicketGanado[] | null>(null)
  useEffect(() => {
    cargarTicketsGanados(negocioId).then(setGanados).catch(() => setGanados([]))
  }, [negocioId, disponibles, canjes.length])

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Mi perfil</h1>
      </header>

      <section className="tarjeta perfil__identidad">
        <div className="perfil__avatar">{iniciales}</div>
        <div>
          <h2 className="perfil__nombre">{nombre}</h2>
          <p className="perfil__desde">Miembro desde {mesAno(perfil.creado_en)}</p>
        </div>
      </section>

      <section className="tarjeta perfil__qr">
        <h2 className="tarjeta__titulo">Tu código</h2>
        <p className="perfil__qr-ayuda">
          Muestra este QR en caja. El personal lo escanea y suma tu ticket del día.
        </p>

        <div className="qr-marco">
          <QRCodeSVG
            value={perfil.codigo}
            size={188}
            level="M"
            marginSize={0}
            fgColor="#3A2A2E"
            bgColor="#FFFFFF"
          />
        </div>

        <p className="perfil__codigo">{perfil.codigo}</p>
      </section>

      <section className="perfil__cifras">
        <div className="cifra">
          <span className="cifra__valor">{disponibles}</span>
          <span className="cifra__etiqueta">Tickets disponibles</span>
        </div>
        <div className="cifra">
          <span className="cifra__valor">{canjes.length}</span>
          <span className="cifra__etiqueta">Premios canjeados</span>
        </div>
      </section>

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">Premios canjeados</h2>
        {canjes.length > 0 ? (
          <>
            <ul className="historial">
              {canjes.map((c) => {
                const nivel = estado.niveles.find((n) => n.nivel_id === c.nivel_id)
                return (
                  <li key={c.canje_id} className="historial__fila">
                    <span className="historial__nombre">
                      {nivel?.nombre ?? 'Premio'}
                    </span>
                    <span className="historial__fecha">
                      {new Date(c.canjeado_en).toLocaleDateString('es')}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="historial__nota">
              Todos entregados y validados por el personal en tienda.
            </p>
          </>
        ) : (
          <p className="historial__vacio">
            Aún no canjeas ningún premio. Junta tickets y completa tu primer nivel.
          </p>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">Tickets ganados</h2>
        {ganados === null ? (
          <p className="historial__vacio">Cargando…</p>
        ) : ganados.length > 0 ? (
          <ul className="historial">
            {ganados.map((t) => (
              <li key={t.ticket_id} className="historial__fila">
                <span className="historial__nombre">
                  {t.sucursal}
                  {t.canjeado && <span className="historial__usado">usado</span>}
                </span>
                <span className="historial__fecha">{diaMes(t.creado_en)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="historial__vacio">
            Todavía no tienes tickets. Escanea tu QR en caja para empezar.
          </p>
        )}
      </section>

      <button
        className="boton boton--texto"
        onClick={() => void supabase.auth.signOut()}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
