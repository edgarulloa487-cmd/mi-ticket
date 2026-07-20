import { supabase } from './cliente'
import type { Canje, Negocio, Nivel, Perfil, Producto, Sucursal } from './tipos'

/**
 * Capa de datos. Todo lo que la app sabe de Supabase pasa por aquí.
 *
 * Las lecturas van directas a las tablas (la RLS filtra a lo propio). Las
 * escrituras NO existen: el cliente no tiene permiso de INSERT ni UPDATE sobre
 * ninguna tabla. Otorgar un ticket y canjear un premio solo ocurren llamando a
 * las funciones de la base.
 */

export interface EstadoTicket {
  perfil: Perfil
  niveles: Nivel[]
  nivelActual: Nivel
  disponibles: number
  canjes: Canje[]
  /** true cuando ya se puede pedir el código de canje. */
  puedeCanjear: boolean
}

export async function cargarNegocio(): Promise<{
  negocio: Negocio
  sucursales: Sucursal[]
}> {
  const [{ data: negocios, error: e1 }, { data: sucursales, error: e2 }] =
    await Promise.all([
      supabase.from('negocios').select('*').limit(1),
      supabase.from('sucursales').select('*'),
    ])

  if (e1) throw e1
  if (e2) throw e2
  if (!negocios?.length) throw new Error('No hay ningún negocio configurado')

  return { negocio: negocios[0], sucursales: sucursales ?? [] }
}

export async function cargarEstadoTicket(
  negocioId: string,
): Promise<EstadoTicket> {
  const { data: sesion } = await supabase.auth.getUser()
  if (!sesion.user) throw new Error('No hay sesión')

  const [perfilRes, nivelesRes, ticketsRes, canjesRes] = await Promise.all([
    supabase.from('perfiles').select('*').single(),
    supabase
      .from('niveles')
      .select('*')
      .eq('negocio_id', negocioId)
      .is('vigente_hasta', null)
      .order('orden'),
    // La RLS ya limita a los tickets propios; head + count evita traer las filas.
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('negocio_id', negocioId)
      .is('canje_id', null),
    supabase
      .from('canjes')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('canjeado_en', { ascending: false }),
  ])

  if (perfilRes.error) throw perfilRes.error
  if (nivelesRes.error) throw nivelesRes.error
  if (ticketsRes.error) throw ticketsRes.error
  if (canjesRes.error) throw canjesRes.error

  const niveles = nivelesRes.data ?? []
  const canjes = canjesRes.data ?? []
  if (!niveles.length) throw new Error('Este negocio no tiene niveles activos')

  // El nivel no se guarda: es la cuenta de canjes más uno. El tope hace que el
  // último nivel se repita para siempre, para que nadie llegue a un final.
  const nivelActual = niveles[Math.min(canjes.length, niveles.length - 1)]
  const disponibles = ticketsRes.count ?? 0

  return {
    perfil: perfilRes.data,
    niveles,
    nivelActual,
    disponibles,
    canjes,
    puedeCanjear: disponibles >= nivelActual.tickets_necesarios,
  }
}

export async function cargarProductos(negocioId: string): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('disponible', true)
    .order('orden')

  if (error) throw error
  return data ?? []
}

export async function cargarHistorial(negocioId: string) {
  const { data, error } = await supabase
    .from('canjes')
    .select('canje_id, canjeado_en, niveles(nombre, imagen_url)')
    .eq('negocio_id', negocioId)
    .order('canjeado_en', { ascending: false })

  if (error) throw error
  return data ?? []
}

export interface TicketGanado {
  ticket_id: string
  creado_en: string
  canjeado: boolean
  sucursal: string
}

/** Historial de tickets ganados (para la pestaña Perfil), con su sucursal. */
export async function cargarTicketsGanados(
  negocioId: string,
): Promise<TicketGanado[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_id, creado_en, canje_id, sucursales(nombre)')
    .eq('negocio_id', negocioId)
    .order('creado_en', { ascending: false })
    .limit(30)

  if (error) throw error

  return (data ?? []).map((t) => {
    const { sucursales, canje_id, ...resto } = t as typeof t & {
      sucursales: { nombre: string } | null
    }
    return {
      ...resto,
      canjeado: canje_id !== null,
      sucursal: sucursales?.nombre ?? '—',
    }
  })
}

