# Mi Ticket — documentación del proyecto

> Para cualquier agente o persona que llegue a este proyecto sin contexto previo.
> Contiene **qué** se decidió y, sobre todo, **por qué**. Casi todas las
> decisiones de abajo se tomaron descartando una alternativa concreta; el motivo
> importa más que la regla, porque es lo que evita que alguien la "arregle".

> 🧪 **Para auditar o dar una segunda opinión:** [PRUEBAS.md](PRUEBAS.md) — guía
> reproducible de verificación (SQL + navegador + qué mirar en el código).
>
> 🧠 **También hay un grafo de decisiones** en el MCP `grafo-volumen-1`, bajo el
> proyecto **`mi-ticket`** (es multiproyecto, pese al nombre). Llama a
> `estado_proyecto("mi-ticket")` para ver nodos, pendientes y decisiones con su
> razón. Este archivo es la prosa; el grafo es lo consultable.
>
> Si cambias una decisión, actualiza **los dos** — o tendrás dos versiones de la
> verdad contradiciéndose, que es justo lo que este proyecto entero evita.

---

## 1. Qué es

App web de fidelización para **una dulcería** (`Dulcería La Golosa`, nombre
ficticio del prototipo).

El circuito, en una frase: **el cliente muestra su QR en caja, el empleado lo
escanea, el cliente gana 1 ticket. Junta N tickets y canjea un premio.**

- Máximo **1 ticket por día** por cliente.
- Los tickets se muestran como un **rompecabezas**: la imagen del premio aparece
  atenuada y cada ticket revela una pieza a color. Es el gancho visual — un
  "2/4" es abstracto, media imagen revelada da ganas de completarla.
- Al completar el premio hay un **siguiente nivel** con otro premio, mejor y más
  caro en tickets.

## 2. Estado actual

### Backend: **existe y está probado** ✅

Proyecto Supabase `swhnivuutklvolavgzdu` (`https://swhnivuutklvolavgzdu.supabase.co`).

Todo lo de §5, §6 y §7 está **aplicado y verificado con pruebas reales**, no solo
compilado:

| Probado | Resultado |
|---|---|
| Dos escaneos el mismo día | El segundo lo rechaza el índice único ✅ |
| Empleado escaneándose a sí mismo | Bloqueado ✅ |
| Tickets pasando de 4/4 | Se apilan, no se rechazan (6 disponibles) ✅ |
| Canje con código | 4 consumidos, **2 sobrantes** al siguiente nivel ✅ |
| FIFO | Consumió los 4 más viejos, sobrevivieron los 2 nuevos ✅ |
| Código reutilizado / inventado / en minúsculas | Quemado / inválido / acepta ✅ |
| Pasarse del último nivel | Se queda en Combo Maestro **para siempre** ✅ |

Niveles semilla: **4 → 6 → 9** (rejillas 2×2, 3×2, 3×3). Ver §11.

### App del personal: existe ✅

La app **bifurca por rol al entrar** (`miEmpleado()`): si eres personal ves tu
panel, no la app de cliente. Franja azul arriba para que en caja sepas de un
vistazo dónde estás.

- **Escanear**: cámara (`html5-qrcode`) + campo manual con el código `GLS-…`
  por si la cámara falla o el cliente trae la pantalla rota.
- **Canjear**: teclear las 6 letras que dicta el cliente.
- **Panel** (solo gerente): dos secciones en una sub-navegación.
  - *Niveles*: crear, editar y quitar niveles. El campo de tickets es un selector
    de **4/6/9/12** (los que cierran en rejilla), no un número libre. La imagen se
    sube a Storage, recortada a 800×800 en el cliente antes de subir.
  - *Equipo*: quitar y devolver el permiso de escanear, agrupado por sucursal.
- **Cuenta**: incluye **"Ver mi tarjeta"** — el personal también compra dulces en
  su día libre, y esa es la resolución honesta de que una persona sea las dos
  cosas.

**Toda acción que crea, cambia o quita pide la contraseña del gerente** antes de
ejecutarse (`useContrasenaGate`): desactivar/reactivar empleado, y crear/quitar
nivel. Es una capa contra el teléfono desatendido en el mostrador, no un
sustituto de la RLS — se verifica con `signInWithPassword`, la barrera de datos
sigue siendo el rol.

El panel va en un chunk aparte (`lazy`): el lector de QR pesa ~380 kB y ningún
cliente debería descargar un escáner que jamás va a abrir.

### App del cliente: conectada a Supabase, **sin verificar en ejecución**

- Vite + React 19 + TypeScript, CSS propio, sin librerías de UI.
- Diseño **móvil primero**; en escritorio se centra con ancho de teléfono.
- 4 pestañas abajo: Ubicación · Productos · Mi ticket · Perfil.
- Las cuatro pantallas leen de `src/supabase/api.ts`. **Los mocks se borraron.**
- Login por correo y contraseña, con atajos a las cuentas semilla.
- El rompecabezas ahora deriva la rejilla de `tickets_necesarios` del nivel
  (4 → 2×2, 6 → 3×2, 9 → 3×3), y muestra los sobrantes del siguiente nivel.
- **Tiempo real (Supabase Realtime):** la app se suscribe a los cambios de
  `tickets`/`canjes` del usuario (`suscribirseACambios`). Cuando el empleado
  escanea, el teléfono del cliente reacciona solo en 1-2 s — **ya no hay botón
  "Actualizar"**. La RLS filtra a lo propio y Realtime la respeta.
- **El momento del escaneo:** al ganar un ticket en vivo, si el cliente está en
  Perfil (acaba de mostrar el QR) la app salta sola a Mi ticket; si está en otra
  pestaña, aparece un banner "+1 ticket". La pieza nueva late 3 veces para que dé
  tiempo a verla. Desde otras pestañas no se fuerza el salto, a propósito.
