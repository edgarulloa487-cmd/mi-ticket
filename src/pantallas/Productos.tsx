import { useEffect, useMemo, useState } from 'react'
import { FormaDulce, formaDeProducto } from '../componentes/FormaDulce'
import { cargarProductos } from '../supabase/api'
import type { Producto } from '../supabase/tipos'
import './Productos.css'

const precio = (n: number) => `$${Number(n).toFixed(2)}`

export function Productos({ negocioId }: { negocioId: string }) {
  const [productos, setProductos] = useState<Producto[] | null>(null)
  const [categoria, setCategoria] = useState('Todos')

  useEffect(() => {
    cargarProductos(negocioId).then(setProductos).catch(() => setProductos([]))
  }, [negocioId])

  const categorias = useMemo(
    () => ['Todos', ...new Set((productos ?? []).map((p) => p.categoria))],
    [productos],
  )

  if (!productos) {
    return (
      <div className="pantalla">
        <div className="cargando">Cargando productos…</div>
      </div>
    )
  }

  const visibles =
    categoria === 'Todos'
      ? productos
      : productos.filter((p) => p.categoria === categoria)

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 className="cabecera__titulo">Productos</h1>
        <p className="cabecera__sub">Nuestro catálogo. Las compras son en tienda.</p>
      </header>

      <div className="chips" role="tablist" aria-label="Categorías">
        {categorias.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={c === categoria}
            className={`chip ${c === categoria ? 'chip--activo' : ''}`}
            onClick={() => setCategoria(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="rejilla-productos">
        {visibles.map((p) => {
          const arte = formaDeProducto(p.nombre, p.categoria)
          return (
            <li key={p.producto_id} className="producto">
              <div
                className="producto__imagen"
                style={{
                  background: `linear-gradient(150deg, ${arte.colores[0]}22, ${arte.colores[1]}14)`,
                }}
              >
                {/* Cuando el negocio suba fotos reales a Storage, imagen_url
                    manda; mientras tanto, ilustración derivada del nombre. */}
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt="" className="producto__foto" />
                ) : (
                  <FormaDulce forma={arte.forma} colores={arte.colores} />
                )}
              </div>
              <div className="producto__cuerpo">
                <h3 className="producto__nombre">{p.nombre}</h3>
                {p.descripcion && (
                  <p className="producto__descripcion">{p.descripcion}</p>
                )}
                <p className="producto__precio">{precio(p.precio)}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="productos__pie">
        Los precios son de referencia. Pregunta en tienda por promociones del día.
      </p>
    </div>
  )
}
