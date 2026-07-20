# Guía de verificación — Mi Ticket

> Para dar una **segunda opinión** o auditar el proyecto sin confiar en nadie.
> Lee primero [PROYECTO.md](PROYECTO.md) (el qué y el porqué); esta guía es el
> **cómo comprobar**. Todo lo de aquí es reproducible: si algo no da el
> resultado esperado, es un hallazgo real.

Hay tres niveles de revisión, de más barato a más completo:

- **A. SQL** — verifica el backend (reglas, seguridad, integridad). Sin navegador.
- **B. Navegador** — verifica las apps y el tiempo real. Necesita 2 ventanas.
- **C. Código** — qué leer y qué trampas buscar.

Cuentas de prueba: ver §2 de PROYECTO.md (`ana@` clienta · `luis@` gerente ·
`sofia@` empleada, todas con `prueba1234`).

---

## A. Verificación por SQL (Supabase → SQL Editor)

⚠️ **Ejecuta cada bloque completo de una sola vez** (cada corrida del editor es
una transacción; los `set_config`/`set local role` solo viven dentro de ella).

### A1. Suplantar a un usuario (base de casi todas las pruebas)

```sql
-- Actuar como Luis (gerente). Cambia el correo para actuar como otra persona.
do $$ declare v uuid;
begin
  select id into v from auth.users where email='luis@correo.com';
  perform set_config('request.jwt.claims',
    json_build_object('sub', v, 'role','authenticated')::text, true);
end $$;
set local role authenticated;

-- ...aquí van las pruebas de ese bloque...
```

### A2. La regla de un ticket por día

```sql
-- (como Luis) Escanear DOS veces a Ana en la misma corrida:
select otorgar_ticket('GLS-JNW9C3');  -- esperado: "resultado":"ticket_otorgado"
select otorgar_ticket('GLS-JNW9C3');  -- esperado: "resultado":"ya_reclamado"
```

Esperado: el segundo NUNCA otorga. La regla vive en el índice único
`tickets_uno_por_dia`, no en un `if`.

**Limpieza** (deja libre el cupo de hoy para las demos de navegador):

```sql
delete from tickets t using perfiles p
 where p.usuario_id = t.usuario_id and p.codigo = 'GLS-JNW9C3'
   and t.fecha_local = (now() at time zone 'America/El_Salvador')::date
   and t.canje_id is null;
```

### A3. Nadie escribe las tablas del libro contable

```sql
-- (como cualquier authenticated) Esperado: ERROR de RLS / permission denied
insert into tickets (usuario_id, negocio_id, sucursal_id, empleado_id, fecha_local)
values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), current_date);
```

Esperado: **falla**. Igual con `update canjes ...` o `delete from tickets ...`.
Las únicas políticas de escritura de todo `public` son las 2 de `productos`
(gerente). Compruébalo:

```sql
select tablename, cmd, policyname from pg_policies
 where schemaname='public' and cmd <> 'SELECT';
-- esperado: SOLO productos (INSERT y UPDATE)
```

### A4. Permisos por rol

```sql
-- (como ANA, clienta) esperado: "No eres gerente activo" en ambas
select crear_nivel(9,'Hackeado','x',null,4);
select desactivar_empleado((select empleado_id from empleados limit 1));
```

```sql
-- (como LUIS, gerente) esperado: error "no trabaja en una sucursal que tu manejes"
-- si pruebas con un empleado de una sucursal que Luis no maneje; y
-- "No puedes desactivarte a ti mismo" si lo intenta consigo mismo.
select desactivar_empleado((select empleado_id from empleados where nombre='Luis Herrera'));
```

### A5. El canje es atómico y FIFO

```sql
-- (como ANA) pedir código con tickets insuficientes:
select generar_codigo_canje((select negocio_id from negocios limit 1));
-- esperado si le faltan: "resultado":"sin_tickets"
```

```sql
-- (como LUIS) validar un código inventado / ya usado / vencido:
select validar_codigo('XXXXXX');   -- esperado: "Codigo invalido"
```

El flujo completo con éxito se prueba mejor en navegador (B4), pero puedes
verificar la invariante después de cualquier canje:

