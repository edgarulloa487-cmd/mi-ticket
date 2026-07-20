# Mi Ticket

**Lee [PROYECTO.md](PROYECTO.md) antes de tocar nada.** Para verificar o dar una
segunda opinión, la guía reproducible es [PRUEBAS.md](PRUEBAS.md). Contiene el contexto
completo: qué es la app, qué existe hoy, el esquema de base de datos propuesto y
—lo más importante— **por qué** se tomó cada decisión. Varias de esas decisiones
parecen contraintuitivas hasta que se lee el motivo, así que no las "corrijas"
sin leerlo.

Resumen de una línea: app web de fidelización para una dulcería. El cliente
muestra su QR en caja, el empleado lo escanea, gana 1 ticket al día. Junta N y
canjea un premio; luego sube de nivel.

## Lo mínimo que hay que saber

- Hoy es **solo un prototipo**: React 19 + Vite + TypeScript, sin backend. Todos
  los datos salen de `src/mock/datos.ts`.
- El backend será **Supabase** (PostgreSQL). Aún no está creado.
- Principio rector: **guarda hechos, no estados**. Un ticket es una fila, nunca
  un contador. Nada se borra ni se resetea; se marca. Lo derivable se deriva.
- Servidor de desarrollo: `npm run dev` (puerto 5173).
- Idioma del código y de la interfaz: **español**.
