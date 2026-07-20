/**
 * Tipos generados desde el esquema real de Supabase. NO editar a mano.
 *
 * Regenerar tras cada migración:
 *   npx supabase gen types typescript --project-id swhnivuutklvolavgzdu > src/supabase/tipos.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      canjes: {
        Row: {
          canje_id: string
          canjeado_en: string
          empleado_id: string
          negocio_id: string
          nivel_id: string
          sucursal_id: string
          usuario_id: string
        }
        Insert: {
          canje_id?: string
          canjeado_en?: string
          empleado_id: string
          negocio_id: string
          nivel_id: string
          sucursal_id: string
          usuario_id: string
        }
        Update: {
          canje_id?: string
          canjeado_en?: string
          empleado_id?: string
          negocio_id?: string
          nivel_id?: string
          sucursal_id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      codigos_canje: {
        Row: {
          canje_id: string | null
          codigo: string
          expira_en: string
          generado_en: string
          negocio_id: string
          nivel_id: string
          usuario_id: string
        }
        Insert: {
          canje_id?: string | null
          codigo: string
          expira_en: string
          generado_en?: string
          negocio_id: string
          nivel_id: string
          usuario_id: string
        }
        Update: {
          canje_id?: string | null
          codigo?: string
          expira_en?: string
          generado_en?: string
          negocio_id?: string
          nivel_id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          activo: boolean
          cargo: string | null
          empleado_id: string
          nombre: string
          rol: string
          sucursal_id: string
          usuario_id: string | null
        }
        Insert: {
          activo?: boolean
          cargo?: string | null
          empleado_id?: string
          nombre: string
          rol?: string
          sucursal_id: string
          usuario_id?: string | null
        }
        Update: {
          activo?: boolean
          cargo?: string | null
          empleado_id?: string
          nombre?: string
          rol?: string
          sucursal_id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      negocios: {
        Row: {
          activo: boolean
          creado_en: string
          negocio_id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          negocio_id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          negocio_id?: string
          nombre?: string
        }
        Relationships: []
      }
      niveles: {
        Row: {
          descripcion: string | null
          imagen_url: string | null
          negocio_id: string
          nivel_id: string
          nombre: string
          orden: number
          tickets_necesarios: number
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          descripcion?: string | null
          imagen_url?: string | null
          negocio_id: string
          nivel_id?: string
          nombre: string
          orden: number
          tickets_necesarios: number
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          descripcion?: string | null
          imagen_url?: string | null
          negocio_id?: string
          nivel_id?: string
          nombre?: string
          orden?: number
          tickets_necesarios?: number
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: []
      }
      paises: {
        Row: { moneda: string; nombre: string; pais_id: string }
        Insert: { moneda: string; nombre: string; pais_id?: string }
        Update: { moneda?: string; nombre?: string; pais_id?: string }
        Relationships: []
      }
      productos: {
        Row: {
          categoria: string
          descripcion: string | null
          disponible: boolean
          imagen_url: string | null
          negocio_id: string
          nombre: string
          orden: number
          precio: number
          producto_id: string
        }
        Insert: {
          categoria: string
          descripcion?: string | null
          disponible?: boolean
          imagen_url?: string | null
          negocio_id: string
          nombre: string
          orden?: number
          precio: number
          producto_id?: string
        }
        Update: {
          categoria?: string
          descripcion?: string | null
          disponible?: boolean
          imagen_url?: string | null
          negocio_id?: string
          nombre?: string
          orden?: number
          precio?: number
          producto_id?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          codigo: string
          creado_en: string
          nombre: string | null
          usuario_id: string
        }
        Insert: {
          codigo: string
          creado_en?: string
          nombre?: string | null
          usuario_id: string
        }
        Update: {
          codigo?: string
          creado_en?: string
          nombre?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          activa: boolean
          direccion: string | null
          negocio_id: string
          nombre: string
          pais_id: string
          sucursal_id: string
          zona_horaria: string
        }
        Insert: {
          activa?: boolean
          direccion?: string | null
          negocio_id: string
          nombre: string
          pais_id: string
          sucursal_id?: string
          zona_horaria: string
        }
        Update: {
          activa?: boolean
          direccion?: string | null
          negocio_id?: string
          nombre?: string
          pais_id?: string
          sucursal_id?: string
          zona_horaria?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          canje_id: string | null
          creado_en: string
          empleado_id: string
          fecha_local: string
          negocio_id: string
          sucursal_id: string
          ticket_id: string
          usuario_id: string
        }
        Insert: {
          canje_id?: string | null
          creado_en?: string
          empleado_id: string
          fecha_local: string
          negocio_id: string
          sucursal_id: string
          ticket_id?: string
          usuario_id: string
        }
        Update: {
          canje_id?: string | null
          creado_en?: string
          empleado_id?: string
          fecha_local?: string
          negocio_id?: string
          sucursal_id?: string
          ticket_id?: string
          usuario_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      crear_nivel: {
        Args: {
          p_descripcion: string
          p_imagen_url: string
          p_nombre: string
          p_orden: number
          p_tickets_necesarios: number
        }
        Returns: Json
      }
      dar_de_baja_nivel: { Args: { p_orden: number }; Returns: Json }
      desactivar_empleado: { Args: { p_empleado_id: string }; Returns: Json }
      generar_codigo_canje: { Args: { p_negocio_id: string }; Returns: Json }
      historial_personal: {
        Args: { p_limite?: number }
        Returns: {
          tipo: string
          ocurrido_en: string
          cliente: string | null
          empleado: string
          sucursal: string
          detalle: string | null
        }[]
      }
      negocio_del_gerente: { Args: never; Returns: string }
      otorgar_ticket: { Args: { p_codigo_usuario: string }; Returns: Json }
      reactivar_empleado: { Args: { p_empleado_id: string }; Returns: Json }
      validar_codigo: { Args: { p_codigo: string }; Returns: Json }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DefaultSchema = Database['public']

export type Tables<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Row']

export type Negocio = Tables<'negocios'>
export type Sucursal = Tables<'sucursales'>
export type Nivel = Tables<'niveles'>
export type Perfil = Tables<'perfiles'>
export type Ticket = Tables<'tickets'>
export type Canje = Tables<'canjes'>
export type Producto = Tables<'productos'>
