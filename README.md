# Mi Ticket

App web de fidelización para una dulcería. El cliente muestra su QR en caja, el
empleado lo escanea y gana 1 ticket al día. Junta N tickets, canjea un premio y
sube de nivel. El progreso se ve como un rompecabezas: cada ticket revela una
pieza de la imagen del premio.

**Estado: prototipo.** Interfaz navegable con datos falsos, sin backend todavía.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
```

## Documentación

📄 **[PROYECTO.md](PROYECTO.md)** — el documento importante. Qué existe, el
esquema de base de datos propuesto y el porqué de cada decisión de diseño.
Léelo antes de tocar el código.

## Estructura

```
src/
  mock/datos.ts       Datos falsos + tipos. Cada objeto = una tabla futura.
                      Es la costura por donde entrará Supabase.
  pantallas/          Una por pestaña: Ubicacion, Productos, MiTicket, Perfil.
  componentes/        BarraTabs, Iconos, FormaDulce.
public/
  premio-combo.svg    Ilustración del premio: la imagen que se parte en 4 piezas.
```

## Stack

Vite · React 19 · TypeScript · CSS propio (sin librerías de UI) ·
[`qrcode.react`](https://github.com/zpao/qrcode.react) para el QR del cliente.
Backend previsto: Supabase (PostgreSQL), aún sin crear.

Diseño móvil primero; en escritorio la app se centra con ancho de teléfono.
