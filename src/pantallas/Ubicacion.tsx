import { IconoReloj, IconoRuta, IconoTelefono } from '../componentes/Iconos'
import type { Negocio, Sucursal } from '../supabase/tipos'
import './Ubicacion.css'

interface Props {
  negocio: Negocio
  sucursales: Sucursal[]
}

// Horarios y teléfono todavía no viven en la base: no entraron en el diseño
// porque no tocan la lógica de tickets. Al añadirlos, van como columnas de
// `sucursales`.
const HORARIOS = [
  { dias: 'Lunes a viernes', horas: '9:00 – 20:00' },
  { dias: 'Sábado', horas: '10:00 – 21:00' },
  { dias: 'Domingo', horas: '11:00 – 18:00' },
]
const TELEFONO = '+503 2222 3344'

function horarioDeHoy() {
  const dia = new Date().getDay()
  if (dia === 0) return HORARIOS[2]
  if (dia === 6) return HORARIOS[1]
  return HORARIOS[0]
}

export function Ubicacion({ negocio, sucursales }: Props) {
  const hoy = horarioDeHoy()
  const sucursal = sucursales[0]
  const consulta = encodeURIComponent(
    sucursal ? `${sucursal.direccion ?? ''} ${sucursal.nombre}` : negocio.nombre,
  )

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">{negocio.nombre}</h1>
        <p className="cabecera__sub">Dulces artesanales</p>
      </header>

      <div className="mapa">
        <iframe
          title="Mapa del negocio"
          src={`https://www.google.com/maps?q=${consulta}&z=16&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="mapa__nota">Ubicación de ejemplo</div>
      </div>

      {sucursales.map((s) => (
        <section key={s.sucursal_id} className="tarjeta ubicacion__datos">
          <h2 className="tarjeta__titulo">Sucursal {s.nombre}</h2>
          <p className="ubicacion__direccion">{s.direccion}</p>
          <p className="ubicacion__referencia">Zona horaria: {s.zona_horaria}</p>

          <div className="ubicacion__acciones">
            <a
              className="boton boton--principal"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                s.direccion ?? s.nombre,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <IconoRuta />
              Cómo llegar
            </a>
            <a
              className="boton boton--suave"
              href={`tel:${TELEFONO.replace(/\s/g, '')}`}
            >
              <IconoTelefono />
              Llamar
            </a>
          </div>
        </section>
      ))}

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">
          <IconoReloj />
          Horarios
        </h2>
        <ul className="horarios">
          {HORARIOS.map((h) => (
            <li
              key={h.dias}
              className={`horarios__fila ${
                h.dias === hoy.dias ? 'horarios__fila--hoy' : ''
              }`}
            >
              <span>{h.dias}</span>
              <span className="horarios__horas">{h.horas}</span>
            </li>
          ))}
        </ul>
        <p className="ubicacion__aviso">
          Escanea tu QR en caja para sumar un ticket. Uno por día.
        </p>
      </section>
    </div>
  )
}