- **Historial** (en Perfil, siempre visible con estado vacío): premios canjeados
  y tickets ganados (fecha + sucursal).
- El panel de "controles de demostración" **se eliminó**: ya no puede existir.
  El cliente no tiene permiso de escritura, así que no puede regalarse tickets
  ni simulados. Que ese botón sea imposible es la prueba de que la RLS funciona.

> ⚠️ **`npm run build` pasa, pero nadie ha visto la app corriendo con datos
> reales.** El login, la carga del estado y el botón de canjear están escritos y
> tipados contra el esquema, no probados en navegador. Es lo primero que hay que
> hacer.

### Lo que falta

1. **Verificar las apps en el navegador.** Ver aviso de arriba. Es lo primero.
2. **Pantallas del gerente para el catálogo de productos.** Niveles y equipo ya
   tienen UI. Productos aún se administra por SQL (el backend ya permite escritura
   al gerente).
3. **El bug de los chocolates.** `formaDeProducto` elige forma por hash sin mirar
   qué es el producto: "Chocolate con Leche" sale como bombón y "Bombones
   Surtidos" como barra, en morado. Debe respetar el nombre y usar tonos café.
4. **Fotos reales** en Storage → `productos.imagen_url` y `niveles.imagen_url`.
   Mientras estén en null, la app dibuja ilustraciones derivadas del nombre.
5. **Magic link** en vez de contraseña para producción: pedir contraseña para
   ganar un sello de café es demasiada fricción, y la tasa de registro decide si
   el negocio siente que el sistema sirvió.
6. **Horarios y teléfono** están hardcodeados en `Ubicacion.tsx`: nunca entraron
   al diseño porque no tocan la lógica de tickets. Van como columnas de
   `sucursales` cuando hagan falta.
7. **Quitar el texto `GLS-…` bajo el QR** (decisión pendiente del dueño). Hoy hay
   **dos** códigos en la app y se pueden confundir: `GLS-JNW9C3` es la identidad
   permanente (ticket diario) y `KXP4TM` es efímero (canje). Se salvan porque el
   formato difiere, pero es una trampa. La alternativa es dejarlo solo como
   respaldo de cámara y que la UI del empleado separe bien las dos acciones —
   que ya lo hace, en pestañas distintas.

### Dos avisos que no son deuda técnica, son riesgo de negocio

> 🔴 **El botón de desactivar NO puede decir "Eliminar empleado".** Dice
> **"Quitar permiso"** y explica debajo que conserva su cuenta de cliente. Si
> dijera "eliminar", el gerente creería que borró a la persona y se quedaría
> tranquilo — y no es lo que pasó. Ese malentendido lo crearíamos nosotros con la
> etiqueta: el negocio no sabe lo que nosotros sabemos.

> ⚠️ **Nadie audita al gerente.** Puede escanear (atiende caja) *y* ve los
> reportes: el que puede hacer la trampa es el que la revisa. Se evaluó un rol
> `dueño` por encima y **se descartó a propósito** — el dueño no se va a hacer
> cargo en la práctica y un rol que nadie usa es teatro. Se acepta el riesgo
> porque **el rastro existe igual**: cada ticket guarda `empleado_id`, incluido
> el del gerente. El día que alguien pregunte, la evidencia está. Esa es la
> recompensa de guardar hechos: el reporte no hay que inventarlo, ya existe.

### Cuentas semilla (solo desarrollo)

| Correo | Contraseña | Quién es | Qué ve al entrar |
|---|---|---|---|
| `ana@correo.com` | `prueba1234` | **Ana Ramírez** — clienta: nivel 2, 2/6 tickets, 1 premio ya canjeado (historial poblado), cupo de hoy libre para demostrar el escaneo en vivo | App de cliente |
| `luis@correo.com` | `prueba1234` | **Luis Herrera** — gerente (y también cliente) | Panel de personal **con** pestaña Equipo |
| `sofia@correo.com` | `prueba1234` | **Sofía Cajera** — empleada rasa (y también clienta) | Panel de personal **sin** pestaña Equipo |

> Los nombres importan más de lo que parece. Luis se llamaba "Luis Empleado" con
> cargo "Cajero" **y rol gerente**: al verlo quitarle permisos a alguien parecía
> un empleado raso con poderes que no le tocan, y la alarma era razonable. El
> permiso estaba bien; el dato de prueba mentía. Un nombre de fixture que
> contradice el rol hace perder tiempo real.

Son datos de prueba de un entorno de desarrollo, no cuentas de nadie. En
producción el alta será por magic link y esto desaparece.

> ⚠️ **Si siembras usuarios por SQL, no olvides `auth.identities`.** Insertar en
> `auth.users` con su `encrypted_password` **no basta**: sin una fila en
> `auth.identities` (provider `email`), `signInWithPassword` responde
> "credenciales inválidas" aunque el hash sea correcto. Las tres cuentas de
> arriba estuvieron rotas por esto y nadie lo habría adivinado desde el
> navegador.

### Archivos que importan

