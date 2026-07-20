import { useEffect, useMemo, useRef, useState } from 'react'
import { generarCodigoCanje, type EstadoTicket } from '../supabase/api'
import './MiTicket.css'

interface Props {
  negocioId: string
  estado: EstadoTicket
}

/**
 * La rejilla se deriva del nivel: tickets_necesarios ES el número de piezas.
 * Por eso los niveles usan números que cierran (4=2×2, 6=3×2, 9=3×3): un primo
 * como 7 dejaría una pieza suelta y la imagen se vería rota.
 */
function rejilla(piezas: number) {
  const columnas = Math.ceil(Math.sqrt(piezas))
  return { columnas, filas: Math.ceil(piezas / columnas) }
}

function Confeti() {
  const piezas = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        izq: Math.random() * 100,
        retraso: Math.random() * 0.35,
        duracion: 1.5 + Math.random() * 0.9,
        giro: Math.random() * 360,
        color: ['#E23E6B', '#F7B267', '#4FC3A1', '#7B5BC4', '#FF8FB1'][i % 5],
      })),
    [],
  )
  return (
    <div className="confeti" aria-hidden="true">
      {piezas.map((p) => (
        <span
          key={p.id}
          className="confeti__pieza"
          style={{
            left: `${p.izq}%`,
            background: p.color,
            animationDelay: `${p.retraso}s`,
            animationDuration: `${p.duracion}s`,
            rotate: `${p.giro}deg`,
          }}
        />
      ))}
    </div>
  )
}

function Cuenta({ hasta }: { hasta: string }) {
  const [restante, setRestante] = useState(() =>
    Math.max(0, Math.floor((new Date(hasta).getTime() - Date.now()) / 1000)),
  )
  useEffect(() => {
    const t = setInterval(() => {
      setRestante(
        Math.max(0, Math.floor((new Date(hasta).getTime() - Date.now()) / 1000)),
      )
    }, 1000)
    return () => clearInterval(t)
  }, [hasta])

  const min = Math.floor(restante / 60)
  const seg = restante % 60
  return (
    <span className="codigo__cuenta">
      {restante > 0 ? `Vence en ${min}:${String(seg).padStart(2, '0')}` : 'Vencido'}
    </span>
  )
}

