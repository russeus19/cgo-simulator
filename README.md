# CGO Simulator

Simulador de gestión de operaciones de la línea C-7 de Cercanías Madrid.
Puesto de mando en tiempo real: material, personal, incidencias, taller y
campaña encadenada por turnos.

## Desarrollo

```bash
npm install
npm run dev
```

## Compilación

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ en local para comprobarlo
```

## Despliegue en Vercel

El proyecto es una aplicación Vite sin servidor. Al importar el repositorio,
Vercel detecta el preset automáticamente:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

No hay variables de entorno que configurar.

## Notas

- La campaña se guarda en `localStorage`, así que cada jugador conserva su
  partida en su propio dispositivo.
- La imagen de portada está en `public/cabecera.jpg` y se sirve estáticamente.
- Proyecto no oficial, sin relación con Renfe ni con Adif.