| Archivo | Qué es |
|---|---|
| `src/supabase/api.ts` | **La capa de datos.** Todo lo que la app sabe de Supabase pasa por aquí. Lecturas directas (la RLS filtra); escrituras solo por funciones. |
| `src/supabase/tipos.ts` | Tipos generados del esquema real. No editar a mano. |
| `src/supabase/cliente.ts` | Cliente de Supabase. Lee `.env`. |
| `src/App.tsx` | **Bifurca por rol.** Decide si ves la app de cliente o el panel de personal, y monta `AppEmpleado` con `lazy`. |
| `src/AppEmpleado.tsx` | Armazón del personal: pestañas, franja azul, "Ver mi tarjeta". |
| `src/pantallas/empleado/Escaner.tsx` | Cámara + código manual → `otorgar_ticket`. |
| `src/pantallas/empleado/Validar.tsx` | Teclea las 6 letras → `validar_codigo`. |
| `src/pantallas/empleado/Equipo.tsx` | Solo gerente. **El texto del botón aquí es load-bearing**, ver los avisos de arriba. |
| `src/pantallas/Login.tsx` | Correo y contraseña + atajos a las cuentas semilla. |
| `src/pantallas/MiTicket.tsx` | El rompecabezas. La lógica visual del proyecto. |
| `src/pantallas/Perfil.tsx` | El QR del usuario (`qrcode.react`) e historial de premios. |
| `src/componentes/FormaDulce.tsx` | Ilustraciones de productos, **derivadas del nombre** con un hash estable: forma y colores son andamiaje visual, no datos del negocio, así que no ensucian el esquema. |
| `public/premio-combo.svg` | Ilustración del premio. Es la imagen que se corta en piezas. |
| `.claude/launch.json` | Config del servidor de desarrollo (`npm run dev`, puerto 5173). |

### Detalle técnico del rompecabezas

La imagen completa va de fondo atenuada (`opacity: .16` + `grayscale`). Encima,
una rejilla cuyo tamaño **se deriva de `tickets_necesarios` del nivel**: cada
pieza usa la **misma** imagen con `background-size` y `background-position`
calculados para su celda. Revelar = subir opacidad. Al completar, `gap` pasa a
`0` y las piezas se juntan en la imagen entera.

**Nunca guardes las piezas como imágenes sueltas.** Una sola imagen recortada con
CSS es lo correcto, y la razón de peso no es el ancho de banda: el número de
piezas lo decide el negocio. Con archivos separados, el dueño tendría que subir 4
recortes para un nivel y 9 para otro, imposible desde un celular. Con CSS sube
**una foto** y la rejilla se adapta sola. Recortar además es duplicar: si cambia
el premio, habría que re-cortar y re-subir todo.

> Por eso los niveles usan números que cierran en rejilla: **4 (2×2), 6 (3×2),
> 9 (3×3)**. Un primo como 7 deja una pieza suelta y la imagen se ve rota. Si el
> negocio insiste en 7, hay que dibujar ese layout a mano con `clip-path`.

La composición del SVG del premio es **centrada y con confeti en las cuatro
esquinas a propósito**: cada cuadrante debe ser reconocible aunque los otros tres
sigan ocultos.

> ⚠️ Al dibujar espirales SVG (las paletas), la **separación entre vueltas debe
> superar el grosor del trazo**. Si no, las vueltas se solapan, rellenan el
> círculo sólido y la paleta parece un reloj. Ya pasó una vez.

---

## 3. Principio rector: guarda hechos, no estados

Todo el diseño sale de aquí. Un estado es una foto que se pisa a sí misma; un
hecho es algo que pasó y no cambia.

- Un ticket es **una fila**, nunca una columna `usuarios.tickets = 2`.
- El saldo no se guarda: se cuenta. `count(*) where canje_id is null`.
- Nada se borra ni se resetea nunca. Se marca.
- Lo que se puede derivar, se deriva. Cada dato duplicado es un dato que puede
  contradecir al original.

**Por qué:** un contador no sabe cuándo, dónde ni quién lo dio, así que mata los
reportes y la auditoría — y el día que el dueño pregunte "¿cuántos combos
entregamos en marzo?", la respuesta no puede ser "se borraron". Además los
contadores tienen carreras al incrementar; un `INSERT` con constraint único es
atómico por construcción.

Es la regla de la contabilidad: no guardas el saldo, guardas los movimientos.

---

## 4. Reglas de negocio decididas