/**
 * Avisa cuando cambian los tickets o canjes del usuario (el empleado escaneó o
 * validó un canje). Realtime respeta la RLS: solo llegan las filas propias.
 * Devuelve la función para cancelar la suscripción.
 */
export interface CambioEnVivo {
  tabla: 'tickets' | 'canjes' | 'empleados'
  /** 'INSERT' en tickets = ganó uno; 'UPDATE' = se consumió al canjear. */
  evento: 'INSERT' | 'UPDATE' | 'DELETE'
}

export function suscribirseACambios(
  usuarioId: string,
  alCambiar: (info: CambioEnVivo) => void,
): () => void {
  const canal = supabase
    .channel(`cliente-${usuarioId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tickets', filter: `usuario_id=eq.${usuarioId}` },
      (p) => alCambiar({ tabla: 'tickets', evento: p.eventType }),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'canjes', filter: `usuario_id=eq.${usuarioId}` },
      (p) => alCambiar({ tabla: 'canjes', evento: p.eventType }),
    )
    // Cambia el rol en vivo: si el gerente lo desactiva, recargar hará que
    // miEmpleado devuelva null y la app pase sola a la vista de cliente.
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'empleados', filter: `usuario_id=eq.${usuarioId}` },
      (p) => alCambiar({ tabla: 'empleados', evento: p.eventType }),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(canal)
  }
}

/* ── Rol de quien entró ── */

export interface Empleado {
  empleado_id: string
  sucursal_id: string
  nombre: string
  cargo: string | null
  rol: 'empleado' | 'gerente'
  activo: boolean
}

/**
 * Devuelve la ficha de empleado de quien entró, o null si es solo cliente.
 *
 * Una persona puede ser ambas cosas: el empleado compra dulces en su día libre.
 * Esto decide qué app ve, no quién es.
 */
export async function miEmpleado(): Promise<Empleado | null> {
  const { data: sesion } = await supabase.auth.getUser()
  if (!sesion.user) return null

  // El filtro por usuario_id es obligatorio, no un adorno: un gerente ve a TODO
  // su equipo por RLS, así que sin él esta consulta devuelve varias filas y
  // maybeSingle() revienta — dejando al gerente sin poder entrar.
  const { data, error } = await supabase
    .from('empleados')
    .select('empleado_id, sucursal_id, nombre, cargo, rol, activo')
    .eq('usuario_id', sesion.user.id)
    .eq('activo', true)
    .maybeSingle()

  if (error) throw error
  return (data as Empleado | null) ?? null
}

export interface MiembroEquipo extends Empleado {
  sucursal: string
}

/**
 * El equipo de las sucursales que el gerente maneja — la RLS lo acota sola.
 * Trae el nombre de la sucursal porque un gerente puede llevar varias, y sin él
 * no se sabe a quién se le está quitando el permiso.
 */
export async function cargarEquipo(): Promise<MiembroEquipo[]> {
  const { data, error } = await supabase
    .from('empleados')
    // FK explícita: desde que existe gerente_sucursales hay dos caminos
    // empleados→sucursales y el embed sin nombrar la FK devuelve HTTP 300.
    .select(
      'empleado_id, sucursal_id, nombre, cargo, rol, activo, sucursales!empleados_sucursal_id_fkey(nombre)',
    )
    .order('nombre')

  if (error) throw error

  return (data ?? []).map((e) => {
    const { sucursales, ...resto } = e as typeof e & {
      sucursales: { nombre: string } | null
    }
    return { ...resto, sucursal: sucursales?.nombre ?? '—' } as MiembroEquipo
  })
}

/** Niveles vigentes de un negocio, para administrarlos. */
export async function cargarNiveles(negocioId: string): Promise<Nivel[]> {
  const { data, error } = await supabase
    .from('niveles')
    .select('*')
    .eq('negocio_id', negocioId)
    .is('vigente_hasta', null)
    .order('orden')

  if (error) throw error
  return data ?? []
}

export interface RespuestaNivel {
  resultado: 'creado' | 'dado_de_baja' | 'error'
  nivel_id?: string
  orden?: number
  mensaje?: string
}

/** Crea o versiona un nivel (mismo orden = da de baja el viejo, crea el nuevo). */
export async function crearNivel(n: {
  orden: number
  nombre: string
  descripcion: string | null
  imagenUrl: string | null
  ticketsNecesarios: number
}): Promise<RespuestaNivel> {
  const { data, error } = await supabase.rpc('crear_nivel', {
    p_orden: n.orden,
    p_nombre: n.nombre,
    p_descripcion: n.descripcion ?? '',
    p_imagen_url: n.imagenUrl ?? '',
    p_tickets_necesarios: n.ticketsNecesarios,
  })
  if (error) throw error
  return data as unknown as RespuestaNivel
}

export async function darDeBajaNivel(orden: number): Promise<RespuestaNivel> {
  const { data, error } = await supabase.rpc('dar_de_baja_nivel', { p_orden: orden })
  if (error) throw error
  return data as unknown as RespuestaNivel
}

/** Sube una imagen de premio al bucket y devuelve su URL pública. */
export async function subirImagenPremio(
  negocioId: string,
  archivo: Blob,
): Promise<string> {
  const ruta = `${negocioId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('premios')
    .upload(ruta, archivo, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from('premios').getPublicUrl(ruta).data.publicUrl
}

/**
 * Verifica la contraseña del usuario actual reintentando el login. Es la puerta
 * "confirma que eres tú" antes de acciones sensibles — protege el teléfono
 * desatendido sobre el mostrador, no reemplaza la RLS (que ya exige gerente).
 */
export async function verificarContrasena(clave: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) return false
  const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
  return !error
}

export interface RespuestaEquipo {
  resultado: 'desactivado' | 'reactivado' | 'error'
  empleado?: string
  mensaje?: string
}

/**
 * NO borra a nadie ni cierra su cuenta: solo le quita el permiso de escanear.
 * Su perfil de cliente y sus tickets siguen intactos. La pantalla debe decirlo.
 */
export async function desactivarEmpleado(
  empleadoId: string,
): Promise<RespuestaEquipo> {
  const { data, error } = await supabase.rpc('desactivar_empleado', {
    p_empleado_id: empleadoId,
  })
  if (error) throw error
  return data as unknown as RespuestaEquipo
}

export async function reactivarEmpleado(
  empleadoId: string,
): Promise<RespuestaEquipo> {
  const { data, error } = await supabase.rpc('reactivar_empleado', {
    p_empleado_id: empleadoId,
  })
  if (error) throw error
  return data as unknown as RespuestaEquipo
}

/* ── Acciones (todas pasan por funciones de la base) ── */

export interface RespuestaCodigo {
  resultado: 'codigo_generado' | 'sin_tickets' | 'error'
  codigo?: string
  expira_en?: string
  premio?: string
  mensaje?: string
}

/** La pide el CLIENTE al pulsar "Canjear". El código prueba que participó. */
export async function generarCodigoCanje(
  negocioId: string,
): Promise<RespuestaCodigo> {
  const { data, error } = await supabase.rpc('generar_codigo_canje', {
    p_negocio_id: negocioId,
  })
  if (error) throw error
  return data as unknown as RespuestaCodigo
}

export interface RespuestaEscaneo {
  resultado: 'ticket_otorgado' | 'ya_reclamado' | 'error'
  disponibles?: number
  necesarios?: number
  nivel?: string
  puede_canjear?: boolean
  mensaje?: string
}

/** La ejecuta el EMPLEADO al escanear el QR del cliente. */
export async function otorgarTicket(
  codigoUsuario: string,
): Promise<RespuestaEscaneo> {
  const { data, error } = await supabase.rpc('otorgar_ticket', {
    p_codigo_usuario: codigoUsuario,
  })
  if (error) throw error
  return data as unknown as RespuestaEscaneo
}

export interface RespuestaCanje {
  resultado: 'canje_realizado' | 'sin_tickets' | 'error'
  premio?: string
  tickets_usados?: number
  sobrantes?: number
  mensaje?: string
}

/** La ejecuta el EMPLEADO tecleando el código, tras entregar el premio. */
export async function validarCodigo(codigo: string): Promise<RespuestaCanje> {
  const { data, error } = await supabase.rpc('validar_codigo', {
    p_codigo: codigo,
  })
  if (error) throw error
  return data as unknown as RespuestaCanje
}