```sql
-- Cada canje marca EXACTAMENTE los tickets que su nivel exige, y los más viejos:
select c.canje_id, n.tickets_necesarios, count(t.ticket_id) as marcados
from canjes c
join niveles n on n.nivel_id = c.nivel_id
left join tickets t on t.canje_id = c.canje_id
group by 1,2
having count(t.ticket_id) <> n.tickets_necesarios;
-- esperado: 0 filas (si sale algo, hay un canje corrupto)
```

### A6. Integridad estructural (una sola corrida, sin suplantar)

```sql
select 'RLS activa en todo' as chequeo,
       (count(*) = count(*) filter (where relrowsecurity))::text as ok
  from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
 where ns.nspname='public' and c.relkind='r'
union all
select 'indice un-ticket-por-dia existe',
       (count(*)=1)::text from pg_indexes
 where indexname='tickets_uno_por_dia'
union all
select 'unicidad de niveles es PARCIAL (solo vigentes)',
       (count(*)=1)::text from pg_indexes
 where indexname='niveles_orden_vigente' and indexdef like '%vigente_hasta IS NULL%'
union all
select 'realtime publica tickets/canjes/empleados',
       (count(*)=3)::text from pg_publication_tables
 where pubname='supabase_realtime' and tablename in ('tickets','canjes','empleados')
union all
select 'funciones SECURITY DEFINER',
       (count(*)=0)::text from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
 where ns.nspname='public' and not p.prosecdef
   and p.proname not in ('generar_codigo_texto')  -- la única que no lo necesita
union all
select 'ningún contador guardado (columna que huela a saldo)',
       (count(*)=0)::text from information_schema.columns
 where table_schema='public' and column_name ~ '(conteo|contador|saldo|numero_de)';
```

Esperado: **todo `true`**.

### A7. El historial no miente (la prueba de la filosofía)

```sql
-- Los canjes apuntan a niveles que pueden estar "de baja", y eso es CORRECTO:
-- versionar un nivel no debe tocar el pasado. Lo corrupto sería un canje
-- apuntando a un nivel inexistente:
select count(*) as canjes_huerfanos
from canjes c left join niveles n on n.nivel_id = c.nivel_id
where n.nivel_id is null;
-- esperado: 0
```

---

## B. Verificación en navegador

`npm run dev` en `C:\mi-ticket` (puerto 5173). Para el tiempo real necesitas
**dos ventanas** (una normal + una incógnito, o dos navegadores).

### B1. Roles: cada quien ve su app
1. Entra con **Ana** → app rosa de cliente, abre en "Mi ticket". ✓
2. Entra con **Sofía** → panel azul de personal, **sin** pestaña Panel. ✓
3. Entra con **Luis** → panel azul, **con** pestaña Panel (Niveles | Equipo). ✓
4. En Luis → Cuenta → "Ver mi tarjeta" → ve su tarjeta rosa de cliente y puede
   volver a su panel. ✓

### B2. El escaneo en vivo (la prueba estrella)
1. Ventana 1: **Ana**, deja la app en la pestaña **Perfil** (QR visible).
2. Ventana 2: **Luis** → Escanear → teclea `GLS-JNW9C3` (o escanea el QR con
   cámara si pruebas desde un teléfono).
3. Esperado en Luis: "Ticket sumado · N de 6".
4. Esperado en Ana, **sin tocar nada, en 1-2 s**: la app salta sola a
   "Mi ticket" y la **pieza nueva** (no una vieja) late 3 veces.
5. Repite el escaneo → Luis ve "Ya reclamó hoy". ✓
6. Variante: deja a Ana en "Productos" y escanea de nuevo otro día → banner
   "🎟️ ¡Ganaste un ticket!" en vez de salto forzado. ✓

### B3. Preparar un canje (atajo SQL para no esperar 4 días)

```sql
-- Darle a Ana 4 tickets RETROACTIVOS (fechas pasadas: no chocan con el de hoy)
insert into tickets (usuario_id, negocio_id, sucursal_id, empleado_id, fecha_local)
select p.usuario_id, s.negocio_id, s.sucursal_id, e.empleado_id,
       (now() at time zone s.zona_horaria)::date - i
from perfiles p, sucursales s, empleados e, generate_series(1,4) as i
where p.codigo='GLS-JNW9C3' and s.nombre='Centro' and e.nombre='Luis Herrera'
on conflict do nothing;
```

