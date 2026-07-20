import { useEffect, useRef, useState } from 'react'
import {
  cargarNiveles,
  crearNivel,
  darDeBajaNivel,
  subirImagenPremio,
} from '../../supabase/api'
import type { Nivel } from '../../supabase/tipos'
import { prepararImagenPremio } from '../../lib/imagen'
import { useContrasenaGate } from '../../componentes/DialogoContrasena'
import './Empleado.css'

// Solo números que cierran en rejilla: tickets_necesarios ES el número de piezas
// del rompecabezas. Un 7 dejaría una pieza suelta y la imagen se vería rota.
const TICKETS_VALIDOS = [4, 6, 9, 12]

interface Borrador {
  orden: number
  nombre: string
  descripcion: string
  tickets: number
  imagenUrl: string | null
  archivo: File | null
  esNuevo: boolean
}

export function Niveles({ negocioId }: { negocioId: string }) {
  const [niveles, setNiveles] = useState<Nivel[] | null>(null)
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)
  const { pedir, dialogo } = useContrasenaGate()

  async function recargar() {
    try {
      setNiveles(await cargarNiveles(negocioId))
    } catch {
      setNiveles([])
    }
  }

  useEffect(() => {
    void recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId])

  function nuevo() {
    const siguiente = (niveles ?? []).reduce((m, n) => Math.max(m, n.orden), 0) + 1
    setBorrador({
      orden: siguiente,
      nombre: '',
      descripcion: '',
      tickets: 4,
      imagenUrl: null,
      archivo: null,
      esNuevo: true,
    })
    setAviso(null)
  }

  function editar(n: Nivel) {
    setBorrador({
      orden: n.orden,
      nombre: n.nombre,
      descripcion: n.descripcion ?? '',
      tickets: n.tickets_necesarios,
      imagenUrl: n.imagen_url,
      archivo: null,
      esNuevo: false,
    })
    setAviso(null)
  }

  async function guardar() {
    if (!borrador) return
    setSubiendo(true)
    try {
      let url = borrador.imagenUrl
      if (borrador.archivo) {
        const blob = await prepararImagenPremio(borrador.archivo)
        url = await subirImagenPremio(negocioId, blob)
      }
      const r = await crearNivel({
        orden: borrador.orden,
        nombre: borrador.nombre.trim(),
        descripcion: borrador.descripcion,
        imagenUrl: url,
        ticketsNecesarios: borrador.tickets,
      })
      if (r.resultado === 'creado') {
        setBorrador(null)
        await recargar()
      } else {
        setAviso(r.mensaje ?? 'No se pudo guardar')
      }
    } catch {
      setAviso('No se pudo guardar el nivel')
    }
    setSubiendo(false)
  }

  function quitar(n: Nivel) {
    pedir(
      async () => {
        const r = await darDeBajaNivel(n.orden)
        if (r.resultado === 'dado_de_baja') await recargar()
        else setAviso(r.mensaje ?? 'No se pudo quitar')
      },
      {
        titulo: `¿Quitar "${n.nombre}"?`,
        detalle:
          'Deja de ofrecerse a los clientes. Los canjes ya hechos de este nivel se conservan.',
      },
    )
  }

  function pedirGuardar() {
    if (!borrador?.nombre.trim()) {
      setAviso('Ponle un título al premio')
      return
    }
    pedir(guardar, {
      titulo: borrador.esNuevo ? 'Crear nivel nuevo' : `Guardar cambios del nivel ${borrador.orden}`,
      detalle: borrador.esNuevo
        ? 'Se añadirá a la escalera de premios de tu negocio.'
        : 'Se reemplaza por esta versión; el historial de canjes no cambia.',
    })
  }

  if (!niveles) {
    return <div className="cargando">Cargando niveles…</div>
  }

  // --- Formulario de creación / edición ---
  if (borrador) {
    const previa = borrador.archivo
      ? URL.createObjectURL(borrador.archivo)
      : (borrador.imagenUrl ?? '/premio-combo.svg')

    return (
      <div className="niveles">
        <header className="cabecera">
          <h1 className="cabecera__titulo">
            {borrador.esNuevo ? 'Nuevo nivel' : `Nivel ${borrador.orden}`}
          </h1>
        </header>

        <div className="tarjeta nivel-form">
          <button
            type="button"
            className="nivel-form__imagen"
            onClick={() => inputArchivo.current?.click()}
          >
            <img src={previa} alt="" />
            <span className="nivel-form__cambiar">Cambiar imagen</span>
          </button>
          <input
            ref={inputArchivo}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setBorrador({ ...borrador, archivo: f })
            }}
          />

          <label className="campo">
            <span className="campo__etiqueta">Título del premio</span>
            <input
              value={borrador.nombre}
              onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
              placeholder="Ej. Combo Dulce"
              maxLength={60}
            />
          </label>

          <label className="campo">
            <span className="campo__etiqueta">Descripción (opcional)</span>
            <input
              value={borrador.descripcion}
              onChange={(e) =>
                setBorrador({ ...borrador, descripcion: e.target.value })
              }
              placeholder="Qué incluye el premio"
              maxLength={120}
            />
          </label>

          <div className="campo">
            <span className="campo__etiqueta">Tickets para ganarlo</span>
            <div className="tickets-opciones">
              {TICKETS_VALIDOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tickets-opcion ${borrador.tickets === t ? 'tickets-opcion--activa' : ''}`}
                  onClick={() => setBorrador({ ...borrador, tickets: t })}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="campo__nota">
              Solo estos números: cada ticket es una pieza del rompecabezas y
              deben formar una rejilla completa.
            </p>
          </div>

          {aviso && <div className="empleado__aviso">{aviso}</div>}

          <div className="nivel-form__acciones">
            <button
              className="boton boton--suave"
              onClick={() => setBorrador(null)}
              disabled={subiendo}
            >
              Cancelar
            </button>
            <button
              className="boton boton--principal"
              onClick={pedirGuardar}
              disabled={subiendo}
            >
              {subiendo ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        {dialogo}
      </div>
    )
  }

  // --- Lista de niveles ---
  return (
    <div className="niveles">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Niveles</h1>
        <p className="cabecera__sub">La escalera de premios de tu negocio.</p>
      </header>

      {aviso && <div className="empleado__aviso">{aviso}</div>}

      <ul className="niveles-lista">
        {niveles.map((n) => (
          <li key={n.nivel_id} className="tarjeta nivel-fila">
            <div
              className="nivel-fila__mini"
              style={{ backgroundImage: `url(${n.imagen_url ?? '/premio-combo.svg'})` }}
            />
            <div className="nivel-fila__info">
              <p className="nivel-fila__nombre">
                <span className="nivel-fila__orden">Nivel {n.orden}</span>
                {n.nombre}
              </p>
              <p className="nivel-fila__meta">{n.tickets_necesarios} tickets</p>
            </div>
            <div className="nivel-fila__acciones">
              <button className="boton boton--suave" onClick={() => editar(n)}>
                Editar
              </button>
              <button className="nivel-fila__quitar" onClick={() => quitar(n)}>
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button className="boton boton--principal niveles__nuevo" onClick={nuevo}>
        + Nuevo nivel
      </button>

      {dialogo}
    </div>
  )
}