| Regla | Decisión | Por qué |
|---|---|---|
| Límite diario | **1 por día por negocio**, no por sucursal | Por sucursal se granjea solo: el cliente camina a la otra sucursal y saca otro. La sucursal se guarda igual, pero solo para métricas. |
| Caducidad de tickets | **No caducan** | Con niveles crecientes (4 → 6 → 9) una caducidad fija es una escalera que se aleja: solo se gana 1 ticket al día, así que juntar 9 lleva semanas y los primeros mueren antes de que lleguen los últimos. El nivel alto se vuelve imposible y el cliente ve morir su progreso: eso no motiva, hace desinstalar. La urgencia la da la escalera, no el reloj. |
| Premio por país | **El mismo en todos** | Decisión del negocio. `niveles` **no** lleva `pais_id`. |
| Al llegar a N/N | **El QR nunca se bloquea, el ticket nunca se rechaza** | Bloquear castiga al cliente más fiel: entra el lunes, martes y miércoles y pierde su ticket por tener la tarjeta llena. Los tickets se apilan y al canjear se consumen los N más viejos; el resto arranca el siguiente nivel. |
| Canje | **Acto deliberado y separado del escaneo** | Si el escaneo canjeara automáticamente, el sistema daría por entregado un premio que nadie sacó del mostrador. Escanear es un gesto de caja; canjear es un acto físico. |
| Orden de consumo | **FIFO — los más viejos primero** | Es lo que el cliente espera y es justo. El sobrante pasa al siguiente nivel. |
| Niveles | **Configurables por el negocio** (tabla, no código) | Cuántos niveles y cuántos tickets cada uno son datos: sin tocar código. Única restricción: el número debe **cerrar en rejilla** (4, 6, 9, 12), porque `tickets_necesarios` ES el número de piezas del rompecabezas. Un primo como 7 deja una pieza suelta. |
| Último nivel | **Se repite para siempre** | Sin esto, el mejor cliente llega a "felicidades, terminaste" y la app se le vuelve peso muerto justo cuando demostró que funcionaba. Un programa de lealtad que se acaba deja de dar lealtad con quien más la tenía. |
| Roles | **`empleados.rol`**: `empleado` \| `gerente`. El gerente no es entidad aparte | Es un empleado con más poder: trabaja en una sucursal y atiende caja igual. |
| Alcance del gerente | **Empleados: solo los de SUS sucursales** (tabla `gerente_sucursales`, N:M). **Niveles y productos: todo el negocio.** | Un gerente puede llevar una o varias sucursales, y una sucursal puede tener dos gerentes (turnos) — por eso es N:M y no una columna. La asimetría es deliberada: la gente se administra por sucursal, pero el catálogo y la escalera de premios son del negocio entero. **Si hay dos gerentes comparten esa palanca y pueden pisarse** — riesgo aceptado, porque el dueño no va a administrar nada. |
| Empleado que también es cliente | **Permitido y deseable** | `auth.users` es la identidad; `perfiles` dice "es cliente" y `empleados` dice "es empleado". Una persona puede ser ambas: el empleado compra dulces en su día libre. Al despedirlo, sus tickets **de cliente** sobreviven — se los ganó comprando, no trabajando. |
| Despedir a un empleado | **`activo = false`, nunca borrar** | `tickets.empleado_id` apunta a él: borrarlo rompería cada ticket que dio en su vida. Y no hace falta borrarlo — `otorgar_ticket` filtra por `activo`, así que deja de poder escanear **al instante** aunque el botón siga dibujado. Además, por Realtime en `empleados`, su app **se pasa sola a vista de cliente** en vivo: no un muro de "acceso retirado", sino que se queda con su sombrero de cliente (perfil, tickets y premios intactos). Reactivarlo lo devuelve al panel, también en vivo. |
| Tope de tickets acumulados | **No hay** | Si acumular mucho sin canjear fuera señal de fraude, hay que **verla**, no taparla. Un tope no cambia la economía del fraude (el techo son los mismos premios) y sí destruye la señal. Lo que el negocio debe es una métrica: `count(*) from tickets where canje_id is null`. |
| Empleado escaneándose | **Bloquear lo obvio, detectar el resto** | No se puede prevenir: escanea a su pareja, a un amigo, a una cuenta falsa. Está físicamente ahí. Prevención débil, detección fuerte — cada ticket lleva `empleado_id` y una consulta delata "el empleado X dio el 40% de sus tickets a los mismos 3 usuarios". Es un problema de confianza, no de esquema. |

---

## 5. Esquema (aplicado en Supabase / PostgreSQL)

> Ya está en la base. Se muestra como referencia; para cambiarlo, migración
> nueva — no editar filas a mano.

`negocio_id` está desde el primer día en todas las tablas de datos, aunque hoy
haya un solo negocio. Cuesta una columna ahora; cuesta una migración sobre datos
en producción tocando cada consulta y cada política RLS después. Es la diferencia
entre "un trabajo para un cliente" y "un producto".

```sql
create table negocios (
  negocio_id uuid primary key default gen_random_uuid(),
  nombre     text not null,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

create table paises (
  pais_id uuid primary key default gen_random_uuid(),
  nombre  text not null,
  moneda  text not null
);

create table sucursales (
  sucursal_id  uuid primary key default gen_random_uuid(),
  negocio_id   uuid not null references negocios,
  pais_id      uuid not null references paises,
  nombre       text not null,
  direccion    text,
  zona_horaria text not null,          -- IANA: 'America/El_Salvador'
  activa       boolean not null default true
);

-- El usuario es global (un correo, una cuenta). La app se apoya en Supabase Auth.
create table perfiles (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  nombre     text,
  codigo     text not null unique,     -- lo que va dentro del QR del cliente
  creado_en  timestamptz not null default now()
);

create table empleados (
  empleado_id uuid primary key default gen_random_uuid(),
  sucursal_id uuid not null references sucursales,
  usuario_id  uuid references auth.users(id),  -- para bloquear el autoescaneo
  nombre      text not null,
  cargo       text,
  activo      boolean not null default true
);

create table niveles (
  nivel_id           uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references negocios,
  orden              int  not null,
  nombre             text not null,
  imagen_url         text,
  tickets_necesarios int  not null check (tickets_necesarios > 0),
  vigente_desde      timestamptz not null default now(),
  vigente_hasta      timestamptz,
  unique (negocio_id, orden)
);

create table canjes (
  canje_id    uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references perfiles,
  negocio_id  uuid not null references negocios,
  sucursal_id uuid not null references sucursales,
  empleado_id uuid not null references empleados,
  nivel_id    uuid not null references niveles,
  canjeado_en timestamptz not null default now()
);

create table tickets (
  ticket_id   uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references perfiles,
  negocio_id  uuid not null references negocios,
  sucursal_id uuid not null references sucursales,
  empleado_id uuid not null references empleados,
  fecha_local date not null,
  creado_en   timestamptz not null default now(),
  canje_id    uuid references canjes          -- null = disponible
);

-- LA regla del proyecto. No vive en el código de la app: vive aquí.
create unique index tickets_uno_por_dia
  on tickets (usuario_id, negocio_id, fecha_local);

create index tickets_disponibles
  on tickets (usuario_id, negocio_id) where canje_id is null;

-- Estado "pendiente de validar" del canje.
create table codigos_canje (
  codigo      text primary key,        -- aleatorio, sin caracteres ambiguos
  usuario_id  uuid not null references perfiles,
  negocio_id  uuid not null references negocios,
  nivel_id    uuid not null references niveles,
  generado_en timestamptz not null default now(),
  expira_en   timestamptz not null,
  canje_id    uuid references canjes   -- no null = ya usado
);
```