export function MiTicket({ negocioId, estado }: Props) {
  const { nivelActual, niveles, disponibles, puedeCanjear } = estado
  const total = nivelActual.tickets_necesarios
  const { columnas, filas } = rejilla(total)

  // En la tarjeta nunca se pasa del tope: si tiene 6 y el nivel pide 4, se ven
  // 4/4 y los 2 extra quedan guardados para el siguiente nivel.
  const enTarjeta = Math.min(disponibles, total)
  const completo = enTarjeta >= total

  const [entrada, setEntrada] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEntrada(true), 140)
    return () => clearTimeout(t)
  }, [])
  const revelados = entrada ? enTarjeta : 0

  // Pieza recién ganada: late 3 veces. Se detecta cuando la tarjeta MUESTRA una
  // pieza más que antes (los datos ya llegaron), no cuando llega el evento
  // Realtime — el evento gana la carrera a la recarga y haría latir la pieza
  // equivocada (la de ayer) con datos viejos.
  const [festejada, setFestejada] = useState<number | null>(null)
  const tarjetaPrevia = useRef(enTarjeta)
  useEffect(() => {
    const antes = tarjetaPrevia.current
    tarjetaPrevia.current = enTarjeta
    if (enTarjeta > antes) {
      setFestejada(enTarjeta - 1)
      const t = setTimeout(() => setFestejada(null), 2000)
      return () => clearTimeout(t)
    }
  }, [enTarjeta])

  const [codigo, setCodigo] = useState<{ codigo: string; expira: string } | null>(
    null,
  )
  const [pidiendo, setPidiendo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const siguiente = niveles.find((n) => n.orden === nivelActual.orden + 1)
  const imagen = nivelActual.imagen_url ?? '/premio-combo.svg'

  async function pedirCodigo() {
    setPidiendo(true)
    setAviso(null)
    try {
      const r = await generarCodigoCanje(negocioId)
      if (r.resultado === 'codigo_generado' && r.codigo && r.expira_en) {
        setCodigo({ codigo: r.codigo, expira: r.expira_en })
      } else {
        setAviso(r.mensaje ?? 'No se pudo generar el código')
      }
    } catch {
      setAviso('No se pudo generar el código')
    }
    setPidiendo(false)
  }

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Mi ticket</h1>
        <p className="cabecera__sub">
          Nivel {nivelActual.orden} · Completa el rompecabezas y el premio es tuyo.
        </p>
      </header>

      <section className={`tarjeta premio ${completo ? 'premio--completo' : ''}`}>
        <div
          className={`rompecabezas ${completo && entrada ? 'rompecabezas--completo' : ''}`}
        >
          <div
            className="rompecabezas__fondo"
            style={{ backgroundImage: `url(${imagen})` }}
          />
          <div
            className="rompecabezas__rejilla"
            style={{
              gridTemplateColumns: `repeat(${columnas}, 1fr)`,
              gridTemplateRows: `repeat(${filas}, 1fr)`,
            }}
          >
            {Array.from({ length: total }, (_, i) => {
              const col = i % columnas
              const fila = Math.floor(i / columnas)
              return (
                <div
                  key={i}
                  className={`pieza ${i < revelados ? 'pieza--revelada' : ''} ${
                    i === festejada ? 'pieza--festejada' : ''
                  }`}
                  style={{
                    backgroundImage: `url(${imagen})`,
                    backgroundSize: `${columnas * 100}% ${filas * 100}%`,
                    backgroundPosition: `${columnas > 1 ? (col / (columnas - 1)) * 100 : 0}% ${
                      filas > 1 ? (fila / (filas - 1)) * 100 : 0
                    }%`,
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
              )
            })}
          </div>
          {completo && entrada && <Confeti />}
        </div>

        <div className="premio__info">
          <h2 className="premio__nombre">{nivelActual.nombre}</h2>
          {nivelActual.descripcion && (
            <p className="premio__descripcion">{nivelActual.descripcion}</p>
          )}
        </div>

        <div className="progreso">
          <div className="progreso__pista">
            <div
              className="progreso__barra"
              style={{ width: `${(revelados / total) * 100}%` }}
            />
          </div>
          <p className="progreso__texto">
            <strong>{enTarjeta}</strong> de {total} tickets
            {disponibles > total && (
              <span className="progreso__extra">
                {' '}
                · +{disponibles - total} para el siguiente nivel
              </span>
            )}
          </p>
        </div>

        {codigo ? (
          <div className="codigo">
            <p className="codigo__ayuda">Dicta este código en caja</p>
            <p className="codigo__valor">{codigo.codigo}</p>
            <Cuenta hasta={codigo.expira} />
          </div>
        ) : puedeCanjear ? (
          <button
            className="boton boton--principal premio__canjear"
            onClick={() => void pedirCodigo()}
            disabled={pidiendo}
          >
            {pidiendo ? 'Generando…' : `Canjear ${nivelActual.nombre}`}
          </button>
        ) : (
          <div className="premio__aviso">
            Te faltan {total - disponibles} tickets. Solo uno por día.
          </div>
        )}

        {aviso && <div className="premio__aviso premio__aviso--espera">{aviso}</div>}
      </section>

      {siguiente && (
        <section className="tarjeta siguiente">
          <p className="siguiente__etiqueta">Siguiente nivel</p>
          <div className="siguiente__fila">
            <div
              className="siguiente__mini"
              style={{
                backgroundImage: `url(${siguiente.imagen_url ?? '/premio-combo.svg'})`,
              }}
            />
            <div>
              <h3 className="siguiente__nombre">{siguiente.nombre}</h3>
              <p className="siguiente__meta">
                {siguiente.tickets_necesarios} tickets
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="tarjeta">
        <h2 className="tarjeta__titulo">Cómo funciona</h2>
        <ol className="pasos">
          <li className="pasos__item">
            <span className="pasos__num">1</span>
            Visita la tienda y muestra el QR de tu perfil en caja.
          </li>
          <li className="pasos__item">
            <span className="pasos__num">2</span>
            El personal lo escanea y se revela una pieza del premio.
          </li>
          <li className="pasos__item">
            <span className="pasos__num">3</span>
            Solo un ticket por día. Junta {total} y canjea tu premio.
          </li>
        </ol>
      </section>
    </div>
  )
}