### B4. El canje completo
1. Ana (con ≥6 disponibles): "Mi ticket" muestra 6/6 y el botón **Canjear**.
2. Ana pulsa Canjear → código de 6 letras con cuenta regresiva de 10 min.
3. Luis → Canjear → teclea el código.
4. Esperado en Luis: "Canje válido · Entrégale: Combo Premium · 6 usados".
5. Esperado en Ana, en vivo: su tarjeta pasa al **nivel 3 (9 piezas)** y en
   Perfil aparece el premio en el historial. ✓
6. Luis teclea el MISMO código otra vez → "Ese código ya se usó". ✓

### B5. La puerta de contraseña
1. Luis → Panel → Niveles → "+ Nuevo nivel" → llenar → Guardar.
2. Esperado: diálogo pidiendo contraseña. Con una incorrecta → error, no pasa
   nada. Con `prueba1234` → se crea. ✓
3. Igual al quitar permiso en Equipo. ✓
4. **Bug ya corregido que conviene re-verificar:** confirmar la contraseña NO
   debe hacer parpadear/recargar el resto de la app.

### B6. Despido en vivo
1. Ventana 1: **Sofía** en su panel de personal.
2. Ventana 2: **Luis** → Panel → Equipo → "Quitar permiso" a Sofía (+contraseña).
3. Esperado en Sofía, **sin tocar nada**: su pantalla se convierte en la app de
   cliente (rosa), con su QR y sus datos intactos.
4. Luis le devuelve el permiso → Sofía vuelve a ver su panel, en vivo. ✓

### B7. Niveles con imagen
1. Luis crea/edita un nivel subiendo una foto (cualquiera, aunque pese MB).
2. Esperado: se sube recortada ~800×800 (verifica en Storage → bucket
   `premios`), y el rompecabezas del cliente la usa. ✓

---

## C. Revisión de código: dónde mirar

| Qué | Dónde | Qué comprobar |
|---|---|---|
| La única puerta de escritura | `src/supabase/api.ts` | Ninguna llamada `.insert/.update/.delete` a tickets/canjes; solo `.rpc(...)` |
| Embeds con FK explícita | `api.ts` (`cargarEquipo`) | `sucursales!empleados_sucursal_id_fkey(...)` — sin nombrar la FK, PostgREST devuelve HTTP 300 (hay dos rutas por `gerente_sucursales`) |
| Recarga por identidad, no por sesión | `App.tsx` | El efecto de recarga depende de `uid`, NO del objeto `session` (que cambia con cada verificación de contraseña y refresco de token) |
| Celebración sin carrera | `MiTicket.tsx` | La pieza late cuando `enTarjeta` **aumenta** (datos ya llegados), no cuando llega el evento Realtime |
| Guardia del escáner | `empleado/Escaner.tsx` | `ocupadoRef` (ref, no solo estado): el callback de la cámara es un closure viejo |
| Rejilla derivada | `MiTicket.tsx` + `empleado/Niveles.tsx` | Tickets solo 4/6/9/12; la UI lo fuerza con selector, no con número libre |
| Textos "load-bearing" | `empleado/Equipo.tsx` | El botón dice "Quitar permiso" (nunca "Eliminar") y la nota explica que no borra a nadie |

**Trampas conocidas** (ya mordieron una vez — si tocas algo cercano, revisa):
`auth.identities` al sembrar usuarios por SQL; tablas puente rompen embeds
existentes; el prefijo `GLS-` está clavado en el trigger. Detalle y contexto: el
grafo del MCP `grafo-volumen-1`, proyecto `mi-ticket` (`estado_proyecto`).

---

## Qué NO está cubierto por esta guía

Honestidad ante todo:

- **No hay tests automatizados** (ni unitarios ni e2e). Todo lo de arriba es
  manual/SQL. Si el proyecto crece, lo primero a automatizar es la sección A
  (son asserts naturales).
- El **flujo de cámara real** (escanear un QR físico) solo se prueba con dos
  dispositivos; el campo manual es el sustituto en escritorio.
- **Expiración del código de canje** (10 min): probarla exige esperar o
  manipular `expira_en` por SQL.