### Añadidos sobre el esquema base

El bloque de arriba es el esquema inicial. Después se agregó lo siguiente (todo
aplicado y probado; ver la lista de migraciones al final):

```sql
-- Roles del personal
alter table empleados add column rol text not null default 'empleado'
  check (rol in ('empleado','gerente'));

-- Catálogo (vitrina; no toca la lógica de tickets)
create table productos (
  producto_id uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios,
  nombre text not null, descripcion text, precio numeric(12,2) not null check (precio >= 0),
  categoria text not null, imagen_url text,        -- Storage; null = ilustración derivada
  disponible boolean not null default true, orden int not null default 0
);

-- Alcance del gerente: N:M. Manda sobre los empleados de SUS sucursales
-- (niveles y productos siguen siendo de todo el negocio).
create table gerente_sucursales (
  empleado_id uuid not null references empleados on delete cascade,
  sucursal_id uuid not null references sucursales,
  asignado_en timestamptz not null default now(),
  primary key (empleado_id, sucursal_id)
);

-- La unicidad de niveles pasó a índice PARCIAL: solo aplica a los vigentes, para
-- poder versionar (dar de baja el viejo + crear el nuevo con el mismo orden).
alter table niveles drop constraint niveles_negocio_id_orden_key;
create unique index niveles_orden_vigente
  on niveles (negocio_id, orden) where vigente_hasta is null;

-- Storage: bucket público 'premios' (lectura abierta, escritura solo gerente).
-- Las imágenes de niveles se suben aquí.

-- Realtime: publicación + replica identity para la app en vivo.
alter publication supabase_realtime add table tickets, canjes, empleados;
alter table tickets   replica identity full;  -- el UPDATE de canje llega con la fila
alter table empleados replica identity full;  -- el UPDATE de baja llega con la fila
```

### Las dos consultas que sostienen la app

```sql
-- Tickets disponibles
select count(*) from tickets
 where usuario_id = ? and negocio_id = ? and canje_id is null;

-- Nivel actual: derivado, nunca guardado. El LEAST es lo que hace que
-- el último nivel se repita para siempre.
select least(
  (select count(*) from canjes where usuario_id = ? and negocio_id = ?) + 1,
  (select max(orden) from niveles where negocio_id = ? and vigente_hasta is null)
);
```

### Reglas del esquema que no son negociables

- **La regla del día vive en el índice único, no en un `if`.** En el código sería
  `SELECT` y después `INSERT`, y entre esos dos pasos hay una rendija: el
  empleado toca dos veces, ambos escaneos leen "no tiene ticket hoy", ambos
  insertan. El índice hace que el segundo `INSERT` falle y se traduzca a "ya
  reclamó hoy".
- **`fecha_local` es un `date`, calculado con la zona horaria de la SUCURSAL.**
  Nunca derivar el día de un `timestamp` UTC: un escaneo a las 8 de la noche en
  México ya es "mañana" en UTC y regalaría dos tickets el mismo día real. Con
  sucursales en países distintos, la zona es la de la sucursal.
- **Nunca editar ni borrar una fila de `niveles`.** Darla de baja con
  `vigente_hasta` y crear otra. Si se renombra el nivel 2, los canjes de marzo
  empiezan a mentir sobre lo que se entregó. Los hechos del pasado no se editan.
- **Nunca añadir una columna contador.** Si aparece una, es un bug esperando.

---

## 6. Las funciones (RPC de Postgres)

Todas **existen y están probadas**. Todas en `SECURITY DEFINER` y
`SET search_path = public, pg_temp`. Firmas reales — no inventes parámetros:

| Función | Quién la llama | Firma |
|---|---|---|
| `otorgar_ticket` | empleado | `(p_codigo_usuario text) → jsonb` |
| `generar_codigo_canje` | cliente | `(p_negocio_id uuid) → jsonb` |
| `validar_codigo` | empleado | `(p_codigo text) → jsonb` |
| `crear_nivel` | gerente | `(p_orden, p_nombre, p_descripcion, p_imagen_url, p_tickets_necesarios) → jsonb` |
| `dar_de_baja_nivel` | gerente | `(p_orden int) → jsonb` |
| `desactivar_empleado` | gerente | `(p_empleado_id uuid) → jsonb` |
| `reactivar_empleado` | gerente | `(p_empleado_id uuid) → jsonb` |
| `nivel_actual` | interna | `(p_usuario_id, p_negocio_id) → niveles` |
| `negocio_del_gerente` | interna | `() → uuid` (un negocio del gerente; para niveles/productos) |
| `sucursales_del_gerente` | interna | `() → setof uuid` (las sucursales que maneja; acota `desactivar/reactivar_empleado`) |
| `crear_perfil_al_registrarse` | trigger | `()` en `auth.users`: crea el perfil cliente + código `GLS-` |

> **Fíjate en lo que NO recibe ninguna: quién es el empleado.** Eso sale siempre
> de `auth.uid()`, nunca de un parámetro. Si `otorgar_ticket` aceptara un
> `p_empleado_id`, cualquiera podría decir que es otro y dar tickets a nombre
> ajeno. Igual con el gerente: `negocio_del_gerente()` y `sucursales_del_gerente()`
> lo derivan de la sesión. Esa es la razón por la que las firmas son tan cortas.

> **Alcance del gerente (asimétrico, a propósito):** `desactivar_empleado` y
> `reactivar_empleado` solo tocan a gente de **sus** sucursales (vía
> `sucursales_del_gerente()`); `crear_nivel`, `dar_de_baja_nivel` y las políticas
> de `productos` aplican a **todo el negocio** (vía `negocio_del_gerente()`). Los
> empleados se administran por sucursal; el catálogo y los premios, por negocio.

### `otorgar_ticket(p_codigo_usuario)`

1. Busca al empleado por `auth.uid()` **y `activo`**. Aquí muere el despedido.
2. Deriva `sucursal_id`, `negocio_id` y `zona_horaria` de su sucursal.
3. Busca al cliente por su código `GLS-…`.
4. Rechaza el autoescaneo (`empleados.usuario_id = usuario del código`).
5. `fecha_local := (now() at time zone zona_horaria)::date`.
6. `INSERT INTO tickets ... ON CONFLICT DO NOTHING`. Si afecta 0 filas → ya
   reclamó hoy.
7. Devuelve `disponibles`, `necesarios`, `nivel` y `puede_canjear`.

> No hace falta bloquear nada ni leer antes de escribir: el `ON CONFLICT` sobre
> el índice único hace todo el trabajo, atómico. **Aquí no hay compare-and-swap
> porque no hay cupo, hay índice único** — es la versión fácil del problema.

### `generar_codigo_canje(p_negocio_id)`

La inicia **el cliente** desde la app cuando pulsa "Canjear".

- Solo si tickets disponibles ≥ `tickets_necesarios` del nivel actual.
- Código **aleatorio** (no derivado del usuario ni del nivel — si es adivinable,
  un empleado canjea premios de gente que ni está en la tienda).
- **Un solo uso** y **vencimiento corto** (10 min).
- 6 caracteres sin ambigüedades: **sin `O`/`0`, sin `I`/`1`/`L`**. El cajero está
  apurado.
- Si ya hay uno vivo, devuelve **el mismo**: tocar el botón dos veces no siembra
  códigos sueltos.

### `validar_codigo(p_codigo)`

La ejecuta **el empleado** tecleando el código en su interfaz.

1. `SELECT ... FOR UPDATE` sobre el código (evita doble validación).
2. Rechaza si está usado, vencido, o si el negocio del empleado no coincide.
3. Bloquea los `tickets_necesarios` tickets **más viejos** disponibles con
   `FOR UPDATE`.
4. `INSERT INTO canjes`, y marca esos tickets con `canje_id` — **con la FK real**.
5. Quema el código. Todo en una transacción.

### `crear_nivel(...)` — versiona, no edita

No hay política de `UPDATE` sobre `niveles` a propósito. `crear_nivel` da de baja
el nivel vigente de ese orden (`vigente_hasta = now()`) e inserta uno nuevo. Los
canjes viejos siguen apuntando a la fila antigua y siguen diciendo la verdad.

> ⚠️ La unicidad de `(negocio_id, orden)` es un **índice parcial**
> (`where vigente_hasta is null`). Con una constraint normal, versionar era
> imposible: el nivel nuevo chocaba con el histórico y la propia base prohibía
> nuestra regla de inmutabilidad.

`dar_de_baja_nivel` se niega a quitar el último: sin niveles, `nivel_actual` no
devuelve nada y el rompecabezas se queda sin premio que mostrar.

### El alta es automática

Trigger `al_crear_usuario` sobre `auth.users` →
`crear_perfil_al_registrarse()`. Al registrarse alguien, le crea su fila en
`perfiles` con un código `'GLS-' || generar_codigo_texto()`: aleatorio, con
reintento contra colisión y respaldado por el `unique` de la columna. El nombre
sale de los metadatos del registro o de la parte antes del `@`.

> El prefijo `GLS-` está clavado en la función. Si algún día hay un segundo
> negocio, ese prefijo miente.

`generar_codigo_texto()` es el único que **no** es `SECURITY DEFINER`, y está
bien: no toca ninguna tabla, solo devuelve 6 letras al azar.

**Por qué un código tecleado y no escanear el QR otra vez:** el código prueba que
el cliente participó. Si el canje se hiciera escaneando su QR, un empleado podría
canjearle el premio sin que se entere y quedarse el combo. Es el patrón del
proyecto hermano (§9) invertido: allá el empleado genera el token y el cliente
escanea; aquí el cliente genera y el empleado teclea.

---

## 7. Seguridad

El modelo, en una línea: **las funciones son la única puerta de escritura.**

- **RLS activa en las 11 tablas** (el proyecto se creó con "automatic RLS", que
  la activa sola en cada tabla nueva — no lo apagues).
- Hay **14 políticas y solo 2 son de escritura**, ambas de `productos` (ver
  abajo). Todo lo demás es `SELECT`, y sobre lo propio: `usuario_id = auth.uid()`.
- **Sobre `tickets`, `canjes` y `codigos_canje` no hay ni una política de
  escritura.** Sin política y con RLS activa, se deniega por defecto: un cliente
  no puede tocarlas por PostgREST aunque lo intente.
- Por eso las funciones **deben** ser `SECURITY DEFINER` — lo son. En
  `SECURITY INVOKER` fallarían al insertar, y la única salida sería llamarlas con
  `service_role`, una llave maestra que jamás debe estar en el cliente. *(Ese es
  exactamente el error que tiene SuSalon, §9.)*
- Cualquier `authenticated` puede **llamar** las funciones; cada una comprueba
  por dentro quién eres (`auth.uid()`). No hay acceso directo a las tablas para
  nadie: ni empleado, ni gerente.

### La prueba de que funciona

El panel de "controles de demostración" que tenía el prototipo **tuvo que
borrarse**: con esta RLS, el cliente no puede regalarse tickets ni simulados. Que
ese botón sea imposible de escribir es la demostración de que el modelo cierra.

### La única excepción: `productos`

`productos` sí tiene políticas de `INSERT` y `UPDATE` para el gerente. No es una
incoherencia: la regla de "solo funciones" protege el **libro contable**
(`tickets`, `canjes`), que son hechos que valen dinero. `productos` es una
vitrina. Lo peor que puede pasar es que un gerente edite su propio catálogo, que
es literalmente su trabajo.

`niveles` **no** tiene esa excepción, y es la distinción importante: un nivel sí
es un hecho histórico porque los canjes apuntan a él. Por eso se versiona con
`crear_nivel`, nunca con un `UPDATE`.

---

## 8. Decisiones abiertas (del dueño del negocio, no técnicas)

1. **¿Cuánto vale cada premio?** Define la economía completa. Hoy los niveles
   sembrados son 4 → 6 → 9 con nombres de relleno (Combo Dulce / Premium /
   Maestro): son **datos**, cámbialos cuando el negocio decida.
2. **Dirección, teléfono, horarios y zona horaria reales** de cada sucursal (hoy
   hay una ficticia en El Salvador).
3. **Fotos reales** del catálogo y de los premios.

### Pendientes del prototipo (recomendados, sin aplicar)

- **Reordenar las tabs a `Mi ticket · Productos · Ubicación · Perfil`.** El orden
  actual es el que se pidió, pero la app abre en la pestaña 3 — señal de que el
  orden no refleja las prioridades. Ubicación es la pestaña menos usada (se
  consulta una vez y nunca más) y ocupa el lugar "home". Perfil al final está
  bien: es convención universal.
- **Botón "Mostrar mi código" en Mi ticket.** La acción más urgente de la app es
  mostrar el QR en caja, con gente esperando detrás — y hoy vive en la pestaña
  más lejana, con scroll. El QR se queda también en Perfil como referencia.

> El **slider de niveles** que se pidió se resolvió distinto y a propósito: el
> nivel actual va grande y el siguiente asoma abajo, siempre visible. Un slider
> en móvil se descubre poco, y si el siguiente nivel es el gancho, esconderlo
> tras un gesto le quita justo la fuerza que se buscaba.

---

## 9. Proyecto hermano: SuSalon (referencia)

Otro proyecto del mismo autor, **no relacionado en código**, pero con lógica
parecida (cupones dados por empleados). Es una mina: tiene patrones que copiar y
bugs reales que **no** repetir.

- Proyecto Supabase: `SuSalon's Project` (`yliztzeshxaollizfylf`).
- ERD navegable: `C:\my-salon\proyecto-salons\detalles-recientes\tablas-circuitoV1.html`.
- Es un **circuito de cupones**: el negocio A entrega cupones canjeables en el
  negocio B dentro de una alianza.

### Qué copiar

- **Derivar el negocio del empleado, nunca aceptarlo como parámetro.** Un
  empleado solo valida lo de su propio negocio. Ya está adoptado aquí.
- El patrón de token generado + vencimiento corto + un solo uso.
- RLS de "leer lo propio, escribir nunca".
- `SET search_path` en las funciones.
- El compare-and-swap atómico (`UPDATE ... WHERE contador < tope` +
  `GET DIAGNOSTICS ROW_COUNT`). Aquí **no hace falta** porque no hay cupo, hay
  índice único — pero es la técnica correcta cuando sí hay cupo.

### Qué NO repetir (bugs verificados en su base de datos)

1. **`conteo_cupones_de_usuario` — el contador que nadie decrementa.** No hay
   trigger ni código que lo baje. Resultado real: 3 de 7 usuarios están
   **bloqueados de por vida** para recibir cupones de un negocio. Peor: los datos
   sembrados dicen que un cupón expirado libera cupo, pero el código no libera
   nunca — hay una regla que existe en los datos y no en el código. **Ese
   contador es la razón exacta por la que aquí los tickets son filas.**
2. **El vínculo cupón→recibo es una coincidencia de timestamps.** El código tiene
   el UUID de la transacción en una variable y no lo guarda; en su lugar confía en
   que `fecha_consumido == fecha_transaccion`. Sin FK, sin enforcement, e
   indescubrible para quien lea el esquema. Aquí `tickets.canje_id` es una FK de
   verdad.
3. **Editar una ruta reescribe el pasado.** El destino del cupón se resuelve por
   JOIN en el momento del canje, no se congela al reclamar: cambiar una ruta
   altera cupones ya emitidos. De ahí la regla de no editar `niveles` nunca.
4. **Funciones en `SECURITY INVOKER`** con RLS activa y sin políticas de
   escritura: solo pueden correr como `service_role`. Ver §7.
5. **El techo sin salida.** Un usuario llegó al tope y no hay nada más para él:
   la mecánica lo mata. De ahí que aquí el último nivel se repita para siempre.

---

## 10. Historial de decisiones ya cerradas

Para que nadie las reabra sin saber que ya se discutieron. **Todas se tomaron
descartando una alternativa concreta**, y varias suenan bien hasta que lees el
porqué — que es justo el peligro.

- **SQL, no NoSQL.** Los datos son relacionales de libro y las reglas
  (unicidad diaria, conteos, agregados para reportes) son exactamente lo que SQL
  resuelve solo. En Firestore la regla del día habría que programarla a mano con
  transacciones, y las agregaciones obligan a mantener contadores duplicados —
  justo lo que este diseño evita.
- **El QR del cliente es su identidad, no un cupón.** Es estático a propósito:
  quien decide cuándo se otorga el ticket es el empleado, y su presencia física
  es la barrera antifraude. Por eso no necesita rotar.
- **Se descartó el QR fijo pegado en el local**: se fotografía una vez y se
  escanea desde casa todos los días.
- **Se descartó la caducidad de tickets** (se evaluaron 90 días). Ver §4: choca
  de frente con los niveles crecientes.
- **Se descartó el tope de tickets acumulados** (se evaluó topar en la suma de la
  escalera). El argumento era que acumular mucho sin canjear parece fraude — pero
  entonces quieres **ver** esa señal, no taparla. Un tope no cambia el techo de lo
  que un tramposo puede sacar; solo borra la evidencia.
- **Se descartó bloquear el QR al llenar la tarjeta.** Castiga al cliente más
  fiel: el que entra a diario mientras decide cuándo canjear perdería su ticket.
- **Se descartó el rol `dueño`** por encima del gerente. Ver el aviso de §2: el
  dueño no se hará cargo en la práctica, y un rol que nadie usa es teatro.
- **Se descartó que el escaneo canjee automáticamente al llegar a N/N.** Daría por
  entregado un premio que nadie sacó del mostrador, y le quitaría el ticket del
  día a quien solo pasó a comprar.
- **La FK va en el hijo.** Se propuso `negocios.id_producto`; eso diría que un
  negocio tiene *un* producto. Es `productos.negocio_id`: la clave foránea vive
  siempre del lado "muchos".

---

## 11. Imágenes del premio y por qué 4 → 6 → 9

**Una sola imagen, cortada con CSS. Nunca piezas sueltas.**

El motivo no es el ancho de banda: **el número de piezas lo decide el negocio**.
Con archivos separados, el dueño tendría que subir 4 imágenes pre-cortadas para
un nivel y 6 para el otro — imposible desde un celular. Con CSS sube **una foto**
y la rejilla se adapta. Además, recortar es duplicar: si cambia el premio, habría
que re-cortar y re-subir todo. Una sola fuente de verdad.

**Y de ahí sale la escalera 4 → 6 → 9.** `tickets_necesarios` es también el
número de piezas, así que tiene que cerrar en una rejilla:

| Tickets | Rejilla |
|---|---|
| 4 | 2×2 |
| 6 | 3×2 |
| 9 | 3×3 |
| 12 | 4×3 |

Un número **primo como 7 no cierra**: con 3 columnas deja una pieza suelta en la
última fila y la imagen se ve rota. Si el negocio quiere 7, hay que dibujar ese
layout a mano con `clip-path`. Se propuso 4 → 7 al principio y se cambió a
4 → 6 → 9 por esto; la progresión motiva igual y se ve bien.

**Guardado:** bucket público de Supabase Storage, la URL en `niveles.imagen_url`
(hoy apunta a `/premio-combo.svg`, el placeholder local). Imágenes **cuadradas**
(el rompecabezas lo es) y ~800×800 — nada de fotos de 4 MB del celular.

---

## 12. Datos de prueba en la base

Las **cuentas con login** (correo + `prueba1234`) están en la tabla de §2
("Cuentas semilla"): Ana (clienta), Luis (gerente) y Sofía (empleada). Esta
sección solo añade lo que no cabe ahí:

- **Sucursales:** el negocio tiene **Centro** y **Zona Rosa**. Luis (gerente)
  maneja **las dos** (`gerente_sucursales`). Sofía es empleada de Centro.
- **Marta Ajena** es una empleada de **Zona Rosa sin login** (fila en `empleados`
  sin `usuario_id`). Existe solo para probar que un gerente no puede tocar a
  alguien fuera de sus sucursales — no es una cuenta.
- **Contraseñas:** sí tienen (`prueba1234`). Requirió sembrar además la fila en
  `auth.identities`; sin ella el login por contraseña falla en silencio (ver el
  aviso de §2).
- Ana tiene el **cupo de hoy libre** a propósito, para poder demostrar el escaneo
  en vivo sin toparse con el límite diario.

El código del QR de cada perfil lo genera solo el trigger `al_crear_usuario`, así
que **nadie puede quedar sin perfil ni sin código**.

---

## 13. Migraciones aplicadas (en orden)

La verdad de lo que existe en la base. 17 migraciones:

1. `esquema_inicial` — 10 tablas base, índice de un-ticket-por-día
2. `politicas_rls` — RLS: leer lo propio, escribir nunca
3. `funcion_otorgar_ticket` — el escaneo + `nivel_actual`
4. `funciones_canje` — `generar_codigo_canje`, `validar_codigo`
5. `permisos_explicitos` — grants a los roles
6. `perfil_automatico_al_registrarse` — trigger del perfil + código `GLS-`
7. `datos_semilla` — negocio, sucursal, niveles 4→6→9
8. `endurecer_funciones_internas` — `search_path`, etc.
9. `catalogo_productos` — tabla `productos` + 10 dulces
10. `rol_gerente` — `empleados.rol`, `desactivar/reactivar_empleado`
11. `gerente_administra_catalogo` — `crear_nivel`/`dar_de_baja_nivel`, índice parcial de niveles, políticas de escritura de `productos`
12. `gerente_por_sucursales` — tabla `gerente_sucursales` (N:M), `sucursales_del_gerente()`
13. `desactivar_acotado_a_sucursales` — desactivar/reactivar limitado a sus sucursales
14. `storage_premios_y_nivel_nullif` — bucket `premios`, `crear_nivel` con `nullif`
15. `realtime_tickets_canjes` — publicación Realtime
16. `tickets_replica_identity_full` — para el UPDATE de canje en vivo
17. `realtime_empleados` — cambio de rol en vivo (empleado → cliente)
