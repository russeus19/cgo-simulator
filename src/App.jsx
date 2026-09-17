import React, { useState, useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   CGO · LÍNEA C-7
   Asignación de material + turno de mañana
   ══════════════════════════════════════════════════════════════ */

/* El rojo de la línea vive en LIN, que cambia con el tema. Aquí se expone como
   objeto mutable para que las más de cien referencias lo lean al dibujar. */
const COLOR = { rojo: "#D7282F" };
/* Dos paletas con los mismos nombres. En oscuro no se invierten los tonos sin
   más: los fondos son azulados y fríos, como un puesto de mando de verdad, y
   los colores de estado se aclaran para que aguanten sobre fondo oscuro sin
   vibrar.                                                                */
const CLARO = {
  ground: "#E9EBEA",
  surface: "#FFFFFF",
  blanco: "#FFFFFF", // texto sobre fondos de color
  ink: "#11161A",
  muted: "#6B7780",
  rule: "#D5DAD9",
  sunken: "#F3F5F4",
  solido: "#11161A", // fondo macizo con texto blanco encima
  info: "#0065B3", // incidencia leve: informa, no alarma
  ok: "#0E7A50",
  warn: "#D98200",
  alert: "#C8102E",
};

const OSCURO = {
  ground: "#0D1117",
  surface: "#161C24",
  blanco: "#FFFFFF",
  ink: "#E4E9EE",
  muted: "#7F8C99",
  rule: "#2A333D",
  sunken: "#1E262F",
  /* En oscuro no puede ser el color del texto: quedaba una pastilla clara con
     el texto blanco encima. Este tono se despega de la tarjeta (3,3:1) y
     mantiene el blanco legible encima (5,2:1).                         */
  solido: "#5B6E85",
  info: "#4C9BE0",
  ok: "#2FA26E",
  warn: "#E8A33D",
  alert: "#F05A6B",
};

/* La paleta se muta en el sitio en vez de sustituirse: hay más de quinientas
   referencias a P repartidas por el juego y todas leen sus valores al dibujar,
   así que basta con cambiar el contenido y volver a dibujar.             */
const P = { ...CLARO };

/* ── infraestructura ────────────────────────────────────────── */

/* Escala tipográfica. Había veintiséis tamaños distintos, con 11, 11,5, 12 y
   12,5 conviviendo: medio píxel no se percibe, pero obliga a decidir cada vez
   y descuadra alineaciones. Nueve pasos con nombre, cada uno con su papel. */
/* Radios de esquina: había trece valores distintos, de 1 a 20 px. Cinco
   bastan y hacen que todo encaje entre sí.                              */
const R = { hilo: 2, menudo: 4, normal: 8, grande: 14, pastilla: 20 };

/* Elevación. Todo estaba al mismo nivel visual y no se entendía qué descansa
   sobre qué: la tarjeta, el desplegable y la hoja de perfil se veían igual.
   Cuatro niveles, del contenido a lo que flota sobre todo lo demás.     */
const SOMBRA = {
  card: "0 1px 2px rgba(10,14,17,.05)", // apoyada en el fondo
  elevado: "0 4px 12px rgba(10,14,17,.10)", // desplegables y avisos
  hoja: "0 -6px 24px rgba(10,14,17,.16)", // hojas inferiores
  barra: "0 -2px 10px rgba(10,14,17,.10)", // barra de mando
};

const T = {
  micro: 9,      // rótulos en versalita
  menor: 10,     // apostillas y pies
  aux: 11.5,     // datos secundarios
  base: 13,      // texto corriente
  alto: 15,      // botones y datos destacados
  titulo: 19,    // títulos de hoja
  cabecera: 27,  // cifras grandes y encabezados
  cartel: 44,    // portada
  cartelXL: 56,  // portada
};

/* Las dos familias van declaradas en un solo sitio. La monoespaciada era
   ui-monospace, que toma la del sistema: SF Mono en Apple, Consolas en
   Windows, Roboto Mono en Android. Cada una tiene anchos y métricas
   distintas, así que el mismo dato ocupaba un espacio diferente en cada
   dispositivo y podía descuadrar lo que tanto ha costado alinear.

   Roboto Mono es neutra y de trazo limpio: acompaña a Archivo sin competir
   con ella y se lee bien en cuerpos pequeños, que es donde van las horas y
   los números de tren.                                                  */
const FUENTE = "'Archivo', system-ui, sans-serif";
/* Para los datos se usa la misma Archivo con cifras tabulares en vez de una
   monoespaciada. Así el cero queda limpio —casi todas las monoespaciadas lo
   marcan con barra o punto para distinguirlo de la O— y el juego mantiene una
   sola voz tipográfica. Las cifras tabulares dan a todos los dígitos el mismo
   ancho, que era lo único que se necesitaba de una monoespaciada: que las
   horas y los números no bailen al cambiar.                             */
const MONO = "'Archivo', system-ui, sans-serif";

const LIN = { "C-7": "#D7282F", "C-1": "#5BB3E4", "C-9": "#0E7A50", "C-2": "#00A24B", "C-3": "#7B2E8E", "C-4": "#004B93", "C-5": "#F2A104", "C-8": "#8A8F94", "C-10": "#00A192" };
const METRO = "#0065B3";
let LINEA = "C-7"; // línea que el motor está procesando ahora mismo

// núcleo de Cercanías Madrid. Solo la C-7 está implementada por ahora.
const LINEAS_NUCLEO = [
  { id: "C-1", n: "Príncipe Pío · Aeropuerto T4" },
  { id: "C-2", n: "Guadalajara · Chamartín" },
  { id: "C-3", n: "Aranjuez · El Escorial" },
  { id: "C-4", n: "Parla · Colmenar Viejo" },
  { id: "C-5", n: "Móstoles El Soto · Humanes" },
  { id: "C-7", n: "Príncipe Pío · Alcalá de Henares" },
  { id: "C-8", n: "Guadalajara · Cercedilla" },
  { id: "C-9", n: "Cercedilla · Cotos" },
  { id: "C-10", n: "Villalba · Villaverde Bajo" },
];

const TURNOS = [
  { id: "manana", n: "Mañana", h: "06:00 – 14:00", ini: 6 * 60, fin: 14 * 60, ok: true },
  { id: "tarde", n: "Tarde", h: "14:00 – 22:00", ini: 14 * 60, fin: 22 * 60, ok: true },
  { id: "noche", n: "Noche", h: "22:00 – 06:00", ini: 22 * 60, fin: 30 * 60, ok: true },
];
const SERIE_COLOR = { 446: "#6B7780", 450: "#7B2E8E", 465: "#004B93" };
const ML = "#46708C";

/* ── catálogo de líneas ─────────────────────────────────────────
   Cada línea declara su infraestructura y sus tiempos. El motor trabaja con
   UNA línea a la vez: fijarLinea() cambia las constantes globales, igual que
   el tema cambia la paleta. Así conviven varias sin reescribir las quinientas
   referencias que hay repartidas por el juego.                        */
const EST_C7 = [
  { n: "Príncipe Pío", corto: "P. Pío", t: 0, esc: 4, rotVias: ["vía 3", "vía 4"], apartVias: ["vía 30"], apartSeries: ["446"], term: true, cab: "Príncipe Pío", tipo: "est", c: ["C-10"], metro: true },
  { n: "Aravaca", corto: "Aravaca", t: 6, esc: 3, tipo: "ap", c: ["C-10"], ml: true },
  { n: "Pozuelo", corto: "Pozuelo", t: 9, esc: 3, rotVias: ["vía 4"], apartVias: ["vía 4"], tipo: "est", rot: true, c: ["C-10"] },
  { n: "El Barrial", corto: "El Barrial", t: 11, esc: 2, tipo: "ap", c: ["C-10"] },
  { n: "Majadahonda", corto: "Majadahonda", t: 14, esc: 2, tipo: "ap", c: ["C-10"] },
  { n: "Las Rozas", corto: "Las Rozas", t: 18, esc: 2, tipo: "ap", c: ["C-10"] },
  // bifurcación: cambia de vía pero no tiene vías desviadas donde estacionar
  { n: "Bifurcación Pío – Chamartín", corto: "Bif. Pío–Cham.", t: 19, tipo: "puesto", puesto: true, agujas: true, c: [] },
  { n: "Pitis", corto: "Pitis", t: 29, esc: 2, rotVias: ["vía 3"], apartVias: ["vía 5"], tipo: "est", rot: true, c: ["C-8"], metro: true },
  { n: "Mirasierra – Paco de Lucía", corto: "Mirasierra", t: 32, esc: 2, tipo: "ap", c: ["C-8"], metro: true },
  { n: "Ramón y Cajal", corto: "R. y Cajal", t: 36, esc: 3, tipo: "ap", c: ["C-8"] },
  { n: "Chamartín", corto: "Chamartín", t: 41, esc: 5, rot: true, rotVias: ["vía 6", "vía 7", "vía 8", "vía 9", "vía 10", "vía 11"], paso: { pio: "vía 11", alcala: "vía 7" }, apartVias: ["M6", "M8", "M10", "M12", "M14", "M16"], cab: "Chamartín", tipo: "est", c: ["C-1", "C-2", "C-3", "C-4", "C-8", "C-10"], metro: true },
  { sot: true, n: "Nuevos Ministerios", corto: "N. Ministerios", t: 46, esc: 5, rotVias: ["vía 4"], tipo: "est", rot: true, c: ["C-2", "C-3", "C-4", "C-8", "C-10"], metro: true },
  { sot: true, n: "Recoletos", corto: "Recoletos", t: 49, esc: 4, tipo: "ap", c: ["C-2", "C-8", "C-10"] },
  { sot: true, n: "Atocha", corto: "Atocha", t: 53, esc: 5, rotVias: ["vía 1"], gen: [{ via: "vía 2", dir: "pio" }, { via: "vía 3", dir: "alcala" }], tipo: "est", rot: true, c: ["C-2", "C-3", "C-4", "C-5", "C-8", "C-10"], metro: true },
  { n: "Asamblea de Madrid – Entrevías", corto: "Entrevías", t: 60, esc: 4, tipo: "ap", c: ["C-2", "C-8"] },
  { n: "El Pozo", corto: "El Pozo", t: 62, esc: 4, tipo: "ap", c: ["C-2", "C-8"] },
  { n: "Vallecas Industrial", corto: "Vallecas Ind.", t: 63, tipo: "puesto", puesto: true, rot: true, rotVias: ["vía 3", "vía 4"], c: [] },
  { n: "Vallecas", corto: "Vallecas", t: 65, esc: 4, tipo: "ap", c: ["C-2", "C-8"], metro: true },
  { n: "Santa Eugenia", corto: "Sta. Eugenia", t: 68, esc: 3, tipo: "ap", c: ["C-2", "C-8"] },
  { n: "Vicálvaro", corto: "Vicálvaro", t: 72, esc: 4, rotVias: ["vía 4"], apartVias: ["vía 4"], tipo: "est", rot: true, c: ["C-2", "C-8"], metro: true },
  { n: "Coslada", corto: "Coslada", t: 79, esc: 3, rotVias: ["vía 0"], apartVias: ["vía 0"], tipo: "est", rot: true, c: ["C-2", "C-8"], metro: true },
  { n: "San Fernando", corto: "San Fernando", t: 82, esc: 3, rotVias: ["vía 3"], apartVias: ["vía 3"], rotDir: "pio", tipo: "est", rot: true, c: ["C-2", "C-8"] },
  { n: "Torrejón de Ardoz", corto: "Torrejón", t: 89, esc: 4, rotVias: ["vía 5"], apartVias: ["vía 5"], tipo: "est", rot: true, c: ["C-2", "C-8"] },
  { n: "Soto del Henares", corto: "Soto Henares", t: 92, esc: 3, tipo: "ap", c: ["C-2", "C-8"] },
  { n: "La Garena", corto: "La Garena", t: 96, esc: 3, tipo: "ap", c: ["C-2", "C-8"] },
  { n: "Alcalá de Henares", corto: "Alcalá", t: 100, esc: 5, rotVias: ["vía 1", "vía 2", "vía 4", "vía 6"], apartVias: ["vía 2", "vía 4", "vía 6"], term: true, cab: "Alcalá de Henares", tipo: "est", c: ["C-2", "C-8"] },
];
/* C-1 · Chamartín – Aeropuerto T4. Quince minutos de recorrido, siete de
   inversión en el aeropuerto y ocho en Chamartín: el ciclo sale de 45 min,
   que con intervalo de 15 son exactamente tres circulaciones y hace cuadrar
   el horario real de salidas a y 05, y 20, y 35 y y 50.               */
const EST_C1 = [
  // en Chamartín la C-1 usa la vía 12, y la 9B y la 10B cuando hace falta
  { n: "Chamartín", corto: "Chamartín", t: 0, esc: 5, rotVias: ["vía 12", "vía 9B", "vía 10B"], apartVias: ["M6", "M8", "M10", "M12", "M14", "M16"], cab: "Chamartín", tipo: "est", term: true, c: ["C-2", "C-3", "C-4", "C-7", "C-8", "C-10"], metro: true },
  { n: "Fuente de la Mora", corto: "F. de la Mora", t: 4, esc: 2, tipo: "ap", c: [], metro: true },
  /* Sin servicio comercial, como Vallecas Industrial en la C-7, pero con
     agujas y dos vías donde estacionar material.                       */
  /* Tiene apartadero, luego tiene agujas: delimita tramo de vía única aunque
     no preste servicio ni tenga vía desviada de paso.                  */
  { n: "Hortaleza", corto: "Hortaleza", t: 7, esc: 2, tipo: "est", puesto: true, agujas: true, apartVias: ["vía 5", "vía 22"], gen: [{ via: "vía 3", dir: "alcala" }, { via: "vía 4", dir: "pio" }], c: [] },
  // en el túnel del Aeropuerto, entre Hortaleza y la terminal
  { sot: true, n: "Valdebebas", corto: "Valdebebas", t: 10, esc: 2, tipo: "ap", c: [], metro: false },
  { sot: true, n: "Aeropuerto T4", corto: "Aeropuerto T4", t: 15, esc: 5, rotVias: ["vía 1", "vía 2"], apartVias: ["M1", "M3"], cab: "Aeropuerto T4", tipo: "est", term: true, c: [], metro: true },
];

/* Ficha de cada línea. Todo lo que el motor necesita saber para trabajar con
   ella: infraestructura, tiempos y material admitido.                  */
let ESTACIONES = EST_C7; // catálogo de la línea vigente

/* Tramos que la C-7 comparte con otras líneas. Se indexan por nombre de
   estación y no por número: al añadir los puestos de circulación todas las
   bandas se desplazaron y quedaron señalando el tramo equivocado.       */
/* Cada banda se dibuja justo encima de la estación indicada, de modo que
   queda entre esa y la anterior. Túnel de la Risa va entre Chamartín y
   Nuevos Ministerios, y el Corredor del Henares entre Atocha y Entrevías. */
const BANDAS_C7 = [
  { antesDe: "Príncipe Pío", n: "Las Rozas – Príncipe Pío", d: "con C-10" },
  { antesDe: "Pitis", n: "El Pardo – Pitis", d: "con C-8" },
  { antesDe: "Nuevos Ministerios", n: "Túnel de la Risa", d: "con C-2, C-8 y C-10" },
  { antesDe: "Asamblea de Madrid – Entrevías", n: "Corredor del Henares", d: "con C-2 y C-8" },
];

// tramos singulares de la C-1
const BANDAS_C1 = [
  { antesDe: "Valdebebas", n: "Túnel del Aeropuerto", d: "Valdebebas y T4 en subterráneo" },
];

let BANDAS = {}; // se rehace al fijar la línea

/* Líneas que se juegan en esta partida. El resto del núcleo ya está declarado
   con su color y aparece en el selector: incorporarlas es añadir su ficha a
   LINEAS y su identificador aquí.                                      */
let LINEAS_EN_JUEGO = ["C-7"]; // las que elija el jugador al empezar

const LINEAS = {
  "C-7": {
    id: "C-7",
    estaciones: EST_C7,
    recorrido: 100,
    invA: 20, // inversión en el extremo alto (Alcalá)
    invB: 40, // inversión en el extremo bajo (Príncipe Pío)
    intervalo: 20,
    longitud: 71.6,
    series: ["446", "465", "450"],
    dobles: true, // admite composiciones dobles
    viajerosDia: 150000,
    desfase: 0, // minuto de la hora en que arranca la cadencia
    // siglas del destino de cada sentido
    siglaAlta: "AH",
    siglaBaja: "PP",
    serie: 21800, // numeración de las marchas
    serieVacio: 37200,
    bandas: BANDAS_C7
  },
  "C-1": {
    id: "C-1",
    estaciones: EST_C1,
    recorrido: 15,
    invA: 7, // Aeropuerto T4
    invB: 8, // Chamartín
    intervalo: 15,
    longitud: 12.4,
    series: ["465"],
    dobles: false, // solo Civia en composición sencilla
    viajerosDia: 18500,
    // salidas de Chamartín a y 05, y 20, y 35 y y 50
    desfase: 5,
    // pares hacia el Aeropuerto (BT), impares hacia Chamartín (MH)
    siglaAlta: "BT",
    siglaBaja: "MH",
    serie: 19800,
    serieVacio: 35200,
    bandas: BANDAS_C1
  },
};




let N = ESTACIONES.length;

/* Índices de las tres cabeceras. Se calculan a partir del nombre para que
   añadir o quitar paradas no vuelva a descolocar nada: estaban escritos a
   mano y al insertar los puestos de circulación dejaron de apuntar donde
   debían.                                                                */
let IDX_PIO = 0;
let IDX_CHAMARTIN = ESTACIONES.findIndex((e) => e.n === "Chamartín");
let IDX_ALCALA = N - 1;
// puntos donde la C-7 comparte vía con mercancías, buscados por nombre
let IDX_ROZAS = ESTACIONES.findIndex((e) => e.n === "Las Rozas");
let IDX_PITIS = ESTACIONES.findIndex((e) => e.n === "Pitis");
let IDX_VICALVARO = ESTACIONES.findIndex((e) => e.n === "Vicálvaro");
let RECORRIDO = 100; // min de extremo a extremo
let INV_ALCALA = 20; // inversión en el extremo alto
let INV_PIO = 40; // inversión en el extremo bajo
const MANIOBRA = 4; // mínimo técnico para invertir en estación intermedia
const MIN_ANTELACION = 3; // margen mínimo para preparar el itinerario de rotación
let CICLO = RECORRIDO * 2 + INV_ALCALA + INV_PIO;
let INTERVALO = 20; // frecuencia cadenciada
// fases clave del ciclo
let DESFASE = 0; // minuto de la hora en que empieza la cadencia
let LLEGA_ALCALA = RECORRIDO;
let SALE_ALCALA = RECORRIDO + INV_ALCALA;
let LLEGA_PIO = SALE_ALCALA + RECORRIDO;
let LONGITUD = 71.6; // km de extremo a extremo
let KM_MIN = LONGITUD / RECORRIDO;

let CHAMARTIN = "Chamartín";
let ALCALA = "Alcalá de Henares"; // nombre del extremo alto
let PIO = "Príncipe Pío"; // nombre del extremo bajo
let T_CHAMARTIN = 41;
let PASOS = [
  { q: T_CHAMARTIN, cab: CHAMARTIN },
  { q: LLEGA_ALCALA, cab: ALCALA },
  { q: LLEGA_PIO - T_CHAMARTIN, cab: CHAMARTIN },
  { q: LLEGA_PIO, cab: PIO },
];

/* El turno elegido fija la ventana horaria. Se guardan como variables para
   que toda la simulación (relevos, parte final, entrada de personal) trabaje
   con las horas del turno en curso sin tener que arrastrarlas por todas
   las funciones.                                                          */
let INICIO = 6 * 60;
let FIN = 14 * 60;
let TURNO_ID = "manana";

/* Cambia la línea con la que trabaja el motor. Recalcula todo lo que se deriva
   de su infraestructura: índices, fases del ciclo, pesos de demanda y puntos
   de paso. Se llama antes de procesar cada línea.                      */
/* Maquinistas de reserva de la RED, no de una línea. Están donde están, y
   acude a ellos cualquier línea que pase por esa estación: jugando solo la
   C-1, los cinco de Chamartín siguen ahí, porque no son de la C-7.

   De los que están en una estación por la que no pasa ninguna línea en juego
   se prescinde, porque no podrían llegar a ningún sitio.               */
const RESERVAS_RED = [
  ["Chamartín", 5],
  ["Alcalá de Henares", 1],
  ["Príncipe Pío", 1],
];

let RESERVAS = [];

/* ── convivencia de varias líneas ───────────────────────────────
   El estado del turno guarda por separado lo que pertenece a cada línea
   (trenes, personal, andenes, restricciones, material) de lo que es común
   (reloj, taller, libro, incidencias). El motor procesa una línea cada vez:
   entra en ella, hace su minuto y sale.

   Las líneas que se juegan salen de LINEAS_EN_JUEGO. Añadir la C-2 o la C-10
   el día de mañana será declararlas en LINEAS y añadirlas aquí.        */
const CAMPOS_LINEA = ["trenes", "personal", "andenes", "restricciones", "reserva", "apartado", "vacios", "estad", "averiasTurno", "cal"];

// se guarda en el estado el trozo que pertenece a la línea vigente
function guardarLinea(g, id) {
  if (!g.porLinea) g.porLinea = {};
  const trozo = {};
  for (const k of CAMPOS_LINEA) trozo[k] = g[k];
  g.porLinea[id] = trozo;
}

// se saca a primer plano el trozo de la línea pedida y se fijan sus constantes
function entrarLinea(g, id) {
  fijarLinea(id);
  const trozo = (g.porLinea && g.porLinea[id]) || {};
  for (const k of CAMPOS_LINEA) if (trozo[k] !== undefined) g[k] = trozo[k];
  g.linea = id;
}

/* Cambia la línea que se está mirando. No altera la simulación: solo saca a
   primer plano el estado de esa línea para que lo vean las pantallas.  */
function cambiarVista(g, id) {
  if (!g || !g.porLinea || !g.porLinea[id]) return g;
  const n = clonar(g);
  guardarLinea(n, n.linea || LINEAS_EN_JUEGO[0]);
  entrarLinea(n, id);
  return n;
}

function fijarLinea(id) {
  const L = LINEAS[id] || LINEAS["C-7"];
  LINEA = L.id;
  ESTACIONES = L.estaciones;
  N = ESTACIONES.length;
  RECORRIDO = L.recorrido;
  INV_ALCALA = L.invA;
  INV_PIO = L.invB;
  INTERVALO = L.intervalo;
  LONGITUD = L.longitud;
  CICLO = RECORRIDO * 2 + INV_ALCALA + INV_PIO;
  CIRCULACIONES = Math.round(CICLO / INTERVALO);
  LLEGA_ALCALA = RECORRIDO;
  SALE_ALCALA = RECORRIDO + INV_ALCALA;
  LLEGA_PIO = SALE_ALCALA + RECORRIDO;
  KM_MIN = LONGITUD / RECORRIDO;

  // los extremos se leen del propio catálogo: cada línea tiene los suyos
  PIO = ESTACIONES[0].n;
  ALCALA = ESTACIONES[N - 1].n;
  IDX_PIO = 0;
  IDX_ALCALA = N - 1;
  const iCh = ESTACIONES.findIndex((e) => e.n === "Chamartín");
  IDX_CHAMARTIN = iCh >= 0 ? iCh : 0;
  CHAMARTIN = ESTACIONES[IDX_CHAMARTIN].n;
  T_CHAMARTIN = ESTACIONES[IDX_CHAMARTIN].t;
  IDX_ROZAS = ESTACIONES.findIndex((e) => e.n === "Las Rozas");
  IDX_PITIS = ESTACIONES.findIndex((e) => e.n === "Pitis");
  IDX_VICALVARO = ESTACIONES.findIndex((e) => e.n === "Vicálvaro");

  PASOS = [
    { q: T_CHAMARTIN, cab: CHAMARTIN },
    { q: LLEGA_ALCALA, cab: ALCALA },
    { q: LLEGA_PIO - T_CHAMARTIN, cab: CHAMARTIN },
    { q: CICLO, cab: PIO },
  ];

  CENTRO = Math.round(RECORRIDO / 2);
  CENTRALIDAD = ESTACIONES.map((e) => 1 - Math.abs(e.t - CENTRO) / Math.max(CENTRO, RECORRIDO - CENTRO));
  PESO = ESTACIONES.map((e) => (e.puesto ? 0 : PESO_ESC[e.esc] || 4));
  CORRESPONDENCIA = ESTACIONES.map((e) => {
    if (e.puesto) return 1;
    return Math.min(TOPE_CORR, 1 + (e.c || []).length * PESO_CER + (e.metro ? PESO_METRO : 0));
  });

  /* Reservas donde de verdad puede relevarse esta línea: sus dos extremos, y
     Chamartín aparte si es una parada intermedia.                      */
  const defBandas = L.bandas || [];
  BANDAS = Object.fromEntries(
    defBandas.map((b) => [ESTACIONES.findIndex((e) => e.n === b.antesDe), { n: b.n, d: b.d }]).filter(([k]) => k >= 0)
  );

  DATOS_DIR = {
    pio: { sentido: L.siglaBaja || "PP", paridad: "impares" },
    alcala: { sentido: L.siglaAlta || "AH", paridad: "pares" },
  };
  SIN_GENERALES = [...new Set([IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA])];
  CON_SERVICIO = ESTACIONES.filter((e) => !e.puesto).length;

  DESFASE = L.desfase || 0;
  VIAJEROS_DIA = L.viajerosDia || 150000;
  VIAJEROS_MIN_100 = VIAJEROS_DIA / HORAS_INTENSIDAD / 60;

  SERIE_TREN = L.serie || 21800;
  SERIE_VACIO = L.serieVacio || 37200;

  CABECERAS_REP = [...new Set([IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA])].filter((i) => ESTACIONES[i]);
  KM_TURNO = Math.round(((LONGITUD / RECORRIDO) * (FIN - INICIO)) / 10) * 10;

  APART_INICIAL = [...new Set([IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA])].filter((i) => ESTACIONES[i] && ESTACIONES[i].apartVias);

  /* Las reservas de la RED que caen en estaciones de esta línea. Se dan de
     alta con la primera línea que las alcance y pasan a la bolsa común del
     turno, así que jugar solo la C-1 no deja al puesto sin nadie.      */
  RESERVAS = RESERVAS_RED.filter(([donde]) => ESTACIONES.some((e) => e.n === donde));
}

function fijarTurno(id) {
  const t = TURNOS.find((x) => x.id === id) || TURNOS[0];
  TURNO_ID = t.id;
  INICIO = t.ini;
  FIN = t.fin;
  // depende de la duración del turno y del recorrido de la línea
  KM_TURNO = Math.round(((LONGITUD / RECORRIDO) * (FIN - INICIO)) / 10) * 10;
}
let KM_TURNO = Math.round(((LONGITUD / RECORRIDO) * (FIN - INICIO)) / 10) * 10; // km que recorre una unidad en el turno
let CIRCULACIONES = CICLO / INTERVALO; // 13 trenes simultáneos

/* ── catálogo de material · serie 446 ───────────────────────── */

const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const DEPOSITOS = {
  // fuera = parte del parque del depósito que ese día presta servicio en otras líneas
  Humanes: { color: "#0E7A50", c7: true, fuera: 0.88, nota: "cesión por necesidades del servicio" },
  Fuencarral: { color: "#004B93", c7: true, fuera: 0 },
  "Cerro Negro": { color: "#D98200", c7: true, fuera: 0 },
  Atocha: { color: "#7B2E8E", c7: true, fuera: 0 },
};

const FLOTA_446 = {
  Humanes: [...[1, 3, 5, 7, 9, 11, 13, 15], ...rango(101, 170)],
  Fuencarral: [17, 19, 23, 25, 27, 33, 37, 39, 41, 43, 51, 57, 63, 71, 79, 85, 87, 91, 93, 95, 97, 99],
  "Cerro Negro": [49, 53, 55, 59, 61, 65, 67, 69, 73, 75, 77, 81, 83],
};

// 110 unidades Civia repartidas entre los depósitos de Atocha y Cerro Negro
const CIVIA_CERRO = rango(83, 112).filter((n) => n !== 104 && n !== 106);
const FLOTA_465 = {
  "Cerro Negro": CIVIA_CERRO,
  Atocha: [...rango(1, 29), ...rango(31, 43), ...rango(45, 112)].filter((n) => !CIVIA_CERRO.includes(n)),
};

// 15 ramas de doble piso, todas con depósito en Fuencarral
const FLOTA_450 = [1, 2, 5, 7, 10, 11, 12, 13, 14, 17, 18, 19, 21, 22, 23];

const SERIES = {
  446: { plazas: 620, coches: 3, doble: true, desc: "convencional", catalogada: true, potencia: 1160, vmax: 100, anios: [1989, 1993] },
  465: { plazas: 780, coches: 5, doble: true, desc: "Civia", catalogada: true, potencia: 2000, vmax: 120, anios: [2004, 2008] },
  450: { plazas: 1500, coches: 6, doble: false, desc: "doble piso", catalogada: true, potencia: 2400, vmax: 140, anios: [1994, 1996] },
};

const lote446 = (n) => (n <= 15 ? "Primer lote" : n <= 99 ? "Segundo lote" : "Tercer lote");
const bloque465 = (n) => (n <= 29 ? "1.er bloque" : n <= 43 ? "2.º bloque" : "3.er bloque");
const loteDe = (n, serie) => (serie === "446" ? lote446(n) : serie === "465" ? bloque465(n) : "Doble piso");

function h(n, s) {
  const x = Math.abs(Math.sin(n * 12.9898 + s * 78.233) * 43758.5453);
  return x - Math.floor(x);
}

/* ── desgaste y fiabilidad ──────────────────────────────────────
   El desgaste va de 0 (recién salida de taller) a 100 (agotada) y
   sube con los kilómetros. La fiabilidad se deriva de él: del 99 %
   con la unidad nueva al 85 % con el ciclo agotado.               */

const DESGASTE_MAX = 100;

/* Talleres del núcleo. La capacidad está pensada para las nueve líneas, no
   solo para la C-7: sostiene unas 184 unidades en servicio diario, el 77 %
   del parque. Mientras el resto de líneas no sean jugables, su ocupación se
   simula como si otro gestor las estuviera llevando.                       */
const TALLERES = {
  Humanes: { plazas: 12, series: ["446"], cab: PIO },
  Atocha: { plazas: 12, series: ["465"], cab: CHAMARTIN },
  Fuencarral: { plazas: 10, series: ["446", "450"], cab: CHAMARTIN },
  "Cerro Negro": { plazas: 10, series: ["446", "465"], cab: CHAMARTIN },
  // base de mantenimiento sin flota adscrita: no hace revisiones generales,
  // pero sus dos plazas están siempre a disposición de la línea
  "Príncipe Pío": { plazas: 2, series: ["446"], soloReparacion: true, propioC7: true, cab: PIO },
};

/* Ocupación que dejan las demás líneas: proporcional al parque de cada
   taller que no está a disposición de la C-7, con variación por turno.
   Cuando esas líneas sean jugables, esto se sustituye por unidades reales. */
/* Una unidad puede mantenerse en CUALQUIER taller que trabaje su serie, no
   solo en el suyo. Por tanto la presión de las demás líneas no se reparte por
   depósito de adscripción sino por serie: se compara la demanda ajena de cada
   serie con todas las plazas capaces de atenderla.                          */
const capacidadSerie = (serie) =>
  Object.values(TALLERES).reduce((n, t) => n + (t.series.includes(serie) ? t.plazas : 0), 0);

function presionSerie(serie) {
  const flota = CATALOGO.filter((u) => u.serie === serie).length;
  const propias = CATALOGO.filter((u) => u.serie === serie && !u.otraLinea).length;
  const enServicioAjeno = (flota - propias) * 0.8;
  const demanda = (enServicioAjeno / 12) * REVISIONES.general.turnos;
  const cap = capacidadSerie(serie);
  return cap ? demanda / cap : 0;
}

function ocupacionAjena(dep, semilla = 0) {
  const t = TALLERES[dep];
  if (t.propioC7) return 0; // base de Príncipe Pío: reservada a la C-7
  const capT = t.series.reduce((n, se) => n + capacidadSerie(se), 0);
  const dem = t.series.reduce((n, se) => n + presionSerie(se) * capacidadSerie(se), 0);
  const p = capT ? dem / capT : 0;
  const variacion = Math.round(h(semilla + dep.length * 37, 9) * 3) - 1;
  return Math.max(0, Math.min(t.plazas, Math.round(t.plazas * p) + variacion));
}
// desgaste vigente de una unidad: el del tren si circula, si no el del juego
function desgasteDe(g, id) {
  for (const t of g.trenes) {
    const u = t.unidades.find((x) => x.id === id);
    if (u) return u.desgaste;
  }
  if (g.desg[id] !== undefined) return g.desg[id];
  const c = CATALOGO.find((u) => u.id === id);
  return c ? c.desgaste : 0;
}

// plazas de un taller y cómo están repartidas
function plazasTaller(g, dep, semilla = 0) {
  const t = TALLERES[dep];
  const ajenas = ocupacionAjena(dep, semilla);
  const propias = Object.values(g.taller).filter((x) => x.dep === dep).length;
  return { plazas: t.plazas, ajenas, propias, libres: Math.max(0, t.plazas - ajenas - propias) };
}

// talleres que pueden admitir una unidad concreta
// cualquier taller que trabaje esa serie, el propio primero y luego por hueco
function talleresPara(g, u, semilla = 0) {
  return Object.keys(TALLERES)
    .filter((dep) => TALLERES[dep].series.includes(u.serie))
    .map((dep) => ({ dep, propio: dep === u.deposito, ...plazasTaller(g, dep, semilla) }))
    .sort((a2, b2) => b2.propio - a2.propio || b2.libres - a2.libres);
}

const REVISIONES = {
  ligera: { n: "Revisión ligera", quita: 25, turnos: 1, coste: 4200 },
  general: { n: "Revisión general", quita: DESGASTE_MAX, turnos: 3, coste: 14000 },
  reparacion: { n: "Reparación de avería", quita: 15, turnos: 2, coste: 9500 },
};
const tasaDesgaste = (u) => (u.serie === "465" ? 2 : u.serie === "446" && u.reformada ? 2.5 : 3); // puntos por 100 km
const fiabDesgaste = (d) => Math.round((0.99 - 0.0014 * Math.min(DESGASTE_MAX, d)) * 1000) / 1000;
const desgastePorTurno = (u) => (tasaDesgaste(u) * KM_TURNO) / 100;
const turnosRestantes = (u) => Math.max(0, (DESGASTE_MAX - u.desgaste) / desgastePorTurno(u));

function perfilUnidad(num, serie, deposito) {
  const s =
    serie === "446"
      ? { kmBase: 2_150_000, kmVar: 1_450_000, fiabBase: 0.972, caida: 0.045, taller: 0.11, fuera: 0 }
      : serie === "465"
      ? { kmBase: 380_000, kmVar: 1_150_000, fiabBase: 0.988, caida: 0.03, taller: 0.07, fuera: 0.7 }
      : { kmBase: 1_500_000, kmVar: 1_000_000, fiabBase: 0.965, caida: 0.035, taller: 0.09, fuera: 0.5 };
  const semilla = serie === "446" ? num : serie === "465" ? num + 500 : num + 900;
  const fueraDe = Math.max(s.fuera, DEPOSITOS[deposito].fuera || 0);
  const km = Math.round(s.kmBase + h(semilla, 1) * s.kmVar);
  const reformada = serie === "446" && h(semilla, 3) > 0.42;
  // desgaste inicial: dónde está cada unidad dentro de su ciclo de revisión
  const desgaste = Math.round(h(semilla, 6) * 92);
  const rango = SERIES[serie].anios;
  const listaSerie = serie === "446" ? [1, 170] : serie === "465" ? [1, 112] : [1, 23];
  const frac = (num - listaSerie[0]) / Math.max(1, listaSerie[1] - listaSerie[0]);
  const anio = Math.round(rango[0] + frac * (rango[1] - rango[0]));
  return {
    id: `${serie}-${String(num).padStart(3, "0")}`,
    anio,
    potencia: SERIES[serie].potencia,
    vmax: SERIES[serie].vmax,
    coches: SERIES[serie].coches,
    num,
    serie,
    deposito,
    lote: loteDe(num, serie),
    plazas: SERIES[serie].plazas,
    km,
    reformada,
    desgaste,
    fiab: fiabDesgaste(desgaste),
    enTaller: h(semilla, 4) < s.taller,
    // parte del parque presta servicio en otras líneas del núcleo
    otraLinea: h(semilla, 5) < fueraDe,
    vencida: false,
  };
}

const CATALOGO = [
  ...Object.entries(FLOTA_446).flatMap(([dep, nums]) => nums.map((n) => perfilUnidad(n, "446", dep))),
  ...Object.entries(FLOTA_465).flatMap(([dep, nums]) => nums.map((n) => perfilUnidad(n, "465", dep))),
  ...FLOTA_450.map((n) => perfilUnidad(n, "450", "Fuencarral")),
];

const DISPONIBLES_C7 = CATALOGO.filter((u) => DEPOSITOS[u.deposito].c7 && !u.otraLinea);
/* Una unidad circula sola cuando es de doble piso o cuando la línea no admite
   acoplamiento: la C-1 se cubre con un Civia por circulación.          */
/* Una unidad circula sola cuando es de doble piso o cuando la línea no admite
   acoplamiento. La línea se puede pasar como argumento: al comprobar varias a
   la vez no vale mirar cuál está fijada, porque entonces se juzgan todas con
   las reglas de una sola.                                              */
const esSimple = (id, idLinea) => {
  if (!id) return false;
  // si el identificador no corresponde a ninguna línea, manda la vigente
  const L = LINEAS[idLinea] || LINEAS[LINEA] || {};
  if (!L.dobles) return true;
  return CATALOGO.find((u) => u.id === id).serie === "450";
};
const slotCompleto = (par, idLinea) => (par[0] ? (esSimple(par[0], idLinea) ? !par[1] : !!par[1]) : false);
const LIBRES_C7 = DISPONIBLES_C7.filter((u) => !u.enTaller);

/* ── reacciones de los viajeros ─────────────────────────────────
   Lo que la gente publica mencionando a la cuenta de la operadora. No es
   decoración: es la única forma de que la calidad del servicio se note como
   algo que sufre alguien, y no como un número que baja.

   Los mensajes los genera el MOTOR en el minuto en que pasa algo, no la
   pantalla: si los generara al dibujar, cambiarían en cada refresco y se
   perderían al guardar la partida.                                     */

const PILA_USUARIO = [
  "Ana", "Marta", "Laura", "Carmen", "Elena", "Lucía", "Sara", "Cristina", "Patricia", "Raquel",
  "Javier", "Sergio", "Alberto", "Rubén", "Iván", "Óscar", "Dani", "Pablo", "Jorge", "Álvaro",
  "Miguel", "Nacho", "Fran", "Rocío", "Paula", "Irene", "Alba", "Nerea", "Andrea", "Silvia",
  "Adrián", "Héctor", "Guille", "Toni", "Bea", "Noelia", "Vanessa", "Mónica", "Estefanía", "Jose",
  "Manu", "Rafa", "Borja", "Gonzalo", "Marcos", "Diego", "Hugo", "Aitor", "Unai", "Samuel",
  "Natalia", "Verónica", "Lorena", "Tamara", "Yolanda", "Inma", "Pilar", "Rosa", "Susana", "Amaia",
  "Chema", "Quique", "Lolo", "Kiko", "Nando", "Santi", "Edu", "Luismi", "Juanjo", "Paco",
  "Miriam", "Bárbara", "Clara", "Ángela", "Celia", "Marina", "Judith", "Ainhoa", "Leire", "Olga",
  "Ismael", "Yeray", "Cristian", "Jonathan", "Sebas", "Ricardo", "Emilio", "Julián", "Salva", "Tito",
];

const APODOS = [
  "elpuntual", "mad", "_", "rrhh", "dice", "oficial", "real", "vlc", "87", "92", "malasaña",
  "vallecas", "opina", "escribe", "aqui", "otravez", "cansado", "runner", "madridista", "atleti",
  "profe", "enfermera", "dev", "arq", "gatoloco", "cafeina", "sinfiltro", "9", "23", "hoy",
  "mad_", "tren", "andenes", "cercanias", "abonado", "usuario", "sufrido", "resignado", "harto",
  "77", "81", "95", "01", "_real", "_mad", "xx", "zzz", "oficial_", "eldeverdad", "otro",
  "coslada", "alcala", "pinto", "getafe", "leganes", "torrejon", "aravaca", "pozuelo",
  "opinaydice", "nosecalla", "delotro", "porlamanana", "denoche", "conprisa", "sinprisa",
  "fotografo", "musico", "opositor", "autonomo", "teletrabajo", "turnodenoche", "abonotransporte",
  "bcn", "vigo", "sevilla", "curro", "oficina", "campus", "uni", "erasmus", "papa", "mama",
];

const APELLIDO_USER = [
  "Gómez", "Ruiz", "Molina", "Cano", "Pardo", "Herrera", "Nieto", "Bravo", "Vega", "Ferrer",
  "Rojas", "Cuesta", "Prieto", "Lara", "Aguilar", "Benítez", "Caballero", "Duarte", "Esteban",
  "Fuentes", "Gallardo", "Hidalgo", "Izquierdo", "Jurado", "Lozano", "Marín", "Navarro", "Olmedo",
  "Peña", "Quirós", "Rivas", "Sanz", "Tejada", "Ureña", "Valero", "Zamorano", "Arias", "Bermejo",
  "Crespo", "Delgado", "Escudero", "Figueroa", "Garrido", "Hurtado", "Ibáñez", "Jiménez", "Leal",
];




/* Avatar: iniciales sobre un color estable, deducido del propio nombre. Con
   una paleta corta se repiten colores, que es lo que pasa en la realidad. */
const COLOR_AVATAR = ["#8E5B9F", "#2E7D8A", "#B5643C", "#4A6FA5", "#6B8E3D", "#A34A5E", "#3F7D5A", "#7A5C3E", "#5D5FA3", "#9A6B2F"];

/* Plantillas por MOTIVO y por tono. Las variables se sustituyen al generar:
   {L} línea · {E} estación · {M} minutos · {H} hora · {T} tren · {D} destino.
   Hacen falta muchas por motivo, porque un turno genera cientos de mensajes y
   la repetición se nota enseguida.                                      */
const REACCIONES = {
  retraso: [
    "El {T} lleva {M} minutos y el panel sigue diciendo \"próxima llegada\". Próxima cuándo",
    "{M} minutos. Empiezo a pensar que el horario es una sugerencia",
    "Segunda semana seguida llegando tarde por culpa del {T}",
    "En {E} llevamos {M} minutos y ha pasado un tren de largo sin parar. Toma ya",
    "El {T} lleva {M} minutos. He hecho la compra mental entera esperando",
    "Mi jefe ya no se cree que sea el tren. Y sin embargo son {M} minutos otra vez",
    "Han anunciado 5 minutos de retraso. Llevamos {M}. Redondead mejor",
    "Otra vez parados en {E}. {M} minutos ya. Alguien piensa dar una explicación o nos enteramos por el boca a boca",
    "{M} minutos de retraso en {L}. Todos los días lo mismo, ya ni me molesto en calcular",
    "@CercaniasMadrid llevo {M} minutos en {E} sin información ninguna. Un poquito de respeto a la gente que madruga",
    "Qué manía con que los horarios sean orientativos en {L}",
    "Menos mal que salí con margen. {M} minutos tirados en {E} @CercaniasMadrid",
    "{L} otra vez de retraso. A este paso llego ayer",
    "Parados en {E} desde hace {M} minutos y el maquinista tan callado como nosotros",
    "Si llego tarde otra vez me despiden, pero eso a {L} le da igual",
    "Vaya servicio de {L}, {M} minutos y sin un solo aviso por megafonía",
    "@CercaniasMadrid alguien puede explicar por qué llevamos {M} minutos detenidos en {E}",
    "{M} minutos. {M}. Y el cartel sigue diciendo que viene a su hora",
    "Yo pago un abono para esto. {M} minutos parada en {E}",
    "El tren de {L} lleva {M} minutos de retraso y en el panel pone que está al llegar. Cachondeo",
    "Cada mañana la misma tortura con {L}",
    "{M} minutos esperando en {E}. Me da tiempo a echar la siesta",
    "Lo de {L} ya no es retraso, es una forma de vida",
    "Buenos días, {M} minutos de retraso, como siempre. Un saludo",
    "En {E} llevamos {M} minutos. Ni un aviso, ni una disculpa, nada",
    "Otro día que llego tarde por culpa de {L}. Van tres esta semana",
    "El {T} lleva {M} minutos de retraso y nadie da explicaciones",
    "Alguien sabe qué le pasa al {T}. Llevamos {M} minutos parados en {E}",
    "{M} minutos el {T} con destino {D}. Y sin una sola disculpa",
    "Voy en el {T} y esto no avanza. {M} minutos desde {E}",
    "El {T} de las {H} otra vez tarde. Es que es SIEMPRE el mismo",
    "Si cogéis el {T} hoy, id con tiempo. {M} minutos lleva",
    "Parados en {E}. El {T}, dirección {D}. {M} minutos. Sin megafonía",
    "Llevo desde {E} en el {T} y no hemos avanzado nada en {M} minutos",
    "{M} minutos parados y la gente empezando a ponerse nerviosa en {E}",
  ],
  aglomeracion: [
    "Imposible subir al {T} en {E}. Y el siguiente en veinte minutos",
    "Van tres trenes que no puedo coger en {E}. Voy a llegar tardísimo",
    "El {T} sale de {E} con las puertas rozando a la gente. Un día pasa algo",
    "Esto no es un servicio de cercanías, es una lata. {T} desde {E}",
    "Vamos tan apretados en el {T} que no puedo ni sacar el móvil del bolsillo",
    "Andén de {E} desbordado. Hay gente al filo de la vía por falta de sitio",
    "Imposible subir en {E}. Van dos trenes que me dejan tirado",
    "Vamos como sardinas en {L}. Esto no puede ser legal",
    "En {E} se ha quedado media estación sin poder subir",
    "No cabe un alfiler en el tren de {L}. Y encima con este calor",
    "He dejado pasar dos trenes en {E} porque venían reventados",
    "{L} a las {H} es una lata de conservas con ruedas",
    "Andén de {E} lleno hasta arriba y el tren viene sin sitio. Genial",
    "@CercaniasMadrid habéis viajado alguna vez en vuestro propio tren a las {H}",
    "Tercer tren que no puedo coger en {E}. Voy a llegar para la cena",
    "Esto no es un tren, es una jaula. {L} a tope otra vez",
    "En {E} la gente empuja para entrar. Un día habrá un disgusto",
    "Vaya aglomeración en {E}. Y dicen que refuerzan el servicio",
    "No me cabe ni el bolso en el tren de {L}",
    "El {T} viene lleno desde {E}. Imposible subir",
    "Van cuatro tirando de la puerta del {T} en {E} para poder entrar",
    "El {T} hacia {D} sale de {E} con gente pegada a los cristales",
    "He conseguido meterme en el {T} de milagro. Va reventado",
    "Se me han quedado dos personas en la puerta sin poder entrar en {E}",
  ],
  supresion: [
    "Suprimido el {T}. Y el siguiente en media hora. A ver cómo llego yo ahora",
    "Han cancelado el tren cuando ya estábamos todos en el andén de {E}. Sin más explicación",
    "Suprimen el {T} y meten a toda esa gente en el siguiente. Va a ir imposible",
    "Tercer tren suprimido esta semana en la {L}. Esto no es mala suerte, es dejadez",
    "Cancelado mi tren en {E}. Voy a llegar hora y media tarde al trabajo",
    "Suprimir un tren en hora punta es de una insensibilidad tremenda",
    "Han suprimido el tren de {L} y aquí estamos, tirados en {E}",
    "Suprimen trenes como quien quita una parada de autobús. Muy bien @CercaniasMadrid",
    "Otro tren menos en {L}. Y los que quedan vendrán llenos, claro",
    "Me acaban de decir que mi tren no viene. Así, sin más. {L}",
    "Suprimido el de las {H}. Media hora más esperando en {E}",
    "¿Suprimir trenes en hora punta es la solución? Increíble lo de {L}",
    "Cancelado el tren de {E}. Ni un aviso hasta que ya estabas en el andén",
    "Un tren suprimido más. {L} batiendo su propio récord",
    "Y el tren que iba a coger, suprimido. Qué gran día",
  ],
  averia: [
    "El {T} averiado en {E} y el siguiente viene lleno. La pescadilla que se muerde la cola",
    "Otro tren roto en la {L}. Con la edad que tiene este material tampoco sorprende",
    "El {T} lleva toda la semana dando problemas. Cuándo lo mandáis al taller",
    "Avería en {E}. Llevamos {M} minutos y el maquinista ha bajado a mirar los bajos",
    "Se ha parado el {T} en seco en {E}. Luces fuera y silencio total",
    "Avería en el tren de {L}. Menuda sorpresa",
    "Vamos con una puerta precintada en {L}. Qué seguridad más grande",
    "El tren de {L} va renqueando. Como para fiarse",
    "Material viejo, averías cada dos por tres. Así va {L}",
    "Avería en {E} y todos a esperar. Lo de siempre",
    "Otro tren averiado en {L}. ¿Alguien revisa estos trenes alguna vez?",
    "Se ha estropeado el tren en {E}. Nos han hecho bajar a todos",
    "Llevamos parados por avería desde hace {M} minutos en {E}",
  ],
  calor: [
    "En el {T} no funciona el aire y va lleno. Hay gente mareándose de verdad",
    "37 grados fuera y el vagón sin aire. {L} señores, esto es peligroso",
    "Dos vagones del {T} sin climatización. La gente amontonada en los otros tres",
    "He tenido que bajarme en {E} porque no podía respirar dentro del tren",
    "Aire acondicionado en el {T}: cero. Ventanas: no abren. Genial",
    "Sin aire acondicionado en {L} y a {H}. Esto es inhumano",
    "El vagón de {L} es una sauna. No se puede respirar",
    "Aire acondicionado roto otra vez en {L}. Qué asco de viaje",
    "Vamos sudando como pollos en el tren de {L}",
    "Cero aire en el tren y la gente mareándose. Muy bien @CercaniasMadrid",
    "Hace más calor aquí dentro que en la calle. @CercaniasMadrid señores",
  ],
  transbordo: [
    "Nos hacen bajar en {E} y subir a otro tren que ya venía lleno. Un caos absoluto",
    "Transbordo en {E} sin megafonía, sin personal y sin saber a qué andén. Que cada uno se busque la vida",
    "Bajada obligatoria del {T} en {E}. Con la que está cayendo fuera además",
    "Me han hecho cambiar de tren dos veces en el mismo trayecto. Dos",
    "En {E} nos han bajado a todos y el tren se ha ido vacío. Alguien lo entiende",
    "Nos hacen transbordar en {E} con el tren hasta arriba. Un caos",
    "Transbordo forzoso en {E}. Nadie sabe a qué andén hay que ir",
    "Bajada obligatoria en {E} y a esperar otra vez. Gracias @CercaniasMadrid",
    "Nos echan del tren en {E} sin explicar nada",
  ],
  vialunica: [
    "Vía única en {E} y los trenes turnándose. {M} minutos parados esperando al de enfrente",
    "Circulando por la vía contraria en la {L}. Una experiencia",
    "Con una sola vía funcionando esto es un cuello de botella. {M} minutos ya",
    "Parados en {E} esperando a que pase el tren de enfrente. Esto es un apartadero de los años cincuenta",
    "Nos han mandado por la vía del otro sentido. Curioso pero muy lento",
    "Vía única en {L} y los trenes esperándose unos a otros. Para llorar",
    "Van por una sola vía en {L}. Esto va a ser eterno",
    "Nos han metido por la vía contraria. Curiosa experiencia en {L}",
    "Con un solo carril funcionando, {L} es un desastre asegurado",
  ],
  /* Motivos ligados a una incidencia concreta. Aquí el viajero cuenta lo que
     ve: el tren parado, los mecánicos, el transbordo, la megafonía. Es lo que
     hace que se note que está dentro de la misma avería que has provocado. */
  atls: [
    "Llevamos {M} minutos en el {T} parados en {E}. Nos han dicho que viene un técnico. Desde dónde, desde Cuenca",
    "El {T} muerto en {E}. Sin luces, sin aire y con las puertas cerradas. Esto es ilegal",
    "Han venido dos operarios a mirar el {T} y llevan veinte minutos con un manual en la mano",
    "Seguimos tirados en {E}. Ya hay gente que se ha bajado a la vía, con lo peligroso que es",
    "El {T} sin moverse desde hace {M} minutos y la megafonía repitiendo que disculpemos las molestias",
    "El {T} lleva parado en {E} desde hace {M} minutos esperando a unos mecánicos. Estamos dentro, sin aire y sin información",
    "Nos han dicho que vienen los técnicos a arreglar el tren. En {E}. A las {H}. Perfecto",
    "{M} minutos encerrados en el {T} en {E} esperando a que venga alguien a mirarlo",
    "Han bajado el maquinista a mirar los bajos del tren en {E}. Esto pinta largo",
    "El {T} averiado en plena vía y nosotros dentro. Llevamos {M} minutos, @CercaniasMadrid",
    "Estamos parados entre estaciones. Nadie dice nada. El {T}, por si a alguien le interesa",
    "Aquí seguimos en el {T}, en {E}, esperando a los de mantenimiento. {M} minutos ya",
    "Avería del {T} en {E}. Han venido los técnicos y siguen ahí mirándolo. Genial",
  ],
  rescate: [
    "Han mandado un tren a rescatarnos. A rescatarnos. En {E}. Año 2025",
    "Nos han evacuado del {T} en {E} y hemos tenido que caminar por el andén hasta el otro tren",
    "El {T} se ha quedado sin fuerza en {E} y viene otro a empujarlo. Increíble",
    "Una hora en {E} esperando al tren de socorro. Con niños y con maletas",
    "Nos han hecho bajar del {T} en {E} y esperar a otro tren. Con dos maletas y un niño",
    "El {T} se ha quedado tirado y van a mandar otro a recogernos. {M} minutos aquí de pie",
    "Transbordo de urgencia en {E}. El tren averiado ahí parado y todos apretados en el andén",
    "Vienen a remolcar el {T}. Sí, a remolcarlo. En {E}. Esto es el primer mundo",
    "Nos han evacuado el tren en {E}. Una hora de mi vida que no vuelve",
    "El {T} no se mueve y han mandado otro tren a por nosotros. Menudo espectáculo en {E}",
  ],
  catenaria: [
    "Otra vez la catenaria en {E}. Tercera vez este mes. Alguien va a revisar esos cables algún día",
    "Nos han cortado la corriente en {E}. Sin luz, sin aire, y la gente empezando a agobiarse dentro",
    "Han saltado chispas del pantógrafo en {E} y ha sido bajar todos corriendo. Menudo susto",
    "Llevamos {M} minutos a oscuras en el {T} por lo de la catenaria. Esto no es normal",
    "Se ha caído el cable en {E}. Con decir que ha venido hasta la policía",
    "Lo de la catenaria en {E} va para largo. Ya nos han dicho que cojamos alternativa. Cuál, si puede saberse",
    "Tres horas va a durar lo de la catenaria según megafonía. Tres horas. En {E}",
    "Enganchón de catenaria en {E}. Los cables por el suelo y los trenes parados",
    "Han tocado la catenaria en {E} y esto está muerto. {M} minutos sin moverse",
    "Todo parado por lo de la catenaria en {E}. Nadie sabe cuánto va a durar",
    "El pantógrafo del {T} ha enganchado el cable en {E}. Ahí se acabó la mañana",
  ],
  puertas: [
    "El {T} parando en cada estación dos minutos porque una puerta no cierra. Así hasta {D}",
    "Nos han bajado del {T} en {E} porque una puerta se ha quedado abierta en marcha. En marcha",
    "Puerta bloqueada en el {T} y la gente saliendo por donde puede. Un día habrá un accidente",
    "El maquinista lleva tres paradas peleándose con una puerta del {T}. Paciencia le doy",
    "Una puerta del {T} abriéndose sola entre {E} y la siguiente. Normal todo",
    "Cómo puede ser que un tren salga de cabecera con una puerta averiada. Explicadmelo",
    "El {T} va con una puerta precintada. En hora punta. Muy seguro todo",
    "Una puerta del {T} no abre en {E} y la gente empujando para salir por la de al lado",
    "Llevamos parados en cada estación porque una puerta del {T} no cierra bien",
    "Puerta averiada en el {T}. Un minuto extra en cada parada. Multiplícalo",
  ],
  freno: [
    "Frenazo brutal del {T} llegando a {E}. Media gente por el suelo y ni una disculpa por megafonía",
    "El {T} va a 40 por hora por un problema de frenos. Vamos a llegar de noche",
    "Nos han parado en {E} por un problema de frenos y llevamos {M} minutos sin saber nada",
    "El {T} ha frenado de golpe en {E}. Una señora se ha dado un buen golpe. Vergonzoso",
    "Marcha limitada en el {T} por los frenos. {M} minutos de retraso y subiendo",
    "Si el tren no frena bien, qué hace circulando con gente dentro. Es lo que me pregunto",
    "El {T} va despacísimo por un problema de frenos. Llegaremos para la hora de comer",
    "Parada de urgencia del {T} en {E}. Menudo frenazo, se ha caído gente",
    "Problema de frenos en el {T} y marcha limitada. Así hasta {D}",
  ],
  ltv: [
    "Limitación de velocidad indefinida entre {E} y {D}. Lo de indefinida asusta",
    "Vamos a paso de hombre desde {E}. Llevo {M} minutos de retraso y no ha pasado nada",
    "Otra limitación temporal que lleva puesta desde hace meses. De temporal nada",
    "El {T} arrastrándose por la vía. Si vamos a ir así, ponedlo en el horario y ya",
    "Limitación en {E} y nadie explica por qué. {M} minutos perdidos",
    "Limitación de velocidad en {E}. Vamos a paso de peatón y {M} minutos tarde",
    "Otra limitación temporal en la vía de la C-7. Como si no fuéramos ya justos",
    "El tren reptando por {E} por una limitación. {M} minutos perdidos",
  ],

  /* Mensajes dirigidos a la cuenta oficial. Es el registro en que la gente
     interpela directamente: unos piden explicaciones, otros ironizan y algunos
     ya solo escriben por desahogarse.                                   */
  mencion: [
    "@CercaniasMadrid me podéis explicar qué hace el {T} veinte minutos parado en {E} sin que nadie diga ni mu",
    "@CercaniasMadrid vuestro panel dice que el tren viene en 2 minutos. Lleva diciéndolo {M} minutos. Es un panel o un adorno",
    "@CercaniasMadrid llevo {M} minutos en el andén de {E}. He visto pasar tres trenes de otra línea. Tres",
    "@CercaniasMadrid no sé quién diseñó el horario de {L} pero desde luego no lo coge",
    "@CercaniasMadrid en serio, {M} minutos. Tengo una reunión a las {H} y os la voy a facturar",
    "@CercaniasMadrid el {T} va tan lleno que he viajado sin tocar el suelo. Ahorro en gimnasio, eso sí",
    "@CercaniasMadrid una preguntita: para qué sirve la megafonía si nunca la usáis. Curiosidad desde {E}",
    "@CercaniasMadrid os lo digo en serio, esto no puede seguir así. {M} minutos otra vez y ni una explicación",
    "@CercaniasMadrid estoy en {E}, son las {H}, y mi tren no aparece. Ni en el panel ni en la vida real",
    "@CercaniasMadrid vuestro tren me ha dejado tirado en {E} y he tenido que coger un taxi. Os paso el recibo",
    "@CercaniasMadrid llevo pagando el abono desde hace diez años para esto. Una vergüenza lo del {T} hoy",
    "@CercaniasMadrid si al menos avisarais. Uno se organiza. Pero así no hay manera. {M} minutos en {E}",
    "@CercaniasMadrid he perdido la conexión por vuestra culpa. {M} minutos de retraso. Contentos",
    "@CercaniasMadrid propuesta: poner un cartel en {E} que diga \"suerte\". Sería más honesto que el panel",
    "@CercaniasMadrid mi hija llega tarde al colegio por tercera vez este mes. Y no por mi culpa precisamente",
    "@CercaniasMadrid vais a decir algo o nos quedamos todos aquí en {E} mirándonos las caras",
    "@CercaniasMadrid con lo que cuesta el abono transporte, lo mínimo sería que el {T} llegase. Digo yo",
    "@CercaniasMadrid he desayunado, he leído el periódico y sigo en {E}. Buenos días",
    "@CercaniasMadrid es que da igual la hora, da igual el día. Siempre igual con {L}",
    "@CercaniasMadrid {M} minutos parados y el maquinista tan perdido como nosotros. Informad a vuestra gente al menos",
  ],

  bien: [
    "Hay que decirlo: lo de {E} lo han resuelto rápido y bien. Gracias",
    "Puntual el {T} hoy. Tomad nota, que también hay que decir lo bueno",
    "El maquinista del {T} informando por megafonía cada cinco minutos. Eso es",
    "Se agradece la información de hoy en {E}. Poco pero clara",
    "Reconozco que han sacado el servicio adelante mejor de lo que pintaba",
    "Pues hoy el tren de {L} ha llegado puntual. Se agradece",
    "Rápidos resolviendo lo de {E}. Bien ahí",
    "Sin incidencias en {L} esta mañana. Milagro",
    "Hoy sí, {L} funcionando como debe. Ojalá siempre",
    "Buena información por megafonía en {E}. Poco pero se agradece, @CercaniasMadrid",
    "Han resuelto lo de {E} más rápido de lo que esperaba. Gracias @CercaniasMadrid",
  ],
  duro: [
    "Vergüenza de servicio el de {L}. Así, con todas las letras",
    "Lo de {L} es un escándalo y nadie hace nada",
    "Que devuelvan el dinero del abono. {L} es una estafa",
    "Cada día odio más tener que depender de {L}",
    "@CercaniasMadrid dimisión de quien sea que gestione esto, por favor",
    "Es que da igual lo que pase, {L} siempre lo hace peor",
    "Llevo quince años cogiendo {L} y cada año va a peor",
    "Estoy hasta las narices de {L}. Y de las excusas",
    "Un desastre absoluto. {M} minutos y sin información. {L}",
    "@CercaniasMadrid que alguien se haga responsable de esto de una vez",
  ],
};

/* ── personal ───────────────────────────────────────────────── */

const APELLIDOS = [
  "Cañete", "Ferrer", "Quintero", "Bermúdez", "Ordóñez", "Ibáñez", "Salas", "Naranjo",
  "Aguilar", "Delgado", "Rueda", "Cortés", "Palomo", "Bravo", "Herranz", "Solís",
  "Aranda", "Vilches", "Merino", "Gálvez", "Escudero", "Lozano", "Maroto", "Berrocal",
  "Tejero", "Ávila", "Cuesta", "Nieto", "Peinado", "Zamora", "Valcárcel", "Solana",
  "Carrión", "Robledo", "Cifuentes", "Andrade",
];
const INICIALES = "ABCDEFGHIJLMNPRSTVZ";
const nombreDe = (k) => `${INICIALES[k % INICIALES.length]}. ${APELLIDOS[k % APELLIDOS.length]}`;

/* ── atributos del maquinista (0–100, aleatorios) ───────────────
   Puntualidad  100 → recupera 5 min cada 30 de viaje
                 50 → mantiene horario
                  0 → pierde 5 min cada 30 de viaje
   Conocimiento 100 → −30 % probabilidad de avería, −30 % consecuencias,
                       30 % de resolverla en marcha
                  0 → +15 % probabilidad, +20 % consecuencias, 0 % de resolver
   Profesionalidad: pendiente de mecánica                              */

const atributos = () => ({
  pun: Math.floor(Math.random() * 101),
  pro: Math.floor(Math.random() * 101),
  con: Math.floor(Math.random() * 101),
});

// minutos ganados (+) o perdidos (−) por minuto de viaje
const mediaAtrib = (m) => Math.round((m.pun + m.pro + m.con) / 3);
const derivaPorMin = (m) => (m ? ((m.pun - 50) / 50) * (5 / 30) : 0);
// multiplicadores de conocimiento
const factorAveria = (m) => (m ? 1.15 - 0.45 * (m.con / 100) : 1);
const factorConsec = (m) => (m ? 1.2 - 0.5 * (m.con / 100) : 1);
const probResolver = (m) => (m ? 0.3 * (m.con / 100) : 0);

const COND_MAX = 330;
const JORNADA_MAX = 540;
const DESCANSO = 45;
const MARGEN_CUADRO = 20;

/* ── utilidades ─────────────────────────────────────────────── */

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;
const dur = (m) => `${Math.floor(m / 60)}h${String(Math.floor(m % 60)).padStart(2, "0")}`;
const nf = (n) => Math.round(n).toLocaleString("es-ES");
const rt = (n) => Math.round(n); // retraso en minutos enteros para mostrar
const retTxt = (n) => (Math.round(n) <= 0 ? "a la hora" : `+${Math.round(n)}′`);

/* El motor suma retraso de golpe al cambiar de minuto, y como la posición es
   reloj − retraso, eso haría retroceder al tren un instante antes de avanzar.
   Para pintar se reparte ese incremento a lo largo del minuto, de modo que lo
   que se ve es un cambio de velocidad. Los saltos grandes (rotaciones,
   recuperación en cabecera) se aplican secos: ocurren con el tren parado.   */
function retrasoVis(t, g) {
  if (t.rAnt === undefined) return t.retraso;
  const d = t.retraso - t.rAnt;
  if (Math.abs(d) > 3) return t.retraso;
  const frac = Math.min(1, Math.max(0, g.reloj - g.ultimoMin));
  return t.rAnt + d * frac;
}
const situacionVis = (t, g) => situacion({ ...t, retraso: retrasoVis(t, g) }, g.reloj);
/* Contadores del turno. Van en una constante porque también hacen falta al
   recuperar una partida guardada: si el turno se grabó con una versión que no
   tenía alguno de estos campos, al sumarle un número daba "NaN" y el parte
   final aparecía con valores vacíos.

   Las medias se acumulan minuto a minuto. Las que se ven en la barra son la
   foto del instante: si al cerrar todo va bien, el parte diría que el turno
   fue bueno aunque a media mañana hubiera un caos.                       */
/* Cada cuántos minutos se anota la posición para el gráfico de marcha. Con
   uno por minuto las trece trazas ocupaban 84 KB en el guardado; cada dos
   minutos bastan para que la línea se lea igual de bien.                */
const PASO_TRAZA = 2;

/* Gravedad de una incidencia. Tres niveles, y no se inventa un color nuevo:
   el gris dice "esto se resuelve", el ámbar "esto afecta a la línea" y el rojo
   "esto corta el servicio", que es lo que esos colores ya significan en el
   resto del juego.                                                        */
/* La franja lleva texto blanco encima, y el ámbar del sistema no da contraste
   suficiente para eso (2,9:1). Cada grado tiene su tono de franja, algo más
   oscuro, y conserva el color del sistema para el borde.               */
const GRADOS = {
  leve: { n: "Incidencia leve", col: () => P.info, franja: () => P.info, peso: 700 },
  grave: { n: "Incidencia grave", col: () => P.warn, franja: () => "#A05F00", peso: 700 },
  critica: { n: "Incidencia crítica", col: () => P.alert, franja: () => P.alert, peso: 800 },
};

const KPI_INICIAL = {
  muestras: 0,
  puntuales: 0,
  coste: 0,
  afect: 0,
  sumaRetraso: 0,
  sumaOcup: 0,
  minutosOcup: 0,
  transportados: 0,
  picoRetraso: 0,
  horaPico: 0,
  minutosApuro: 0,
  calidad: 0, // penalizaciones de calidad percibida, aún sin usar
};

const margenDe = (m) => Math.min(COND_MAX - m.cond, JORNADA_MAX - m.jornada);
const fase = (t, reloj) => (((reloj - t.retraso - t.offset) % CICLO) + CICLO) % CICLO;
const plazasDe = (t) => t.unidades.reduce((s, u) => s + u.plazas, 0);
const fiabDe = (t) => (t.unidades.length ? t.unidades.reduce((s, u) => s + u.fiab, 0) / t.unidades.length : 1);

function idxDesdeTiempo(f) {
  for (let i = 0; i < N - 1; i++) {
    if (f >= ESTACIONES[i].t && f <= ESTACIONES[i + 1].t) return i + (f - ESTACIONES[i].t) / (ESTACIONES[i + 1].t - ESTACIONES[i].t);
  }
  return f <= 0 ? 0 : N - 1;
}

/* Retraso que se enseña y se mide. Un tren en maniobra de rotación acumulaba
   minutos contra su marcha antigua y llegaba a marcar más de dos horas antes
   de caer a cero de golpe: ni el número significaba nada ni tenía sentido que
   la puntualidad se hundiera justo por tomar la decisión buena. Durante la
   maniobra se muestra ya el retraso con el que va a reanudar.           */
const retrasoEfectivo = (t) => (t.rotando ? Math.max(0, t.retraso + t.rotando.restante - t.rotando.delta) : t.retraso);

function situacion(t, reloj) {
  const p = fase(t, reloj);
  if (p < LLEGA_ALCALA) return { dir: "alcala", idx: idxDesdeTiempo(p), p };
  if (p < SALE_ALCALA) return { dir: "maniobra", idx: N - 1, p, cabecera: ALCALA };
  if (p < LLEGA_PIO) return { dir: "pio", idx: idxDesdeTiempo(RECORRIDO - (p - SALE_ALCALA)), p };
  return { dir: "maniobra", idx: 0, p, cabecera: PIO };
}

/* ── numeración de trenes ───────────────────────────────────────
   Serie 218XX. Las dos últimas cifras son el orden de salida del
   día: pares hacia Alcalá (salidas de Príncipe Pío) e impares
   hacia Príncipe Pío (salidas de Alcalá). Cada vez que un tren
   invierte —en cabecera o rotando en una estación con agujas—
   toma el número que corresponde a la marcha en que se inserta.  */

/* Serie de numeración, propia de cada línea. La convención es la misma en
   todas: pares hacia el extremo alto del recorrido e impares hacia el bajo.
   En la C-7 eso son pares hacia Alcalá; en la C-1, pares hacia el
   Aeropuerto.                                                          */
let SERIE_TREN = 21800;
let SERIE_VACIO = 37200; // marchas de material sin viajeros
const T0_NUM = 4 * 60; // primera salida numerada del día

function numeroTren(t, reloj) {
  let haciaPio, inicio;
  if (t.rotando) {
    // durante la maniobra ya lleva el número de la marcha en que se va a insertar
    haciaPio = t.rotando.haciaPio;
    inicio = t.rotando.inicio;
  } else {
    const p = fase(t, reloj);
    if (p < LLEGA_ALCALA) {
      // rodando hacia Alcalá: marcha iniciada en Príncipe Pío
      haciaPio = false;
      inicio = reloj - p - t.retraso;
    } else if (p < SALE_ALCALA) {
      // parado en Alcalá: ya lleva el número de la vuelta
      haciaPio = true;
      inicio = reloj + (SALE_ALCALA - p) - t.retraso;
    } else if (p < LLEGA_PIO) {
      haciaPio = true;
      inicio = reloj - (p - SALE_ALCALA) - t.retraso;
    } else {
      // parado en Príncipe Pío: ya lleva el número de la ida
      haciaPio = false;
      inicio = reloj + (CICLO - p) - t.retraso;
    }
  }
  /* La numeración es continua a lo largo del día: los pares suben hacia
     Alcalá y los impares hacia Príncipe Pío, y no se reinician al cambiar de
     turno. Antes se tomaba el resto de 100 y las cifras volvían a empezar
     cada cincuenta marchas, con lo que los trenes de la noche llevaban los
     mismos números que los de la mañana.                                  */
  /* El número depende solo de la hora del día, no del turno desde el que se
     mire. El reloj de la noche sigue subiendo tras la medianoche, así que hay
     que reducirlo a un día: sin eso, la marcha de las 06:00 salía como 21956
     vista desde la noche y como 21812 vista desde la mañana.

     La numeración arranca a las 04:00, antes de que empiece el servicio, y
     recorre las 72 franjas del día sin repetirse: pares hacia Alcalá e
     impares hacia Príncipe Pío.                                          */
  const base = t.esVacio ? SERIE_VACIO : SERIE_TREN;
  const DIA = 24 * 60;
  const desdeT0 = (((inicio - T0_NUM) % DIA) + DIA) % DIA;
  const orden = Math.floor(desdeT0 / INTERVALO);
  return base + orden * 2 + (haciaPio ? 1 : 0);
}

/* Número de tren de una marcha concreta, sabiendo cuándo arranca. Usa la
   misma cuenta que numeroTren: se había quedado con el resto de 100 y daba
   números distintos a los de la barra para la misma marcha.             */
function numDeMarcha(inicio, haciaPio, esVacio = false) {
  const DIA = 24 * 60;
  const desdeT0 = (((inicio - T0_NUM) % DIA) + DIA) % DIA;
  const orden = Math.floor(desdeT0 / INTERVALO);
  return (esVacio ? SERIE_VACIO : SERIE_TREN) + orden * 2 + (haciaPio ? 1 : 0);
}

// todas las marchas que hace una circulación a lo largo del día
/* Rotación del día. Se genera entera al empezar el turno con lo que el tren
   debería hacer: número, origen, destino y horas previstas. Cada marcha se
   corrige solo cuando termina, anotando las horas reales y la estación donde
   de verdad acabó. Así el cuadro se lee siempre completo y va tomando la
   forma de lo que ha pasado.                                            */

// la marcha que el tren está haciendo ahora mismo
/* Marcha que el tren está haciendo ahora. Se busca por la hora, no por el
   orden: antes devolvía la primera sin cerrar y, como solo se cerraban al
   pasar por una cabecera, el cuadro se quedaba clavado en la segunda aunque
   fueran las nueve de la mañana.                                        */
/* ── rotación del día ───────────────────────────────────────────
   Cada circulación lleva el cuadro completo de lo que va a hacer, y cada
   marcha va pasando por tres estados:

     prevista → curso → hecha

   Mientras es prevista se enseña lo planificado. Al empezar se anota la hora
   real de salida y al acabar la hora y la estación reales. Una marcha nunca
   se cierra antes de haber empezado: ese era el origen de recorridos como
   "Alcalá → Alcalá, 07:20 – 07:04", que cerraban una marcha futura con la
   hora actual.                                                          */

// la que el tren está haciendo ahora mismo, o null si no ha empezado ninguna
function marchaEnCurso(t) {
  return (t.marchas || []).find((m) => m.estado === "curso") || null;
}

// pone en marcha la que corresponda a esta hora
function arrancarMarcha(t, r) {
  const m = (t.marchas || []).find((x) => x.estado === "prevista" && x.ini <= r && r < x.fin);
  if (!m) return null;
  m.estado = "curso";
  m.iniReal = Math.round(r);
  return m;
}

function cerrarMarcha(g, t, idx, motivo = null) {
  const m = marchaEnCurso(t);
  if (!m) return;
  const k = Math.max(0, Math.min(N - 1, Math.round(idx)));
  const real = ESTACIONES[k].n;
  m.estado = "hecha";
  m.finReal = Math.max(m.iniReal !== undefined ? m.iniReal : m.ini, Math.round(g.reloj));
  m.hastaReal = real;
  if (real !== m.hasta) m.motivo = motivo || "terminó antes";
}

/* Al rotar antes de tiempo la marcha en curso acaba ahí y nace otra en sentido
   contrario, que ocupa el lugar de la siguiente prevista.               */
function partirMarcha(g, t, idx, dir) {
  const m = marchaEnCurso(t);
  const k = Math.max(0, Math.min(N - 1, Math.round(idx)));
  cerrarMarcha(g, t, k, "rotación anticipada");
  const r = Math.round(g.reloj);
  const recorrido = dir === "alcala" ? ESTACIONES[N - 1].t - ESTACIONES[k].t : ESTACIONES[k].t;
  const nueva = {
    ini: r,
    fin: r + Math.max(1, recorrido),
    desde: ESTACIONES[k].n,
    hasta: dir === "alcala" ? ALCALA : PIO,
    dir,
    num: numDeMarcha(r, dir === "pio", t.esVacio),
    estado: "curso",
    iniReal: r,
  };
  if (!t.marchas) t.marchas = [];
  const pos = m ? t.marchas.indexOf(m) : -1;
  if (pos >= 0) t.marchas.splice(pos + 1, 0, nueva);
  else t.marchas.push(nueva);
}

/* Cada minuto: arranca la marcha que toca y da por hechas las que ya han
   vencido sin que se registrara su llegada, para que el cuadro no se quede
   atascado en una marcha antigua.                                       */
function avanzarMarchas(g, t, r) {
  for (const m of t.marchas || []) {
    if (m.estado === "hecha") continue;
    if (m.estado === "curso" && r >= m.fin + 45) {
      // vencida de largo sin llegada: se da por hecha como estaba prevista
      m.estado = "hecha";
      m.finReal = m.finReal !== undefined ? m.finReal : Math.round(m.fin);
      m.hastaReal = m.hastaReal || m.hasta;
    }
    if (m.estado === "prevista" && r >= m.fin) {
      m.estado = "hecha";
      m.finReal = Math.round(m.fin);
      m.hastaReal = m.hasta;
      // una circulación retirada no llegó a hacerla
      if (t.estado === "suprimido" || !t.unidades.length) m.motivo = "no efectuada";
    }
  }
  if (t.estado !== "suprimido" && !marchaEnCurso(t)) arrancarMarcha(t, r);
}

function rotacionDelDia(t, desde = 5 * 60, hasta = 24 * 60) {
  const out = [];
  /* Tantos ciclos como haga falta para cubrir el día. Con doce fijos, una
     línea de ciclo corto se quedaba sin la mitad de su cuadro.         */
  const kIni = Math.floor((desde - t.offset) / CICLO) - 1;
  const kFin = Math.ceil((hasta - t.offset) / CICLO) + 1;
  for (let k = kIni; k <= kFin; k++) {
    const salePio = t.offset + CICLO * k;
    const llegaAlc = salePio + RECORRIDO;
    const saleAlc = salePio + SALE_ALCALA;
    const llegaPio = salePio + LLEGA_PIO;
    /* Se toman las marchas que solapan con la ventana. Antes bastaba con que
       la llegada cayera dentro, así que aparecían marchas iniciadas de
       madrugada y terminadas antes de empezar el turno.                  */
    if (llegaAlc > desde && salePio < hasta)
      out.push({ ini: salePio, fin: llegaAlc, desde: PIO, hasta: ALCALA, dir: "alcala", num: numDeMarcha(salePio, false) });
    if (llegaPio > desde && saleAlc < hasta)
      out.push({ ini: saleAlc, fin: llegaPio, desde: ALCALA, hasta: PIO, dir: "pio", num: numDeMarcha(saleAlc, true) });
  }
  return out.sort((a, b) => a.ini - b.ini);
}

const numCorto = (t, reloj) => String(numeroTren(t, reloj) % 100).padStart(2, "0");

/* Descripción de dónde está el tren. Se usa siempre el nombre corto: con el
   nombre largo en las paradas y el corto entre ellas, el texto cambiaba de
   longitud cada pocos segundos.                                          */
function describir(s) {
  if (s.dir === "maniobra") return `Inversión en ${s.cabecera}`;
  const e = Math.floor(s.idx);
  const f = s.idx - e;
  if (f < 0.07) return `En ${ESTACIONES[e].corto}`;
  if (f > 0.93) return `En ${ESTACIONES[Math.min(N - 1, e + 1)].corto}`;
  return `${ESTACIONES[e].corto} → ${ESTACIONES[e + 1].corto}`;
}

function etaCabecera(t, reloj, cab) {
  const p = fase(t, reloj);
  let mejor = Infinity;
  for (const x of PASOS) {
    if (x.cab !== cab) continue;
    let d = x.q - p;
    if (d < 0) d += CICLO;
    mejor = Math.min(mejor, d);
  }
  return mejor;
}

function etaPrimeraCabecera(t, reloj) {
  return [CHAMARTIN, ALCALA, PIO]
    .map((cab) => ({ cab, min: etaCabecera(t, reloj, cab) }))
    .sort((a, b) => a.min - b.min)[0];
}

function etaRelevo(t, reloj) {
  if (!t.relevo) return Infinity;
  const base = Math.max(0, t.relevo.desde - reloj);
  return base + etaCabecera(t, reloj + base, t.relevo.cab);
}

// vías desviadas utilizables para maniobrar: no valen las de paso, porque
// retener un tren en ellas cortaría la circulación general
function viasManiobra(g, i) {
  const paso = Object.values(ESTACIONES[i].paso || {});
  const conTren = new Set(
    g.trenes
      .filter((t) => (t.enDesviada && t.enDesviada.idx === i && t.enDesviada.via) || (t.rotando && t.rotando.idx === i && t.rotando.via))
      .map((t) => (t.enDesviada ? t.enDesviada.via : t.rotando.via))
  );
  return viasRotacion(g, i).filter((v) => !paso.includes(v) && !conTren.has(v));
}

function candidatosRotacion(t, reloj, restricciones = [], g0 = { apartado: {} }) {
  const s = situacion(t, reloj);
  if (s.dir === "maniobra" || t.rotando || t.retenido || t.detenido) return [];
  const bloqueadas = new Set(restricciones.filter((x) => x.bloqueaRot).map((x) => x.idx));
  const out = [];
  const lim = s.dir === "alcala" ? [Math.ceil(s.idx), N - 2] : [1, Math.floor(s.idx)];
  for (let i = lim[0]; i <= lim[1]; i++) {
    const est = ESTACIONES[i];
    if (!est.rot) continue; // los apeaderos no tienen agujas
    if (bloqueadas.has(i)) continue; // agujas sin comprobación: no se puede invertir
    if (est.rotDir && est.rotDir !== s.dir) continue; // solo se invierte en un sentido
    if (!viasManiobra(g0, i).length) continue; // sin vía desviada libre para invertir
    const ti = ESTACIONES[i].t;
    const q = s.dir === "alcala" ? ti : LLEGA_PIO - ti;
    let eta = q - s.p;
    if (eta < 0) eta += CICLO;
    if (eta > 120) continue;
    const ahorro = s.dir === "alcala" ? RECORRIDO - ti : ti;
    if (ahorro <= 0) continue;
    const invCab = s.dir === "alcala" ? INV_ALCALA : INV_PIO;
    // se ahorra ida y vuelta hasta la cabecera, incluida su rotación
    const delta = invCab + 2 * ahorro;
    const espera = Math.max(MANIOBRA, delta - t.retraso);
    // retraso con el que reanudaría si rota aquí
    const trasRotar = Math.max(0, t.retraso + espera - delta);
    // retraso con el que saldría sin tocar nada: la rotación en cabecera ya
    // absorbe por sí sola hasta invCab − MANIOBRA minutos
    const siSigue = Math.max(0, t.retraso - (invCab - MANIOBRA));
    const sinServicio = ESTACIONES.filter((e2, j) => !e2.puesto && (s.dir === "alcala" ? j > i : j < i)).length;
    out.push({
      idx: i, q, ahorro, sinServicio, delta,
      espera: Math.round(espera),
      nombre: ESTACIONES[i].n,
      eta: Math.round(eta),
      trasRotar: Math.round(trasRotar),
      siSigue: Math.round(siSigue),
      gana: Math.max(0, Math.round(siSigue) - Math.round(trasRotar)),
      cabecera: s.dir === "alcala" ? ALCALA : PIO,
      absorbe: invCab - MANIOBRA,
      tarde: eta < MIN_ANTELACION, // no da tiempo a preparar el itinerario
    });
  }
  return out.sort((a, b) => a.eta - b.eta);
}

// Reparto real de los relevos por cabecera. La residencia está junto a
// Chamartín, así que allí se hace la mayoría; Príncipe Pío es residual.
// Reparto objetivo: 70 % Chamartín, 25 % Alcalá, 5 % Príncipe Pío. Los pesos
// van calibrados para dar ese resultado: Chamartín aparece dos veces por ciclo
// y siempre tiene hueco, así que su peso nominal debe ser menor.
const PESO_RELEVO = { [CHAMARTIN]: 60, [ALCALA]: 34, [PIO]: 6 };

function programarRelevo(tren, maq, desdeReloj) {
  const limite = desdeReloj + margenDe(maq);
  if (limite > FIN + 25) return null;
  const objetivo = limite - MARGEN_CUADRO;

  /* Cuántos ciclos hay que recorrer para cubrir el turno. Estaba fijado en
     ocho, que con el ciclo de 260 min de la C-7 sobra de largo, pero con los
     45 min de la C-1 no llegaba ni al principio del turno: el cuadro salía
     vacío y los maquinistas se quedaban sin relevo previsto.            */
  const desde = Math.floor((desdeReloj - tren.offset) / CICLO) - 1;
  const hasta = Math.ceil((FIN + 60 - tren.offset) / CICLO) + 1;

  const candidatos = [];
  for (let n = desde; n <= hasta; n++) {
    for (const x of PASOS) {
      const T = tren.offset + x.q + CICLO * n;
      if (T < desdeReloj + 12 || T > objetivo) continue;
      candidatos.push({ T, cab: x.cab });
    }
  }

  if (candidatos.length) {
    // se busca dentro de la ventana previa al límite, para aprovechar la
    // jornada; entre las opciones válidas manda el reparto por cabecera
    const lista = candidatos;
    // se sortea primero la cabecera y después su paso más tardío: Chamartín
    // aparece dos veces por ciclo y si no, se llevaría el doble de lo debido
    const cabs = [...new Set(lista.map((c) => c.cab))];
    const total = cabs.reduce((n, cab) => n + (PESO_RELEVO[cab] || 1), 0);
    let x = Math.random() * total;
    let elegida = cabs[cabs.length - 1];
    for (const cab of cabs) {
      x -= PESO_RELEVO[cab] || 1;
      if (x <= 0) {
        elegida = cab;
        break;
      }
    }
    const c = lista.filter((y) => y.cab === elegida).sort((a2, b2) => b2.T - a2.T)[0];
    return { desde: c.T - 3, cab: c.cab, prevista: c.T };
  }

  // sin hueco cómodo: el primer paso disponible, sea donde sea
  let mejor = null;
  for (let n = desde; n <= hasta; n++) {
    for (const x of PASOS) {
      const T = tren.offset + x.q + CICLO * n;
      if (T >= desdeReloj + 5 && (!mejor || T < mejor.T)) mejor = { T, cab: x.cab };
    }
  }
  return mejor ? { desde: mejor.T - 3, cab: mejor.cab, prevista: mejor.T } : null;
}


/* ══════════════════════════════════════════════════════════════
   MODELO DE VIAJEROS
   150.000 viajeros/día. Cada estación genera y atrae según su
   escala (2 a 5, con peso doblando en cada escalón). El destino
   de quien sube se reparte por atractividad, así que el sentido
   en que viaja sale solo. En punta se añade sesgo mareal: por la
   mañana la gente sale de la periferia hacia el centro y a media
   tarde al revés.
   ══════════════════════════════════════════════════════════════ */

let VIAJEROS_DIA = 150000; // propio de cada línea
const PESO_ESC = { 2: 2, 3: 4, 4: 8, 5: 16 };
// los puestos de circulación no prestan servicio de viajeros: peso cero
let PESO = ESTACIONES.map((e) => (e.puesto ? 0 : PESO_ESC[e.esc] || 4));

// centralidad 0 (extremos) a 1 (centro de la línea, junto a Nuevos Ministerios)
let CENTRO = 46;
let CENTRALIDAD = ESTACIONES.map((e) => 1 - Math.abs(e.t - CENTRO) / Math.max(CENTRO, RECORRIDO - CENTRO));

// franjas horarias con su intensidad relativa
const FRANJAS = [
  { h0: 5, h1: 7, pct: 0.3 },
  { h0: 7, h1: 10, pct: 1.0 },
  { h0: 10, h1: 13, pct: 0.6 },
  { h0: 13, h1: 16, pct: 0.9 },
  { h0: 16, h1: 20, pct: 0.6 },
  { h0: 20, h1: 22, pct: 0.4 },
  { h0: 22, h1: 24, pct: 0.15 },
];
const HORAS_INTENSIDAD = FRANJAS.reduce((n, f) => n + (f.h1 - f.h0) * f.pct, 0);
let VIAJEROS_MIN_100 = VIAJEROS_DIA / HORAS_INTENSIDAD / 60; // subidas por minuto en toda la línea al 100 %

const SESGO = 0.6;
function intensidad(reloj) {
  const h = (reloj / 60) % 24;
  const f = FRANJAS.find((x) => h >= x.h0 && h < x.h1);
  return f ? f.pct : 0.15;
}
// +1 mañana (hacia el centro), −1 tarde (desde el centro), 0 resto
function marea(reloj) {
  const h = (reloj / 60) % 24;
  if (h >= 7 && h < 10) return 1;
  if (h >= 13 && h < 16) return -1;
  return 0;
}

/* Efecto de los transbordos. Una estación con correspondencia no solo sirve a
   su barrio: recoge y suelta gente que viene o va por otra línea. Chamartín o
   Atocha mueven muchísimo más de lo que les corresponde por tamaño, y hasta
   ahora el juego las trataba como a cualquier otra de su escala.

   Cada línea de Cercanías con la que enlaza suma un 22 %, y el Metro un 45 %,
   que mueve mucho más volumen. El tope evita que un nudo como Atocha, con seis
   líneas más Metro, se coma la línea entera.                           */
const PESO_CER = 0.22;
const PESO_METRO = 0.45;
const TOPE_CORR = 2.6;
let CORRESPONDENCIA = ESTACIONES.map((e) => {
  if (e.puesto) return 1;
  const lineas = (e.c || []).length;
  return Math.min(TOPE_CORR, 1 + lineas * PESO_CER + (e.metro ? PESO_METRO : 0));
});

// peso de generación de una estación y peso de atracción como destino
const pesoOrigen = (i, mar) => PESO[i] * CORRESPONDENCIA[i] * (1 + SESGO * mar * (1 - CENTRALIDAD[i]));
const pesoDestino = (i, mar) => PESO[i] * CORRESPONDENCIA[i] * (1 + SESGO * mar * CENTRALIDAD[i]);

// reparto de destinos para quien sube en `i` viajando en `dir`
function destinos(i, dir, mar) {
  const out = [];
  let tot = 0;
  if (dir === "alcala") for (let j = i + 1; j < N; j++) { const w = pesoDestino(j, mar); out.push([j, w]); tot += w; }
  else for (let j = i - 1; j >= 0; j--) { const w = pesoDestino(j, mar); out.push([j, w]); tot += w; }
  return { out, tot };
}

// cuántos de los que salen de `i` van en cada sentido
function repartoSentido(i, mar) {
  const a = destinos(i, "alcala", mar).tot;
  const p = destinos(i, "pio", mar).tot;
  const t = a + p;
  return t ? { alcala: a / t, pio: p / t } : { alcala: 0.5, pio: 0.5 };
}

/* ── demanda de viajeros por circulación ────────────────────── */

// Ocupación simultánea máxima que alcanza una circulación en punta. Las
// subidas de todo el recorrido se dividen por las veces que se reutiliza
// cada plaza a lo largo del trayecto (unos y otros suben y bajan).
const ROTACION_PLAZA = 2;
function demandaPorTren() {
  const trenesHora = (60 / INTERVALO) * 2; // ambos sentidos
  // se toma la franja más cargada del turno elegido
  let pico = 0;
  for (let m = INICIO; m < FIN; m += 30) pico = Math.max(pico, intensidad(m));
  return Math.round((VIAJEROS_MIN_100 * 60 * pico) / trenesHora / ROTACION_PLAZA);
}

const UMBRAL_PARADA = 120; // movimientos que absorbe la parada nominal
const MOV_POR_MIN = 300; // viajeros por minuto extra de parada

// llegada de viajeros a los andenes durante un minuto
function llenarAndenes(g) {
  const mar = marea(g.reloj);
  const inten = intensidad(g.reloj);
  const total = VIAJEROS_MIN_100 * inten;
  const pesos = ESTACIONES.map((_, i) => pesoOrigen(i, mar));
  const suma = pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < N; i++) {
    if (ESTACIONES[i].puesto) continue;
    const llegan = (total * pesos[i]) / suma;
    const r = repartoSentido(i, mar);
    if (i < N - 1) g.andenes[i].alcala += llegan * r.alcala;
    if (i > 0) g.andenes[i].pio += llegan * r.pio;
  }
}

// un tren efectúa parada: bajan, suben y se calcula el exceso de tiempo
function efectuarParada(g, t, i, dir) {
  // tren en vacío: baja todo el mundo y no sube nadie
  if (t.vacio) {
    const aBordo = t.pax.reduce((a, b) => a + b, 0);
    const llegan = t.pax[i] || 0;
    const cortados = aBordo - llegan;
    t.pax = new Array(N).fill(0);
    if (cortados > 1) {
      g.andenes[i][dir] += cortados;
      t.dejados += cortados;
    }
    return { suben: 0, bajan: aBordo, dejados: 0 };
  }

  // un viajero cuenta como transportado cuando llega a su destino
  const bajan = t.pax[i] || 0;
  g.kpi.transportados += bajan;
  if (g.estad) g.estad.bajan[i] = (g.estad.bajan[i] || 0) + bajan;
  t.pax[i] = 0;
  const cap = plazasDe(t);
  const aBordo = t.pax.reduce((a, b) => a + b, 0);
  const hueco = Math.max(0, cap - aBordo);
  const enAnden = g.andenes[i][dir];

  // Si el tren tiene ordenada una rotación, se anuncia como que termina
  // recorrido allí: quien va más allá no sube y sigue esperando en el andén.
  const { out, tot } = destinos(i, dir, marea(g.reloj));
  const limite = t.rotacion ? t.rotacion.idx : null;
  const alcanzables = limite === null ? out : out.filter(([j]) => (dir === "alcala" ? j <= limite : j >= limite));
  const totAlc = alcanzables.reduce((n, [, w]) => n + w, 0);
  const interesados = tot > 0 ? enAnden * (totAlc / tot) : 0;

  const suben = Math.min(interesados, hueco);
  if (g.estad) g.estad.suben[i] = (g.estad.suben[i] || 0) + suben;
  g.andenes[i][dir] = enAnden - suben;

  if (suben > 0 && totAlc > 0) {
    for (const [j, w] of alcanzables) t.pax[j] += (suben * w) / totAlc;
  }
  // solo cuentan como afectados los que querían subir y no cupieron
  const dejados = Math.max(0, interesados - suben);
  if (dejados > 1) t.dejados += dejados;

  const mov = suben + bajan;
  const exceso = Math.max(0, mov - UMBRAL_PARADA) / MOV_POR_MIN;
  t.buffer += exceso;
  return { suben, bajan, dejados };
}

/* ── apartaderos y frecuencia real por estación ─────────────── */

/* Vías ocupadas en una estación, mirando TODAS las líneas. Una vía es física:
   si la C-7 ha dejado material en la M6 de Chamartín, la C-1 no puede meter
   otro tren ahí. Antes cada línea llevaba su propia contabilidad y las dos
   podían ocupar la misma.                                              */
const ocupadasEn = (g, i) => {
  const out = new Set((g.apartado[i] || []).map((x) => x.via));
  const nombre = (ESTACIONES[i] || {}).n;
  if (!nombre) return out;
  const activa = g.linea || LINEAS_EN_JUEGO[0];
  for (const [id, trozo] of Object.entries(g.porLinea || {})) {
    if (id === activa) continue;
    const j = ((LINEAS[id] || {}).estaciones || []).findIndex((e) => e.n === nombre);
    if (j < 0) continue;
    for (const x of (trozo.apartado || {})[j] || []) out.add(x.via);
    // y las vías donde otra línea tiene un tren invirtiendo ahora mismo
    for (const t of trozo.trenes || []) if (t.rotando && t.rotando.idx === j) out.add(t.rotando.via);
  }
  return out;
};

// vías libres para apartar material
const viasLibres = (g, i) => {
  const e = ESTACIONES[i];
  if (!e.apartVias) return [];
  const oc = ocupadasEn(g, i);
  // también cuentan como ocupadas las que ya tiene comprometidas otro tren
  for (const o of g.trenes || []) if (o.supresion && o.supresion.idx === i && o.supresion.via) oc.add(o.supresion.via);
  return e.apartVias.filter((v) => !oc.has(v));
};

// vías libres para invertir: las compartidas quedan inutilizadas si hay material
const viasRotacion = (g, i) => {
  const e = ESTACIONES[i];
  if (!e.rotVias) return [];
  const oc = ocupadasEn(g, i);
  return e.rotVias.filter((v) => !oc.has(v));
};

// vías de inversión realmente disponibles en una cabecera
/* Vías de una cabecera que estarán libres dentro de `dt` minutos.
   No basta con contar quién está dentro ahora: hay que mirar quién
   seguirá dentro cuando llegue el tren. En Príncipe Pío entra uno
   justo cuando sale otro, así que se admite un margen de tolerancia
   para no dar por ocupada una vía que se libera en ese momento.   */
function libresAlLlegar(g, i, cab, excluir, dt = 0, tol = 3) {
  const e = ESTACIONES[i];
  const rotVias = e.rotVias || [];
  const conMaterial = ocupadasEn(g, i);
  const disponibles = rotVias.filter((v) => !conMaterial.has(v));

  const ocupantes = g.trenes.filter((o) => {
    if (o.estado === "suprimido" || o.i === excluir) return false;
    if (o.rotando || o.rotacion) return false; // no llegarán a esta cabecera
    const parado = o.detenido || o.retenido || o.esperaCab || o.esperaCruce || o.enDesviada;
    const p = fase(o, g.reloj + (parado ? 0 : dt));
    const dentro = cab === ALCALA ? p >= LLEGA_ALCALA && p < SALE_ALCALA : cab === PIO ? p >= LLEGA_PIO : false;
    if (!dentro) return false;
    // ¿seguirá dentro cuando el nuestro necesite la vía?
    const salida = cab === ALCALA ? SALE_ALCALA - p : CICLO - p;
    return salida > tol;
  });

  return { libres: disponibles.length - ocupantes.length, ocupantes, disponibles };
}

function rotLibresCabecera(g, i, cab, excluir, dt = 0) {
  return libresAlLlegar(g, i, cab, excluir, dt).libres;
}

// minutos hasta que un tren en cabecera salga de vía
function salidaEn(t, reloj, idx) {
  const objetivo = idx === 0 ? CICLO : SALE_ALCALA;
  const p = fase(t, reloj);
  return ((objetivo - p) % CICLO + CICLO) % CICLO;
}

// trenes que van a llegar a esa cabecera, por orden de llegada
function llegadasA(g, idx) {
  const objetivo = idx === 0 ? LLEGA_PIO : LLEGA_ALCALA;
  return g.trenes
    .filter((t) => t.estado !== "suprimido" && !t.rotando && !t.rotacion && !(t.viaCab && t.viaCab.idx === idx))
    .map((t) => ({ t, eta: ((objetivo - fase(t, g.reloj)) % CICLO + CICLO) % CICLO }))
    .filter((x) => x.eta <= 60)
    .sort((a, b) => a.eta - b.eta);
}

// estado de cada vía de inversión: libre, con material apartado o con tren
function estadoViasRot(g, i) {
  const e = ESTACIONES[i];
  if (!e.rotVias) return [];
  const oc = ocupadasEn(g, i);

  // vías por las que además circulan los trenes con carácter normal
  const paso = e.paso || {};
  const dirDeVia = Object.fromEntries(Object.entries(paso).map(([d, v]) => [v, d]));

  // estado actual de cada vía y a partir de qué minuto queda libre
  const vias = e.rotVias.map((via) => {
    const pasoDir = dirDeVia[via];
    const pasoTren = pasoDir ? proximoPaso(g, i, pasoDir) : null;
    if (pasoTren) return { via, tipo: "paso", pasoDir, pasoTren, libreEn: Infinity };
    const tren = g.trenes.find((t) => t.estado !== "suprimido" && t.viaCab && t.viaCab.idx === i && t.viaCab.via === via);
    if (tren) return { via, tipo: "tren", tren, sale: Math.round(salidaEn(tren, g.reloj, i)), libreEn: salidaEn(tren, g.reloj, i) };
    if (oc.has(via)) return { via, tipo: "material", libreEn: Infinity };
    return { via, tipo: "libre", libreEn: 0 };
  });

  // las llegadas se reparten por la vía que antes queda libre, aunque ahora
  // esté ocupada: es lo que hace que en Príncipe Pío se vean los relevos
  if (i === 0 || i === N - 1) {
    // reparto determinista: la enésima llegada va a la enésima vía en quedar
    // libre. Sin desempates por umbral, que hacían bailar los números.
    const orden = vias
      .map((v, k) => ({ v, k }))
      .filter((o) => o.v.libreEn !== Infinity)
      .sort((x, y) => x.v.libreEn - y.v.libreEn || x.k - y.k);
    llegadasA(g, i).forEach((a, k) => {
      const destino = orden[k];
      if (!destino) return;
      destino.v.prox = { tren: a.t, min: Math.round(a.eta), conflicto: destino.v.libreEn > a.eta + 0.5 };
    });
  }
  return vias;
}

const admiteSerie = (i, serie) => {
  const e = ESTACIONES[i];
  return !e.apartSeries || e.apartSeries.includes(serie);
};

// fase de una estación en cada sentido
const faseEstacion = (i, dir) => (dir === "alcala" ? ESTACIONES[i].t : LLEGA_PIO - ESTACIONES[i].t);

// Vías generales: por ellas circulan los trenes con carácter normal.
// La 1 es la de los impares (sentido Príncipe Pío) y la 2 la de los pares
// (sentido Alcalá). Las cabeceras y Chamartín tienen numeración propia.
let SIN_GENERALES = [IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA];
// estaciones que de verdad prestan servicio, para contar afectados
let CON_SERVICIO = ESTACIONES.filter((e) => !e.puesto).length;
/* Siglas del destino de cada sentido. Estaban escritas a mano con las de la
   C-7, así que en la C-1 los andenes decían "hacia PP" y "hacia AH".    */
let DATOS_DIR = {
  pio: { sentido: "PP", paridad: "impares" },
  alcala: { sentido: "AH", paridad: "pares" },
};
function viasGenerales(i) {
  if (SIN_GENERALES.includes(i)) return null;
  const propio = ESTACIONES[i].gen;
  const base = propio || [{ via: "vía 1", dir: "pio" }, { via: "vía 2", dir: "alcala" }];
  return base.map((x) => ({ ...x, ...DATOS_DIR[x.dir] }));
}

// próximo tren que pasará por una estación en un sentido
function proximoPaso(g, i, dir) {
  const q = faseEstacion(i, dir);
  let mejor = null;
  for (const t of g.trenes) {
    if (t.estado === "suprimido" || t.rotando) continue;
    const eta = ((q - fase(t, g.reloj)) % CICLO + CICLO) % CICLO;
    if (!mejor || eta < mejor.eta) mejor = { t, eta };
  }
  return mejor;
}

// minutos desde que pasó el último tren y hasta el próximo, por sentido
function pasoPorEstacion(g, i, dir) {
  const q = faseEstacion(i, dir);
  let desde = Infinity;
  let hasta = Infinity;
  for (const t of g.trenes) {
    if (t.estado === "suprimido") continue;
    const p = fase(t, g.reloj);
    desde = Math.min(desde, ((p - q) % CICLO + CICLO) % CICLO);
    hasta = Math.min(hasta, ((q - p) % CICLO + CICLO) % CICLO);
  }
  return { desde, hasta };
}

// aparta el material de un tren en la estación con vía libre más cercana
function apartarMaterial(g, t, forzarIdx = null, forzarVia = null) {
  if (!t.unidades.length) return null;
  // si se indica estación (supresión ordenada), se aparca justo allí
  // de noche valen también las vías generales de las cabeceras
  // se guardan dos vías de paso mientras siga habiendo trenes en línea
  const enLinea = g.trenes.filter((x) => x.estado !== "suprimido" && x.i !== t.i).length;
  const reserva = enLinea > 0 ? 2 : 0;
  const disponibles = (i) => (TURNO_ID === "noche" && (ESTACIONES[i] || {}).cab ? viasNocturnas(g, i, reserva) : viasLibres(g, i));
  // en la retirada nocturna el destino es firme: no vale cualquier estación
  if (forzarIdx === null && t.supresion && t.supresion.noche) forzarIdx = t.supresion.idx;
  if (forzarIdx !== null && disponibles(forzarIdx).length) {
    const libres = disponibles(forzarIdx);
    const via = forzarVia && libres.includes(forzarVia) ? forzarVia : libres[0];
    g.apartado = {
      ...g.apartado,
      [forzarIdx]: [...(g.apartado[forzarIdx] || []), { via, unidades: t.unidades.map((u) => ({ ...u })), desde: Math.floor(g.reloj) }],
    };
    return { i: forzarIdx, via };
  }
  const cand = [];
  for (let i = 0; i < N; i++) if (viasLibres(g, i).length) cand.push(i);
  if (!cand.length) return null;
  const serie = t.unidades[0].serie;
  const validas = cand.filter((i) => admiteSerie(i, serie));
  if (!validas.length) return null;
  validas.sort((a, b) => etaPunto(t, g.reloj, a) - etaPunto(t, g.reloj, b));
  const i = validas[0];
  const via = viasLibres(g, i)[0];
  g.apartado = { ...g.apartado, [i]: [...(g.apartado[i] || []), { via, unidades: t.unidades.map((u) => ({ ...u })), desde: Math.floor(g.reloj) }] };
  return { i, via };
}

/* ── localización de incidencias ────────────────────────────── */

// afluencia estimada: intercambiadores grandes pesan mucho más que un apeadero
const pesoAfluencia = (e) => 1 + (e.c.length >= 5 ? 3 : e.c.length >= 3 ? 1 : 0) + (e.metro ? 1 : 0) + (e.tipo === "est" ? 1 : 0);

function estacionPonderada() {
  const total = ESTACIONES.reduce((n, e) => n + pesoAfluencia(e), 0);
  let x = Math.random() * total;
  for (let i = 0; i < N; i++) {
    x -= pesoAfluencia(ESTACIONES[i]);
    if (x <= 0) return i;
  }
  return N - 1;
}

// punto de vía al azar, por defecto fuera del tramo soterrado
function puntoAlAzar(superficie = true) {
  const cand = [];
  for (let i = 0; i < N; i++) if (!superficie || !ESTACIONES[i].sot) cand.push(i);
  return pick(cand);
}

function tramoAlAzar(superficie = true) {
  const cand = [];
  for (let i = 0; i < N - 1; i++) {
    if (superficie && (ESTACIONES[i].sot || ESTACIONES[i + 1].sot)) continue;
    cand.push(i);
  }
  const i = pick(cand);
  return { idx: i, txt: `entre ${ESTACIONES[i].corto} y ${ESTACIONES[i + 1].corto}` };
}

// minutos hasta que un tren vuelva a pasar por un punto, en cualquier sentido
function etaPunto(t, reloj, i) {
  const ti = ESTACIONES[i].t;
  const p = fase(t, reloj);
  let mejor = Infinity;
  for (const q of [ti, LLEGA_PIO - ti]) {
    let d = q - p;
    if (d < 0) d += CICLO;
    mejor = Math.min(mejor, d);
  }
  return mejor;
}


/* ── vía única por banalización ─────────────────────────────────
   Cuando se corta una vía, los trenes de ese sentido pasan por la
   contraria. Solo pueden cambiarse de vía donde hay agujas, así que
   el tramo realmente afectado va de una estación con desviada a la
   siguiente. Dentro de él solo cabe un tren: dos en sentidos
   opuestos colisionarían. El orden lo marca la hora prevista de
   paso: pasa antes quien debía haber pasado antes.               */

// delimitan tramo las cabeceras, las estaciones con vía desviada y las
// bifurcaciones, que cambian de vía aunque no tengan dónde estacionar
/* Nombre de cabecera de una estación, tolerando índices que no existan en la
   línea vigente: los heredados de un turno anterior o de otra línea apuntan a
   posiciones que aquí pueden estar fuera del catálogo.                 */
function cabeceraDe(i) {
  const e = ESTACIONES[i];
  if (!e) return null;
  return e.cab || e.n;
}

const tieneAgujas = (i) => i === 0 || i === N - 1 || !!ESTACIONES[i].rot || !!ESTACIONES[i].agujas;

// tramo entre agujas que queda en vía única por una incidencia en `idx`
/* Extremos del tramo de vía única que provoca una incidencia: las estaciones
   con agujas más próximas por cada lado. Los dos límites se sujetan al rango
   de la línea; si no, una incidencia en la última estación devolvía un tramo
   que terminaba una estación más allá del final y todo lo que consultara esa
   posición se venía abajo.                                              */
function limitesTramo(idx) {
  /* El tramo es el que ENCIERRA al punto, no el que empieza en la estación más
     próxima. Antes se redondeaba: un tren averiado entre la Bifurcación y
     Pitis se redondeaba a Pitis, y la vía única salía de Pitis a Chamartín,
     dejando libre justo el trozo donde estaba el tren.                 */
  /* Un índice que no sea un número deja el tramo en blanco y revienta al
     escribirlo en el libro. Se recoge aquí, que es por donde entra.    */
  const x = Number.isFinite(idx) ? Math.max(0, Math.min(N - 1, idx)) : 0;
  let a = Math.floor(x);
  while (a > 0 && !tieneAgujas(a)) a -= 1;
  let b = Math.ceil(x);
  if (b <= a) b = a + 1; // el punto cae justo en una estación con agujas
  while (b < N - 1 && !tieneAgujas(b)) b += 1;

  /* En el último punto de la línea no hay nada por delante: el tramo es el
     anterior. Sin esto se devolvía un extremo fuera del catálogo y cualquier
     cosa que lo nombrara —el libro, el mapa— fallaba.                  */
  if (b > N - 1) {
    b = N - 1;
    a = Math.min(a, b - 1);
    while (a > 0 && !tieneAgujas(a)) a -= 1;
  }
  if (b <= a) {
    if (a >= N - 1) a = Math.max(0, N - 2);
    b = Math.min(N - 1, a + 1);
  }
  return { a, b };
}

const tramosUnicos = (g) => g.restricciones.filter((x) => x.dir && x.tramo);

// tren que ocupa ahora mismo el tramo de vía única
// ¿está el tren físicamente dentro del tramo de vía única?
/* Un tren inmovilizado por avería está en la vía CORTADA, no en la que se
   comparte: no ocupa el tramo de vía única, y de hecho es la razón de que
   exista. Sin esta excepción tomaba la autorización y no la soltaba nunca,
   porque no se mueve, y la línea se paraba en ambos sentidos.          */
function dentroTramo(t, reloj, tramo) {
  if (t.inmovil) return false;
  const s = situacion(t, reloj);
  if (s.dir === "maniobra") return false;
  return s.idx > tramo.a + 0.02 && s.idx < tramo.b - 0.02;
}

/* Deja al tren esperando el cruce EXACTAMENTE en la estación de acceso.
   Si se había metido en el tramo, se le devuelve al andén; a partir de ahí
   queda congelado hasta que le toque, sin volver a asomarse al tramo.     */
function retenerEnAcceso(g, t, tramo, dir, r) {
  const acceso = dir === "alcala" ? tramo.a : tramo.b;
  const objetivo = dir === "alcala" ? ESTACIONES[acceso].t : LLEGA_PIO - ESTACIONES[acceso].t;
  let atras = fase(t, r) - objetivo;
  if (atras < 0) atras += CICLO;
  /* Se coloca al tren EXACTAMENTE en la estación de acceso, que es donde
     esperaría de verdad. El tope de seis minutos que hubo aquí lo dejaba
     parado en plena vía, donde le pillara.                             */
  if (atras > 0 && atras < CICLO / 2) t.retraso += atras;
  t.enVU = null;
  if (!t.esperaCruce) {
    t.esperaCruce = { a: tramo.a, b: tramo.b, idx: acceso, dir, desde: r, prevista: r - t.retraso };
    log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: a la espera de cruce en ${ESTACIONES[acceso].n}, vía única ocupada en sentido contrario.`);
  }
}


// ¿circula este tren por la vía contraria ahora mismo?
function enViaContraria(g, t) {
  const s = situacion(t, g.reloj);
  if (s.dir === "maniobra") return false;
  /* El tren averiado que provocó el corte no se desvía: está clavado en su
     vía, y es justo por eso por lo que los demás pasan por la contraria. */
  if (t.inmovil) return false;

  /* Un tren que ya entró por la vía contraria la recorre hasta salir del
     tramo, aunque la incidencia se resuelva mientras tanto. Antes se miraban
     solo las restricciones vigentes, así que al levantarse el corte el tren
     saltaba de vía en mitad del trayecto.                              */
  if (t.porContraria) {
    const dentro = s.dir === t.porContraria.dir && s.idx > t.porContraria.a && s.idx < t.porContraria.b;
    if (dentro) return true;
  }
  return tramosUnicos(g).some((x) => x.dir === s.dir && s.idx > x.tramo.a && s.idx < x.tramo.b && x.tren !== t.i);
}

/* ── separación entre trenes ────────────────────────────────────
   Los trenes no se adelantan en vía. El de atrás no puede acercarse
   más de media entrevía al de delante: si el primero pierde tiempo,
   el segundo lo pierde también.                                    */

const SEP_MIN = 1.5; // separación mínima absoluta, en minutos de marcha
const FRENADO_MAX = 1; // frenar más de un minuto por minuto sería retroceder

// posición dentro del recorrido, o null si está en cabecera
function progresoDe(p) {
  if (p < LLEGA_ALCALA) return { dir: "alcala", x: p };
  if (p < SALE_ALCALA) return null;
  if (p < LLEGA_PIO) return { dir: "pio", x: p - SALE_ALCALA };
  return null;
}

// media entrevía en el punto donde está el tren
function separacionEn(x) {
  for (let i = 0; i < N - 1; i++) {
    if (x >= ESTACIONES[i].t && x <= ESTACIONES[i + 1].t) return Math.max(SEP_MIN, (ESTACIONES[i + 1].t - ESTACIONES[i].t) / 2);
  }
  return SEP_MIN;
}

/* Reparte las vías de cabecera entre los trenes que están dentro.
   Se recalcula cada minuto en vez de fijarse al cruzar, para que la
   foto que ve el jugador y la que usa el juego sean siempre la misma
   y ningún tren pueda quedarse dentro sin vía asignada.            */
function asignarViasCabecera(g) {
  for (const [idx, cab] of [[0, PIO], [N - 1, ALCALA]]) {
    const rotVias = ESTACIONES[idx].rotVias || [];
    const conMaterial = ocupadasEn(g, idx);
    const libres = rotVias.filter((v) => !conMaterial.has(v));
    const dentro = g.trenes
      .filter((t) => {
        if (t.estado === "suprimido") return false;
        const p = fase(t, g.reloj);
        return cab === ALCALA ? p >= LLEGA_ALCALA && p < SALE_ALCALA : p >= LLEGA_PIO;
      })
      // sale antes quien lleva más tiempo dentro
      .sort((a, b) => fase(b, g.reloj) - fase(a, g.reloj));

    for (const t of g.trenes) if (t.viaCab && t.viaCab.idx === idx && !dentro.includes(t)) t.viaCab = null;
    dentro.forEach((t, k) => {
      t.viaCab = { idx, via: libres[k] || rotVias[k % Math.max(1, rotVias.length)] || "—" };
    });
  }
}

function aplicarSeparacion(g) {
  for (const dir of ["alcala", "pio"]) {
    const lista = g.trenes
      /* Los que están en vía desviada (apartados, rotando o cambiando material)
         no ocupan la vía general y no pueden bloquear a los de atrás.

         Tampoco lo hace un tren INMOVILIZADO por avería: está en la vía
         cortada, y los de su sentido pasan por la contraria. Si sigue en la
         cadena, todos los de atrás se apilan detrás de él y no avanza ninguno,
         que es justo lo que ocurría al declararse la avería.            */
      .filter((t) => t.estado !== "suprimido" && !t.enDesviada && !t.rotando && !t.inmovil && !(t.detenido && t.detenido.cambio))
      .map((t) => ({ t, pr: progresoDe(fase(t, g.reloj)) }))
      .filter((o) => o.pr && o.pr.dir === dir)
      .sort((a, b) => b.pr.x - a.pr.x);
    /* Se limpia la marca en todos, no solo en el primero: antes se quedaba
       pegada de un minuto anterior y la ficha seguía diciendo que el tren
       estaba bloqueado por otro cuando ya circulaba con normalidad.    */
    for (const o of lista) o.t.bloqueadoPor = null;
    for (let k = 1; k < lista.length; k++) {
      const lider = lista[k - 1];
      const seg = lista[k];
      const sep = separacionEn(seg.pr.x);
      const falta = sep - (lider.pr.x - seg.pr.x);
      if (falta > 0.05) {
        const ajuste = Math.min(falta, FRENADO_MAX);
        seg.t.retraso += ajuste;
        seg.pr.x -= ajuste;
        seg.t.acum.bloqueo = (seg.t.acum.bloqueo || 0) + ajuste;
        seg.t.bloqueadoPor = lider.t.i;
      } else seg.t.bloqueadoPor = null;
    }
  }
}

/* ── adelantamiento en estación ─────────────────────────────────
   Solo se puede adelantar apartando al tren retrasado a una vía
   desviada y dejando pasar al de atrás por la general.            */

/* Supresión ordenada por el jugador: el tren termina recorrido en una
   estación con apartadero libre, los viajeros transbordan al siguiente y el
   material queda estacionado, listo para entrar en taller.                */
function estacionesParaSuprimir(g, t) {
  if (!t.unidades.length) return [];
  const s = situacion(t, g.reloj);
  if (s.dir === "maniobra") return [];
  const serie = t.unidades[0].serie;
  const out = [];
  for (let i = 0; i < N; i++) {
    if (!ESTACIONES[i].apartVias || !viasLibres(g, i).length || !admiteSerie(i, serie)) continue;
    const eta = etaEnSentido(t, g.reloj, i, s.dir);
    if (eta < MIN_ANTELACION || eta > 150) continue;
    const sinServicio = ESTACIONES.filter((e2, j) => !e2.puesto && (s.dir === "alcala" ? j > i : j < i)).length;
    out.push({ idx: i, nombre: ESTACIONES[i].n, eta: Math.round(eta), via: viasLibres(g, i)[0], sinServicio });
  }
  return out.sort((a2, b2) => a2.eta - b2.eta);
}

/* Vías de apartado concretas disponibles por delante, para que el puesto de
   mando elija estación y vía al retirar material vacío.                    */
/* De noche el material también se deja en vías generales de las cabeceras,
   no solo en los apartaderos: Chamartín usa sus seis vías más los mangos,
   Príncipe Pío la 3, la 4 y la 30, y Alcalá sus desviadas y la general. */
/* Vías donde se puede estacionar de noche en una cabecera. El orden importa:
   primero los apartaderos y las vías sin tráfico, y solo después las de paso.
   Si se ocupaban las de paso antes que los mangos, Chamartín se quedaba sin
   vías por las que circular y los trenes se paraban allí para siempre.    */
function viasNocturnas(g, i, reservar = 0) {
  const e = ESTACIONES[i];
  if (!e.cab) return [];
  const ocupadas = new Set();
  for (const x of g.apartado[i] || []) ocupadas.add(x.via);
  for (const o of g.trenes) {
    if (o.viaCab && o.viaCab.idx === i) ocupadas.add(o.viaCab.via);
    if (o.viaPaso && o.viaPaso.idx === i) ocupadas.add(o.viaPaso.via);
    // una vía ya elegida por otro tren deja de estar libre aunque no haya
    // llegado todavía: si no, podía asignarse la misma a varios trenes
    if (o.supresion && o.supresion.idx === i && o.supresion.via) ocupadas.add(o.supresion.via);
  }
  const paso = Object.values(e.paso || {});
  const apart = (e.apartVias || []).filter((v) => !ocupadas.has(v));
  // las de paso se dejan para el final, y las habituales de circulación
  // (la 7 y la 11 de Chamartín) sólo si no queda ninguna otra
  const rot = (e.rotVias || []).filter((v) => !ocupadas.has(v) && !paso.includes(v));
  const rotPaso = (e.rotVias || []).filter((v) => !ocupadas.has(v) && paso.includes(v));

  // mientras siga habiendo circulación se reservan vías por las que pasar
  const libresParaPasar = rot.length + rotPaso.length;
  const cedibles = Math.max(0, libresParaPasar - reservar);
  const orden = [...apart, ...rot, ...rotPaso];
  return apart.length >= 1 || cedibles > 0 ? [...apart, ...[...rot, ...rotPaso].slice(0, cedibles)] : orden.slice(0, 0);
}

/* Chamartín tiene seis vías de paso. El material estacionado en ellas las
   inutiliza, así que los trenes que pasan tienen que usar las que queden y,
   si no hay ninguna, esperar a la entrada por orden de llegada.          */
function viasPasoLibres(g, i, excluir) {
  const e = ESTACIONES[i];
  const todas = e.rotVias || [];
  const ocupadas = new Set();
  for (const x of g.apartado[i] || []) ocupadas.add(x.via);
  for (const o of g.trenes) {
    if (o.i === excluir || o.estado === "suprimido") continue;
    if (o.viaPaso && o.viaPaso.idx === i) ocupadas.add(o.viaPaso.via);
    if (o.viaCab && o.viaCab.idx === i) ocupadas.add(o.viaCab.via);
  }
  return todas.filter((v) => !ocupadas.has(v));
}

function viasParaApartar(g, t) {
  if (!t.unidades.length) return [];
  const s2 = situacion(t, g.reloj);
  if (s2.dir === "maniobra") return [];
  const serie = t.unidades[0].serie;
  const out = [];
  for (let i = 0; i < N; i++) {
    const e = ESTACIONES[i];
    if ((!e.apartVias && !(TURNO_ID === "noche" && e.cab)) || !admiteSerie(i, serie)) continue;
    // de noche valen también las vías generales de las cabeceras
    const enLinea = g.trenes.filter((x) => x.estado !== "suprimido" && x.i !== t.i).length;
    const libres = TURNO_ID === "noche" && e.cab ? viasNocturnas(g, i, enLinea > 0 ? 2 : 0) : viasLibres(g, i);
    if (!libres.length) continue;
    /* Solo lo que le queda por delante en su recorrido actual. Sin esto se
       ofrecían estaciones que el tren ya había pasado, alcanzables únicamente
       tras invertir en cabecera y dar media vuelta: a un tren averiado entre
       Las Rozas y Majadahonda le salía Alcalá a 170 minutos.           */
    const porDelante = s2.dir === "alcala" ? i > s2.idx : i < s2.idx;
    if (!porDelante) continue;
    const eta = etaEnSentido(t, g.reloj, i, s2.dir);
    /* Sin margen mínimo de antelación. Ese margen existe para preparar el
       itinerario de una rotación programada, pero ante una avería lo que
       cuenta es despejar la vía cuanto antes: si el apartadero está a un
       minuto, mejor todavía.                                            */
    if (eta > 200) continue;
    out.push({ idx: i, nombre: e.n, eta: Math.max(1, Math.round(eta)), vias: libres });
  }
  return out.sort((a2, b2) => a2.eta - b2.eta);
}

function estacionesParaApartar(g, t) {
  const s = situacion(t, g.reloj);
  if (s.dir === "maniobra") return [];
  const out = [];
  for (let i = 0; i < N; i++) {
    if (!ESTACIONES[i].rot || !viasManiobra(g, i).length) continue;
    const eta = etaEnSentido(t, g.reloj, i, s.dir);
    if (eta < 2 || eta > 60) continue;
    const libres = viasManiobra(g, i);
    out.push({ idx: i, nombre: ESTACIONES[i].n, eta: Math.round(eta), via: libres[0], libres });
  }
  return out.sort((a, b) => a.eta - b.eta);
}

// tren inmediatamente anterior o posterior en el mismo sentido
function vecinos(g, t) {
  const pr = progresoDe(fase(t, g.reloj));
  if (!pr) return { delante: null, detras: null };
  let delante = null;
  let detras = null;
  for (const o of g.trenes) {
    if (o.i === t.i || o.estado === "suprimido") continue;
    const q = progresoDe(fase(o, g.reloj));
    if (!q || q.dir !== pr.dir) continue;
    if (q.x > pr.x && (!delante || q.x < progresoDe(fase(delante, g.reloj)).x)) delante = o;
    if (q.x < pr.x && (!detras || q.x > progresoDe(fase(detras, g.reloj)).x)) detras = o;
  }
  const dx = (o) => (o ? Math.abs(progresoDe(fase(o, g.reloj)).x - pr.x) : null);
  return { delante, detras, dDelante: dx(delante), dDetras: dx(detras) };
}

/* ── cambio de material en estación ─────────────────────────────
   Un tren averiado puede cambiar de composición donde haya material
   apartado útil y personal de reserva. Preparar la maniobra lleva 30
   min desde que se ordena, y el trasvase de viajeros otros 5.       */

const PREP_CAMBIO = 30;
const TRASVASE = 5;
const MANIOBRA_APARTADO = 30; // lo que ocupa al reserva que retira el material

// minutos hasta que el tren pase por la estación i en su sentido actual
function etaEnSentido(t, reloj, i, dir) {
  const q = dir === "alcala" ? ESTACIONES[i].t : LLEGA_PIO - ESTACIONES[i].t;
  return (((q - fase(t, reloj)) % CICLO) + CICLO) % CICLO;
}

// estaciones por delante donde se puede cambiar material, ordenadas por llegada
function puntosCambio(g, t) {
  const s = situacion(t, g.reloj);
  const dir = s.dir === "maniobra" ? "alcala" : s.dir;
  const out = [];
  const serieDef = t.unidades.length ? t.unidades[0].serie : null;
  for (let i = 0; i < N; i++) {
    const e = ESTACIONES[i];
    if (!e.cab || !e.apartVias || e.puesto) continue;
    const lote = (g.apartado[i] || []).find((x) => !x.averiado);
    if (!lote || !reservasEn(g, e.cab).length) continue;
    // el material averiado ocupará esa vía: la estación debe admitir su serie
    if (serieDef && !admiteSerie(i, serieDef)) continue;
    const eta = etaEnSentido(t, g.reloj, i, dir);
    if (eta > 120) continue;
    const espera = Math.max(0, PREP_CAMBIO - eta);
    out.push({ idx: i, cab: e.cab, nombre: e.n, eta: Math.round(eta), espera: Math.round(espera), total: Math.round(espera + TRASVASE), lote });
  }
  return out.sort((a, b) => a.eta - b.eta);
}

/* ── duración de las incidencias ────────────────────────────────
   Ninguna dura lo mismo dos veces. Antes cada incidencia tenía un
   número fijo y a la segunda partida ya sabías cuánto iba a durar
   un enganchón de catenaria, con lo que se perdía la incertidumbre
   que es justo lo que hace difícil gestionarlas.                  */

// duración real: entre el 65 % y el 135 % de la prevista
const durIncid = (base) => Math.round(base * (0.65 + Math.random() * 0.7));

/* Lo que se le dice al jugador es una estimación, no el dato exacto:
   Adif tampoco da una hora cerrada cuando ocurre de verdad.       */
function prevision(m) {
  if (m < 45) return "menos de una hora";
  if (m < 75) return "en torno a una hora";
  if (m < 105) return "hora y media aproximadamente";
  if (m < 140) return "unas dos horas";
  if (m < 175) return "entre dos y tres horas";
  if (m < 220) return "unas tres horas";
  return "más de tres horas";
}

/* ── gravedad de las averías ────────────────────────────────────
   Toda avería tiene además un grado. El desgaste de la unidad empuja
   hacia lo grave y el conocimiento del maquinista tira hacia lo leve. */

const SOCORRO_MIN = 20; // maniobra de acoplamiento y arrastre

const GRAVEDAD = {
  leve: { n: "leve", peso: 45, txt: "El tren puede continuar sin restricciones." },
  habitual: { n: "habitual", peso: 33, txt: "El tren puede continuar, pero con restricciones." },
  grave: { n: "grave", peso: 17, txt: "El tren no puede seguir en servicio, pero llega a una estación." },
  muygrave: { n: "muy grave", peso: 5, txt: "El tren queda inútil donde está y no puede moverse." },
};

/* Hay averías cuya gravedad depende de la hora. El alumbrado de gran
   intensidad es intrascendente con luz natural, pero de noche es lo que
   permite ver la vía y ser visto: nunca puede quedarse en leve.        */
function esDeNoche(reloj) {
  const h = ((reloj % (24 * 60)) + 24 * 60) % (24 * 60);
  return h >= 21 * 60 || h < 8 * 60;
}

function sortearGravedad(u, maq, tipo = null, reloj = null) {
  const desg = u ? u.desgaste : 50;
  const con = maq ? maq.con : 50;
  // por encima de 1 se agrava, por debajo se suaviza
  const f = Math.max(0.35, 1 + ((desg - 50) / 100) * 0.8 - ((con - 50) / 100) * 0.5);
  const noche = tipo && tipo.deNoche && reloj !== null && esDeNoche(reloj);

  /* Cada avería puede declarar su propio reparto de grados: no todas se
     comportan igual. El desgaste y el conocimiento del maquinista siguen
     inclinándolo, así que una unidad castigada sigue rompiendo peor.  */
  if (tipo && tipo.reparto) {
    const p2 = {};
    for (const [k, v] of Object.entries(tipo.reparto)) p2[k] = k === "leve" ? v / f : k === "habitual" ? v : v * f;
    const t2 = Object.values(p2).reduce((n, v) => n + v, 0);
    let y = Math.random() * t2;
    for (const [k, v] of Object.entries(p2)) {
      y -= v;
      if (y <= 0) return k;
    }
    return Object.keys(tipo.reparto)[0];
  }

  const pesos = {
    // hay averías que no admiten grado leve: el reparto se hace sin él
    leve: (tipo && tipo.sinLeve) || noche ? 0 : GRAVEDAD.leve.peso / f,
    habitual: noche ? 0 : GRAVEDAD.habitual.peso,
    grave: GRAVEDAD.grave.peso * f,
    muygrave: GRAVEDAD.muygrave.peso * f,
  };
  const tot = Object.values(pesos).reduce((n, v) => n + v, 0);
  let x = Math.random() * tot;
  for (const [k, v] of Object.entries(pesos)) {
    x -= v;
    if (x <= 0) return k;
  }
  return "leve";
}

/* ── tipos de avería de material ────────────────────────────── */

const desacople = (c, extra = 8) =>
  c.doble ? { label: `Desacoplar la ${c.u.id}`, detalle: "Sigue en servicio con la mitad de plazas", ef: { desacoplar: { i: c.i, u: c.u.id }, retraso: { i: c.i, m: extra } } } : null;

// dos opciones de cambio de material: siguiendo el titular o con un reserva
function opcionesCambio(c) {
  const pts = puntosCambio(c.g, c.tr).slice(0, 2);
  if (!pts.length) return [];
  const m = c.tr.maq ? c.g.personal.find((x) => x.id === c.tr.maq) : null;
  const out = [];

  pts.forEach((pt, k) => {
    const condFinal = m ? m.cond + pt.eta + pt.total : 0;
    const pasado = m && condFinal > COND_MAX;
    const libres = reservasEn(c.g, pt.cab).length;
    out.push({
      label: `Cambiar material en ${pt.nombre}`,
      detalle: `llega en ${pt.eta} min · +${pt.total} min · ${pt.lote.unidades.map((u) => u.id).join(" + ")} · sigue ${m ? m.nombre : "el titular"}${
        pasado ? ` — llegaría a ${dur(condFinal)}` : ""
      }`,
      ef: { cambioMaterial: { i: c.i, idx: pt.idx, conReserva: false } },
    });
    // el relevo simultáneo solo para el punto más cercano, y si sobra personal
    if (k === 0 && libres >= 2)
      out.push({
        label: `Cambiar material en ${pt.nombre} y relevar`,
        detalle: `llega en ${pt.eta} min · +${pt.total} min · lo toma un reserva · quedarían ${libres - 2} en ${pt.cab}`,
        ef: { cambioMaterial: { i: c.i, idx: pt.idx, conReserva: true } },
      });
  });
  return out;
}

const retirada = (c, m = 3) => ({
  label: "Terminar recorrido y retirar en cabecera",
  detalle: "Llega a cabecera y se pierde la circulación",
  ef: { retirarCabecera: c.i, retraso: { i: c.i, m } },
});

const AVERIAS_MATERIAL = [
  {
    id: "traccion", nombre: "Avería de tracción", p: 20, inmoviliza: true,
    /* La pérdida de tracción va por convertidores: uno, dos, o todos. No tiene
       grado habitual: perder un convertidor es leve, perder dos ya obliga a
       sacar el tren del servicio, y perderlos todos lo deja clavado.    */
    grados: ["leve", "grave", "muygrave"],
    reparto: { leve: 70, grave: 25, muygrave: 5 },
    leve: (c) => ({
      texto: "El tren se queda sin un convertidor de tracción. Irá al 75 % de su capacidad de aceleración.",
      opciones: [
        {
          label: "Continuar el servicio",
          detalle: "Pierde tiempo de forma continuada, con un 5 % de que la avería vaya a más",
          ef: { degradada: { i: c.i, min: 5, cada: 90, agrava: 0.05, tipo: "traccion" } },
        },
        ...opcionesCambio(c).filter((o) => !o.ef.cambioMaterial.conReserva),
      ],
    }),
    grave: (c) => ({
      texto: "El tren se queda sin dos de sus convertidores de tracción. Irá al 50 % de su capacidad de aceleración.",
      opciones: [
        {
          label: "Continuar el servicio",
          detalle: "Pierde tiempo de forma continuada, con un 5 % de que la avería vaya a más",
          ef: { degradada: { i: c.i, min: 15, cada: 90, agrava: 0.05, tipo: "traccion" } },
        },
        ...opcionesCambio(c)
          .filter((o) => !o.ef.cambioMaterial.conReserva)
          .map((o) => ({ ...o, label: o.label.replace("Cambiar material", "Cambio de material") })),
        {
          label: "Terminar recorrido y apartar el material",
          detalle: "Se elige dónde y en qué vía queda estacionado · se pierde la circulación",
          ef: { averiaGrave: { i: c.i } },
        },
      ],
    }),
    muygrave: (c) => ({
      texto: "Pérdida total de esfuerzo de tracción. El tren queda inútil donde está, sin capacidad de moverse por sus propios medios.",
      opciones: [
        {
          label: "Enviar ATLs de urgencia y banalizar hasta la resolución",
          detalle: "Los mecánicos tardan en llegar y no siempre lo resuelven; mientras, vía única en el tramo",
          tiempo: [15, 25],
          ef: { atls: { i: c.i } },
        },
        {
          label: "Banalizar el tramo, realizar transbordo y enviar socorro",
          detalle: "El pasaje transborda al primer tren del mismo sentido y se manda material a recogerlo",
          tiempo: [25, 45],
          ef: { rescate: { i: c.i } },
        },
      ],
    }),
    gen: (c) => ({
      texto: "Pérdida de esfuerzo de tracción: el tren no puede mantener la marcha prevista.",
      opciones: [
        desacople(c, 8),
        ...opcionesCambio(c),
        retirada(c, 4),
        { label: "Continuar con la avería", detalle: "Riesgo de quedar detenido en plena vía", ef: { retraso: { i: c.i, m: 5 }, riesgo: { i: c.i, p: 0.35 } } },
      ],
    }),
  },
  {
    id: "freno", nombre: "Avería de freno", p: 20, inmoviliza: true,
    /* Mismo esqueleto que la tracción: tres grados, marcha degradada mientras
       se pueda circular, y rescate cuando el tren queda clavado.        */
    grados: ["leve", "grave", "muygrave"],
    reparto: { leve: 70, grave: 25, muygrave: 5 },
    leve: (c) => ({
      texto: "Un bogie del tren se queda enfrentado. Es necesario desahogarlo y anularlo. El tren, al no contar con todo su porcentaje de freno, tiene que reducir la velocidad.",
      opciones: [
        {
          label: "Continuar el servicio",
          detalle: "Pierde tiempo de forma continuada, con un 5 % de que la avería vaya a más",
          ef: { degradada: { i: c.i, min: 5, cada: 90, agrava: 0.05, tipo: "freno" } },
        },
        ...opcionesCambio(c).filter((o) => !o.ef.cambioMaterial.conReserva),
      ],
    }),
    grave: (c) => ({
      texto: "Avería del compresor principal de la unidad. El maquinista realiza un reset de batería del tren, pero desconoce si no volverá a producirse.",
      opciones: [
        {
          label: "Continuar el servicio",
          detalle: "Pierde tiempo de forma continuada, con un 5 % de que la avería vaya a más",
          ef: { degradada: { i: c.i, min: 15, cada: 90, agrava: 0.05, tipo: "freno" } },
        },
        ...opcionesCambio(c)
          .filter((o) => !o.ef.cambioMaterial.conReserva)
          .map((o) => ({ ...o, label: o.label.replace("Cambiar material", "Cambio de material") })),
        {
          label: "Terminar recorrido y apartar el material",
          detalle: "Se elige dónde y en qué vía queda estacionado · se pierde la circulación",
          ef: { averiaGrave: { i: c.i } },
        },
      ],
    }),
    muygrave: (c) => ({
      texto:
        "El tren ha frenado de urgencia porque se ha activado el presostato de mínima. El compresor ha dejado de producir aire y es incapaz de levantar el freno. El maquinista no encuentra la solución y el tren se mantiene detenido.",
      opciones: [
        {
          label: "Enviar ATLs de urgencia y banalizar hasta la resolución",
          detalle: "Los mecánicos tardan en llegar y no siempre lo resuelven; mientras, vía única en el tramo",
          tiempo: [15, 25],
          ef: { atls: { i: c.i } },
        },
        {
          label: "Banalizar el tramo, realizar transbordo y enviar socorro",
          detalle: "El pasaje transborda al primer tren del mismo sentido y se manda material a recogerlo",
          tiempo: [25, 45],
          ef: { rescate: { i: c.i } },
        },
      ],
    }),
  },
  {
    /* Primera avería reformulada: cada grado trae su propio texto y sus
       propias opciones, en vez de heredar las genéricas del grado. Una
       climatización no puede inmovilizar un tren, así que no tiene grado
       muy grave y nunca ofrece socorro.                                  */
    id: "clima", nombre: "Avería de climatización", p: 20,
    grados: ["leve", "grave"],
    leve: (c) => ({
      texto: "La climatización deja de funcionar en uno de los coches. El resto de la composición mantiene la temperatura.",
      opciones: [
        {
          label: "Continuar el servicio",
          detalle: "El maquinista lo anota en el libro de averías y sigue el trayecto",
          tiempo: [1, 3],
          ef: { retraso: { i: c.i, m: retrasoRango(1, 3, c.mq) } },
        },
        // solo el cambio de material, sin la variante que aprovecha para relevar
        ...opcionesCambio(c).filter((o) => !o.ef.cambioMaterial.conReserva),
      ],
    }),
    /* Dos averías distintas comparten el grado grave, y se sortean al 50 %:
       una afecta al pasaje y otra al maquinista.                        */
    grave: (c) =>
      Math.random() < 0.5
        ? {
            texto: "La climatización de la cabina deja de funcionar. El maquinista te llama para comunicarte que no se puede conducir con esas condiciones.",
            opciones: [
              ...opcionesCambio(c)
                .filter((o) => !o.ef.cambioMaterial.conReserva)
                .map((o) => ({
                ...o,
                detalle: `${o.detalle} · el maquinista puede negarse a continuar`,
                // el cambio pasa por la conformidad del maquinista
                ef: { cabinaCambio: { i: c.i, ...o.ef.cambioMaterial } },
              })),
              {
                label: "El tren se queda inútil en la primera estación posible",
                detalle: "Los viajeros bajan y el material queda apartado allí mismo",
                ef: { averiaGrave: { i: c.i } },
              },
            ],
          }
        : {
      texto: "La climatización deja de funcionar en toda la composición.",
      opciones: [
        /* Cambio de material: el jugador elige en qué estación, con el
           transbordo de viajeros que ya estaba implementado.            */
        ...opcionesCambio(c).filter((o) => !o.ef.cambioMaterial.conReserva),
        {
          label: "Continuar el resto del turno con el mismo material",
          detalle: "Sin pérdida de tiempo, pero el viaje se hace muy incómodo y puede acabar en altercado",
          ef: { retraso: { i: c.i, m: retrasoRango(1, 3, c.mq) }, calidad: -22, climaSinResolver: c.i },
        },
        {
          label: "Suprimir el tren y continuar como material vacío",
          detalle: "Los viajeros bajan en la próxima parada y el tren circula vacío hasta donde se aparte",
          tiempo: [4, 9],
          ef: { retraso: { i: c.i, m: retrasoRango(4, 9, c.mq) }, circularVacio: { i: c.i } },
        },
      ],
          },
  },
  {
    id: "asfa", nombre: "Avería de ASFA", p: 5,
    leve: "Tras realizar un reset completo del equipo ASFA, se normaliza la avería.",
    gen: (c) => ({
      texto: "El equipo de seguridad ASFA queda fuera de servicio: no hay supervisión de señales.",
      opciones: [
        { label: "Continuar con agente acompañante", detalle: "Ocupa un maquinista de reserva el resto del turno", ef: { acompanante: c.i, limitacion: { i: c.i, m: 3 } } },
        ...opcionesCambio(c),
        retirada(c, 3),
      ],
    }),
  },
  {
    // sin dispositivo de vigilancia no cabe seguir como si nada: nunca es leve
    id: "hombremuerto", nombre: "Avería del Hombre Muerto", p: 5, sinLeve: true,
    gen: (c) => ({
      texto: "El dispositivo de vigilancia del conductor no responde. No puede circular con un solo agente en cabina.",
      opciones: [
        { label: "Continuar con agente acompañante", detalle: "Ocupa un maquinista de reserva el resto del turno", ef: { acompanante: c.i } },
        ...opcionesCambio(c),
        retirada(c, 3),
      ],
    }),
  },
  {
    id: "registrador", nombre: "Avería del Registrador Jurídico", p: 5,
    leve: "Se realiza un reset completo de la unidad y se normaliza el Registrador Jurídico.",
    gen: (c) => ({
      texto: "El registrador deja de grabar los parámetros de conducción. Sin él la circulación no está autorizada.",
      opciones: [desacople(c, 5), ...opcionesCambio(c), retirada(c, 2)],
    }),
  },
  {
    id: "puertas", nombre: "Avería de puertas", p: 15,
    leve: "La puerta averiada termina cerrando y dando comprobación de puertas tras numerosos intentos por que cierre.",
    gen: (c) => ({
      texto: "Una puerta no confirma el cierre. El tren no puede iniciar la marcha hasta condenarla.",
      opciones: [
        { label: "Condenar la puerta y continuar", detalle: "Paradas más largas el resto del turno", ef: { limitacion: { i: c.i, m: 2 }, retraso: { i: c.i, m: 5 }, afectABordo: c.i } },
        desacople(c, 7),
        ...opcionesCambio(c),
        retirada(c, 4),
      ],
    }),
  },
  {
    // de noche el alumbrado deja de ser un detalle: solo grave o muy grave
    id: "alumbrado", nombre: "Avería del alumbrado de gran intensidad", p: 2, deNoche: true,
    gen: (c) => ({
      texto: "Sin faros de largo alcance. En el tramo soterrado hay que circular con precaución.",
      opciones: [
        { label: "Continuar con precaución en el túnel", detalle: "Pierde tiempo en cada paso por Recoletos", ef: { limitacion: { i: c.i, m: 4 } } },
        ...opcionesCambio(c),
        retirada(c, 2),
      ],
    }),
  },
  {
    id: "trentierra", nombre: "Avería del equipo Tren-Tierra", p: 3,
    leve: "Se informa al Puesto de Mando del número de teléfono de empresa del maquinista para que se puedan comunicar por esa vía.",
    gen: (c) => ({
      texto: "El tren pierde la comunicación por radio con el puesto de mando.",
      opciones: [
        ...opcionesCambio(c),
        retirada(c, 2),
        { label: "Continuar con comunicación por teléfono", detalle: "Solución provisional, respuesta más lenta ante cualquier aviso", ef: { limitacion: { i: c.i, m: 2 }, riesgo: { i: c.i, p: 0.12 } } },
      ],
    }),
  },
  {
    id: "velocimetro", nombre: "Avería del velocímetro", p: 5,
    gen: (c) => ({
      texto: "El maquinista se queda sin indicación de velocidad en cabina.",
      opciones: [
        { label: "Continuar con marcha limitada", detalle: "Pierde tiempo en cada recorrido", ef: { limitacion: { i: c.i, m: 5 } } },
        ...opcionesCambio(c),
        retirada(c, 3),
      ],
    }),
  },
];

const ORDEN_PUBLICO = [
  {
    id: "alarma", nombre: "Accionamiento indebido de aparato de alarma", p: 40,
    gen: (c) => ({
      texto: "Alguien acciona el aparato de alarma sin motivo. El tren queda inmovilizado hasta que el maquinista lo repone.",
      opciones: [
        {
          label: "Reponer el aparato y reanudar la marcha",
          detalle: "El maquinista lo rearma y continúa, pero hay posibilidad de que vuelva a suceder",
          ef: { retraso: { i: c.i, m: 4 }, repiteAlarma: c.i },
        },
        {
          label: "Reponer el aparato y mandar a Seguridad",
          detalle: "Cuesta dos minutos más, pero no vuelve a ocurrir en ese tren",
          ef: { retraso: { i: c.i, m: 6 } },
        },
      ],
    }),
  },
  {
    id: "puerta", nombre: "Desbloqueo de una puerta", p: 24,
    gen: (c) => ({
      texto: "Un viajero acciona el desbloqueo de emergencia y abre una puerta. El tren no puede circular hasta asegurarla.",
      opciones: [
        { label: "Condenar la puerta y continuar", detalle: "Paradas más largas el resto del turno", ef: { retraso: { i: c.i, m: 6 }, limitacion: { i: c.i, m: 2 }, afectABordo: c.i } },
        { label: "Retirar el tren para revisión", detalle: "Se pierde la circulación", ef: { retirarCabecera: c.i, retraso: { i: c.i, m: 3 } } },
      ],
    }),
  },
  {
    /* Los carteristas no paran el tren: enfrentan puntualidad contra viajeros,
       que es una decisión distinta a todas las demás del juego.          */
    id: "carteristas", nombre: "Carteristas a bordo", p: 20,
    gen: (c) => ({
      texto: "El maquinista detecta a un grupo de carteristas actuando entre los viajeros.",
      opciones: [
        {
          label: "Aviso por megafonía",
          detalle: "Apenas cuesta tiempo, pero rara vez sirve y la calidad del servicio se resiente",
          ef: { retraso: { i: c.i, m: 2 }, carteristas: { i: c.i, exito: 0.15 }, calidad: -18 },
        },
        {
          label: "Mandar seguridad en la próxima estación",
          detalle: "Suele bastar, y la parada se alarga",
          ef: { retraso: { i: c.i, m: 5 + Math.floor(Math.random() * 11) }, carteristas: { i: c.i, exito: 0.8 }, calidad: -4 },
        },
        {
          label: "Mandar policía en la próxima estación",
          detalle: "Lo resuelve siempre, pero inmoviliza el tren un buen rato",
          ef: { retraso: { i: c.i, m: 10 + Math.floor(Math.random() * 16) } },
        },
      ],
    }),
  },
  {
    id: "conflictivo", nombre: "Desalojo de viajero conflictivo", p: 16,
    gen: (c) => ({
      texto: "Altercado a bordo. Se requiere la intervención de seguridad para desalojar al viajero.",
      opciones: [
        {
          label: "Esperar a seguridad en la estación",
          // lo que tarde la dotación no se sabe de antemano
          detalle: "El tren queda retenido hasta la intervención, entre 8 y 20 min",
          ef: { retraso: { i: c.i, m: 8 + Math.floor(Math.random() * 13) } },
        },
        {
          label: "Continuar hasta estación con dotación",
          detalle: "Menos retraso, pero el altercado sigue a bordo y puede ir a más",
          ef: { retraso: { i: c.i, m: 5 }, altercado: c.i },
        },
      ],
    }),
  },
];

function sortearSub(tabla) {
  const total = tabla.reduce((n, a) => n + a.p, 0);
  let x = Math.random() * total;
  for (const a of tabla) {
    x -= a.p;
    if (x <= 0) return a;
  }
  return tabla[0];
}

// el conocimiento del maquinista mitiga o agrava lo que cuesta la avería
function escalarOpciones(opciones, f) {
  if (f === 1) return opciones;
  const esc = (v, min = 1) => Math.max(min, Math.round(v * f));
  return opciones.map((o) => {
    const ef = { ...o.ef };
    if (ef.retraso) ef.retraso = { ...ef.retraso, m: esc(ef.retraso.m) };
    if (ef.limitacion) ef.limitacion = { ...ef.limitacion, m: esc(ef.limitacion.m) };
    if (ef.afect) ef.afect = Math.round(ef.afect * f);
    if (ef.riesgo) ef.riesgo = { ...ef.riesgo, p: Math.min(0.9, ef.riesgo.p * f) };
    return { ...o, ef };
  });
}

function sortearAveria() {
  const total = AVERIAS_MATERIAL.reduce((n, a) => n + a.p, 0);
  let x = Math.random() * total;
  for (const a of AVERIAS_MATERIAL) {
    x -= a.p;
    if (x <= 0) return a;
  }
  return AVERIAS_MATERIAL[0];
}

/* ── incidencias ────────────────────────────────────────────── */

function trenPorFiabilidad(g) {
  const cand = g.trenes.filter((t) => t.estado !== "suprimido" && t.unidades.length);
  if (!cand.length) return null;
  const pesos = cand.map((t) => {
    const mq = t.maq ? maqDe(g, t) : null;
    return Math.pow(1 - fiabDe(t), 1.4) * factorAveria(mq);
  });
  const total = pesos.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < cand.length; i++) {
    r -= pesos[i];
    if (r <= 0) return cand[i];
  }
  return cand[cand.length - 1];
}

const POOL = [
  {
    id: "averia",
    gen: (g) => {
      const tr = trenPorFiabilidad(g);
      if (!tr) return null;
      const u = pick(tr.unidades);
      const doble = tr.unidades.length > 1;
      const donde = ESTACIONES[Math.min(N - 1, Math.round(situacion(tr, g.reloj).idx))].n;
      const num = numeroTren(tr, g.reloj);
      const mq = tr.maq ? g.personal.find((x) => x.id === tr.maq) : null;
      const ctx = { g, tr, u, doble, donde, num, i: tr.i, mq: tr.maq ? g.personal.find((x) => x.id === tr.maq) : null };
      const tipo = sortearAveria();

      // un maquinista con conocimiento puede resolverla sobre la marcha
      if (mq && Math.random() < probResolver(mq)) {
        log(g, "ok", `${mq.nombre} resuelve en marcha ${tipo.nombre.toLowerCase()} de la ${u.id} en el ${num}. Sin consecuencias.`);
        return null;
      }

      let grav = sortearGravedad(u, mq, tipo, g.reloj);
      /* Si la avería declara qué grados puede tener, se respeta: una
         climatización no inmoviliza un tren y no debe salir muy grave. */
      if (tipo.grados && !tipo.grados.includes(grav)) {
        /* Se reconduce al grado disponible más cercano hacia arriba, y si no
           lo hay, hacia abajo: un "habitual" en una avería que no lo tiene
           pasa a grave, no a leve.                                      */
        const escala = ["leve", "habitual", "grave", "muygrave"];
        const k = escala.indexOf(grav);
        const arriba = escala.slice(k + 1).find((x) => tipo.grados.includes(x));
        const abajo = escala.slice(0, k).reverse().find((x) => tipo.grados.includes(x));
        grav = arriba || abajo || tipo.grados[0];
      }
      /* La ficha técnica va como dato aparte, no dentro del relato: son tres
         valores que se consultan de un vistazo, no se leen.             */
      const datos = [
        { k: "Unidad", v: u.id },
        { k: "Desgaste", v: `${Math.round(u.desgaste)} %`, c: colDesgaste(u.desgaste) },
        { k: "Fiabilidad", v: `${Math.round(u.fiab * 100)} %`, c: u.fiab >= 0.95 ? P.ok : u.fiab >= 0.9 ? P.warn : P.alert },
      ];

      /* Camino nuevo: la avería declara texto y opciones para cada grado. El
         marco genérico de más abajo queda solo para las que aún no se han
         reformulado, y esas sí tienen 'gen'.                             */
      // queda anotada en el libro de la unidad, resuelta o no
      if (!g.averiasTurno) g.averiasTurno = [];
      g.averiasTurno.push({ id: u.id, tipo: tipo.id, nombre: tipo.nombre, grado: grav, m: Math.round(g.reloj), turno: g.turnoN, resuelta: false });

      const propio = typeof tipo[grav] === "function" ? tipo[grav](ctx) : null;
      if (propio) {
        return {
          titulo: `${tipo.nombre} en el ${num}`,
          lugar: donde,
          datos,
          texto: propio.texto,
          grav: grav === "leve" ? "leve" : grav === "muygrave" ? "critica" : "grave",
          opciones: propio.opciones,
        };
      }

      const av = tipo.gen ? tipo.gen(ctx) : null;
      if (!av) return null;
      const cab = { leve: P.ok, habitual: P.warn, grave: P.alert, muygrave: P.alert }[grav];
      const base = av.texto;

      let opciones;
      if (grav === "leve") {
        opciones = [
          {
            label: "Continuar el servicio",
            // cada avería puede explicar por qué en grado leve se puede seguir
            detalle: tipo.leve || "Sin restricciones, solo el tiempo perdido en el reconocimiento",
            ef: { retraso: { i: tr.i, m: 3 } },
          },
          ...opcionesCambio(ctx),
        ];
      } else if (grav === "habitual") {
        opciones = av.opciones.filter(Boolean);
      } else if (grav === "grave") {
        opciones = [
          { label: "Terminar recorrido y apartar el material", detalle: "El tren llega a la primera estación con apartadero y queda estacionado", ef: { averiaGrave: { i: tr.i } } },
          ...opcionesCambio(ctx),
          desacople(ctx, 8),
          retirada(ctx, 4),
        ].filter(Boolean);
      } else if (tipo.inmoviliza) {
        // el tren no puede moverse por sus medios
        opciones = [
          { label: "Pedir socorro al tren de detrás", detalle: `${SOCORRO_MIN} min de maniobra y el socorrista pierde ese tiempo`, ef: { socorro: { i: tr.i } } },
          { label: "Cortar la vía y banalizar", detalle: "El material queda donde está y los dos sentidos comparten la otra vía", ef: { corteVia: { i: tr.i } } },
        ];
      } else {
        /* El tren sí puede moverse, pero no con viajeros: se desalojan en la
           primera parada y circula en vacío hasta donde pueda apartarse. */
        opciones = [
          {
            label: "Desalojar y circular en vacío hasta apartar",
            detalle: "Los viajeros bajan en la próxima parada y el tren puede continuar como material vacío hasta una estación donde se pueda apartar",
            ef: { circularVacio: { i: tr.i } },
          },
          { label: "Pedir socorro al tren de detrás", detalle: `${SOCORRO_MIN} min de maniobra y el socorrista pierde ese tiempo`, ef: { socorro: { i: tr.i } } },
        ];
      }

      return {
        titulo: `${tipo.nombre} en el ${num}`,
        lugar: donde,
        datos,
        // sin repetir el grado: ya lo dice la cabecera de la tarjeta
        texto: `${av.texto} ${GRAVEDAD[grav].txt}`,
        color: cab,
        /* La avería trae su propio grado del sorteo, así que manda sobre el de
           la familia: una climatización leve no es lo mismo que un freno que
           deja el tren clavado en plena vía.                            */
        grav: grav === "leve" ? "leve" : grav === "muygrave" ? "critica" : "grave",
        opciones: escalarOpciones(opciones, factorConsec(mq)),
      };
    },
  },
  {
    id: "indispuesto",
    gen: (g) => {
      const cand = g.trenes.filter((t) => t.estado !== "suprimido" && t.maq);
      if (!cand.length) return null;
      const tr = pick(cand);
      const m = g.personal.find((x) => x.id === tr.maq);
      const e = etaPrimeraCabecera(tr, g.reloj);
      return {
        titulo: `${m.nombre} se encuentra indispuesto`,
        tren: tr.i,
        lugar: `próxima cabecera: ${e.cab}`,
        texto: `El maquinista del ${numeroTren(tr, g.reloj)} no puede continuar. La primera cabecera es ${e.cab}, a ${Math.round(e.min)} minutos.`,
        opciones: [
          { label: `Relevo inmediato en ${e.cab}`, detalle: "Consume una reserva antes de lo previsto", ef: { relevoInmediato: tr.i, retirarMaq: m.id } },
          { label: "Terminar recorrido en cabecera", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: tr.i, retirarMaq: m.id } },
        ],
      };
    },
  },
  {
    id: "ltv",
    gen: () => {
      const dur = durIncid(150); // varía en cada aparición
      const tr = tramoAlAzar(false);
      return {
        titulo: `Limitación de velocidad ${tr.txt}`,
        lugar: tr.txt.replace(/^(entre|en) /, ""),
        datos: [
          { k: "Tramo", v: tr.txt.replace(/^(entre|en) /, "") },
          { k: "Afecta a", v: "cada paso" },
          { k: "Previsión", v: prevision(dur), c: P.warn },
        ],
        texto: `Adif impone una LTV por el estado de la vía. Cada tren que atraviese el tramo pierde tiempo mientras dure. Se estima ${prevision(dur)} de afectación.`,
        opciones: [
          { label: "Mantener todas las circulaciones", detalle: "Se conserva la frecuencia, el retraso se acumula", ef: { restriccion: { idx: tr.idx, m: 4, dur: dur, txt: `LTV ${tr.txt}` } } },
        ],
      };
    },
  },
  {
    id: "viajero",
    gen: (g) => {
      const cand = g.trenes.filter((t) => t.estado !== "suprimido");
      if (!cand.length) return null;
      const tr = pick(cand);
      const donde = ESTACIONES[Math.min(N - 1, Math.round(situacion(tr, g.reloj).idx))].n;
      return {
        titulo: `Viajero indispuesto en el ${numeroTren(tr, g.reloj)}`,
        lugar: donde,
        tren: tr.i,
        texto: `Se solicita asistencia sanitaria en ${donde}. El tren queda detenido en andén hasta la llegada del servicio médico.`,
        opciones: [
          { label: "Esperar a los servicios sanitarios", detalle: "Retraso propio y del que viene detrás", ef: { retraso: { i: tr.i, m: 11 } } },
          { label: "Desalojar y apartar el tren", detalle: "Se libera la vía, se pierde la circulación", ef: { suprimir: tr.i, afectABordo: tr.i } },
        ],
      };
    },
  },
  {
    id: "cable",
    gen: () => {
      const dur = durIncid(180); // varía en cada aparición
      const tr = tramoAlAzar(true);
      return {
        titulo: `Robo de cable ${tr.txt}`,
        lugar: tr.txt.replace(/^(entre|en) /, ""),
        datos: [
          { k: "Tramo", v: tr.txt.replace(/^(entre|en) /, "") },
          { k: "Señalización", v: "sin servicio", c: P.alert },
          { k: "Previsión", v: prevision(dur), c: P.alert },
        ],
        texto: "Sustracción de conductor de señalización. Sin protección, los trenes solo pueden circular con marcha a la vista por el tramo.",
        opciones: [
          { label: "Marcha a la vista en el tramo", detalle: `Todo tren que pase pierde tiempo · ${prevision(dur)}`, ef: { restriccion: { idx: tr.idx, m: 7, dur: dur, txt: `Marcha a la vista ${tr.txt}` }, afectLinea: 0.5 } },
          { label: "Transbordo por carretera en el tramo", detalle: "Autobuses lanzadera, coste elevado", ef: { restriccion: { idx: tr.idx, m: 3, dur: dur, txt: `Transbordo ${tr.txt}` }, coste: 6800, afect: 400 } },
        ],
      };
    },
  },
  {
    id: "afluencia",
    gen: (g) => {
      const cand = g.trenes.filter((t) => t.estado !== "suprimido");
      if (!cand.length) return null;
      const donde = estacionPonderada();
      const proximos = [...cand].sort((a, b) => etaPunto(a, g.reloj, donde) - etaPunto(b, g.reloj, donde));
      const reforzables = proximos.filter((t) => SERIES[t.serie].doble && t.unidades.length < 2 && g.reserva.some((u) => u.serie === t.serie));
      const tr = reforzables.length ? reforzables[0] : proximos[0];
      const puede = reforzables.includes(tr);
      const motivo = pick(["una incidencia en otra línea", "un evento multitudinario", "una avería en el Metro", "el corte de una línea de autobuses"]);
      return {
        titulo: `Aglomeración en ${ESTACIONES[donde].n}`,
        lugar: ESTACIONES[donde].n,
        datos: [
          { k: "Estación", v: ESTACIONES[donde].corto },
          { k: "En andén", v: nf(Math.round(g.andenes[donde].alcala + g.andenes[donde].pio)), c: P.warn },
          { k: "Próximo tren", v: `${INTERVALO} min` },
        ],
        texto: `${motivo.charAt(0).toUpperCase() + motivo.slice(1)} deriva viajeros hacia la C-7. El ${numeroTren(tr, g.reloj)} llega allí en ${Math.round(etaPunto(tr, g.reloj, donde))} min y no dará abasto con sus ${nf(plazasDe(tr))} plazas.`,
        opciones: [
          puede
            ? { label: "Reforzar con material de reserva", detalle: `Sale una ${tr.serie} de Fuencarral para acoplar`, ef: { reforzar: tr.i, coste: 2400 } }
            : { label: "Refuerzo de personal en andenes", detalle: "Ordena la carga, pero alarga las paradas", ef: { retraso: { i: tr.i, m: 4 }, coste: 1200, afectAnden: donde } },
          { label: "Asumir la sobreocupación", detalle: "Trenes al límite y paradas más largas", ef: { retraso: { i: tr.i, m: 7 }, afectAnden: donde } },
        ],
      };
    },
  },
  {
    id: "instalaciones",
    gen: () => {
      const dur = durIncid(120); // varía en cada aparición
      const modo = pick([
        { t: "Caída del bloqueo", tramo: true, m: 6, txt: "El tramo queda sin protección automática. Los trenes solo pueden entrar con autorización." },
        { t: "Falta de comprobación de agujas", tramo: false, m: 8, rot: true, txt: "El enclavamiento no confirma la posición de las agujas. Hay que reconocerlas a pie antes de cada paso." },
        { t: "Pérdida de visión del CTC", tramo: true, m: 5, txt: "El puesto de mando de Adif se queda sin visión del tramo y pasa a mando local." },
        { t: "Falsa ocupación de los cambios", tramo: false, rot: true, m: 7, txt: "Los circuitos de vía dan ocupación permanente en los cambios. Rebase autorizado en cada circulación." },
      ]);
      const sitio = modo.tramo ? tramoAlAzar(false) : (() => { const i = pick(ESTACIONES.map((e, k) => (e.rot ? k : -1)).filter((k) => k >= 0)); return { idx: i, txt: `en ${ESTACIONES[i].n}` }; })();
      return {
        titulo: `${modo.t} ${sitio.txt}`,
        lugar: sitio.txt.replace(/^(entre|en) /, ""),
        datos: [
          { k: "Punto", v: sitio.txt.replace(/^(entre|en) /, "") },
          { k: "Instalación", v: "fuera de servicio", c: P.warn },
          { k: "Previsión", v: prevision(dur), c: P.warn },
        ],
        texto: `${modo.txt} Adif estima ${prevision(dur)} hasta el restablecimiento.`,
        opciones: [
          { label: "Circular con rebase autorizado", detalle: "Cada tren que pase pierde tiempo", ef: { restriccion: { idx: sitio.idx, m: modo.m, dur: dur, txt: `${modo.t} ${sitio.txt}`, bloqueaRot: !!modo.rot } } },
        ],
      };
    },
  },
  {
    /* De la estación, no de la línea. Se elige preferentemente una que
       compartan varias: es donde la decisión tiene peso de verdad.     */
    id: "estacion",
    gen: (g) => {
      const conVarias = [];
      const todas = [];
      for (const e of ESTACIONES) {
        if (e.puesto) continue;
        const ls = lineasEnEstacion(g, e.n);
        if (ls.length > 1) conVarias.push({ e, ls });
        else if (ls.length === 1) todas.push({ e, ls });
      }
      const pool = conVarias.length && Math.random() < 0.8 ? conVarias : conVarias.concat(todas);
      if (!pool.length) return null;
      const { e, ls } = pick(pool);
      const def = pick(INC_ESTACION);
      const txtLineas = ls.length > 1 ? `${ls.slice(0, -1).join(", ")} y ${ls[ls.length - 1]}` : ls[0] || LINEA;
      return {
        titulo: `${def.txt} en ${e.n}`,
        lugar: e.n,
        texto: def.relato(e.n, txtLineas),
        datos: [
          { k: "Estación", v: e.n },
          { k: "Líneas afectadas", v: txtLineas, c: ls.length > 1 ? COLOR.rojo : undefined },
        ],
        opciones: def.opciones(e.n, txtLineas),
      };
    },
  },
  {
    id: "graffiteros",
    gen: (g) => {
      const cand = g.trenes.filter((t) => t.estado !== "suprimido" && t.unidades.length);
      if (!cand.length) return null;
      const tr = pick(cand);
      const u = pick(tr.unidades);
      const donde = ESTACIONES[puntoAlAzar(true)].n;
      const doble = tr.unidades.length > 1;
      return {
        titulo: `Grafiteros en ${donde}`,
        tren: tr.i,
        lugar: donde,
        texto: `Un grupo acciona el freno de alarma del ${numeroTren(tr, g.reloj)} y pinta la ${u.id}. El tren queda detenido hasta que se restablece el freno.`,
        opciones: [
          doble
            ? { label: `Desacoplar la ${u.id} para limpieza`, detalle: "Sigue en servicio con la mitad de plazas", ef: { desacoplar: { i: tr.i, u: u.id }, retraso: { i: tr.i, m: 9 } } }
            : { label: "Retirar el tren para limpieza", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: tr.i } },
          { label: "Reanudar el servicio con la pintada", detalle: "Se limpiará al cierre; mala imagen todo el día", ef: { retraso: { i: tr.i, m: 7 }, afectLinea: 0.25, coste: 900 } },
        ],
      };
    },
  },
  {
    id: "catenaria",
    gen: (g) => {
      const cand = g.trenes.filter((t) => t.estado !== "suprimido" && situacion(t, g.reloj).dir !== "maniobra");
      if (!cand.length) return null;
      const tr = pick(cand);
      const dir = situacion(tr, g.reloj).dir;
      const via = dir === "alcala" ? "sentido Alcalá" : "sentido Príncipe Pío";
      const i = Math.min(N - 1, Math.round(situacion(tr, g.reloj).idx));
      const e = ESTACIONES[i];
      // cada opción tiene su propio ritmo de reparación, pero todas varían
      const durLarga = durIncid(130);
      const durMedia = durIncid(110);
      return {
        titulo: `Enganchón de catenaria en ${e.n}`,
        tren: tr.i,
        lugar: e.n,
        texto: `El pantógrafo del ${numeroTren(tr, g.reloj)} engancha el hilo de contacto. La vía de ${via} queda inutilizada en el punto; la contraria sigue libre.`,
        opciones: [
          { label: "Circulación por la vía contraria hasta su reparación", detalle: `Vía única en el tramo · ${prevision(durLarga)}`, ef: { restriccion: { idx: i, m: 2, dur: durLarga, dir, txt: `Enganchón en ${e.corto}` } } },
          { label: "Retirar el tren implicado y abrir vía contraria", detalle: `Se pierde la circulación · ${prevision(durMedia)}`, ef: { retirarCabecera: tr.i, restriccion: { idx: i, m: 2, dur: durMedia, dir, txt: `Enganchón en ${e.corto}` } } },
        ],
      };
    },
  },
  {
    id: "otrotren",
    gen: (g) => {
      const dur = durIncid(100); // varía en cada aparición
      const mercancias = Math.random() < 0.9;
      // los mercancías solo comparten vía con la C-7 en tres puntos concretos
      const sitio = mercancias
        ? pick([
            { idx: pick([IDX_ROZAS, IDX_PITIS]), txt: "entre Las Rozas y Pitis" },
            { idx: IDX_VICALVARO, txt: "en Vicálvaro" },
            { idx: IDX_ALCALA, txt: "en Alcalá de Henares" },
          ])
        : (() => {
            const i = puntoAlAzar(false);
            return { idx: i, txt: `en ${ESTACIONES[i].n}` };
          })();
      const clase = mercancias ? "mercancías" : "Media Distancia";
      const dir = pick(["alcala", "pio"]);
      const via = dir === "alcala" ? "sentido Alcalá" : "sentido Príncipe Pío";
      const corto = ESTACIONES[sitio.idx].corto;
      return {
        titulo: `Avería de un ${clase} ${sitio.txt}`,
        lugar: sitio.txt.replace(/^(entre|en) /, ""),
        datos: [
          { k: "Tramo", v: sitio.txt.replace(/^(entre|en) /, "") },
          { k: "Tren ajeno", v: clase },
          { k: "Previsión", v: prevision(dur), c: P.warn },
        ],
        texto: `Un tren de ${clase} queda detenido por avería ocupando la vía de ${via}. Adif trabaja en apartarlo. Se estima ${prevision(dur)} de afectación.`,
        opciones: [
          {
            label: "Mantener la vía cortada hasta el rescate",
            detalle: "Vía única hasta el rescate: los cruces marcarán el retraso",
            ef: { restriccion: { idx: sitio.idx, m: 2, dur: dur, dir, txt: `${clase === "mercancías" ? "Mercancías" : "Media Distancia"} averiado ${sitio.txt}` } },
          },
          {
            label: "Banalizar la vía mientras lo apartan",
            detalle: "Ambos sentidos comparten vía y pierden la mitad cada uno",
            ef: { restriccion: { idx: sitio.idx, m: 7, dur: dur, txt: `Vía banalizada en ${corto}` } },
          },
        ],
      };
    },
  },
  {
    id: "orden",
    gen: (g) => {
      const cand = g.trenes.filter((t) => t.estado !== "suprimido");
      if (!cand.length) return null;
      const tr = pick(cand);
      const donde = ESTACIONES[Math.min(N - 1, Math.round(situacion(tr, g.reloj).idx))].n;
      const tipo = sortearSub(ORDEN_PUBLICO);
      const sub = tipo.gen({ g, tr, i: tr.i });
      return {
        titulo: `${tipo.nombre} en el ${numeroTren(tr, g.reloj)}`,
        lugar: donde,
        tren: tr.i,
        texto: `${sub.texto} A la altura de ${donde}.`,
        opciones: sub.opciones,
      };
    },
  },
  {
    id: "arrollamiento",
    gen: () => {
      const dur = durIncid(90); // varía en cada aparición
      const i = puntoAlAzar(true);
      const e = ESTACIONES[i];
      return {
        titulo: `Arrollamiento en ${e.n}`,
        lugar: e.n,
        datos: [
          { k: "Punto", v: e.n },
          { k: "Vía", v: "ambos sentidos" },
          { k: "Previsión", v: prevision(dur), c: P.alert },
        ],
        texto: "Circulación interrumpida por causa ajena a la explotación. Intervención judicial sin previsión de restablecimiento.",
        opciones: [
          { label: "Mantener el corte hasta el levantamiento", detalle: `Todo tren que llegue al punto queda retenido · ${prevision(dur)}`, ef: { restriccion: { idx: i, m: 16, dur: dur, txt: `Corte en ${e.corto}` }, afectLinea: 1 } },
          { label: "Plan alternativo por carretera", detalle: "Autobuses en el tramo, coste elevado", ef: { restriccion: { idx: i, m: 9, dur: dur, txt: `Transbordo en ${e.corto}` }, coste: 11500, afectLinea: 0.4 } },
        ],
      };
    },
  },
];

/* ── sorteo ponderado de incidencias ────────────────────────── */

const MAX_INCIDENCIAS = 6;
const SEPARACION_MIN = 40; // minutos mínimos entre incidencias
const PUNTA = [7 * 60, 9.5 * 60];
const enPunta = (r) => r >= PUNTA[0] && r < PUNTA[1];

// REPARTO por tipo: de todas las incidencias que ocurren, qué proporción es
// cada una. Sumará 100 cuando el catálogo esté completo; mientras tanto se
// normaliza sobre el total vigente. Solo lo relativo a viajeros distingue
// entre punta y valle.
const TABLA = [
  { id: "averia", valle: 38, punta: 38 },
  { id: "instalaciones", valle: 13, punta: 13 },
  { id: "orden", valle: 11, punta: 11 },
  { id: "catenaria", valle: 9, punta: 9 },
  { id: "ltv", valle: 7, punta: 7 },
  { id: "viajero", valle: 7, punta: 9 },
  { id: "otrotren", valle: 4, punta: 1 },
  { id: "indispuesto", valle: 3, punta: 3 },
  { id: "cable", valle: 3, punta: 3 },
  { id: "arrollamiento", valle: 2, punta: 2 },
  { id: "afluencia", valle: 1, punta: 4 },
  { id: "graffiteros", valle: 2, punta: 0 },
  // incidencias de la propia estación: no son de ninguna línea, son de todas
  { id: "estacion", valle: 5, punta: 7 },
];

/* FRECUENCIA. La base es la probabilidad de que un sorteo por hora produzca
   alguna incidencia. Solo la parte de material se ajusta al estado real de la
   flota: con el parque impecable ocurren menos averías, y con el parque
   agotado bastantes más. El resto de familias —vía, viajeros, orden público—
   no dependen de cómo esté el material y mantienen su frecuencia.      */
const PROB_INCIDENCIA = 0.6;

// cuánto de esa probabilidad corresponde a averías de material
const PESO_MATERIAL = 0.38;

function probIncidencia(g) {
  const enServicio = g.trenes.filter((t) => t.estado !== "suprimido" && t.unidades.length);
  if (!enServicio.length) return PROB_INCIDENCIA;
  const unidades = enServicio.flatMap((t) => t.unidades);
  const desg = unidades.reduce((n, u) => n + u.desgaste, 0) / unidades.length;
  /* Factor sobre la parte de material: 0,55 con la flota nueva y 1,7 con el
     ciclo agotado. Fuera de ese tramo no se sigue moviendo.            */
  const f = Math.max(0.55, Math.min(1.7, 0.55 + (desg / DESGASTE_MAX) * 1.15));
  return PROB_INCIDENCIA * (1 - PESO_MATERIAL) + PROB_INCIDENCIA * PESO_MATERIAL * f;
}

/* Gravedad por familia. Se declara y no se deduce de los efectos: el jugador
   tiene que saber lo que tiene encima ANTES de elegir opción, y varias
   incidencias son leves o graves según lo que decida.

   leve     cuesta minutos a un tren y se resuelve donde está
   grave    afecta a la línea: vía única, restricción o tren fuera de servicio
   crítica  corta el servicio o inmoviliza material en plena vía          */
// nombre legible de cada familia, para el panel de pruebas
const NOMBRE_FAMILIA = {
  averia: "Avería de material",
  instalaciones: "Avería de instalaciones",
  orden: "Alteración del orden público",
  catenaria: "Enganchón de catenaria",
  ltv: "Limitación temporal de velocidad",
  viajero: "Viajero indispuesto",
  otrotren: "Avería de otro tren",
  indispuesto: "Maquinista indispuesto",
  cable: "Robo de cable",
  arrollamiento: "Arrollamiento",
  afluencia: "Aglomeración",
  graffiteros: "Grafiteros",
};

/* Incidencias de la ESTACIÓN. No nacen en una línea y se contagian: nacen ya
   de todas las que paran allí, y la decisión que tomes las gobierna a todas a
   la vez. Es la diferencia entre gestionar una línea y gestionar un nudo. */
const INC_ESTACION = [
  {
    txt: "Fallo de señalización",
    relato: (e, ls) =>
      `Se ha quedado sin señales el enclavamiento de ${e}. Hasta que el técnico lo restablezca, los trenes tienen que entrar con marcha a la vista y autorización expresa.\n\nAfecta a ${ls}.`,
    opciones: (e, ls) => [
      { label: "Marcha a la vista mientras se resuelve", detalle: "Todos los trenes pierden tiempo al pasar · se mantiene el servicio", ef: { cortarEstacion: { estacion: e, m: 4, dur: 50 + Math.floor(Math.random() * 40), txt: "Fallo de señalización" } } },
      { label: "Cortar el paso hasta el restablecimiento", detalle: "Penalización mayor pero más corta · el técnico trabaja sin trenes encima", ef: { cortarEstacion: { estacion: e, m: 9, dur: 25 + Math.floor(Math.random() * 20), txt: "Enclavamiento fuera de servicio" }, afectLinea: 0.1 } },
    ],
  },
  {
    txt: "Persona en la vía",
    relato: (e, ls) =>
      `Avisan de una persona caminando por la vía en ${e}. Hasta que Seguridad confirme que la zona está despejada no se puede circular con normalidad.\n\nAfecta a ${ls}.`,
    opciones: (e, ls) => [
      { label: "Cortar la circulación hasta que se despeje", detalle: "Lo más seguro · el servicio se detiene en esa estación", ef: { cortarEstacion: { estacion: e, m: 12, dur: 20 + Math.floor(Math.random() * 25), txt: "Persona en la vía" }, afectLinea: 0.15 } },
      { label: "Marcha a la vista y aviso a los maquinistas", detalle: "Se mantiene el servicio · la responsabilidad de circular con alguien en la vía es tuya", ef: { cortarEstacion: { estacion: e, m: 5, dur: 35 + Math.floor(Math.random() * 30), txt: "Persona en la vía" }, calidad: -6 } },
    ],
  },
  {
    txt: "Aglomeración en el vestíbulo",
    relato: (e, ls) =>
      `El vestíbulo de ${e} está desbordado. Los andenes no admiten más gente y Seguridad pide regular el acceso antes de que haya un disgusto.\n\nAfecta a ${ls}.`,
    opciones: (e, ls) => [
      { label: "Regular el acceso a los andenes", detalle: "Se controla la entrada · los trenes paran más tiempo", ef: { cortarEstacion: { estacion: e, m: 3, dur: 40 + Math.floor(Math.random() * 30), txt: "Acceso regulado" } } },
      { label: "No intervenir", detalle: "Sin pérdida de tiempo, pero la gente se agolpa en el andén", ef: { afectAnden: null, calidad: -14 } },
    ],
  },
  {
    txt: "Paquete sospechoso",
    relato: (e, ls) =>
      `Han localizado un bulto abandonado en el andén de ${e}. El protocolo obliga a acordonar la zona hasta que lo revisen.\n\nAfecta a ${ls}.`,
    opciones: (e, ls) => [
      { label: "Acordonar y avisar a los artificieros", detalle: "Corte largo, pero es lo que marca el protocolo", ef: { cortarEstacion: { estacion: e, m: 15, dur: 30 + Math.floor(Math.random() * 30), txt: "Paquete sospechoso" }, afectLinea: 0.2 } },
      { label: "Que lo revise el personal de estación", detalle: "Más rápido, saltándose el protocolo", ef: { cortarEstacion: { estacion: e, m: 4, dur: 12 + Math.floor(Math.random() * 12), txt: "Bulto abandonado" }, coste: 2000 } },
    ],
  },
];

const GRAVEDAD_FAMILIA = {
  averia: "grave", // se afina según la gravedad sorteada
  instalaciones: "grave",
  orden: "leve",
  catenaria: "grave",
  ltv: "grave",
  viajero: "leve",
  otrotren: "grave",
  indispuesto: "leve",
  cable: "critica",
  arrollamiento: "critica",
  afluencia: "leve",
  graffiteros: "leve",
  estacion: "grave",
};

/* ── retraso por horquilla ──────────────────────────────────────
   Una avería nunca tarda lo mismo en resolverse, así que cada decisión anuncia
   un margen y no una cifra exacta. Dentro de ese margen manda la
   PROFESIONALIDAD del maquinista: con 100 el resultado se acerca al mínimo y
   con 0 al máximo. Es el primer uso real de ese atributo, que hasta ahora solo
   se mostraba.                                                            */
function retrasoRango(min, max, maq) {
  const pro = maq && Number.isFinite(maq.pro) ? maq.pro : 50;
  // la parte del margen que se consume: 0 con profesionalidad plena, 1 sin ella
  const base = 1 - pro / 100;
  // algo de azar para que dos averías iguales no salgan clavadas
  const f = Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.3));
  return Math.round((min + (max - min) * f) * 10) / 10;
}

// texto del margen tal como se anuncia en la opción

/* Previsión de tiempo de cada opción, para que el jugador sepa a qué atenerse
   antes de decidir. Si la opción no declara su horquilla, se deduce del propio
   efecto: un margen del 30 % alrededor del retraso que provoca.          */
function previsionOpcion(o) {
  if (!o || !o.ef) return null;
  if (o.tiempo) return o.tiempo[0] === o.tiempo[1] ? `${o.tiempo[0]} min` : `${o.tiempo[0]}–${o.tiempo[1]} min`;
  const ef = o.ef;
  // la marcha degradada no cuesta una vez, cuesta cada tantos minutos
  if (ef.degradada) return `${ef.degradada.min} min cada ${ef.degradada.cada}`;
  if (ef.suprimir !== undefined || ef.averiaGrave) return "pierde la circulación";
  if (ef.circularVacio) return "pierde la circulación";
  if (ef.restriccion && ef.restriccion.dur) return `${Math.round(ef.restriccion.dur / 15) * 15} min de afectación`;
  if (ef.corteVia) return "vía cortada";
  if (ef.socorro) return `${SOCORRO_MIN} min de maniobra`;
  if (ef.cambioMaterial || ef.cabinaCambio) return "cambio de material";
  if (ef.relevoInmediato || ef.relevaReserva || ef.adelantar) return "consume una reserva";
  if (ef.autorizar) return "sin retraso";
  if (ef.reforzar) return "refuerzo";
  if (ef.esperarCabecera) return "espera en la entrada";
  if (ef.ordenarRotacion) {
    const c2 = ef.ordenarRotacion.c || {};
    return c2.ahorro ? `recupera ${Math.round(c2.ahorro)} min` : "rotación anticipada";
  }
  if (ef.abortarRotacion) return "vuelve al servicio";
  if (ef.moverApartado || ef.destinoVacio) return "movimiento en vacío";
  if (ef.retener) return "espera en la entrada";
  const m = ef.retraso ? ef.retraso.m : ef.limitacion ? ef.limitacion.m : null;
  if (m === null || m === undefined) return null;
  const lo = Math.max(1, Math.floor(m * 0.7));
  const hi = Math.ceil(m * 1.3);
  return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
}

/* Subtítulo de la tarjeta: los datos que sitúan la incidencia. Las averías de
   material traen los suyos, y el resto se construyen aquí a partir del tren
   afectado, para que ninguna tarjeta se quede sin esa línea.             */
/* A qué líneas afecta una incidencia. La suya siempre; y si corta la vía en
   una estación por la que pasan otras, también a ellas: un corte en Chamartín
   no es asunto de una sola línea.                                       */
/* Traslada una restricción a las demás líneas que pasan por ese punto. El
   mismo andén tiene distinto número en cada línea, así que se busca por nombre
   de estación y se crea la restricción en el índice que le corresponda allí.

   No se traslada la vía única: la geometría de vías es propia de cada línea y
   un corte en las vías de la C-7 no obliga a banalizar las de la C-1. Lo que
   sí se traslada es la penalización de paso, que es lo que de verdad sufre
   quien cruza una estación con un problema encima.                     */
/* Retira de las demás líneas las restricciones que nacieron de estas. Si no,
   la C-1 seguía penalizada en Chamartín después de resolverse la avería de la
   C-7 que lo había provocado.                                          */
function levantarEnTodas(g, ids) {
  if (!ids || !ids.length) return;
  const fuera = new Set(ids);
  for (const trozo of Object.values(g.porLinea || {}))
    if (trozo.restricciones) trozo.restricciones = trozo.restricciones.filter((x) => !fuera.has(x.origen));
}

/* Corta una estación para TODAS las líneas que paran en ella. A diferencia de
   propagarRestriccion, que traslada a las demás algo nacido en una, esto no
   pertenece a ninguna: un fallo de señalización o una persona en la vía son de
   la estación, y quien pase por allí lo sufre igual.                   */
function cortarEstacion(g, nombre, m, dur, txt) {
  const id = `e${Math.round(g.reloj)}-${nombre}`;
  const activa = g.linea || LINEAS_EN_JUEGO[0];
  for (const idLin of Object.keys(g.porLinea || { [activa]: 1 })) {
    const ests = (LINEAS[idLin] || {}).estaciones || ESTACIONES;
    const idx = ests.findIndex((e) => e.n === nombre);
    if (idx < 0) continue;
    const nueva = { id, idx, m, hasta: g.reloj + dur, txt, dir: null, tramo: null, bloqueaRot: false, deEstacion: nombre };
    if (idLin === activa) {
      g.restricciones = [...g.restricciones.filter((x) => x.id !== id), nueva];
    } else {
      const trozo = g.porLinea[idLin];
      trozo.restricciones = [...(trozo.restricciones || []).filter((x) => x.id !== id), nueva];
    }
  }
  return id;
}

/* Líneas en juego que paran en una estación. Sirve para redactar el aviso y
   para saber a cuántas afecta antes de lanzarlo.                        */
function lineasEnEstacion(g, nombre) {
  return Object.keys(g.porLinea || {}).filter((id) => ((LINEAS[id] || {}).estaciones || []).some((e) => e.n === nombre));
}

function propagarRestriccion(g, rest, nombreEstacion) {
  const origen = g.linea || LINEAS_EN_JUEGO[0];

  /* Estaciones alcanzadas: el punto donde ocurre y TODAS las del tramo que
     queda cortado. Un tren muerto a la salida de Chamartín corta el tramo
     entero, y quien pase por cualquiera de sus estaciones lo sufre, aunque el
     punto exacto no sea el suyo. Antes solo se miraba el punto y la otra línea
     no se enteraba de nada.                                             */
  const tocadas = new Set();
  if (nombreEstacion) tocadas.add(nombreEstacion);
  if (rest.tramo) {
    for (let k = rest.tramo.a; k <= rest.tramo.b; k++) if (ESTACIONES[k]) tocadas.add(ESTACIONES[k].n);
  }
  if (!tocadas.size) return;

  for (const id of Object.keys(g.porLinea || {})) {
    if (id === origen) continue;
    const ests = (LINEAS[id] || {}).estaciones || [];
    const idx = ests.findIndex((e) => tocadas.has(e.n));
    if (idx < 0) continue;
    const trozo = g.porLinea[id];
    const yaEsta = (trozo.restricciones || []).some((x) => x.origen === rest.id);
    if (yaEsta) continue;
    trozo.restricciones = [
      ...(trozo.restricciones || []),
      { idx, m: rest.m, hasta: rest.hasta, txt: rest.txt, dir: null, tramo: null, bloqueaRot: !!rest.bloqueaRot, origen: rest.id, deLinea: origen },
    ];
  }
}

function lineasAfectadas(g, inc) {
  const propia = inc.linea || g.linea || LINEAS_EN_JUEGO[0];
  if (!inc.lugar) return [propia];

  /* Solo alcanza a otras líneas lo que toca la INFRAESTRUCTURA: un corte de
     vía, una limitación, un tren clavado. Lo que afecta a un tren o a su
     maquinista —un relevo comprometido, una avería que se resuelve sola— es
     asunto de su línea, aunque ocurra en una estación compartida.      */
  const tocaVia = (inc.opciones || []).some(
    (o) => o.ef && (o.ef.restriccion || o.ef.corteVia || o.ef.atls || o.ef.rescate || o.ef.averiaGrave || o.ef.socorro || o.ef.limitacion)
  );
  if (!tocaVia) return [propia];

  const fuera = [];
  for (const id of Object.keys(g.porLinea || {})) {
    if (id === propia) continue;
    // la estación tiene que ser la misma, no que un nombre contenga al otro
    const comparte = (LINEAS[id].estaciones || []).some((e) => inc.lugar === e.n || inc.lugar === e.corto || inc.lugar.split(" y ").includes(e.n));
    if (comparte) fuera.push(id);
  }
  return [propia, ...fuera];
}

function datosDeTren(g, t) {
  if (!t) return null;
  const aBordo = Math.round(t.pax.reduce((a, b) => a + b, 0));
  const cap = plazasDe(t) || 1;
  const oc = Math.round((aBordo / cap) * 100);
  return [
    { k: "Circulación", v: String(t.i) },
    { k: "Material", v: t.unidades.map((u) => u.id).join(" + ") || "sin material" },
    { k: "Ocupación", v: `${oc} %`, c: colOcupacion(oc) },
  ];
}

/* Una avería que no se resuelve puede ir a más. Se vuelve a construir la misma
   avería en el grado siguiente, con su texto y sus opciones.             */
function avanceAveria(g, t, idTipo) {
  const tipo = AVERIAS_MATERIAL.find((a) => a.id === idTipo);
  const u = t.unidades[0];
  const mq = t.maq ? maqDe(g, t) : null;
  const donde = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(situacion(t, g.reloj).idx)))].n;
  const ctx = { g, tr: t, u, doble: t.unidades.length > 1, donde, num: numeroTren(t, g.reloj), i: t.i, mq };
  const orden = tipo && tipo.grados ? tipo.grados : ["leve", "habitual", "grave", "muygrave"];
  const actual = orden.indexOf(t.degradaGrado || "leve");
  const grav = orden[Math.min(orden.length - 1, actual + 1)];
  const propio = tipo && typeof tipo[grav] === "function" ? tipo[grav](ctx) : null;
  t.degradaGrado = grav;
  return {
    tipo: "inc",
    grav: grav === "leve" ? "leve" : grav === "muygrave" ? "critica" : "grave",
    tren: t.i,
    lugar: donde,
    titulo: `${tipo ? tipo.nombre : "Avería"} en el ${numeroTren(t, g.reloj)}`,
    datos: [
      { k: "Unidad", v: u.id },
      { k: "Desgaste", v: `${Math.round(u.desgaste)} %`, c: colDesgaste(u.desgaste) },
      { k: "Fiabilidad", v: `${Math.round(u.fiab * 100)} %`, c: u.fiab < 0.9 ? P.alert : colDesgaste(100 - u.fiab * 100) },
    ],
    texto: propio ? propio.texto : "La avería se agrava y el tren no puede mantener la marcha.",
    opciones: propio ? propio.opciones : [{ label: "Terminar recorrido y apartar el material", detalle: "El tren llega a la primera estación con apartadero", ef: { averiaGrave: { i: t.i } } }],
  };
}

/* ── modo de pruebas ────────────────────────────────────────────
   Permite lanzar cualquier incidencia con el grado que se quiera, para poder
   ver casos que de forma natural aparecen una vez cada muchos turnos. Todo
   ocurre de verdad dentro del turno —vía única, transbordos, rescates— pero
   el turno no se guarda ni toca la campaña.                             */
function lanzarPrueba(g, idFamilia, idAveria, grado, iTren) {
  const t = g.trenes.find((x) => x.i === iTren) || g.trenes.find((x) => x.estado !== "suprimido" && x.unidades.length);
  if (!t) return null;

  if (idFamilia !== "averia") {
    const def = POOL.find((d) => d.id === idFamilia);
    const inc = def && def.gen(g);
    if (!inc) return null;
    const datos = inc.datos || (inc.tren !== undefined ? datosDeTren(g, g.trenes.find((x) => x.i === inc.tren)) : null);
    return { tipo: "inc", grav: GRAVEDAD_FAMILIA[idFamilia] || "grave", ...inc, datos };
  }

  // avería de material: se construye con el tipo y el grado pedidos
  const tipo = AVERIAS_MATERIAL.find((a) => a.id === idAveria) || AVERIAS_MATERIAL[0];
  const u = t.unidades[0];
  const mq = t.maq ? maqDe(g, t) : null;
  const donde = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(situacion(t, g.reloj).idx)))].n;
  const num = numeroTren(t, g.reloj);
  const ctx = { g, tr: t, u, doble: t.unidades.length > 1, donde, num, i: t.i, mq };
  let grav = grado;
  if (tipo.grados && !tipo.grados.includes(grav)) grav = tipo.grados[tipo.grados.length - 1];

  const datos = [
    { k: "Unidad", v: u.id },
    { k: "Desgaste", v: `${Math.round(u.desgaste)} %`, c: colDesgaste(u.desgaste) },
    { k: "Fiabilidad", v: `${Math.round(u.fiab * 100)} %`, c: u.fiab < 0.9 ? P.alert : P.ok },
  ];
  const propio = typeof tipo[grav] === "function" ? tipo[grav](ctx) : null;
  if (propio)
    return {
      tipo: "inc",
      grav: grav === "leve" ? "leve" : grav === "muygrave" ? "critica" : "grave",
      tren: t.i,
      lugar: donde,
      datos,
      titulo: `${tipo.nombre} en el ${num}`,
      texto: propio.texto,
      opciones: propio.opciones,
    };

  // las que aún no se han reformulado usan el marco genérico
  const av = tipo.gen ? tipo.gen(ctx) : null;
  if (!av) return null;
  const opciones = grav === "muygrave" && tipo.inmoviliza
    ? [
        { label: "Pedir socorro al tren de detrás", detalle: `${SOCORRO_MIN} min de maniobra`, ef: { socorro: { i: t.i } } },
        { label: "Cortar la vía y banalizar", detalle: "El material queda donde está", ef: { corteVia: { i: t.i } } },
      ]
    : av.opciones;
  return {
    tipo: "inc",
    grav: grav === "leve" ? "leve" : grav === "muygrave" ? "critica" : "grave",
    tren: t.i,
    lugar: donde,
    datos,
    titulo: `${tipo.nombre} en el ${num}`,
    texto: `${av.texto} ${GRAVEDAD[grav].txt}`,
    opciones,
  };
}

function sortearIncidencia(reloj, g) {
  if (Math.random() > (g ? probIncidencia(g) : PROB_INCIDENCIA)) return null; // hora sin novedad
  const p = enPunta(reloj) ? "punta" : "valle";
  const total = TABLA.reduce((n, f) => n + f[p], 0);
  let x = Math.random() * total;
  for (const fila of TABLA) {
    x -= fila[p];
    if (x <= 0) return POOL.find((d) => d.id === fila.id);
  }
  return null;
}

/* ── arranque del turno ─────────────────────────────────────── */

// El taller no propone material que no llegue al final del turno.
const cubreTurno = (u) => u.desgaste + desgastePorTurno(u) <= DESGASTE_MAX;

// al abrir el turno solo se puede dejar material apartado en estas tres
// dónde se puede dejar material apartado al abrir el turno: las cabeceras de
// la línea, y Chamartín aparte si es una parada intermedia
let APART_INICIAL = [IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA];
const clave = (i, via) => `${i}|${via}`;

/* Propuesta del taller. En campaña hay que mirar el desgaste heredado, no el
   del catálogo, y descartar lo que está en revisión o averiado: si no,
   propondría material que no existe o que está hecho polvo.               */
/* Propone material para la línea vigente. 'ocupadas' son las unidades que ya
   ha tomado otra línea: sin ese dato, cada pestaña proponía la mejor flota
   disponible y acababan repartiéndose las mismas unidades.            */
function propuestaTaller(camp, ocupadas) {
  const tomadas = ocupadas || new Set();
  const enTaller = new Set(Object.keys((camp && camp.taller) || {}));
  const averiadas = new Set((camp && camp.averiadas) || []);

  const conDesgaste = (u) => {
    const d = camp && camp.desg[u.id] !== undefined ? camp.desg[u.id] : u.desgaste;
    // una unidad ya pasada de ciclo sigue marcada: si no, vuelve a avisar
    return { ...u, desgaste: d, fiab: fiabDesgaste(d), vencida: d >= DESGASTE_MAX };
  };

  const orden = (u) => DESGASTE_MAX - u.desgaste; // primero las más descansadas
  /* Solo el material que admite la línea vigente: la C-1 se cubre con Civia en
     composición sencilla, así que ni 446 ni 450 ni acoplamientos.      */
  const serieOk = (LINEAS[LINEA] || {}).series || ["446", "465", "450"];
  const aptas = LIBRES_C7.filter((u) => !enTaller.has(u.id) && !averiadas.has(u.id) && !tomadas.has(u.id) && serieOk.includes(u.serie))
    .map(conDesgaste)
    .filter(cubreTurno);
  const libres = { 450: [], 465: [], 446: [] };
  for (const u of aptas.slice().sort((a, b) => orden(b) - orden(a))) libres[u.serie].push(u);

  /* Se forman todas las composiciones posibles y se puntúan combinando dos
     cosas: si cubren la demanda punta y cuánto desgaste arrastran. Antes se
     elegía por orden fijo de serie, así que las 450 salían siempre primero
     por ser las de más plazas, aunque estuvieran al final de su ciclo.    */
  const demanda = demandaPorTren();
  const cands = [];
  for (const u of libres[450]) cands.push({ ids: [u.id], plazas: u.plazas, desg: u.desgaste, serie: "450" });

  /* Una línea que no admite acoplamiento se cubre con unidades sueltas. */
  if (!(LINEAS[LINEA] || {}).dobles) {
    for (const se of ["465", "446"]) for (const u of libres[se]) cands.push({ ids: [u.id], plazas: u.plazas, desg: u.desgaste, serie: se });
  }

  const pares = (LINEAS[LINEA] || {}).dobles === false ? [] : ["465", "446"];
  for (const se of pares) {
    const l = libres[se];
    for (let i = 0; i + 1 < l.length; i += 2)
      cands.push({
        ids: [l[i].id, l[i + 1].id],
        plazas: l[i].plazas + l[i + 1].plazas,
        desg: Math.max(l[i].desgaste, l[i + 1].desgaste),
        serie: se,
      });
  }
  // cubrir la punta suma mucho; el desgaste resta siempre, cubra o no
  const punt = (x) => (x.plazas >= demanda ? 600 : (x.plazas / demanda) * 420) - x.desg * 3.4;
  cands.sort((x, y) => punt(y) - punt(x));

  const usadas = new Set();
  const slots = [];
  for (const x of cands) {
    if (slots.length >= CIRCULACIONES) break;
    if (x.ids.some((id) => usadas.has(id))) continue;
    x.ids.forEach((id) => usadas.add(id));
    slots.push([x.ids[0], x.ids[1] || null]);
  }
  while (slots.length < CIRCULACIONES) slots.push([null, null]);

  // lo que queda disponible, para el material apartado
  const resto = { 450: libres[450].filter((u) => !usadas.has(u.id)), 465: libres[465].filter((u) => !usadas.has(u.id)), 446: libres[446].filter((u) => !usadas.has(u.id)) };
  let a = 0, b = 0, c = 0;

  // y deja una composición apartada en cada cabecera, por si hay que cambiar
  // material durante el turno. Príncipe Pío solo admite la serie 446.
  const apart = {};
  /* El apartado se indexa por NOMBRE de estación, igual que en la pantalla de
     asignación: una misma vía tiene distinto número en cada línea.     */
  for (const idx of APART_INICIAL) for (const v of ESTACIONES[idx].apartVias) apart[clave(ESTACIONES[idx].n, v)] = [null, null];
  for (const idx of APART_INICIAL) {
    const est = ESTACIONES[idx];
    const via = est.apartVias[0];
    const admite = (u) => (!est.apartSeries || est.apartSeries.includes(u.serie)) && serieOk.includes(u.serie);
    let par = null;
    if (resto[450].length - a >= 1 && admite(resto[450][a])) par = [resto[450][a++].id, null];
    else if (!(LINEAS[LINEA] || {}).dobles) {
      // sin acoplamiento se aparta una unidad suelta
      for (const se of serieOk) {
        const k = se === "465" ? b : c;
        if (resto[se] && resto[se].length - k >= 1 && admite(resto[se][k])) {
          par = [resto[se][k].id, null];
          if (se === "465") b += 1;
          else c += 1;
          break;
        }
      }
    } else
      for (const se of ["465", "446"]) {
        const k = se === "465" ? b : c;
        if (resto[se].length - k >= 2 && admite(resto[se][k])) {
          par = [resto[se][k].id, resto[se][k + 1].id];
          if (se === "465") b += 2;
          else c += 2;
          break;
        }
      }
    if (par) apart[clave(est.n, via)] = par;
  }
  return { slots, apart };
}

function initAsignacion() {
  const apart = {};
  // por nombre, para que valga en cualquier línea
  for (const i of APART_INICIAL) for (const v of ESTACIONES[i].apartVias) apart[clave(ESTACIONES[i].n, v)] = [null, null];
  return { fase: "asignacion", slots: Array.from({ length: CIRCULACIONES }, () => [null, null]), apart };
}

/* ── campaña ────────────────────────────────────────────────────
   El estado que sobrevive de un turno al siguiente. Se guarda en el
   almacenamiento del artefacto, así que la campaña continúa aunque
   se cierre la aplicación.                                        */

const CLAVE_CAMPANA = "cgo:campana";
const ORDEN_TURNOS = ["manana", "tarde", "noche"];

/* Almacenamiento de la campaña en el navegador. Se mantienen asíncronas para
   no tocar el resto del código y poder sustituirlas el día que la partida se
   guarde en un servidor.                                                  */
async function guardarCampana(c) {
  try {
    localStorage.setItem(CLAVE_CAMPANA, JSON.stringify(c));
  } catch (e) {
    console.warn("[CGO] no se pudo guardar la campaña", e);
  }
}

async function cargarCampana() {
  try {
    const v = localStorage.getItem(CLAVE_CAMPANA);
    if (!v) return null;
    const c = JSON.parse(v);
    // una campaña empezada antes del histórico no lo tiene: se crea vacío
    if (c && !c.historico) c.historico = [];
    return c;
  } catch (e) {
    return null;
  }
}

/* Guardado del turno en curso. Ningún navegador respeta del todo la orden de
   no recargar al arrastrar, y además siempre se puede recargar sin querer o
   cerrar la pestaña. En vez de pelear con el navegador, la partida se guarda
   sola y al volver se reanuda donde estaba.                              */
const CLAVE_PARTIDA = "cgo:partida";

function guardarPartida(g, modo, tab) {
  try {
    if (!g || g.fin) return localStorage.removeItem(CLAVE_PARTIDA);
    localStorage.setItem(CLAVE_PARTIDA, JSON.stringify({ g, modo, tab, turno: g.turno }));
  } catch (e) {
    console.warn("[CGO] no se pudo guardar el turno", e);
  }
}

/* Una partida guardada puede venir de una versión anterior del juego, con
   campos que entonces no existían. Se completan con sus valores de partida en
   vez de dejarlos vacíos: sumar un número a algo indefinido da "NaN", y así
   el parte final salía con los datos en blanco.                          */
function completarPartida(g) {
  if (!g) return null;
  /* Una partida guardada antes de que hubiera varias líneas no tiene su
     estructura: se le da la de una sola, la que estuviera en juego.    */
  if (!g.linea) g.linea = LINEAS_EN_JUEGO[0];
  LINEAS_EN_JUEGO = g.porLinea ? Object.keys(g.porLinea) : [g.linea];
  fijarLinea(g.linea);
  if (!g.porLinea) {
    g.porLinea = {};
    guardarLinea(g, g.linea);
  }
  g.kpi = { ...KPI_INICIAL, ...(g.kpi || {}) };
  for (const k of Object.keys(KPI_INICIAL)) if (typeof g.kpi[k] !== "number" || Number.isNaN(g.kpi[k])) g.kpi[k] = KPI_INICIAL[k];
  g.trenes = (g.trenes || []).map((t) => ({
    ...t,
    pax: t.pax || [],
    hist: t.hist || [],
    marchas: t.marchas || [],
    cuadroRelevos: t.cuadroRelevos || [],
    traza: t.traza || [],
    acum: t.acum || { paradas: 0, bloqueo: 0, maquinista: 0 },
    retraso: Number.isFinite(t.retraso) ? t.retraso : 0,
    carteristas: !!t.carteristas,
  }));
  g.restricciones = g.restricciones || [];
  g.cola = g.cola || [];
  g.log = g.log || [];
  return g;
}

function cargarPartida() {
  try {
    const v = localStorage.getItem(CLAVE_PARTIDA);
    if (!v) return null;
    const d = JSON.parse(v);
    if (d && d.g) d.g = completarPartida(d.g);
    return d;
  } catch (e) {
    return null;
  }
}

function borrarPartida() {
  try {
    localStorage.removeItem(CLAVE_PARTIDA);
  } catch (e) {
    /* no pasa nada si no existía */
  }
}

async function borrarCampana() {
  try {
    localStorage.removeItem(CLAVE_CAMPANA);
  } catch (e) {
    /* no pasa nada si no existía */
  }
}

const campanaNueva = () => ({
  dia: 1,
  turno: "manana",
  desg: {},
  averiadas: [],
  historico: [], // una ficha por turno cerrado, para la pantalla de análisis
  /* Libro de averías por unidad: qué le pasó, cuándo, y si sigue sin
     resolver. Es lo que hace que arrastrar una avería tenga consecuencias
     más allá del turno en curso.                                        */
  libro: {},
  taller: {},
  apartado: {},
  slots: null,
  reponer: [],
  retrasos: null,
  andenes: null,
  restricciones: [],
  acum: { turnos: 0, punt: 0, coste: 0, puntos: 0, suprimidas: 0 },
});

// puntuación del turno: puntualidad menos lo que ha costado conseguirla
/* Resumen del turno a partir de lo acumulado, no de la foto del cierre. */
function balanceTurno(g) {
  // último cortafuegos: ningún dato del parte debe poder salir como "NaN"
  const n = (v) => (Number.isFinite(v) ? v : 0);
  const k = { ...KPI_INICIAL, ...(g.kpi || {}) };
  for (const key of Object.keys(k)) k[key] = n(k[key]);
  const punt = k.muestras ? (k.puntuales / k.muestras) * 100 : 100;
  const retrasoMedio = k.muestras ? k.sumaRetraso / k.muestras : 0;
  const ocupMedia = k.minutosOcup ? k.sumaOcup / k.minutosOcup : 0;
  const transportados = Math.round(k.transportados);
  const afect = Math.round(k.afect);
  // los afectados se miden en proporción a los viajeros llevados: 5.000 sobre
  // 120.000 es un buen turno, y sobre 30.000 es un desastre
  const tasaAfect = transportados > 0 ? (afect / transportados) * 100 : 0;
  const completas = g.trenes.filter((t) => t.estado !== "suprimido" && !t.esVacio).length;
  return { punt, retrasoMedio, ocupMedia, transportados, afect, tasaAfect, completas, calidad: k.calidad || 0, coste: k.coste, picoRetraso: k.picoRetraso, horaPico: k.horaPico, minutosApuro: k.minutosApuro, incidencias: n(g.incCount) };
}

/* Puntuación. Pesa sobre todo la puntualidad, después las circulaciones que
   llegan enteras al final, y penaliza la proporción de afectados y el gasto. */
function puntosTurno(g) {
  const b = balanceTurno(g);
  const base = b.punt * 10;
  const circulaciones = (b.completas / CIRCULACIONES) * 200;
  const castigoAfect = Math.min(400, b.tasaAfect * 12);
  const castigoCoste = Math.min(200, b.coste / 400);
  const castigoApuro = Math.min(150, b.minutosApuro * 1.5);
  return Math.round(base + circulaciones - castigoAfect - castigoCoste - castigoApuro);
}


/* Fotografía del final del turno: material, desgaste, taller y apartado
   pasan tal cual al turno siguiente. El personal, no: entra gente nueva. */
function estadoTrasTurno(g, camp) {
  const desg = { ...camp.desg, ...g.desg };
  for (const t of g.trenes) for (const u of t.unidades) desg[u.id] = u.desgaste;
  for (const lista of Object.values(g.apartado || {})) for (const x of lista) for (const u of x.unidades) desg[u.id] = u.desgaste;

  const averiadas = [...new Set([...camp.averiadas, ...Object.values(g.apartado || {}).flat().filter((x) => x.averiado).flatMap((x) => x.unidades.map((u) => u.id))])].filter(
    (id) => !(g.reparadas || []).includes(id)
  );

  // avanza el trabajo de taller y saca lo que ya está listo
  const taller = {};
  for (const [id, v] of Object.entries(g.taller || {})) {
    const restan = Math.max(0, v.restan - 1);
    if (restan > 0) taller[id] = { ...v, restan };
    else {
      desg[id] = Math.max(0, v.entrada - REVISIONES[v.tipo].quita);
      const k = averiadas.indexOf(id);
      if (k >= 0) averiadas.splice(k, 1); // reparada: vuelve a servir
    }
  }

  /* El apartado se hereda por NOMBRE de estación y recogiendo el de TODAS las
     líneas. Guardado por índice, al abrir el turno siguiente esos números
     apuntaban a otras estaciones —o a ninguna— en cuanto había más de una
     línea en juego, y el arranque fallaba.                             */
  const apartado = {};
  const activaAhora = g.linea || LINEAS_EN_JUEGO[0];
  for (const [idLin, trozo] of Object.entries(g.porLinea || { [activaAhora]: g })) {
    const ests = (LINEAS[idLin] || {}).estaciones || ESTACIONES;
    for (const [idx, lista] of Object.entries(trozo.apartado || {})) {
      const e = ests[Number(idx)];
      if (!e) continue;
      const guardadas = lista.filter((x) => x.unidades.length).map((x) => ({ via: x.via, ids: x.unidades.map((u) => u.id), averiado: !!x.averiado }));
      if (guardadas.length) apartado[e.n] = [...(apartado[e.n] || []), ...guardadas];
    }
  }

  const slots = g.trenes.filter((t) => !t.esVacio).map((t) => {
    const ids = t.unidades.map((u) => u.id);
    return [ids[0] || null, ids[1] || null];
  });

  /* Reposiciones que no han llegado a producirse antes del cierre: el turno
     siguiente las hereda y las resuelve en sus primeros minutos. Las horas se
     normalizan al día siguiente, porque la noche cruza la medianoche.     */
  const reponer = g.trenes
    .filter((t) => !t.esVacio && t.estado === "suprimido" && t.reponer)
    .map((t) => ({
      circ: t.i,
      // por nombre: el índice no vale entre líneas ni entre turnos
      donde: (ESTACIONES[t.reponer.idx] || {}).n,
      idx: t.reponer.idx,
      cuando: t.reponer.cuando % (24 * 60),
      ids: t.reponer.unidades.map((u) => u.id),
    }));

  /* La situación de la línea también se hereda: el turno entrante recoge la
     línea tal y como la deja el saliente. Sin esto, acabar con todo el
     servicio retrasado y los andenes llenos no tenía ninguna consecuencia. */
  /* Y se hereda POR LÍNEA: los retrasos, los andenes y las restricciones de la
     C-7 no valen para la C-1, que tiene otras circulaciones y otras
     estaciones. Guardado en común, el turno siguiente intentaba aplicar a una
     línea el estado de la otra.                                        */
  const porLineaFin = {};
  for (const [idLin, trozo] of Object.entries(g.porLinea || { [activaAhora]: g })) {
    porLineaFin[idLin] = {
      retrasos: (trozo.trenes || []).filter((t) => !t.esVacio).map((t) => Math.round(t.retraso * 10) / 10),
      andenes: (trozo.andenes || []).map((a2) => ({ alcala: Math.round(a2.alcala), pio: Math.round(a2.pio) })),
      restricciones: (trozo.restricciones || []).filter((x) => x.hasta > g.reloj).map((x) => ({ ...x, dura: Math.round(x.hasta - g.reloj) })),
    };
  }
  const propio = porLineaFin[activaAhora] || { retrasos: [], andenes: [], restricciones: [] };
  const retrasos = propio.retrasos;
  const andenes = propio.andenes;
  const restricciones = propio.restricciones;

  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const suprimidas = g.trenes.filter((t) => t.estado === "suprimido").length;
  const n = camp.acum.turnos + 1;
  const acum = {
    turnos: n,
    punt: (camp.acum.punt * camp.acum.turnos + punt) / n,
    afect: camp.acum.afect + Math.round(g.kpi.afect),
    coste: camp.acum.coste + g.kpi.coste,
    puntos: camp.acum.puntos + puntosTurno(g),
    suprimidas: camp.acum.suprimidas + suprimidas,
  };

  /* Ficha de este turno para el histórico. Se guarda lo justo para poder
     comparar turnos entre sí: con veinte turnos son unos 4 KB.          */
  const b = balanceTurno(g);
  const ficha = {
    dia: camp.dia,
    turno: camp.turno,
    turnoN: g.turnoN,
    punt: Math.round(b.punt * 10) / 10,
    ret: Math.round(b.retrasoMedio * 10) / 10,
    ocup: Math.round(b.ocupMedia),
    viajeros: Math.round(b.transportados),
    afect: Math.round(b.afect),
    coste: Math.round(b.coste),
    circ: b.completas,
    inc: b.incidencias,
    /* Calidad del turno: la nota general y la de cada línea con su desglose.
       Es lo que permite mirar atrás y ver si el servicio mejora o empeora, no
       solo si los trenes llegaban a su hora.                           */
    calidad: notaGeneral(g),
    calLineas: Object.fromEntries(
      Object.entries(g.porLinea || {}).map(([id, t]) => {
        const n = notaCalidad(t.cal);
        return [id, { nota: n.nota, retraso: n.retraso, agobio: n.agobio, material: n.material, roto: n.roto }];
      })
    ),
    puntos: puntosTurno(g),
    pico: Math.round(b.picoRetraso),
    horaPico: Math.round(b.horaPico),
    apuro: b.minutosApuro,
  };
  const historico = [...(camp.historico || []), ficha].slice(-60);

  /* Libro de averías. Las que no se resolvieron siguen abiertas y la unidad
     empieza el turno siguiente con ellas: continuar el servicio deja de salir
     gratis en cuanto pasa el día.                                       */
  const libro = { ...(camp.libro || {}) };
  for (const av of g.averiasTurno || []) {
    const hoja = [...(libro[av.id] || [])];
    hoja.push({ dia: camp.dia, turno: av.turno, m: av.m, tipo: av.tipo, nombre: av.nombre, grado: av.grado, resuelta: av.resuelta });
    libro[av.id] = hoja.slice(-12);
  }
  // el paso por taller cierra todas las averías abiertas de esa unidad
  for (const [id, v] of Object.entries(g.taller || {})) {
    if (v.restan - 1 > 0) continue;
    libro[id] = (libro[id] || []).map((x) => ({ ...x, resuelta: true, taller: v.dep }));
  }
  for (const id of g.reparadas || []) libro[id] = (libro[id] || []).map((x) => ({ ...x, resuelta: true, taller: "reparada" }));

  // lo que la unidad arrastra al turno siguiente
  const arrastradas = {};
  for (const [id, hoja] of Object.entries(libro)) {
    const abierta = [...hoja].reverse().find((x) => !x.resuelta);
    if (abierta) arrastradas[id] = { tipo: abierta.tipo, nombre: abierta.nombre, grado: abierta.grado };
  }

  const iT = ORDEN_TURNOS.indexOf(camp.turno);
  const ultimo = iT === ORDEN_TURNOS.length - 1;
  return { historico, libro, arrastradas, dia: ultimo ? camp.dia + 1 : camp.dia, turno: ultimo ? ORDEN_TURNOS[0] : ORDEN_TURNOS[iT + 1], desg, averiadas, taller, apartado, slots, reponer, retrasos, andenes, restricciones, porLineaFin, acum };
}

/* ── retirada nocturna ──────────────────────────────────────────
   El servicio se vacía poco a poco: se van retirando circulaciones
   hasta quedarse a cero sobre las 00:30. Las siete primeras mueren
   en los extremos y las seis últimas en Chamartín, para poder salir
   de allí hacia los dos lados a primera hora.                      */

const RETIRADA_INI = 22 * 60 + 15;
const RETIRADA_FIN = 24 * 60 + 45; // margen para cerrar el servicio

/* Reparte las circulaciones: primero las que mueren en los extremos,
   alternando una de cada dos para que el servicio se degrade parejo,
   y al final las seis que terminan en Chamartín.                   */
/* Retirada nocturna. Las cabeceras se cierran de forma escalonada: el último
   tren que llega a cada una se queda allí y a partir de ese momento nadie más
   va, así que sus vías dejan de hacer falta para invertir. Los que siguen en
   línea dan la vuelta en Chamartín y mueren allí.

   Príncipe Pío es el que manda: con tres vías y cuarenta minutos de inversión
   hay dos siempre ocupadas, de modo que sus tres estacionamientos solo caben
   al final. Por eso Pío cierra el último. Se recorren todas las horas de
   cierre posibles y se elige el plan cuya retirada sea más regular.       */
function planRetirada(libres) {
  /* Las cuotas se ajustan a las vías que de verdad quedan: el material que
     viene apartado de turnos anteriores ya ocupa sitio, y pedir tres plazas
     en Pío cuando solo hay dos hacía que el sobrante acabara en Torrejón. */
  /* Se aparca poco en los extremos y mucho en Chamartín, que es donde hay
     sitio: dos en Príncipe Pío —además de la que suele quedar todo el día en
     la vía 30—, tres en Alcalá y el resto en Chamartín. Las cuotas se recortan
     solas si el material del día ya ocupa vías.                          */
  const hueco = libres || { [PIO]: 3, [ALCALA]: 4, [CHAMARTIN]: 12 };
  const cuotaPio = Math.max(0, Math.min(2, hueco[PIO]));
  const cuotaAlc = Math.max(0, Math.min(3, hueco[ALCALA]));
  const FASES_CAB = {
    [PIO]: [LLEGA_PIO],
    [ALCALA]: [LLEGA_ALCALA],
    [CHAMARTIN]: [ESTACIONES[IDX_CHAMARTIN].t, LLEGA_PIO - ESTACIONES[IDX_CHAMARTIN].t],
  };
  const CAPACIDAD = { [PIO]: hueco[PIO], [ALCALA]: hueco[ALCALA] };
  const INVERSION = { [PIO]: INV_PIO, [ALCALA]: INV_ALCALA };

  const llegadas = (circ, cab, desde, hasta) => {
    const off = (circ - 1) * INTERVALO;
    const out = [];
    // hasta cubrir la ventana pedida, no un número fijo de vueltas
    const kTope = Math.ceil((hasta - off) / CICLO) + 1;
    for (const q of FASES_CAB[cab]) for (let k = 0; k <= kTope; k++) {
      const T = off + q + CICLO * k;
      if (T >= desde && T <= hasta) out.push(T);
    }
    return out.sort((a, b) => a - b);
  };

  // ocupación máxima real de una cabecera con ese plan
  const pico = (plan, cab) => {
    const ev = [];
    for (let c = 1; c <= CIRCULACIONES; c++) {
      const { hora, destino } = plan[c];
      for (const T of llegadas(c, cab, RETIRADA_INI - 120, RETIRADA_FIN + 240)) {
        if (T > hora) break; // ya está retirado: no vuelve a llegar
        if (destino === cab && T === hora) ev.push([T, 1]);
        else {
          ev.push([T, 1]);
          ev.push([T + INVERSION[cab], -1]);
        }
      }
    }
    ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let o = 0;
    let mx = 0;
    for (const [, d] of ev) {
      o += d;
      mx = Math.max(mx, o);
    }
    return mx;
  };

  let mejor = null;
  for (let Tp = RETIRADA_INI; Tp <= RETIRADA_INI + 300; Tp += INTERVALO)
    for (let Ta = RETIRADA_INI; Ta <= RETIRADA_INI + 360; Ta += INTERVALO) {
      const plan = {};
      let ok = true;
      for (const [cab, n, tope] of [[ALCALA, cuotaAlc, Ta], [PIO, cuotaPio, Tp]]) {
        const ev = [];
        for (let c = 1; c <= CIRCULACIONES; c++) {
          if (plan[c]) continue;
          const l = llegadas(c, cab, RETIRADA_INI - 120, tope);
          if (l.length) ev.push({ T: l[l.length - 1], c });
        }
        if (ev.length < n) {
          ok = false;
          break;
        }
        ev.sort((a, b) => a.T - b.T);
        for (const { T, c } of ev.slice(-n)) plan[c] = { hora: T, destino: cab };
      }
      if (!ok) continue;

      // el resto da la vuelta en Chamartín antes de pisar una cabecera cerrada
      for (let c = 1; c <= CIRCULACIONES && ok; c++) {
        if (plan[c]) continue;
        const sp = llegadas(c, PIO, Tp + 1, Tp + 500)[0];
        const sa = llegadas(c, ALCALA, Ta + 1, Ta + 500)[0];
        const limite = Math.min(sp === undefined ? 1e9 : sp, sa === undefined ? 1e9 : sa);
        const ts = llegadas(c, CHAMARTIN, RETIRADA_INI - 120, limite);
        if (!ts.length) ok = false;
        else plan[c] = { hora: ts[ts.length - 1], destino: CHAMARTIN };
      }
      if (!ok || Object.keys(plan).length < CIRCULACIONES) continue;
      if (pico(plan, PIO) > CAPACIDAD[PIO] || pico(plan, ALCALA) > CAPACIDAD[ALCALA]) continue;

      // se prefiere el vaciado más regular: nada de retirar seis de golpe
      const hs = Object.values(plan)
        .map((x) => x.hora)
        .sort((a, b) => a - b);
      let juntas = 0;
      for (let k = 0; k < hs.length - 1; k++) if (hs[k + 1] - hs[k] < 8) juntas += 1;
      const coste = juntas * 60 + (hs[hs.length - 1] - hs[0]) * 0.1;
      if (!mejor || coste < mejor.coste) mejor = { coste, plan };
    }

  return mejor ? mejor.plan : {};
}

function programarArranque(g) {
  const disponibles = [];
  for (const [i, lista] of Object.entries(g.apartado))
    for (const x of lista) if (!x.averiado) disponibles.push({ idx: Number(i), via: x.via, lote: x });

  const comb = [];
  for (const t of g.trenes) {
    if (t.estado !== "suprimido") continue;
    for (const d of disponibles) {
      // se admiten entradas posteriores al cierre: las hereda el turno de mañana
      const cuando = proximaReposicion(t, d.idx, g.reloj, FIN + 120);
      if (cuando !== null) comb.push({ cuando, t, d });
    }
  }
  comb.sort((a2, b2) => a2.cuando - b2.cuando);

  const trenesUsados = new Set();
  const lotesUsados = new Set();
  for (const { cuando, t, d } of comb) {
    if (trenesUsados.has(t.i) || lotesUsados.has(d.lote)) continue;
    trenesUsados.add(t.i);
    lotesUsados.add(d.lote);
    const { idx, via, lote } = d;

    // entra un maquinista de refresco para el arranque
    const maq = {
      id: `N${String(t.i).padStart(2, "0")}`,
      nombre: nombreDe(CIRCULACIONES + t.i),
      tipo: "nominal",
      estado: "entrante",
      lugar: cabeceraDe(idx),
      entra: cuando - 20,
      cond: 0,
      jornada: 0,
      descanso: 0,
      baja: false,
      tren: null,
      ...atributos(),
    };
    g.personal = [...g.personal, maq];

    g.apartado = { ...g.apartado, [idx]: (g.apartado[idx] || []).filter((x) => x !== lote) };
    t.reponer = { idx, cab: cabeceraDe(idx), cuando, unidades: lote.unidades.map((u) => ({ ...u })), maq: maq.id };
    log(g, "ok", `Circulación ${t.i}: saldrá de ${ESTACIONES[idx].n}${via ? `, ${via}` : ""}, a las ${hhmm(cuando)}.`);
  }
}

/* Arranca el turno con todas las líneas en juego. La principal se construye
   con el material que ha asignado el jugador; las demás, con su parque propio
   y de forma automática, porque de momento no se gestionan a mano.     */
function comenzarTurno(slots, apart, camp) {
  /* Puede recibir el reparto de una sola línea —una lista de circulaciones— o
     el de todas, indexado por línea. Se normaliza aquí para que el resto no
     tenga que distinguirlo.                                             */
  const bruto = slots && !Array.isArray(slots) ? slots : { [LINEAS_EN_JUEGO[0]]: slots };
  const asigLineas = {};
  for (const [id, v] of Object.entries(bruto || {})) asigLineas[id] = Array.isArray(v) ? v : v && v.slots;

  /* Reparto del material apartado: cada composición va a una sola línea. La
     principal se queda con lo que esté en sus estaciones.              */
  const yaRepartido = new Set();
  const suyoPrincipal = {};
  for (const [k, v] of Object.entries(apart || {})) {
    const donde = k.split("|")[0];
    const L0 = LINEAS[LINEAS_EN_JUEGO[0]];
    if (L0.estaciones.some((e) => e.n === donde) || Number.isFinite(Number(donde))) {
      suyoPrincipal[k] = v;
      yaRepartido.add(k);
    }
  }
  /* Todo lo que el jugador ha asignado, en cualquier línea. Se le pasa ya a la
     primera para que no se lleve a la reserva material que otra necesita:
     antes la C-7 apartaba como reserva Civias que la C-1 tenía en servicio. */
  const asignadasTodas = new Set();
  for (const v of Object.values(asigLineas)) {
    const planas = (v || []).flat();
    for (const x of planas) if (x) asignadasTodas.add(x);
  }
  for (const v of Object.values(apart || {})) {
    for (const x of v || []) if (x) asignadasTodas.add(x);
  }

  const g0 = comenzarLinea(asigLineas[LINEAS_EN_JUEGO[0]], suyoPrincipal, camp, LINEAS_EN_JUEGO[0], asignadasTodas);
  g0.porLinea = {};
  guardarLinea(g0, LINEAS_EN_JUEGO[0]);

  /* Material ya comprometido. Sin esto la segunda línea cogía unidades que
     ya estaban dando servicio en la primera, y el mismo tren aparecía en dos
     sitios a la vez.                                                    */
  const usadas = new Set([
    ...g0.trenes.flatMap((t) => t.unidades.map((u) => u.id)),
    ...g0.reserva.map((u) => u.id),
    ...Object.values(g0.apartado || {}).flat().flatMap((x) => x.unidades.map((u) => u.id)),
  ]);

  for (const id of LINEAS_EN_JUEGO.slice(1)) {
    /* Las circulaciones que el jugador haya asignado a esta línea. Puede
       llegar como lista directa o envuelta en un objeto.               */
    const suya = asigLineas[id];
    const slotsId = Array.isArray(suya) ? suya : suya && suya.slots;
    /* El apartado de una estación compartida se le entrega a UNA línea: es
       material físico y no puede estar en dos sitios. Las demás lo ven desde
       el perfil de la estación y pueden tomarlo durante el turno.      */
    const suyo = {};
    for (const [k, v] of Object.entries(apart || {})) {
      const donde = k.split("|")[0];
      if (yaRepartido.has(k)) continue;
      const enEsta = LINEAS[id].estaciones.some((e) => e.n === donde || String(LINEAS[id].estaciones.indexOf(e)) === donde);
      if (!enEsta) continue;
      suyo[k] = v;
      yaRepartido.add(k);
    }
    const gx = comenzarLinea(slotsId || null, suyo, camp, id, usadas);
    for (const t of gx.trenes) for (const u of t.unidades) usadas.add(u.id);
    for (const u of gx.reserva) usadas.add(u.id);
    g0.porLinea[id] = {};
    for (const k2 of CAMPOS_LINEA) g0.porLinea[id][k2] = gx[k2];
    // el registro del turno es común: se acumula lo que aporta cada línea
    g0.log = [...g0.log, ...gx.log.filter((l) => l.k !== "info")];
  }
  /* Los maquinistas de reserva son del TURNO, no de una línea: los cinco de
     Chamartín pueden acudir a la C-7, a la C-1 o a la que se añada mañana. Se
     sacan de las listas de cada línea y se guardan aparte, en una bolsa común
     a la que todas acuden.                                             */
  g0.reservaPersonal = [];
  const cubiertos = {}; // cuántos se han dado ya de alta en cada estación
  for (const [id, trozo] of Object.entries(g0.porLinea)) {
    const suyos = (trozo.personal || []).filter((m) => m.tipo === "reserva");
    trozo.personal = (trozo.personal || []).filter((m) => m.tipo !== "reserva");
    /* Cada estación aporta los suyos UNA vez. Si dos líneas paran en Chamartín,
       las dos daban de alta a los cinco y el turno acababa con diez.    */
    for (const m of suyos) {
      const tope = (RESERVAS_RED.find(([donde]) => donde === m.lugar) || [null, 0])[1];
      const ya = cubiertos[m.lugar] || 0;
      if (ya >= tope) continue;
      cubiertos[m.lugar] = ya + 1;
      g0.reservaPersonal.push(m);
    }
    if (id === LINEAS_EN_JUEGO[0]) g0.personal = trozo.personal;
  }

  entrarLinea(g0, LINEAS_EN_JUEGO[0]);
  return g0;
}

function comenzarLinea(slots, apart, camp, idLinea, comprometidas) {
  fijarLinea(idLinea);
  /* El apartado llega indexado por NOMBRE de estación, porque una misma vía
     tiene distinto número en cada línea: Chamartín es la 10 en la C-7 y la 0
     en la C-1. Aquí se traduce a los índices de esta línea y se descarta lo
     que corresponda a estaciones por las que no pasa.                  */
  if (apart) {
    const traducido = {};
    for (const [k, v] of Object.entries(apart)) {
      const [donde, via] = k.split("|");
      const i = Number.isFinite(Number(donde)) ? Number(donde) : ESTACIONES.findIndex((e) => e.n === donde);
      if (i >= 0 && ESTACIONES[i]) traducido[clave(i, via)] = v;
    }
    apart = traducido;
  }
  /* Sin asignación del jugador, la línea arranca con el material que le
     corresponde: tantas composiciones sencillas como circulaciones, y sin
     tocar el que ya está comprometido en otra línea.                  */
  if (!slots) {
    const L = LINEAS[idLinea];
    const ocupadas = comprometidas || new Set();
    const libres = CATALOGO.filter((u) => L.series.includes(u.serie) && !ocupadas.has(u.id)).slice(0, CIRCULACIONES);
    slots = libres.map((u) => [u.id, null]);
    while (slots.length < CIRCULACIONES) slots.push([null, null]);
  }
  const defTurno = TURNOS.find((x) => x.id === TURNO_ID) || TURNOS[0];
  const personal = [];
  let k = 0;
  const alta = (props) => {
    const m = { id: `M${String(k + 1).padStart(2, "0")}`, nombre: nombreDe(k), cond: 0, jornada: 0, descanso: 0, baja: false, tren: null, entra: INICIO, ...atributos(), ...props };
    personal.push(m);
    k += 1;
    return m;
  };

  // 1. maquinistas nominales que ya están conduciendo al abrir el turno
  const titulares = slots.map((_, j) =>
    alta({ tipo: "nominal", estado: "conduciendo", lugar: null, tren: j + 1, cond: j * 20, jornada: j * 20 })
  );

  // el desgaste heredado manda sobre el del catálogo
  const conDesgaste = (id) => {
    const c = CATALOGO.find((u) => u.id === id);
    if (!c) return null;
    const d = camp && camp.desg[id] !== undefined ? camp.desg[id] : c.desgaste;
    /* Si la unidad ya venía pasada de ciclo, sigue marcada: al reconstruirla
       del catálogo cada turno se le borraba la marca y volvía a avisar. La
       446-103 llegó a pedir taller dieciocho veces en veinte turnos.    */
    return { ...c, desgaste: d, fiab: fiabDesgaste(d), vencida: d >= DESGASTE_MAX };
  };

  const trenes = slots.map((par, j) => {
    const unidades = par.filter(Boolean).map(conDesgaste).filter(Boolean);
    const t = {
      i: j + 1,
      serie: unidades[0] ? unidades[0].serie : "446",
      unidades,
      // el desfase coloca la cadencia en los minutos reales de salida
      offset: j * INTERVALO + DESFASE,
      retraso: 0,
      estado: "servicio",
      maq: titulares[j].id,
      relevo: null,
      rotacion: null,
      rotando: null,
      avisoRot: false,
      avisoCab: false,
      esperaCab: null,
      viaCab: null,
      hist: [],
      cuadroRelevos: [], // relevos previstos por el cuadro, en orden
      /* Posición minuto a minuto para la malla. Se guarda solo el número de
         estación con un decimal: un turno entero son 480 valores por tren, que
         en el guardado ocupan poco más de 2 KB.                          */
      traza: [],
      marchas: [], // recorridos realmente efectuados, para el historial // sucesos que han movido el retraso
      acum: { paradas: 0, maquinista: 0, bloqueo: 0 }, // deriva continua acumulada
      pax: new Array(N).fill(0), // viajeros a bordo, por estación de destino
      buffer: 0, // exceso de tiempo de parada pendiente de aplicar
      dejados: 0,
      limitacion: 0,
      retirarCab: false,
      cambio: null,
      apartaPaso: null,
      supresion: null, // supresión ordenada: { idx, via }
      pendienteApartar: false, // material vacío a la espera de destino
      inmovil: null, // avería muy grave: { desde, restante, socorre }
      alarmaSuelta: null, // hora en que puede repetirse la alarma
      altercadoVivo: null, // hora en que se comprueba si el altercado va a más
      carteristas: false, // siguen a bordo tras una medida insuficiente
      climaViciada: null, // hora en que se comprueba si el ambiente estalla
      degradada: null, // marcha con pérdida periódica por avería sin resolver
      degradaGrado: null, // grado en que quedó la avería que se arrastra
      averiaHeredada: null, // avería sin resolver que viene del turno anterior
      esperaTransbordo: null, // el primer tren del mismo sentido recogerá su pasaje
      porContraria: null, // recorre un tramo banalizado por la vía del otro sentido
      idxPrev: null, // posición del minuto anterior, para saber si acaba de entrar
      dirPrev: null,
      esperaVia: null, // sin vía libre a la entrada de una estación
      nocheEn: null, // dónde ha quedado estacionado al cierre del servicio
      viaPaso: null, // vía que ocupa al pasar por una estación con varias
      vacio: false, // circula sin viajeros, con bypass de puertas
      reponer: null, // reposición pendiente: { idx, cab, unidades, maq, cuando }
      enDesviada: null,
      enVU: null, // autorización vigente para ocupar un tramo de vía única
      esperaCruce: null,
      bloqueadoPor: null,
      retenido: false,
      excesoAutorizado: false,
      avisado: false,
      relevoConReserva: false,
      retDesde: null,
      detenido: null,
      riesgo: 0,
    };
    t.relevo = programarRelevo(t, titulares[j], INICIO);
    return t;
  });

  /* 2. El cuadro prevé TODOS los relevos que necesitará cada circulación
        hasta el cierre, no solo el primero. El turno dura 480 min y la
        conducción máxima seguida son 330, así que un maquinista que entra a
        media mañana tampoco llega al final: hacen falta dos relevos en nueve
        de las trece circulaciones. Dando de alta solo el primero, esas nueve
        avisaban de "sin relevo" todos los días sin que pasara nada raro.  */
  for (const t of trenes) {
    let cuando = t.relevo;
    let vueltas = 0;
    t.cuadroRelevos = [];
    while (cuando && vueltas < 6) {
      vueltas += 1;
      alta({ tipo: "nominal", estado: "entrante", lugar: cuando.cab, entra: Math.max(INICIO, cuando.prevista - 25) });
      t.cuadroRelevos.push({ prevista: cuando.prevista, cab: cuando.cab, desde: cuando.desde });
      // el que entra sale de descanso, con la jornada a cero
      const entrante = { cond: 0, jornada: 0, descanso: 0 };
      cuando = programarRelevo(t, entrante, cuando.prevista);
    }
    // el primero del cuadro es el relevo en curso
    t.cuadroRelevos.shift();
  }

  // 3. reservas de contingencia
  for (const [cab, n] of RESERVAS) for (let x = 0; x < n; x++) alta({ tipo: "reserva", estado: "reserva", lugar: cab });

  const usadas = new Set(slots.flat().filter(Boolean));
  const apartado = {};
  const enVia = new Set();

  if (camp && camp.apartado && Object.keys(camp.apartado).length) {
    /* Apartado heredado, indexado por nombre de estación. Solo se recoge lo
       que está en estaciones de ESTA línea: lo demás pertenece a otra y lo
       recogerá ella.                                                    */
    for (const [donde, lista] of Object.entries(camp.apartado)) {
      const idx = Number.isFinite(Number(donde)) ? Number(donde) : ESTACIONES.findIndex((e) => e.n === donde);
      if (idx < 0 || !ESTACIONES[idx]) continue;
      for (const x of lista) {
        const uds = x.ids.map(conDesgaste).filter(Boolean);
        if (!uds.length) continue;
        apartado[idx] = [...(apartado[idx] || []), { via: x.via, unidades: uds, desde: INICIO, averiado: x.averiado }];
        x.ids.forEach((id) => enVia.add(id));
      }
    }
  } else {
    for (const [k, par] of Object.entries(apart || {})) {
      const ids = par.filter(Boolean);
      if (!ids.length) continue;
      const [i, via] = k.split("|");
      const idx = Number(i);
      apartado[idx] = [...(apartado[idx] || []), { via, unidades: ids.map(conDesgaste).filter(Boolean), desde: INICIO }];
      ids.forEach((id) => enVia.add(id));
    }
  }

  // las unidades averiadas heredadas siguen inútiles hasta pasar por taller
  if (camp)
    for (const lista of Object.values(apartado))
      for (const x of lista) if (x.unidades.some((u) => camp.averiadas.includes(u.id))) x.averiado = true;

  const enTaller = new Set(Object.keys(camp ? camp.taller : {}));
  /* Reposiciones heredadas del turno anterior: esas circulaciones empiezan
     fuera de servicio y entran a la hora que les tocaba, con su material y
     un maquinista dado de alta veinte minutos antes.                     */
  const heredadas = new Set();
  if (camp && camp.reponer)
    for (const rp of camp.reponer) {
      const t = trenes[rp.circ - 1];
      if (!t) continue;
      const uds = rp.ids.map(conDesgaste).filter(Boolean);
      if (!uds.length) continue;
      /* Se localiza por nombre, y si esa estación no pertenece a esta línea la
         reposición es de otra: no se puede cumplir aquí.               */
      const idxRep = rp.donde ? ESTACIONES.findIndex((e) => e.n === rp.donde) : rp.idx;
      const cab = cabeceraDe(idxRep);
      if (!cab) continue;
      const m = alta({ tipo: "nominal", estado: "entrante", lugar: cab, entra: Math.max(INICIO, rp.cuando - 20) });
      t.estado = "suprimido";
      t.unidades = [];
      t.maq = null;
      t.reponer = { idx: idxRep, cab, cuando: rp.cuando, unidades: uds, maq: m.id };
      rp.ids.forEach((id) => heredadas.add(id));
    }

  /* En el turno de noche cada circulación conoce desde el principio dónde y
     cuándo termina, para que haya tiempo de decidir la vía de estacionamiento
     con calma en vez de tener que hacerlo cuando el tren ya está llegando. */
  let planNoche = null;
  let avisoNoche = null;
  if (defTurno.id === "noche") {
    // vías libres de cada cabecera, descontando el material ya estacionado
    const libresCab = {};
    for (const [cab, idx] of [[PIO, IDX_PIO], [ALCALA, IDX_ALCALA], [CHAMARTIN, IDX_CHAMARTIN]]) {
      const e = ESTACIONES[idx];
      const todas = [...new Set([...(e.rotVias || []), ...(e.apartVias || [])])];
      const ocupadas = new Set((apartado[idx] || []).map((x) => x.via));
      libresCab[cab] = todas.filter((v) => !ocupadas.has(v)).length;
    }
    const totalLibre = Object.values(libresCab).reduce((n, v) => n + v, 0);
    planNoche = planRetirada(libresCab);
    const plan = planNoche;
    for (const t of trenes) {
      const pl = plan[t.i];
      if (!pl) continue;
      const idxD = ESTACIONES.findIndex((e) => e.cab === pl.destino);
      if (idxD < 0) continue;
      t.supresion = { idx: idxD, via: null, noche: true, hora: pl.hora };
      // la elección de vía se abre al empezar la retirada, no antes
      t.pendienteApartar = false;
    }
    // si el material de turnos anteriores ocupa demasiado, no cabrá todo
    if (totalLibre < CIRCULACIONES) avisoNoche = totalLibre;
  }

  /* El turno entrante recibe la línea como está: con los retrasos que
     arrastra cada circulación y con la gente que sigue esperando en los
     andenes. Es lo que hace que un turno mal llevado se pague en el
     siguiente.                                                          */
  /* Lo heredado es el de ESTA línea. La campaña lo guarda por línea desde que
     hay más de una; si viene de una partida antigua se usa el común.   */
  const heredado = (camp && camp.porLineaFin && camp.porLineaFin[idLinea]) || (camp && idLinea === LINEAS_EN_JUEGO[0] ? camp : null);
  if (heredado && heredado.retrasos) trenes.forEach((t, j) => { if (heredado.retrasos[j] !== undefined) t.retraso = heredado.retrasos[j]; });

  // el cuadro completo del día: lo que cada circulación debería hacer
  // solo las marchas del turno: las de antes no le corresponden a este puesto
  for (const t of trenes) t.marchas = rotacionDelDia(t, INICIO, FIN).map((m) => ({ ...m, estado: "prevista" }));

  /* Averías heredadas: la unidad que terminó el turno anterior con una avería
     sin resolver la sigue teniendo. Se avisa al abrir el turno y el tren
     arranca ya con la marcha degradada que le corresponda.              */
  if (camp && camp.arrastradas)
    for (const t of trenes) {
      const rota = t.unidades.map((u) => camp.arrastradas[u.id]).find(Boolean);
      if (!rota) continue;
      t.degradada = rota.grado === "habitual" ? { min: 15, cada: 90, agrava: 0.05, desde: INICIO, tipo: rota.tipo } : { min: 5, cada: 90, agrava: 0.05, desde: INICIO, tipo: rota.tipo };
      t.degradaGrado = rota.grado;
      t.averiaHeredada = rota.nombre;
    }

  // primer punto de la traza: sin él la línea del gráfico arranca en el aire
  for (const t of trenes) t.traza = [t.estado === "suprimido" ? null : Math.round(situacion(t, INICIO).idx * 10)];

  /* La reserva de una línea no puede incluir material que ya está dando
     servicio en otra: sin esta comprobación, cada línea se llevaba la flota
     libre entera y las mismas unidades aparecían en las dos.          */
  const reserva = LIBRES_C7.filter(
    (u) =>
      !usadas.has(u.id) &&
      !enVia.has(u.id) &&
      !enTaller.has(u.id) &&
      !heredadas.has(u.id) &&
      !(comprometidas && comprometidas.has(u.id) && !(slots || []).flat().includes(u.id)) &&
      ((LINEAS[idLinea] || {}).series || ["446", "465", "450"]).includes(u.serie)
  ).map((u) =>
    conDesgaste(u.id)
  );

  /* Circulaciones que quedaron sin material. Perder un tren durante el turno
     es una consecuencia justa; arrastrarlo para siempre, no: al abrir el turno
     siguiente el taller cubre el hueco con lo que haya disponible. Sin esto la
     flota se degradaba sin vuelta atrás, de trece circulaciones a cinco en una
     veintena de turnos.                                                    */
  const libres = reserva.filter((u) => cubreTurno(u));
  const cogerPar = (serie) => {
    const k = libres.findIndex((u) => u.serie === serie);
    return k >= 0 ? libres.splice(k, 1)[0] : null;
  };
  for (const t of trenes) {
    if (t.unidades.length || t.reponer) continue;
    // primero un doble piso, que va solo; si no, una pareja de la misma serie
    const suelta = cogerPar("450");
    if (suelta) t.unidades = [suelta];
    else
      for (const se of ["465", "446"]) {
        const a1 = cogerPar(se);
        const a2 = a1 ? cogerPar(se) : null;
        if (a1 && a2) {
          t.unidades = [a1, a2];
          break;
        }
        if (a1) libres.push(a1); // sin pareja no sirve: vuelve a la reserva
      }
    if (t.unidades.length) {
      t.serie = t.unidades[0].serie;
      for (const u of t.unidades) reserva.splice(reserva.findIndex((x) => x.id === u.id), 1);
    } else t.estado = "suprimido"; // no queda material: sigue sin cubrir
  }

  return {
    fase: "turno",
    turno: defTurno.id,
    turnoN: defTurno.n,
    retirada: planNoche, // calculado arriba, con las vías ya ocupadas
    avisoNoche,
    corte: false, // el servicio ya se ha interrumpido esta noche
    reloj: INICIO,
    ultimoMin: INICIO,
    marcha: true,
    vel: 1, // toda partida empieza a velocidad real
    trenes,
    personal,
    reserva,
    kpi: { ...KPI_INICIAL },
    log: [{ m: INICIO, k: "info", t: `Turno abierto. ${trenes.length} circulaciones y ${RESERVAS.reduce((n2, r2) => n2 + r2[1], 0)} maquinistas de reserva.` }],
    cola: [],
    reparadas: [], // salidas del taller en este turno: ya no están averiadas
    pedirDestino: null, // circulación que espera que se le elija dónde apartarse
    pedirRescate: null, // circulación inmovilizada que espera material de rescate
    averiasTurno: [],
    // contador de calidad propio: si no se crea aquí, la segunda línea acumula
    // sobre el objeto de la primera y las dos acaban con la misma nota
    cal: { retraso: 0, agobio: 0, material: 0, roto: 0, viajeros: 0 }, // averías declaradas en este turno, para el libro
    /* Registro para la pantalla de estadísticas. Se toma una muestra cada diez
       minutos, que son unas cincuenta por turno: suficiente para dibujar la
       evolución del día sin engordar el guardado.                        */
    estad: { muestras: [], suben: new Array(N).fill(0), bajan: new Array(N).fill(0), esperaMax: new Array(N).fill(0) },
    vacios: [], // movimientos ordenados cuyo maquinista aún va de camino
    // en campaña se hereda el taller del turno anterior; si no, el de apertura
    taller: camp
      ? { ...camp.taller }
      : Object.fromEntries(
          CATALOGO.filter((u) => u.enTaller).map((u) => [
            u.id,
            { dep: u.deposito, tipo: "general", restan: 1 + Math.floor(h(u.km, 11) * 3), entrada: u.desgaste, ajena: true },
          ])
        ),
    desg: camp ? { ...camp.desg } : {}, // desgaste vivo fuera de los trenes
    // los viajeros que quedaron en el andén siguen ahí al cambiar el turno
    andenes: heredado && heredado.andenes && heredado.andenes.length === N ? heredado.andenes.map((a2) => ({ ...a2 })) : ESTACIONES.map(() => ({ alcala: 0, pio: 0 })),
    apartado,
    // las restricciones que seguían vigentes continúan, con su tiempo restante
    restricciones: heredado && heredado.restricciones ? heredado.restricciones.map((x) => ({ ...x, hasta: INICIO + x.dura })) : [],
    incCount: 0,
    incEspera: 0,
    proximoSorteo: INICIO + 20 + Math.floor(Math.random() * 25),
    fin: false,
  };
}

/* Un tren en marcha nunca puede "sumar retraso" sin más: la posición se
   deriva de reloj − retraso, así que sumarlo lo haría retroceder. Lo correcto
   es detenerlo esos minutos, que es lo que pasa en la vía. Si ya está parado
   en cabecera, el retraso sí se suma directo porque no se mueve.            */
function apunta(g, t, txt, min) {
  t.hist = [...t.hist, { m: Math.floor(g.reloj), txt, min }].slice(-40);
}

function retrasar(g, t, m, motivo) {
  if (m <= 0 || t.estado === "suprimido") return;
  apunta(g, t, motivo || "incidencia", m);
  const p = fase(t, g.reloj);
  const enParada = (p >= LLEGA_ALCALA && p < SALE_ALCALA) || p >= LLEGA_PIO;
  if (enParada || t.rotando || t.retenido) {
    t.retraso += m;
  } else {
    t.detenido = { restante: (t.detenido ? t.detenido.restante : 0) + m, motivo: motivo || "incidencia" };
  }
}

function log(g, k, t) {
  g.log = [...g.log, { m: Math.floor(g.reloj), k, t }].slice(-90);
}

// reservas de contingencia: solo para lo que se sale del cuadro
const esReservaLibre = (g, m, cab) =>
  m.tipo === "reserva" && m.estado === "reserva" && m.lugar === cab && !m.baja && margenDe(m) >= margenExigido(g);

/* Las reservas de Chamartín sirven a todas las líneas: un maquinista que está
   allí de reserva puede tomar el servicio de cualquiera. Se buscan primero en
   la plantilla de la propia línea y, si no queda ninguna, en las demás; al
   tomar una de otra línea, se traspasa a esta.                         */
/* Cuenta de reservas para PINTAR: recorre todas las líneas sin mover a nadie.
   La otra función traslada maquinistas de una línea a otra, y llamarla al
   dibujar cambiaría el estado solo por mirar el mapa.                   */
/* Reservas libres en toda la red, estén donde estén. Pueden desplazarse. */
function reservasLibresTotal(g) {
  const libre = (m) => m.tipo === "reserva" && m.estado === "reserva" && !m.baja && !m.tren;
  return ((g.personal || []).filter(libre).length + (g.reservaPersonal || []).filter(libre).length);
}


function reservasVisibles(g, cab) {
  return ((g.personal || []).filter((m) => esReservaLibre(g, m, cab)).length + (g.reservaPersonal || []).filter((m) => esReservaLibre(g, m, cab)).length);
}


// cabeceras que de verdad tienen bolsa de reservas en este turno
function tieneReservas(g, cab) {
  /* Mira también la bolsa común del turno, que es donde están de verdad: sin
     esto el mapa no pintaba ninguna reserva aunque las hubiera.        */
  const enLista = (lista) => (lista || []).some((m) => m.tipo === "reserva" && m.lugar === cab);
  if (enLista(g.reservaPersonal)) return true;
  if (enLista(g.personal)) return true;
  return Object.values(g.porLinea || {}).some((t) => enLista(t.personal));
}


/* Reservas libres en una cabecera. Salen de la bolsa común del turno: no
   pertenecen a ninguna línea, así que cualquiera puede echar mano de ellas.
   Al asignarles un tren pasan a la plantilla de esa línea.             */
function reservasEn(g, cab) {
  const propias = (g.personal || []).filter((m) => esReservaLibre(g, m, cab));
  const bolsa = (g.reservaPersonal || []).filter((m) => esReservaLibre(g, m, cab));
  return [...propias, ...bolsa];
}

/* Un reserva que ya ha tomado un tren deja de estar disponible: se incorpora a
   la plantilla de la línea que lo ha llamado.                          */
/* El maquinista de un tren. Puede estar en la plantilla de la línea o todavía
   en la bolsa común, si acaba de tomar el servicio este mismo minuto. Se busca
   en los dos sitios desde un único punto, para no tener que acordarse en cada
   uno de los que lo consultan.                                          */
function maqDe(g, t) {
  if (!t || !t.maq) return null;
  return (g.personal || []).find((x) => x.id === t.maq) || (g.reservaPersonal || []).find((x) => x.id === t.maq) || null;
}

function incorporarReservas(g) {
  if (!g.reservaPersonal || !g.reservaPersonal.length) return;
  /* Se incorporan a la línea los que ya tienen tren asignado AQUÍ. Si se
     miraba solo su estado, un reserva llamado por otra línea se incorporaba a
     la equivocada y su tren se quedaba con un maquinista que no figuraba en
     ninguna plantilla.                                                  */
  const mios = new Set(g.trenes.map((t) => t.maq).filter(Boolean));
  const tomados = g.reservaPersonal.filter((m) => mios.has(m.id));
  if (!tomados.length) return;
  g.reservaPersonal = g.reservaPersonal.filter((m) => !tomados.includes(m));
  g.personal = [...g.personal, ...tomados];
}



// relevo ordinario: el nominal al que le toca entrar en esa cabecera
/* Margen que se le exige a quien entra de relevo. Pedir siempre una hora
   descartaba a todos los maquinistas al final del turno: a las 20:12, con el
   servicio cerrando, ninguno tiene una hora por delante, y el tren se quedaba
   sin relevo teniendo dos disponibles en el andén.                       */
function margenExigido(g) {
  return Math.max(20, Math.min(60, FIN - g.reloj));
}

function nominalEn(g, cab) {
  const min = margenExigido(g);
  return g.personal.filter((m) => m.tipo === "nominal" && m.estado === "entrante" && m.lugar === cab && m.entra <= g.reloj && !m.baja && margenDe(m) >= min);
}

/* ── motor ──────────────────────────────────────────────────── */

/* Un minuto de turno. Lo común —el reloj, el sorteo de incidencias, el fin de
   turno— se resuelve una vez; el movimiento de trenes, los andenes, el
   personal y la vía única se resuelven línea por línea.               */
function minuto(g) {
  const r = g.reloj;
  const activa = g.linea || LINEAS_EN_JUEGO[0];

  for (const id of Object.keys(g.porLinea || { [activa]: 1 })) {
    entrarLinea(g, id);
    const antes = g.cola.length;
    minutoLinea(g, r);
    /* Todo aviso nacido en este minuto pertenece a esta línea. Se anota aquí y
       no en cada punto donde se encola: eran once sitios distintos y solo uno
       lo hacía, así que el resto acababan atribuidos a la línea que estuviera
       mirando el jugador.                                               */
    for (let k = antes; k < g.cola.length; k++) if (!g.cola[k].linea) g.cola[k].linea = id;
    guardarLinea(g, id);
  }
  entrarLinea(g, activa);

  return g;
}

function minutoLinea(g, r) {
  incorporarReservas(g);
  llenarAndenes(g);
  calidadDelMinuto(g, r);
  reaccionesDelMinuto(g, r);

  for (const m of g.personal) {
    if (m.estado === "conduciendo") {
      m.cond += 1;
      m.jornada += 1;
    } else if (m.estado === "maniobras") {
      if (m.hasta && r >= m.hasta) {
        m.estado = "reserva";
        log(g, "ok", `${m.nombre} termina la maniobra y vuelve a estar disponible en ${m.lugar}.`);
      }
    } else if (m.estado === "descanso") {
      m.descanso -= 1;
      if (m.descanso <= 0) {
        if (margenDe(m) < 60) {
          m.estado = "fin";
          log(g, "info", `${m.nombre} finaliza jornada en ${m.lugar}.`);
        } else {
          m.estado = m.tipo === "reserva" ? "reserva" : "entrante";
          m.entra = g.reloj;
          /* Un reserva que termina su descanso vuelve a estar disponible para
             CUALQUIER línea, así que regresa a la bolsa común.         */
          if (m.tipo === "reserva" && !m.tren) {
            g.personal = g.personal.filter((x) => x.id !== m.id);
            g.reservaPersonal = [...(g.reservaPersonal || []), m];
          }
        }
      }
    }
  }

  /* Estado de cada tramo de vía única: qué sentido lo tiene tomado y cuántos
     trenes hay dentro. Se calcula antes del bucle y se actualiza en cuanto se
     autoriza a un tren, para que dos trenes de sentidos opuestos no puedan
     entrar en el mismo minuto creyendo cada uno que está libre.            */
  const tramos = tramosUnicos(g);

  // se libera la autorización de quien ya ha despejado el tramo, y se concede
  // a quien estuviera dentro cuando apareció la incidencia
  for (const o of g.trenes) {
    /* Suprimidos e inmovilizados sueltan el tramo: el suprimido porque ya no
       circula, y el inmovilizado porque está en la vía cortada. Si lo
       retuvieran, nadie podría cruzar en ninguno de los dos sentidos.   */
    if (o.estado === "suprimido" || o.inmovil) {
      o.enVU = null;
      o.esperaCruce = null;
      o.porContraria = null;
      continue;
    }

    /* Se vuelve a la vía propia al salir del tramo, no antes: es lo que hace
       que el tren termine el trayecto por donde entró.                  */
    if (o.porContraria) {
      const sp = situacion(o, r);
      const fuera = sp.dir !== o.porContraria.dir || sp.idx <= o.porContraria.a || sp.idx >= o.porContraria.b;
      if (fuera) o.porContraria = null;
    }
    const so = situacion(o, r);

    /* Una espera de cruce huérfana envenena dos puertas a la vez: da
       prioridad a un tren que ya no va a pasar y cierra el tramo al sentido
       contrario. Se limpia en cuanto deja de tener sentido: tren suprimido,
       rotando, apartado en desviada, o incidencia ya resuelta.            */
    if (o.esperaCruce) {
      const k0 = `${o.esperaCruce.a}-${o.esperaCruce.b}`;
      const sigue = tramos.some((x) => `${x.tramo.a}-${x.tramo.b}` === k0);
      if (!sigue || o.rotando || o.rotacion || o.enDesviada || so.dir === "maniobra") o.esperaCruce = null;
    }

    if (o.enVU) {
      const vigente = tramos.some((x) => x.tramo.a === o.enVU.a && x.tramo.b === o.enVU.b);
      /* La autorización se mantiene mientras el tren siga pisando el tramo EN
         EL SENTIDO CON EL QUE ENTRÓ. Antes solo se miraba si había rebasado el
         extremo de salida, así que un tren que rotaba dentro —o que se metía
         en una vía desviada— cambiaba de sentido, nunca alcanzaba ese extremo
         y se quedaba con el tramo tomado para siempre, bloqueando la línea. */
      const mismoSentido = so.dir === o.enVU.dir;
      const pisa =
        mismoSentido &&
        (so.dir === "alcala" ? so.idx >= o.enVU.a && so.idx < o.enVU.b : so.idx <= o.enVU.b && so.idx > o.enVU.a);
      // quien está en vía desviada no ocupa la general
      const enDesvio = !!o.enDesviada || !!o.rotando;
      // salvaguarda: nadie retiene un tramo más de 40 min
      const caducada = o.enVU.desde !== undefined && r - o.enVU.desde > 40;
      if (!vigente || !pisa || enDesvio || caducada) {
        if (caducada && vigente) log(g, "aviso", `Tramo de vía única ${ESTACIONES[o.enVU.a].corto}–${ESTACIONES[o.enVU.b].corto}: liberado por caducidad.`);
        o.enVU = null;
      }
    } else if (so.dir !== "maniobra" && !o.enDesviada && !o.rotando && !o.inmovil) {
      // al aparecer la incidencia puede haber trenes ya dentro: se autoriza a
      // los del sentido que primero se encuentre; los contrarios se retienen
      const dentro = tramos.find((x) => dentroTramo(o, r, x.tramo));
      if (dentro) {
        const k = `${dentro.tramo.a}-${dentro.tramo.b}`;
        /* Todos los que ya estaban dentro quedan autorizados a salir, vayan en
           el sentido que vayan: no se les puede hacer retroceder. Mientras
           quede alguno, no entra nadie nuevo.                           */
        {
          o.enVU = { a: dentro.tramo.a, b: dentro.tramo.b, dir: so.dir, desde: r };
          // si es su sentido el cortado, recorre el tramo por la vía contraria
          if (dentro.dir === so.dir) o.porContraria = { a: dentro.tramo.a, b: dentro.tramo.b, dir: so.dir };
        }
      }
    }
  }

  /* Ocupación del tramo. Se guardan TODOS los sentidos que hay dentro, no solo
     el primero: al declararse una incidencia puede haber trenes de los dos
     sentidos ya metidos, y hay que dejarlos salir antes de admitir a nadie
     nuevo. Con un solo sentido registrado, los contrarios seguían entrando y
     acababa habiendo trenes de frente en el mismo tramo.                */
  /* ── control de vía única, por bloqueo entre estaciones ──────────
     Un tren no entra en el tramo entre dos estaciones con agujas si hay otro
     viniendo de frente dentro. Espera en la estación de acceso a que el otro
     salga. Es la regla de toda la vida y no necesita registro de permisos:
     basta con mirar quién hay dentro en cada momento.

     Se decide ANTES de mover a nadie y se guarda en el propio tren, porque el
     bucle de movimiento tiene varias salidas anticipadas y la comprobación
     podía quedarse sin ejecutar.                                        */
  /* Reserva del minuto. Sin ella, dos trenes de sentidos opuestos situados en
     los dos accesos miraban el tramo a la vez, lo veían vacío los dos, y los
     dos entraban en el mismo minuto. Es el grueso de los casos que se
     escapaban: no eran saltos raros, era esta carrera.                  */
  const reservado = {};

  /* Candidatos a entrar en un tramo este minuto. Se resuelven POR HORA DE PASO
     y no en el orden del array: antes ganaba siempre el mismo tren la reserva
     del tramo, así que el del otro sentido esperaba indefinidamente aunque la
     vía estuviera vacía.                                                */
  const candidatos = [];
  for (const t of g.trenes) {
    t.bloqueoVU = null;
    if (t.estado === "suprimido" || t.inmovil || t.rotando || t.enDesviada) continue;
    const sv = situacion(t, r);
    if (sv.dir === "maniobra") continue;

    for (const rest of tramos) {
      const tr = rest.tramo;
      /* Un tren que YA está dentro del tramo no se toca: sale por donde iba.
         Antes se le volvía a evaluar como si fuera a entrar, y si en ese
         momento el tramo estaba tomado se le devolvía al acceso. El efecto era
         que entraba, y una décima después reaparecía atrás: entraba y se
         expulsaba a sí mismo, minuto tras minuto.                        */
      if (dentroTramo(t, r, tr)) break;
      if (!dentroTramo(t, r + 1, tr)) continue;
      // la hora prevista de paso: la de quien espera se fijó al empezar a esperar
      const prevista = t.esperaCruce ? t.esperaCruce.prevista : r - t.retraso;
      candidatos.push({ t, tr, dir: sv.dir, prevista });
      break;
    }
  }

  candidatos.sort((a2, b2) => a2.prevista - b2.prevista);
  for (const c of candidatos) {
    const k2 = `${c.tr.a}-${c.tr.b}`;
    const deFrente = g.trenes.some(
      (o) => o.i !== c.t.i && o.estado !== "suprimido" && !o.inmovil && dentroTramo(o, r, c.tr) && situacion(o, r).dir !== c.dir
    );
    // o bien ya lo ha tomado otro en sentido contrario en este mismo minuto
    if (deFrente || (reservado[k2] && reservado[k2] !== c.dir)) {
      c.t.bloqueoVU = { tramo: c.tr, dir: c.dir };
      continue;
    }
    reservado[k2] = c.dir;
  }

  const vu = {};
  for (const rest of tramos) {
    const k = `${rest.tramo.a}-${rest.tramo.b}`;
    const ocup = g.trenes.filter((o) => o.enVU && `${o.enVU.a}-${o.enVU.b}` === k);
    vu[k] = { dirs: [...new Set(ocup.map((o) => o.enVU.dir))], n: ocup.length };
  }
  /* Libre para un sentido solo si no hay NADIE del contrario pisando el tramo.
     Se miran los trenes de verdad y no solo las autorizaciones concedidas: un
     tren que quedó dentro al declararse la incidencia ocupa la vía igual,
     tenga permiso o no lo tenga.                                        */
  const dentroDe = {};
  for (const rest of tramos) {
    const k = `${rest.tramo.a}-${rest.tramo.b}`;
    dentroDe[k] = [
      ...new Set(
        g.trenes
          .filter((o) => o.estado !== "suprimido" && dentroTramo(o, r, rest.tramo))
          .map((o) => situacion(o, r).dir)
      ),
    ];
  }
  const libreVU = (k, dir) => !(dentroDe[k] || []).some((d) => d !== dir) && !(vu[k] && vu[k].dirs.some((d) => d !== dir));
  const tomarVU = (t, k, dir) => {
    if (vu[k]) {
      if (!vu[k].dirs.includes(dir)) vu[k].dirs.push(dir);
      vu[k].n += 1;
    }
    const [a2, b2] = k.split("-").map(Number);
    // la autorización viaja con el tren y guarda cuándo se concedió
    t.enVU = { a: a2, b: b2, dir, desde: t.enVU && t.enVU.a === a2 && t.enVU.b === b2 ? t.enVU.desde : g.reloj };
    /* Si su propio sentido está cortado, entra por la vía contraria y la
       ocupa hasta salir del tramo, pase lo que pase con la incidencia. */
    const rest2 = tramos.find((x) => x.tramo.a === a2 && x.tramo.b === b2);
    if (rest2 && rest2.dir === dir) t.porContraria = { a: a2, b: b2, dir };
  };
  /* Cierre del tramo al sentido en curso. Sin esto se producía inanición: la
     prioridad la marca la hora prevista, y un tren retrasado siempre tiene
     una prevista anterior, así que una fila de trenes con retraso entraba uno
     tras otro y el que esperaba de frente no cruzaba jamás. Con un tren
     esperando en el otro extremo, los que ya están dentro terminan pero no
     entra ninguno nuevo: el tramo se vacía y cambia de sentido.            */
  const esperaDeFrente = (k, dir) =>
    g.trenes.some((o) => o.esperaCruce && `${o.esperaCruce.a}-${o.esperaCruce.b}` === k && o.esperaCruce.dir && o.esperaCruce.dir !== dir);

  const hayPrioritario = (k, prevista, yo) =>
    g.trenes.some(
      (o) => o.i !== yo && o.esperaCruce && `${o.esperaCruce.a}-${o.esperaCruce.b}` === k && o.esperaCruce.prevista < prevista
    );

  // reposición de circulaciones: al llegar su hora vuelven al servicio
  for (const t of g.trenes) {
    if (t.estado !== "suprimido" || !t.reponer || r < t.reponer.cuando) continue;
    const rep = t.reponer;
    const maq = g.personal.find((x) => x.id === rep.maq);
    t.estado = "servicio";
    t.retraso = 0;
    t.unidades = rep.unidades.map((u) => ({ ...u }));
    t.serie = t.unidades[0].serie;
    t.pax = new Array(N).fill(0);
    t.hist = [];
    t.acum = { paradas: 0, maquinista: 0, bloqueo: 0 };
    t.limitacion = 0;
    t.riesgo = 0;
    t.retirarCab = false;
    t.bloqueadoPor = null;
    t.enVU = null;
    t.reponer = null;
    if (maq) {
      maq.estado = "conduciendo";
      maq.tren = t.i;
      maq.cond = 0;
      maq.lugar = null;
      t.maq = maq.id;
      t.avisado = false;
      t.excesoAutorizado = false;
      t.relevo = programarRelevo(t, maq, r);
    }
    // al volver al servicio retoma el cuadro desde la marcha en curso
    arrancarMarcha(t, r); // retoma el cuadro desde la marcha que toque
    log(g, "ok", `Circulación ${t.i}: vuelve al servicio en ${ESTACIONES[rep.idx].n} como ${numeroTren(t, r)} con ${t.unidades.map((u) => u.id).join(" + ")}.`);
  }

  for (const t of g.trenes) {
    if (t.estado === "suprimido") continue;

    // esperando turno para entrar en un tramo de vía única
    if (t.esperaCruce) {
      const rest = g.restricciones.find((x) => x.tramo && x.tramo.a === t.esperaCruce.a && x.tramo.b === t.esperaCruce.b);
      if (!rest) {
        log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: restablecida la doble vía, reanuda marcha.`);
        apunta(g, t, `espera de cruce en ${ESTACIONES[t.esperaCruce.idx].corto}`, r - t.esperaCruce.desde);
        t.esperaCruce = null;
      } else {
        t.retraso += 1;
        const k = `${t.esperaCruce.a}-${t.esperaCruce.b}`;
        const dir = situacion(t, r).dir;
        /* Se mira quién hay DE VERDAD en el tramo, no el registro de permisos:
           es la misma comprobación que impide entrar, y así la salida de la
           espera y la entrada al tramo siguen exactamente la misma regla. */
        const deFrente = g.trenes.some(
          (o) => o.i !== t.i && o.estado !== "suprimido" && !o.inmovil && dentroTramo(o, r, rest.tramo) && situacion(o, r).dir !== dir
        );
        const libre = !deFrente && libreVU(k, dir);
        // ¿hay alguien realmente dentro, o el tramo está vacío?
        const vacio = !vu[k] || !vu[k].n;
        /* El tope de espera nunca salta la seguridad del tramo, solo el turno.
           Y si el tramo está vacío y el tren lleva más de 8 min esperando,
           pasa aunque el reparto de prioridades diga otra cosa: un tramo
           vacío con trenes esperando a ambos lados no puede quedarse así. */
        const turno = !hayPrioritario(k, t.esperaCruce.prevista, t.i) || (vacio && r - t.esperaCruce.desde > 8);
        if (libre && turno) {
          tomarVU(t, k, dir);
          log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: entra en el tramo de vía única desde ${ESTACIONES[t.esperaCruce.idx].n}.`);
          apunta(g, t, `espera de cruce en ${ESTACIONES[t.esperaCruce.idx].corto}`, r - t.esperaCruce.desde);
          t.esperaCruce = null;
        }
      }
      continue; // reanuda la marcha en el minuto siguiente, ya en movimiento
    }

    // esperando vía libre a la entrada de una estación
    if (t.esperaVia) {
      t.retraso += 1;
      const libres = viasPasoLibres(g, t.esperaVia.idx, t.i);
      // pasa el que lleva más tiempo esperando
      const cola = g.trenes
        .filter((x) => x.esperaVia && x.esperaVia.idx === t.esperaVia.idx)
        .sort((x, y) => x.esperaVia.desde - y.esperaVia.desde);
      // salvaguarda: nadie se queda esperando vía para siempre
      const harto = r - t.esperaVia.desde > 25;
      if ((libres.length && cola[0] && cola[0].i === t.i) || harto) {
        if (harto && !libres.length) log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: pasa por ${ESTACIONES[t.esperaVia.idx].corto} sin vía asignada tras 25 min.`);
        apunta(g, t, `espera de vía en ${ESTACIONES[t.esperaVia.idx].corto}`, r - t.esperaVia.desde);
        t.viaPaso = libres.length ? { idx: t.esperaVia.idx, via: libres[0], hasta: r + 3 } : null;
        t.esperaVia = null;
      }
      continue;
    }

    // la vía de paso se libera al alejarse de la estación
    if (t.viaPaso && r >= t.viaPaso.hasta) t.viaPaso = null;

    // material en vacío que aún espera a que se presente su maquinista
    if (t.esperaSalida && r < t.esperaSalida) continue;

    /* Vía única: hay un tren de frente en el tramo, así que este espera en la
       estación de acceso. Va lo primero del bucle a propósito: más abajo hay
       varias salidas anticipadas por las que un tren podía colarse sin pasar
       nunca por el control.                                             */
    if (t.bloqueoVU) {
      const trm = t.bloqueoVU.tramo;
      const acc = t.bloqueoVU.dir === "alcala" ? trm.a : trm.b;
      const sb = situacion(t, r);
      const llegado = t.bloqueoVU.dir === "alcala" ? sb.idx >= acc - 0.05 : sb.idx <= acc + 0.05;
      /* Solo se detiene al tren cuando ya ha llegado a la estación de acceso.
         Antes se le paraba en cuanto se le veía venir, y acababa esperando en
         plena vía a medio camino de la estación anterior. La posición se
         calcula como reloj menos retraso, así que pararlo es sumarle un minuto
         de retraso: saltarse su turno en el bucle no basta.             */
      if (llegado) {
        t.retraso += 1;
        retenerEnAcceso(g, t, trm, t.bloqueoVU.dir, r);
        continue;
      }
    }

    /* Vía libre y el tren seguía esperando: se le da paso. El control de
       entrada es ahora la única autoridad, así que si no lo bloquea, la espera
       tiene que levantarse aquí. Sin esto los trenes se quedaban parados
       indefinidamente delante de un tramo vacío.                        */
    if (t.esperaCruce) {
      const sigue = g.restricciones.some((x) => x.tramo && x.tramo.a === t.esperaCruce.a && x.tramo.b === t.esperaCruce.b);
      log(
        g,
        "ok",
        sigue
          ? `Tren ${numeroTren(t, g.reloj)}: entra en el tramo de vía única desde ${ESTACIONES[t.esperaCruce.idx].n}.`
          : `Tren ${numeroTren(t, g.reloj)}: restablecida la doble vía, reanuda marcha.`
      );
      apunta(g, t, `espera de cruce en ${ESTACIONES[t.esperaCruce.idx].corto}`, r - t.esperaCruce.desde);
      t.esperaCruce = null;
    }

    /* Inmovilizado por avería muy grave. Hay tres desenlaces según cómo se
       haya decidido resolverlo: el socorro clásico, la intervención de los
       ATLs y el rescate con material propio.                            */
    if (t.inmovil) {
      t.retraso += 1;
      t.inmovil.restante -= 1;
      if (t.inmovil.restante > 0) continue;

      if (t.inmovil.atls) {
        const idx = t.inmovil.idx;
        apunta(g, t, "inmovilizado esperando a los ATLs", r - t.inmovil.desde);
        t.inmovil = null;
        t.detenido = null;
        if (Math.random() < 0.7) {
          levantarEnTodas(g, g.restricciones.filter((x) => x.tren === t.i).map((x) => x.id));
          levantarEnTodas(g, g.restricciones.filter((x) => x.tren === t.i).map((x) => x.id));
        g.restricciones = g.restricciones.filter((x) => x.tren !== t.i);
          log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: los ATLs resuelven la avería. Reanuda marcha y se levanta la vía única.`);
        } else {
          log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: los ATLs no consiguen resolver la avería.`);
          g.cola.push({
            tipo: "inc",
            grav: "critica",
            tren: t.i,
            lugar: ESTACIONES[idx].n,
            titulo: `Los ATLs no resuelven la avería del ${numeroTren(t, g.reloj)}`,
            datos: datosDeTren(g, t),
            texto: "Los mecánicos no han podido devolver la tracción al tren. No queda más salida que rescatarlo.",
            opciones: [
              {
                label: "Banalizar el tramo, realizar transbordo y enviar socorro",
                detalle: "El pasaje transborda al primer tren del mismo sentido y se manda material a recogerlo",
                tiempo: [25, 45],
                ef: { rescate: { i: t.i } },
              },
            ],
          });
        }
        continue;
      }

      if (t.inmovil.rescate) {
        apunta(g, t, "inmovilizado a la espera del rescate", r - t.inmovil.desde);
        const dest = estacionesParaSuprimir(g, t)[0];
        t.inmovil = null;
        t.detenido = null;
        levantarEnTodas(g, g.restricciones.filter((x) => x.tren === t.i).map((x) => x.id));
        g.restricciones = g.restricciones.filter((x) => x.tren !== t.i);
        /* El socorro se lo lleva remolcado y la vía queda despejada. Antes se
           quedaba ahí como material vacío esperando a que se le eligiera
           destino, y mientras tanto seguía frenando a todo su sentido: era lo
           que atascaba la línea después del rescate.                    */
        suprimir(g, t, `Tren ${numeroTren(t, g.reloj)}: remolcado por el material de socorro. Vía despejada.`, dest ? dest.idx : null);
        g.pedirDestino = t.i; // taller o apartadero, lo elige el puesto de mando
        continue;
      }

      const dest = estacionesParaSuprimir(g, t)[0];
      log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: remolcado hasta ${dest ? ESTACIONES[dest.idx].n : "la vía más próxima"}. Vía despejada.`);
      apunta(g, t, "inmovilizado por avería muy grave", r - t.inmovil.desde);
      t.inmovil = null;
      suprimir(g, t, `Tren ${numeroTren(t, g.reloj)}: retirado del servicio por avería muy grave.`, dest ? dest.idx : null);
      continue;
    }

    // apartado en vía desviada esperando a que le adelante el de atrás
    if (t.enDesviada) {
      t.retraso += 1;
      const mio = progresoDe(fase(t, r));
      const otro = g.trenes.find((x) => x.i === t.enDesviada.quien);

      let paso;
      if (!otro || otro.estado === "suprimido") paso = true; // ya no hay a quién esperar
      else {
        const suyo = progresoDe(fase(otro, r));
        if (!suyo) paso = false; // sigue en cabecera: aún no ha llegado
        else if (!mio) paso = true;
        else if (suyo.dir !== mio.dir) paso = true; // ya no viene por esta vía
        else paso = suyo.x > mio.x + 2; // lo ha rebasado
      }

      const espera = r - t.enDesviada.desde;
      // 2 min de entrada antes de evaluar, y 2 de salida una vez rebasado
      if (t.enDesviada.saliendo > 0) {
        t.enDesviada.saliendo -= 1;
        if (t.enDesviada.saliendo <= 0) {
          log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: reanuda marcha desde la ${t.enDesviada.via} de ${ESTACIONES[t.enDesviada.idx].n}.`);
          apunta(g, t, `apartado en ${ESTACIONES[t.enDesviada.idx].corto} para ser adelantado`, espera);
          t.enDesviada = null;
        }
      } else if ((paso && espera >= 2) || espera > 45) {
        t.enDesviada.saliendo = 2;
        const txt = otro && paso && espera <= 45 ? ` tras el paso del ${numeroTren(otro, g.reloj)}` : " al agotarse la espera";
        log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: sale de la vía desviada de ${ESTACIONES[t.enDesviada.idx].n}${txt}.`);
      }
      continue;
    }

    if (t.rotando) {
      const mq = t.maq ? maqDe(g, t) : null;
      if (mq && !t.avisoRot && mq.cond + t.rotando.restante > COND_MAX) {
        t.avisoRot = true;
        g.cola.push({
          tipo: "aviso",
          titulo: `Maniobra demasiado larga en ${ESTACIONES[t.rotando.idx].n}`,
      lugar: ESTACIONES[t.rotando.idx].n,
      datos: datosDeTren(g, t),
          texto: `El ${numeroTren(t, g.reloj)} tiene que esperar ${t.rotando.restante} min a su nueva marcha, y ${mq.nombre} agotaría las 5h30 antes de terminar. En esa estación no hay personal de reserva.`,
          opciones: [
            { label: "Suspender la maniobra y seguir recorrido", detalle: "Continúa a cabecera con el retraso que lleva", ef: { abortarRotacion: t.i } },
            { label: "Terminar recorrido aquí", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: t.i } },
          ],
        });
      }
      t.retraso += 1;
      t.rotando.restante -= 1;
      if (t.rotando.restante <= 0) {
        const antes = t.retraso;
        t.retraso = Math.max(0, t.retraso - t.rotando.delta);
        apunta(g, t, `rotación en ${ESTACIONES[t.rotando.idx].corto}`, -(antes - t.retraso));
        log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: rotación completada en ${ESTACIONES[t.rotando.idx].n}. Reanuda con ${rt(t.retraso)} min de retraso.`);
        t.rotando = null;
        t.avisoRot = false;
      }
      continue;
    }

    if (t.esperaCab) {
      const { idx, cab } = t.esperaCab;
      if (rotLibresCabecera(g, idx, cab, t.i) > 0) {
        t.esperaCab = null;
        t.avisoCab = false;
        log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: vía libre en ${cab}, entra a cabecera.`);
      } else {
        t.retraso += 1;
        continue;
      }
    }

    if (t.detenido) {
      t.retraso += 1;
      t.detenido.restante -= 1;
      if (t.detenido.restante <= 0) {
        if (t.detenido.cambio && t.cambio) ejecutarCambio(g, t);
        else if (!t.detenido.silencioso) log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: reanuda marcha tras ${t.detenido.motivo}.`);
        t.detenido = null;
      }
      continue;
    }

    if (t.retenido) {
      t.retraso += 1;
      t.retDesde = t.retDesde || r;
      /* Se comprueba exactamente el mismo grupo que usará el relevo. Antes se
         miraba "nominales o reservas" pero luego solo se cogía de uno de los
         dos: si el tren esperaba reserva y aparecía un nominal, se lanzaba el
         relevo, fallaba y volvía a avisar. Cada minuto. De ahí que un mismo
         tren llegara a generar doscientos avisos.                        */
      const grupo = t.relevoConReserva ? reservasEn(g, t.retenido) : nominalEn(g, t.retenido);
      if (grupo.length) {
        const cab = t.retenido;
        t.retenido = false;
        t.retDesde = null;
        ejecutarRelevo(g, t, cab);
      } else if (r - t.retDesde >= 20) {
        // sigue sin relevo: se vuelve a plantear en vez de dejarlo colgado
        t.retDesde = r;
        const cab = t.retenido;
        const proximo = g.personal
          .filter((m) => !m.baja && m.lugar === cab && (m.estado === "descanso" || (m.estado === "entrante" && m.entra > r)) && margenDe(m) >= 60)
          .sort((a, b) => (a.estado === "descanso" ? r + a.descanso : a.entra) - (b.estado === "descanso" ? r + b.descanso : b.entra))[0];
        const cuando = proximo ? (proximo.estado === "descanso" ? r + proximo.descanso : proximo.entra) : null;
        g.cola.push({
          tipo: "aviso",
          titulo: `El ${numeroTren(t, g.reloj)} sigue retenido en ${cab}`,
        lugar: cab,
        datos: datosDeTren(g, t),
          texto: `Lleva ${rt(t.retraso)} min de retraso y no hay relevo disponible en ${cab}.${
            proximo ? ` El primero en estar libre allí es ${proximo.nombre}, a las ${hhmm(cuando)}.` : " No hay nadie previsto en esa cabecera."
          }`,
          opciones: [
            { label: "Seguir esperando", detalle: proximo ? `Relevo posible a las ${hhmm(cuando)}` : "Sigue acumulando retraso", ef: {} },
            { label: "Terminar recorrido y retirar el tren", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: t.i } },
          ],
        });
      }
      continue;
    }

    // kilometraje de las unidades en servicio
    for (const u of t.unidades) {
      u.km += KM_MIN;
      u.desgaste = Math.min(DESGASTE_MAX + 20, u.desgaste + (tasaDesgaste(u) * KM_MIN) / 100);
      u.fiab = fiabDesgaste(u.desgaste);
      if (u.desgaste >= DESGASTE_MAX && !u.vencida) {
        u.vencida = true;
        const doble = t.unidades.length > 1;
        g.cola.push({
          tipo: "aviso",
          titulo: `Vencimiento de ciclo: ${u.id}`,
          texto: `La ${u.id} agota su ciclo: desgaste al ${Math.round(u.desgaste)} % y fiabilidad al ${Math.round(u.fiab * 100)} %. Taller solicita su entrada.`,
          opciones: doble
            ? [
                { label: `Desacoplar la ${u.id} en cabecera`, detalle: "El tren sigue con la mitad de plazas", ef: { desacoplar: { i: t.i, u: u.id }, retraso: { i: t.i, m: 6 } } },
                { label: "Aplazar la revisión hasta el cierre", detalle: "Sigue desgastándose y la avería se vuelve muy probable", ef: { fiabBaja: { i: t.i, u: u.id, v: 0.78 } } },
              ]
            : [
                { label: "Retirar el tren a cocheras", detalle: "Se pierde una circulación", ef: { suprimir: t.i } },
                { label: "Aplazar la revisión hasta el cierre", detalle: "Sigue desgastándose y la avería se vuelve muy probable", ef: { fiabBaja: { i: t.i, u: u.id, v: 0.78 } } },
              ],
        });
      }
    }

    const pAnt = fase(t, r - 1);
    const pAct = fase(t, r);
    // Un tren parado tiene pAnt === pAct. Con la fórmula anterior eso daba
    // "cruzado" para CUALQUIER punto: al reanudar hacía de golpe las 24
    // paradas, vaciaba el tren y disparaba todas las restricciones a la vez.
    const avance = (((pAct - pAnt) % CICLO) + CICLO) % CICLO;
    const cruza = (q) => {
      if (avance <= 0 || avance > CICLO / 2) return false;
      const d = (((q - pAnt) % CICLO) + CICLO) % CICLO;
      return d > 0 && d <= avance;
    };

    if (t.rotacion && cruza(t.rotacion.q)) {
      const dirPrevia = situacion(t, r).dir;
      partirMarcha(g, t, t.rotacion.idx, dirPrevia === "alcala" ? "pio" : "alcala");
      const delta = t.rotacion.delta;
      t.rotando = {
        restante: Math.max(MANIOBRA, Math.round(delta - t.retraso)),
        idx: t.rotacion.idx,
        via: viasManiobra(g, t.rotacion.idx)[0] || (ESTACIONES[t.rotacion.idx].rotVias || ["—"])[0],
        delta,
        // marcha en la que se insertará al terminar la inversión
        haciaPio: situacion(t, r).dir === "alcala",
        inicio: r - t.retraso + delta - t.rotacion.ahorro,
      };

      // Termina recorrido aquí: se apea todo el pasaje. Los que iban a esta
      // estación han llegado; los demás pasan al andén a esperar otro tren.
      const idxR = t.rotando.idx;
      const dirR = situacion(t, r).dir;
      const llegan = t.pax[idxR] || 0;
      let aEsperar = 0;
      for (let j = 0; j < N; j++)
        if (j !== idxR && t.pax[j] > 0) {
          aEsperar += t.pax[j];
          t.pax[j] = 0;
        }
      t.pax = new Array(N).fill(0);
      if (aEsperar > 1 && dirR !== "maniobra") {
        g.andenes[idxR][dirR] += aEsperar;
        g.kpi.afect += aEsperar;
      }
      log(
        g,
        "aviso",
        `Tren ${numeroTren(t, g.reloj)}: termina recorrido en ${ESTACIONES[t.rotacion.idx].n}. Bajan ${nf(llegan + aEsperar)} viajeros, de los que ${nf(aEsperar)} quedan en el andén esperando otro tren.`
      );
      t.rotacion = null;
      continue;
    }

    // paso por Chamartín: hace falta vía libre, y el material estacionado ocupa
    if (IDX_CHAMARTIN > 0 && !t.esperaVia) {
      const ec = ESTACIONES[IDX_CHAMARTIN];
      if (cruza(ec.t) || cruza(LLEGA_PIO - ec.t)) {
        const libres = viasPasoLibres(g, IDX_CHAMARTIN, t.i);
        if (!libres.length) {
          t.esperaVia = { idx: IDX_CHAMARTIN, desde: r };
          log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: retenido a la entrada de Chamartín, sin vía libre.`);
          continue;
        }
        t.viaPaso = { idx: IDX_CHAMARTIN, via: libres[0], hasta: r + 3 };
      }
    }

    // llegada a la estación donde el jugador ordenó suprimir
    if (t.supresion) {
      const es = ESTACIONES[t.supresion.idx];
      const aunNo = t.supresion.noche && r < t.supresion.hora - 1;
      if (!aunNo && (cruza(es.t) || cruza(LLEGA_PIO - es.t))) {
        const idxS = t.supresion.idx;
        const porAveria = !!t.supresion.averiado;
        const dirS = situacion(t, r).dir;
        const llegan = t.pax[idxS] || 0;
        const transbordo = t.pax.reduce((n, v) => n + v, 0) - llegan;
        if (transbordo > 1 && dirS !== "maniobra") {
          g.andenes[idxS][dirS] += transbordo;
          g.kpi.afect += transbordo;
        }
        t.pax = new Array(N).fill(0);
        t.supresion = null;
        // el material en vacío que iba a taller entra directamente
        if (t.supresion && t.supresion.aTaller) {
          const dep = t.supresion.dep;
          for (const u of t.unidades) meterEnTaller(g, u.id, dep, t.supresion.aTaller, desgasteDe(g, u.id));
          t.unidades = [];
        }
        if (porAveria) t.marcarAveriado = true;
        const viaElegida = t.supresion && t.supresion.via;
        // de noche se anota dónde queda, para poder sacarlo por la mañana
        if (t.supresion && t.supresion.noche) t.nocheEn = { idx: idxS, via: viaElegida };
        suprimir(
          g,
          t,
          `Tren ${numeroTren(t, g.reloj)}: suprimido en ${es.n} por orden del puesto de mando. ${nf(llegan + transbordo)} viajeros bajan, ${nf(
            transbordo
          )} transbordan al siguiente.`,
          idxS,
          viaElegida
        );
        continue;
      }
    }

    // llegada al punto donde se aparta para dejar pasar
    if (t.apartaPaso) {
      const ea = ESTACIONES[t.apartaPaso.idx];
      if (cruza(ea.t) || cruza(LLEGA_PIO - ea.t)) {
        const detras = vecinos(g, t).detras;
        const viaLibre = viasManiobra(g, t.apartaPaso.idx)[0] || (ESTACIONES[t.apartaPaso.idx].rotVias || ["—"])[0];
        t.enDesviada = { idx: t.apartaPaso.idx, quien: detras ? detras.i : t.apartaPaso.quien, desde: r, via: viaLibre, saliendo: 0 };
        log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: apartado en la vía desviada de ${ea.n}.`);
        t.apartaPaso = null;
        continue;
      }
    }

    // llegada al punto de cambio de material
    if (t.cambio && !t.cambio.enCurso) {
      const ec = ESTACIONES[t.cambio.idx];
      if (cruza(ec.t) || cruza(LLEGA_PIO - ec.t)) {
        const falta = Math.max(0, PREP_CAMBIO - (r - t.cambio.ordenado));
        const espera = Math.round(falta + TRASVASE);
        t.cambio.enCurso = true;
        t.detenido = { restante: espera, motivo: `el cambio de material en ${ec.corto}`, cambio: true };
        apunta(g, t, `cambio de material en ${ec.corto}`, espera);
        log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: detenido ${espera} min en ${ec.n} para cambiar material.`);
        continue;
      }
    }

    const enCabecera = cruza(LLEGA_ALCALA) || cruza(LLEGA_PIO);
    if (enCabecera && t.retirarCab) {
      suprimir(g, t, `Tren ${numeroTren(t, g.reloj)} retirado en cabecera por avería de material.`);
      continue;
    }
    if (cruza(SALE_ALCALA) || cruza(0)) {
      t.avisoCab = false;
      // la marcha siguiente ya figura en el cuadro: solo se anota la salida real
      // salida de cabecera: se anota la hora real de inicio
      const sig = marchaEnCurso(t) || arrancarMarcha(t, r);
      if (sig && sig.iniReal === undefined) sig.iniReal = Math.round(r);
    }
    if (cruza(LLEGA_ALCALA) || cruza(LLEGA_PIO)) {
      t.pax = new Array(N).fill(0);
      // llegada a cabecera: se cierra la marcha completa
      cerrarMarcha(g, t, cruza(LLEGA_PIO) ? IDX_PIO : IDX_ALCALA);
    }
    if (cruza(LLEGA_ALCALA) || cruza(LLEGA_PIO)) {
      const tope = cruza(LLEGA_PIO) ? INV_PIO - MANIOBRA : INV_ALCALA - MANIOBRA;
      const rec = Math.min(t.retraso, tope);
      if (rec > 0.5) apunta(g, t, `recuperación en ${cruza(LLEGA_PIO) ? PIO : ALCALA}`, -rec);
      t.retraso -= rec;
    }

    if (t.relevo && r >= t.relevo.desde && PASOS.some((x) => x.cab === t.relevo.cab && cruza(x.q))) {
      ejecutarRelevo(g, t, t.relevo.cab);
    }

    // puntualidad del maquinista: gana o pierde tiempo durante la marcha
    if (t.maq) {
      const mq = maqDe(g, t);
      const pEs = fase(t, r);
      const rodando = pEs < LLEGA_ALCALA || (pEs >= SALE_ALCALA && pEs < LLEGA_PIO);
      if (rodando && mq) {
        // deriva continua: cambia la velocidad de avance, nunca da saltos
        const d = derivaPorMin(mq);
        if (d >= 0) {
          const rec = Math.min(t.retraso, d);
          t.retraso -= rec;
          t.acum.maquinista -= rec;
        } else {
          t.retraso += -d;
          t.acum.maquinista += -d;
        }
      }
    }

    // ¿cabecera saturada? se comprueba con margen antes de llegar
    for (const [q, cab, idx] of [[LLEGA_ALCALA - 12, ALCALA, N - 1], [LLEGA_PIO - 12, PIO, 0]]) {
      if (!cruza(q) || t.avisoCab || t.esperaCab) continue;
      // se comprueba la ocupación en el instante de la llegada, no en el actual
      const est = ESTACIONES[idx];
      const info = libresAlLlegar(g, idx, cab, t.i, 12);
      if (info.libres > 0) continue;
      t.avisoCab = true;
      const hayMaterial = (g.apartado[idx] || []).length > 0;
      const quienes = info.ocupantes
        .map((o) => `${numeroTren(o, g.reloj)} (sale en ${Math.round(salidaEn(o, g.reloj, idx))} min)`)
        .join(", ");
      const hayReserva = reservasEn(g, cab).length > 0;
      const previas = candidatosRotacion(t, g.reloj, g.restricciones, g);
      const previa = previas.length ? previas[previas.length - 1] : null;
      g.cola.push({
        tipo: "aviso",
        titulo: `${cab} sin vía de inversión`,
      lugar: cab,
      datos: [
        { k: "Cabecera", v: cab },
        { k: "Vías", v: "todas ocupadas", c: P.warn },
      ],
        texto: `El ${numeroTren(t, g.reloj)} llega a ${cab} en 12 min y para entonces no habrá vía libre. De las ${est.rotVias.length}: ${
          info.disponibles.length < est.rotVias.length ? `${est.rotVias.length - info.disponibles.length} con material apartado` : "ninguna con material"
        }${quienes ? `, y seguirán ocupadas por ${quienes}` : ""}.`,
        opciones: [
          hayMaterial && hayReserva
            ? { label: "Retirar material apartado con un reserva", detalle: `Libera vía y ocupa a un maquinista de ${cab}`, ef: { moverApartado: { idx, cab } } }
            : null,
          previa
            ? { label: `Rotar antes, en ${previa.nombre}`, detalle: `${previa.espera} min de maniobra · deja ${previa.sinServicio} estaciones sin servicio`, ef: { ordenarRotacion: { i: t.i, c: previa } } }
            : null,
          { label: "Retener el tren a la entrada", detalle: "Espera a que quede vía libre, acumulando retraso", ef: { esperarCabecera: { i: t.i, idx, cab } } },
        ].filter(Boolean),
      });
    }

    // paradas: bajan y suben viajeros en cada estación que se cruza
    for (let i = 0; i < N; i++) {
      if (ESTACIONES[i].puesto) continue; // sin servicio de viajeros: no se para
      if (cruza(ESTACIONES[i].t)) efectuarParada(g, t, i, "alcala");
      if (cruza(LLEGA_PIO - ESTACIONES[i].t)) efectuarParada(g, t, i, "pio");
    }
    // el exceso de tiempo de parada se aplica poco a poco, nunca de golpe
    if (t.buffer > 0) {
      const paso = Math.min(t.buffer, 0.5);
      t.buffer -= paso;
      t.retraso += paso;
      t.acum.paradas += paso;
    }

    /* Control de vía única. No se comprueba "al cruzar la estación de acceso":
       si ese minuto el tren salía antes del bucle por cualquier motivo, se
       colaba sin permiso y ya nadie volvía a mirarlo. Se comprueba por
       POSICIÓN, cada minuto, mientras el tren pise el tramo o su acceso.   */
    /* El control de vía única ya se ha resuelto arriba, antes de mover a nadie
       y por orden de hora de paso. Aquí solo queda anotar que el tren ocupa el
       tramo, para que el mapa y los avisos lo sepan. El control que había en
       este punto retenía a los trenes medio índice antes de la estación, así
       que esperaban en plena vía en vez de en el andén.                */
    for (const rest of tramos) {
      const k = `${rest.tramo.a}-${rest.tramo.b}`;
      const sv = situacion(t, r);
      if (sv.dir === "maniobra") continue;
      if (dentroTramo(t, r, rest.tramo)) tomarVU(t, k, sv.dir);
    }

    // restricciones de vía: el tren se detiene en el punto los minutos que toque
    for (const rest of g.restricciones) {
      const ti = ESTACIONES[rest.idx].t;
      const bajada = cruza(ti);
      const subida = cruza(LLEGA_PIO - ti);
      const toca = rest.dir === "alcala" ? bajada : rest.dir === "pio" ? subida : bajada || subida;
      // Con vía única el retraso NO es una cifra fija: lo produce enteramente
      // la espera de cruce, que depende de si el tramo estaba libre o no.
      const min = rest.dir ? 0 : rest.m;
      if (toca && min > 0) {
        t.detenido = { restante: min, motivo: `la incidencia de ${ESTACIONES[rest.idx].corto}` };
        apunta(g, t, `${rest.txt} · ${ESTACIONES[rest.idx].corto}`, min);
        log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: detenido ${min} min en ${ESTACIONES[rest.idx].corto}.`);
        break;
      }
    }

    if (t.maq && t.relevo && !t.avisado && !t.excesoAutorizado) {
      const m = maqDe(g, t);
      const eta = etaRelevo(t, r);
      if (eta !== Infinity && m.cond + eta > COND_MAX) {
        t.avisado = true;
        const e = etaPrimeraCabecera(t, r);
        g.cola.push({
          tipo: "aviso",
          titulo: `Relevo comprometido en el ${numeroTren(t, g.reloj)}`,
        lugar: t.relevo ? t.relevo.cab : null,
        datos: datosDeTren(g, t),
          texto: `${m.nombre} lleva ${dur(m.cond)} de conducción. Con el retraso acumulado llegaría al relevo previsto de ${t.relevo.cab} superando las 5h30. Primera cabecera: ${e.cab}, a ${Math.round(e.min)} min.`,
          opciones: [
            { label: `Adelantar el relevo a ${e.cab}`, detalle: `Consume una de las ${reservasEn(g, e.cab).length} reservas de ${e.cab}`, ef: { adelantar: t.i } },
            { label: "Terminar recorrido en cabecera", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: t.i } },
            { label: "Autorizar a continuar hasta el relevo previsto", detalle: "Incumplimiento de la normativa de conducción", ef: { autorizar: t.i, coste: 4500 } },
          ],
        });
      }
    }
  }

  for (const t of g.trenes) {
    if (t.estado === "suprimido" || !t.maq) continue;
    /* El maquinista puede estar todavía en la bolsa común si acaba de tomar el
       tren en este mismo minuto: se busca también ahí.                 */
    const m = maqDe(g, t);
    if (!m) continue;
    const tope = t.excesoAutorizado ? COND_MAX + 45 : COND_MAX;
    if (m.cond > tope) {
      // en la retirada nocturna el tren llega igualmente a su cabecera: se
      // le pone otro maquinista antes que dejarlo tirado a mitad de camino
      if (enRetiradaNocturna(g, t)) {
        const cab = ESTACIONES[ESTACIONES.findIndex((e) => e.cab === g.retirada[t.i].destino)];
        const rel = reservasEn(g, cab ? cab.cab : CHAMARTIN).sort((a2, b2) => margenDe(b2) - margenDe(a2))[0];
        if (rel) {
          cerrarDerivaMaq(g, t);
          m.estado = "descanso";
          m.descanso = DESCANSO;
          m.tren = null;
          rel.estado = "conduciendo";
          rel.tren = t.i;
          rel.cond = 0;
          t.maq = rel.id;
          log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: ${rel.nombre} lo lleva hasta su estacionamiento.`);
          continue;
        }
      }
      suprimir(g, t, `Tren ${numeroTren(t, g.reloj)} retirado: ${m.nombre} agota la conducción máxima sin relevo posible.`);
      g.kpi.afect += 900;
    }
  }

  for (const t of g.trenes) {
    if (t.riesgo > 0 && t.estado !== "suprimido" && Math.random() < t.riesgo / 60) {
      t.riesgo = 0;
      suprimir(g, t, `Tren ${numeroTren(t, g.reloj)} detenido en plena vía por la avería no atendida.`);
      g.kpi.afect += 1600;
    }
  }

  asignarViasCabecera(g);
  /* INVARIANTE DURO de vía única. Se comprueba al final del minuto, cuando
     ya han pasado todos los trenes por todas las reglas. Si por cualquier vía
     de código quedaran dos sentidos dentro del mismo tramo, se corrige aquí:
     manda el sentido del tren que antes va a despejar, y a los contrarios se
     les devuelve a su estación de acceso y se les retiene.                  */
  for (const rest of tramos) {
    const k = `${rest.tramo.a}-${rest.tramo.b}`;
    const dentro = g.trenes.filter((o) => o.estado !== "suprimido" && dentroTramo(o, r, rest.tramo));
    if (dentro.length < 2) continue;
    const dirs = [...new Set(dentro.map((o) => situacion(o, r).dir))];
    if (dirs.length < 2) continue;

    // gana el sentido del tren que tiene más cerca la salida del tramo
    const restante = (o) => {
      const so = situacion(o, r);
      return so.dir === "alcala" ? rest.tramo.b - so.idx : so.idx - rest.tramo.a;
    };
    const dueno = situacion(dentro.slice().sort((x, y) => restante(x) - restante(y))[0], r).dir;

    for (const o of dentro) {
      const so = situacion(o, r);
      if (so.dir === dueno) {
        o.enVU = { a: rest.tramo.a, b: rest.tramo.b, dir: dueno };
        continue;
      }
      // solo se devuelve al acceso a quien acaba de asomarse. Si ya va lanzado
      // dentro del tramo, echarlo atrás sería un salto absurdo: se le deja
      // terminar y simplemente no se autoriza a nadie más en contra.
      const recienEntrado = so.dir === "alcala" ? so.idx - rest.tramo.a < 0.6 : rest.tramo.b - so.idx < 0.6;
      if (recienEntrado) retenerEnAcceso(g, o, rest.tramo, so.dir, r);
      else o.enVU = { a: rest.tramo.a, b: rest.tramo.b, dir: so.dir };
    }
    vu[k] = { dir: dueno, n: dentro.filter((o) => situacion(o, r).dir === dueno).length };
  }

  /* Corte nocturno. Retirada la última circulación, no hay servicio hasta
     las cinco. En vez de recorrer cuatro horas en vacío, se salta al inicio
     y allí van entrando los trenes desde donde quedaron estacionados.    */
  // aviso de falta de vías, una sola vez al abrir el turno
  if (g.avisoNoche !== null && g.avisoNoche !== undefined) {
    log(g, "bad", `Solo quedan ${g.avisoNoche} vías libres en cabeceras para estacionar ${CIRCULACIONES} composiciones: habrá que sacar material a taller.`);
    g.avisoNoche = null;
  }

  // a partir del comienzo de la retirada se puede elegir vía de estacionamiento
  if (g.turno === "noche" && r >= 22 * 60)
    for (const t of g.trenes) if (t.supresion && t.supresion.noche && !t.supresion.via) t.pendienteApartar = true;

  if (g.turno === "noche") {
    const enLinea = g.trenes.filter((t) => t.estado !== "suprimido").length;
    // tras la última retirada prevista ya no debe quedar nadie en línea
    if ((!enLinea || r > RETIRADA_FIN + 60) && r < 29 * 60 && !g.corte) {
      for (const t of g.trenes)
        if (t.estado !== "suprimido") {
          const idxD = ESTACIONES.findIndex((e) => e.cab === (g.retirada[t.i] || {}).destino);
          suprimir(g, t, `Tren ${numeroTren(t, g.reloj)}: retirado al cierre del servicio.`, idxD >= 0 ? idxD : null);
          if (idxD >= 0) t.nocheEn = { idx: idxD, via: null };
        }
      g.corte = true;
      g.reloj = 29 * 60; // 05:00 del día siguiente
      g.ultimoMin = g.reloj;
      log(g, "aviso", "Servicio finalizado. El material queda estacionado hasta el arranque de las 05:00.");
      programarArranque(g);
    }
  }

  // maquinistas que ya han llegado de viajero: sacan el material
  if (g.vacios && g.vacios.length) {
    const pend = [];
    for (const o of g.vacios) {
      if (r < o.listo) {
        pend.push(o);
        continue;
      }
      if (!crearVacio(g, o)) {
        const m = g.personal.find((x) => x.id === o.maqId);
        if (m) {
          m.estado = "reserva";
          m.destinoViaje = null;
          m.lugar = cabeceraDe(o.idx);
        }
        log(g, "bad", `El material de ${ESTACIONES[o.idx].n}, ${o.via}, ya no está: se anula el movimiento en vacío.`);
      }
    }
    g.vacios = pend;
  }

  // el cuadro avanza solo: arranca lo que toca y cierra lo vencido
  for (const t of g.trenes) avanzarMarchas(g, t, r);

  /* Alarmas que pueden repetirse: al no avisar a Seguridad, quien la accionó
     sigue a bordo. Se comprueba una sola vez, entre 5 y 25 minutos después:
     minuto a minuto la probabilidad se acumularía y acabaría saltando casi
     siempre.                                                            */
  for (const t of g.trenes) {
    if (!t.alarmaSuelta || r < t.alarmaSuelta) continue;
    t.alarmaSuelta = null;
    if (t.estado === "suprimido" || Math.random() > 0.15) continue;
    retrasar(g, t, 4, "nuevo accionamiento de la alarma");
    log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: vuelven a accionar el aparato de alarma. Había que haber avisado a Seguridad.`);
  }

  // altercados que van a más: el tren se queda donde esté hasta que llegue seguridad
  for (const t of g.trenes) {
    if (!t.altercadoVivo || r < t.altercadoVivo) continue;
    t.altercadoVivo = null;
    if (t.estado === "suprimido" || Math.random() > 0.2) continue;
    const donde = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(situacion(t, r).idx)))];
    const causa = Math.random() < 0.5 ? "se acciona el aparato de alarma" : "se desbloquea una puerta";
    const espera = 10 + Math.floor(Math.random() * 16);
    t.detenido = { restante: espera, motivo: "altercado a bordo, esperando a seguridad" };
    // los afectados son los que van a bordo de verdad, no una cifra inventada
    const aBordo = Math.round(t.pax.reduce((a2, b2) => a2 + b2, 0));
    g.kpi.afect += aBordo;
    log(
      g,
      "bad",
      `Tren ${numeroTren(t, g.reloj)}: el altercado va a más y ${causa} a la altura de ${donde.n}. Inmovilizado ${espera} min con ${nf(aBordo)} viajeros a bordo.`
    );
  }

  /* Medias del turno y momentos de apuro. Se toma una muestra por minuto de
     lo que de verdad está pasando, no del estado final.                 */
  {
    const enServicio = g.trenes.filter((t) => t.estado !== "suprimido" && !t.esVacio);
    const conPasaje = enServicio.filter(
      (t) => !t.rotando && !t.enDesviada && !t.vacio && t.unidades.length && situacion(t, r).dir !== "maniobra"
    );
    if (conPasaje.length) {
      g.kpi.sumaOcup += (conPasaje.reduce((n, t) => n + t.pax.reduce((a2, b2) => a2 + b2, 0) / (plazasDe(t) || 1), 0) / conPasaje.length) * 100;
      g.kpi.minutosOcup += 1;
    }
    const medio = enServicio.length ? enServicio.reduce((n, t) => n + retrasoEfectivo(t), 0) / enServicio.length : 0;
    if (medio > g.kpi.picoRetraso) {
      g.kpi.picoRetraso = medio;
      g.kpi.horaPico = Math.round(r);
    }
    if (g.trenes.some((t) => t.detenido || t.retenido || t.inmovil || t.esperaVia)) g.kpi.minutosApuro += 1;
  }

  /* Rastro de la marcha real. Sin esto, la malla solo podría unir la salida
     con la llegada en línea recta y perdería justo lo interesante: dónde se
     detuvo el tren y cuánto tiempo.                                      */
  const kTraza = Math.round((Math.round(r) - INICIO) / PASO_TRAZA);
  if (kTraza >= 0 && kTraza <= (FIN - INICIO) / PASO_TRAZA + 30 && (Math.round(r) - INICIO) % PASO_TRAZA === 0) {
    for (const t of g.trenes) {
      if (!t.traza) t.traza = [];
      // se guardan décimas enteras: ocupan la mitad que un decimal con punto
      const pos = t.estado === "suprimido" ? null : Math.round(situacion(t, r).idx * 10);
      while (t.traza.length < kTraza) t.traza.push(null);
      t.traza[kTraza] = pos;
    }
  }

  /* Muestra cada diez minutos para la evolución del día: viajeros a bordo y
     en andén, retraso, puntualidad y ocupación en ese momento.          */
  if (g.estad && Math.round(r) % 10 === 0) {
    const enServicio = g.trenes.filter((t) => t.estado !== "suprimido" && !t.esVacio);
    const conPasaje = enServicio.filter((t) => !t.rotando && !t.enDesviada && t.unidades.length && situacion(t, r).dir !== "maniobra");
    const aBordo = enServicio.reduce((n, t) => n + t.pax.reduce((a2, b2) => a2 + b2, 0), 0);
    const enAnden = g.andenes.reduce((n, a2) => n + a2.alcala + a2.pio, 0);
    g.estad.muestras.push({
      m: Math.round(r),
      bordo: Math.round(aBordo),
      anden: Math.round(enAnden),
      ret: enServicio.length ? Math.round((enServicio.reduce((n, t) => n + retrasoEfectivo(t), 0) / enServicio.length) * 10) / 10 : 0,
      punt: g.kpi.muestras ? Math.round((g.kpi.puntuales / g.kpi.muestras) * 1000) / 10 : 100,
      ocup: conPasaje.length ? Math.round((conPasaje.reduce((n, t) => n + t.pax.reduce((x, y) => x + y, 0) / (plazasDe(t) || 1), 0) / conPasaje.length) * 1000) / 10 : 0,
      circ: enServicio.length,
    });
    // pico de gente esperando en cada andén, para saber dónde aprieta
    g.andenes.forEach((a2, i) => {
      const total = a2.alcala + a2.pio;
      if (total > (g.estad.esperaMax[i] || 0)) g.estad.esperaMax[i] = Math.round(total);
    });
  }

  // un tren sin climatización todo el turno acaba dando problemas a bordo
  for (const t of g.trenes) {
    if (!t.climaViciada || r < t.climaViciada) continue;
    t.climaViciada = null;
    if (t.estado === "suprimido" || Math.random() > 0.2) continue;
    const donde = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(situacion(t, r).idx)))];
    g.cola.push({
      tipo: "inc",
      grav: "leve",
      tren: t.i,
      titulo: `Altercado a bordo en el ${numeroTren(t, g.reloj)}`,
      lugar: donde.n,
      datos: datosDeTren(g, t),
      texto: `El calor a bordo termina provocando un altercado entre viajeros a la altura de ${donde.n}. Se requiere la intervención de seguridad.`,
      opciones: [
        {
          label: "Esperar a seguridad en la estación",
          detalle: "El tren queda retenido hasta la intervención",
          tiempo: [8, 20],
          ef: { retraso: { i: t.i, m: 8 + Math.floor(Math.random() * 13) } },
        },
        {
          label: "Continuar hasta estación con dotación",
          detalle: "Menos retraso, pero el altercado sigue a bordo y puede ir a más",
          ef: { retraso: { i: t.i, m: 5 }, altercado: t.i },
        },
      ],
    });
    log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: el calor a bordo acaba provocando un altercado.`);
  }

  /* Trenes en marcha degradada: cada tramo cumplido pagan su pérdida, y con
     ella se tira por si la avería va a más.                             */
  for (const t of g.trenes) {
    const d = t.degradada;
    if (!d || t.estado === "suprimido") continue;
    if (r - d.desde < d.cada) continue;
    d.desde = r;
    retrasar(g, t, d.min, "marcha degradada por avería");
    if (d.agrava > 0 && Math.random() < d.agrava) {
      t.degradada = null;
      g.cola.push(avanceAveria(g, t, d.tipo));
      log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: la avería va a más.`);
    }
  }

  /* Transbordo al tren averiado: el primero que pasa por el punto en el mismo
     sentido recoge su pasaje y pierde diez minutos parado a su lado.    */
  for (const roto of g.trenes) {
    const esp = roto.esperaTransbordo;
    if (!esp) continue;
    const socorrista = g.trenes.find((t) => {
      if (t.i === roto.i || t.estado === "suprimido" || t.detenido || t.esVacio) return false;
      const sv = situacion(t, r);
      return sv.dir === esp.dir && Math.abs(sv.idx - esp.idx) < 0.6;
    });
    if (!socorrista) continue;
    roto.esperaTransbordo = null;
    // un transbordo forzoso se sufre y se comenta
    if (!g.cal) g.cal = { retraso: 0, agobio: 0, material: 0, roto: 0, viajeros: 0 };
    g.cal.roto += 600;
    publicar(g, "transbordo", { L: g.linea, E: (ESTACIONES[Math.round(situacion(roto, g.reloj).idx)] || {}).n });
    socorrista.detenido = { restante: 10, motivo: `transbordo del pasaje del ${numeroTren(roto, r)}` };
    // el pasaje del averiado pasa al socorrista, en la medida en que quepa
    const hueco = Math.max(0, (plazasDe(socorrista) || 0) - socorrista.pax.reduce((a2, b2) => a2 + b2, 0));
    const aBordo = roto.pax.reduce((a2, b2) => a2 + b2, 0);
    const pasan = Math.min(hueco, aBordo);
    if (aBordo > 0) {
      const prop = pasan / aBordo;
      roto.pax.forEach((v, k) => {
        socorrista.pax[k] += v * prop;
        roto.pax[k] = 0;
      });
      g.kpi.afect += Math.round(aBordo);
    }
    log(g, "aviso", `Tren ${numeroTren(socorrista, r)}: recoge el pasaje del ${numeroTren(roto, r)}. Diez minutos de transbordo.`);
  }

  aplicarSeparacion(g);

  for (const t of g.trenes) {
    // un tren retirado no circula: no puede puntuar ni penalizar la media
    if (t.estado === "suprimido") {
      if (t.dejados > 0) {
        g.kpi.afect += t.dejados;
        t.dejados = 0;
      }
      continue;
    }
    if (t.esVacio) continue; // un tren sin viajeros no puntúa
    g.kpi.muestras += 1;
    if (retrasoEfectivo(t) <= 5.5) g.kpi.puntuales += 1;
    g.kpi.sumaRetraso += retrasoEfectivo(t);
    if (t.dejados > 0) {
      g.kpi.afect += t.dejados;
      t.dejados = 0;
    }
  }

  for (const rest of g.restricciones) {
    if (r >= rest.hasta && !rest.avisado) {
      rest.avisado = true;
      log(g, "ok", `${rest.txt}: restablecida la circulación normal.`);
    }
  }
  /* Al levantarse una restricción, alguien lo agradece. Es lo que evita que el
     muro sea solo un vertedero de quejas.                              */
  const vencidas = g.restricciones.filter((x) => r >= x.hasta);
  for (const x of vencidas) if (Math.random() < 0.45) publicar(g, "bien", { L: g.linea, E: (ESTACIONES[x.idx] || {}).n });
  g.restricciones = g.restricciones.filter((x) => r < x.hasta);

  /* Se anota dónde ha quedado cada tren, y se hace AL FINAL: es el único dato
     fiable de por dónde iba, y solo lo es si ya no queda ningún ajuste de
     retraso por aplicar. Anotándolo antes, un tren retenido después constaba
     como que ya estaba dentro del tramo y el control lo dejaba pasar.  */
  for (const t of g.trenes) {
    const sf = situacion(t, r);
    t.idxPrev = sf.dir === "maniobra" ? null : sf.idx;
    t.dirPrev = sf.dir;
  }

  if (g.incEspera > 0) g.incEspera -= 1;
  if (r >= g.proximoSorteo) {
    if (g.cola.length || g.incEspera > 0 || g.incCount >= MAX_INCIDENCIAS) {
      g.proximoSorteo = r + 10; // se pospone, no se pierde el sorteo
    } else {
      g.proximoSorteo = r + 55 + Math.floor(Math.random() * 11);
      const def = sortearIncidencia(r, g);
      const inc = def && def.gen(g);
      if (inc) {
        /* La gravedad viene de la familia, salvo que el generador declare la
           suya: las averías de material la deciden en el sorteo.        */
        /* Si la incidencia no trae sus datos pero sí afecta a un tren, se
           construyen del propio tren: ninguna tarjeta sin subtítulo.   */
        const conDatos = inc.datos || (inc.tren !== undefined ? datosDeTren(g, g.trenes.find((t) => t.i === inc.tren)) : null);
        /* Algunos generadores devuelven null cuando su opción no aplica —el
           desacople, sin ir más lejos, solo existe en composición doble—. Se
           filtran aquí, que es el punto por el que pasan todas: con una línea
           que circula en sencillo, ese nulo llegaba a la pantalla y la
           tumbaba.                                                       */
        const limpias = (inc.opciones || []).filter(Boolean);
        g.cola.push({ tipo: "inc", linea: g.linea, grav: GRAVEDAD_FAMILIA[def.id] || "grave", ...inc, opciones: limpias, datos: conDatos });
        g.incCount += 1;
        g.incEspera = SEPARACION_MIN;
        log(g, "bad", `Incidencia: ${inc.titulo}.`);
      }
    }
  }

  if (g.cola.length) g.marcha = false;
  if (r >= FIN) {
    g.fin = true;
    g.marcha = false;
  }
  return g;
}

/* Al cambiar de maquinista se cierra su saldo de marcha y se apunta a su
   nombre. Si no, el acumulado del turno entero se le atribuía al que
   estuviera conduciendo en ese momento, aunque lo hubiera perdido otro. */
function cerrarDerivaMaq(g, t) {
  const v = t.acum.maquinista;
  if (Math.abs(v) < 0.5) {
    t.acum.maquinista = 0;
    return;
  }
  const m = t.maq ? maqDe(g, t) : null;
  apunta(g, t, `marcha de ${m ? m.nombre : "el maquinista"}`, v);
  t.acum.maquinista = 0;
}

/* De noche no se retira ningún tren por falta de relevo: el plan de retirada
   manda, y cada circulación tiene que llegar a la cabecera donde se estaciona.
   Si no, acababan apartándose en Coslada o Vicálvaro, que no es su sitio.  */
function enRetiradaNocturna(g, t) {
  return !!(g.retirada && g.retirada[t.i]);
}

function ejecutarRelevo(g, t, cab, forzarReserva = false) {
  const pool = forzarReserva || t.relevoConReserva ? reservasEn(g, cab) : nominalEn(g, cab);

  if (!pool.length) {
    // ¿hay al menos una reserva con la que salir del paso?
    const hayReserva = reservasEn(g, cab).length;
    t.retenido = cab;
    t.relevo = null;
    // si ya hay un aviso pendiente para este tren no se encola otro
    if (t.avisado && g.cola.some((c) => c.tren === t.i && (c.titulo || "").startsWith("Sin relevo"))) return;
    t.avisado = true;
    g.cola.push({
      tren: t.i,
      tipo: "aviso",
      titulo: `Sin relevo en ${cab}`,
      lugar: cab,
      datos: datosDeTren(g, t),
      texto: `El ${numeroTren(t, g.reloj)} ha llegado a ${cab} para el relevo y el maquinista nominal no está disponible. Cada minuto retenido es retraso.`,
      opciones: [
        hayReserva
          ? { label: "Cubrir con un maquinista de reserva", detalle: `Quedan ${hayReserva} en ${cab} para el resto del turno`, ef: { relevaReserva: { i: t.i, cab } } }
          : null,
        { label: "Retener el tren hasta que haya relevo", detalle: "Acumula retraso pero conserva la circulación", ef: { retener: t.i, cab } },
        { label: "Terminar recorrido aquí", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: t.i } },
      ].filter(Boolean),
    });
    return;
  }

  const entra = pool.sort((a, b) => margenDe(b) - margenDe(a))[0];
  const sale = t.maq ? maqDe(g, t) : null;
  if (sale) {
    sale.estado = "descanso";
    sale.descanso = DESCANSO;
    sale.lugar = cab;
    sale.tren = null;
    sale.cond = 0;
  }
  entra.estado = "conduciendo";
  entra.tren = t.i;
  entra.cond = 0;
  entra.lugar = null;
  cerrarDerivaMaq(g, t);
  t.maq = entra.id;
  t.avisado = false;
  t.excesoAutorizado = false;
  t.retenido = false;
  t.relevoConReserva = false;
  /* El siguiente relevo sale del cuadro previsto, no de un sorteo nuevo: al
     replanificarlo se elegía otra cabecera y el maquinista dado de alta se
     quedaba esperando donde ya no iba a haber relevo.                    */
  t.relevo = (t.cuadroRelevos && t.cuadroRelevos.shift()) || programarRelevo(t, entra, g.reloj);
  // si el cuadro prevé otro relevo, se da de alta al nominal que entra
  if (t.relevo && !g.personal.some((m) => m.tipo === "nominal" && m.estado === "entrante" && m.lugar === t.relevo.cab && Math.abs(m.entra - (t.relevo.prevista - 25)) < 30)) {
    g.personal.push({
      id: `M${String(g.personal.length + 1).padStart(2, "0")}`,
      nombre: nombreDe(g.personal.length),
      tipo: "nominal",
      estado: "entrante",
      lugar: t.relevo.cab,
      entra: Math.max(g.reloj, t.relevo.prevista - 25),
      tren: null, cond: 0, jornada: 0, descanso: 0, baja: false, ...atributos(),
    });
  }
  log(g, "ok", `Relevo en ${cab}: ${entra.nombre} toma el ${numeroTren(t, g.reloj)}.`);
}

function ejecutarCambio(g, t) {
  const { idx, conReserva } = t.cambio;
  const e = ESTACIONES[idx];
  const lote = (g.apartado[idx] || []).find((x) => !x.averiado);
  const res = reservasEn(g, e.cab);
  if (!lote || !res.length) {
    log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: el cambio de material en ${e.n} ya no es posible.`);
    t.cambio = null;
    return;
  }

  const defectuoso = t.unidades.map((u) => ({ ...u }));
  const via = lote.via;

  // el tren toma la composición apartada y deja la suya en esa misma vía
  t.unidades = lote.unidades.map((u) => ({ ...u }));
  t.serie = t.unidades[0].serie;
  t.estado = "servicio";
  t.limitacion = 0;
  t.riesgo = 0;
  t.retirarCab = false;
  g.apartado = {
    ...g.apartado,
    [idx]: [...g.apartado[idx].filter((x) => x !== lote), { via, unidades: defectuoso, desde: Math.floor(g.reloj), averiado: true }],
  };

  // un reserva se ocupa de retirar el material averiado
  const maniobrista = res.sort((a, b) => margenDe(b) - margenDe(a))[0];
  maniobrista.estado = "maniobras";
  maniobrista.hasta = g.reloj + MANIOBRA_APARTADO;
  maniobrista.tren = null;

  let txtMaq = "";
  if (conReserva) {
    const otros = reservasEn(g, e.cab);
    const entra = otros.length ? otros.sort((a, b) => margenDe(b) - margenDe(a))[0] : null;
    if (entra) {
      const sale = t.maq ? maqDe(g, t) : null;
      if (sale) {
        sale.estado = "descanso";
        sale.descanso = DESCANSO;
        sale.lugar = e.cab;
        sale.tren = null;
        sale.cond = 0;
      }
      entra.estado = "conduciendo";
      entra.tren = t.i;
      entra.cond = 0;
      entra.lugar = null;
      cerrarDerivaMaq(g, t);
      t.maq = entra.id;
      t.avisado = false;
      t.excesoAutorizado = false;
      /* El siguiente relevo sale del cuadro previsto, no de un sorteo nuevo: al
     replanificarlo se elegía otra cabecera y el maquinista dado de alta se
     quedaba esperando donde ya no iba a haber relevo.                    */
  t.relevo = (t.cuadroRelevos && t.cuadroRelevos.shift()) || programarRelevo(t, entra, g.reloj);
      txtMaq = ` Lo toma ${entra.nombre}.`;
    }
  }

  log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: cambiado a ${t.unidades.map((u) => u.id).join(" + ")} en ${e.n}. ${defectuoso.map((u) => u.id).join(" + ")} queda apartado en ${via}, fuera de servicio.${txtMaq}`);
  t.cambio = null;
}


function suprimir(g, t, msg, enIdx = null, enVia = null) {
  /* Una supresión es lo que peor se percibe: la gente que iba dentro y la que
     esperaba se queda tirada. Pesa en la calidad y da conversación.    */
  {
    const aBordo = (t.pax || []).reduce((a2, b2) => a2 + b2, 0);
    if (!g.cal) g.cal = { retraso: 0, agobio: 0, material: 0, roto: 0, viajeros: 0 };
    g.cal.roto += aBordo * 8 + 400;
    const sv = situacion(t, g.reloj);
    const est = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(sv.idx)))];
    const cuantos = 1 + Math.floor(Math.random() * (intensidad(g.reloj) > 0.75 ? 4 : 2));
    for (let k = 0; k < cuantos; k++) publicar(g, Math.random() < 0.3 ? "duro" : "supresion", { L: g.linea, E: est ? est.n : "", T: numeroTren(t, g.reloj) });
  }

  if (t.estado !== "suprimido") cerrarMarcha(g, t, enIdx !== null ? enIdx : Math.round(situacion(t, g.reloj).idx), "retirada");
  if (t.estado === "suprimido") return;
  const sAct = situacion(t, g.reloj);
  const iAct = Math.min(N - 1, Math.round(sAct.idx));
  const aBordo = t.pax.reduce((a, b) => a + b, 0);
  if (aBordo > 0) {
    const dir = sAct.dir === "pio" ? "pio" : "alcala";
    g.andenes[iAct][dir] += aBordo;
    g.kpi.afect += aBordo;
    log(g, "aviso", `${nf(aBordo)} viajeros desalojados en ${ESTACIONES[iAct].n} pasan a esperar al siguiente tren.`);
  }
  t.pax = new Array(N).fill(0);
  /* El material nunca se pierde. Si la vía pedida está ocupada se busca otra
     en la misma estación, y si tampoco hay, la unidad vuelve a la reserva en
     vez de desaparecer del juego, que es lo que pasaba antes.            */
  let sitio = apartarMaterial(g, t, enIdx, enVia);
  if (!sitio) sitio = apartarMaterial(g, t, enIdx, null);
  // el tercer intento solo cuando no hay destino firme, para no acabar
  // aparcando en Torrejón un tren que debía quedarse en Chamartín
  if (!sitio && !(t.supresion && t.supresion.noche)) sitio = apartarMaterial(g, t);
  if (!sitio && t.unidades.length) {
    g.reserva = [...g.reserva, ...t.unidades.map((u) => ({ ...u }))];
    log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: sin vía libre, el material pasa a reserva.`);
  }
  // si la retirada es por avería, el material queda inútil hasta pasar por taller
  if (sitio && t.marcarAveriado) {
    const lista = g.apartado[sitio.i] || [];
    const lote = lista.find((x) => x.via === sitio.via);
    if (lote) lote.averiado = true;
    t.marcarAveriado = false;
  }
  t.estado = "suprimido";
  t.relevo = null;
  t.rotacion = null;
  t.rotando = null;
  t.retenido = false;
  if (t.maq) {
    const m = maqDe(g, t);
    if (m) {
      m.estado = "descanso";
      m.descanso = DESCANSO;
      m.lugar = CHAMARTIN;
      m.tren = null;
      m.cond = 0;
    }
    cerrarDerivaMaq(g, t);
    t.maq = null;
  }
  log(g, "bad", msg);
  if (sitio) log(g, "aviso", `Material apartado en ${ESTACIONES[sitio.i].n}, ${sitio.via}.`);
}

/* Registro único de efectos válidos. Sirve de contrato: si se genera un
   efecto que no está aquí, o se escribe mal el nombre, el juego lo avisa por
   consola en vez de ignorarlo en silencio, que es lo que pasaba antes.    */
const EFECTOS = [
  "abortarRotacion", "acompanante", "adelantar", "afect", "apartarPaso", "autorizar", "cab", "cambioMaterial",
  "circularVacio", "coste", "corteVia", "cortarEstacion", "desacoplar", "afectABordo", "afectAnden", "afectLinea", "atls", "cabinaCambio", "calidad", "carteristas", "climaSinResolver", "degradada", "rescate", "destinoVacio", "altercado", "repiteAlarma", "esperarCabecera", "averiaGrave", "fiabBaja", "gen", "limitacion", "moverApartado", "ordenarRotacion", "socorro",
  "reforzar", "relevaReserva", "relevoInmediato", "reponer", "restriccion", "retener", "retirarCabecera",
  "retirarMaq", "retraso", "riesgo", "supresion", "suprimir",
];

function aplicar(g, ef) {
  /* La decisión se aplica sobre la línea de la incidencia, no sobre la que se
     esté mirando: los índices de estación y los trenes son distintos en cada
     una, y aplicarla en la equivocada rompe el estado.                 */
  const vistaPrevia = g.linea || LINEAS_EN_JUEGO[0];
  const deLinea = g.cola && g.cola[0] && g.cola[0].linea;
  if (deLinea && deLinea !== vistaPrevia && g.porLinea && g.porLinea[deLinea]) {
    guardarLinea(g, vistaPrevia);
    entrarLinea(g, deLinea);
  }

  /* Resolver la avería es sacar la unidad del servicio: cambiarla, apartarla o
     desacoplarla. Continuar NO la resuelve, y por eso se arrastra.      */
  const resolver = (ids) => {
    for (const av of g.averiasTurno || []) if (ids.includes(av.id)) av.resuelta = true;
  };

  for (const k of Object.keys(ef || {}))
    if (!EFECTOS.includes(k)) console.warn(`[CGO] efecto desconocido: "${k}". Revisa el registro EFECTOS.`);
  const T = (i) => g.trenes.find((x) => x.i === i);

  if (ef.retraso) {
    const t = T(ef.retraso.i);
    if (t) retrasar(g, t, ef.retraso.m, "la incidencia");
  }
  if (ef.desacoplar) {
    if (ef.desacoplar.id) resolver([ef.desacoplar.id]);
    const t = T(ef.desacoplar.i);
    if (t && t.unidades.length > 1) {
      t.unidades = t.unidades.filter((u) => u.id !== ef.desacoplar.u);
      t.estado = "degradado";
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: desacoplada la ${ef.desacoplar.u}. Circula con ${nf(plazasDe(t))} plazas.`);
    }
  }
  if (ef.fiabBaja) {
    const t = T(ef.fiabBaja.i);
    const u = t && t.unidades.find((x) => x.id === ef.fiabBaja.u);
    if (u) {
      u.fiab = ef.fiabBaja.v;
      log(g, "aviso", `${u.id}: revisión aplazada. Fiabilidad al ${Math.round(u.fiab * 100)} %.`);
    }
  }
  if (ef.suprimir) {
    const t = T(ef.suprimir);
    if (t) suprimir(g, t, `Tren ${numeroTren(t, g.reloj)} retirado del servicio por decisión del CGO.`);
  }
  if (ef.riesgo) {
    const t = T(ef.riesgo.i);
    if (t) t.riesgo = ef.riesgo.p;
  }
  if (ef.reforzar) {
    const t = T(ef.reforzar);
    const k = t ? g.reserva.findIndex((u) => u.serie === t.serie) : -1;
    if (t && SERIES[t.serie].doble && t.unidades.length < 2 && k >= 0) {
      const u = g.reserva.splice(k, 1)[0];
      t.unidades.push(u);
      log(g, "ok", `Tren ${numeroTren(t, g.reloj)} reforzado con la ${u.id}. Ahora ofrece ${nf(plazasDe(t))} plazas.`);
    } else log(g, "aviso", "No hay material de reserva compatible con esa composición en Fuencarral.");
  }
  if (ef.adelantar || ef.relevoInmediato) {
    const t = T(ef.adelantar || ef.relevoInmediato);
    if (t) {
      const e = etaPrimeraCabecera(t, g.reloj);
      t.relevo = { desde: g.reloj, cab: e.cab, prevista: g.reloj + e.min };
      t.relevoConReserva = true;
      // t.avisado sigue en true: la decisión ya está tomada y no debe volver a
      // preguntarse cada minuto. Se rearma solo al ejecutarse el relevo.
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: relevo adelantado a ${e.cab}, llegada en ${Math.round(e.min)} min.`);
    }
  }
  if (ef.limitacion) {
    const t = T(ef.limitacion.i);
    if (t) {
      t.limitacion += ef.limitacion.m;
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: marcha limitada, +${t.limitacion} min por recorrido.`);
    }
  }
  if (ef.reponer) {
    const { i, idx, clave, cuando } = ef.reponer;
    const t = T(i);
    const comp = composicionesDisponibles(g, idx).find((c) => c.clave === clave);
    const cab = cabeceraDe(idx);
    /* Si no hay reserva en esa cabecera, se trae de otra: viaja como viajero en
       el primer tren. Antes la reposición se caía en silencio por no tener a
       nadie justo allí, aunque hubiera cinco a media hora de distancia. */
    let maq = reservasEn(g, cab).sort((a2, b2) => margenDe(b2) - margenDe(a2))[0];
    if (!maq) {
      const libre = (m) => m.tipo === "reserva" && m.estado === "reserva" && !m.baja && !m.tren;
      const libres = [...(g.personal || []).filter(libre), ...(g.reservaPersonal || []).filter(libre)];
      maq = libres.sort((a2, b2) => margenDe(b2) - margenDe(a2))[0];
      if (maq) {
        /* Viaja como viajero en el primer tren que le lleve, y tarda lo que
           tarde ese tren. Antes aparecía allí al instante.             */
        const idxDesde = ESTACIONES.findIndex((e) => e.cab === maq.lugar);
        const v = viajeMaquinista(g, idxDesde < 0 ? IDX_CHAMARTIN : idxDesde, idx);
        log(
          g,
          "aviso",
          `${maq.nombre} sale de ${maq.lugar} como viajero hacia ${cab} para tomar el servicio. Espera ${v.espera} min el tren y llega a las ${hhmm(g.reloj + v.total)}.`
        );
        maq.lugar = cab;
      }
    }
    if (t && comp && maq) {
      // el material sale del apartadero o del taller
      if (comp.desdeApartado)
        g.apartado = { ...g.apartado, [idx]: (g.apartado[idx] || []).filter((x) => x.via !== comp.desdeApartado) };
      if (comp.deTaller)
        for (const id of comp.deTaller) {
          const tl = g.taller[id];
          if (tl) {
            const nuevo = Math.max(0, tl.entrada - REVISIONES[tl.tipo].quita);
            g.desg = { ...g.desg, [id]: nuevo };
            delete g.taller[id];
          }
        }
      maq.estado = "reservado";
      t.reponer = { idx, cab, clave, cuando, unidades: comp.unidades.map((u) => ({ ...u, desgaste: desgasteDe(g, u.id), fiab: fiabDesgaste(desgasteDe(g, u.id)) })), maq: maq.id };
      log(g, "aviso", `Circulación ${t.i}: repuesta en ${ESTACIONES[idx].n} a las ${hhmm(cuando)} con ${comp.unidades.map((u) => u.id).join(" + ")}.`);
    }
  }
  // avería grave: el tren termina recorrido en la primera estación con sitio
  if (ef.averiaGrave) {
    const t = T(ef.averiaGrave.i);
    if (t) {
      resolver(t.unidades.map((u) => u.id));
      const dest = viasParaApartar(g, t)[0];
      if (dest) {
        /* Se propone el primer sitio posible y se abre el selector en el acto:
           el botón para cambiarlo existía, pero estaba escondido en la lista de
           trenes y había que saber que estaba ahí.                       */
        t.supresion = { idx: dest.idx, via: dest.vias[0], averiado: true };
        g.pedirDestino = t.i;
        log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: termina recorrido en ${ESTACIONES[dest.idx].n}, ${dest.vias[0]}, donde quedará apartado por avería.`);
      } else {
        suprimir(g, t, `Tren ${numeroTren(t, g.reloj)}: sin apartadero por delante, se retira donde está.`);
      }
    }
  }

  // avería muy grave: el tren queda inmovilizado en el sitio
  if (ef.destinoVacio) {
    const { i, idx, via } = ef.destinoVacio;
    const t = T(i);
    if (t) {
      const antes = t.supresion || {};
      t.supresion = {
        idx,
        via,
        noche: !!antes.noche,
        hora: antes.hora,
        // solo queda inútil si venía de una avería, no por la retirada nocturna
        averiado: !!t.vacio || !!t.marcarAveriado || (!!antes.averiado && !antes.noche),
      };
      t.pendienteApartar = false;
      t.retirarCab = false; // el destino elegido manda sobre la retirada en cabecera
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: se apartará en ${ESTACIONES[idx].n}, ${via}.`);
    }
  }

  if (ef.circularVacio) {
    const t = T(ef.circularVacio.i);
    if (t) {
      resolver(t.unidades.map((u) => u.id));
      t.vacio = true; // bypass de puertas: no puede llevar viajeros
      t.pendienteApartar = true; // el puesto de mando elegirá estación y vía
      g.pedirDestino = t.i; // y se le pregunta en el acto, sin ir a buscarlo
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: desaloja en la próxima parada y circula como material vacío. Falta decidir dónde se aparta.`);
    }
  }

  /* Alarma repuesta sin avisar a Seguridad: puede volver a accionarse. Se
     fija el momento de la comprobación al aceptar la decisión.          */
  /* Altercado que sigue a bordo. Se comprueba una sola vez, poco después: si
     va a más, el tren queda inmovilizado donde esté hasta que llegue la
     dotación de seguridad, sea una estación o plena vía.                */
  /* Afectados calculados del estado real. Antes cada opción llevaba una cifra
     inventada, siempre la misma, sin mirar la hora ni la ocupación: 500 en
     punta y 500 de madrugada. Ahora se cuentan los viajeros que de verdad
     están a bordo o esperando.                                          */
  if (ef.afectABordo) {
    const t = T(ef.afectABordo);
    if (t) g.kpi.afect += Math.round(t.pax.reduce((a2, b2) => a2 + b2, 0));
  }
  if (ef.afectAnden !== undefined && ef.afectAnden !== null) {
    const a2 = g.andenes[ef.afectAnden];
    if (a2) g.kpi.afect += Math.round(a2.alcala + a2.pio);
  }
  if (ef.afectLinea) {
    const aBordo = g.trenes.reduce((n, t) => n + t.pax.reduce((x, y) => x + y, 0), 0);
    const enAnden = g.andenes.reduce((n, x) => n + x.alcala + x.pio, 0);
    // el corte afecta a los de a bordo y a los que esperan, en proporción
    g.kpi.afect += Math.round((aBordo + enAnden) * ef.afectLinea);
  }

  /* Carteristas que siguen a bordo. Se resuelve en el momento: si la medida
     no ha surtido efecto, continúan robando el resto del trayecto y los
     afectados son los viajeros que de verdad lleva el tren.             */
  /* Calidad del servicio. Todavía no se muestra ni puntúa, pero ya se acumula:
     hay decisiones que salen baratas en tiempo y caras en percepción, y sin
     este registro no hay forma de reflejarlo cuando se implemente.      */
  if (ef.calidad) g.kpi.calidad += ef.calidad;

  /* Seguir el turno sin climatización: el ambiente a bordo se degrada y puede
     acabar en altercado. Una sola comprobación, poco después.           */
  /* Cambio de material con la cabina sin climatizar. Como en la realidad, el
     maquinista puede negarse a seguir conduciendo en esas condiciones: la
     probabilidad depende de su profesionalidad, en torno al 50 %.       */
  if (ef.cabinaCambio) {
    const { i, idx, conReserva } = ef.cabinaCambio;
    const t = T(i);
    const mq = t && t.maq ? maqDe(g, t) : null;
    const pro = mq && Number.isFinite(mq.pro) ? mq.pro : 50;
    const pNegar = Math.max(0.15, Math.min(0.85, 0.5 - (pro - 50) / 200));
    if (Math.random() < pNegar) {
      log(g, "bad", `${mq ? mq.nombre : "El maquinista"} se niega a continuar sin climatización en cabina.`);
      g.cola.push({
        tipo: "inc",
        grav: "grave",
        tren: i,
        titulo: `El maquinista se niega a continuar · ${numeroTren(t, g.reloj)}`,
        datos: datosDeTren(g, t),
        lugar: ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(situacion(t, g.reloj).idx)))].n,
        texto: `${mq ? mq.nombre : "El maquinista"} no acepta conducir hasta el punto de cambio sin climatización en cabina. No queda más salida que dejar el material donde se pueda.`,
        opciones: [
          {
            label: "El tren se queda inútil en la primera estación posible",
            detalle: "Los viajeros bajan y el material queda apartado allí mismo",
            ef: { averiaGrave: { i } },
          },
        ],
      });
    } else {
      aplicar(g, { cambioMaterial: { i, idx, conReserva } });
    }
  }

  /* Marcha degradada: el tren pierde un tiempo fijo cada tantos minutos de
     marcha, y puede agravarse. Es distinto de la limitación por recorrido:
     aquí la penalización se paga por tiempo circulado, no por viaje.    */
  if (ef.degradada) {
    const t = T(ef.degradada.i);
    if (t) {
      t.degradada = { min: ef.degradada.min, cada: ef.degradada.cada, agrava: ef.degradada.agrava || 0, desde: g.reloj, tipo: ef.degradada.tipo };
      // se recuerda el grado para saber a cuál sube si se agrava
      t.degradaGrado = ef.degradada.min >= 15 ? "grave" : "leve";
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: continúa en marcha degradada, ${ef.degradada.min} min de pérdida cada ${ef.degradada.cada} min de marcha.`);
    }
  }

  if (ef.climaSinResolver) {
    const t = T(ef.climaSinResolver);
    if (t) t.climaViciada = g.reloj + 10 + Math.floor(Math.random() * 26);
  }

  if (ef.carteristas) {
    const t = T(ef.carteristas.i);
    if (t && Math.random() > ef.carteristas.exito) {
      t.carteristas = true;
      const aBordo = Math.round(t.pax.reduce((a2, b2) => a2 + b2, 0));
      g.kpi.afect += aBordo;
      g.kpi.calidad -= 10; // los robos consumados pesan en la percepción
      log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: los carteristas siguen actuando con ${nf(aBordo)} viajeros a bordo.`);
    }
  }

  if (ef.altercado) {
    const t = T(ef.altercado);
    if (t) t.altercadoVivo = g.reloj + 4 + Math.floor(Math.random() * 12);
  }

  if (ef.repiteAlarma) {
    const t = T(ef.repiteAlarma);
    if (t) t.alarmaSuelta = g.reloj + 5 + Math.floor(Math.random() * 21);
  }

  if (ef.socorro) {
    const t = T(ef.socorro.i);
    if (t) {
      const detras = vecinos(g, t).detras;
      t.inmovil = { desde: g.reloj, restante: SOCORRO_MIN, socorre: detras ? detras.i : null };
      if (detras) {
        retrasar(g, detras, SOCORRO_MIN, "socorro a otro tren");
        log(g, "aviso", `Tren ${numeroTren(detras, g.reloj)}: acude en socorro del ${numeroTren(t, g.reloj)}.`);
      } else {
        log(g, "bad", `No hay ningún tren detrás para socorrer al ${numeroTren(t, g.reloj)}: habrá que esperar.`);
        t.inmovil.restante = SOCORRO_MIN * 2;
      }
    }
  }

  /* Envío de ATLs. El tren queda inmovilizado y la vía cortada mientras los
     mecánicos llegan; después se sabe si lo arreglan o hay que rescatarlo. */
  if (ef.atls) {
    const t = T(ef.atls.i);
    if (t) {
      const s2 = situacion(t, g.reloj);
      const exacta = Math.max(0, Math.min(N - 1, s2.idx)); // sin redondear: define el tramo
      const idx = Math.round(exacta);
      const dir = s2.dir === "maniobra" ? "alcala" : s2.dir;
      const tarda = 15 + Math.floor(Math.random() * 11);
      t.inmovil = { desde: g.reloj, restante: tarda, atls: true, idx, dir };
      t.detenido = { restante: tarda, motivo: "esperando a los ATLs", silencioso: true };
      const rAtls = { id: `t${g.reloj}-${t.i}`, idx, m: 0, hasta: FIN + 120, txt: `Material averiado del ${numeroTren(t, g.reloj)}`, dir, tramo: limitesTramo(typeof exacta === "number" ? exacta : idx), tren: t.i };
      g.restricciones = [...g.restricciones, rAtls];
      propagarRestriccion(g, { ...rAtls, m: 3 }, (ESTACIONES[idx] || {}).n);
      reaccionAvería(g, t, "atls", idx);
      log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: inmovilizado en ${ESTACIONES[idx].n}. ATLs en camino, ${tarda} min. Vía única en el tramo.`);
    }
  }

  /* Rescate: la vía queda banalizada, el primer tren del mismo sentido hace
     transbordo y hay que mandar material y maquinista a recogerlo.      */
  if (ef.rescate) {
    const t = T(ef.rescate.i);
    if (t) {
      const s2 = situacion(t, g.reloj);
      const exacta = Math.max(0, Math.min(N - 1, s2.idx)); // sin redondear: define el tramo
      const idx = Math.round(exacta);
      const dir = s2.dir === "maniobra" ? "alcala" : s2.dir;
      t.inmovil = { desde: g.reloj, restante: 25 + Math.floor(Math.random() * 21), rescate: true, idx, dir };
      t.esperaTransbordo = { idx, dir }; // el primer tren del mismo sentido lo hará
      if (!g.restricciones.some((r) => r.tren === t.i)) {
        const nueva = { id: `a${g.reloj}-${t.i}`, idx, m: 0, hasta: FIN + 120, txt: `Material averiado del ${numeroTren(t, g.reloj)}`, dir, tramo: limitesTramo(typeof exacta === "number" ? exacta : idx), tren: t.i };
        g.restricciones = [...g.restricciones, nueva];
        // un tren clavado en una estación compartida estorba a todos
        propagarRestriccion(g, { ...nueva, m: 3 }, (ESTACIONES[idx] || {}).n);
        reaccionAvería(g, t, "rescate", idx);
      }
      g.pedirRescate = t.i; // el jugador elige material y maquinista
      log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: se organiza el rescate. Transbordo al primer tren del mismo sentido.`);
    }
  }

  if (ef.corteVia) {
    const t = T(ef.corteVia.i);
    if (t) {
      const s2 = situacion(t, g.reloj);
      const exacta = Math.max(0, Math.min(N - 1, s2.idx));
      const idx = Math.round(exacta);
      const dir = s2.dir === "maniobra" ? "alcala" : s2.dir;
      g.restricciones = [
        ...g.restricciones,
        { id: `c${g.reloj}-${t.i}`, idx, m: 0, hasta: FIN + 60, txt: `Material averiado del ${numeroTren(t, g.reloj)}`, dir, tramo: limitesTramo(exacta), tren: t.i },
      ];
      suprimir(g, t, `Tren ${numeroTren(t, g.reloj)}: queda en vía por avería muy grave. Se corta la vía y se banaliza el tramo.`);
      t.enVia = true;
    }
  }

  if (ef.supresion) {
    const t = T(ef.supresion.i);
    if (t) {
      t.supresion = { idx: ef.supresion.idx, via: ef.supresion.via };
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: se suprimirá en ${ESTACIONES[ef.supresion.idx].n}.`);
    }
  }
  if (ef.apartarPaso) {
    const { i, idx, quien } = ef.apartarPaso;
    const t = T(i);
    if (t) {
      t.apartaPaso = { idx, quien };
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: se apartará en ${ESTACIONES[idx].n} para dejar paso.`);
    }
  }
  if (ef.cambioMaterial) {
    const { i, idx, conReserva } = ef.cambioMaterial;
    const t = T(i);
    if (t) {
      resolver(t.unidades.map((u) => u.id)); // el material averiado sale del servicio
      t.cambio = { idx, conReserva, ordenado: g.reloj };
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: cambio de material ordenado en ${ESTACIONES[idx].n}.`);
    }
  }
  if (ef.retirarCabecera) {
    const t = T(ef.retirarCabecera);
    if (t) {
      t.retirarCab = true;
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: se retirará al llegar a cabecera.`);
    }
  }
  if (ef.acompanante) {
    const t = T(ef.acompanante);
    const cabs = [CHAMARTIN, ALCALA, PIO].sort((a, b) => etaCabecera(t, g.reloj, a) - etaCabecera(t, g.reloj, b));
    const cab = cabs.find((c) => reservasEn(g, c).length);
    if (cab) {
      const m = reservasEn(g, cab).sort((a, b) => margenDe(b) - margenDe(a))[0];
      m.estado = "acompanante";
      m.tren = t.i;
      m.lugar = cab;
      log(g, "aviso", `${m.nombre} sube como agente acompañante al ${numeroTren(t, g.reloj)} en ${cab}.`);
    } else {
      t.retirarCab = true;
      log(g, "bad", `Sin reservas para acompañar al ${numeroTren(t, g.reloj)}: se retirará en cabecera.`);
    }
  }
  if (ef.moverApartado) {
    const { idx, cab } = ef.moverApartado;
    const lote = (g.apartado[idx] || [])[0];
    const res = reservasEn(g, cab)[0];
    if (lote && res) {
      const serie = lote.unidades[0].serie;
      let destino = null;
      for (let x = 0; x < N; x++) if (x !== idx && viasLibres(g, x).length && admiteSerie(x, serie)) { destino = x; break; }
      g.apartado = { ...g.apartado, [idx]: g.apartado[idx].slice(1) };
      res.estado = "maniobras";
      res.tren = null;
      if (destino !== null) {
        const via = viasLibres(g, destino)[0];
        g.apartado[destino] = [...(g.apartado[destino] || []), { via, unidades: lote.unidades.map((u) => ({ ...u })), desde: Math.floor(g.reloj) }];
        log(g, "ok", `${res.nombre} traslada ${lote.unidades.map((u) => u.id).join(" + ")} de ${ESTACIONES[idx].n} a ${ESTACIONES[destino].n}, ${via}.`);
      } else {
        g.reserva = [...g.reserva, ...lote.unidades.map((u) => ({ ...u }))];
        log(g, "ok", `${res.nombre} devuelve ${lote.unidades.map((u) => u.id).join(" + ")} a Fuencarral. Vía liberada en ${ESTACIONES[idx].n}.`);
      }
    }
  }
  if (ef.ordenarRotacion) {
    const { i, c } = ef.ordenarRotacion;
    const t = T(i);
    if (t) {
      t.rotacion = { idx: c.idx, q: c.q, ahorro: c.ahorro, sinServicio: c.sinServicio, delta: c.delta };
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: rotará en ${ESTACIONES[c.idx].n} por falta de vía en cabecera.`);
    }
  }
  if (ef.esperarCabecera) {
    const { i, idx, cab } = ef.esperarCabecera;
    const t = T(i);
    if (t) {
      t.esperaCab = { idx, cab };
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: quedará a la entrada de ${cab} hasta que haya vía.`);
    }
  }
  /* Corte de estación: afecta a todas las líneas que paran allí, con una sola
     decisión que las gobierna a todas.                                 */
  if (ef.cortarEstacion) {
    const { estacion, m: mm, dur, txt } = ef.cortarEstacion;
    cortarEstacion(g, estacion, mm, dur, txt);
    /* Un corte de estación lo pagan todas las líneas que paran allí, y en su
       propia nota: si no, la incidencia se sentía en el retraso pero no en la
       calidad de quien la sufre.                                        */
    for (const idLin of lineasEnEstacion(g, estacion)) {
      const trozo = idLin === (g.linea || LINEAS_EN_JUEGO[0]) ? g : g.porLinea[idLin];
      if (!trozo.cal) trozo.cal = { retraso: 0, agobio: 0, material: 0, roto: 0, viajeros: 0 };
      trozo.cal.roto += mm * 120;
    }
    const afectadas = lineasEnEstacion(g, estacion);
    log(
      g,
      "bad",
      `${txt} en ${estacion}: ${mm} min de penalización a cada paso hasta las ${hhmm(g.reloj + dur)}. Afecta a ${afectadas.join(" y ")}.`
    );
    // la gente de cada línea que pasa por allí lo sufre y lo cuenta
    for (const id of afectadas) {
      const cuantos = 1 + Math.floor(Math.random() * (intensidad(g.reloj) > 0.75 ? 4 : 2));
      for (let k = 0; k < cuantos; k++) publicar(g, Math.random() < 0.25 ? "duro" : "retraso", { L: id, E: estacion, M: mm });
    }
  }

  if (ef.restriccion) {
    const { idx, m, dur, txt, bloqueaRot, dir } = ef.restriccion;
    const tramo = dir ? limitesTramo(idx) : null;
    const nueva = { id: `r${g.reloj}-${idx}`, idx, m, hasta: g.reloj + dur, txt, bloqueaRot: !!bloqueaRot, dir: dir || null, tramo };
    g.restricciones = [...g.restricciones.filter((x) => x.idx !== idx), nueva];
    // si el punto lo comparten otras líneas, también lo sufren
    propagarRestriccion(g, nueva, (ESTACIONES[idx] || {}).n);

    /* La gente cuenta lo que ve: si es catenaria lo dice, si es una limitación
       de velocidad también. El texto lo elige el propio suceso.        */
    const est2 = ESTACIONES[idx];
    const quePasa = /catenaria|enganch/i.test(txt) ? "catenaria" : /limitaci|velocidad|ltv/i.test(txt) ? "ltv" : null;
    if (quePasa) {
      const cuantos = 1 + Math.floor(Math.random() * (intensidad(g.reloj) > 0.75 ? 5 : 2));
      for (let k = 0; k < cuantos; k++) publicar(g, Math.random() < 0.2 ? "duro" : quePasa, { L: g.linea, E: est2 ? est2.n : "", M: m });
    }
    if (tramo) {
      /* El tramo puede venir de otra línea si la incidencia se encoló allí:
         se resuelve con los nombres que existan, sin dar por hecho ninguno. */
      const ea = ESTACIONES[tramo.a];
      const eb = ESTACIONES[tramo.b];
      if (ea && eb) log(g, "bad", `Vía única entre ${ea.n} y ${eb.n}: los trenes se cruzarán en esas estaciones.`);
    }
    const sentido = dir === "alcala" ? " en sentido Alcalá" : dir === "pio" ? " en sentido Príncipe Pío" : "";
    log(g, "bad", `${txt}: ${m} min de penalización a cada paso${sentido}, hasta las ${hhmm(g.reloj + dur)}.`);
  }
  if (ef.abortarRotacion) {
    const t = T(ef.abortarRotacion);
    if (t && t.rotando) {
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: suspendida la maniobra en ${ESTACIONES[t.rotando.idx].n}. Sigue a cabecera con +${rt(t.retraso)} min.`);
      t.rotando = null;
      t.avisoRot = false;
    }
  }
  if (ef.autorizar) {
    const t = T(ef.autorizar);
    if (t) {
      t.excesoAutorizado = true;
      log(g, "bad", `Tren ${numeroTren(t, g.reloj)}: autorizado a rebasar la conducción continua máxima.`);
    }
  }
  if (ef.relevaReserva) {
    const t = T(ef.relevaReserva.i);
    if (t) {
      t.retenido = false;
      ejecutarRelevo(g, t, ef.relevaReserva.cab, true);
    }
  }
  if (ef.retener) {
    const t = T(ef.retener);
    if (t) {
      t.retenido = ef.cab;
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)} retenido en ${ef.cab} a la espera de relevo.`);
    }
  }
  if (ef.retirarMaq) {
    const m = g.personal.find((x) => x.id === ef.retirarMaq);
    if (m) m.baja = true;
  }
  if (ef.afect) g.kpi.afect += ef.afect;
  if (ef.coste) g.kpi.coste += ef.coste;

  g.cola = g.cola.slice(1);
  if (!g.cola.length) g.marcha = true;

  /* Se guarda lo que acaba de cambiar en la línea sobre la que se ha aplicado.
     Muchos efectos sustituyen el array entero —restricciones, trenes—, y al
     entrar en esa línea el minuto siguiente se recuperaba la versión anterior
     y la decisión del jugador se perdía sin dejar rastro.              */
  guardarLinea(g, g.linea || vistaPrevia);

  // se vuelve a la línea que estaba mirando el jugador
  if (g.linea !== vistaPrevia && g.porLinea && g.porLinea[vistaPrevia]) {
    entrarLinea(g, vistaPrevia);
  }
  return g;
}

/* Acopla o desacopla material aparcado en una vía. Desacoplar deja las dos
   unidades sueltas en la misma vía; acoplar une dos sueltas de la misma serie.
   Lleva unos minutos de maniobra, y solo se hace con material parado.  */
const MIN_MANIOBRA = 8;

function maniobraApartado(g, idx, via, unir) {
  const lista = (g.apartado || {})[idx];
  if (!lista) return g;
  const est = ESTACIONES[idx];
  const donde = est ? est.n : "la estación";

  if (unir) {
    const sueltas = lista.filter((x) => x.via === via && x.unidades.length === 1 && !x.averiado);
    if (sueltas.length < 2) return g;
    const [a, b] = sueltas;
    if (a.unidades[0].serie !== b.unidades[0].serie || !SERIES[a.unidades[0].serie].doble) return g;
    g.apartado[idx] = [
      ...lista.filter((x) => x !== a && x !== b),
      { via, unidades: [...a.unidades, ...b.unidades], desde: g.reloj + MIN_MANIOBRA, averiado: false },
    ];
    log(g, "ok", `Maniobra en ${donde}, ${via}: se acopla ${a.unidades[0].id} con ${b.unidades[0].id}.`);
    return g;
  }

  const doble = lista.find((x) => x.via === via && x.unidades.length > 1 && !x.averiado);
  if (!doble) return g;
  g.apartado[idx] = [
    ...lista.filter((x) => x !== doble),
    ...doble.unidades.map((u) => ({ via, unidades: [u], desde: g.reloj + MIN_MANIOBRA, averiado: false })),
  ];
  log(g, "ok", `Maniobra en ${donde}, ${via}: se desacopla ${doble.unidades.map((u) => u.id).join(" + ")}. Quedan disponibles por separado.`);
  return g;
}

/* Lo que la gente publica en un minuto cualquiera, a partir de lo que está
   pasando de verdad en la línea. El volumen sube con los afectados: se mira
   cuánta gente sufre cada cosa y se sortea en consecuencia.            */
/* Calidad del servicio: lo que sufre el viajero, no lo que marca el reloj. Se
   acumula minuto a minuto y por línea, ponderando cada cosa por la gente que
   la padece. Un retraso de diez minutos con el tren lleno pesa mucho más que
   el mismo retraso con el tren vacío.

   Se guardan los "puntos de sufrimiento" de cada componente y el total de
   viajeros-minuto, para poder sacar la nota al cerrar.                 */
/* Nota de 0 a 100 de una línea. Se reparte el castigo entre los cuatro
   componentes y se resta de cien. Cada uno se normaliza por viajeros-minuto,
   de modo que la nota no dependa del tamaño de la línea: la C-1, con 18.500
   viajeros, se puede comparar con la C-7, que tiene 150.000.           */
function notaCalidad(cal) {
  if (!cal || !cal.viajeros) return { nota: 100, retraso: 0, agobio: 0, material: 0, roto: 0 };
  const v = cal.viajeros;
  /* Escalas calibradas midiendo turnos reales: un turno corriente acumula unos
     9 puntos de retraso por viajero-minuto, 0,26 de agobio y décimas de
     material. Cada componente tiene su tope para que ninguno se coma la nota
     él solo, y el retraso pesa más que el resto porque es lo que más se
     sufre.                                                              */
  const pen = (x, escala, tope) => Math.min(tope, (x / v) * escala);
  const retraso = pen(cal.retraso, 2.3, 45);
  const agobio = pen(cal.agobio, 34, 25);
  const material = pen(cal.material, 90, 20);
  const roto = pen(cal.roto, 900, 25);
  return {
    nota: Math.max(0, Math.round(100 - retraso - agobio - material - roto)),
    retraso: Math.round(retraso),
    agobio: Math.round(agobio),
    material: Math.round(material),
    roto: Math.round(roto),
  };
}

/* Nota general: media de las líneas ponderada por viajeros. Si la C-7 mueve
   ocho veces más gente, su nota debe pesar ocho veces más.             */
function notaGeneral(g) {
  const trozos = Object.entries(g.porLinea || {});
  if (!trozos.length) return notaCalidad(g.cal).nota;
  let suma = 0;
  let peso = 0;
  for (const [, t] of trozos) {
    const v = (t.cal && t.cal.viajeros) || 0;
    if (!v) continue;
    suma += notaCalidad(t.cal).nota * v;
    peso += v;
  }
  return peso ? Math.round(suma / peso) : 100;
}

function calidadDelMinuto(g, r) {
  if (!g.cal) g.cal = { retraso: 0, agobio: 0, material: 0, roto: 0, viajeros: 0 };
  const c = g.cal;

  for (const t of g.trenes) {
    if (t.estado === "suprimido") continue;
    const sv = situacion(t, r);
    if (sv.dir === "maniobra") continue;
    const aBordo = t.pax.reduce((a, b) => a + b, 0);
    if (!aBordo) continue;
    c.viajeros += aBordo;

    // cada minuto de retraso lo sufre toda la gente que va dentro
    if (t.retraso > 2) c.retraso += aBordo * Math.min(t.retraso, 45);

    // ir de pie apretado: pesa desde el 85 % de ocupación
    const plazas = t.unidades.reduce((n, u) => n + u.plazas, 0) || 1;
    const ocup = aBordo / plazas;
    if (ocup > 0.85) c.agobio += aBordo * (ocup - 0.85) * 12;

    // viajar en material degradado
    if (t.climaViciada) c.material += aBordo * 1.2;
    if (t.degradada) c.material += aBordo * 0.8;
    // una avería heredada del turno anterior se sigue sufriendo
    if (t.unidades.some((u) => u.sinReparar)) c.material += aBordo * 0.5;
    // ir por la vía contraria en un tramo banalizado: lento y con parones
    if (enViaContraria(g, t)) c.roto += aBordo * 0.6;
  }

  // quien se queda en el andén sufre el servicio sin ni siquiera viajar
  for (let i = 0; i < N; i++) {
    const a2 = g.andenes[i];
    if (!a2) continue;
    const esperando = a2.alcala + a2.pio;
    if (esperando > 250) c.agobio += (esperando - 250) * 0.5;
  }
}

/* Reacciones a una incidencia concreta. El número de mensajes sube con la
   gente que va dentro del tren y con la hora: la misma avería a las ocho
   genera un aluvión y a las once, dos mensajes.                        */
function reaccionAvería(g, t, motivo, idx) {
  const aBordo = (t.pax || []).reduce((a, b) => a + b, 0);
  const est = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(idx)))];
  const cuantos = Math.min(6, 1 + Math.floor((aBordo / 260) * (intensidad(g.reloj) > 0.75 ? 1.8 : 1)));
  const datos = {
    L: g.linea,
    E: est ? est.n : "",
    M: Math.round(t.retraso),
    T: numeroTren(t, g.reloj),
    D: situacion(t, g.reloj).dir === "alcala" ? ALCALA : PIO,
  };
  for (let k = 0; k < cuantos; k++) publicar(g, Math.random() < 0.2 ? "duro" : motivo, datos);
}

function reaccionesDelMinuto(g, r) {
  const enPunta = intensidad(r) > 0.75;

  for (const t of g.trenes) {
    if (t.estado === "suprimido") continue;
    const sv = situacion(t, r);
    if (sv.dir === "maniobra") continue;
    const aBordo = t.pax.reduce((a, b) => a + b, 0);
    if (aBordo < 40) continue; // un tren casi vacío no genera conversación

    const est = ESTACIONES[Math.max(0, Math.min(N - 1, Math.round(sv.idx)))];
    const datos = { L: g.linea, E: est ? est.n : "", M: t.retraso, T: numeroTren(t, g.reloj) };

    // la queja por retraso escala con los minutos y con la gente que los sufre
    if (t.retraso >= 5) {
      /* La probabilidad se mide contra la ocupación del propio tren, no contra
         una cifra fija: con 900 de referencia, una línea corta como la C-1
         —176 viajeros por tren— no llegaba a publicar nunca, aunque fuera con
         retraso. Lo que enfada es ir apretado y tarde, no el número absoluto. */
      const plazasT = t.unidades.reduce((n2, u) => n2 + u.plazas, 0) || 1;
      const p = Math.min(0.5, (t.retraso / 60) * Math.max(aBordo / 900, (aBordo / plazasT) * 0.45) * (enPunta ? 1.6 : 1));
      if (Math.random() < p) publicar(g, t.retraso >= 20 && Math.random() < 0.45 ? "duro" : "retraso", datos);
    }

    // ir apretado se nota a partir de ocupación alta
    const plazas = t.unidades.reduce((n, u) => n + u.plazas, 0) || 1;
    if (aBordo / plazas > 0.85 && Math.random() < 0.1) publicar(g, "aglomeracion", datos);

    // material degradado: el calor es lo que más se comenta
    if (t.climaViciada && Math.random() < 0.06) publicar(g, "calor", datos);
    if (t.degradada && Math.random() < 0.03) publicar(g, "averia", datos);
    if (enViaContraria(g, t) && Math.random() < 0.04) publicar(g, "vialunica", datos);
  }

  // andenes desbordados: quien no consigue subir también escribe
  for (let i = 0; i < N; i++) {
    const a2 = g.andenes[i];
    if (!a2) continue;
    const esperando = a2.alcala + a2.pio;
    if (esperando > 400 && Math.random() < Math.min(0.25, esperando / 4000))
      publicar(g, "aglomeracion", { L: g.linea, E: ESTACIONES[i].n });
  }
}

/* Publica un mensaje de viajero. El volumen lo decide quien llama, según la
   gente afectada: una avería en Atocha a las ocho genera un aluvión y la misma
   a las once, tres mensajes.                                            */
/* El tope guarda los últimos mensajes. Con varias líneas hace falta margen:
   la C-7 publica cientos y, con un tope corto, los pocos de la C-1 quedaban
   siempre desplazados y su muro salía vacío.                           */
const TOPE_REACCIONES = 400;

function publicar(g, motivo, datos) {
  /* Uno de cada seis mensajes interpela a la cuenta oficial, sea cual sea el
     motivo. Es lo que hace un usuario real cuando ya está harto: deja de
     contarlo al aire y se lo dice a quien puede arreglarlo.            */
  if (motivo !== "bien" && motivo !== "mencion" && Math.random() < 0.17) motivo = "mencion";
  const lista = REACCIONES[motivo];
  if (!lista || !lista.length) return;
  const k = Math.floor(Math.random() * lista.length);
  const pila = PILA_USUARIO[Math.floor(Math.random() * PILA_USUARIO.length)];
  const ape = APELLIDO_USER[Math.floor(Math.random() * APELLIDO_USER.length)];
  const apodo = APODOS[Math.floor(Math.random() * APODOS.length)];

  /* El nombre de la línea lleva artículo: se dice "en la C-7", no "en C-7".
     Se pone aquí y no en cada plantilla para que valga con cualquier línea
     que se añada después. Si la frase empieza por ahí, se capitaliza al
     final.                                                              */
  const texto = lista[k]
    .replace(/\{L\}/g, `la ${datos.L || g.linea || "línea"}`)
    .replace(/\{E\}/g, datos.E || "la estación")
    /* Nunca "0 minutos": al declararse una avería el retraso aún no ha
       crecido, pero quien está dentro ya lleva un rato parado. Se toma un
       mínimo de dos, que es lo que percibe el viajero.                 */
    .replace(/\{M\}/g, datos.M !== undefined ? Math.max(2, Math.round(datos.M)) : 2 + Math.floor(Math.random() * 4))
    .replace(/\{H\}/g, hhmm(g.reloj))
    .replace(/\{T\}/g, datos.T || "tren")
    .replace(/\{D\}/g, datos.D || "");

  /* Limpieza final: una variable sin valor dejaba huecos y dobles espacios
     ("El pantógrafo del  ha enganchado"). Se compactan y se ajusta la
     mayúscula inicial, porque la frase puede empezar por la línea.     */
  const texto2 = texto
    // "de la la C-7": el artículo lo pone la sustitución, no la plantilla
    .replace(/\b(la|el|los|las)\s+la\s+(C-\d)/gi, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .trim();
  const texto3 = texto2.charAt(0).toUpperCase() + texto2.slice(1);

  /* Los alias de verdad tienen formas muy distintas: unos son el nombre y un
     número, otros el apellido entero, otros llevan guión bajo o punto. Con una
     sola fórmula todos los usuarios se parecían entre sí.              */
  const n = pila.toLowerCase();
  const ap = ape.toLowerCase();
  const formas = [
    () => n + apodo,
    () => n + ap,
    () => n + "_" + ap,
    () => n + "." + ap,
    () => n + ap.slice(0, 3) + apodo,
    () => n[0] + ap + apodo,
    () => n + "_" + apodo,
    () => apodo + n,
    () => n + ap[0] + Math.floor(Math.random() * 90 + 10),
    () => n + Math.floor(Math.random() * 9000 + 100),
    () => ap + n[0],
    () => "el" + n,
    () => "la" + n,
    () => n + "de" + apodo,
  ];
  const alias = formas[Math.floor(Math.random() * formas.length)]();
  const msg = {
    id: `${Math.round(g.reloj)}-${g.reacciones ? g.reacciones.length : 0}-${k}`,
    min: g.reloj,
    nombre: `${pila} ${ape}`,
    alias: alias.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    iniciales: (pila[0] + ape[0]).toUpperCase(),
    color: COLOR_AVATAR[(pila.charCodeAt(0) + ape.charCodeAt(0)) % COLOR_AVATAR.length],
    texto: texto3,
    motivo,
    linea: datos.L || g.linea,
    // la indignación se comparte más que el elogio
    likes: motivo === "bien" ? Math.floor(Math.random() * 12) : Math.floor(Math.random() * 90),
    rt: motivo === "bien" ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 25),
  };
  g.reacciones = [...(g.reacciones || []), msg].slice(-TOPE_REACCIONES);
}

function clonar(p) {
  /* El estado de las demás líneas también se copia: si se compartiera, un
     cambio en el turno actual alcanzaría a la partida anterior.        */
  const porLinea = {};
  for (const [id, t] of Object.entries(p.porLinea || {}))
    porLinea[id] = {
      ...t,
      trenes: (t.trenes || []).map((x) => ({ ...x, unidades: (x.unidades || []).map((u) => ({ ...u })), pax: [...(x.pax || [])] })),
      personal: (t.personal || []).map((m) => ({ ...m })),
      andenes: (t.andenes || []).map((a2) => ({ ...a2 })),
      restricciones: (t.restricciones || []).map((x) => ({ ...x })),
    };

  const copia = {
    ...p,
    porLinea,
    trenes: p.trenes.map((t) => ({ ...t, unidades: t.unidades.map((u) => ({ ...u })), pax: [...t.pax], hist: [...t.hist], marchas: [...(t.marchas || [])], cuadroRelevos: [...(t.cuadroRelevos || [])], traza: t.traza || [], acum: { ...t.acum } })),
    personal: p.personal.map((m) => ({ ...m })),
    kpi: { ...p.kpi },
    reserva: p.reserva.map((u) => ({ ...u })),
    cola: [...p.cola],
    restricciones: p.restricciones.map((x) => ({ ...x })),
    reparadas: [...(p.reparadas || [])],
    estad: p.estad
      ? { muestras: p.estad.muestras, suben: p.estad.suben, bajan: p.estad.bajan, esperaMax: p.estad.esperaMax }
      : { muestras: [], suben: new Array(N).fill(0), bajan: new Array(N).fill(0), esperaMax: new Array(N).fill(0) },
    turno: p.turno,
    turnoN: p.turnoN,
    retirada: p.retirada,
    corte: p.corte,
    vacios: p.vacios,
    avisoNoche: p.avisoNoche,
    taller: Object.fromEntries(Object.entries(p.taller).map(([k, v]) => [k, { ...v }])),
    desg: { ...p.desg },
    andenes: p.andenes.map((x) => ({ ...x })),
    apartado: Object.fromEntries(Object.entries(p.apartado).map(([k, v]) => [k, v.map((x) => ({ ...x }))])),
  }

  /* La línea que se está mirando queda copiada dos veces: en el primer nivel y
     dentro de porLinea. Si son copias distintas, lo que se anota en una se
     pierde al entrar en la otra, y era lo que dejaba sin efecto el suavizado
     del retraso: los trenes retrocedían de golpe en vez de aflojar la marcha.
     Se hace que ambas apunten a los mismos objetos.                     */
  const act = p.linea || LINEAS_EN_JUEGO[0];
  if (copia.porLinea[act]) for (const k of CAMPOS_LINEA) copia.porLinea[act][k] = copia[k];

  return copia;;
}

function avanzar(prev, dt) {
  /* La mayoría de los ticks solo mueven el reloj: no hace falta copiar en
     profundidad los trenes, el personal y los andenes de todas las líneas. Con
     varias en juego eso son más de cien objetos por fotograma, y a diecisiete
     fotogramas por segundo es lo que hacía que los trenes se vieran a saltos.
     Solo se clona a fondo cuando de verdad va a transcurrir un minuto.  */
  const hayMinuto = Math.floor(prev.reloj + dt) > prev.ultimoMin;
  let g = hayMinuto ? clonar(prev) : { ...prev };
  g.reloj = prev.reloj + dt;
  let guard = 0;
  while (Math.floor(g.reloj) > g.ultimoMin && guard++ < 90) {
    g.ultimoMin += 1;
    const save = g.reloj;
    g.reloj = g.ultimoMin;
    for (const t of g.trenes) t.rAnt = t.retraso;
    g = minuto(g);
    g.reloj = save;
    if (g.cola.length || g.fin) break;
  }
  return g;
}

/* ── interfaz ───────────────────────────────────────────────── */

const CLIP_BAJA = "polygon(0% 0%, 100% 0%, 100% 68%, 50% 100%, 0% 68%)";
const CLIP_SUBE = "polygon(50% 0%, 100% 32%, 100% 100%, 0% 100%, 0% 32%)";

/* ST guarda copias de los colores en el momento de crearse, así que al cambiar
   de tema hay que rehacerlo. Se construye desde una función para poder
   reconstruirlo sin tocar las referencias que ya existen.                */
function construirST() {
  return {
  wrap: { background: P.ground, color: P.ink, minHeight: "100vh", fontFamily: FUENTE, maxWidth: 540, margin: "0 auto", padding: "14px 14px 40px" },
  /* Sin sombra. La llevaba desde que montamos el sistema de profundidad, y en
     listados de trece o cuarenta y seis tarjetas obliga al navegador a
     componer una capa por tarjeta y repintarlas en cada refresco. El Libro
     iba fino porque solo tiene una. El relieve queda para lo que de verdad
     flota: hojas, desplegables y la barra.                              */
  card: { background: P.surface, borderRadius: R.grande, border: `1px solid ${P.rule}` },
  eyebrow: { fontSize: T.menor, letterSpacing: 1.8, textTransform: "uppercase", color: P.muted, fontWeight: 600 },
  btn: (on) => ({
    flex: 1,
    border: `1px solid ${on ? P.ink : P.rule}`,
    background: on ? P.solido : P.surface,
    color: on ? P.blanco : P.ink,
    borderRadius: R.normal,
    padding: "9px 0",
    fontSize: T.base,
    fontWeight: 600,
    fontFamily: MONO,
    cursor: "pointer",
  }),
  };
}

const ST = construirST();

/* Cambio de tema: se sustituye el contenido de la paleta y se rehacen los
   estilos compartidos. Quien dibuje después leerá ya los valores nuevos. */
function aplicarTema(oscuro) {
  Object.assign(P, oscuro ? OSCURO : CLARO);
  /* El rojo de marca se queda en 3,5:1 sobre el fondo oscuro: vale para el
     trazado del mapa, pero es justo para texto. En oscuro se aclara. */
  COLOR.rojo = oscuro ? "#F0464D" : "#D7282F";
  LIN[LINEA] = COLOR.rojo;
  Object.assign(ST, construirST());
  if (typeof document !== "undefined") {
    document.body.style.background = P.ground;
    document.documentElement.style.colorScheme = oscuro ? "dark" : "light";
  }
}

export default function CGOC7() {
  const [asig, setAsig] = useState(initAsignacion);
  const [g, setG] = useState(null);
  const [tab, setTab] = useState("trenes");

  const [detalle, setDetalle] = useState(true);
  const [rotarDe, setRotarDe] = useState(null);
  const [apartarDe, setApartarDe] = useState(null);
  const [suprimirDe, setSuprimirDe] = useState(null);
  const [reponerDe, setReponerDe] = useState(null);
  const [apartaderoDe, setApartaderoDe] = useState(null);
  const [vacioDe, setVacioDe] = useState(null);
  const [focoTren, setFocoTren] = useState(null); // tren al que ir en el mapa
  // 'aviso' ya nombra la incidencia en curso, así que este va aparte
  const [confirmacion, setConfirmacion] = useState(null);

  // la confirmación de guardado se retira sola pasados unos segundos
  useEffect(() => {
    if (!confirmacion) return;
    const id = setTimeout(() => setConfirmacion(null), 3200);
    return () => clearTimeout(id);
  }, [confirmacion]);
  const [cerrarPartida, setCerrarPartida] = useState(false);
  const [ajustes, setAjustes] = useState(false);

  /* Cuando una decisión deja un tren pendiente de saber dónde se aparta, se
     abre el selector en el acto. Antes había que ir a la lista de trenes y
     encontrar el botón, así que en la práctica no se elegía nada.       */
  useEffect(() => {
    if (!g || g.pedirDestino === null || g.pedirDestino === undefined) return;
    const i = g.pedirDestino;
    // el reloj se para igual que con una incidencia: es una decisión, no un aviso
    setG((p) => (p ? { ...p, pedirDestino: null, marcha: false } : p));
    setApartaderoDe(i);
  }, [g && g.pedirDestino]);
  const [analisis, setAnalisis] = useState(false);
  const [calidad, setCalidad] = useState(false);
  // mensajes publicados desde la última vez que se abrió la pantalla
  const [leidos, setLeidos] = useState(0);
  const sinLeer = Math.max(0, ((g && g.reacciones) || []).length - leidos);

  /* Las constantes globales —estaciones, extremos, ciclo— pertenecen a la
     línea que el motor fijó por última vez. Si el estado que se va a dibujar
     es de otra, hay que fijarla antes: si no, se pintan las estaciones de una
     línea con los andenes de otra y falla al leer datos que no existen. */
  if (g && g.linea && g.linea !== LINEA) fijarLinea(g.linea);
  /* Modo de pruebas: interruptor en Ajustes. Permite lanzar cualquier
     incidencia con el grado que se quiera. Al activarlo, el turno deja de
     guardarse y no toca la campaña: se descarta al salir.               */
  const [pruebas, setPruebas] = useState(false);
  /* El tema sigue al sistema salvo que se elija a mano. Se guarda aparte de la
     partida: es una preferencia del jugador, no del turno.              */
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem("cgo:tema") || "auto";
    } catch (e) {
      return "auto";
    }
  });
  /* Al elegir tema se guarda la preferencia y se aplica. En automático se
     escucha al sistema, para que el juego cambie si el móvil pasa a modo
     nocturno a media partida.                                           */
  const [, repintar] = useState(0);
  useEffect(() => {
    try {
      localStorage.setItem("cgo:tema", tema);
    } catch (e) {
      /* si no se puede guardar, el tema dura lo que la sesión */
    }
    const consulta = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const resolver = () => {
      aplicarTema(tema === "oscuro" || (tema === "auto" && !!consulta && consulta.matches));
      repintar((n) => n + 1);
    };
    resolver();
    if (tema !== "auto" || !consulta) return;
    consulta.addEventListener("change", resolver);
    return () => consulta.removeEventListener("change", resolver);
  }, [tema]);
  const [unidadSel, setUnidadSel] = useState(null);
  const [tallerAbierto, setTallerAbierto] = useState(null);
  const [gestionUd, setGestionUd] = useState(null);
  const [estSel, setEstSel] = useState(null);
  const [trenSel, setTrenSel] = useState(null);
  const [volverA, setVolverA] = useState(null); // pantalla de la que se vino
  const [slotSel, setSlotSel] = useState(null);
  const [pantalla, setPantalla] = useState("portada");

  /* Al cambiar de pantalla o de pestaña se sube arriba del todo. Sin esto,
     al pasar de la propuesta de taller al puesto de mando la vista se quedaba
     a la altura en la que estaba y aparecías a media pantalla.           */
  /* Al cambiar de pantalla o pestaña se sube arriba del todo, salvo cuando se
     viene de pulsar la flecha de un tren: ahí manda el desplazamiento hasta su
     posición. Se usa una marca de un solo uso en vez de mirar el foco, porque
     al borrarse el aviso el efecto volvía a dispararse y devolvía la vista al
     principio justo después de haber llegado al tren.                     */
  const saltarSubida = useRef(false);
  useEffect(() => {
    if (saltarSubida.current) {
      saltarSubida.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    // el arranque del turno también cuenta: al abrirlo no cambia ni la pantalla
    // ni la pestaña, solo aparece la partida, y la vista se quedaba a la altura
    // en la que estuviera la asignación de material
  }, [pantalla, tab, trenSel, estSel, unidadSel, !!g]);
  const [camp, setCamp] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modo, setModo] = useState("campana");

  // se recupera la campaña guardada, y el turno si había uno a medias
  useEffect(() => {
    let vivo = true;
    const partida = cargarPartida();
    if (partida && partida.g) {
      fijarTurno(partida.turno || partida.g.turno);
      setG(partida.g);
      setModo(partida.modo || "campana");
      setTab(partida.tab || "trenes");
      setPantalla("asignacion"); // ya hay partida: se dibuja el puesto de mando
    }
    cargarCampana().then((c) => {
      if (!vivo) return;
      setCamp(c);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  /* Guardado periódico. Estaba planteado con una espera de 1,2 s que se
     cancelaba en cada tick del reloj: como el estado cambia cada medio
     segundo, la espera no llegaba a cumplirse nunca y la partida no se
     guardaba sola mientras se jugaba. Ahora se mira el tiempo transcurrido,
     que no depende del ritmo de la simulación.                          */
  /* El guardado escribe unos 31 KB en el almacenamiento del navegador, y esa
     escritura es SÍNCRONA: bloquea el hilo mientras dura. Estaba enganchada al
     cambio de pestaña, así que cada vez que se pulsaba un menú se pagaba la
     escritura. Ahora va por su cuenta, con su propio reloj.             */
  // en pruebas no se guarda nada: el turno se descarta al salir
  const estadoVivo = useRef(null);
  estadoVivo.current = { g, modo, tab };
  useEffect(() => {
    const iv = setInterval(() => {
      const v = estadoVivo.current;
      if (v && v.g && !pruebas) guardarPartida(v.g, v.modo, v.tab);
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!g || !g.marcha || g.fin || g.cola.length) return;
    /* El ritmo de refresco se adapta a lo que hay en pantalla. En el mapa los
       trenes se desplazan y hace falta un paso fino; en Trenes y Personal no
       se mueve nada de forma continua, y refrescar cientos de elementos varias
       veces por segundo dejaba el hilo ocupado: cada toque esperaba a que
       terminara el redibujado y el cambio de menú se notaba lento.       */
    /* En el mapa hace falta paso fino para que los trenes no vayan a saltos.
       Y cuanto más corta es la línea, más deprisa cruzan la pantalla: una
       circulación de la C-1 recorre el mapa entero en quince minutos, así que
       necesita todavía más fotogramas que la C-7 para verse fluida.    */
    const enMapa = tab === "mapa";
    const paso = enMapa ? 60 : g.vel >= 10 ? 100 : 500;
    const iv = setInterval(() => setG((p) => (p && p.marcha && !p.cola.length && !p.fin ? avanzar(p, (paso / 1000) * p.vel) : p)), paso);
    return () => clearInterval(iv);
  }, [g && g.marcha, g && g.vel, g && g.fin, g && g.cola.length, tab]);

  if (pantalla === "portada")
    return (
      <Portada
        camp={camp}
        cargando={cargando}
        elegir={(m) => {
          // cargar entra directo a la partida guardada, sin pasar por el menú
          if (m === "cargar" && camp) {
            setModo("campana");
            fijarTurno(camp.turno);
            setAsig(camp.slots ? { slots: camp.slots, apart: {} } : initAsignacion());
            setPantalla("asignacion");
            return;
          }
          setModo(m);
          setPantalla("seleccion");
        }}
      />
    );

  if (pantalla === "seleccion")
    return (
      <Seleccion
        modo={modo}
        camp={camp}
        cargando={cargando}
        atras={() => setPantalla("portada")}
        nueva={() => {
          const c = campanaNueva();
          setCamp(c);
          borrarCampana();
          borrarPartida();
          fijarTurno(c.turno);
          setAsig(initAsignacion());
          setPantalla("asignacion");
        }}
        empezar={(idTurno, lineasElegidas) => {
          // las líneas elegidas mandan sobre las de por defecto
          if (lineasElegidas && lineasElegidas.length) LINEAS_EN_JUEGO = [...lineasElegidas];
          fijarLinea(LINEAS_EN_JUEGO[0]); // el material se propone para la línea principal
          if (modo === "rapida") {
            fijarTurno(idTurno);
            setAsig(idTurno === "manana" ? initAsignacion() : propuestaTaller(null));
          } else {
            const c = camp || campanaNueva();
            if (!camp) setCamp(c);
            fijarTurno(c.turno);
            setAsig(c.slots ? { slots: c.slots, apart: {} } : initAsignacion());
          }
          setPantalla("asignacion");
        }}
      />
    );

  if (!g && TURNO_ID !== "manana") {
    return <Relevo asig={asig} camp={modo === "campana" ? camp : null} empezar={() => setG(comenzarTurno(asig.slots, asig.apart, modo === "campana" ? camp : null))} />;
  }

  if (!g) {
    return (
      <Asignacion
        asig={asig}
        setAsig={setAsig}
        slotSel={slotSel}
        setSlotSel={setSlotSel}
        camp={modo === "campana" ? camp : null}
        empezar={() => setG(comenzarTurno(asig.slots, asig.apart, modo === "campana" ? camp : null))}
      />
    );
  }

  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const activos = g.trenes.filter((t) => t.estado !== "suprimido");
  const aviso = g.cola[0];

  if (g.fin) {
    const b = balanceTurno(g);
    const pts = puntosTurno(g);
    /* Cinco niveles en vez de tres, y no solo por puntualidad: entran también
       las circulaciones que llegan enteras y la proporción de afectados.  */
    const nota =
      pts >= 1050 ? "Turno impecable" : pts >= 900 ? "Turno notable" : pts >= 720 ? "Turno correcto" : pts >= 520 ? "Turno justo" : "Turno para revisar";
    const media = modo === "campana" && camp && camp.acum.turnos ? camp.acum.puntos / camp.acum.turnos : null;
    const dif = media === null ? null : Math.round(pts - media);

    return (
      <div style={ST.wrap}>
        <Fonts />
        <div style={ST.eyebrow}>Relevo de turno · {hhmm(FIN)}</div>

        {/* la puntuación es lo que resume el turno: va primero y grande */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "4px 0 2px" }}>
          <span style={{ fontSize: T.cartel, fontWeight: 800, letterSpacing: -2, fontFamily: MONO, color: pts >= 900 ? P.ok : pts >= 720 ? P.ink : pts >= 520 ? P.warn : P.alert }}>
            {nf(pts)}
          </span>
          <span style={{ fontSize: T.base, color: P.muted }}>puntos</span>
        </div>
        <h1 style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.6, margin: "0 0 4px" }}>{nota}</h1>
        {dif !== null && (
          <div style={{ fontSize: T.base, color: dif >= 0 ? P.ok : P.alert, marginBottom: 16 }}>
            {dif >= 0 ? "+" : ""}
            {nf(dif)} respecto a tu media de campaña
          </div>
        )}
        {dif === null && <div style={{ height: 16 }} />}

        {/* lo que cuenta el turno: viajeros llevados y cómo se les trató */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Kpi k="Viajeros transportados" v={nf(b.transportados)} c={P.ink} />
          <Kpi k="Puntualidad" v={`${b.punt.toFixed(1)}%`} c={colPuntualidad(b.punt)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Kpi k="Retraso medio" v={`${b.retrasoMedio.toFixed(1)}′`} c={colRetrasoMedio(b.retrasoMedio)} small />
          <Kpi k="Ocupación media" v={`${b.ocupMedia.toFixed(0)}%`} c={colOcupacion(b.ocupMedia)} small />
          <Kpi k="Circulaciones" v={`${b.completas}/${CIRCULACIONES}`} c={b.completas === CIRCULACIONES ? P.ok : P.warn} small />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <Kpi k="Afectados" v={`${nf(b.afect)}`} c={nivelCol(b.tasaAfect, 5, 15)} small />
          <Kpi k="Coste extra" v={`${(b.coste / 1000).toFixed(1)}k €`} c={P.ink} small />
          <Kpi k="Incidencias" v={String(b.incidencias)} c={P.ink} small />
        </div>

        {/* el peor momento del turno, que las medias esconden */}
        {b.picoRetraso > 3 && (
          <div style={{ ...ST.card, padding: 12, marginBottom: 12, fontSize: T.base, lineHeight: 1.5 }}>
            Tu peor momento fueron las <strong>{hhmm(b.horaPico)}</strong>, con {b.picoRetraso.toFixed(0)} min de retraso medio.
            {b.minutosApuro > 0 && ` Hubo trenes detenidos o retenidos durante ${b.minutosApuro} min del turno.`}
            {b.tasaAfect > 0 && ` ${b.tasaAfect.toFixed(1)} de cada 100 viajeros se vieron afectados.`}
          </div>
        )}

        <div style={{ ...ST.card, padding: 12, maxHeight: 280, overflowY: "auto" }}>
          <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Incidencias del turno</div>
          {g.log.filter((l) => l.k === "bad" || l.k === "aviso").map((l, i) => (
            <div key={i} style={{ fontSize: T.base, marginBottom: 4, display: "flex", gap: 8 }}>
              <span style={{ color: P.muted, fontFamily: MONO }}>{hhmm(l.m)}</span>
              <span style={{ color: l.k === "bad" ? P.alert : P.warn }}>{l.t}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            if (modo === "campana" && !pruebas) {
              // el turno se cierra y todo pasa al siguiente: material, desgaste y taller
              const sig = estadoTrasTurno(g, camp || campanaNueva());
              setCamp(sig);
              guardarCampana(sig);
              fijarTurno(sig.turno);
              setAsig({ slots: sig.slots, apart: {} });
            } else {
              setAsig(initAsignacion());
            }
            borrarPartida(); // el turno ya está cerrado: no hay que reanudarlo
            setG(null);
            setPantalla(modo === "campana" ? "asignacion" : "portada");
          }}
          style={{ ...ST.btn(true), width: "100%", marginTop: 12, padding: "14px 0", fontSize: T.alto }}
        >
          {modo === "campana" ? "Cerrar turno y continuar" : "Terminar partida"}
        </button>
      </div>
    );
  }

  return (
    <div style={ST.wrap}>
      <Fonts />
      {/* la barra fija hace de cabecera: el resto de la pantalla scrollea bajo ella */}
      {/* datos arriba, mando abajo: se mira arriba y se toca abajo */}
      <BarraDatos g={g} />
      <div style={{ height: "calc(42px + env(safe-area-inset-top))" }} />

      <BarraMando g={g} setG={setG} tab={tab} setTab={setTab} setAjustes={setAjustes} setAnalisis={setAnalisis} setCalidad={setCalidad} sinLeer={sinLeer} />

      {tab === "trenes" && <Trenes g={g} verEnMapa={(n) => { saltarSubida.current = true; setFocoTren(n); setTab("mapa"); }} setRotarDe={setRotarDe} setTrenSel={setTrenSel} setVolverA={setVolverA} setApartarDe={setApartarDe} setSuprimirDe={setSuprimirDe} setReponerDe={setReponerDe} setApartaderoDe={setApartaderoDe} setUnidadSel={setUnidadSel} />}
      {tab === "personal" && <Personal g={g} />}
      {tab === "taller" && (
        <Taller
          g={g}
          setG={setG}
          abierto={tallerAbierto}
          setAbierto={setTallerAbierto}
          setG={setG}
          setGestion={setGestionUd}
          verUnidad={(id) => {
            setVolverA(null);
            setUnidadSel(id);
          }}
        />
      )}
      {tab === "mapa" && (
        <Mapa g={g} detalle={detalle} setDetalle={setDetalle} setEstSel={setEstSel} setTrenSel={setTrenSel} setVolverA={setVolverA} foco={focoTren} setFoco={setFocoTren} />
      )}
      {tab === "libro" && <Libro g={g} />}

      {/* hueco para que la barra de mando no tape el final del contenido:
          70 px de barra más la franja de gestos del móvil */}
      <div style={{ height: "calc(78px + env(safe-area-inset-bottom))" }} />

      {rotarDe !== null && <SelectorRotacion g={g} setG={setG} i={rotarDe} close={() => setRotarDe(null)} />}
      {apartarDe !== null && <SelectorApartado g={g} setG={setG} i={apartarDe} close={() => setApartarDe(null)} />}
      {suprimirDe !== null && <SelectorSupresion g={g} setG={setG} i={suprimirDe} close={() => setSuprimirDe(null)} />}
      {reponerDe !== null && <SelectorReposicion g={g} setG={setG} i={reponerDe} close={() => setReponerDe(null)} />}
      {apartaderoDe !== null && (
        <SelectorApartadero
          g={g}
          setG={setG}
          i={apartaderoDe}
          close={() => {
            setApartaderoDe(null);
            // se reanuda al decidir, igual que al resolver una incidencia
            setG((p) => (p && !p.cola.length && !p.fin ? { ...p, marcha: true } : p));
          }}
        />
      )}
      {/* confirmación breve tras guardar, sin interrumpir la partida */}
      {confirmacion && (
        <div
          onClick={() => setConfirmacion(null)}
          style={{ position: "fixed", left: 0, right: 0, bottom: 96, display: "flex", justifyContent: "center", zIndex: 60, pointerEvents: "auto" }}
        >
          <div style={{ ...ST.card, boxShadow: SOMBRA.elevado, padding: "10px 16px", maxWidth: 460, margin: "0 12px", fontSize: T.base, lineHeight: 1.4 }}>{confirmacion}</div>
        </div>
      )}

      {/* Análisis: pantalla completa, porque los gráficos necesitan el alto
          entero y se consultan con calma, no de reojo.                  */}
      {analisis && (
        <div style={{ position: "fixed", inset: 0, background: P.ground, zIndex: 71, overflowY: "auto", animation: "cgo-fondo .18s ease-out" }}>
          <div style={{ maxWidth: 540, margin: "0 auto", padding: "calc(12px + env(safe-area-inset-top)) 12px calc(24px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={ST.eyebrow}>Análisis del turno</div>
                <h1 style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.6, margin: "4px 0 0" }}>
                  {g.turnoN} · {hhmm(INICIO)} a {hhmm(g.reloj)}
                </h1>
              </div>
              <button
                onClick={() => setAnalisis(false)}
                style={{ border: `1px solid ${P.rule}`, background: P.surface, color: P.ink, borderRadius: R.normal, padding: "7px 12px", fontFamily: "inherit", fontSize: T.aux, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
              >
                Cerrar
              </button>
            </div>
            <Analisis g={g} camp={modo === "campana" ? camp : null} />
          </div>
        </div>
      )}

      {/* Calidad del servicio: la nota del turno y lo que publican los
          viajeros. Misma envoltura que el análisis.                    */}
      {calidad && (
        <div style={{ position: "fixed", inset: 0, background: P.ground, zIndex: 71, overflowY: "auto", animation: "cgo-fondo .18s ease-out" }}>
          <div style={{ maxWidth: 540, margin: "0 auto", padding: "calc(12px + env(safe-area-inset-top)) 12px calc(24px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={ST.eyebrow}>Calidad del servicio</div>
                <h1 style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.6, margin: "4px 0 0" }}>
                  {g.turnoN} · {hhmm(INICIO)} a {hhmm(g.reloj)}
                </h1>
              </div>
              <button
                onClick={() => {
                  setCalidad(false);
                  setLeidos((g.reacciones || []).length);
                }}
                style={{ border: `1px solid ${P.rule}`, background: P.surface, color: P.ink, borderRadius: R.normal, padding: "7px 12px", fontFamily: "inherit", fontSize: T.aux, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
              >
                Cerrar
              </button>
            </div>
            <Calidad g={g} camp={modo === "campana" ? camp : null} />
          </div>
        </div>
      )}

      {/* Ajustes. De momento el tema y las dos acciones de partida; es el sitio
          natural para lo que vaya surgiendo.                            */}
      {ajustes && (
        <div
          onClick={() => setAjustes(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 69 }}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            style={{ background: P.surface, width: "100%", maxWidth: 540, borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}
          >
            <Asa close={() => setAjustes(false)} />
            <div style={ST.eyebrow}>Ajustes</div>
            <h2 style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.5, margin: "4px 0 16px" }}>Preferencias y partida</h2>

            <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Aspecto</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[
                { k: "auto", l: "Automático" },
                { k: "claro", l: "Diurno" },
                { k: "oscuro", l: "Nocturno" },
              ].map((o) => (
                <button
                  key={o.k}
                  onClick={() => setTema(o.k)}
                  style={{
                    flex: 1,
                    background: tema === o.k ? P.solido : P.surface,
                    color: tema === o.k ? P.blanco : P.ink,
                    border: `1px solid ${tema === o.k ? P.ink : P.rule}`,
                    borderRadius: R.normal,
                    padding: 12,
                    fontFamily: "inherit",
                    fontSize: T.base,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: -14, marginBottom: 20, lineHeight: 1.45 }}>
              En automático sigue lo que tenga configurado el dispositivo.
            </div>

            {/* Modo de pruebas: apagado por defecto. Al encenderlo, este turno
                queda descartado y no se guarda nada.                    */}
            <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Pruebas</div>
            <button
              onClick={() => setPruebas(!pruebas)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: pruebas ? P.info : P.surface,
                color: pruebas ? P.blanco : P.ink,
                border: `1px solid ${pruebas ? P.info : P.rule}`,
                borderRadius: R.normal,
                padding: 12,
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: T.base,
                cursor: "pointer",
                marginBottom: 8,
                textAlign: "left",
              }}
            >
              <span style={{ width: 34, height: 20, borderRadius: R.pastilla, background: pruebas ? P.blanco : P.rule, flexShrink: 0, position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: pruebas ? 17 : 3,
                    width: 14,
                    height: 14,
                    borderRadius: R.pastilla,
                    background: pruebas ? P.info : P.surface,
                    transition: "left .18s ease-out",
                  }}
                />
              </span>
              Lanzar incidencias a voluntad
            </button>
            <div style={{ fontSize: T.aux, color: P.muted, lineHeight: 1.45, marginBottom: pruebas ? 12 : 20 }}>
              {pruebas
                ? "Este turno ya no se guardará ni contará para la campaña. Al salir se descarta."
                : "Permite provocar cualquier incidencia para verla en juego. El turno en el que se active no cuenta."}
            </div>

            {pruebas && (
              <>
                <PanelPruebas
                  g={g}
                  lanzar={(fam, av, gr, tren) => {
                    setG((p) => {
                      const n = clonar(p);
                      const inc = lanzarPrueba(n, fam, av, gr, tren);
                      if (inc) {
                        n.cola = [...n.cola, inc];
                        n.marcha = false;
                      }
                      return n;
                    });
                    setAjustes(false);
                  }}
                />
              </>
            )}

            <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Partida</div>
            <button
              onClick={() => {
                guardarPartida(g, modo, tab);
                setAjustes(false);
                setConfirmacion("Turno guardado. Puedes cerrar la aplicación y retomarlo donde lo dejaste.");
              }}
              style={{ width: "100%", background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: T.base, cursor: "pointer", marginBottom: 8 }}
            >
              Guardar partida
            </button>
            <button
              onClick={() => {
                setAjustes(false);
                setCerrarPartida(true);
              }}
              style={{ width: "100%", background: P.surface, color: P.alert, border: `1px solid ${P.alert}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: T.base, cursor: "pointer" }}
            >
              Salir de la partida
            </button>
          </div>
        </div>
      )}

      {/* cerrar abandona el turno: se pregunta antes, porque no tiene vuelta */}
      {cerrarPartida && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.5)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 70 }}>
          <div style={{ ...ST.card, padding: 16, maxWidth: 420, width: "100%", boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
            <div style={ST.eyebrow}>Cerrar partida</div>
            <h2 style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.5, margin: "4px 0 8px" }}>¿Abandonar el turno en curso?</h2>
            <p style={{ fontSize: T.base, color: P.muted, lineHeight: 1.5, marginTop: 0 }}>
              El turno se perderá y volverás a la portada. La campaña guardada se conserva: podrás retomarla desde el último turno cerrado.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setCerrarPartida(false)}
                style={{ flex: 1, background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: T.base, cursor: "pointer" }}
              >
                Seguir jugando
              </button>
              <button
                onClick={() => {
                  borrarPartida();
                  setCerrarPartida(false);
                  setG(null);
                  setPantalla("portada");
                }}
                style={{ flex: 1, background: P.alert, color: P.blanco, border: "none", borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: T.base, cursor: "pointer" }}
              >
                Cerrar partida
              </button>
            </div>
          </div>
        </div>
      )}

      {vacioDe && <SelectorVacio g={g} setG={setG} idx={vacioDe.idx} via={vacioDe.via} close={() => setVacioDe(null)} />}

      {gestionUd && <SelectorTaller g={g} setG={setG} id={gestionUd} close={() => setGestionUd(null)} />}

      {unidadSel && (
        <PerfilUnidad
          g={g}
          camp={modo === "campana" ? camp : null}
          id={unidadSel}
          close={() => {
            setUnidadSel(null);
            setVolverA(null);
          }}
          volverA={volverA}
          volver={() => {
            setUnidadSel(null);
            if (volverA && volverA.tipo === "tren") setTrenSel(volverA.i);
            if (volverA && volverA.tipo === "estacion") setEstSel(volverA.i);
            setVolverA(null);
          }}
          gestionar={(uid) => {
            setUnidadSel(null);
            setGestionUd(uid);
          }}
          verTaller={(dep) => {
            setUnidadSel(null);
            setVolverA(null);
            setTallerAbierto(dep);
            setTab("taller");
          }}
        />
      )}
      {estSel !== null && (
        <PerfilEstacion
          g={g}
          i={estSel}
          close={() => setEstSel(null)}
          verTren={(n) => {
            setVolverA({ tipo: "estacion", i: estSel, nombre: ESTACIONES[estSel].n });
            setEstSel(null);
            setTrenSel(n);
          }}
          moverVacio={(via) => {
            setVacioDe({ idx: estSel, via });
            setEstSel(null);
          }}
          maniobrar={(idx, via, unir) => setG((p2) => maniobraApartado(clonar(p2), idx, via, unir))}
        />
      )}
      {trenSel !== null && (
        <PerfilTren
          g={g}
          i={trenSel}
          close={() => {
            setTrenSel(null);
            setVolverA(null);
          }}
          setRotarDe={setRotarDe}
          setApartarDe={setApartarDe}
          setSuprimirDe={setSuprimirDe}
          setReponerDe={setReponerDe}
          verUnidad={(id) => {
            setVolverA({ tipo: "tren", i: trenSel, nombre: `circulación ${trenSel}` });
            setTrenSel(null);
            setUnidadSel(id);
          }}
          volverA={volverA}
          volver={() => {
            setTrenSel(null);
            if (volverA && volverA.tipo === "estacion") setEstSel(volverA.i);
            setVolverA(null);
          }}
        />
      )}

      {aviso && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.5)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 70 }}>
          {(() => {
            const gr = GRADOS[aviso.grav] || GRADOS.grave;
            return (
              <div
                style={{
                  background: P.surface,
                  /* Sin borde de color: la cabecera ya lleva el color y un filete
                     claro alrededor solo ensuciaba el contorno.          */
                  border: `1px solid ${P.rule}`,
                  borderRadius: R.grande,
                  overflow: "hidden",
                  maxWidth: 460,
                  width: "100%",
                  maxHeight: "88vh",
                  overflowY: "auto",
                  boxShadow: SOMBRA.hoja,
                  animation: "cgo-hoja .22s ease-out",
                }}
              >
                {/* Cabecera maciza del color de la gravedad: qué, cuándo y dónde
                    en una sola línea, antes de leer una palabra del relato. */}
                <div style={{ background: gr.franja(), padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: T.menor, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700, color: P.blanco }}>
                  {/* pastilla de cada línea afectada: con varias en juego hay
                      que saber de quién es la incidencia de un vistazo */}
                  {LINEAS_EN_JUEGO.length > 1 &&
                    lineasAfectadas(g, aviso).map((id) => (
                      <span
                        key={id}
                        style={{
                          // color propio de la línea, con el número en blanco
                          background: LIN[id],
                          color: P.blanco,
                          border: `1px solid ${P.blanco}`,
                          borderRadius: R.menudo,
                          padding: "1px 5px",
                          fontSize: T.micro,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          flexShrink: 0,
                        }}
                      >
                        {id}
                      </span>
                    ))}
                  <span style={{ flexShrink: 0 }}>{aviso.tipo === "inc" ? gr.n : "Requiere decisión"}</span>
                  <span style={{ opacity: 0.55 }}>·</span>
                  <span style={{ fontFamily: MONO, letterSpacing: 0.4, flexShrink: 0 }}>{hhmm(g.reloj)}</span>
                  {aviso.lugar && (
                    <>
                      <span style={{ opacity: 0.55 }}>·</span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{aviso.lugar}</span>
                    </>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  {/* Título con el mismo estilo de titular que el resto del
                      juego: cuerpo de título, grosor 700 y el interletrado
                      cerrado que usan las demás pantallas.               */}
                  <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, margin: 0 }}>{aviso.titulo}</div>

                  {/* Subtítulo: los datos del material, en caja alta y pequeño,
                      justo debajo del título.                            */}
                  {aviso.datos && (
                    <div style={{ ...ST.eyebrow, letterSpacing: 0.9, marginTop: 4 }}>
                      {aviso.datos.map((d, k) => (
                        <span key={d.k}>
                          {k > 0 && <span style={{ opacity: 0.5 }}> · </span>}
                          {d.k === "Unidad" ? d.v : `${d.k} ${d.v}`}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: T.alto, color: P.ink, lineHeight: 1.55, margin: "12px 0 16px", whiteSpace: "pre-line" }}>{aviso.texto}</div>

                  {/* Aviso expreso cuando el corte alcanza a otras líneas: la
                      decisión que se tome les afecta también.           */}
                  {(() => {
                    const afectadas = lineasAfectadas(g, aviso);
                    if (afectadas.length < 2) return null;
                    const otras = afectadas.slice(1);
                    return (
                      <div style={{ ...ST.card, background: P.sunken, padding: "9px 11px", marginBottom: 16, fontSize: T.base, color: P.ink, lineHeight: 1.45 }}>
                        Afecta también a {otras.map((id) => <strong key={id} style={{ color: LIN[id] }}>{id}</strong>).reduce((a2, b2) => [a2, " y ", b2])}, que
                        {otras.length > 1 ? " pasan" : " pasa"} por este punto.
                      </div>
                    );
                  })()}

                  <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Decisión</div>
                  {aviso.opciones.map((o, i) => {
                    const prev = previsionOpcion(o);
                    return (
                      <button
                        key={i}
                        onClick={() => setG((p) => aplicar(clonar(p), o.ef))}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: P.surface,
                          border: `1px solid ${P.rule}`,
                          // filete del color de la gravedad: marca que es la vía de salida
                          borderLeft: `3px solid ${gr.col()}`,
                          borderRadius: R.normal,
                          padding: "12px 13px",
                          marginBottom: 8,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          color: P.ink,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: T.alto, fontWeight: 700, flex: 1, minWidth: 0, letterSpacing: -0.2 }}>{o.label}</span>
                          {/* la previsión siempre visible: es lo que decide */}
                          {prev && (
                            <span style={{ fontSize: T.micro, fontWeight: 700, fontFamily: MONO, color: P.blanco, background: gr.franja(), borderRadius: R.menudo, padding: "3px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {prev}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: T.base, color: P.muted, marginTop: 4, lineHeight: 1.45 }}>{o.detalle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ── portada ────────────────────────────────────────────────── */

/* ── portada ────────────────────────────────────────────────────
   Dos pasos: primero se elige el modo de juego, después la línea y,
   si procede, el turno. Así la portada no pide nada que dependa del
   modo antes de saber cuál se va a jugar.                          */

/* ── portada ────────────────────────────────────────────────────
   Pantalla de inicio: identidad de la línea, elección de modo de
   juego y resumen de lo que ofrece el simulador.                 */
/* ── portada ────────────────────────────────────────────────────
   Pantalla de inicio. Sigue la maqueta: banda roja en cuña con la
   marca, cabecera con la escena de la línea, pestaña angulada de
   modo de juego, dos tarjetas con marca de agua, franja de rasgos
   y pie con el perfil de la ciudad.                              */

/* Paleta de la portada. Estaba escrita a mano por todo el componente, con
   dieciséis tonos sueltos que nadie podía ajustar sin buscarlos uno a uno. */
const PORT = {
  azul: "#0E2038",
  azulOsc: "#0A1B2E",
  rojo: "#D7282F",
  rojoOsc: "#A81D22",
  texto: "#33475C", // sobre fondo claro
  textoSuave: "#4C6076",
  rotulo: "#54687E", // versalitas de sección
  apagado: "#78899C", // pies y apostillas
  claro: "#B9C9D8", // texto sobre fondo oscuro
  claroSuave: "#8FA6BC",
  linea: "#D4DDE5", // separadores sobre claro
  lineaOsc: "#2A4059", // separadores sobre oscuro
  fondo: "#E9EDF1",
  fondoSuave: "#F1F5F8",
  fondoTenue: "#F3F6F8",
  trazo: "#C9D3DC", // marca de agua del andén
  trazoOsc: "#17324B", // marca de agua de la sala de control
  perfil: "#24425F", // silueta de la ciudad
};

const AZUL = PORT.azul;
const AZUL_OSC = PORT.azulOsc;
const ROJO_CM = PORT.rojo;
const ROJO_OSC = PORT.rojoOsc;

function IconoPortada({ tipo, c = P.blanco, t = 22, grosor = 2 }) {
  const p = { fill: "none", stroke: c, strokeWidth: grosor, strokeLinecap: "round", strokeLinejoin: "round" };
  const svg = (hijos) => (
    <svg width={t} height={t} viewBox="0 0 24 24" style={{ display: "block" }}>
      {hijos}
    </svg>
  );
  if (tipo === "crono")
    return svg(
      <>
        <circle cx="12" cy="13.5" r="7.6" {...p} />
        <path d="M12 13.5V9.4M9.4 2.6h5.2M18.6 6.9l1.5-1.5" {...p} />
      </>
    );
  if (tipo === "calendario")
    return svg(
      <>
        <rect x="3.4" y="5" width="17.2" height="16" rx="2.6" {...p} />
        <path d="M3.4 10.2h17.2M8 2.6v4.2M16 2.6v4.2" {...p} />
        {[8.6, 12, 15.4].map((x) => (
          <circle key={x} cx={x} cy="14" r="1.05" fill={c} />
        ))}
        {[8.6, 12].map((x) => (
          <circle key={`b${x}`} cx={x} cy="17.6" r="1.05" fill={c} />
        ))}
      </>
    );
  if (tipo === "llave") return svg(<path d="M15.4 7.1a4.1 4.1 0 1 0-3.7 4.1L3.9 19l1.6 1.6 7.8-7.8a4.1 4.1 0 0 0 2.1-5.7z" {...p} />);
  if (tipo === "persona")
    return svg(
      <>
        <circle cx="12" cy="8" r="3.6" {...p} />
        <path d="M4.9 20.2c0-3.6 3.1-6.1 7.1-6.1s7.1 2.5 7.1 6.1" {...p} />
      </>
    );
  if (tipo === "aviso")
    return svg(
      <>
        <path d="M12 3.4 2.4 20.2h19.2z" {...p} />
        <path d="M12 10v4.1M12 17.2h.01" {...p} />
      </>
    );
  if (tipo === "diana")
    return svg(
      <>
        <circle cx="12" cy="12" r="8.4" {...p} />
        <circle cx="12" cy="12" r="3.1" {...p} />
      </>
    );
  if (tipo === "guardar")
    return svg(
      <>
        <path d="M4.6 4.6h11L20 9v10.4H4.6z" {...p} />
        <path d="M8.2 4.6v5h6.6M8.2 19.4v-5h7.6v5" {...p} />
      </>
    );
  if (tipo === "engranaje")
    return svg(
      <>
        <circle cx="12" cy="12" r="3.3" {...p} />
        <path d="M12 2.4v2.7M12 18.9v2.7M21.6 12h-2.7M5.1 12H2.4M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9M18.8 18.8l-1.9-1.9M7.1 7.1 5.2 5.2" {...p} />
      </>
    );
  if (tipo === "tren")
    return svg(
      <>
        <rect x="5.2" y="3.4" width="13.6" height="12.8" rx="3" fill={c} />
        <rect x="7" y="6" width="10" height="4.2" rx="1" fill={AZUL_OSC} />
        <path d="M8.4 20.4 10.2 17M15.6 20.4 13.8 17" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </>
    );
  return null;
}

/* Fotografía de cabecera: la Civia con destino Alcalá y las torres de la
   Castellana al fondo. Va incrustada para que el juego funcione sin
   depender de ningún archivo externo.                                    */
const FOTO_CABECERA = "/cabecera.jpg";

function EscenaTren() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <img
        src={FOTO_CABECERA}
        alt="Unidad 465 Civia con destino Alcalá de Henares"
        style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "auto", minWidth: "100%", objectFit: "cover", objectPosition: "72% 45%" }}
      />
      {/* velo para que el texto de la izquierda se lea siempre */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(100deg, #F1F5F8 0%, rgba(241,245,248,.94) 26%, rgba(241,245,248,.62) 48%, rgba(241,245,248,.08) 72%, rgba(241,245,248,0) 100%)",
        }}
      />
    </div>
  );
}
// marca de agua de cada tarjeta: andén y sala de control
function MarcaTarjeta({ tipo }) {
  const col = tipo === "anden" ? PORT.trazo : PORT.trazoOsc;
  return (
    <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "62%", opacity: tipo === "anden" ? 0.5 : 0.55 }}>
      {tipo === "anden" ? (
        <g fill="none" stroke={col} strokeWidth="2">
          <path d="M0 44h200M22 44v106M58 44v106M150 30h50v120" />
          <path d="M0 120h200M0 138h200" />
          <path d="M96 46v60M120 46v60" />
          <circle cx="108" cy="112" r="7" fill={col} stroke="none" opacity="0.7" />
          <path d="M40 150 96 60M170 150 128 60" />
        </g>
      ) : (
        <g stroke={col} strokeWidth="2" fill="none">
          <rect x="8" y="14" width="52" height="34" rx="3" />
          <rect x="70" y="14" width="52" height="34" rx="3" />
          <rect x="132" y="14" width="52" height="34" rx="3" />
          <rect x="8" y="58" width="52" height="34" rx="3" />
          <rect x="70" y="58" width="52" height="34" rx="3" />
          <rect x="132" y="58" width="52" height="34" rx="3" />
          <path d="M0 110h200M18 110v40M96 110v40M174 110v40" />
          <path d="M14 24h40M14 32h26M76 24h40M76 32h30M138 24h40M138 38h22" />
        </g>
      )}
    </svg>
  );
}

// perfil de la ciudad para el pie
function Skyline({ c = PORT.perfil }) {
  return (
    <svg viewBox="0 0 220 46" preserveAspectRatio="xMaxYMax meet" style={{ position: "absolute", right: 0, bottom: 0, height: "100%", width: 170, opacity: 0.45 }}>
      <g fill={c}>
        <path d="M0 46V30h10v16zM14 46V22h12v24zM30 46V34h8v12zM42 46V14h10v32zM56 46V26h14v20zM74 46V18h9v28zM87 46V32h12v14zM103 46V10h8v36zM115 46V28h10v18zM129 46V20h13v26zM146 46V33h9v13zM159 46V16h11v30zM174 46V27h9v19zM187 46V22h12v24zM203 46V31h9v15z" />
      </g>
    </svg>
  );
}

function Portada({ camp, cargando, elegir }) {
  const enCurso = camp && camp.acum.turnos > 0;

  const tarjeta = (id) => {
    const oscura = id === "campana";
    const inactiva = id === "cargar" && !enCurso;
    const d = {
      rapida: { n: "PARTIDA RÁPIDA", t: "Un turno suelto. Eliges línea y turno, y al relevo termina la partida.", ic: "crono", pi: "diana", p: "Sin consecuencias entre turnos", m: "anden" },
      campana: {
        n: "MODO CAMPAÑA",
        t: "Turnos encadenados. El desgaste, el taller y el material se arrastran de un turno al siguiente.",
        ic: "calendario",
        pi: "guardar",
        p: enCurso ? `Día ${camp.dia} · ${nf(camp.acum.puntos)} puntos · ${camp.acum.turnos} turnos` : "Se guarda sola entre sesiones",
        m: "control",
      },
      cargar: {
        n: "CARGAR PARTIDA",
        t: enCurso
          ? "Retoma la campaña guardada justo donde la dejaste, sin pasar por el menú."
          : "Todavía no hay ninguna campaña guardada. Empieza una en modo campaña.",
        ic: "guardar",
        pi: "diana",
        p: enCurso ? `Día ${camp.dia} · turno de ${(TURNOS.find((x) => x.id === camp.turno) || TURNOS[0]).n.toLowerCase()}` : "Sin partida guardada",
        m: "anden",
      },
    }[id];

    return (
      <button
        key={id}
        disabled={cargando || inactiva}
        onClick={() => elegir(id)}
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          textAlign: "left",
          background: oscura ? AZUL_OSC : "#FFFFFF",
          border: "none",
          borderLeft: `6px solid ${ROJO_CM}`,
          borderRadius: R.grande,
          padding: 0,
          marginBottom: 12,
          fontFamily: "inherit",
          cursor: cargando ? "wait" : inactiva ? "not-allowed" : "pointer",
          color: oscura ? P.blanco : AZUL,
          boxShadow: SOMBRA.elevado,
          overflow: "hidden",
          opacity: cargando ? 0.6 : inactiva ? 0.45 : 1,
        }}
      >
        <MarcaTarjeta tipo={d.m} />
        <span style={{ position: "relative", display: "block", padding: "20px 18px 17px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: `linear-gradient(145deg, ${ROJO_CM}, ${ROJO_OSC})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 3px 10px ${PORT.rojo}66`, // el icono destaca sobre la tarjeta
              }}
            >
              <IconoPortada tipo={d.ic} t={26} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: T.titulo, fontWeight: 800, letterSpacing: 0.2, display: "block", lineHeight: 1.1 }}>{d.n}</span>
              <span style={{ display: "block", width: 38, height: 4, background: ROJO_CM, borderRadius: R.hilo, marginTop: 8 }} />
            </span>
            {id === "campana" && enCurso && (
              <span style={{ fontSize: T.micro, fontWeight: 800, letterSpacing: 0.7, color: P.blanco, background: ROJO_CM, borderRadius: R.menudo, padding: "3px 7px", flexShrink: 0 }}>EN CURSO</span>
            )}
          </span>

          <span style={{ display: "block", fontSize: T.base, lineHeight: 1.6, color: oscura ? PORT.claro : PORT.textoSuave, maxWidth: 260 }}>{d.t}</span>

          <span style={{ display: "block", borderTop: `1px dashed ${oscura ? PORT.lineaOsc : PORT.linea}`, margin: "16px 0 12px" }} />

          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconoPortada tipo={d.pi} c={oscura ? PORT.claroSuave : PORT.apagado} t={16} grosor={1.8} />
            <span style={{ fontSize: T.aux, color: oscura ? PORT.claroSuave : PORT.apagado }}>{d.p}</span>
          </span>
        </span>
      </button>
    );
  };

  const rasgos = [
    { i: "llave", n: "Gestión de material", d: "Mantenimiento y averías" },
    { i: "persona", n: "Gestión de personal", d: "Conductores y relevos" },
    { i: "aviso", n: "Incidencias en tiempo real", d: "Toma decisiones al instante" },
  ];

  return (
    <div style={{ ...ST.wrap, padding: 0, background: PORT.fondo, minHeight: "100vh", overflowX: "hidden" }}>
      <Fonts />

      {/* ── cabecera con la escena ── */}
      <div style={{ position: "relative", minHeight: 330, overflow: "hidden", background: PORT.fondoSuave }}>
        <EscenaTren />
        <div style={{ position: "relative", padding: "26px 16px 30px" }}>
          <div style={{ fontSize: T.micro, letterSpacing: 2.6, textTransform: "uppercase", color: PORT.rotulo, fontWeight: 700 }}>Centro de Gestión de Operaciones</div>
          <div style={{ fontSize: T.cartelXL, fontWeight: 800, color: AZUL, letterSpacing: -3, lineHeight: 0.86, marginTop: 8 }}>CGO</div>
          <div style={{ fontSize: T.cartel, fontWeight: 800, color: ROJO_CM, letterSpacing: -2.4, lineHeight: 0.94, marginTop: 2 }}>Simulator</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <span style={{ width: 32, height: 4, background: ROJO_CM, borderRadius: R.hilo }} />
            <span style={{ fontSize: T.alto, color: PORT.texto, fontWeight: 600 }}>Cercanías Madrid</span>
          </div>
          <div style={{ fontSize: T.base, color: PORT.textoSuave, lineHeight: 1.6, marginTop: 16, maxWidth: 215 }}>
            Gestiona operaciones, planifica turnos y toma decisiones en tiempo real.
          </div>
        </div>
      </div>

      {/* ── pestaña angulada ── */}
      <div style={{ padding: "0 14px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: AZUL_OSC,
            color: P.blanco,
            padding: "10px 30px 10px 15px",
            borderRadius: "10px 0 0 0",
            clipPath: "polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
            marginBottom: -2,
          }}
        >
          <IconoPortada tipo="tren" c={ROJO_CM} t={16} />
          <span style={{ fontSize: T.aux, fontWeight: 800, letterSpacing: 1.6 }}>MODO DE JUEGO</span>
        </div>
      </div>

      {/* ── tarjetas ── */}
      <div style={{ padding: "10px 14px 0" }}>
        {tarjeta("rapida")}
        {tarjeta("campana")}
        {tarjeta("cargar")}
      </div>

      {/* ── franja de rasgos ── */}
      <div style={{ padding: "6px 14px 18px" }}>
        <div style={{ background: PORT.fondoTenue, borderRadius: R.grande, display: "flex", padding: "4px 0" }}>
          {rasgos.map((r, k) => (
            <div
              key={r.n}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 8px",
                borderLeft: k ? "1px solid #DEE5EB" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                textAlign: "center",
              }}
            >
              <IconoPortada tipo={r.i} c={ROJO_CM} t={20} grosor={1.9} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: T.aux, fontWeight: 700, color: AZUL, lineHeight: 1.25 }}>{r.n}</span>
                <span style={{ display: "block", fontSize: T.menor, color: PORT.apagado, marginTop: 4, lineHeight: 1.3 }}>{r.d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── pie ── */}
      <div style={{ position: "relative", background: AZUL_OSC, padding: "18px 14px", overflow: "hidden" }}>
        <Skyline c={PORT.perfil} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <span style={{ fontSize: T.base, color: PORT.claro }}>Tú controlas la red. </span>
          <span style={{ fontSize: T.base, color: ROJO_CM, fontWeight: 700 }}>Cada decisión cuenta.</span>
        </div>
      </div>
    </div>
  );
}
// cabecera reducida para las pantallas interiores
function Logo({ pequeno }) {
  return (
    <div style={{ marginBottom: pequeno ? 18 : 30 }}>
      <div style={{ fontSize: T.micro, letterSpacing: 2.4, textTransform: "uppercase", color: PORT.rotulo, fontWeight: 700 }}>Centro de Gestión de Operaciones</div>
      <h1 style={{ fontSize: pequeno ? 34 : 52, fontWeight: 800, letterSpacing: pequeno ? -1.5 : -2.4, lineHeight: 0.92, margin: "4px 0 0", color: AZUL }}>
        CGO <span style={{ color: ROJO_CM }}>Simulator</span>
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span style={{ height: 3, width: 30, background: ROJO_CM, borderRadius: R.hilo }} />
        <span style={{ fontSize: T.base, color: P.muted }}>Cercanías Madrid</span>
      </div>
    </div>
  );
}

function Seleccion({ modo, camp, cargando, atras, empezar, nueva }) {
  const enCurso = camp && camp.acum.turnos > 0;
  const [turno, setTurno] = useState("manana");
  // líneas que el jugador va a llevar en este turno; al menos una
  const [elegidas, setElegidas] = useState(["C-7"]);
  const defT = TURNOS.find((x) => x.id === (modo === "campana" && camp ? camp.turno : turno)) || TURNOS[0];

  return (
    <div style={{ ...ST.wrap, minHeight: "100vh" }}>
      <Fonts />
      <button
        onClick={atras}
        style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.base, fontWeight: 600, color: P.muted, marginBottom: 12 }}
      >
        ‹ Modo de juego
      </button>

      <Logo pequeno />

      {/* Líneas del turno. Se puede llevar una sola o varias a la vez: cada
          una añade sus circulaciones y su personal.                    */}
      <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Líneas a gestionar</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {LINEAS_NUCLEO.map((l) => {
          const disponible = !!LINEAS[l.id];
          const sel = elegidas.includes(l.id);
          return (
            <button
              key={l.id}
              disabled={!disponible}
              onClick={() => setElegidas(sel ? elegidas.filter((x) => x !== l.id) : [...elegidas, l.id])}
              title={disponible ? l.n : `${l.n} · próximamente`}
              style={{
                ...PASTILLA,
                display: "flex",
                background: sel ? LIN[l.id] : P.surface,
                color: sel ? P.blanco : P.ink,
                border: `2px solid ${sel ? LIN[l.id] : P.rule}`,
                opacity: disponible ? 1 : 0.28,
                cursor: disponible ? "pointer" : "not-allowed",
              }}
            >
              {l.id}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: T.aux, color: P.muted, marginBottom: 20, lineHeight: 1.45 }}>
        {elegidas.length > 1
          ? `${elegidas.length} líneas a la vez, ${elegidas.reduce((n2, x) => n2 + (LINEAS[x] ? Math.round((LINEAS[x].recorrido * 2 + LINEAS[x].invA + LINEAS[x].invB) / LINEAS[x].intervalo) : 0), 0)} circulaciones en total.`
          : "Puedes llevar más de una línea a la vez. Comparten taller, material y libro de incidencias."}
      </div>

      {modo === "rapida" ? (
        <>
          <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Turno</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {TURNOS.map((t) => {
              const sel = turno === t.id;
              return (
                <button
                  key={t.id}
                  disabled={!t.ok}
                  onClick={() => setTurno(t.id)}
                  style={{
                    flex: 1,
                    background: sel && t.ok ? P.solido : P.surface,
                    color: sel && t.ok ? P.blanco : P.ink,
                    border: `1px solid ${sel && t.ok ? P.ink : P.rule}`,
                    borderRadius: R.grande,
                    padding: "12px 6px",
                    fontFamily: "inherit",
                    cursor: t.ok ? "pointer" : "not-allowed",
                    opacity: t.ok ? 1 : 0.4,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: T.alto, fontWeight: 700 }}>{t.n}</div>
                  <div style={{ fontSize: T.menor, marginTop: 2, fontFamily: MONO, color: sel && t.ok ? PORT.linea : P.muted }}>
                    {t.ok ? t.h : "próximamente"}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ ...ST.eyebrow, marginBottom: 8 }}>{enCurso ? "Campaña en curso" : "Nueva campaña"}</div>
          <div style={{ ...ST.card, padding: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: enCurso ? 10 : 0 }}>
              <span style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.5, flex: 1 }}>
                Día {camp ? camp.dia : 1} · turno de {defT.n.toLowerCase()}
              </span>
              <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO }}>{defT.h}</span>
            </div>
            {enCurso && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                <Kpi k="Turnos" v={String(camp.acum.turnos)} c={P.ink} small />
                <Kpi k="Punt." v={`${camp.acum.punt.toFixed(0)}%`} c={colPuntualidad(camp.acum.punt)} small />
                <Kpi k="Afectados" v={nf(camp.acum.afect)} c={P.ink} small />
                <Kpi k="Puntos" v={nf(camp.acum.puntos)} c={P.ok} small />
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => empezar(modo === "rapida" ? turno : null, elegidas)}
        disabled={cargando}
        style={{ ...ST.btn(true), width: "100%", padding: "15px 0", fontSize: T.alto, fontFamily: "inherit", letterSpacing: 0.3, opacity: cargando ? 0.5 : 1 }}
      >
        {modo === "rapida" ? "Entrar al puesto de mando" : enCurso ? "Continuar la campaña" : "Empezar campaña"}
      </button>

      {modo === "campana" && enCurso && (
        <button
          onClick={nueva}
          style={{ width: "100%", background: "transparent", border: "none", color: P.muted, padding: "12px 0 0", fontFamily: "inherit", fontSize: T.base, fontWeight: 600, cursor: "pointer" }}
        >
          Empezar una campaña nueva
        </button>
      )}
    </div>
  );
}

/* ── pantalla de asignación ─────────────────────────────────── */

/* ── relevo de turno ────────────────────────────────────────────
   En los turnos que no abren el servicio no hay nada que asignar:
   el material ya viene rodando del turno anterior. La pantalla es
   un parte de situación antes de tomar el mando.                  */

function Relevo({ asig, camp, empezar }) {
  const uni = (id) => CATALOGO.find((u) => u.id === id);
  const comps = asig.slots.map((par) => par.map(uni).filter(Boolean));
  const plazas = comps.reduce((n, c) => n + c.reduce((m, u) => m + u.plazas, 0), 0);
  const demPunta = demandaPorTren();
  const flojas = comps.flat().filter((u) => !cubreTurno(u));
  const apartadas = Object.entries(asig.apart).filter(([, par]) => par[0]);

  return (
    <div style={ST.wrap}>
      <Fonts />
      <div style={ST.eyebrow}>Relevo de turno · {hhmm(INICIO)}</div>
      <h1 style={{ fontSize: T.cabecera, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, margin: "3px 0 6px" }}>
        {camp ? `Día ${camp.dia} · ` : ""}turno de {(TURNOS.find((x) => x.id === TURNO_ID) || TURNOS[0]).n.toLowerCase()}
      </h1>
      <div style={{ fontSize: T.base, color: P.muted, lineHeight: 1.5, marginBottom: 16 }}>
        El servicio ya está en marcha. Te haces cargo de {CIRCULACIONES} circulaciones con el material que dejó el turno anterior: aquí no se asigna
        nada, solo se toma el mando.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Kpi k="En línea" v={`${CIRCULACIONES}`} c={P.ok} small />
        <Kpi k="Plazas" v={`${(plazas / 1000).toFixed(1)}k`} c={P.ink} small />
        <Kpi k="Punta" v={nf(demPunta)} c={P.warn} small />
      </div>

      {flojas.length > 0 && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 12, borderColor: P.alert }}>
          <div style={{ fontSize: T.base, fontWeight: 700, color: P.alert, marginBottom: 4 }}>
            {flojas.length} unidad{flojas.length === 1 ? "" : "es"} no llega al final del turno
          </div>
          <div style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO, lineHeight: 1.5 }}>
            {flojas.map((u) => `${u.id} · ${Math.round(u.desgaste)} %`).join("  ·  ")}
          </div>
        </div>
      )}

      {camp && camp.retrasos && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 12, borderColor: camp.retrasos.some((x) => x > 5) ? P.warn : P.rule }}>
          <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Cómo te dejan la línea</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <Kpi
              k="Retraso medio"
              v={`${(camp.retrasos.reduce((n, v) => n + v, 0) / Math.max(1, camp.retrasos.length)).toFixed(1)}′`}
              c={camp.retrasos.some((x) => x > 8) ? P.alert : camp.retrasos.some((x) => x > 5) ? P.warn : P.ok}
              small
            />
            <Kpi k="En andén" v={nf((camp.andenes || []).reduce((n, a2) => n + a2.alcala + a2.pio, 0))} c={P.ink} small />
            <Kpi k="Restricc." v={String((camp.restricciones || []).length)} c={(camp.restricciones || []).length ? P.warn : P.ok} small />
          </div>
          <div style={{ fontSize: T.aux, color: P.muted, marginTop: 8, lineHeight: 1.45 }}>
            Los retrasos, los viajeros que siguen esperando y las restricciones vigentes pasan contigo al turno entrante.
          </div>
        </div>
      )}

      {/* Estado de la flota. El mantenimiento dependía de que el jugador se
          acordara de ir al taller: en veinte turnos simulados no entró ni una
          unidad después del primer día. Aquí aparece la decisión sola.   */}
      {(() => {
        if (!camp) return null;
        const desgastadas = CATALOGO.filter((u) => !camp.taller[u.id] && (camp.desg[u.id] || u.desgaste) >= 85);
        const averiadas = camp.averiadas.length;
        const enTaller = Object.keys(camp.taller).length;
        const listas = Object.values(camp.taller).filter((v) => v.restan <= 0).length;
        if (!desgastadas.length && !averiadas && !enTaller) return null;
        return (
          <div style={{ ...ST.card, padding: 12, marginBottom: 12, borderColor: desgastadas.length || averiadas ? P.warn : P.rule }}>
            <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Estado de la flota</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <Kpi k="Pasadas de ciclo" v={String(desgastadas.length)} c={desgastadas.length ? P.warn : P.ok} small />
              <Kpi k="Averiadas" v={String(averiadas)} c={averiadas ? P.alert : P.ok} small />
              <Kpi k="En taller" v={`${enTaller}${listas ? ` · ${listas} listas` : ""}`} c={P.ink} small />
            </div>
            {(desgastadas.length > 0 || averiadas > 0) && (
              <div style={{ fontSize: T.aux, color: P.muted, marginTop: 8, lineHeight: 1.45 }}>
                {desgastadas.length > 0 && `${desgastadas.length} unidad${desgastadas.length === 1 ? "" : "es"} por encima del 85 % de desgaste. `}
                {averiadas > 0 && `${averiadas} averiada${averiadas === 1 ? "" : "s"} sin reparar. `}
                Puedes mandarlas a revisión desde la pantalla de Taller.
              </div>
            )}
          </div>
        );
      })()}

      <div style={ST.eyebrow}>Composiciones en servicio</div>
      <div style={{ ...ST.card, padding: 12, margin: "6px 0 10px" }}>
        {comps.map((c, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k) }}>
            <span style={{ fontSize: T.menor, color: P.muted, width: 22, flexShrink: 0 }}>{String(k + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: T.base, fontFamily: MONO, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.map((u) => u.id).join(" + ") || "—"}
            </span>
            <span style={{ fontSize: T.aux, color: P.muted, flexShrink: 0 }}>{nf(c.reduce((m, u) => m + u.plazas, 0))} pl</span>
            <span
              style={{ fontSize: T.aux, fontWeight: 700, fontFamily: MONO, flexShrink: 0, color: c.some((u) => !cubreTurno(u)) ? P.alert : P.muted }}
            >
              {Math.round(Math.max(...c.map((u) => u.desgaste), 0))}%
            </span>
          </div>
        ))}
      </div>

      {apartadas.length > 0 && (
        <>
          <div style={ST.eyebrow}>Material apartado</div>
          <div style={{ ...ST.card, padding: 12, margin: "6px 0 10px" }}>
            {apartadas.map(([clv, par], k) => {
              /* La clave guarda el NOMBRE de la estación desde que el apartado
                 es común a varias líneas. Se admite también el número por si
                 llega de una partida guardada antes del cambio.        */
              const [donde, via] = clv.split("|");
              const est = Number.isFinite(Number(donde)) ? ESTACIONES[Number(donde)] : ESTACIONES.find((e) => e.n === donde);
              return (
                <div key={clv} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k) }}>
                  <span style={{ fontSize: T.aux, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {(est || {}).n || donde} · {via}
                  </span>
                  <span style={{ fontSize: T.aux, fontFamily: MONO, color: P.muted, flexShrink: 0 }}>
                    {par.filter(Boolean).join(" + ")}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button onClick={empezar} style={{ ...ST.btn(true), width: "100%", padding: "15px 0", fontSize: T.alto, fontFamily: "inherit" }}>
        Tomar el servicio
      </button>
    </div>
  );
}

function Asignacion({ asig, setAsig, slotSel, setSlotSel, empezar, camp }) {
  /* Una pestaña por línea en juego. Las circulaciones son de cada una, pero el
     material apartado es común: se deja en una vía y lo puede tomar cualquier
     línea que pase por allí.                                            */
  /* El apartadero es una pestaña más, junto a las líneas: el material aparcado
     no pertenece a ninguna, está en una vía y lo toma quien pase por allí. */
  const [lineaSel, setLineaSel] = useState(LINEAS_EN_JUEGO[0]);
  const verApartadero = lineaSel === "__apart";
  /* Se fija la línea de la pestaña antes de dibujar: el número de
     circulaciones, la demanda en punta, los kilómetros por turno y el material
     admitido son constantes globales, y sin esto la pestaña de la C-7 se
     dibujaba con los datos de la C-1.                                   */
  if (LINEA !== lineaSel) fijarLinea(lineaSel);

  /* Las circulaciones de la línea que se está viendo. Se guardan por línea en
     asig.lineas; asig.slots sigue apuntando a la principal para que el resto
     del juego no note el cambio.                                        */
  if (!asig.lineas) asig.lineas = { [LINEAS_EN_JUEGO[0]]: asig.slots };
  for (const id of LINEAS_EN_JUEGO) {
    const L = LINEAS[id];
    const n = Math.round((L.recorrido * 2 + L.invA + L.invB) / L.intervalo);
    // si el número no cuadra con la línea, se rehace: pudo crearse con otra
    if (!asig.lineas[id] || asig.lineas[id].length !== n) {
      const previo = asig.lineas[id] || [];
      asig.lineas[id] = Array.from({ length: n }, (_, k) => previo[k] || [null, null]);
    }
  }
  /* En la pestaña del apartadero no hay línea seleccionada: se trabaja con la
     principal para lo que necesite una, y lo propio de línea no se dibuja. */
  const lineaBase = verApartadero ? LINEAS_EN_JUEGO[0] : lineaSel;
  const slotsLinea = asig.lineas[lineaBase] || [];
  const totalLinea = slotsLinea.length; // circulaciones de la línea que se ve
  const ponSlots = (nuevos) => setAsig({ ...asig, lineas: { ...asig.lineas, [lineaSel]: nuevos }, slots: lineaSel === LINEAS_EN_JUEGO[0] ? nuevos : asig.slots });
  // una unidad comprometida en cualquier línea ya no está disponible
  const usadas = new Set([...Object.values(asig.lineas).flat(2), ...Object.values(asig.apart).flat()].filter(Boolean));
  /* Se pasa la línea a mano: filter entrega el ÍNDICE como segundo argumento,
     y ese índice acababa interpretándose como identificador de línea. Al no
     existir ninguna línea "0", el juego daba por sencillas todas las
     composiciones y las dobles constaban como incompletas.             */
  const listas = slotsLinea.filter((par) => slotCompleto(par, lineaSel)).length;
  // el turno se abre cuando TODAS las líneas están cubiertas
  // cada línea se juzga con SUS reglas de composición
  const completo = LINEAS_EN_JUEGO.every((id) => {
    const propias = asig.lineas[id] || [];
    return propias.length > 0 && propias.every((par) => slotCompleto(par, id));
  });
  const uni = (id) => CATALOGO.find((u) => u.id === id);
  const plazasSlot = (par) => par.filter(Boolean).reduce((n, id) => n + uni(id).plazas, 0);

  // unidades libres de cada serie que esta línea puede usar
  const lib = (s) => (LINEAS[lineaBase].series.includes(s) ? LIBRES_C7.filter((u) => u.serie === s).length : 0);
  const demPunta = demandaPorTren();
  const cubiertas = slotsLinea.filter((par) => slotCompleto(par) && plazasSlot(par) >= demPunta).length;

  return (
    <div style={ST.wrap}>
      <Fonts />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: verApartadero ? P.solido : LIN[lineaSel], color: P.blanco, fontSize: T.titulo, fontWeight: 700, padding: "2px 9px", borderRadius: R.normal }}>{lineaSel}</span>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: T.base, fontWeight: 700 }}>Asignación de material</div>
          <div style={{ fontSize: T.aux, color: P.muted }}>
            {verApartadero
              ? "Material estacionado, común a todas las líneas"
              : `${(LINEAS[lineaSel].estaciones[0] || {}).n} – ${(LINEAS[lineaSel].estaciones[LINEAS[lineaSel].estaciones.length - 1] || {}).n}`}
          </div>
        </div>
      </div>

      {/* Una pestaña por línea, con las circulaciones que le faltan por cubrir,
          y una más para el material apartado, que es común a todas.

          Se dibujan siempre: con una sola línea la suya sobra, pero la del
          apartadero no, y al ocultarlas todas no había forma de llegar a ella
          ni de dejar material estacionado.                              */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[...LINEAS_EN_JUEGO, "__apart"].map((id) => {
            const sel = id === lineaSel;
            if (id === "__apart") {
              const n = Object.values(asig.apart).flat().filter(Boolean).length;
              return (
                <button
                  key={id}
                  onClick={() => setLineaSel(id)}
                  style={{
                    flex: 1,
                    background: sel ? P.solido : P.surface,
                    color: sel ? P.blanco : P.ink,
                    border: `2px solid ${sel ? P.solido : P.rule}`,
                    borderRadius: R.normal,
                    padding: "8px 6px",
                    fontFamily: "inherit",
                    fontSize: T.base,
                    fontWeight: 700,
                    cursor: "pointer",
                    lineHeight: 1.2,
                  }}
                >
                  Apart.
                  <span style={{ display: "block", fontSize: T.micro, fontWeight: 600, opacity: sel ? 0.85 : 0.6, fontFamily: MONO }}>
                    {n} uds.
                  </span>
                </button>
              );
            }
            const L = LINEAS[id];
            /* El total sale de las circulaciones ya creadas para esa línea, no
               de un cálculo aparte que podía no coincidir.             */
            const propias = (asig.lineas && asig.lineas[id]) || [];
            const n = propias.length || Math.round((L.recorrido * 2 + L.invA + L.invB) / L.intervalo);
            const puestas = propias.filter((par) => slotCompleto(par, id)).length;
            return (
              <button
                key={id}
                onClick={() => setLineaSel(id)}
                style={{
                  flex: 1,
                  background: sel ? LIN[id] : P.surface,
                  color: sel ? P.blanco : P.ink,
                  border: `2px solid ${sel ? LIN[id] : P.rule}`,
                  borderRadius: R.normal,
                  padding: "8px 6px",
                  fontFamily: "inherit",
                  fontSize: T.base,
                  fontWeight: 700,
                  cursor: "pointer",
                  lineHeight: 1.2,
                }}
              >
                {id}
                <span style={{ display: "block", fontSize: T.micro, fontWeight: 600, opacity: sel ? 0.85 : 0.6, fontFamily: MONO }}>
                  {puestas}/{n}
                </span>
              </button>
            );
          })}
      </div>

      {/* El texto describe la línea que se está asignando: cada una admite su
          material y tiene su propia demanda.                            */}
      {!verApartadero && (
      <div style={{ ...ST.card, padding: 12, margin: "12px 0", fontSize: T.base, lineHeight: 1.5, color: P.muted }}>
        <strong style={{ color: P.ink }}>{slotsLinea.length} circulaciones</strong>
        {LINEAS[lineaBase].dobles ? (
          <>
            . Las <strong style={{ color: P.ink }}>446 y 465</strong> circulan acopladas de dos en dos; la{" "}
            <strong style={{ color: P.ink }}>450 de doble piso</strong> presta servicio en composición simple.
          </>
        ) : (
          <>
            , cubiertas con <strong style={{ color: P.ink }}>{LINEAS[lineaBase].series.join(" y ")}</strong> en composición sencilla.
          </>
        )}{" "}
        La demanda en punta ronda los <strong style={{ color: P.ink }}>{nf(demPunta)} viajeros</strong> a bordo por circulación. Vigila el{" "}
        <strong style={{ color: P.ink }}>kilometraje hasta revisión</strong>: una unidad recorre unos {KM_TURNO} km en el turno.
      </div>
      )}

      {(() => {
        const cortas = [...usadas].map(uni).filter((u) => u && !cubreTurno(u));
        return cortas.length ? (
          <div style={{ ...ST.card, borderColor: P.alert, padding: "9px 12px", marginBottom: 12, fontSize: T.base, lineHeight: 1.45 }}>
            <strong style={{ color: P.alert }}>{cortas.length} unidad(es) no llegan al final del turno</strong>: {cortas.map((u) => u.id).join(", ")}. Les
            vencerá la revisión en línea.
          </div>
        ) : null;
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        <Kpi k="Cubiertas" v={`${listas}/${totalLinea}`} c={completo ? P.ok : P.warn} small />
        <Kpi k="450 libres" v={String(lib("450"))} c={P.ink} small />
        <Kpi k="465 libres" v={String(lib("465"))} c={P.ink} small />
        <Kpi k="446 libres" v={String(lib("446"))} c={P.ink} small />
      </div>

      <div style={{ ...ST.card, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.aux, color: P.muted, marginBottom: 4 }}>
          <span>Circulaciones que cubren la punta</span>
          <span style={{ fontFamily: MONO, fontWeight: 700, color: cubiertas === totalLinea ? P.ok : P.warn }}>
            {cubiertas}/{totalLinea}
          </span>
        </div>
        <div style={{ height: 5, background: P.sunken, borderRadius: R.menudo, overflow: "hidden" }}>
          <div style={{ width: `${(cubiertas / totalLinea) * 100}%`, height: "100%", background: cubiertas === totalLinea ? P.ok : P.warn }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => {
            /* La propuesta es de la línea que se está viendo: se fija primero
               para que se calcule con sus circulaciones y su material.  */
            fijarLinea(lineaSel);
            // lo que ya está comprometido en las demás líneas no se propone
            const ocupadas = new Set(
              Object.entries(asig.lineas)
                .filter(([id]) => id !== lineaSel)
                .flatMap(([, v]) => v.flat())
                .filter(Boolean)
            );
            for (const v of Object.values(asig.apart)) for (const x of v) if (x) ocupadas.add(x);
            const pr = propuestaTaller(camp, ocupadas);
            setAsig({ ...asig, lineas: { ...asig.lineas, [lineaSel]: pr.slots }, apart: { ...asig.apart, ...(pr.apart || {}) }, slots: lineaSel === LINEAS_EN_JUEGO[0] ? pr.slots : asig.slots });
          }}
          style={{ ...ST.btn(false), fontFamily: "inherit" }}
        >
          Propuesta de taller
        </button>
        <button
          onClick={() => {
            // se vacía solo la línea que se está viendo
            const vacio = slotsLinea.map(() => [null, null]);
            ponSlots(vacio);
          }}
          style={{ ...ST.btn(false), fontFamily: "inherit", flex: 0.6 }}
        >
          Vaciar
        </button>
      </div>

      {!verApartadero && slotsLinea.map((par, i) => {
        const u0 = par[0] ? uni(par[0]) : null;
        const simple = esSimple(par[0]);
        const plazas = plazasSlot(par);
        const cubre = plazas >= demPunta;
        const lista = slotCompleto(par);
        return (
          <div key={i} style={{ ...ST.card, padding: 12, marginBottom: 8, borderColor: lista ? P.rule : P.warn }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 20, height: 22, background: COLOR.rojo, borderRadius: R.menudo, color: P.blanco, fontSize: T.aux, fontWeight: 700, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: T.base, fontWeight: 700 }}>Circulación {i + 1}</span>
              <span style={{ fontSize: T.menor, color: P.muted, fontFamily: MONO }}>
                sale como {numeroTren({ offset: i * INTERVALO + DESFASE, retraso: 0 }, INICIO)}
              </span>
              {u0 && (
                <span style={{ fontSize: T.menor, fontWeight: 700, color: P.blanco, background: SERIE_COLOR[u0.serie], borderRadius: R.menudo, padding: "1px 5px", fontFamily: MONO }}>
                  {u0.serie} {simple ? "simple" : "doble"}
                </span>
              )}
              <span style={{ fontSize: T.aux, marginLeft: "auto", fontFamily: MONO, fontWeight: 600, color: plazas === 0 ? P.muted : cubre ? P.ok : P.warn }}>
                {nf(plazas)} pl.
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1].map((j) => {
                if (j === 1 && simple)
                  return (
                    <div key={j} style={{ flex: 1, border: `1px dashed ${P.rule}`, borderRadius: R.normal, padding: "8px 9px", fontSize: T.aux, color: P.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      composición simple
                    </div>
                  );
                const u = par[j] ? uni(par[j]) : null;
                return (
                  <button
                    key={j}
                    onClick={() => setSlotSel({ i, j })}
                    style={{ flex: 1, textAlign: "left", background: P.surface, border: `1px solid ${u ? P.rule : P.alert}`, borderRadius: R.normal, padding: "8px 9px", fontFamily: "inherit", cursor: "pointer", color: P.ink, minWidth: 0 }}
                  >
                    {u ? (
                      <>
                        <div style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO }}>{u.id}</div>
                        <div style={{ display: "flex", gap: 8, fontSize: T.menor, color: P.muted, marginTop: 2 }}>
                          <span style={{ color: u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }}>{Math.round(u.fiab * 100)}%</span>
                          <span style={{ color: !cubreTurno(u) ? P.alert : turnosRestantes(u) < 2 ? P.warn : P.muted }}>{Math.round(u.desgaste)}% desg.</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: T.base, color: P.muted, padding: "6px 0" }}>— asignar —</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {verApartadero && (
      <div style={{ ...ST.card, padding: 12, margin: "12px 0", fontSize: T.base, color: P.muted, lineHeight: 1.5 }}>
        El material aparcado <strong style={{ color: P.ink }}>no pertenece a ninguna línea</strong>: está en una vía y lo puede tomar cualquiera que pase
        por esa estación. Se estaciona por unidades sueltas, así que una pareja de Civias puede salir junta en la C-7 o desacoplada para cubrir un
        servicio de la C-1.
      </div>
      )}

      {/* Estaciones donde se puede apartar, reuniendo las de todas las líneas:
          Chamartín aparece una sola vez aunque la usen las dos.         */}
      {verApartadero &&
      (() => {
        const vistas = [];
        for (const id of LINEAS_EN_JUEGO)
          for (const e2 of LINEAS[id].estaciones)
            if (e2.apartVias && !vistas.some((x) => x.n === e2.n)) vistas.push(e2);
        return vistas;
      })().map((est) => {
        const idx = est.n;
        const compartidas = (est.rotVias || []).filter((v) => est.apartVias.includes(v));
        const ocupadas = est.apartVias.filter((v) => (asig.apart[clave(idx, v)] || []).some(Boolean));
        const rotLibres = (est.rotVias || []).filter((v) => !ocupadas.includes(v)).length;
        return (
          <div key={idx} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: T.base, fontWeight: 700 }}>{est.n}</span>
              {est.apartSeries && <span style={{ fontSize: T.menor, color: P.muted }}>solo serie {est.apartSeries.join("/")}</span>}
              {compartidas.length > 0 && (
                <span style={{ fontSize: T.menor, marginLeft: "auto", color: rotLibres ? P.muted : P.alert, fontWeight: rotLibres ? 400 : 700 }}>
                  {rotLibres} vía(s) libres para invertir
                </span>
              )}
            </div>
            {est.apartVias.map((via) => {
              const par = asig.apart[clave(idx, via)] || [null, null];
              /* En una vía de apartado no rige el acoplamiento: se estaciona por
               unidades sueltas, y solo el doble piso ocupa la vía él solo. Así
               una pareja de Civias puede salir junta en la C-7 o desacoplada
               para cubrir un servicio de la C-1.                        */
            const simple = !!par[0] && CATALOGO.find((u) => u.id === par[0]).serie === "450";
              return (
                <div key={via} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: T.aux, color: P.muted, width: 46, fontFamily: MONO, flexShrink: 0 }}>{via}</span>
                  {[0, 1].map((j) => {
                    if (j === 1 && simple)
                      return <div key={j} style={{ flex: 1, border: `1px dashed ${P.rule}`, borderRadius: R.normal, padding: "7px 9px", fontSize: T.aux, color: P.muted, textAlign: "center" }}>simple</div>;
                    const u = par[j] ? uni(par[j]) : null;
                    return (
                      <button
                        key={j}
                        onClick={() => setSlotSel({ apart: clave(idx, via), j, series: est.apartSeries })}
                        style={{ flex: 1, textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "7px 9px", fontFamily: MONO, fontSize: T.aux, cursor: "pointer", color: u ? P.ink : P.muted }}
                      >
                        {u ? u.id : "— libre —"}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      <button
        onClick={empezar}
        disabled={!completo}
        style={{ ...ST.btn(completo), width: "100%", padding: "14px 0", fontSize: T.alto, fontFamily: "inherit", opacity: completo ? 1 : 0.45, cursor: completo ? "pointer" : "not-allowed" }}
      >
        {completo ? "Abrir el turno" : `Faltan ${totalLinea - listas} circulaciones por cubrir`}
      </button>

      {slotSel && (
        <SelectorUnidad
          camp={camp}
          usadas={usadas}
          // la vía puede no estar aún en el mapa de apartados: desde el día 2
          // el turno abre con 'apart' vacío, y pedir [j] de algo inexistente
          // dejaba la pantalla en blanco
          actual={(slotSel.apart ? asig.apart[slotSel.apart] || [null, null] : slotsLinea[slotSel.i])[slotSel.j]}
          pareja={(slotSel.apart ? asig.apart[slotSel.apart] || [null, null] : slotsLinea[slotSel.i])[slotSel.j === 0 ? 1 : 0]}
          primera={slotSel.j === 0}
          soloSeries={slotSel.series}
          close={() => setSlotSel(null)}
          elegir={(id) => {
            if (slotSel.apart) {
              const apart = { ...asig.apart };
              const par = [...(apart[slotSel.apart] || [null, null])];
              const quita = par[slotSel.j] === id;
              par[slotSel.j] = quita ? null : id;
              // en el apartadero solo el doble piso ocupa la vía él solo
              if (!quita && slotSel.j === 0 && CATALOGO.find((u) => u.id === id).serie === "450") par[1] = null;
              apart[slotSel.apart] = par;
              setAsig({ ...asig, apart });
            } else {
              // la circulación pertenece a la línea que se está viendo
              const slots = slotsLinea.map((x) => [...x]);
              const quita = slots[slotSel.i][slotSel.j] === id;
              slots[slotSel.i][slotSel.j] = quita ? null : id;
              if (!quita && slotSel.j === 0 && esSimple(id)) slots[slotSel.i][1] = null;
              ponSlots(slots);
            }
            setSlotSel(null);
          }}
        />
      )}
    </div>
  );
}

function SelectorUnidad({ usadas, actual, pareja, primera, soloSeries, close, elegir, camp }) {
  const serieObligada = pareja ? CATALOGO.find((u) => u.id === pareja).serie : null;
  const base = primera ? ["450", "465", "446"] : ["465", "446"];
  const series = soloSeries ? base.filter((x) => soloSeries.includes(x)) : base;
  const [serie, setSerie] = useState(serieObligada || series[0]);
  const [dep, setDep] = useState("todos");
  // en campaña manda el desgaste arrastrado, no el del catálogo
  const enTaller = new Set(Object.keys((camp && camp.taller) || {}));
  const averiadas = new Set((camp && camp.averiadas) || []);
  const deSerie = DISPONIBLES_C7.filter((u) => u.serie === serie && !enTaller.has(u.id) && !averiadas.has(u.id)).map((u) => {
    const d = camp && camp.desg[u.id] !== undefined ? camp.desg[u.id] : u.desgaste;
    return { ...u, desgaste: d, fiab: fiabDesgaste(d) };
  });
  const deps = [...new Set(deSerie.map((u) => u.deposito))];
  const lista = deSerie.filter((u) => dep === "todos" || u.deposito === dep);
  const cambiarSerie = (s) => {
    setSerie(s);
    setDep("todos");
  };

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "80vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Material disponible</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {series.map((s) => {
            const bloqueada = serieObligada && serieObligada !== s;
            return (
              <button
                key={s}
                disabled={bloqueada}
                onClick={() => cambiarSerie(s)}
                style={{
                  flex: 1,
                  background: serie === s ? P.solido : P.surface,
                  color: serie === s ? P.blanco : P.ink,
                  border: `1px solid ${serie === s ? P.ink : P.rule}`,
                  borderRadius: R.normal,
                  padding: "8px 0",
                  fontSize: T.base,
                  fontWeight: 700,
                  fontFamily: MONO,
                  cursor: bloqueada ? "not-allowed" : "pointer",
                  opacity: bloqueada ? 0.4 : 1,
                }}
              >
                {s} · {SERIES[s].doble ? SERIES[s].plazas * 2 : SERIES[s].plazas} pl.
              </button>
            );
          })}
        </div>

        {serieObligada && (
          <div style={{ fontSize: T.aux, color: P.muted, marginBottom: 12 }}>
            La composición ya lleva una {serieObligada}: no se pueden acoplar series distintas.
          </div>
        )}
        {!serieObligada && serie === "450" && (
          <div style={{ fontSize: T.aux, color: P.muted, marginBottom: 12 }}>
            Doble piso en composición simple: una sola rama cubre la circulación entera.
          </div>
        )}

        {deps.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {(deps.length > 1 ? ["todos", ...deps] : deps).map((d) => (
              <button
                key={d}
                onClick={() => setDep(d)}
                style={{
                  background: dep === d ? P.solido : P.surface,
                  color: dep === d ? P.blanco : P.ink,
                  border: `1px solid ${dep === d ? P.ink : P.rule}`,
                  borderRadius: R.pastilla,
                  padding: "5px 11px",
                  fontSize: T.aux,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {d === "todos" ? "Todos" : d}
                {d !== "todos" && (
                  <span style={{ opacity: 0.65, marginLeft: 4, fontFamily: MONO }}>
                    {deSerie.filter((u) => u.deposito === d && !u.enTaller).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {lista.map((u) => {
          const bloqueada = u.enTaller || (usadas.has(u.id) && actual !== u.id);
          const sel = actual === u.id;
          return (
            <button
              key={u.id}
              disabled={bloqueada}
              onClick={() => elegir(u.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: sel ? P.solido : P.surface,
                color: sel ? P.blanco : P.ink,
                border: `1px solid ${P.rule}`,
                borderRadius: R.normal,
                padding: "10px 12px",
                marginBottom: 8,
                fontFamily: "inherit",
                cursor: bloqueada ? "not-allowed" : "pointer",
                opacity: bloqueada ? 0.42 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: T.alto, fontWeight: 700, fontFamily: MONO }}>{u.id}</span>
                {u.deposito && (
                  <span style={{ fontSize: T.micro, fontWeight: 700, color: P.blanco, background: DEPOSITOS[u.deposito].color, borderRadius: R.menudo, padding: "1px 5px" }}>{u.deposito}</span>
                )}
                {DEPOSITOS[u.deposito].nota && !u.enTaller && (
                  <span style={{ fontSize: T.micro, fontWeight: 700, color: sel ? P.blanco : P.muted, border: `1px solid ${P.rule}`, borderRadius: R.menudo, padding: "0 4px" }}>CEDIDA</span>
                )}
                {u.reformada && <span style={{ fontSize: T.micro, fontWeight: 700, color: sel ? P.blanco : P.muted, border: `1px solid ${P.rule}`, borderRadius: R.menudo, padding: "0 4px" }}>REFORMADA</span>}
                <span style={{ marginLeft: "auto", fontSize: T.aux, fontWeight: 700, fontFamily: MONO, color: sel ? P.blanco : u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }}>
                  {Math.round(u.fiab * 100)}%
                </span>
              </div>
              <div style={{ fontSize: T.aux, color: sel ? PORT.linea : P.muted, marginTop: 4 }}>
                {u.enTaller
                  ? "En taller · no disponible"
                  : usadas.has(u.id) && !sel
                  ? "Ya asignada a otra circulación"
                  : `${u.lote} · desgaste ${Math.round(u.desgaste)} % · fiab. ${Math.round(u.fiab * 100)} %${cubreTurno(u) ? "" : " · no cubre el turno"}`}
              </div>
            </button>
          );
        })}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ── trenes ─────────────────────────────────────────────────── */

function Trenes({ g, setRotarDe, setTrenSel, setVolverA, setApartarDe, setSuprimirDe, setReponerDe, setApartaderoDe, setUnidadSel, verEnMapa }) {
  /* Valoraciones del maquinista, desplegables desde su nombre. Se guarda solo
     cuál está abierta: al cambiar de pantalla el componente se desmonta y se
     ocultan solas.                                                       */
  const [verMaq, setVerMaq] = useState(null);
  /* Al cerrarse, el bloque sigue montado un instante para que se vea salir:
     si se desmonta en el acto desaparece de golpe y el gesto queda cojo.
     Se mantienen abiertas hasta que se vuelve a pulsar el nombre.       */
  const [cerrando, setCerrando] = useState(null);
  const alternarMaq = (i) => {
    setCerrando(verMaq);
    setVerMaq(verMaq === i ? null : i);
    setTimeout(() => setCerrando(null), 280); // algo más que la animación de cierre
  };
  /* Índice de maquinistas por identificador: cada ficha lo buscaba recorriendo
     la plantilla entera, y con trece fichas y cuarenta y seis maquinistas eso
     son seiscientas comparaciones por refresco.                          */
  const porId = {};
  for (const m of g.personal) porId[m.id] = m;

  return (
    <div>
      {g.trenes.map((t) => {
        const s = situacion(t, g.reloj);
        const m = t.maq ? porId[t.maq] : null;
        const supr = t.estado === "suprimido";
        const borde = supr ? P.rule : t.retenido || t.excesoAutorizado ? P.alert : t.detenido || t.esperaCab || t.retraso > 8 ? P.warn : P.rule;

        const txt = t.vacio && !supr
          ? `En vacío hacia ${t.supresion ? ESTACIONES[t.supresion.idx].corto : "la primera vía libre"}`
          : supr
          ? t.reponer
            ? `Repone en ${(ESTACIONES[t.reponer.idx] || {}).corto || "destino"} a las ${hhmm(t.reponer.cuando)}`
            : "Sin material · circulación libre"
          : t.enDesviada
          ? `Apartado en ${ESTACIONES[t.enDesviada.idx].corto}`
          : t.rotando
          ? `Rotando en ${ESTACIONES[t.rotando.idx].corto} · ${t.rotando.restante} min`
          : t.retenido
          ? `Retenido en ${t.retenido}`
          : t.esperaCruce
          ? `Esperando cruce en ${ESTACIONES[t.esperaCruce.idx].corto}`
          : t.esperaCab
          ? `Esperando vía en ${t.esperaCab.cab}`
          : t.detenido
          ? `Detenido · ${t.detenido.restante} min`
            : t.bloqueadoPor && g.trenes.some((x) => x.i === t.bloqueadoPor)
            ? `${describir(s)} · detrás del ${numeroTren(g.trenes.find((x) => x.i === t.bloqueadoPor), g.reloj)}`
            : describir(s);
        return (
          /* El navegador se salta el trabajo de las fichas que quedan fuera
             de la pantalla. Con trece fichas de 214 px solo caben tres o
             cuatro a la vez: el resto no necesita medirse ni pintarse en cada
             refresco, que era el grueso del coste de esta pantalla.     */
          <div
            key={t.i}
            style={{
              ...ST.card,
              borderColor: borde,
              padding: 12,
              marginBottom: 8,
              opacity: supr ? 0.5 : 1,
              contentVisibility: "auto",
              containIntrinsicSize: "0 214px",
            }}
          >
            <div onClick={() => { setVolverA(null); setTrenSel(t.i); }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              {/* la flecha representa la posición, así que lleva al mapa;
                  el resto de la ficha sigue abriendo el perfil del tren */}
              <div
                onClick={(ev) => {
                  ev.stopPropagation();
                  verEnMapa(t.i);
                }}
                title="Ver en el mapa"
                style={{
                  cursor: "pointer",
                  width: 25,
                  height: 30,
                  background: supr || t.rotando || t.detenido || t.esperaCab ? P.muted : t.esVacio ? P.solido : COLOR.rojo,
                  clipPath: supr || t.rotando || t.detenido || t.esperaCab ? "none" : s.dir === "pio" ? CLIP_SUBE : CLIP_BAJA,
                  borderRadius: R.menudo,
                  color: P.blanco,
                  fontSize: T.aux,
                  fontWeight: 800,
                  fontFamily: MONO,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: s.dir === "pio" ? 6 : 0,
                  paddingBottom: s.dir === "pio" ? 0 : 6,
                  flexShrink: 0,
                }}
              >
                {numCorto(t, g.reloj)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 20 }}>
                  <span
                    style={{
                      fontSize: T.menor,
                      fontWeight: 700,
                      color: P.blanco,
                      background: t.esVacio ? P.solido : LIN[LINEA],
                      borderRadius: R.menudo,
                      padding: "1px 5px",
                      fontFamily: MONO,
                      flexShrink: 0,
                    }}
                  >
                    {t.esVacio ? "MV" : LINEA}
                  </span>
                  <span style={{ fontSize: T.alto, fontWeight: 800, fontFamily: MONO, letterSpacing: -0.4 }}>{numeroTren(t, g.reloj)}</span>
                  <span style={{ fontSize: T.micro, color: P.muted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                    {t.esVacio ? "material vacío" : `circ. ${t.i}`}
                  </span>
                </div>
                {/* Altura de línea cerrada. La flecha → no existe en Archivo y el
                    navegador la toma de otra tipografía con métricas mayores: al
                    pasar de "En Pozuelo" a "Pozuelo → El Barrial" la caja crecía
                    y empujaba hacia abajo todo lo que va debajo.            */}
                <div
                  style={{
                    fontSize: T.base,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: 4,
                    lineHeight: "16px",
                    height: 16,
                  }}
                >
                  {txt}
                </div>
                <div style={{ fontSize: T.menor, color: P.muted, fontFamily: MONO, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "15px", height: 15 }}>
                  {t.unidades.length === 0 && "sin material"}
                  {t.unidades.map((u, k) => (
                    <span key={u.id}>
                      {k > 0 && " + "}
                      <span
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setUnidadSel(u.id);
                        }}
                        // pulsable, pero sin subrayado: en un listado denso el
                        // punteado ensuciaba más de lo que orientaba
                        style={{ cursor: "pointer", color: P.ink }}
                      >
                        {u.id}
                      </span>
                    </span>
                  ))}
                </div>
                {!supr && (() => {
                  const ab = t.pax.reduce((a, b) => a + b, 0);
                  const cap = plazasDe(t) || 1;
                  const oc = Math.min(100, (ab / cap) * 100);
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      {/* anchos cerrados: la cifra crece de 980 a 1.234 y antes
                          encogía la barra y desplazaba todo lo de al lado */}
                      <div style={{ width: 110, height: 4, background: P.sunken, borderRadius: R.hilo, overflow: "hidden", flexShrink: 0 }}>
                        <div style={{ width: `${oc}%`, height: "100%", background: colOcupacion(oc) }} />
                      </div>
                      <span style={{ fontSize: T.menor, color: P.muted, fontFamily: MONO, whiteSpace: "nowrap" }}>
                        {nf(ab)}/{nf(cap)}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div style={{ fontFamily: MONO, fontSize: T.alto, fontWeight: 700, color: colRetraso(retrasoEfectivo(t)), flexShrink: 0, width: 46, textAlign: "right" }}>
                {supr ? "—" : rt(t.retraso) === 0 ? "0′" : `+${rt(t.retraso)}′`}
              </div>
            </div>

            {(t.rotacion || t.limitacion > 0 || t.retirarCab || t.cambio || t.apartaPaso || t.supresion || t.vacio || t.pendienteApartar || t.carteristas || t.averiaHeredada || t.bloqueadoPor) && (
              <div style={{ marginTop: 12, display: "flex", gap: 4, flexWrap: "nowrap", overflow: "hidden", alignItems: "center" }}>
                {t.rotacion && <Etiqueta txt={`Rotación en ${ESTACIONES[t.rotacion.idx].corto}`} c={P.warn} />}
                {t.limitacion > 0 && <Etiqueta txt={`Marcha limitada +${t.limitacion}′`} c={P.warn} />}
                {t.cambio && <Etiqueta txt={`Cambio de material en ${ESTACIONES[t.cambio.idx].corto}`} c={P.warn} />}
                {t.apartaPaso && <Etiqueta txt={`Se aparta en ${ESTACIONES[t.apartaPaso.idx].corto}`} c={P.warn} />}
                {t.supresion && (
                  <Etiqueta
                    txt={
                      t.supresion.noche
                        ? `Termina ${hhmm(t.supresion.hora)} en ${ESTACIONES[t.supresion.idx].corto}${t.supresion.via ? ` · ${t.supresion.via}` : " · sin vía"}`
                        : `Supresión en ${ESTACIONES[t.supresion.idx].corto}`
                    }
                    c={t.supresion.noche && !t.supresion.via ? P.warn : P.alert}
                  />
                )}
                {t.esVacio ? (
                  <Etiqueta txt={`Material en vacío · a ${t.supresion ? (t.supresion.aTaller ? t.supresion.dep : ESTACIONES[t.supresion.idx].corto) : "destino"}`} c={P.ink} />
                ) : (
                  t.vacio && <Etiqueta txt={t.pendienteApartar ? "En vacío · sin destino" : "En vacío · bypass de puertas"} c={P.alert} />
                )}
                {t.bloqueadoPor &&
                  g.trenes.some((x) => x.i === t.bloqueadoPor) && (
                    <Etiqueta txt={`Detrás del ${numeroTren(g.trenes.find((x) => x.i === t.bloqueadoPor), g.reloj)}`} c={P.alert} />
                  )}
                {t.retirarCab && <Etiqueta txt="Retirada en cabecera" c={P.alert} />}
                {t.carteristas && <Etiqueta txt="Carteristas a bordo" c={P.alert} />}
                {t.averiaHeredada && <Etiqueta txt={`${t.averiaHeredada} sin reparar`} c={P.warn} />}
              </div>
            )}

            {!supr && m && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.sunken}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <button
                    onClick={() => alternarMaq(t.i)}
                    title="Ver valoraciones"
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      fontSize: T.aux,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {m.nombre}
                    <Media m={m} />
                  </button>
                  <div style={{ fontSize: T.aux, color: t.excesoAutorizado ? P.alert : P.muted }}>
                    {t.excesoAutorizado ? "Conduciendo por encima del límite" : t.relevo ? `Relevo ${hhmm(t.relevo.prevista)} · ${t.relevo.cab}` : "Sin relevo en el turno"}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO }}>{dur(m.cond)}</div>
                  <div style={{ width: 56, height: 4, background: P.sunken, borderRadius: R.hilo, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ width: `${Math.min(100, (m.cond / COND_MAX) * 100)}%`, height: "100%", background: nivelCol(m.cond / COND_MAX, 0.75, 0.92) }} />
                  </div>
                </div>
              </div>
            )}

            {/* Valoraciones del maquinista. Se montan solo al abrirlas: tener
                los trece bloques siempre presentes, aunque plegados, era
                trabajo que se rehacía en cada refresco sin que nadie lo
                viera.                                                    */}
            {!supr && m && (verMaq === t.i || cerrando === t.i) && <Atributos m={m} plegable saliendo={cerrando === t.i && verMaq !== t.i} />}

            {/* las tres acciones de mando siempre presentes mientras circule */}
            {!supr && (
              <AccionesTren
                t={t}
                supr={supr}
                dir={s.dir}
                onRotar={() => setRotarDe(t.i)}
                onApartar={() => setApartarDe(t.i)}
                onSuprimir={() => setSuprimirDe(t.i)}
              />
            )}

            {/* y, además, el destino de estacionamiento cuando procede */}
            {!supr && (t.pendienteApartar || t.supresion || t.retirarCab) && (
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  setApartaderoDe(t.i);
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  background: P.surface,
                  color: t.supresion && t.supresion.via ? P.warn : P.alert,
                  border: `1px solid ${t.supresion && t.supresion.via ? P.warn : P.alert}`,
                  borderRadius: R.normal,
                  padding: "8px 0",
                  fontFamily: "inherit",
                  fontSize: T.aux,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.supresion && t.supresion.via
                  ? `Se aparta en ${ESTACIONES[t.supresion.idx].corto} · ${t.supresion.via}`
                  : t.supresion
                  ? `Elegir vía en ${ESTACIONES[t.supresion.idx].corto}`
                  : t.retirarCab
                  ? "Elegir dónde apartar en vez de en cabecera"
                  : "Elegir dónde apartar el material"}
              </button>
            )}

            {supr && (
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  setReponerDe(t.i);
                }}
                disabled={!!t.reponer}
                style={{ width: "100%", marginTop: 8, background: P.surface, color: t.reponer ? P.muted : P.ok, border: `1px solid ${t.reponer ? P.sunken : P.ok}`, borderRadius: R.normal, padding: "9px 0", fontFamily: "inherit", fontSize: T.base, fontWeight: 700, cursor: t.reponer ? "default" : "pointer" }}
              >
                {t.reponer ? `Repone a las ${hhmm(t.reponer.cuando)} en ${(ESTACIONES[t.reponer.idx] || {}).corto || "destino"}` : "Reponer circulación"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectorRotacion({ g, setG, i, close }) {
  const t = g.trenes.find((x) => x.i === i);
  const s = situacion(t, g.reloj);
  const cands = candidatosRotacion(t, g.reloj, g.restricciones, g);
  const destino = s.dir === "alcala" ? ALCALA : PIO;

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "78vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Rotación del {numeroTren(t, g.reloj)}</div>
        <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>{retTxt(retrasoEfectivo(t))} hacia {destino}</div>
        <div style={{ fontSize: T.base, color: P.muted, marginBottom: 16, lineHeight: 1.45 }}>
          Termina recorrido antes de la cabecera e invierte allí para que la vuelta salga en hora, tomando el número de tren que corresponda. Solo en
          estaciones con cambio de agujas y con al menos {MIN_ANTELACION} min de antelación, que es lo que se tarda en preparar el itinerario. Si el
          ahorro supera al retraso, el tren espera en andén hasta la hora de su nueva marcha.
        </div>
        {cands.length === 0 && (
          <div style={{ fontSize: T.base, color: P.alert, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", marginBottom: 12 }}>
            No hay estaciones con cambio de agujas por delante en este momento.
          </div>
        )}
        {cands.length > 0 && (
          <div style={{ fontSize: T.aux, color: P.muted, background: P.sunken, borderRadius: R.normal, padding: "8px 10px", marginBottom: 12, lineHeight: 1.45 }}>
            Sin tocar nada, la rotación de {cands[0].cabecera} ya absorbe hasta{" "}
            <strong style={{ color: P.ink }}>{cands[0].absorbe} min</strong>: saldría{" "}
            <strong style={{ color: cands[0].siSigue > 0 ? P.warn : P.ok }}>{retTxt(cands[0].siSigue)}</strong>. Rotar antes solo compensa si mejora eso.
          </div>
        )}

        {cands.map((c) => (
          <button
            key={c.idx}
            disabled={c.tarde}
            onClick={() => {
              setG((p) => ({ ...p, trenes: p.trenes.map((x) => (x.i === i ? { ...x, rotacion: { idx: c.idx, q: c.q, ahorro: c.ahorro, sinServicio: c.sinServicio, delta: c.delta } } : x)) }));
              close();
            }}
            style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${!c.tarde && c.gana > 0 ? P.rule : P.sunken}`, borderRadius: R.normal, padding: "11px 12px", marginBottom: 8, fontFamily: "inherit", cursor: c.tarde ? "not-allowed" : "pointer", color: P.ink, opacity: c.tarde ? 0.4 : c.gana > 0 ? 1 : 0.6 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: T.alto, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</span>
              <span style={{ fontSize: T.base, fontWeight: 700, color: c.tarde ? P.alert : c.gana > 0 ? P.ok : P.muted, fontFamily: MONO, flexShrink: 0 }}>
                {c.tarde ? "sin margen" : c.gana > 0 ? `gana ${c.gana}′` : "sin ganancia"}
              </span>
            </div>
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>
              paso en {c.eta} min ·{" "}
              <span style={{ color: nivelCol(c.espera, ...UMBRAL.espera), fontWeight: c.espera > 15 ? 700 : 400 }}>
                {c.espera} min de maniobra
              </span>{" "}
              · reanuda <span style={{ color: c.trasRotar > 0 ? P.warn : P.ok, fontWeight: 600 }}>{retTxt(c.trasRotar)}</span>
            </div>
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>
              deja {c.sinServicio} estación{c.sinServicio !== 1 ? "es" : ""} sin servicio hasta {c.cabecera}
            </div>
          </button>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function SelectorApartado({ g, setG, i, close }) {
  const t = g.trenes.find((x) => x.i === i);
  const v = vecinos(g, t);
  const ests = estacionesParaApartar(g, t);
  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 62 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "78vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Adelantamiento</div>
        <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>
          Apartar el {numeroTren(t, g.reloj)}
        </div>
        <div style={{ fontSize: T.base, color: P.muted, marginBottom: 16, lineHeight: 1.45 }}>
          {v.detras
            ? `El ${numeroTren(v.detras, g.reloj)} viene ${Math.round(v.dDetras)} min por detrás${
                v.dDetras > 12 ? " y de momento no le alcanza" : " y no puede adelantar en vía"
              }. Apartando este tren a una vía desviada, el de atrás pasa por la general.`
            : "Ahora mismo no hay ningún tren por detrás en este sentido: apartarse solo serviría para perder tiempo."}
        </div>
        {ests.length === 0 && (
          <div style={{ fontSize: T.base, color: P.alert, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", marginBottom: 12 }}>
            No hay estaciones con vía desviada libre por delante.
          </div>
        )}
        {ests.map((e) => (
          <button
            key={e.idx}
            onClick={() => {
              setG((p) => aplicar(clonar(p), { apartarPaso: { i, idx: e.idx, quien: v.detras ? v.detras.i : null } }));
              close();
            }}
            style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "11px 12px", marginBottom: 8, fontFamily: "inherit", cursor: "pointer", color: P.ink }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: T.alto, fontWeight: 600 }}>{e.nombre}</span>
              <span style={{ fontSize: T.base, color: P.muted, fontFamily: MONO }}>llega en {e.eta} min</span>
            </div>
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>
              {e.libres.length > 1 ? `${e.libres.length} vías libres: ${e.libres.join(", ")}` : e.via} · +2 min de entrada y +2 de salida, más la espera
              hasta que pase el de atrás
            </div>
          </button>
        ))}
        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ── personal ───────────────────────────────────────────────── */

function Personal({ g }) {
  const [info, setInfo] = useState(null);
  const verInfo = (k) => setInfo((x) => (x === k ? null : k));
  /* Los grupos se pliegan. Con cuarenta y seis maquinistas, tener todas las
     fichas y sus valoraciones desplegadas eran cientos de elementos que se
     rehacían en cada refresco, y la pantalla se volvía pesada de manejar.
     Arrancan abiertos los dos que importan durante la partida.          */
  const [abiertos, setAbiertos] = useState({ Conduciendo: true, "Nominales pendientes de entrar": true });
  const plegar = (k) => setAbiertos((x) => ({ ...x, [k]: !x[k] }));
  /* Una sola pasada por la plantilla en vez de diez: con cuarenta y seis
     maquinistas, recorrerla una vez por grupo multiplicaba el trabajo en
     cada refresco.                                                       */
  const grupos = (() => {
    const cubo = { conduciendo: [], entrante: [], enViaje: [], acompanante: [], maniobras: [], descanso: [], fin: [] };
    const reservas = { [CHAMARTIN]: [], [ALCALA]: [], [PIO]: [] };
    /* La bolsa común va aparte del personal de la línea, así que hay que
       recorrer las dos: si no, la pantalla mostraba cero reservas.     */
    for (const m of [...g.personal, ...(g.reservaPersonal || [])]) {
      if (m.tipo === "reserva" && m.estado === "reserva") {
        if (reservas[m.lugar]) reservas[m.lugar].push(m);
      } else if (m.tipo === "nominal" && m.estado === "entrante") cubo.entrante.push(m);
      else if (cubo[m.estado]) cubo[m.estado].push(m);
    }
    return [
      ["Conduciendo", cubo.conduciendo],
      ["Nominales pendientes de entrar", cubo.entrante],
      [`Reserva en ${CHAMARTIN}`, reservas[CHAMARTIN]],
      [`Reserva en ${ALCALA}`, reservas[ALCALA]],
      [`Reserva en ${PIO}`, reservas[PIO]],
      // maquinistas que van de viajero a hacerse cargo de material apartado
      ["De viajero hacia el material", cubo.enViaje],
      ["Agente acompañante", cubo.acompanante],
      ["En maniobras", cubo.maniobras],
      ["En descanso", cubo.descanso],
      ["Jornada finalizada", cubo.fin],
    ];
  })();
  return (
    <div>
      <div style={{ ...ST.card, padding: "9px 11px", marginBottom: 12, fontSize: T.aux, color: P.muted, lineHeight: 1.45 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => verInfo("relevos")}
            style={{
              background: info === "relevos" ? P.solido : P.surface,
              color: info === "relevos" ? P.blanco : P.ink,
              border: `1px solid ${info === "relevos" ? P.ink : P.rule}`,
              borderRadius: "50%",
              width: 24,
              height: 24,
              fontSize: T.aux,
              fontWeight: 700,
              fontFamily: FUENTE,
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Cómo funcionan los relevos"
          >
            i
          </button>
          <span style={{ fontSize: T.aux }}>Relevos y jornada</span>
        </div>

        {info === "relevos" && (
          <div style={{ marginTop: 8, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", lineHeight: 1.5 }}>
            La mayor parte de los maquinistas son de la cabecera de <strong style={{ color: P.ink }}>Chamartín</strong> y ahí se realizan prácticamente
            todos los relevos. Sin embargo, también habrá relevos de forma puntual en las cabeceras de Alcalá y Príncipe Pío.
            <div style={{ marginTop: 8 }}>
              <strong style={{ color: P.alert }}>IMPORTANTE:</strong> la jornada de conducción continuada no puede superar por reglamento las 5 horas y
              30 minutos. Si se realiza un descanso de 45 minutos, se puede alargar hasta las 9 horas de conducción.
            </div>
          </div>
        )}

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.sunken}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(INFO_ATRIB).map((k) => (
            <button
              key={k}
              onClick={() => verInfo(k)}
              style={{
                background: info === k ? P.solido : P.surface,
                color: info === k ? P.blanco : P.ink,
                border: `1px solid ${info === k ? P.ink : P.rule}`,
                borderRadius: R.pastilla,
                padding: "3px 10px",
                fontSize: T.aux,
                fontWeight: 700,
                fontFamily: MONO,
                cursor: "pointer",
              }}
            >
              {INFO_ATRIB[k].k}
            </button>
          ))}
          <button
            onClick={() => verInfo("todos")}
            style={{
              background: info === "todos" ? P.solido : P.surface,
              color: info === "todos" ? P.blanco : P.ink,
              border: `1px solid ${info === "todos" ? P.ink : P.rule}`,
              borderRadius: "50%",
              width: 24,
              height: 24,
              fontSize: T.aux,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              lineHeight: 1,
            }}
            title="Qué significa cada atributo"
          >
            i
          </button>
          <span style={{ fontSize: T.aux }}>La pastilla junto al nombre es la media de los tres.</span>
        </div>
        {/* solo se pintan claves de atributo: "relevos" tiene su propio panel */}
        {(info === "todos" || INFO_ATRIB[info]) && (
          <div style={{ marginTop: 8, background: P.sunken, borderRadius: R.normal, padding: "9px 11px" }}>
            {(info === "todos" ? Object.keys(INFO_ATRIB) : [info])
              .filter((k) => INFO_ATRIB[k])
              .map((k) => (
                <div key={k} style={{ marginBottom: info === "todos" ? 8 : 0, lineHeight: 1.45 }}>
                  <strong style={{ color: P.ink }}>{INFO_ATRIB[k].n}</strong>: {INFO_ATRIB[k].t}
                </div>
              ))}
          </div>
        )}
      </div>
      {grupos.map(([titulo, lista]) => (
        <div key={titulo} style={{ marginBottom: 12 }}>
          <button
            onClick={() => plegar(titulo)}
            style={{
              all: "unset",
              cursor: "pointer",
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: T.aux,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: P.muted,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            <span style={{ display: "inline-block", width: 10, transform: abiertos[titulo] ? "rotate(90deg)" : "none", transition: "transform .15s ease" }}>›</span>
            {titulo} · {lista.length}
          </button>
          {abiertos[titulo] && lista.length === 0 && <div style={{ fontSize: T.base, color: P.muted, paddingLeft: 2 }}>—</div>}
          {abiertos[titulo] &&
            lista.map((m) => (
            <div key={m.id} style={{ ...ST.card, padding: "9px 11px", marginBottom: 4, contentVisibility: "auto", containIntrinsicSize: "0 92px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: T.base, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  {m.nombre}
                  <Media m={m} />
                  {m.baja && <span style={{ color: P.alert, fontSize: T.aux }}>indispuesto</span>}
                </span>
                <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO }}>
                  {m.estado === "conduciendo" || m.estado === "acompanante"
                    ? `circ. ${m.tren}`
                    : m.estado === "descanso"
                    ? `${m.descanso} min`
                    : m.estado === "entrante"
                    ? `${hhmm(m.entra)} · ${m.lugar}`
                    : ""}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 4, background: P.sunken, borderRadius: R.hilo, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (m.jornada / JORNADA_MAX) * 100)}%`, height: "100%", background: nivelCol(m.jornada / JORNADA_MAX, ...UMBRAL.jornada) }} />
                </div>
                <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO }}>{dur(m.jornada)}</span>
              </div>
              <Atributos m={m} onInfo={verInfo} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── mapa ───────────────────────────────────────────────────── */


function Mapa({ g, detalle, setDetalle, setEstSel, setTrenSel, setVolverA, foco, setFoco }) {
  // el realce se mantiene hasta que se toca el mapa, no se apaga solo
  const quitarFoco = () => foco && setFoco(null);
  // los tres desplegables de consulta: solo uno abierto a la vez
  const [panel, setPanel] = useState(null);
  const abrir = (k) => setPanel((x) => (x === k ? null : k));
  /* Al llegar desde la flecha de un tren se centra la vista en su posición.
     El aviso se borra en cuanto se ha usado, para no volver a arrastrar la
     pantalla en cada minuto de simulación.                              */
  useEffect(() => {
    if (!foco) return;
    const el = document.getElementById(`mapa-tren-${foco}`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [foco]);

  const ALTO = detalle ? 50 : 30;
  const BANDA = 30;
  const GUT = 82; // canalón de vía: deja sitio al punto de retraso
  const VIA_A = 24;
  const VIA_B = 44;
  /* Un solo grosor para todo lo que es línea: las dos vías, el contorno de
     las estaciones y la barra de los apeaderos. Antes convivían cinco valores
     distintos (3, 4, 5, 5,5 y 7) para representar lo mismo, y el esquema se
     veía desigual.                                                       */
  const TRAZO = 4;

  const ys = [];
  const bandas = [];
  let y = 10;
  for (let i = 0; i < N; i++) {
    if (BANDAS[i]) {
      bandas.push({ ...BANDAS[i], y });
      y += BANDA;
    }
    ys.push(y + ALTO / 2);
    y += ALTO;
  }
  const H = y + 10;
  const yDe = (idx) => {
    const a = Math.floor(idx);
    const b = Math.min(N - 1, a + 1);
    return ys[a] + (idx - a) * (ys[b] - ys[a]);
  };

  const activos = g.trenes.filter((t) => t.estado !== "suprimido").map((t) => ({ ...t, s: situacionVis(t, g) }));

  return (
    <div onPointerDown={quitarFoco}>
      {/* La leyenda se consulta una vez y estorba el resto del tiempo: ocupaba
          cuatro líneas encima del mapa en cada partida.                  */}
      {/* Tres botones iguales repartidos a lo ancho. Solo se abre uno a la vez:
          apilar los tres desplazaría el mapa fuera de la pantalla.       */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[
          { k: "info", l: "Info de línea", activo: panel === "info", pulsa: () => abrir("info") },
          { k: "leyenda", l: "Leyenda", activo: panel === "leyenda", pulsa: () => abrir("leyenda") },
          // al revés que los otros: negro cuando están ocultas, gris al mostrarlas
          { k: "corresp", l: "Correspondencias", activo: !detalle, pulsa: () => setDetalle(!detalle) },
        ].map((b2) => (
          <button
            key={b2.k}
            onClick={b2.pulsa}
            style={{
              flex: 1,
              minWidth: 0,
              background: b2.activo ? P.solido : P.surface,
              color: b2.activo ? P.blanco : P.ink,
              border: `1px solid ${b2.activo ? P.ink : P.rule}`,
              borderRadius: R.normal,
              padding: "7px 4px",
              fontFamily: "inherit",
              fontSize: T.aux,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {b2.l}
          </button>
        ))}
      </div>

      {panel === "info" && <InfoLinea />}

      {panel === "leyenda" && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 8, display: "flex", gap: 12, fontSize: T.aux, color: P.muted, flexWrap: "wrap", animation: "cgo-entra .2s ease-out" }}>

          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* los símbolos de la leyenda usan el mismo trazo que el esquema */}
            <span style={{ width: 18, height: 10, border: `3px solid ${COLOR.rojo}`, borderRadius: R.pastilla, display: "inline-block", background: P.surface, boxSizing: "border-box" }} /> estación
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 18, height: 3, background: COLOR.rojo, borderRadius: R.hilo, display: "inline-block" }} /> apeadero
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 13, background: COLOR.rojo, clipPath: CLIP_BAJA, display: "inline-block" }} /> Alcalá
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 13, background: COLOR.rojo, clipPath: CLIP_SUBE, display: "inline-block" }} /> P. Pío
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>⇄ vía desviada</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 3, height: 12, background: `repeating-linear-gradient(180deg, ${P.surface} 0 3px, ${P.warn} 3px 7px)`, display: "inline-block" }} /> vía única
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.ok, display: "inline-block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.warn, display: "inline-block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.alert, display: "inline-block" }} /> retraso
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: T.micro, fontWeight: 700, color: P.blanco, background: P.solido, borderRadius: R.menudo, padding: "1px 5px", fontFamily: MONO }}>●2</span>
            <span style={{ fontSize: T.micro, fontWeight: 700, color: P.blanco, background: P.alert, borderRadius: R.menudo, padding: "1px 5px", fontFamily: MONO }}>●0</span>
            maquinistas de reserva
          </span>
        </div>
      )}

      <div style={{ ...ST.card, position: "relative", height: H, overflow: "hidden" }}>
        {/* Tramo soterrado del túnel de la Risa, de Chamartín a Atocha. Los
            índices iban escritos a mano y al añadir los puestos de circulación
            pasaron a señalar de Ramón y Cajal a Recoletos. Se centra sobre las
            dos vías en vez de ir a la izquierda del todo.                  */}
        {(() => {
          const a = ESTACIONES.findIndex((e) => e.sot);
          const b = N - 1 - [...ESTACIONES].reverse().findIndex((e) => e.sot);
          const ini = Math.max(0, a - 1); // arranca en la estación anterior: Chamartín
          const ancho = VIA_B + TRAZO - VIA_A + 24; // envuelve también las cápsulas
          return (
            <div
              style={{
                position: "absolute",
                left: VIA_A + (VIA_B + TRAZO - VIA_A) / 2 - ancho / 2,
                top: ys[ini],
                width: ancho,
                height: ys[b] - ys[ini],
                background: P.sunken,
                // contorno tenue: se lee como recinto y no como mancha
                border: `1px solid ${P.rule}`,
                borderRadius: R.normal,
                boxSizing: "border-box",
              }}
            />
          );
        })()}
        {/* las dos vías, del mismo color: el sentido lo marcan los trenes */}
        {[VIA_A, VIA_B].map((x) => (
          <div key={x} style={{ position: "absolute", left: x, top: ys[0], width: TRAZO, height: ys[N - 1] - ys[0], background: COLOR.rojo, borderRadius: R.hilo }} />
        ))}

        {/* tramos en vía única: la vía cortada se dibuja interrumpida */}
        {tramosUnicos(g).map((rest, k) => {
          const x = rest.dir === "alcala" ? VIA_A : VIA_B;
          return (
            <div
              key={`vu${k}`}
              style={{
                position: "absolute",
                left: x,
                top: ys[rest.tramo.a],
                width: TRAZO,
                height: ys[rest.tramo.b] - ys[rest.tramo.a],
                background: `repeating-linear-gradient(180deg, ${P.surface} 0 4px, ${P.warn} 4px 10px)`,
                borderRadius: R.hilo,
                // por encima del trazado, para que se vea que corta la vía
                zIndex: 2,
                boxShadow: `0 0 0 1px ${P.surface}`,
              }}
            />
          );
        })}

        {bandas.map((b) => (
          <div key={b.n} style={{ position: "absolute", left: GUT, top: b.y, right: 0, height: BANDA, paddingRight: 12, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <span style={{ fontSize: T.micro, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{b.n}</span>
              <span style={{ height: 1, background: P.rule, flex: 1 }} />
              <span style={{ fontSize: T.micro, color: P.muted, whiteSpace: "nowrap" }}>{b.d}</span>
            </div>
          </div>
        ))}

        {ESTACIONES.map((e, i) => {
          /* Las tres marcas miden exactamente lo que ocupa el trazado, de
             borde a borde de las dos vías, y se diferencian por la altura y
             el relleno. Antes tenían anchos sueltos y sobresalían del propio
             trazado, que es lo que hacía que el esquema se viera torcido. */
          const cab = !!e.cab || !!e.term;
          const ap = e.tipo === "ap";
          /* La cápsula envuelve las dos vías y sobresale a cada lado, con el
             centro en blanco. El apeadero, en cambio, queda al ras del
             trazado: la diferencia de ancho es parte de la jerarquía.    */
          const trazado = VIA_B + TRAZO - VIA_A;
          const w = ap ? trazado : trazado + 8;
          const hh = ap ? TRAZO : cab ? 20 : 14;
          const cx = VIA_A + trazado / 2;
          const libres = e.cab ? reservasVisibles(g, e.cab) : 0;
          const rest = g.restricciones.find((x) => x.idx === i);
          const col = rest ? P.warn : COLOR.rojo;
          return (
            <div key={e.n}>
              <div
                style={{
                  position: "absolute",
                  left: cx - w / 2,
                  top: ys[i] - hh / 2,
                  width: w,
                  height: hh,
                  // el apeadero es una barra maciza; el resto, un anillo hueco
                  background: ap ? col : P.surface,
                  border: ap ? "none" : `${TRAZO}px solid ${col}`,
                  borderRadius: ap ? R.hilo : R.pastilla,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => setEstSel(i)}
                style={{ all: "unset", cursor: "pointer", position: "absolute", left: GUT, top: ys[i] - ALTO / 2, height: ALTO, right: 0, paddingRight: 12, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, boxSizing: "border-box" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      /* Jerarquía también en el rótulo: la cabecera manda, la
                         estación es el cuerpo del listado y el apeadero queda
                         en segundo plano. Los puestos sin servicio comercial
                         se distinguen por la cursiva.                    */
                      fontSize: cab ? T.alto : T.base,
                      fontWeight: cab ? 700 : 600,
                      letterSpacing: cab ? -0.2 : 0,
                      color: P.ink,
                      fontStyle: e.puesto ? "italic" : "normal",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {e.n}
                  </span>
                  {rest && (
                    <span style={{ fontSize: T.micro, fontWeight: 700, color: P.blanco, background: P.warn, borderRadius: R.menudo, padding: "1px 5px", flexShrink: 0, fontFamily: MONO }}>
                      +{rest.m}′{rest.dir === "alcala" ? " ▼" : rest.dir === "pio" ? " ▲" : ""}
                    </span>
                  )}
                  {e.rot && (
                    <span style={{ fontSize: T.micro, fontWeight: 700, color: P.muted, border: `1px solid ${P.rule}`, borderRadius: R.menudo, padding: "0 4px", flexShrink: 0 }} title="tiene vía desviada: permite rotar o apartar">
                      ⇄
                    </span>
                  )}
                  {/* solo donde de verdad hay bolsa: en el Aeropuerto nunca la hay */}
                  {e.cab && tieneReservas(g, e.cab) && (
                    <span style={{ fontSize: T.micro, fontWeight: 700, color: P.blanco, background: libres ? P.solido : P.alert, borderRadius: R.menudo, padding: "1px 5px", fontFamily: MONO, flexShrink: 0 }}>●{libres}</span>
                  )}
                </div>
                {detalle && (
                  <div style={{ display: "flex", gap: 4, whiteSpace: "nowrap", overflow: "hidden" }}>
                    {e.c.map((l) => <Enlace key={l} txt={l} bg={LIN[l]} />)}
                    {e.metro && <Enlace txt="M" bg={METRO} />}
                    {e.ml && <Enlace txt="ML" bg={ML} />}
                    {/* fondo macizo, no el color del texto: en oscuro quedaba
                        una pastilla clara con el texto blanco encima */}
                    {(g.apartado[i] || []).length > 0 && <Enlace txt={`APART ×${g.apartado[i].length}`} bg={P.solido} />}
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {activos.map((t) => {
          // solo se dibuja centrado quien está invirtiendo: en cabecera o rotando
          const maniobrando = t.rotando || t.enDesviada || t.s.dir === "maniobra";
          // parado en vía: mantiene su vía y su sentido, pero en gris
          const quieto = t.retenido || t.detenido || t.esperaCab || t.esperaCruce;
          // en vía única circula por la contraria
          const contraria = enViaContraria(g, t);
          // la flecha conserva el sentido real; solo cambia la vía que ocupa
          const baja = t.s.dir === "alcala";
          const enViaBaja = contraria ? !baja : baja;
          return (
            <div
              key={t.i}
              onClick={() => {
                setVolverA(null);
                setTrenSel(t.i);
              }}
              style={{
                cursor: "pointer",
                position: "absolute",
                top: yDe(t.s.idx) - 11,
                // centrado en el eje de su vía: la flecha mide 18, no 12
                left: (maniobrando ? VIA_A + (VIA_B + TRAZO - VIA_A) / 2 : (enViaBaja ? VIA_A : VIA_B) + TRAZO / 2) - 9,
                width: 18,
                height: 22,
                // el material en vacío se distingue en negro
                background: maniobrando || quieto ? P.muted : t.esVacio ? P.solido : COLOR.rojo,
                clipPath: maniobrando ? "none" : baja ? CLIP_BAJA : CLIP_SUBE,
                borderRadius: maniobrando ? 4 : 3,
                color: P.blanco,
                fontSize: T.menor,
                fontWeight: 700,
                fontFamily: MONO,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: !maniobrando && baja ? 5 : 0,
                paddingTop: !maniobrando && !baja ? 5 : 0,
                // el tren es lo que se mira: va por encima de vías y paradas
                filter: "drop-shadow(0 2px 3px rgba(10,14,17,.30))",
                /* La animación dura lo mismo que el intervalo de refresco: con 0,12 s y
                   refresco cada 0,06 s, cada posición nueva cortaba la animación
                   anterior a medio camino y el tren avanzaba a tirones.      */
                transition: "top .06s linear",
                zIndex: 5,
              }}
            >
              {numCorto(t, g.reloj)}
            </div>
          );
        })}

        {/* indicador de retraso, pegado a la flecha del tren */}
        {activos.map((t) => {
          const maniobrando = t.rotando || t.enDesviada || t.s.dir === "maniobra";
          const contraria = enViaContraria(g, t);
          // la flecha conserva el sentido real; solo cambia la vía que ocupa
          const baja = t.s.dir === "alcala";
          const enViaBaja = contraria ? !baja : baja;
          const xTren = (maniobrando ? VIA_A + (VIA_B + TRAZO - VIA_A) / 2 : (enViaBaja ? VIA_A : VIA_B) + TRAZO / 2) - 9;
          // sentido Alcalá a la izquierda de la flecha; sentido Pío a la derecha
          const x = enViaBaja ? xTren - 12 : xTren + 19;
          // la punta de la flecha desplaza el número 2,5 px: el círculo se
          // alinea con el número, no con el centro del marcador
          const dy = maniobrando ? 0 : baja ? -2.5 : 2.5;
          return (
            <div
              key={`r${t.i}`}
              id={`mapa-tren-${t.i}`}
              onClick={() => {
                setVolverA(null);
                setTrenSel(t.i);
              }}
              title={`${numeroTren(t, g.reloj)} · ${retTxt(retrasoEfectivo(t))}`}
              style={{
                position: "absolute",
                left: x,
                top: yDe(t.s.idx) + dy - 5.5,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colRetraso(retrasoEfectivo(t)),
                // realce mientras dura el aviso, para localizarlo de un vistazo
                border: foco === t.i ? `2.5px solid ${P.ink}` : "1.5px solid #fff",
                boxSizing: "content-box",
                cursor: "pointer",
                /* La animación dura lo mismo que el intervalo de refresco: con 0,12 s y
                   refresco cada 0,06 s, cada posición nueva cortaba la animación
                   anterior a medio camino y el tren avanzaba a tirones.      */
                transition: "top .06s linear",
                zIndex: 6,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PerfilEstacion({ g, i, close, verTren, moverVacio, maniobrar }) {
  /* Maniobras de composición sobre el material aparcado. Partir una doble deja
     sus dos unidades sueltas en la misma vía, y unir dos sueltas de la misma
     serie forma una doble. Es lo que permite que la C-1, que circula en
     sencillo, aproveche material de la C-7.                            */
  const desacoplarApartado = (idx, via) => maniobrar(idx, via, false);
  const acoplarApartado = (idx, via) => maniobrar(idx, via, true);
  const acoplable = (idx, x) => {
    const lista = (g.apartado || {})[idx] || [];
    const u0 = x.unidades[0];
    if (!u0 || !SERIES[u0.serie].doble) return false;
    return lista.some((y) => y !== x && y.via === x.via && y.unidades.length === 1 && y.unidades[0].serie === u0.serie && !y.averiado);
  };
  const arrastre = useCerrarArrastrando(close);
  const e = ESTACIONES[i];
  const apartado = g.apartado[i] || [];
  const libres = viasLibres(g, i);
  const reservas = e.cab ? reservasEn(g, e.cab) : [];
  const nominales = e.cab ? g.personal.filter((m) => m.tipo === "nominal" && m.estado === "entrante" && m.lugar === e.cab) : [];
  const rest = g.restricciones.find((x) => x.idx === i);
  /* Los destinos salen de los extremos de la línea vigente. Estaban escritos a
     mano con los de la C-7, así que en la C-1 los andenes decían "hacia Alcalá
     de Henares" cuando esa estación no existe en esa línea.           */
  const sentidos = [
    [`hacia ${ALCALA}`, pasoPorEstacion(g, i, "alcala"), "alcala"],
    [`hacia ${PIO}`, pasoPorEstacion(g, i, "pio"), "pio"],
  ];

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 65 }}>
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "84vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out", ...arrastre.style }}
      >
        <Asa arrastre={arrastre.props} close={close} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ ...ST.eyebrow }}>{e.puesto ? "Estación sin servicio comercial" : e.tipo === "est" ? "Estación" : "Apeadero"}</span>
          {e.rot && <span style={{ fontSize: T.micro, fontWeight: 700, color: P.muted, border: `1px solid ${P.rule}`, borderRadius: R.menudo, padding: "0 4px" }}>⇄ posibilidad de rotación</span>}
        </div>
        <div style={{ fontSize: T.cabecera, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>{e.n}</div>
        <div style={{ display: "flex", gap: 4, margin: "7px 0 14px", flexWrap: "wrap" }}>
          <Enlace txt={LINEA} bg={LIN[LINEA]} />
          {e.c.map((l) => <Enlace key={l} txt={l} bg={LIN[l]} />)}
          {e.metro && <Enlace txt="M" bg={METRO} />}
          {e.ml && <Enlace txt="ML" bg={ML} />}
        </div>

        {rest && (
          <div style={{ background: P.sunken, border: `1px solid ${P.warn}`, borderRadius: R.normal, padding: "9px 11px", marginBottom: 16, fontSize: T.base, lineHeight: 1.45 }}>
            <strong>{rest.txt}</strong> · hasta las {hhmm(rest.hasta)}
            {rest.tramo && (
              <div style={{ marginTop: 4 }}>
                Vía única entre <strong>{ESTACIONES[rest.tramo.a].n}</strong> y <strong>{ESTACIONES[rest.tramo.b].n}</strong>. Los trenes de sentido{" "}
                {/* el destino sale de la línea vigente, no de la C-7 */}
                {rest.dir === "alcala" ? ALCALA : PIO} circulan por la contraria y se cruzan en esas estaciones.
              </div>
            )}
          </div>
        )}

        {/* viajeros */}
        {!e.puesto && <Bloque titulo="Viajeros en andén">
          {sentidos.map(([nom, paso, dir], k) => {
            const n = (g.andenes[i] || { alcala: 0, pio: 0 })[dir];
            const bloqueado = (dir === "alcala" && i === N - 1) || (dir === "pio" && i === 0);
            if (bloqueado) return null;
            return (
              <div key={nom} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Enlace txt={LINEA} bg={LIN[LINEA]} />
                    <span style={{ fontSize: T.base, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom}</span>
                  </span>
                  <span style={{ fontSize: T.titulo, fontWeight: 700, fontFamily: MONO, color: nivelCol(n, ...UMBRAL.anden), flexShrink: 0 }}>
                    {nf(n)}
                  </span>
                </div>
                <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2, fontFamily: MONO }}>
                  último tren hace {Math.round(paso.desde)} min · próximo en {Math.round(paso.hasta)} min
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${P.sunken}`, paddingTop: 8, marginTop: 4, fontSize: T.aux, color: P.muted, lineHeight: 1.4 }}>
            Escala de afluencia {e.esc}/5 · llegan {(VIAJEROS_MIN_100 * intensidad(g.reloj) * pesoOrigen(i, marea(g.reloj)) / ESTACIONES.reduce((n2, _, j) => n2 + pesoOrigen(j, marea(g.reloj)), 0)).toFixed(1)} viajeros por minuto
          </div>
        </Bloque>}

        {/* Otras líneas que paran aquí. Una estación como Chamartín tiene gente
            esperando en varios andenes a la vez, y el jugador debe verla toda
            aunque esté mirando una línea concreta.                      */}
        {!e.puesto &&
          Object.keys(g.porLinea || {})
            .filter((id) => id !== (g.linea || LINEAS_EN_JUEGO[0]))
            .map((id) => {
              const L = LINEAS[id];
              const jj = L.estaciones.findIndex((x) => x.n === e.n);
              if (jj < 0) return null;
              const otra = g.porLinea[id];
              const alto = L.estaciones[L.estaciones.length - 1].n;
              const bajo = L.estaciones[0].n;
              const filas = [
                [`hacia ${alto}`, "alcala", jj < L.estaciones.length - 1],
                [`hacia ${bajo}`, "pio", jj > 0],
              ].filter(([, , ok]) => ok);
              return (
                <Bloque key={id} titulo={`Viajeros en andén · ${id}`}>
                  {filas.map(([nom2, dir2], k2) => (
                    <div key={nom2} style={{ background: fondoFila(k2), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <Enlace txt={id} bg={LIN[id]} />
                          <span style={{ fontSize: T.base, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom2}</span>
                        </span>
                        <span style={{ fontSize: T.titulo, fontWeight: 700, fontFamily: MONO }}>
                          {nf(Math.round((otra.andenes[jj] || {})[dir2] || 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </Bloque>
              );
            })}

        {/* material */}
        {viasGenerales(i) && (
          <Bloque titulo="Vías generales">
            {viasGenerales(i).map((v, k) => {
              const prox = proximoPaso(g, i, v.dir);
              return (
                <div key={v.via} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontSize: T.base, fontFamily: MONO, fontWeight: 700 }}>{v.via}</span>
                      <span style={{ fontSize: T.aux, color: P.muted, marginLeft: 8, whiteSpace: "nowrap" }}>
                        {v.paridad} · hacia {v.sentido}
                      </span>
                    </span>
                    {prox && (
                      <FilaVia
                        g={g}
                        tren={prox.t}
                        txt={`pasa en ${Math.round(prox.eta)} min`}
                        col={prox.eta <= 3 ? P.ok : P.muted}
                        fondo={COLOR.rojo}
                        onClick={() => verTren(prox.t.i)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </Bloque>
        )}

        {/* Vías que usan aquí las demás líneas. Una estación como Chamartín la
            comparten varias, y el puesto de mando tiene que ver todo lo que hay
            en ella, no solo lo de la línea que esté mirando.           */}
        {Object.keys(g.porLinea || {})
          .filter((id) => id !== (g.linea || LINEAS_EN_JUEGO[0]))
          .map((id) => {
            const L = LINEAS[id];
            const jj = L.estaciones.findIndex((x) => x.n === e.n);
            if (jj < 0) return null;
            const ee = L.estaciones[jj];
            // solo las de inversión: las de apartado son comunes y van aparte
            const vias = [...(ee.rotVias || [])];
            if (!vias.length) return null;
            const otra = g.porLinea[id];
            return (
              <Bloque key={`v${id}`} titulo={`Vías de la ${id}`}>
                {vias.map((via, k) => {
                  // qué tren de esa línea ocupa esta vía ahora mismo
                  const ocupa = (otra.trenes || []).find(
                    (t) => (t.rotando && t.rotando.idx === jj && t.rotando.via === via) || (t.supresion && t.supresion.idx === jj && t.supresion.via === via)
                  );
                  return (
                    <div key={via} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <Enlace txt={id} bg={LIN[id]} />
                          <span style={{ fontSize: T.base, fontFamily: MONO, fontWeight: 700 }}>{via}</span>
                        </span>
                        <span style={{ fontSize: T.aux, color: ocupa ? P.ink : P.muted, fontWeight: ocupa ? 700 : 400, whiteSpace: "nowrap" }}>
                          {ocupa ? `${numeroTren(ocupa, g.reloj)} · ${ocupa.unidades.map((u) => u.id).join(" + ")}` : "libre"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </Bloque>
            );
          })}

        {e.rotVias && (
        <Bloque titulo={e.paso ? "Vías de paso e inversión" : "Vías desviadas"}>
          {
            estadoViasRot(g, i).map((v, k) => (
              <div key={v.via} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ minWidth: 52, flexShrink: 0 }}>
                    <span style={{ fontSize: T.base, fontFamily: MONO, fontWeight: 700 }}>{v.via}</span>
                    {v.pasoDir && (
                      <span style={{ fontSize: T.menor, color: P.muted, display: "block" }}>
                        {v.pasoDir === "pio" ? "impares" : "pares"}
                      </span>
                    )}
                  </span>
                  {v.pasoTren ? (
                    <FilaVia
                      g={g}
                      tren={v.pasoTren.t}
                      txt={`pasa en ${Math.round(v.pasoTren.eta)} min`}
                      col={v.pasoTren.eta <= 3 ? P.ok : P.muted}
                      fondo={COLOR.rojo}
                      onClick={() => verTren(v.pasoTren.t.i)}
                    />
                  ) : v.tipo === "tren" ? (
                    <FilaVia g={g} tren={v.tren} txt={`sale en ${v.sale} min`} col={P.ok} fondo={COLOR.rojo} onClick={() => verTren(v.tren.i)} />
                  ) : v.tipo === "material" ? (
                    <span style={{ fontSize: T.aux, color: P.warn, fontWeight: 600 }}>material apartado</span>
                  ) : (
                    <span style={{ fontSize: T.aux, color: P.ok, fontWeight: 600 }}>libre</span>
                  )}
                </div>
                {v.prox && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4, paddingLeft: 52 }}>
                    <span style={{ fontSize: T.aux, color: P.muted, flexShrink: 0 }}>siguiente</span>
                    <FilaVia
                      g={g}
                      tren={v.prox.tren}
                      txt={
                        v.prox.conflicto
                          ? `llega en ${v.prox.min} min · sin vía`
                          : `llega en ${v.prox.min} min · saldrá como ${numeroTren(v.prox.tren, g.reloj + v.prox.min + 2)}`
                      }
                      col={v.prox.conflicto ? P.alert : P.warn}
                      fondo={P.muted}
                      onClick={() => verTren(v.prox.tren.i)}
                    />
                  </div>
                )}
              </div>
            ))}
          {e.paso && (
            <>
              {["alcala", "pio"]
                .filter((d) => !e.paso[d])
                .map((d) => {
                  const prox = proximoPaso(g, i, d);
                  return prox ? (
                    <div key={d} style={{ background: fondoFila(e.rotVias.length), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ minWidth: 52, flexShrink: 0 }}>
                        <span style={{ fontSize: T.aux, fontWeight: 700 }}>{d === "pio" ? "impares" : "pares"}</span>
                        <span style={{ fontSize: T.menor, color: P.muted, display: "block" }}>vía s/n</span>
                      </span>
                      <FilaVia g={g} tren={prox.t} txt={`pasa en ${Math.round(prox.eta)} min`} col={prox.eta <= 3 ? P.ok : P.muted} fondo={COLOR.rojo} onClick={() => verTren(prox.t.i)} />
                    </div>
                  ) : null;
                })}
              <div style={{ fontSize: T.aux, color: P.muted, marginTop: 8, lineHeight: 1.4 }}>
                Por estas vías los trenes circulan con carácter normal. Las indicadas son las habituales, pero cualquiera de la{" "}
                {e.rotVias[0].replace("vía ", "")} a la {e.rotVias[e.rotVias.length - 1].replace("vía ", "")} puede emplearse según las necesidades de
                la circulación.
              </div>
            </>
          )}
          {(e.rotDir || (e.apartVias || []).some((v) => e.rotVias.includes(v))) && (
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: 8, lineHeight: 1.4 }}>
              {e.rotDir ? `Solo se invierte en sentido ${e.rotDir === "pio" ? PIO : ALCALA}. ` : ""}
              {(e.apartVias || []).some((v) => e.rotVias.includes(v)) ? "Vías compartidas con el apartadero." : ""}
            </div>
          )}
        </Bloque>
        )}

        {/* Apartadero común. Las vías de apartado no son de ninguna línea en
            concreto: en Chamartín, las M las usan todas para dejar material,
            así que aquí se ve lo que hay de cualquiera de ellas.        */}
        {e.apartVias && (
        <Bloque titulo="Apartadero">
          {(
            <>
              {Object.keys(g.porLinea || {})
                .filter((id) => id !== (g.linea || LINEAS_EN_JUEGO[0]))
                .flatMap((id) => {
                  const L = LINEAS[id];
                  const jj = L.estaciones.findIndex((x) => x.n === e.n);
                  if (jj < 0) return [];
                  const lista = (g.porLinea[id].apartado || {});
                  return Object.entries(lista)
                    .filter(([k2]) => k2.startsWith(`${jj}|`))
                    .flatMap(([k2, arr]) => (arr || []).map((x) => ({ ...x, linea: id, via: k2.split("|")[1] })));
                })
                .map((x, k) => (
                  <div key={`o${k}`} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <Enlace txt={x.linea} bg={LIN[x.linea]} />
                        <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO }}>{x.unidades.map((u) => u.id).join(" + ")}</span>
                      </span>
                      <span style={{ fontSize: T.aux, color: P.muted }}>{x.via}</span>
                    </div>
                    <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>Material de la {x.linea} · no se gestiona desde aquí</div>
                  </div>
                ))}

              {apartado.map((x, k) => (
                <div key={k} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO }}>{x.unidades.map((u) => u.id).join(" + ")}</span>
                    <span style={{ fontSize: T.aux, color: P.muted }}>{x.via}</span>
                  </div>
                  <div style={{ fontSize: T.aux, color: x.averiado ? P.alert : P.muted, marginTop: 2 }}>
                    {x.averiado ? "Averiado · fuera de servicio hasta reparación" : `${nf(x.unidades.reduce((n, u) => n + u.plazas, 0))} plazas · disponible`} ·
                    desde las {hhmm(x.desde)}
                  </div>
                  {/* Maniobras sobre el material aparcado: partir una doble
                      para que una unidad pueda cubrir una línea que circula en
                      sencillo, o unir dos sueltas de la misma serie.    */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {x.unidades.length > 1 && !x.averiado && (
                      <button
                        onClick={() => desacoplarApartado(i, x.via)}
                        style={{ flex: 1, background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "6px 0", fontFamily: "inherit", fontSize: T.aux, fontWeight: 600, cursor: "pointer" }}
                      >
                        Desacoplar
                      </button>
                    )}
                    {x.unidades.length === 1 && !x.averiado && acoplable(i, x) && (
                      <button
                        onClick={() => acoplarApartado(i, x.via)}
                        style={{ flex: 1, background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "6px 0", fontFamily: "inherit", fontSize: T.aux, fontWeight: 600, cursor: "pointer" }}
                      >
                        Acoplar
                      </button>
                    )}
                  </div>
                  {/* llevar el material a otro sitio con una marcha en vacío */}
                  <button
                    onClick={() => moverVacio(x.via)}
                    style={{ width: "100%", marginTop: 8, background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "6px 0", fontFamily: "inherit", fontSize: T.aux, fontWeight: 700, cursor: "pointer" }}
                  >
                    Mover en vacío
                  </button>
                </div>
              ))}
              {apartado.length === 0 && <Vacio icono="⊘" txt="Sin material apartado" pista="Puedes estacionar composiciones aquí desde el perfil de una estación." />}
              <div style={{ borderTop: `1px solid ${P.sunken}`, paddingTop: 8, marginTop: 4, fontSize: T.base }}>
                <span style={{ color: P.muted }}>{e.apartSeries ? `Solo serie ${e.apartSeries.join("/")} · ` : ""}Vías libres: </span>
                {libres.length ? (
                  <span style={{ fontFamily: MONO, fontWeight: 600 }}>{libres.join(", ")}</span>
                ) : (
                  <span style={{ color: P.alert, fontWeight: 600 }}>ninguna</span>
                )}
              </div>
            </>
          )}
        </Bloque>
        )}

        {/* personal */}
        {e.cab && (
          <Bloque titulo="Personal de conducción">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Kpi k="Reservas" v={String(reservas.length)} c={reservas.length ? P.ok : P.alert} small />
              <Kpi k="Nominales por entrar" v={String(nominales.length)} c={P.ink} small />
            </div>
            {reservas.map((m, k) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: T.base, padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k), gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {m.nombre}
                  <Media m={m} />
                </span>
                <span style={{ color: P.muted, fontFamily: MONO }}>margen {dur(margenDe(m))}</span>
              </div>
            ))}
            {nominales.map((m, k) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: T.base, padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k + reservas.length), color: P.muted }}>
                <span>{m.nombre}</span>
                <span style={{ fontFamily: MONO }}>entra {hhmm(m.entra)}</span>
              </div>
            ))}
          </Bloque>
        )}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ── barra superior fija ────────────────────────────────────────
   Aparece al perder de vista la cabecera. Debe caber en un móvil,
   así que va en dos filas muy compactas.                          */

/* El mapa va en el centro, que es la posición más cómoda para el pulgar y la
   pantalla que más se consulta durante la partida.                       */
const TABS = [
  { k: "trenes", l: "Trenes" },
  { k: "personal", l: "Personal" },
  { k: "mapa", l: "Mapa" },
  { k: "taller", l: "Taller" },
  { k: "libro", l: "Libro" },
];

/* Los cinco iconos comparten lenguaje: silueta maciza de 13×13 con los
   detalles recortados en el color del fondo. Así pesan lo mismo y se leen
   igual sobre blanco que sobre el color de la línea.                      */
function Icono({ tipo, activo, fondo }) {
  /* Al activarse, el icono baja sobre el fondo claro de la barra antes de
     ocultarse bajo el rótulo: en blanco sería invisible durante el recorrido,
     así que toma el color de la línea.                                   */
  const c = activo ? P.blanco : P.muted;
  const bg = fondo || P.surface;
  const caja = { display: "block", position: "relative", width: 13, height: 13 };

  if (tipo === "trenes")
    return (
      <span style={caja}>
        <span style={{ position: "absolute", left: 1, top: 0, width: 11, height: 13, background: c, borderRadius: "4px 4px 2px 2px" }} />
        <span style={{ position: "absolute", left: 3, top: 2.5, width: 7, height: 4, background: bg, borderRadius: R.hilo }} />
        <span style={{ position: "absolute", left: 3, bottom: 1.5, width: 2.5, height: 2.5, background: bg, borderRadius: "50%" }} />
        <span style={{ position: "absolute", right: 3, bottom: 1.5, width: 2.5, height: 2.5, background: bg, borderRadius: "50%" }} />
      </span>
    );

  if (tipo === "personal")
    return (
      <span style={caja}>
        <span style={{ position: "absolute", top: 0.5, left: 4, width: 5, height: 5, borderRadius: "50%", background: c }} />
        <span style={{ position: "absolute", bottom: 0.5, left: 1, width: 11, height: 6.5, borderRadius: "6px 6px 2px 2px", background: c }} />
      </span>
    );

  // tuerca: hexágono macizo con el agujero recortado
  if (tipo === "taller")
    return (
      <span style={caja}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: c,
            clipPath: "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)",
          }}
        />
        <span style={{ position: "absolute", left: 4, top: 4, width: 5, height: 5, borderRadius: "50%", background: bg }} />
      </span>
    );

  // chincheta: gota maciza con el ojo recortado
  if (tipo === "mapa")
    return (
      <span style={caja}>
        <span
          style={{
            position: "absolute",
            left: 1.5,
            top: 0.5,
            width: 10,
            height: 10,
            background: c,
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
          }}
        />
        {/* el ojo va en el centro de la gota: (1,5 + 10/2, 0,5 + 10/2) = (6,5, 5,5) */}
        <span style={{ position: "absolute", left: 4.75, top: 3.75, width: 3.5, height: 3.5, borderRadius: "50%", background: bg }} />
      </span>
    );

  // libro: página maciza con los renglones recortados
  return (
    <span style={caja}>
      <span style={{ position: "absolute", left: 1, top: 0.5, width: 11, height: 12, background: c, borderRadius: "1px 2px 2px 1px" }} />
      {[3, 6, 9].map((y, n) => (
        <span key={y} style={{ position: "absolute", left: 3, top: y, width: n === 2 ? 4 : 7, height: 1.5, background: bg, borderRadius: R.hilo }} />
      ))}
    </span>
  );
}

// las tres pastillas de la barra comparten medidas para alinearse bien
const PASTILLA = {
  width: 52,
  height: 34,
  borderRadius: R.normal,
  fontSize: T.base,
  fontWeight: 700,
  fontFamily: MONO,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  padding: 0,
  boxSizing: "border-box",
};

function MiniKpi({ k, v, c }) {
  return (
    <span
      style={{
        ...PASTILLA,
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        gap: 2,
        background: P.sunken,
        border: `1px solid ${P.rule}`,
        lineHeight: 1,
      }}
    >
      {/* misma tipografía que las etiquetas del Libro: la pastilla impone
          monoespaciada al valor, pero el rótulo va en la de la interfaz */}
      <span
        style={{
          fontSize: T.micro,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: P.muted,
          fontWeight: 600,
          fontFamily: FUENTE,
          whiteSpace: "nowrap",
        }}
      >
        {k}
      </span>
      <span style={{ fontSize: T.base, fontWeight: 700, color: c }}>{v}</span>
    </span>
  );
}

/* Barra de mando, anclada abajo: en el móvil el pulgar llega sin cruzar la
   pantalla, y pausa, velocidad y pestañas son lo que más se toca.        */
/* Barra de datos, anclada arriba: solo información, nada que pulsar. Se mira
   de reojo mientras se juega, y arriba es donde la vista descansa.       */
function BarraDatos({ g }) {
  const activos = g.trenes.filter((t) => t.estado !== "suprimido");
  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const retrasoMedio = activos.length ? activos.reduce((n, t) => n + retrasoEfectivo(t), 0) / activos.length : 0;
  /* La ocupación media solo cuenta los trenes que llevan viajeros. Los que
     están invirtiendo en cabecera, rotando en una estación, apartados o
     circulando en vacío van sin pasaje por definición, y al promediarlos
     hundían la cifra sin que significara nada.                          */
  const conViajeros = activos.filter(
    (t) => !t.rotando && !t.enDesviada && !t.vacio && t.unidades.length && situacion(t, g.reloj).dir !== "maniobra"
  );
  const ocupMedia = conViajeros.length
    ? (conViajeros.reduce((n, t) => n + t.pax.reduce((a, b) => a + b, 0) / (plazasDe(t) || 1), 0) / conViajeros.length) * 100
    : 0;
  const enAnden = g.andenes.reduce((n, a) => n + a.alcala + a.pio, 0);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: P.surface,
          borderBottom: `1px solid ${P.rule}`,
          boxShadow: SOMBRA.card,
          padding: "calc(6px + env(safe-area-inset-top)) 4px 6px",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MiniKpi k="PUNT" v={`${punt.toFixed(0)}%`} c={colPuntualidad(punt)} />
          <MiniKpi k="RETR MED" v={retrasoMedio < 0.05 ? "0′" : `+${retrasoMedio.toFixed(1)}′`} c={colRetrasoMedio(retrasoMedio)} />
          <MiniKpi k="CIRCUL" v={`${activos.length}/${CIRCULACIONES}`} c={activos.length === CIRCULACIONES ? P.ok : P.warn} />
          <MiniKpi k="OCUP MED" v={`${ocupMedia.toFixed(0)}%`} c={colOcupacion(ocupMedia)} />
          <MiniKpi k="EN ANDÉN" v={nf(Math.round(enAnden))} c={nivelCol(enAnden, 1500, 4000)} />
          <span style={{ ...PASTILLA, width: "auto", padding: "0 8px", fontSize: T.titulo, letterSpacing: -0.7, marginLeft: "auto" }}>{hhmm(g.reloj)}</span>
        </div>
      </div>
    </div>
  );
}

/* Barra de mando, anclada abajo: en el móvil el pulgar llega sin cruzar la
   pantalla, y pausa, velocidad y pestañas son lo que más se toca.        */
function BarraMando({ g, setG, tab, setTab, setAjustes, setAnalisis, setCalidad, sinLeer }) {
  const [abierto, setAbierto] = useState(false); // desplegable de velocidad
  const [lineas, setLineas] = useState(false); // desplegable de líneas
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: P.surface,
          borderTop: `1px solid ${P.rule}`,
          boxShadow: SOMBRA.barra,
          // el relleno inferior respeta la franja de gestos de los móviles
          padding: "7px 0 calc(4px + env(safe-area-inset-bottom))",
          pointerEvents: "auto",
        }}
      >
        {/* los tres controles van juntos y centrados: línea, marcha y velocidad */}
        {/* La fila de mando pesa más que la de navegación: pausa y velocidad
            se tocan constantemente durante la partida, y las pestañas solo al
            cambiar de pantalla.                                          */}
        {/* Los tres controles van centrados en la barra. A cada lado hay el
            mismo ancho: a la izquierda análisis y reacciones, a la derecha
            ajustes y un hueco vacío del mismo tamaño.                   */}
        {/* Tres regiones: izquierda y derecha crecen por igual, así que el
            bloque central queda exactamente en el centro de la barra pase lo
            que pase. Los botones de los extremos se pegan a su borde.    */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 12px 8px" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
          <button
            onClick={() => setAnalisis(true)}
            title="Análisis"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              border: `1px solid ${P.rule}`,
              background: P.surface,
              borderRadius: R.normal,
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 2,
              padding: "0 0 9px",
            }}
          >
            {/* tres barras de altura creciente: el icono de una estadística */}
            {[6, 11, 8].map((h, k) => (
              <span key={k} style={{ width: 3, height: h, background: P.muted, borderRadius: 1, display: "block" }} />
            ))}
          </button>

          {/* Calidad del servicio y reacciones de los viajeros. Lleva contador
              de mensajes sin leer para que se note desde la barra cuando algo
              se está torciendo, sin tener que entrar a mirar.           */}
          <button
            onClick={() => setCalidad(true)}
            title="Calidad del servicio"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              border: `1px solid ${P.rule}`,
              background: P.surface,
              borderRadius: R.normal,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* globo de conversación */}
            <span
              style={{
                width: 16,
                height: 12,
                border: `1.6px solid ${P.muted}`,
                borderRadius: 3,
                display: "block",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 2,
                  bottom: -4,
                  width: 0,
                  height: 0,
                  borderLeft: `3px solid transparent`,
                  borderRight: `3px solid transparent`,
                  borderTop: `4px solid ${P.muted}`,
                }}
              />
            </span>
            {sinLeer > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 15,
                  height: 15,
                  padding: "0 3px",
                  borderRadius: 8,
                  background: COLOR.rojo,
                  color: P.blanco,
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: MONO,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${P.surface}`,
                }}
              >
                {sinLeer > 99 ? "99" : sinLeer}
              </span>
            )}
          </button>
          </div>

          {/* Los tres controles de marcha van más juntos entre sí que respecto
              al resto: se manejan como una unidad.                       */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: "0 14px" }}>
          {/* Selector de línea. Solo la C-7 está implementada; el resto del
              núcleo aparece atenuado, igual que en la portada, para que se vea
              hacia dónde va el juego.                                    */}
          <div style={{ position: "relative", flex: "0 0 auto" }}>
            <button
              onClick={() => {
                setLineas(!lineas);
                setAbierto(false); // solo un desplegable abierto a la vez
              }}
              title="Líneas del núcleo"
              style={{ ...PASTILLA, background: LIN[LINEA], color: P.blanco, border: "none", cursor: "pointer" }}
            >
              {LINEA}
            </button>
            {lineas && (
              <div
                style={{
                  position: "absolute",
                  bottom: 40, // por encima de la pastilla, que ahora mide 34
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: P.surface,
                  border: `1px solid ${P.rule}`,
                  borderRadius: R.normal,
                  boxShadow: SOMBRA.elevado,
                  padding: 4,
                  zIndex: 40,
                }}
              >
                {LINEAS_NUCLEO.map((l) => {
                  // en juego las que se hayan abierto en esta partida
                  const enJuego = !!(g.porLinea && g.porLinea[l.id]);
                  const mirando = l.id === (g.linea || LINEAS_EN_JUEGO[0]);
                  return (
                    <button
                      key={l.id}
                      disabled={!enJuego}
                      onClick={() => {
                        if (enJuego) setG((p2) => cambiarVista(p2, l.id));
                        setLineas(false);
                      }}
                      title={enJuego ? l.n : `${l.n} · próximamente`}
                      style={{
                        ...PASTILLA,
                        display: "flex",
                        background: LIN[l.id],
                        color: P.blanco,
                        border: mirando ? `2px solid ${P.ink}` : "none",
                        opacity: enJuego ? 1 : 0.28,
                        cursor: enJuego ? "pointer" : "not-allowed",
                        marginBottom: 4,
                      }}
                    >
                      {l.id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flex: "0 0 auto" }}>
            <button
              onClick={() => setG((p) => ({ ...p, marcha: !p.marcha }))}
              title={g.marcha ? "Pausar" : "Reanudar"}
              style={{
                ...PASTILLA,
                width: "auto",
                padding: "0 26px",
                fontSize: T.alto,
                border: `1px solid ${g.marcha ? P.rule : P.ink}`,
                background: g.marcha ? P.surface : P.solido,
                color: g.marcha ? P.ink : P.blanco,
                cursor: "pointer",
              }}
            >
              {g.marcha ? "❚❚" : "▶"}
            </button>
          </div>

          <div style={{ position: "relative", flex: "0 0 auto" }}>
            <button
              onClick={() => {
                setAbierto(!abierto);
                setLineas(false);
              }}
              // ancho fijo: "×0,5" es más largo que "×40" y descolocaba la fila
              // mismo ancho que la pastilla de la línea: el ancho mínimo la
              // dejaba crecer con el texto y quedaban desiguales
              style={{ ...PASTILLA, border: `1px solid ${abierto ? P.ink : P.rule}`, background: abierto ? P.solido : P.surface, color: abierto ? P.blanco : P.ink, cursor: "pointer", textAlign: "center" }}
            >
              ×{velTxt(g.vel)} ▾
            </button>
            {/* el desplegable se abre hacia arriba: abajo se saldría de la pantalla */}
            {abierto && (
              <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, boxShadow: SOMBRA.elevado, padding: 4, zIndex: 40 }}>
                {VELOCIDADES.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setG((p) => ({ ...p, vel: v }));
                      setAbierto(false);
                    }}
                    style={{ display: "block", width: 52, border: "none", background: g.vel === v ? P.sunken : "transparent", color: g.vel === v ? P.ink : P.muted, borderRadius: R.menudo, padding: "6px 0", fontSize: T.aux, fontWeight: 700, fontFamily: MONO, cursor: "pointer" }}
                  >
                    ×{velTxt(v)}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={() => setAjustes(true)}
            title="Ajustes"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              border: `1px solid ${P.rule}`,
              background: P.surface,
              color: P.muted,
              borderRadius: R.normal,
              fontFamily: "inherit",
              fontSize: T.alto,
              fontWeight: 700,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⋯
          </button>
          </div>
        </div>

        {/* mismo margen lateral que la fila de mando: con 22 aquí y 12 arriba,
            las dos filas no se alineaban entre sí */}
        <div style={{ display: "flex", gap: 4, padding: "0 12px" }}>
          {TABS.map((x) => {
            const on = tab === x.k;
            return (
              /* Deliberadamente mínimo. Llegó a tener clase CSS, cuatro
                 manejadores de puntero, manipulación directa del DOM y
                 recorte de texto; cada añadido era un sospechoso más del
                 retardo al cambiar de pantalla. Un botón y su onClick. */
              <button
                key={x.k}
                className="cgo-tab"
                // sin esto, iOS no aplica el estado :active de forma fiable
                onTouchStart={() => {}}
                /* Se cede un fotograma antes de cambiar: el navegador pinta
                   la pestaña hundida y solo después monta la pantalla. Si ya
                   estás en ese menú, el toque lleva al principio.        */
                onClick={() =>
                  requestAnimationFrame(() => (on ? window.scrollTo({ top: 0, behavior: "smooth" }) : setTab(x.k)))
                }
                style={{
                  flex: 1,
                  border: "none",
                  background: on ? LIN[LINEA] : "transparent",
                  borderRadius: "7px 7px 0 0",
                  color: on ? P.blanco : P.muted,
                  height: 34,
                  padding: 0,
                  fontFamily: "inherit",
                  fontSize: T.menor,
                  fontWeight: on ? 700 : 500,
                  // fundido corto del rojo: alcanza solo a cinco elementos
                  transition: "background-color .18s ease-out, color .18s ease-out",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  <span style={{ width: 13, height: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icono tipo={x.k} activo={on} fondo={on ? LIN[LINEA] : P.surface} />
                  </span>
                  <span style={{ lineHeight: "12px" }}>{x.l}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// dónde está cada unidad ahora mismo
function estadoUnidad(g, id) {
  if (g.taller && g.taller[id]) {
    const t = g.taller[id];
    return {
      txt: `${REVISIONES[t.tipo].n} en ${t.dep} · ${t.restan} turno${t.restan === 1 ? "" : "s"}`,
      corto: t.restan > 0 ? `Taller ${t.restan}T` : "Taller listo",
      c: t.restan > 0 ? P.muted : P.ok,
      taller: t,
    };
  }
  const tren = g.trenes.find((t) => t.unidades.some((u) => u.id === id));
  if (tren) return { txt: `Circulando · circ. ${tren.i}`, corto: "Circulando", c: P.ok, tren };
  for (const [k, lista] of Object.entries(g.apartado || {}))
    for (const x of lista)
      if (x.unidades.some((u) => u.id === id))
        return x.averiado
          ? { txt: `Averiada en ${ESTACIONES[k].n}`, corto: "Averiada", c: P.alert }
          : { txt: `Apartada en ${ESTACIONES[k].n}`, corto: "Apartada", c: P.warn };
  const cat = CATALOGO.find((u) => u.id === id);
  if (g.reserva.some((u) => u.id === id)) return { txt: "En reserva en Fuencarral", corto: "Reserva", c: P.ink };
  if (cat && cat.otraLinea) return { txt: "En servicio en otra línea", corto: "Otra línea", c: P.muted };
  return { txt: "Sin asignar", corto: "Sin asignar", c: P.muted };
}

/* ── pantalla de taller ─────────────────────────────────────── */


/* ── lógica de decisiones de taller ─────────────────────────── */

// unidades sobre las que hay algo que decidir: paradas y que lo necesitan
function pendientesTaller(g) {
  const out = [];
  for (const u of CATALOGO) {
    if (g.taller[u.id]) continue;
    const est = estadoUnidad(g, u.id);
    if (est.corto === "Circulando" || est.corto === "Otra línea") continue;
    const d = desgasteDe(g, u.id);
    const averiada = est.corto === "Averiada";
    const apartada = est.corto === "Apartada";
    if (!averiada && !apartada && d < 60) continue;
    out.push({ u, d, est, averiada, apartada });
  }
  return out.sort((a2, b2) => b2.averiada - a2.averiada || b2.d - a2.d);
}

// criterio de la propuesta: reparar lo inútil y revisar según desgaste
const revisionSugerida = (p) => (p.averiada ? "reparacion" : p.d >= 70 ? "general" : "ligera");

// mete una unidad en taller sobre un estado ya clonado
function meterEnTaller(n, id, dep, tipo, d) {
  for (const k of Object.keys(n.apartado))
    n.apartado[k] = n.apartado[k].map((x) => ({ ...x, unidades: x.unidades.filter((u) => u.id !== id) })).filter((x) => x.unidades.length);
  n.reserva = n.reserva.filter((u) => u.id !== id);
  n.taller = { ...n.taller, [id]: { dep, tipo, restan: REVISIONES[tipo].turnos, entrada: d } };
  n.kpi = { ...n.kpi, coste: n.kpi.coste + REVISIONES[tipo].coste };
  log(n, "ok", `${id} entra en ${dep} para ${REVISIONES[tipo].n.toLowerCase()}.`);
}

/* Propuesta óptima de mantenimiento: no se autolimita por la flota que deje
   libre, solo por las plazas de taller. El aviso de material lo da la
   pantalla, y la decisión final es del jugador.                          */
function propuestaMantenimiento(g, semilla) {
  const sel = {};
  const usadas = {};
  for (const p of pendientesTaller(g)) {
    const tipo = revisionSugerida(p);
    const opciones = talleresPara(g, p.u, semilla)
      .map((o) => ({ ...o, libres: o.libres - (usadas[o.dep] || 0) }))
      .filter((o) => o.libres > 0)
      .sort((a2, b2) => b2.propio - a2.propio || b2.libres - a2.libres);
    if (!opciones.length) continue;
    const dep = opciones[0].dep;
    usadas[dep] = (usadas[dep] || 0) + 1;
    // la base de mantenimiento no hace revisiones generales
    const tipoReal = tipo === "general" && TALLERES[dep].soloReparacion ? "ligera" : tipo;
    sel[p.u.id] = { dep, tipo: tipoReal };
  }
  return sel;
}

// ¿queda material suficiente para cubrir el turno si se ejecuta la selección?
function avisoFlota(g, sel) {
  const avisos = [];
  for (const serie of ["446", "465", "450"]) {
    const enServicio = g.trenes.reduce((n, t) => n + t.unidades.filter((u) => u.serie === serie).length, 0);
    const disponibles = CATALOGO.filter(
      (u) => u.serie === serie && !u.otraLinea && !u.enTaller && !g.taller[u.id] && !sel[u.id] && estadoUnidad(g, u.id).corto !== "Averiada"
    ).length;
    if (disponibles < enServicio) avisos.push({ serie, disponibles, enServicio });
  }
  return avisos;
}

/* ── reposición de circulaciones ────────────────────────────────
   Suprimir un tren no mata su marcha: el hueco horario sigue ahí.
   Con material y maquinista se puede volver a cubrir, pero solo
   cuando el horario de esa circulación vuelva a pasar por una
   cabecera con personal.                                          */

const MARGEN_REPOSICION = 15; // preparación del material y toma de mando
/* Cabeceras donde se puede reponer una circulación. Se recalcula al fijar la
   línea: escrita como constante, guardaba los índices de la C-7 y en la C-1
   apuntaban a estaciones inexistentes.                                 */
let CABECERAS_REP = [IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA];

// fases del ciclo en que una circulación pasa por esa cabecera
const fasesEn = (idx) => (idx === 0 ? [0] : idx === N - 1 ? [SALE_ALCALA] : [ESTACIONES[idx].t, LLEGA_PIO - ESTACIONES[idx].t]);

// próxima hora a la que la marcha de ese tren pasa por la cabecera
function proximaReposicion(t, idx, desde, hasta = null) {
  const tope = hasta === null ? FIN : hasta;
  /* Cuántos ciclos hay que recorrer. Estaba fijado en diez, que con el ciclo
     de 260 min de la C-7 cubre de sobra el turno, pero con los 45 min de la
     C-1 no llegaba ni al principio: el juego decía que no quedaban pasos por
     cabecera a las ocho de la mañana.                                  */
  const desdeK = Math.floor((desde - t.offset) / CICLO) - 1;
  const hastaK = Math.ceil((tope - t.offset) / CICLO) + 1;

  let mejor = null;
  for (const q of fasesEn(idx))
    for (let k = desdeK; k <= hastaK; k++) {
      const T = t.offset + q + CICLO * k;
      if (T >= desde + MARGEN_REPOSICION && T <= tope && (!mejor || T < mejor)) mejor = T;
    }
  return mejor;
}

// composiciones que pueden hacerse cargo: material apartado allí y
// unidades ya listas en taller, que pueden salir directas a la marcha
function composicionesDisponibles(g, idx) {
  const out = [];
  for (const x of g.apartado[idx] || [])
    if (!x.averiado) out.push({ clave: `ap|${x.via}`, unidades: x.unidades, origen: `apartada en ${x.via}`, desdeApartado: x.via });

  const listas = Object.entries(g.taller).filter(([, v]) => v.restan <= 0);
  const porSerie = {};
  for (const [id] of listas) {
    const c = CATALOGO.find((u) => u.id === id);
    if (!c) continue;
    (porSerie[c.serie] = porSerie[c.serie] || []).push(c);
  }
  for (const [serie, uds] of Object.entries(porSerie)) {
    if (!SERIES[serie].doble) {
      for (const u of uds) out.push({ clave: `tl|${u.id}`, unidades: [u], origen: `sale de ${g.taller[u.id].dep}`, deTaller: [u.id] });
    } else {
      for (let k = 0; k + 1 < uds.length; k += 2)
        out.push({
          clave: `tl|${uds[k].id}`,
          unidades: [uds[k], uds[k + 1]],
          origen: `salen de taller`,
          deTaller: [uds[k].id, uds[k + 1].id],
        });
    }
  }
  return out;
}

function SelectorApartadero({ g, setG, i, close }) {
  const t = g.trenes.find((x) => x.i === i);
  if (!t) return null;
  // de noche la estación la fija el cuadro de retirada: solo se elige la vía
  const fijada = t.supresion && t.supresion.noche ? t.supresion.idx : null;
  const puntos = viasParaApartar(g, t).filter((x) => fijada === null || x.idx === fijada);

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 65 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "84vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Material vacío</div>
        <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>Dónde apartar el {numeroTren(t, g.reloj)}</div>
        <div style={{ fontSize: T.base, color: P.muted, marginBottom: 12, lineHeight: 1.45 }}>
          {t.vacio
            ? "El tren circula sin viajeros con el bypass de puertas activado. "
            : "El tren queda fuera de servicio. "}
          Elige la estación y la vía donde quedará estacionado.
        </div>

        {t.supresion && (
          <div style={{ ...ST.card, padding: "10px 12px", marginBottom: 12, borderColor: P.warn }}>
            <div style={{ fontSize: T.aux, color: P.muted, marginBottom: 4 }}>
              {t.supresion.noche ? `Termina servicio a las ${hhmm(t.supresion.hora)} en` : "Destino previsto ahora"}
            </div>
            <div style={{ fontSize: T.base, fontWeight: 700 }}>
              {ESTACIONES[t.supresion.idx].n}
              {t.supresion.via ? ` · ${t.supresion.via}` : ""}
            </div>
          </div>
        )}

        {puntos.length === 0 && (
          <div style={{ fontSize: T.base, color: P.alert, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", marginBottom: 12 }}>
            No hay ninguna vía de apartado libre por delante que admita esta serie.
          </div>
        )}

        {puntos.map((p2) => (
          <div key={p2.idx} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: T.alto, fontWeight: 600, flex: 1 }}>{p2.nombre}</span>
              <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO }}>llega en {p2.eta} min</span>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {p2.vias.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setG((p3) => aplicar(clonar(p3), { destinoVacio: { i, idx: p2.idx, via: v } }));
                    close();
                  }}
                  style={{ background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.pastilla, padding: "6px 13px", fontSize: T.aux, fontWeight: 700, fontFamily: MONO, cursor: "pointer" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Decidir más tarde
        </button>
      </div>
    </div>
  );
}

/* ── movimientos de material en vacío ───────────────────────────
   Una composición apartada fuera de cabecera no puede volver al
   servicio por sí sola: hay que llevarla. El puesto de mando elige
   maquinista, destino y vía, y la marcha se ve en la línea como un
   tren más, con numeración propia de la serie 37200.            */

/* El maquinista se desplaza de viajero: espera al primer tren que pase por
   su residencia en el sentido bueno y va en él hasta donde está el material.
   Hasta que no llega, la composición sigue apartada en su vía.           */
function viajeMaquinista(g, idxDesde, idxHasta) {
  if (idxDesde === idxHasta) return { espera: 0, viaje: 0, total: 12 };
  const dir = idxHasta > idxDesde ? "alcala" : "pio";
  const paso = pasoPorEstacion(g, idxDesde, dir);
  const espera = paso && paso.hasta !== undefined ? Math.max(0, Math.round(paso.hasta)) : 20;
  const viaje = Math.abs(ESTACIONES[idxHasta].t - ESTACIONES[idxDesde].t);
  return { espera, viaje, total: espera + viaje + 12 }; // 12 min de toma de mando
}

// ordena el movimiento: el material no se mueve hasta que llega el maquinista
function ordenarVacio(g, orden) {
  // puede estar en la plantilla o en la bolsa común
  const maq = g.personal.find((m) => m.id === orden.maqId) || (g.reservaPersonal || []).find((m) => m.id === orden.maqId);
  if (!maq) return;
  const idxCab = ESTACIONES.findIndex((e) => e.cab === maq.lugar);
  const v = viajeMaquinista(g, idxCab < 0 ? IDX_CHAMARTIN : idxCab, orden.idx);
  maq.estado = "enViaje";
  maq.destinoViaje = orden.idx;
  g.vacios = [...(g.vacios || []), { ...orden, desde: idxCab, listo: g.reloj + v.total }];
  log(
    g,
    "aviso",
    `${maq.nombre} sale de ${maq.lugar} como viajero hacia ${ESTACIONES[orden.idx].n} para sacar el material. Espera ${v.espera} min el tren y llega a las ${hhmm(
      g.reloj + v.total
    )}.`
  );
}

function crearVacio(g, { idx, via, maqId, destino, destinoVia, aTaller, dep }) {
  const lote = (g.apartado[idx] || []).find((x) => x.via === via);
  const maq = g.personal.find((m) => m.id === maqId);
  if (!lote || !maq) return null;

  // el sentido lo marca hacia dónde hay que llevarlo
  const dir = destino > idx ? "alcala" : "pio";
  const q = faseEstacion(idx, dir);
  const t = {
    i: 100 + (g.trenes.filter((x) => x.esVacio).length + 1),
    esVacio: true,
    vacio: true,
    serie: lote.unidades[0].serie,
    unidades: lote.unidades.map((u) => ({ ...u })),
    offset: ((g.reloj - q) % CICLO + CICLO) % CICLO,
    retraso: 0,
    estado: "servicio",
    maq: maq.id,
    pax: new Array(N).fill(0),
    hist: [],
    acum: { paradas: 0, maquinista: 0, bloqueo: 0 },
    dejados: 0,
    limitacion: 0,
    riesgo: 0,
    rotacion: null,
    rotando: null,
    detenido: null,
    retenido: false,
    esperaCab: false,
    esperaCruce: null,
    esperaVia: null,
    viaPaso: null,
    viaCab: null,
    enVU: null,
    enDesviada: null,
    apartaPaso: null,
    supresion: { idx: destino, via: destinoVia, vacioA: true, aTaller: aTaller || null, dep: dep || null },
    pendienteApartar: false,
    inmovil: null,
    reponer: null,
    bloqueadoPor: null,
    cambio: null,
    retirarCab: false,
    avisado: false,
    excesoAutorizado: false,
    relevo: null,
    nocheEn: null,
    saliendo: 0,
    // su marcha va del apartadero al destino que se le ha dado
    marchas: [
      {
        ini: Math.round(g.reloj),
        fin: Math.round(g.reloj) + Math.max(1, Math.abs(ESTACIONES[destino].t - ESTACIONES[idx].t)),
        desde: ESTACIONES[idx].n,
        hasta: aTaller ? `taller de ${dep}` : ESTACIONES[destino].n,
        dir,
        num: numDeMarcha(g.reloj, dir === "pio", true),
        estado: "curso",
        iniReal: Math.round(g.reloj),
      },
    ],
  };

  // ahora sí: el material deja la vía en la que estaba
  g.apartado = { ...g.apartado, [idx]: (g.apartado[idx] || []).filter((x) => x !== lote) };
  maq.estado = "conduciendo";
  maq.tren = t.i;
  maq.cond = 0;
  maq.lugar = null;
  maq.destinoViaje = null;
  g.trenes = [...g.trenes, t];
  log(
    g,
    "ok",
    `${numeroTren(t, g.reloj)}: ${maq.nombre} saca el material de ${ESTACIONES[idx].n}, ${via}, hacia ${
      aTaller ? `el taller de ${dep}` : `${ESTACIONES[destino].n}, ${destinoVia}`
    }.`
  );
  return t;
}

function SelectorVacio({ g, setG, idx, via, close }) {
  const lote = (g.apartado[idx] || []).find((x) => x.via === via);
  const [maq, setMaq] = useState(null);
  const [dest, setDest] = useState(null);
  if (!lote) return null;

  const serie = lote.unidades[0].serie;
  const reservas = g.personal.filter((m) => m.estado === "reserva" && !m.baja);
  const destinos = [];
  for (let k = 0; k < N; k++) {
    const e = ESTACIONES[k];
    if (k === idx || !e.cab || !admiteSerie(k, serie)) continue;
    const libres = viasLibres(g, k);
    if (libres.length) destinos.push({ idx: k, nombre: e.n, vias: libres });
  }
  const talleres = talleresPara(g, lote.unidades[0], Math.floor(g.reloj / 480)).filter((o) => o.libres > 0);

  const pill = (on) => ({
    background: on ? P.solido : P.surface,
    color: on ? P.blanco : P.ink,
    border: `1px solid ${on ? P.ink : P.rule}`,
    borderRadius: R.pastilla,
    padding: "6px 12px",
    fontSize: T.aux,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    marginRight: 4,
    marginBottom: 4,
  });

  const lanzar = () => {
    setG((p) => {
      const n = clonar(p);
      ordenarVacio(n, {
        idx,
        via,
        maqId: maq,
        destino: dest.tipo === "estacion" ? dest.idx : ESTACIONES.findIndex((e) => e.cab === (TALLERES[dest.dep].cab || CHAMARTIN)),
        destinoVia: dest.tipo === "estacion" ? dest.via : null,
        aTaller: dest.tipo === "taller" ? dest.rev : null,
        dep: dest.tipo === "taller" ? dest.dep : null,
      });
      return n;
    });
    close();
  };

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 66 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "86vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Material en vacío</div>
        <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>{lote.unidades.map((u) => u.id).join(" + ")}</div>
        <div style={{ fontSize: T.base, color: P.muted, marginBottom: 16, lineHeight: 1.45 }}>
          Apartado en {ESTACIONES[idx].n}, {via}. El maquinista irá de viajero en el primer tren que pase por su residencia y, una vez allí, sacará el
          material hasta donde le digas.
        </div>

        <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Maquinista de reserva</div>
        {reservas.length === 0 && <Vacio icono="!" txt="Sin reservas disponibles" pista="Todas las reservas están ocupadas o han agotado su jornada." />}
        <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 12 }}>
          {reservas.map((m) => {
            const iCab = ESTACIONES.findIndex((e) => e.cab === m.lugar);
            const v = viajeMaquinista(g, iCab < 0 ? IDX_CHAMARTIN : iCab, idx);
            return (
              <button key={m.id} onClick={() => setMaq(m.id)} style={pill(maq === m.id)}>
                {m.nombre} · {m.lugar} · llega en {v.total} min
              </button>
            );
          })}
        </div>

        <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Destino</div>
        {destinos.map((d) =>
          d.vias.map((v) => (
            <button
              key={`${d.idx}|${v}`}
              onClick={() => setDest({ tipo: "estacion", idx: d.idx, via: v })}
              style={pill(dest && dest.tipo === "estacion" && dest.idx === d.idx && dest.via === v)}
            >
              {d.nombre} · {v}
            </button>
          ))
        )}
        {talleres.map((o) => (
          <button key={o.dep} onClick={() => setDest({ tipo: "taller", dep: o.dep, rev: "ligera" })} style={pill(dest && dest.tipo === "taller" && dest.dep === o.dep)}>
            Taller de {o.dep}
          </button>
        ))}

        <button
          onClick={lanzar}
          disabled={!maq || !dest}
          style={{ width: "100%", background: maq && dest ? P.solido : P.sunken, color: maq && dest ? P.blanco : P.muted, border: "none", borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: T.alto, cursor: maq && dest ? "pointer" : "not-allowed", marginTop: 12 }}
        >
          Ordenar la marcha en vacío
        </button>
        <button onClick={close} style={{ width: "100%", background: "transparent", border: "none", color: P.muted, padding: "12px 0 0", fontFamily: "inherit", fontSize: T.base, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function SelectorReposicion({ g, setG, i, close }) {
  const t = g.trenes.find((x) => x.i === i);
  if (!t) return null;

  const puntos = CABECERAS_REP.filter((idx) => ESTACIONES[idx]).map((idx) => {
    const cab = cabeceraDe(idx);
    return {
      idx,
      nombre: ESTACIONES[idx].n,
      cuando: proximaReposicion(t, idx, g.reloj),
      comps: composicionesDisponibles(g, idx),
      /* Se cuenta sin mover a nadie, y contando también los que están en otra
         cabecera: un maquinista de reserva viaja como cualquier viajero en el
         primer tren y se planta donde haga falta. No tener a nadie ALLÍ no es
         motivo para no poder reponer.                                   */
      reservas: reservasVisibles(g, cab),
      foraneas: reservasLibresTotal(g) - reservasVisibles(g, cab),
    };
  }).filter((p2) => p2.cuando !== null);

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 64 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "84vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Reposición</div>
        <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>Circulación {t.i}</div>
        <div style={{ fontSize: T.base, color: P.muted, marginBottom: 16, lineHeight: 1.45 }}>
          La marcha sigue existiendo: con material y maquinista vuelve al servicio cuando su horario pase de nuevo por una cabecera. Hacen falta{" "}
          {MARGEN_REPOSICION} min de preparación.
        </div>

        {puntos.length === 0 && (
          <div style={{ fontSize: T.base, color: P.alert, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", marginBottom: 12 }}>
            Ya no quedan pasos por cabecera antes del final del turno.
          </div>
        )}

        {puntos.map((p2) => (
          <div key={p2.idx} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: T.alto, fontWeight: 600, flex: 1 }}>{p2.nombre}</span>
              <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO, color: P.ink }}>{hhmm(p2.cuando)}</span>
              <span style={{ fontSize: T.aux, color: P.muted }}>en {Math.round(p2.cuando - g.reloj)} min</span>
            </div>

            {!p2.reservas && !p2.foraneas && <div style={{ fontSize: T.aux, color: P.alert, marginBottom: 4 }}>No queda ningún maquinista de reserva libre.</div>}
            {!p2.reservas && p2.foraneas > 0 && (
              <div style={{ fontSize: T.aux, color: P.warn, marginBottom: 4 }}>
                Sin reservas aquí: {p2.foraneas === 1 ? "vendrá uno" : "vendrá uno de los " + p2.foraneas} desde otra cabecera, viajando de viajero.
              </div>
            )}
            {p2.comps.length === 0 && <Vacio icono="⊘" txt="Sin material disponible" pista="No hay composiciones apartadas en esta estación." />}

            {p2.comps.map((c) => (
              <button
                key={c.clave}
                disabled={!p2.reservas && !p2.foraneas}
                onClick={() => {
                  setG((p3) => aplicar(clonar(p3), { reponer: { i, idx: p2.idx, clave: c.clave, cuando: p2.cuando } }));
                  close();
                }}
                style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "9px 11px", marginBottom: 4, fontFamily: "inherit", cursor: p2.reservas || p2.foraneas ? "pointer" : "not-allowed", opacity: p2.reservas || p2.foraneas ? 1 : 0.4, color: P.ink }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO }}>{c.unidades.map((u) => u.id).join(" + ")}</span>
                  <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO }}>{nf(c.unidades.reduce((n, u) => n + u.plazas, 0))} pl</span>
                </div>
                <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>{c.origen}</div>
              </button>
            ))}
          </div>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function SelectorSupresion({ g, setG, i, close }) {
  const t = g.trenes.find((x) => x.i === i);
  if (!t) return null;
  const ests = estacionesParaSuprimir(g, t);
  const aBordo = t.pax.reduce((n, v) => n + v, 0);

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 63 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "80vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Supresión</div>
        <div style={{ fontSize: T.titulo, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>Suprimir el {numeroTren(t, g.reloj)}</div>
        <div style={{ fontSize: T.base, color: P.muted, marginBottom: 16, lineHeight: 1.45 }}>
          El tren termina recorrido, los viajeros transbordan al siguiente y el material queda estacionado, listo para entrar en taller. Se pierde la
          circulación el resto del turno.
        </div>

        {ests.length === 0 && (
          <div style={{ fontSize: T.base, color: P.alert, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", marginBottom: 12 }}>
            No hay ninguna estación con apartadero libre por delante que admita esta serie.
          </div>
        )}

        {ests.map((e) => (
          <button
            key={e.idx}
            onClick={() => {
              setG((p) => aplicar(clonar(p), { supresion: { i, idx: e.idx, via: e.via } }));
              close();
            }}
            style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "11px 12px", marginBottom: 8, fontFamily: "inherit", cursor: "pointer", color: P.ink }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: T.alto, fontWeight: 600 }}>{e.nombre}</span>
              <span style={{ fontSize: T.base, color: P.muted, fontFamily: MONO }}>llega en {e.eta} min</span>
            </div>
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>
              {e.via} · deja {e.sinServicio} estación{e.sinServicio !== 1 ? "es" : ""} sin esta circulación
              {aBordo > 1 ? ` · ${nf(aBordo)} viajeros a bordo ahora` : ""}
            </div>
          </button>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function SelectorTaller({ g, setG, id, close }) {
  const cat = CATALOGO.find((u) => u.id === id);
  if (!cat) return null;
  const est = estadoUnidad(g, id);
  const enTaller = g.taller[id];
  const d = desgasteDe(g, id);
  const semilla = Math.floor(g.reloj / 480);
  const opciones = talleresPara(g, cat, semilla);
  const averiada = est.corto === "Averiada";

  const meter = (dep, tipo) => {
    setG((p) => {
      const n = clonar(p);
      for (const k of Object.keys(n.apartado))
        n.apartado[k] = n.apartado[k]
          .map((x) => ({ ...x, unidades: x.unidades.filter((u) => u.id !== id) }))
          .filter((x) => x.unidades.length);
      n.reserva = n.reserva.filter((u) => u.id !== id);
      n.taller = { ...n.taller, [id]: { dep, tipo, restan: REVISIONES[tipo].turnos, entrada: d } };
      n.kpi = { ...n.kpi, coste: n.kpi.coste + REVISIONES[tipo].coste };
      log(n, "ok", `${id} entra en ${dep} para ${REVISIONES[tipo].n.toLowerCase()}.`);
      return n;
    });
    close();
  };

  const sacar = () => {
    setG((p) => {
      const n = clonar(p);
      const t = n.taller[id];
      if (!t) return n;
      const total = REVISIONES[t.tipo].turnos;
      const hecho = t.restan > 0 ? (total - t.restan) / total : 1;
      const nuevo = Math.max(0, t.entrada - REVISIONES[t.tipo].quita * hecho);
      n.desg = { ...n.desg, [id]: nuevo };
      /* Sale del taller: deja de estar averiada. Sin esto la marca se
         arrastraba a la campaña y la unidad volvía inútil al turno siguiente,
         como si no hubiera pasado por el taller.                         */
      n.reparadas = [...new Set([...(n.reparadas || []), id])];
      const { [id]: fuera, ...resto } = n.taller;
      n.taller = resto;
      n.reserva = [...n.reserva, { ...cat, desgaste: nuevo, fiab: fiabDesgaste(nuevo), vencida: false }];
      log(n, t.restan > 0 ? "aviso" : "ok", `${id} sale de ${t.dep}${t.restan > 0 ? " antes de terminar" : ""} con el desgaste al ${Math.round(nuevo)} %.`);
      return n;
    });
    close();
  };

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "86vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out" }}>
        <div style={ST.eyebrow}>Taller</div>
        <div style={{ fontSize: T.cabecera, fontWeight: 700, fontFamily: MONO, letterSpacing: -0.6 }}>{id}</div>
        <div style={{ fontSize: T.base, color: averiada ? P.alert : P.muted, marginBottom: 12 }}>
          {est.txt} · desgaste {Math.round(d)} % · fiabilidad {Math.round(fiabDesgaste(d) * 100)} %
        </div>

        {enTaller ? (
          <>
            <Bloque titulo="En reparación">
              <div style={{ padding: "6px 0", fontSize: T.base }}>
                {[["Trabajo", REVISIONES[enTaller.tipo].n], ["Taller", enTaller.dep], ["Turnos restantes", String(enTaller.restan)]].map(([k, v], n2) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(n2) }}>
                    <span style={{ color: P.muted }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </Bloque>
            <button
              onClick={sacar}
              style={{ width: "100%", background: enTaller.restan > 0 ? P.surface : P.solido, color: enTaller.restan > 0 ? P.ink : P.blanco, border: `1px solid ${enTaller.restan > 0 ? P.warn : P.ink}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", marginBottom: 8 }}
            >
              {enTaller.restan > 0 ? "Sacar antes de tiempo · solo cuenta lo hecho" : "Sacar de taller"}
            </button>
          </>
        ) : est.corto === "Circulando" ? (
          <div style={{ fontSize: T.base, color: P.muted, background: P.sunken, borderRadius: R.normal, padding: "10px 12px", marginBottom: 12, lineHeight: 1.45 }}>
            La unidad está en servicio. Hay que apartarla, o esperar al cierre del turno, para poder meterla en taller.
          </div>
        ) : (
          <>
            {averiada && (
              <div style={{ fontSize: T.aux, color: P.alert, background: P.sunken, borderRadius: R.normal, padding: "9px 11px", marginBottom: 12, lineHeight: 1.45 }}>
                Unidad inútil: solo admite reparación, y no vuelve al servicio hasta terminarla.
              </div>
            )}
            {opciones.map((o) => (
              <div key={o.dep} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Enlace txt={o.dep} bg={(DEPOSITOS[o.dep] || {}).color || P.muted} />
                  {o.propio && <span style={{ fontSize: T.micro, fontWeight: 700, color: P.muted, border: `1px solid ${P.rule}`, borderRadius: R.menudo, padding: "0 4px" }}>SU TALLER</span>}
                  <span style={{ fontSize: T.aux, color: o.libres ? P.ok : P.alert, fontWeight: 700, marginLeft: "auto" }}>
                    {o.libres} de {o.plazas} libres
                  </span>
                </div>
                {(averiada ? ["reparacion"] : TALLERES[o.dep].soloReparacion ? ["ligera"] : ["ligera", "general"]).map((tipo) => {
                  const rv = REVISIONES[tipo];
                  const queda = Math.max(0, d - rv.quita);
                  return (
                    <button
                      key={tipo}
                      disabled={!o.libres}
                      onClick={() => meter(o.dep, tipo)}
                      style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "9px 11px", marginBottom: 4, fontFamily: "inherit", cursor: o.libres ? "pointer" : "not-allowed", opacity: o.libres ? 1 : 0.4, color: P.ink }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: T.base, fontWeight: 600 }}>{rv.n}</span>
                        <span style={{ fontSize: T.aux, fontWeight: 700, fontFamily: MONO, color: P.ok }}>
                          {Math.round(d)}% → {Math.round(queda)}%
                        </span>
                      </div>
                      <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2 }}>
                        {rv.turnos} {rv.turnos === 1 ? "turno" : "turnos"} fuera de servicio · {nf(rv.coste)} € · fiabilidad {Math.round(fiabDesgaste(queda) * 100)} %
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </>
        )}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function Taller({ g, setG, verUnidad, abierto, setAbierto, setGestion }) {
  const [sel, setSel] = useState({});
  const [verFlota, setVerFlota] = useState(false);
  const [tallerAbierto, setTallerAbierto] = useState(null); // desplegable de material dentro
  const semilla = Math.floor(g.reloj / 480);

  const pend = pendientesTaller(g);
  const listas = Object.entries(g.taller).filter(([, v]) => v.restan <= 0);
  const nSel = Object.keys(sel).length;
  const coste = Object.values(sel).reduce((n, v) => n + REVISIONES[v.tipo].coste, 0);
  const avisos = avisoFlota(g, sel);

  const marcar = (id, patch) =>
    setSel((p) => {
      if (patch === null) {
        const { [id]: fuera, ...resto } = p;
        return resto;
      }
      return { ...p, [id]: { ...(p[id] || {}), ...patch } };
    });

  const confirmar = () => {
    setG((p) => {
      const n = clonar(p);
      for (const [id, v] of Object.entries(sel)) meterEnTaller(n, id, v.dep, v.tipo, desgasteDe(n, id));
      return n;
    });
    setSel({});
  };

  const sacarTodas = () => {
    setG((p) => {
      const n = clonar(p);
      for (const [id, t] of listas) {
        const nuevo = Math.max(0, t.entrada - REVISIONES[t.tipo].quita);
        n.desg = { ...n.desg, [id]: nuevo };
        n.reparadas = [...new Set([...(n.reparadas || []), id])]; // deja de estar averiada
        const cat = CATALOGO.find((u) => u.id === id);
        if (cat) n.reserva = [...n.reserva, { ...cat, desgaste: nuevo, fiab: fiabDesgaste(nuevo), vencida: false }];
        delete n.taller[id];
        log(n, "ok", `${id} sale de ${t.dep} con el desgaste al ${Math.round(nuevo)} %.`);
      }
      return n;
    });
  };

  return (
    <div>
      {/* ── listas para salir ── */}
      {listas.length > 0 && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 8, borderColor: P.ok }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: T.base, fontWeight: 700, color: P.ok, flex: 1 }}>
              {listas.length} unidad{listas.length === 1 ? "" : "es"} lista{listas.length === 1 ? "" : "s"} para salir
            </span>
            <button
              onClick={sacarTodas}
              style={{ background: P.ok, color: P.blanco, border: "none", borderRadius: R.normal, padding: "6px 12px", fontFamily: "inherit", fontSize: T.aux, fontWeight: 700, cursor: "pointer" }}
            >
              Sacar todas
            </button>
          </div>
          <div style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO, lineHeight: 1.5 }}>
            {listas.map(([id, t]) => `${id} · ${t.dep}`).join("  ·  ")}
          </div>
        </div>
      )}

      {/* ── pendientes de decisión ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ ...ST.eyebrow, flex: 1 }}>Pendientes · {pend.length}</span>
        <button
          onClick={() => setSel(propuestaMantenimiento(g, semilla))}
          style={{ background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: "5px 11px", fontFamily: "inherit", fontSize: T.aux, fontWeight: 700, cursor: "pointer" }}
        >
          Proponer
        </button>
        {nSel > 0 && (
          <button
            onClick={() => setSel({})}
            style={{ background: "transparent", color: P.muted, border: "none", fontFamily: "inherit", fontSize: T.aux, fontWeight: 600, cursor: "pointer" }}
          >
            Limpiar
          </button>
        )}
      </div>

      {pend.length === 0 && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 8, fontSize: T.base, color: P.muted }}>
          Nada pendiente. Solo se puede mandar a taller material parado: suprime un tren o espera a que se aparte alguna unidad.
        </div>
      )}

      {pend.map((p) => {
        const marcada = sel[p.u.id];
        const opciones = talleresPara(g, p.u, semilla);
        return (
          <div key={p.u.id} style={{ ...ST.card, padding: 12, marginBottom: 8, borderColor: marcada ? P.ink : p.averiada ? P.alert : P.rule }}>
            <div
              onClick={() => marcar(p.u.id, marcada ? null : { tipo: revisionSugerida(p), dep: (opciones.find((o) => o.libres > 0) || opciones[0] || {}).dep })}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: R.menudo,
                  border: `1.5px solid ${marcada ? P.ink : P.rule}`,
                  background: marcada ? P.solido : P.surface,
                  color: P.blanco,
                  fontSize: T.aux,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {marcada ? "✓" : ""}
              </span>
              <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO }}>{p.u.id}</span>
              <span style={{ fontSize: T.aux, fontWeight: 700, fontFamily: MONO, color: colDesgaste(p.d) }}>
                {Math.round(p.d)}%
              </span>
              <span style={{ fontSize: T.menor, fontWeight: 700, color: p.est.c, flex: 1, textAlign: "right", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.est.txt}
              </span>
            </div>

            {marcada && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.sunken}` }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                  {(p.averiada
                    ? ["reparacion"]
                    : (TALLERES[marcada.dep] || {}).soloReparacion
                    ? ["ligera"]
                    : ["ligera", "general"]
                  ).map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => marcar(p.u.id, { tipo })}
                      style={{
                        background: marcada.tipo === tipo ? P.solido : P.surface,
                        color: marcada.tipo === tipo ? P.blanco : P.ink,
                        border: `1px solid ${marcada.tipo === tipo ? P.ink : P.rule}`,
                        borderRadius: R.pastilla,
                        padding: "4px 10px",
                        fontSize: T.aux,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {REVISIONES[tipo].n} · {REVISIONES[tipo].turnos}T
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {opciones.map((o) => (
                    <button
                      key={o.dep}
                      disabled={!o.libres}
                      onClick={() =>
                        marcar(p.u.id, {
                          dep: o.dep,
                          tipo: !p.averiada && TALLERES[o.dep].soloReparacion && marcada.tipo === "general" ? "ligera" : marcada.tipo,
                        })
                      }
                      style={{
                        background: marcada.dep === o.dep ? (DEPOSITOS[o.dep] || {}).color || P.ink : P.surface,
                        color: marcada.dep === o.dep ? P.blanco : o.libres ? P.ink : P.muted,
                        border: `1px solid ${marcada.dep === o.dep ? "transparent" : P.rule}`,
                        borderRadius: R.pastilla,
                        padding: "4px 10px",
                        fontSize: T.aux,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: o.libres ? "pointer" : "not-allowed",
                        opacity: o.libres ? 1 : 0.4,
                      }}
                    >
                      {o.dep} · {o.libres}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: T.aux, color: P.muted, marginTop: 8 }}>
                  {Math.round(p.d)}% → {Math.round(Math.max(0, p.d - REVISIONES[marcada.tipo].quita))}% · {nf(REVISIONES[marcada.tipo].coste)} €
                </div>
              </div>
            )}
          </div>
        );
      })}

      {nSel > 0 && (
        <div style={{ ...ST.card, padding: 12, marginTop: 4, marginBottom: 12, borderColor: avisos.length ? P.alert : P.ink }}>
          {avisos.map((a2) => (
            <div key={a2.serie} style={{ fontSize: T.aux, color: P.alert, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
              Serie {a2.serie}: quedarían {a2.disponibles} unidades disponibles y hacen falta {a2.enServicio} para cubrir el turno.
            </div>
          ))}
          <button
            onClick={confirmar}
            disabled={Object.values(sel).some((v) => !v.dep)}
            style={{ width: "100%", background: P.solido, color: P.blanco, border: "none", borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontSize: T.alto, fontWeight: 700, cursor: "pointer" }}
          >
            Enviar {nSel} unidad{nSel === 1 ? "" : "es"} · {nf(coste)} €
          </button>
        </div>
      )}

      {/* ── capacidad y material dentro ── */}
      <div style={{ ...ST.eyebrow, margin: "14px 0 6px" }}>Talleres</div>
      {Object.keys(TALLERES).map((dep) => {
        const t = TALLERES[dep];
        const { ajenas, propias, libres } = plazasTaller(g, dep, semilla);
        const reservadas = Object.values(sel).filter((v) => v.dep === dep).length;
        const dentro = Object.entries(g.taller).filter(([, v]) => v.dep === dep);
        const desplegado = tallerAbierto === dep;
        return (
          <div key={dep} style={{ ...ST.card, padding: "10px 12px", marginBottom: 8 }}>
            <div
              onClick={() => dentro.length && setTallerAbierto(desplegado ? null : dep)}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: dentro.length ? "pointer" : "default" }}
            >
              <Enlace txt={dep} bg={(DEPOSITOS[dep] || {}).color || P.muted} />
              <span style={{ fontSize: T.aux, color: P.muted, flex: 1 }}>{t.series.join(" y ")}</span>
              {dentro.length > 0 && (
                <span style={{ fontSize: T.aux, fontWeight: 700, color: COLOR.rojo }}>
                  {dentro.length} dentro {desplegado ? "▲" : "▼"}
                </span>
              )}
              <span style={{ fontSize: T.aux, fontWeight: 700, color: libres - reservadas > 0 ? P.ok : P.alert }}>
                {Math.max(0, libres - reservadas)} libres
              </span>
            </div>
            <div style={{ display: "flex", height: 7, borderRadius: R.menudo, overflow: "hidden", marginTop: 8, background: P.sunken }}>
              {Array.from({ length: t.plazas }).map((_, k) => (
                <div
                  key={k}
                  style={{
                    flex: 1,
                    background: k < ajenas ? P.muted : k < ajenas + propias ? COLOR.rojo : k < ajenas + propias + reservadas ? P.warn : P.ok,
                    borderRight: k < t.plazas - 1 ? "1px solid #fff" : "none",
                  }}
                />
              ))}
            </div>

            {desplegado && (
              <div style={{ marginTop: 8, borderTop: `1px solid ${P.sunken}`, paddingTop: 8 }}>
                {dentro.map(([uid, v], k) => {
                  const cu = CATALOGO.find((x) => x.id === uid);
                  const parcial = REVISIONES[v.tipo].quita * ((REVISIONES[v.tipo].turnos - v.restan) / REVISIONES[v.tipo].turnos);
                  return (
                    <div key={uid} style={{ padding: "7px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k) }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>{uid}</span>
                        {cu && cu.deposito !== dep && <Enlace txt={cu.deposito} bg={(DEPOSITOS[cu.deposito] || {}).color || P.muted} />}
                        <span style={{ fontSize: T.aux, color: P.muted, flex: 1, textAlign: "right", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {REVISIONES[v.tipo].n}
                        </span>
                        <span style={{ fontSize: T.aux, fontWeight: 700, color: v.restan > 0 ? P.warn : P.ok, flexShrink: 0 }}>
                          {v.restan > 0 ? `${v.restan} turno${v.restan === 1 ? "" : "s"}` : "lista"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: T.menor, color: P.muted, flex: 1 }}>
                          {v.restan > 0
                            ? `Si sale ahora: ${Math.round(v.entrada)}% → ${Math.round(Math.max(0, v.entrada - parcial))}%`
                            : `${Math.round(v.entrada)}% → ${Math.round(Math.max(0, v.entrada - REVISIONES[v.tipo].quita))}%`}
                        </span>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setGestion(uid);
                          }}
                          style={{
                            background: v.restan > 0 ? P.surface : P.ok,
                            color: v.restan > 0 ? P.warn : P.blanco,
                            border: `1px solid ${v.restan > 0 ? P.warn : P.ok}`,
                            borderRadius: R.normal,
                            padding: "4px 10px",
                            fontSize: T.aux,
                            fontWeight: 700,
                            fontFamily: "inherit",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {v.restan > 0 ? "Sacar antes" : "Sacar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── flota, solo consulta ── */}
      <button
        onClick={() => setVerFlota(!verFlota)}
        style={{ width: "100%", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, marginTop: 8, fontFamily: "inherit", fontSize: T.base, fontWeight: 600, cursor: "pointer", color: P.ink }}
      >
        {verFlota ? "Ocultar" : "Ver"} flota completa · {nf(CATALOGO.length)} unidades
      </button>

      {verFlota &&
        Object.keys(TALLERES).map((dep) => {
          const uds = CATALOGO.filter((u) => u.deposito === dep);
          if (!uds.length) return null;
          const abierta = abierto === dep;
          return (
            <div key={dep} style={{ ...ST.card, padding: 12, marginTop: 8 }}>
              <button onClick={() => setAbierto(abierta ? null : dep)} style={{ all: "unset", display: "flex", alignItems: "center", gap: 8, width: "100%", cursor: "pointer" }}>
                <Enlace txt={dep} bg={(DEPOSITOS[dep] || {}).color || P.muted} />
                <span style={{ fontSize: T.aux, color: P.muted, flex: 1 }}>{uds.length} unidades</span>
                <span style={{ fontSize: T.aux, color: P.muted }}>{abierta ? "▲" : "▼"}</span>
              </button>
              {abierta && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${P.sunken}`, paddingTop: 8 }}>
                  {uds.map((u0, k) => {
                    const dv = desgasteDe(g, u0.id);
                    const est = estadoUnidad(g, u0.id);
                    return (
                      <div
                        key={u0.id}
                        onClick={() => verUnidad(u0.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k), cursor: "pointer" }}
                      >
                        <span style={{ fontSize: T.base, fontWeight: 700, fontFamily: MONO, width: 62, flexShrink: 0 }}>{u0.id}</span>
                        <span style={{ fontSize: T.aux, fontFamily: MONO, width: 40, color: colDesgaste(dv), flexShrink: 0 }}>
                          {Math.round(dv)}%
                        </span>
                        <span style={{ fontSize: T.menor, fontWeight: 700, color: est.c, flex: 1, textAlign: "right", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {est.corto}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

function PerfilUnidad({ g, id, close, volverA, volver, verTaller, gestionar, camp }) {
  const arrastre = useCerrarArrastrando(close); // antes de cualquier return
  const cat = CATALOGO.find((u) => u.id === id);
  if (!cat) return null;
  // el estado vivo está en el tren o en el apartadero; si no, es del catálogo
  const tren = g.trenes.find((t) => t.unidades.some((u) => u.id === id));
  const enTren = tren ? tren.unidades.find((u) => u.id === id) : null;
  let lote = null;
  let estIdx = null;
  for (const [k, lista] of Object.entries(g.apartado || {}))
    for (const x of lista)
      if (x.unidades.some((u) => u.id === id)) {
        lote = x;
        estIdx = Number(k);
      }
  const base = enTren || (lote && lote.unidades.find((x) => x.id === id)) || cat;
  const dv = desgasteDe(g, id);
  const u = { ...base, desgaste: dv, fiab: fiabDesgaste(dv) };
  const pareja = tren ? tren.unidades.filter((x) => x.id !== id) : lote ? lote.unidades.filter((x) => x.id !== id) : [];
  // las marchas reales del tren que lleva esta unidad, no las teóricas
  const marchas = tren ? tren.marchas || [] : [];
  const enCursoU = tren ? marchaEnCurso(tren) : null;

  const situacionTxt = tren
    ? `En servicio · circulación ${tren.i}`
    : lote
    ? `${lote.averiado ? "Averiada, fuera de servicio" : "Apartada"} en ${ESTACIONES[estIdx].n}, ${lote.via}`
    : cat.enTaller
    ? "En taller"
    : "En reserva en Fuencarral";

  const filas = [
    ["Serie", `${u.serie} · ${SERIES[u.serie].desc}`],
    [
      "Taller",
      <button key="dep" onClick={() => verTaller && verTaller(u.deposito)} style={{ all: "unset", cursor: verTaller ? "pointer" : "default" }}>
        <Enlace txt={u.deposito} bg={DEPOSITOS[u.deposito].color} />
      </button>,
    ],
    ["Lote", u.lote],
    ["Año de fabricación", String(u.anio)],
    ["Composición", `${u.coches} coches`],
    ["Potencia", `${nf(u.potencia)} kW`],
    ["Velocidad máxima", `${u.vmax} km/h`],
    ["Plazas", nf(u.plazas)],
  ];

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 68 }}>
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "88vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out", ...arrastre.style }}
      >
        <Asa arrastre={arrastre.props} close={close} />
        {volverA && (
          <button onClick={volver} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.base, fontWeight: 600, color: P.muted, marginBottom: 8 }}>
            ‹ Volver a {volverA.nombre}
          </button>
        )}
        <div style={ST.eyebrow}>Material rodante</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "3px 0 2px" }}>
          <span style={{ fontSize: T.cabecera, fontWeight: 700, fontFamily: MONO, letterSpacing: -1 }}>{u.id}</span>
          {u.reformada && <Etiqueta txt="Reformada" c={P.ok} />}
        </div>
        <div style={{ fontSize: T.base, fontWeight: 600, color: lote && lote.averiado ? P.alert : P.muted, marginBottom: 16 }}>{situacionTxt}</div>

        <Bloque titulo="Ficha técnica">
          {filas.map(([k, v], n) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(n), fontSize: T.base }}>
              <span style={{ color: P.muted }}>{k}</span>
              <span style={{ fontWeight: 600, fontFamily: typeof v === "string" ? MONO : "inherit" }}>{v}</span>
            </div>
          ))}
        </Bloque>

        <Bloque titulo="Estado">
          <div style={{ padding: "6px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.base, marginBottom: 4 }}>
              <span style={{ color: P.muted }}>Fiabilidad</span>
              <span style={{ fontWeight: 700, fontFamily: MONO, color: u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }}>
                {Math.round(u.fiab * 100)} %
              </span>
            </div>
            <div style={{ height: 5, background: P.sunken, borderRadius: R.menudo, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${u.fiab * 100}%`, height: "100%", background: u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.base, marginBottom: 4 }}>
              <span style={{ color: P.muted }}>Desgaste</span>
              <span style={{ fontWeight: 700, fontFamily: MONO, color: !cubreTurno(u) ? P.alert : turnosRestantes(u) < 2 ? P.warn : P.ink }}>
                {Math.round(u.desgaste)} %
              </span>
            </div>
            <div style={{ fontSize: T.aux, color: P.muted }}>
              {cubreTurno(u)
                ? `Le quedan ${turnosRestantes(u).toFixed(1)} turnos · ${tasaDesgaste(u)} pts por cada 100 km`
                : `No cubre el turno completo: agotaría el ciclo`}
            </div>
          </div>
        </Bloque>

        <Bloque titulo="Acoplamiento">
          <div style={{ padding: "6px 0", fontSize: T.base }}>
            {pareja.length === 0 ? (
              <span style={{ color: P.muted }}>{SERIES[u.serie].doble ? "Sin acoplar" : "Composición simple: circula sola"}</span>
            ) : (
              pareja.map((x) => (
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ fontFamily: MONO, fontWeight: 700 }}>{x.id}</span>
                  <span style={{ color: P.muted }}>{nf(x.plazas)} plazas · fiab. {Math.round(x.fiab * 100)} %</span>
                </div>
              ))
            )}
            {tren && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.sunken}`, color: P.muted }}>
                Oferta conjunta del tren: {nf(plazasDe(tren))} plazas
              </div>
            )}
          </div>
        </Bloque>

        {/* Libro de averías: lo que le ha pasado a esta unidad, cuándo, y si
            quedó resuelto. Es el historial que decide si conviene mandarla al
            taller o si puede seguir dando servicio.                     */}
        <Bloque titulo="Libro de averías">
          {(() => {
            const hoja = [...((camp && camp.libro && camp.libro[id]) || [])];
            // lo declarado en el turno en curso aún no está en la campaña
            for (const av of g.averiasTurno || []) if (av.id === id) hoja.push({ dia: null, turno: av.turno, m: av.m, nombre: av.nombre, grado: av.grado, resuelta: av.resuelta });
            if (!hoja.length) return <Vacio icono="✓" txt="Sin averías registradas" pista="Esta unidad no ha dado ningún problema." />;
            return [...hoja].reverse().map((x, k) => (
              <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "7px 0", borderBottom: k < hoja.length - 1 ? `1px solid ${P.sunken}` : "none" }}>
                <span style={{ fontSize: T.micro, fontFamily: MONO, color: P.muted, width: 74, flexShrink: 0 }}>
                  {x.dia ? `D${x.dia} ` : "hoy "}
                  {hhmm(x.m)}
                </span>
                <span style={{ fontSize: T.aux, flex: 1, minWidth: 0 }}>
                  {x.nombre}
                  <span style={{ color: P.muted }}> · {x.grado === "muygrave" ? "muy grave" : x.grado}</span>
                </span>
                <Etiqueta
                  txt={x.taller ? (x.taller === "reparada" ? "Reparada" : `Taller ${x.taller}`) : x.resuelta ? "Resuelta" : "Sin reparar"}
                  c={x.resuelta ? P.ok : P.alert}
                />
              </div>
            ));
          })()}
        </Bloque>

        <Bloque titulo="Trenes que hace hoy">
          {marchas.length === 0 && <Vacio icono="—" txt="Sin servicio en este turno" pista="Esta unidad no tiene circulación asignada." />}
          {marchas.map((x, k) => {
            const enCurso = enCursoU === x;
            const pasada = x.estado === "hecha";
              const desde = x.desde;
            const hasta = pasada && x.hastaReal ? x.hastaReal : x.hasta;
            const hIni = x.iniReal !== undefined ? x.iniReal : x.ini;
            const hFin = pasada && x.finReal !== undefined ? x.finReal : x.fin;
            const tarde = pasada && x.finReal !== undefined && x.finReal - x.fin > 2;
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k), opacity: pasada ? 0.45 : 1 }}>
                <span style={{ fontSize: T.aux, fontWeight: 700, fontFamily: MONO, color: P.blanco, background: enCurso ? COLOR.rojo : pasada ? P.solido : P.muted, borderRadius: R.menudo, padding: "1px 6px", flexShrink: 0 }}>
                  {x.num}
                </span>
                <span style={{ fontSize: T.base, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "17px" }}>
                  {desde} → {hasta}
                  {x.motivo && <span style={{ color: P.warn, fontWeight: 600 }}> · {x.motivo}</span>}
                </span>
                <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO, flexShrink: 0 }}>
                  <span style={{ color: tarde ? P.warn : "inherit" }}>
                    {hhmm(hIni)} – {hhmm(hFin)}
                  </span>
                </span>
              </div>
            );
          })}
        </Bloque>

        {gestionar && (
          <button
            onClick={() => gestionar(id)}
            style={{ width: "100%", background: P.surface, color: P.ink, border: `1px solid ${g.taller[id] ? P.warn : P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", marginBottom: 8 }}
          >
            {g.taller[id] ? "Gestionar salida de taller" : "Enviar a taller"}
          </button>
        )}
        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PerfilTren({ g, i, close, setRotarDe, setApartarDe, setSuprimirDe, setReponerDe, volverA, volver, verUnidad }) {
  const [infoAtr, setInfoAtr] = useState(null); // antes de cualquier return
  const arrastre = useCerrarArrastrando(close);
  const t = g.trenes.find((x) => x.i === i);
  if (!t) return null;
  const sit = situacion(t, g.reloj);
  const m = t.maq ? maqDe(g, t) : null;
  const supr = t.estado === "suprimido";
  const aBordo = t.pax.reduce((a, b) => a + b, 0);
  const cap = plazasDe(t) || 1;
  const oc = Math.min(100, (aBordo / cap) * 100);
  /* Rotación: primero lo que el tren ha hecho de verdad, y a continuación lo
     que le queda por hacer según el cuadro. Si rota antes o se retira, la
     marcha real se cierra donde toque y no donde estaba previsto.       */
  const marchas = t.marchas || [];
  const enCursoM = marchaEnCurso(t);


  const estadoTxt = supr
    ? "Fuera de servicio"
    : t.rotando
    ? `Rotando en ${ESTACIONES[t.rotando.idx].n}`
    : t.retenido
    ? `Retenido en ${t.retenido}`
    : t.esperaCab
    ? `Esperando vía en ${t.esperaCab.cab}`
    : t.detenido
    ? `Detenido · ${t.detenido.restante} min`
    : describir(sit);

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", animation: "cgo-fondo .18s ease-out", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 66 }}>
      <div
        onClick={(ev) => ev.stopPropagation()}
        style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "88vh", overflowY: "auto", borderRadius: `${R.grande + 2}px ${R.grande + 2}px 0 0`, padding: 16, boxShadow: SOMBRA.hoja, animation: "cgo-hoja .22s ease-out", ...arrastre.style }}
      >
        <Asa arrastre={arrastre.props} close={close} />
        {volverA && (
          <button
            onClick={volver}
            style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: T.base, fontWeight: 600, color: P.muted, marginBottom: 8 }}
          >
            ‹ Volver a {volverA.nombre}
          </button>
        )}
        <div style={ST.eyebrow}>Circulación {t.i}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span
            style={{
              fontSize: T.base,
              fontWeight: 700,
              color: P.blanco,
              // el material en vacío no presta servicio en ninguna línea
              background: t.esVacio ? P.solido : LIN[LINEA],
              borderRadius: R.menudo,
              // mismo tamaño exacto que la pastilla de la línea, aunque "MV"
              // ocupe menos: si no, el número de tren bailaba de sitio
              padding: "2px 0",
              minWidth: 34,
              textAlign: "center",
              fontFamily: MONO,
              flexShrink: 0,
            }}
          >
            {t.esVacio ? "MV" : LINEA}
          </span>
          <span style={{ fontSize: T.cabecera, fontWeight: 700, fontFamily: MONO, letterSpacing: -1 }}>{numeroTren(t, g.reloj)}</span>
          <span style={{ fontSize: T.titulo, fontWeight: 700, fontFamily: MONO, color: colRetraso(retrasoEfectivo(t)) }}>
            {supr ? "—" : retTxt(retrasoEfectivo(t))}
          </span>
        </div>
        <div style={{ fontSize: T.alto, fontWeight: 600, marginBottom: 16 }}>{estadoTxt}</div>

        <Bloque titulo="Composición">
          <div style={{ padding: "6px 0" }}>
            {t.unidades.length === 0 && <Vacio icono="⊘" txt="Circulación sin material" pista="Asígnale una composición para devolverla al servicio." />}
            {t.unidades.map((u, ku) => (
              <div key={u.id} onClick={() => verUnidad && verUnidad(u.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(ku), fontSize: T.base, cursor: verUnidad ? "pointer" : "default" }}>
                <span style={{ fontFamily: MONO, fontWeight: 700, borderBottom: verUnidad ? `1px dotted ${P.rule}` : "none" }}>{u.id}</span>
                <span style={{ color: P.muted, fontSize: T.aux }}>
                  {nf(u.plazas)} pl · fiab {Math.round(u.fiab * 100)}% · desgaste {Math.round(u.desgaste)} %
                </span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${P.sunken}`, marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.aux, color: P.muted, marginBottom: 4 }}>
                <span>Ocupación</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: colOcupacion(oc) }}>
                  {nf(aBordo)} / {nf(cap)} · {Math.round(oc)}%
                </span>
              </div>
              <div style={{ height: 6, background: P.sunken, borderRadius: R.menudo, overflow: "hidden" }}>
                <div style={{ width: `${oc}%`, height: "100%", background: colOcupacion(oc) }} />
              </div>
            </div>
          </div>
        </Bloque>

        {m && (
          <Bloque titulo="Conducción">
            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: T.alto, fontWeight: 600 }}>{m.nombre}</span>
                <Media m={m} />
              </div>
              <div style={{ fontSize: T.aux, color: P.muted }}>
                {dur(m.cond)} de conducción continua · jornada {dur(m.jornada)}
              </div>
              <div style={{ fontSize: T.aux, color: t.excesoAutorizado ? P.alert : P.muted, marginTop: 4 }}>
                {t.excesoAutorizado ? "Conduciendo por encima del límite" : t.relevo ? `Relevo previsto ${hhmm(t.relevo.prevista)} en ${t.relevo.cab}` : "Sin relevo en el turno"}
              </div>
              <Atributos m={m} onInfo={(k) => setInfoAtr((x) => (x === k ? null : k))} />
              {infoAtr && (
                <div style={{ marginTop: 8, background: P.sunken, borderRadius: R.normal, padding: "9px 11px", fontSize: T.aux, color: P.muted, lineHeight: 1.45 }}>
                  <strong style={{ color: P.ink }}>{INFO_ATRIB[infoAtr].n}</strong>: {INFO_ATRIB[infoAtr].t}
                </div>
              )}
            </div>
          </Bloque>
        )}

        <Bloque titulo="Histórico de retraso">
          <div style={{ padding: "4px 0" }}>
            {t.hist.length === 0 && t.acum.paradas < 0.5 && (t.acum.bloqueo || 0) < 0.5 && Math.abs(t.acum.maquinista) < 0.5 && (
              <Vacio icono="✓" txt="Sin incidencias" pista="La circulación marcha conforme al horario." />
            )}
            {t.hist.map((h, k) => (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "5px 10px", margin: "0 -12px", borderRadius: R.normal, background: fondoFila(k), fontSize: T.base }}>
                <span style={{ color: P.muted, fontFamily: MONO, flexShrink: 0 }}>{hhmm(h.m)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{h.txt}</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: h.min > 0 ? P.alert : P.ok, flexShrink: 0 }}>
                  {h.min > 0 ? `+${Math.round(h.min)}` : Math.round(h.min)}′
                </span>
              </div>
            ))}
            {(t.acum.paradas >= 0.5 || (t.acum.bloqueo || 0) >= 0.5 || Math.abs(t.acum.maquinista) >= 0.5) && (
              <div style={{ borderTop: `1px solid ${P.sunken}`, marginTop: 8, paddingTop: 8 }}>
                {t.acum.paradas >= 0.5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.base, padding: "2px 0" }}>
                    <span style={{ color: P.muted }}>Exceso de tiempo de parada</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: P.alert }}>+{Math.round(t.acum.paradas)}′</span>
                  </div>
                )}
                {(t.acum.bloqueo || 0) >= 0.5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.base, padding: "2px 0" }}>
                    <span style={{ color: P.muted }}>Marcha condicionada por el tren de delante</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: P.alert }}>+{Math.round(t.acum.bloqueo)}′</span>
                  </div>
                )}
                {Math.abs(t.acum.maquinista) >= 0.5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.base, padding: "2px 0" }}>
                    <span style={{ color: P.muted }}>Marcha de {m ? m.nombre : "el maquinista"}</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: t.acum.maquinista > 0 ? P.alert : P.ok }}>
                      {t.acum.maquinista > 0 ? "+" : ""}
                      {Math.round(t.acum.maquinista)}′
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Bloque>

        <Bloque titulo="Gráfico de marcha">
          <Malla t={{ ...t, ahora: g.reloj }} />
        </Bloque>

        <Bloque titulo="Rotación del día">
          {marchas.map((x, k) => {
            // previsión hasta que termina; después, lo que de verdad pasó
            const enCurso = x.estado === "curso";
            const pasada = x.estado === "hecha";
            const desde = x.desde;
            const hasta = pasada && x.hastaReal ? x.hastaReal : x.hasta;
            const hIni = x.iniReal !== undefined ? x.iniReal : x.ini;
            const hFin = pasada && x.finReal !== undefined ? x.finReal : x.fin;
            const tarde = pasada && x.finReal !== undefined && x.finReal - x.fin > 2;
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 0",
                  background: fondoFila(k),
                  margin: "0 -12px",
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: R.normal,
                  opacity: pasada ? 0.5 : 1,
                  color: enCurso ? P.ink : "inherit",
                  fontWeight: enCurso ? 600 : 400,
                }}
              >
                <span style={{ fontSize: T.aux, fontWeight: 700, fontFamily: MONO, color: P.blanco, background: enCurso ? COLOR.rojo : pasada ? P.solido : P.muted, borderRadius: R.menudo, padding: "1px 6px", flexShrink: 0 }}>
                  {x.num}
                </span>
                <span style={{ fontSize: T.base, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "17px" }}>
                  {desde} → {hasta}
                  {x.motivo && <span style={{ color: P.warn, fontWeight: 600 }}> · {x.motivo}</span>}
                </span>
                <span style={{ fontSize: T.aux, color: P.muted, fontFamily: MONO, flexShrink: 0 }}>
                  <span style={{ color: tarde ? P.warn : "inherit" }}>
                    {hhmm(hIni)} – {hhmm(hFin)}
                  </span>
                </span>
              </div>
            );
          })}
        </Bloque>

        <AccionesTren
          t={t}
          supr={supr}
          dir={sit.dir}
          grande
          onRotar={() => {
            close();
            setRotarDe(t.i);
          }}
          onApartar={() => {
            close();
            setApartarDe(t.i);
          }}
          onSuprimir={() => {
            close();
            setSuprimirDe(t.i);
          }}
        />
        <div style={{ height: 10 }} />

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: T.alto, cursor: "pointer", color: P.ink }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function FilaVia({ g, tren, txt, col, fondo, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end", minWidth: 0, cursor: onClick ? "pointer" : "default" }}
    >
      <span style={{ fontSize: T.aux, color: P.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
        {tren.unidades.map((u) => u.id).join(" + ")}
        <br />
        <span style={{ color: col, fontWeight: 700 }}>{txt}</span>
      </span>
      <span style={{ fontSize: T.aux, fontWeight: 700, fontFamily: MONO, color: P.blanco, background: fondo, borderRadius: R.menudo, padding: "1px 6px", flexShrink: 0 }}>
        {numeroTren(tren, g.reloj)}
      </span>
    </span>
  );
}

function Bloque({ titulo, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...ST.eyebrow, marginBottom: 8 }}>{titulo}</div>
      <div style={{ background: P.surface, border: `1px solid ${P.rule}`, borderRadius: R.grande, padding: "4px 12px 10px" }}>{children}</div>
    </div>
  );
}

function Enlace({ txt, bg }) {
  return <span style={{ fontSize: T.micro, fontWeight: 700, color: P.blanco, background: bg, borderRadius: R.menudo, padding: "1px 4px", fontFamily: MONO, flexShrink: 0 }}>{txt}</span>;
}

function Libro({ g }) {
  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const activos = g.trenes.filter((t) => t.estado !== "suprimido");
  const retrasoMedio = activos.length ? activos.reduce((n, t) => n + retrasoEfectivo(t), 0) / activos.length : 0;
  const enAnden = g.andenes.reduce((n, a) => n + a.alcala + a.pio, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>
        <Kpi k="Punt." v={`${punt.toFixed(0)}%`} c={colPuntualidad(punt)} small />
        <Kpi k="Retraso" v={`${retrasoMedio.toFixed(1)}′`} c={colRetrasoMedio(retrasoMedio)} small />
        <Kpi k="Circul." v={`${activos.length}/${CIRCULACIONES}`} c={activos.length === CIRCULACIONES ? P.ok : P.warn} small />
        <Kpi k="Andén" v={nf(enAnden)} c={enAnden > 4000 ? P.alert : P.ink} small />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginBottom: 12 }}>
        <Kpi k="Afectados" v={nf(g.kpi.afect)} c={g.kpi.afect > 6000 ? P.alert : P.ink} small />
        <Kpi k="Coste" v={`${(g.kpi.coste / 1000).toFixed(1)}k €`} c={P.ink} small />
        <Kpi k="Incid." v={String(g.incCount)} c={P.ink} small />
      </div>

      <div style={{ ...ST.card, padding: 12, maxHeight: 460, overflowY: "auto" }}>
      {[...g.log].reverse().map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: T.base, lineHeight: 1.4 }}>
          <span style={{ color: P.muted, fontFamily: MONO, flexShrink: 0 }}>{hhmm(l.m)}</span>
          <span style={{ color: l.k === "bad" ? P.alert : l.k === "aviso" ? P.warn : l.k === "ok" ? P.ok : P.muted }}>{l.t}</span>
        </div>
      ))}
      </div>

    </div>
  );
}

/* Velocidades de la partida. La media velocidad sirve para los momentos en
   que hay varias decisiones encima y el minuto se queda corto.           */
const VELOCIDADES = [0.5, 1, 4, 10, 40];
const velTxt = (v) => (v === 0.5 ? "0,5" : String(v));

/* ── color con significado ──────────────────────────────────────
   Verde, ámbar y rojo querían decir cosas distintas en cada pantalla: el
   retraso de un tren se ponía ámbar a partir de 1 minuto y la media de la
   línea a partir de 3. Ahora hay una sola definición de bien, regular y mal,
   y todos los indicadores la usan.

   El corte del retraso es el mismo que el de la puntualidad del juego: un
   tren es puntual hasta los 5 minutos y medio.                          */
const nivelCol = (v, bien, regular, alRevés = false) => {
  const dentro = (x, lim) => (alRevés ? x >= lim : x <= lim);
  if (dentro(v, bien)) return P.ok;
  if (dentro(v, regular)) return P.warn;
  return P.alert;
};

const UMBRAL = {
  retraso: [5, 10], // minutos: puntual hasta 5, tolerable hasta 10
  ocupacion: [70, 92], // por ciento de plazas
  desgaste: [60, 85], // por ciento de ciclo consumido
  puntualidad: [92, 75], // por ciento, al revés: más es mejor
  jornada: [0.6, 0.85], // proporción de la jornada máxima
  espera: [15, 30], // minutos que un tren lleva esperando
  anden: [180, 400], // viajeros acumulados en un andén
};

const colRetraso = (n) => nivelCol(rt(n), ...UMBRAL.retraso);
const colRetrasoMedio = (n) => nivelCol(n, ...UMBRAL.retraso);
const colOcupacion = (pct) => nivelCol(pct, ...UMBRAL.ocupacion);
const colDesgaste = (pct) => nivelCol(pct, ...UMBRAL.desgaste);
const colPuntualidad = (pct) => nivelCol(pct, ...UMBRAL.puntualidad, true);
const fondoFila = (k) => (k % 2 ? P.sunken : P.surface);
const colAtrib = (v) => (v >= 70 ? P.ok : v >= 40 ? P.warn : P.alert);

function Media({ m }) {
  const v = mediaAtrib(m);
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: T.aux,
        fontWeight: 700,
        color: P.blanco,
        background: colAtrib(v),
        borderRadius: R.menudo,
        padding: "1px 5px",
        flexShrink: 0,
      }}
      title={`Puntualidad ${m.pun} · Profesionalidad ${m.pro} · Conocimiento ${m.con}`}
    >
      {v}
    </span>
  );
}

const INFO_ATRIB = {
  pun: {
    k: "PUN",
    n: "Puntualidad",
    t: "La habilidad que determina si el maquinista recupera tiempo de retraso, tiene capacidad para ir en hora o si, en cambio, va perdiendo tiempo.",
  },
  pro: {
    k: "PRO",
    n: "Profesionalidad",
    t: "La habilidad del maquinista para atender correctamente a los viajeros y mejorar su experiencia. (Aún no implementada)",
  },
  con: {
    k: "CON",
    n: "Conocimiento",
    t: "La capacidad de un maquinista para resolver averías por su cuenta. Un maquinista con alto atributo de conocimiento te podrá evitar muchos problemas. Un maquinista con un bajo atributo de conocimiento te los creará.",
  },
};

function Atributos({ m, onInfo, plegable, saliendo }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 8,
        /* En la ficha de tren el bloque se pliega, así que se anima también su
           altura y la tarjeta acompaña al contenido. En Personal está fijo y
           no necesita nada.                                              */
        overflow: plegable ? "hidden" : "visible",
        animation: !plegable ? "none" : saliendo ? "cgo-cierra .26s ease-in forwards" : "cgo-abre .26s ease-out",
      }}
    >
      {["pun", "pro", "con"].map((k) => {
        const v = m[k];
        return (
          <div key={k} style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <button
                onClick={() => onInfo && onInfo(k)}
                style={{ all: "unset", cursor: "pointer", fontSize: T.micro, color: P.muted, fontWeight: 700, letterSpacing: 0.6, borderBottom: `1px dotted ${P.rule}` }}
              >
                {INFO_ATRIB[k].k}
              </button>
              <span style={{ color: colAtrib(v), fontFamily: MONO, fontWeight: 700, fontSize: T.menor }}>{v}</span>
            </div>
            <div style={{ height: 3, background: P.sunken, borderRadius: R.hilo, overflow: "hidden", marginTop: 2 }}>
              <div style={{ width: `${v}%`, height: "100%", background: colAtrib(v) }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Las tres acciones de mando sobre un tren, siempre visibles y en una fila.
   Solo se inhabilitan cuando la acción es materialmente imposible: un tren
   suprimido, o uno que ya está ejecutando esa misma maniobra.            */
function AccionesTren({ t, supr, dir, onRotar, onApartar, onSuprimir, grande }) {
  const acciones = [
    { l: "Rotar", c: P.warn, on: onRotar, no: supr || t.rotando || t.rotacion || dir === "maniobra" },
    { l: "Apartar", c: P.ink, on: onApartar, no: supr || t.rotando || t.enDesviada || t.apartaPaso || dir === "maniobra" },
    { l: "Suprimir", c: P.alert, on: onSuprimir, no: supr || t.supresion || dir === "maniobra" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
      {acciones.map((a2) => (
        <button
          key={a2.l}
          disabled={a2.no}
          onClick={(ev) => {
            ev.stopPropagation();
            a2.on();
          }}
          style={{
            flex: 1,
            background: P.surface,
            color: a2.no ? P.muted : a2.c,
            border: `1px solid ${a2.no ? P.sunken : a2.c}`,
            borderRadius: R.normal,
            padding: grande ? "11px 0" : "8px 0",
            fontFamily: "inherit",
            fontSize: grande ? 13.5 : 12.5,
            fontWeight: 700,
            cursor: a2.no ? "not-allowed" : "pointer",
            opacity: a2.no ? 0.45 : 1,
          }}
        >
          {a2.l}
        </button>
      ))}
    </div>
  );
}

/* Cierre por arrastre de las hojas de perfil. El gesto natural en una hoja
   inferior es empujarla hacia abajo, así que se escucha el puntero sobre el
   propio panel.

   La clave es no pelearse con el desplazamiento: el arrastre solo empieza si
   el contenido está arriba del todo. Si el jugador está a media lectura y tira
   hacia abajo, lo que quiere es seguir leyendo, no cerrar.               */
const ARRASTRE_MINIMO = 8; // por debajo se considera un toque, no un arrastre
const ARRASTRE_CIERRE = 95; // a partir de aquí se cierra al soltar

function useCerrarArrastrando(close) {
  const [dy, setDy] = useState(0);
  const est = useRef({ activo: false, y0: 0, dy: 0 });

  const onPointerDown = (e) => {
    // el asa captura el puntero: el gesto es suyo hasta que se suelte
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    est.current = { activo: true, y0: e.clientY, dy: 0 };
  };

  const onPointerMove = (e) => {
    if (!est.current.activo) return;
    const d = e.clientY - est.current.y0;
    est.current.dy = d;
    // solo se arrastra hacia abajo, y con algo de resistencia al principio
    setDy(d > ARRASTRE_MINIMO ? d - ARRASTRE_MINIMO : 0);
  };

  const soltar = () => {
    if (!est.current.activo) return;
    const d = est.current.dy;
    est.current = { activo: false, y0: 0, dy: 0 };
    if (d - ARRASTRE_MINIMO > ARRASTRE_CIERRE) close();
    else setDy(0);
  };

  return {
    // manejadores para el asa
    props: {
      onPointerDown,
      onPointerMove,
      onPointerUp: soltar,
      onPointerCancel: soltar,
    },
    // desplazamiento para el panel
    style: {
      transform: dy ? `translateY(${dy}px)` : "none",
      transition: est.current.activo ? "none" : "transform .2s ease-out",
    },
  };
}

/* Asa de la hoja. Es la única zona que arrastra: si el gesto se escucha en
   todo el panel choca con la recarga del navegador y con el desplazamiento
   del contenido. Al lado va un cierre explícito, que es lo que la mayoría
   va a usar.                                                             */
function Asa({ arrastre, close }) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "-4px 0 8px", position: "relative" }}>
      <div
        {...(arrastre || {})}
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "8px 0",
          cursor: "grab",
          touchAction: "none", // el gesto vertical es de la hoja, no del navegador
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: R.hilo, background: P.rule }} />
      </div>
      {close && (
        <button
          onClick={close}
          title="Cerrar"
          style={{
            position: "absolute",
            right: 12,
            border: "none",
            background: "transparent",
            color: P.muted,
            fontSize: T.titulo,
            lineHeight: 1,
            padding: "4px 8px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/* Estado vacío. Repartidos por el juego había una docena de huecos resueltos
   con una frase en gris, que parecían un error del programa en vez de una
   situación normal. Este componente les da un tratamiento común: una marca,
   la frase y, si procede, qué hacer al respecto.                         */
/* Ficha de la línea: lo que el jugador necesita saber de la C-7 sin tener que
   deducirlo recorriendo el mapa. Todo se calcula de los propios datos, así que
   no puede quedar desfasada al tocar la infraestructura.                 */
function InfoLinea() {
  const cabeceras = ESTACIONES.filter((e) => e.cab || e.term);
  const apeaderos = ESTACIONES.filter((e) => e.tipo === "ap" && !e.puesto);
  const puestos = ESTACIONES.filter((e) => e.puesto);
  const soterradas = ESTACIONES.filter((e) => e.sot);
  const conServicio = N - puestos.length;
  const fila = { display: "flex", gap: 8, fontSize: T.aux, lineHeight: 1.5, marginBottom: 6 };
  const clave = { color: P.muted, flex: "0 0 104px" };

  return (
    <div style={{ ...ST.card, padding: 12, marginBottom: 8, animation: "cgo-entra .2s ease-out" }}>
      <div style={{ ...ST.eyebrow, marginBottom: 8 }}>
        {LINEA} · {ESTACIONES[0].n} – {ESTACIONES[N - 1].n}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        <Kpi k="Longitud" v={`${LONGITUD} km`} c={P.ink} small />
        <Kpi k="Recorrido" v={`${RECORRIDO} min`} c={P.ink} small />
        <Kpi k="Intervalo" v={`${INTERVALO} min`} c={P.ink} small />
      </div>

      <div style={fila}>
        <span style={clave}>Paradas</span>
        <span>
          {conServicio} con servicio comercial de {N} puntos de la línea
        </span>
      </div>
      <div style={fila}>
        <span style={clave}>Cabeceras</span>
        <span>{cabeceras.map((e) => e.n).join(" · ")}</span>
      </div>
      <div style={fila}>
        <span style={clave}>Apeaderos</span>
        <span>
          {apeaderos.length}: {apeaderos.map((e) => e.corto).join(", ")}
        </span>
      </div>
      <div style={fila}>
        <span style={clave}>Sin servicio</span>
        <span>{puestos.map((e) => e.n).join(" · ")}, puestos de circulación donde el tren no admite viajeros</span>
      </div>
      <div style={fila}>
        <span style={clave}>Túnel</span>
        <span>{soterradas.map((e) => e.corto).join(" · ")}, en el túnel de la Risa</span>
      </div>
      <div style={fila}>
        <span style={clave}>Circulaciones</span>
        <span>{CIRCULACIONES} trenes simultáneos, uno cada {INTERVALO} minutos por sentido</span>
      </div>
      <div style={fila}>
        <span style={clave}>Rotaciones</span>
        <span>
          Rotación de {INV_ALCALA} minutos en {ALCALA} y de {INV_PIO} minutos en {PIO}
        </span>
      </div>

    </div>
  );
}

/* Gráfico de marcha de una circulación: el tiempo en horizontal y la línea en
   vertical, con las estaciones espaciadas por tiempo de recorrido y no a
   distancias iguales, como en una malla de verdad. La pendiente de cada trazo
   es la velocidad, y la separación entre lo previsto y lo real es el retraso
   que se acumula.                                                         */
/* Estaciones que se rotulan en los gráficos de marcha, con su sigla. Con el
   nombre entero el canalón se comía un tercio del ancho útil; y solo con las
   tres cabeceras costaba situar los tramos intermedios.                  */
/* Estaciones rotuladas en los gráficos de marcha, con su sigla. Cada línea
   tiene las suyas: con las de la C-7 fijas, la malla de la C-1 salía sin un
   solo rótulo.                                                         */
const SIGLAS_C7 = {
  "Príncipe Pío": "PP",
  Pozuelo: "PO",
  Pitis: "PT",
  Chamartín: "CH",
  Atocha: "MT",
  "Vicálvaro": "VI",
  "Torrejón de Ardoz": "TO",
  "Alcalá de Henares": "AH",
};

const SIGLAS_C1 = {
  "Chamartín": "MH",
  "Fuente de la Mora": "FM",
  Valdebebas: "VB",
  "Aeropuerto T4": "BT",
};

// las de la línea que se está dibujando
const SIGLA = new Proxy({}, { get: (_, k) => (LINEA === "C-1" ? SIGLAS_C1 : SIGLAS_C7)[k] });

function Malla({ t }) {
  const AL = 190; // alto útil del gráfico
  const AN = 300; // ancho útil
  const IZQ = 20; // canalón para las siglas de cabecera
  const ARR = 12;
  const dur = FIN - INICIO;
  const tope = ESTACIONES[N - 1].t || 1;

  const x = (min) => IZQ + ((min - INICIO) / dur) * AN;
  const y = (idx) => {
    const k = Math.max(0, Math.min(N - 1, idx));
    const ent = Math.floor(k);
    const frac = k - ent;
    const a = ESTACIONES[ent].t;
    const b = ESTACIONES[Math.min(N - 1, ent + 1)].t;
    return ARR + ((a + (b - a) * frac) / tope) * AL;
  };

  // lo previsto: cada marcha del cuadro, de su origen a su destino
  const previstas = (t.marchas || []).map((m) => {
    const desde = m.dir === "alcala" ? 0 : N - 1;
    const hasta = m.dir === "alcala" ? N - 1 : 0;
    return `M ${x(m.ini).toFixed(1)} ${y(desde).toFixed(1)} L ${x(m.fin).toFixed(1)} ${y(hasta).toFixed(1)}`;
  });

  // lo real: el rastro que va dejando el tren, cortado donde no circula
  const tramos = [];
  let actual = [];
  (t.traza || []).forEach((pos, k) => {
    if (pos === null || pos === undefined) {
      if (actual.length > 1) tramos.push(actual);
      actual = [];
      return;
    }
    actual.push(`${x(INICIO + k * PASO_TRAZA).toFixed(1)} ${y(pos / 10).toFixed(1)}`);
  });
  if (actual.length > 1) tramos.push(actual);

  const horas = [];
  for (let m = Math.ceil(INICIO / 60) * 60; m <= FIN; m += 60) horas.push(m);

  return (
    <div style={{ marginTop: 8 }}>
      <svg viewBox={`0 0 ${IZQ + AN + 6} ${AL + ARR + 16}`} style={{ width: "100%", display: "block" }}>
        {/* estaciones: se rotulan solo las cabeceras para no saturar */}
        {ESTACIONES.map((e, i) => (
          <line key={e.n} x1={IZQ} y1={y(i)} x2={IZQ + AN} y2={y(i)} stroke={SIGLA[e.n] ? P.rule : P.sunken} strokeWidth={e.cab || e.term ? 1 : SIGLA[e.n] ? 0.7 : 0.5} />
        ))}
        {ESTACIONES.map((e, i) =>
          SIGLA[e.n] ? (
            <text key={`r${e.n}`} x={IZQ - 4} y={y(i) + 3} textAnchor="end" fontSize="7.5" fill={P.muted} fontFamily={MONO} fontWeight="700">
              {SIGLA[e.n] || e.corto}
            </text>
          ) : null
        )}

        {/* horas en punto */}
        {horas.map((m) => (
          <g key={m}>
            <line x1={x(m)} y1={ARR} x2={x(m)} y2={ARR + AL} stroke={P.sunken} strokeWidth="0.5" />
            <text x={x(m)} y={AL + ARR + 12} textAnchor="middle" fontSize="7" fill={P.muted} fontFamily={MONO}>
              {hhmm(m).slice(0, 2)}
            </text>
          </g>
        ))}

        {/* previsto en gris discontinuo, real en el rojo de la línea */}
        {previstas.map((d, k) => (
          <path key={`p${k}`} d={d} stroke={P.muted} strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.65" />
        ))}
        {tramos.map((pts, k) => (
          <polyline key={`r${k}`} points={pts.join(" ")} stroke={COLOR.rojo} strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {/* el instante actual */}
        <line x1={x(Math.min(FIN, Math.max(INICIO, t.ahora || INICIO)))} y1={ARR} x2={x(Math.min(FIN, Math.max(INICIO, t.ahora || INICIO)))} y2={ARR + AL} stroke={P.ink} strokeWidth="0.8" opacity="0.35" />
      </svg>

      <div style={{ display: "flex", gap: 12, fontSize: T.micro, color: P.muted, marginTop: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 14, height: 0, borderTop: `1.5px dashed ${P.muted}`, display: "inline-block" }} /> previsto
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 14, height: 2, background: COLOR.rojo, display: "inline-block", borderRadius: 1 }} /> real
        </span>
      </div>
    </div>
  );
}

/* ── gráficos de la pantalla de análisis ────────────────────────
   Todos comparten el mismo lenguaje: rejilla tenue, horas abajo y el dato
   dibujado encima. Se construyen en SVG para que escalen con la pantalla. */

// evolución de una magnitud a lo largo del turno
function Serie({ muestras, campo, color, unidad, alto = 90, relleno = true }) {
  if (!muestras || muestras.length < 2) return <Vacio icono="~" txt="Aún no hay datos" pista="La evolución aparece a los pocos minutos de turno." />;
  const AN = 320;
  const IZQ = 26;
  const vals = muestras.map((x) => x[campo]);
  const max = Math.max(1, ...vals);
  const x = (m) => IZQ + ((m - INICIO) / Math.max(1, FIN - INICIO)) * AN;
  const y = (v) => 6 + (1 - v / max) * (alto - 6);
  const pts = muestras.map((s2) => `${x(s2.m).toFixed(1)} ${y(s2[campo]).toFixed(1)}`);
  const horas = [];
  for (let m = Math.ceil(INICIO / 60) * 60; m <= FIN; m += 60) horas.push(m);

  return (
    <svg viewBox={`0 0 ${IZQ + AN + 4} ${alto + 16}`} style={{ width: "100%", display: "block" }}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={IZQ} y1={y(max * f)} x2={IZQ + AN} y2={y(max * f)} stroke={P.sunken} strokeWidth="0.6" />
          <text x={IZQ - 3} y={y(max * f) + 3} textAnchor="end" fontSize="7" fill={P.muted} fontFamily={MONO}>
            {max * f >= 1000 ? `${Math.round((max * f) / 100) / 10}k` : Math.round(max * f)}
          </text>
        </g>
      ))}
      {horas.map((m) => (
        <text key={m} x={x(m)} y={alto + 12} textAnchor="middle" fontSize="7" fill={P.muted} fontFamily={MONO}>
          {hhmm(m).slice(0, 2)}
        </text>
      ))}
      {relleno && <polygon points={`${x(muestras[0].m)},${y(0)} ${pts.join(" ")} ${x(muestras[muestras.length - 1].m)},${y(0)}`} fill={color} opacity="0.14" />}
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <text x={IZQ + AN} y={10} textAnchor="end" fontSize="7.5" fill={P.muted} fontFamily={FUENTE} fontWeight="600">
        {unidad}
      </text>
    </svg>
  );
}

// barras horizontales para comparar estaciones
function Ranking({ filas, color, unidad }) {
  const max = Math.max(1, ...filas.map((f) => f.v));
  return (
    <div>
      {filas.map((f) => (
        <div key={f.n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: T.aux, width: 96, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.n}</span>
          <span style={{ flex: 1, height: 8, background: P.sunken, borderRadius: R.hilo, overflow: "hidden" }}>
            <span style={{ display: "block", width: `${(f.v / max) * 100}%`, height: "100%", background: color, borderRadius: R.hilo }} />
          </span>
          <span style={{ fontSize: T.aux, fontFamily: MONO, color: P.muted, width: 46, textAlign: "right", flexShrink: 0 }}>
            {f.v >= 1000 ? `${(f.v / 1000).toFixed(1)}k` : Math.round(f.v)}
          </span>
        </div>
      ))}
      <div style={{ fontSize: T.micro, color: P.muted, marginTop: 2 }}>{unidad}</div>
    </div>
  );
}

/* Malla de toda la línea: las trece circulaciones superpuestas. Donde dos
   trazos de sentido contrario se cruzan hay un cruce, y en los tramos de vía
   única eso es lo que hay que vigilar.                                   */
function MallaLinea({ g }) {
  // circulación resaltada: el resto queda en gris para poder seguirla
  const [sel, setSel] = useState(null);
  const AL = 230;
  const AN = 300;
  const IZQ = 20;
  const ARR = 10;
  const tope = ESTACIONES[N - 1].t || 1;
  const x = (m) => IZQ + ((m - INICIO) / Math.max(1, FIN - INICIO)) * AN;
  const y = (idx) => {
    const k = Math.max(0, Math.min(N - 1, idx));
    const ent = Math.floor(k);
    const a2 = ESTACIONES[ent].t;
    const b2 = ESTACIONES[Math.min(N - 1, ent + 1)].t;
    return ARR + ((a2 + (b2 - a2) * (k - ent)) / tope) * AL;
  };
  const horas = [];
  for (let m = Math.ceil(INICIO / 60) * 60; m <= FIN; m += 60) horas.push(m);

  // los tramos de vía única se sombrean: ahí los cruces son críticos
  const tramos = (g.restricciones || []).filter((r) => r.tramo);

  return (
    <div>
      <svg viewBox={`0 0 ${IZQ + AN + 4} ${AL + ARR + 16}`} style={{ width: "100%", display: "block" }}>
        {tramos.map((r, k) => (
          <rect key={`vu${k}`} x={IZQ} y={y(r.tramo.a)} width={AN} height={Math.max(1, y(r.tramo.b) - y(r.tramo.a))} fill={P.warn} opacity="0.1" />
        ))}
        {ESTACIONES.map((e, i) => (
          <line key={e.n} x1={IZQ} y1={y(i)} x2={IZQ + AN} y2={y(i)} stroke={SIGLA[e.n] ? P.rule : P.sunken} strokeWidth={e.cab || e.term ? 1 : SIGLA[e.n] ? 0.7 : 0.4} />
        ))}
        {ESTACIONES.map((e, i) =>
          SIGLA[e.n] ? (
            <text key={`s${e.n}`} x={IZQ - 3} y={y(i) + 3} textAnchor="end" fontSize="7.5" fill={P.muted} fontFamily={MONO} fontWeight="700">
              {SIGLA[e.n] || e.corto}
            </text>
          ) : null
        )}
        {horas.map((m) => (
          <g key={m}>
            <line x1={x(m)} y1={ARR} x2={x(m)} y2={ARR + AL} stroke={P.sunken} strokeWidth="0.5" />
            <text x={x(m)} y={AL + ARR + 12} textAnchor="middle" fontSize="7" fill={P.muted} fontFamily={MONO}>
              {hhmm(m).slice(0, 2)}
            </text>
          </g>
        ))}
        {[...g.trenes].sort((a2, b2) => (a2.i === sel ? 1 : 0) - (b2.i === sel ? 1 : 0)).map((t) => {
          const tramosT = [];
          let actual = [];
          (t.traza || []).forEach((pos, k) => {
            if (pos === null || pos === undefined) {
              if (actual.length > 1) tramosT.push(actual);
              actual = [];
              return;
            }
            actual.push(`${x(INICIO + k * PASO_TRAZA).toFixed(1)} ${y(pos / 10).toFixed(1)}`);
          });
          if (actual.length > 1) tramosT.push(actual);
          const marcada = sel === null || sel === t.i;
          return tramosT.map((pts, k) => (
            <polyline
              key={`${t.i}-${k}`}
              points={pts.join(" ")}
              fill="none"
              stroke={!marcada ? P.rule : t.esVacio ? P.solido : COLOR.rojo}
              strokeWidth={sel === t.i ? 2.2 : 1.1}
              opacity={!marcada ? 0.5 : t.esVacio ? 0.5 : 0.8}
              strokeLinejoin="round"
            />
          ));
        })}
        <line x1={x(Math.min(FIN, g.reloj))} y1={ARR} x2={x(Math.min(FIN, g.reloj))} y2={ARR + AL} stroke={P.ink} strokeWidth="0.8" opacity="0.35" />
      </svg>
      <div style={{ fontSize: T.micro, color: P.muted, margin: "4px 0 10px" }}>
        Cada trazo es una circulación. Donde se cruzan dos de sentido contrario hay un cruce; el sombreado marca los tramos en vía única.
      </div>

      {/* Relación de circulaciones: al elegir una, el resto se apaga. Con trece
          trazos superpuestos es la única forma de seguir uno concreto.  */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <button
          onClick={() => setSel(null)}
          style={{
            background: sel === null ? P.solido : P.surface,
            color: sel === null ? P.blanco : P.muted,
            border: `1px solid ${sel === null ? P.solido : P.rule}`,
            borderRadius: R.normal,
            padding: "5px 9px",
            fontFamily: "inherit",
            fontSize: T.micro,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Todas
        </button>
        {g.trenes.map((t) => {
          const on = sel === t.i;
          const supr = t.estado === "suprimido";
          return (
            <button
              key={t.i}
              onClick={() => setSel(on ? null : t.i)}
              title={`Circulación ${t.i}${supr ? " · fuera de servicio" : ""}`}
              style={{
                background: on ? COLOR.rojo : P.surface,
                color: on ? P.blanco : supr ? P.muted : P.ink,
                border: `1px solid ${on ? COLOR.rojo : P.rule}`,
                borderRadius: R.normal,
                padding: "5px 7px",
                fontFamily: MONO,
                fontSize: T.micro,
                fontWeight: 700,
                cursor: "pointer",
                opacity: supr ? 0.55 : 1,
              }}
            >
              {numeroTren(t, g.reloj)}
            </button>
          );
        })}
      </div>

      {sel !== null &&
        (() => {
          const t = g.trenes.find((x) => x.i === sel);
          if (!t) return null;
          const m = marchaEnCurso(t);
          return (
            <div style={{ fontSize: T.aux, color: P.muted, marginTop: 8, lineHeight: 1.5 }}>
              Circulación {t.i} · {t.unidades.map((u) => u.id).join(" + ") || "sin material"}
              {m ? ` · ahora ${m.desde} → ${m.hasta}` : t.estado === "suprimido" ? " · fuera de servicio" : ""}
              {t.retraso > 0.5 ? ` · ${retTxt(retrasoEfectivo(t))}` : ""}
            </div>
          );
        })()}
    </div>
  );
}

/* Histórico de campaña: cada turno cerrado deja su ficha, y aquí se comparan.
   Es lo que permite ver patrones que dentro de un turno no se aprecian, como
   que las tardes van peor porque heredan los retrasos de la mañana.     */
function Historico({ camp }) {
  const h = (camp && camp.historico) || [];
  const [campo, setCampo] = useState("punt");
  if (!h.length)
    return <Vacio icono="~" txt="Todavía no hay turnos cerrados" pista="Al cerrar el primer turno empezarás a ver la evolución de la campaña." />;

  const CAMPOS = [
    { k: "punt", l: "Puntualidad", u: "%", col: (v) => colPuntualidad(v) },
    { k: "ret", l: "Retraso", u: "′", col: (v) => colRetrasoMedio(v) },
    { k: "viajeros", l: "Viajeros", u: "", col: () => P.ink },
    { k: "puntos", l: "Puntos", u: "", col: () => P.ink },
  ];
  const sel = CAMPOS.find((c) => c.k === campo);
  const vals = h.map((x) => x[campo] || 0);
  const max = Math.max(1, ...vals);
  const min = Math.min(...vals);
  const media = vals.reduce((a2, b2) => a2 + b2, 0) / vals.length;

  // media por tipo de turno: es donde aparecen los patrones
  const porTurno = ORDEN_TURNOS.map((t) => {
    const suyos = h.filter((x) => x.turno === t);
    return { t, n: suyos.length, v: suyos.length ? suyos.reduce((a2, b2) => a2 + (b2[campo] || 0), 0) / suyos.length : null };
  }).filter((x) => x.n);

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {CAMPOS.map((c) => (
          <button
            key={c.k}
            onClick={() => setCampo(c.k)}
            style={{
              flex: 1,
              minWidth: 0,
              background: campo === c.k ? P.solido : P.surface,
              color: campo === c.k ? P.blanco : P.ink,
              border: `1px solid ${campo === c.k ? P.solido : P.rule}`,
              borderRadius: R.normal,
              padding: "6px 4px",
              fontFamily: "inherit",
              fontSize: T.micro,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {c.l}
          </button>
        ))}
      </div>

      <Bloque titulo={`${sel.l} turno a turno`}>
        {/* una barra por turno, con la media de la campaña marcada */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 110, marginBottom: 6, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: `${(media / max) * 100}%`, borderTop: `1px dashed ${P.muted}`, opacity: 0.6 }} />
          {h.slice(-24).map((x, k) => (
            <div
              key={k}
              title={`Día ${x.dia} ${x.turnoN} · ${x[campo]}${sel.u}`}
              style={{
                flex: 1,
                minWidth: 3,
                height: `${Math.max(2, ((x[campo] || 0) / max) * 100)}%`,
                background: sel.col(x[campo]),
                borderRadius: `${R.hilo}px ${R.hilo}px 0 0`,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: T.micro, color: P.muted, fontFamily: MONO }}>
          <span>peor {min}{sel.u}</span>
          <span>media {media.toFixed(1)}{sel.u}</span>
          <span>mejor {max}{sel.u}</span>
        </div>
      </Bloque>

      <Bloque titulo="Media por tipo de turno">
        <Ranking filas={porTurno.map((x) => ({ n: (TURNOS.find((z) => z.id === x.t) || {}).n || x.t, v: Math.round(x.v * 10) / 10 }))} color={COLOR.rojo} unidad={`${sel.l.toLowerCase()} media de cada turno`} />
      </Bloque>

      <Bloque titulo="Últimos turnos">
        {[...h].reverse().slice(0, 10).map((x, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: k < 9 ? `1px solid ${P.sunken}` : "none" }}>
            <span style={{ fontSize: T.aux, fontWeight: 600, width: 92, flexShrink: 0 }}>
              Día {x.dia} · {x.turnoN}
            </span>
            <span style={{ fontSize: T.aux, fontFamily: MONO, color: colPuntualidad(x.punt), width: 46, textAlign: "right" }}>{x.punt}%</span>
            <span style={{ fontSize: T.aux, fontFamily: MONO, color: P.muted, flex: 1, textAlign: "right" }}>{nf(x.viajeros)} viajeros</span>
            <span style={{ fontSize: T.aux, fontFamily: MONO, fontWeight: 700, width: 46, textAlign: "right" }}>{nf(x.puntos)}</span>
          </div>
        ))}
      </Bloque>
    </div>
  );
}

/* Pantalla de análisis. Reúne lo que el turno va dejando registrado para
   entender por qué la línea se comporta como lo hace: cuándo aprieta la
   demanda, dónde se acumula la gente y cómo se propagan los retrasos.   */
/* Pantalla de calidad del servicio: la nota por línea y el muro con lo que
   publican los viajeros. Los mensajes los genera el motor; aquí solo se
   pintan, en orden inverso como en cualquier red social.               */
function Calidad({ g, camp }) {
  const [pestana, setPestana] = useState("nota");
  const lineas = Object.keys(g.porLinea || {});
  const [lineaVer, setLineaVer] = useState(lineas[0] || g.linea);
  const [filtro, setFiltro] = useState("todas");
  const todos = [...(g.reacciones || [])].reverse();
  const mensajes = filtro === "todas" ? todos : todos.filter((x) => x.linea === filtro);
  const general = notaGeneral(g);
  const det = notaCalidad(((g.porLinea || {})[lineaVer] || {}).cal);
  const colorNota = (n) => (n >= 80 ? P.ok : n >= 60 ? P.warn : P.alert);

  const Pestana = ({ id, txt }) => (
    <button
      onClick={() => setPestana(id)}
      style={{
        flex: 1,
        background: pestana === id ? P.ink : P.surface,
        color: pestana === id ? P.ground : P.ink,
        border: `1px solid ${pestana === id ? P.ink : P.rule}`,
        borderRadius: R.normal,
        padding: "8px 0",
        fontFamily: "inherit",
        fontSize: T.base,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {txt}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Pestana id="nota" txt="Nota" />
        <Pestana id="muro" txt={`Reacciones${mensajes.length ? ` · ${mensajes.length}` : ""}`} />
      </div>

      {pestana === "nota" && (
        <div>
          {/* nota general, en grande */}
          <div style={{ ...ST.card, padding: "18px 12px", marginBottom: 10, textAlign: "center" }}>
            <div style={ST.eyebrow}>Nota general del turno</div>
            <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: -2, lineHeight: 1, margin: "6px 0 2px", color: colorNota(general) }}>{general}</div>
            <div style={{ fontSize: T.aux, color: P.muted }}>sobre 100 · media de las líneas ponderada por viajeros</div>
          </div>

          {/* selector de línea, solo si hay más de una */}
          {lineas.length > 1 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {lineas.map((id) => (
                <button
                  key={id}
                  onClick={() => setLineaVer(id)}
                  style={{
                    flex: 1,
                    background: id === lineaVer ? LIN[id] : P.surface,
                    color: id === lineaVer ? P.blanco : P.ink,
                    border: `2px solid ${id === lineaVer ? LIN[id] : P.rule}`,
                    borderRadius: R.normal,
                    padding: "7px 0",
                    fontFamily: "inherit",
                    fontSize: T.base,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {id}
                  <span style={{ display: "block", fontSize: T.micro, fontWeight: 600, fontFamily: MONO, opacity: id === lineaVer ? 0.85 : 0.6 }}>
                    {notaCalidad((g.porLinea[id] || {}).cal).nota}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* desglose: de dónde sale el castigo */}
          <Bloque titulo={`De dónde sale la nota · ${lineaVer}`}>
            {[
              ["Retraso sufrido", det.retraso, "minutos de demora ponderados por la gente que los padece"],
              ["Aglomeración", det.agobio, "ir de pie apretado o quedarse en el andén"],
              ["Material degradado", det.material, "sin climatización, con marcha limitada o puertas aisladas"],
              ["Servicio roto", det.roto, "supresiones y transbordos forzosos"],
            ].map(([nom, val, ayuda], k) => (
              <div key={nom} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: T.base, fontWeight: 600 }}>{nom}</span>
                  <span style={{ fontSize: T.titulo, fontWeight: 700, fontFamily: MONO, color: val > 0 ? P.alert : P.muted }}>{val > 0 ? `−${val}` : "0"}</span>
                </div>
                <div style={{ fontSize: T.aux, color: P.muted, marginTop: 2, lineHeight: 1.4 }}>{ayuda}</div>
                <div style={{ height: 4, background: P.sunken, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
                  <div style={{ width: `${Math.min(100, val * 2.5)}%`, height: "100%", background: val > 0 ? P.alert : P.sunken }} />
                </div>
              </div>
            ))}
          </Bloque>

          {/* Histórico: cómo ha ido la calidad en los turnos anteriores. Es lo
              que permite ver si el servicio mejora o empeora.          */}
          {camp && (camp.historico || []).length > 0 && (
            <Bloque titulo="Turnos anteriores">
              {[...camp.historico].reverse().slice(0, 12).map((h, k) => {
                const suya = (h.calLineas || {})[lineaVer];
                const val = suya ? suya.nota : h.calidad;
                return (
                  <div key={k} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: R.normal }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: T.base, fontWeight: 600 }}>
                        Día {h.dia} · {h.turnoN}
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", gap: 10, fontFamily: MONO }}>
                        <span style={{ fontSize: T.aux, color: P.muted }}>{Math.round(h.punt)} % punt</span>
                        <span style={{ fontSize: T.titulo, fontWeight: 700, color: colorNota(val) }}>{val}</span>
                      </span>
                    </div>
                    {/* barra de la nota, para ver la tendencia de un vistazo */}
                    <div style={{ height: 4, background: P.sunken, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
                      <div style={{ width: `${val}%`, height: "100%", background: colorNota(val) }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: `1px solid ${P.sunken}`, paddingTop: 8, marginTop: 4, fontSize: T.aux, color: P.muted, lineHeight: 1.4 }}>
                La nota mostrada es la de {lineaVer}. La puntualidad es del turno completo.
              </div>
            </Bloque>
          )}
        </div>
      )}

      {pestana === "muro" && (
        <div>
          {/* filtro por línea: con varias en juego el muro las mezcla y conviene
              poder ver solo lo que afecta a una.                        */}
          {lineas.length > 1 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {["todas", ...lineas].map((id) => (
                <button
                  key={id}
                  onClick={() => setFiltro(id)}
                  style={{
                    flex: 1,
                    background: filtro === id ? (id === "todas" ? P.ink : LIN[id]) : P.surface,
                    color: filtro === id ? P.blanco : P.ink,
                    border: `1px solid ${filtro === id ? (id === "todas" ? P.ink : LIN[id]) : P.rule}`,
                    borderRadius: R.normal,
                    padding: "6px 0",
                    fontFamily: "inherit",
                    fontSize: T.aux,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {id === "todas" ? "Todas" : id}
                </button>
              ))}
            </div>
          )}
          {!mensajes.length && (
            <div style={{ ...ST.card, padding: 12, fontSize: T.base, color: P.muted, lineHeight: 1.5 }}>
              Todavía no hay publicaciones. Aparecerán solas en cuanto el servicio dé motivos.
            </div>
          )}
          {mensajes.map((m) => (
            <div key={m.id} style={{ ...ST.card, padding: 12, marginBottom: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
              {/* avatar con iniciales sobre color estable */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  background: m.color,
                  color: P.blanco,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: T.base,
                  fontWeight: 700,
                  letterSpacing: -0.3,
                }}
              >
                {m.iniciales}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: T.base, fontWeight: 700 }}>{m.nombre}</span>
                  <span style={{ fontSize: T.aux, color: P.muted }}>@{m.alias}</span>
                  <span style={{ fontSize: T.aux, color: P.muted }}>· {hhmm(m.min)}</span>
                  {lineas.length > 1 && m.linea && (
                    <span style={{ background: LIN[m.linea], color: P.blanco, borderRadius: R.menudo, padding: "0 4px", fontSize: T.micro, fontWeight: 800 }}>{m.linea}</span>
                  )}
                </div>
                <div style={{ fontSize: T.base, color: P.ink, lineHeight: 1.45, marginTop: 3, whiteSpace: "pre-line" }}>{m.texto}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 7, fontSize: T.aux, color: P.muted, fontFamily: MONO }}>
                  <span>♡ {m.likes}</span>
                  <span>↻ {m.rt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Analisis({ g, camp }) {
  const [seccion, setSeccion] = useState("demanda");
  const est = g.estad || { muestras: [], suben: [], bajan: [], esperaMax: [] };
  const ms = est.muestras || [];
  const b = balanceTurno(g);

  // la hora punta se deduce de los datos, no se supone
  const pico = ms.reduce((mejor, x) => (!mejor || x.bordo > mejor.bordo ? x : mejor), null);
  const picoAnden = ms.reduce((mejor, x) => (!mejor || x.anden > mejor.anden ? x : mejor), null);

  const movimiento = ESTACIONES.map((e, i) => ({ n: e.corto, v: (est.suben[i] || 0) + (est.bajan[i] || 0) }))
    .filter((f) => f.v > 0)
    .sort((a2, b2) => b2.v - a2.v)
    .slice(0, 10);
  const colas = ESTACIONES.map((e, i) => ({ n: e.corto, v: est.esperaMax[i] || 0 }))
    .filter((f) => f.v > 0)
    .sort((a2, b2) => b2.v - a2.v)
    .slice(0, 10);

  const SECCIONES = [
    { k: "demanda", l: "Demanda" },
    { k: "servicio", l: "Servicio" },
    { k: "estaciones", l: "Estaciones" },
    { k: "malla", l: "Malla" },
    { k: "campana", l: "Campaña" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {SECCIONES.map((x) => (
          <button
            key={x.k}
            onClick={() => setSeccion(x.k)}
            style={{
              flex: 1,
              minWidth: 0,
              background: seccion === x.k ? P.solido : P.surface,
              color: seccion === x.k ? P.blanco : P.ink,
              border: `1px solid ${seccion === x.k ? P.solido : P.rule}`,
              borderRadius: R.normal,
              padding: "7px 4px",
              fontFamily: "inherit",
              fontSize: T.aux,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {x.l}
          </button>
        ))}
      </div>

      {seccion === "demanda" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <Kpi k="Transportados" v={nf(b.transportados)} c={P.ink} />
            <Kpi k="Ocupación media" v={`${b.ocupMedia.toFixed(0)}%`} c={colOcupacion(b.ocupMedia)} />
          </div>
          <Bloque titulo="Viajeros a bordo a lo largo del turno">
            <Serie muestras={ms} campo="bordo" color={COLOR.rojo} unidad="viajeros a bordo" />
            {pico && (
              <div style={{ fontSize: T.aux, color: P.muted, marginTop: 6, lineHeight: 1.5 }}>
                La punta se alcanza a las <strong style={{ color: P.ink }}>{hhmm(pico.m)}</strong>, con {nf(pico.bordo)} viajeros a bordo y una ocupación media del {pico.ocup.toFixed(0)} %.
              </div>
            )}
          </Bloque>
          <Bloque titulo="Gente esperando en los andenes">
            <Serie muestras={ms} campo="anden" color={P.warn} unidad="viajeros en andén" />
            {picoAnden && (
              <div style={{ fontSize: T.aux, color: P.muted, marginTop: 6, lineHeight: 1.5 }}>
                El peor momento en andén fueron las <strong style={{ color: P.ink }}>{hhmm(picoAnden.m)}</strong>, con {nf(picoAnden.anden)} personas esperando.
              </div>
            )}
          </Bloque>
          <Bloque titulo="Ocupación media de los trenes">
            <Serie muestras={ms} campo="ocup" color={P.ok} unidad="por ciento de plazas" />
          </Bloque>
        </>
      )}

      {seccion === "servicio" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <Kpi k="Puntualidad" v={`${b.punt.toFixed(1)}%`} c={colPuntualidad(b.punt)} />
            <Kpi k="Retraso medio" v={`${b.retrasoMedio.toFixed(1)}′`} c={colRetrasoMedio(b.retrasoMedio)} />
          </div>
          <Bloque titulo="Retraso medio de la línea">
            <Serie muestras={ms} campo="ret" color={P.alert} unidad="minutos de retraso" />
            {b.picoRetraso > 1 && (
              <div style={{ fontSize: T.aux, color: P.muted, marginTop: 6, lineHeight: 1.5 }}>
                El peor momento fueron las <strong style={{ color: P.ink }}>{hhmm(b.horaPico)}</strong>, con {b.picoRetraso.toFixed(0)} min de media.
                {b.minutosApuro > 0 && ` Hubo trenes detenidos o retenidos durante ${b.minutosApuro} min.`}
              </div>
            )}
          </Bloque>
          <Bloque titulo="Puntualidad acumulada">
            <Serie muestras={ms} campo="punt" color={P.ok} unidad="por ciento" relleno={false} />
          </Bloque>
          <Bloque titulo="Circulaciones en servicio">
            <Serie muestras={ms} campo="circ" color={P.ink} unidad={`de ${CIRCULACIONES}`} relleno={false} alto={70} />
          </Bloque>
        </>
      )}

      {seccion === "estaciones" && (
        <>
          <Bloque titulo="Estaciones con más movimiento">
            {movimiento.length ? <Ranking filas={movimiento} color={COLOR.rojo} unidad="subidas más bajadas en el turno" /> : <Vacio icono="~" txt="Aún no hay movimiento" />}
          </Bloque>
          <Bloque titulo="Mayor acumulación en andén">
            {colas.length ? <Ranking filas={colas} color={P.warn} unidad="máximo de personas esperando a la vez" /> : <Vacio icono="~" txt="Sin acumulaciones" />}
          </Bloque>
          <Bloque titulo="Reparto por estación">
            <div style={{ fontSize: T.aux, color: P.muted, lineHeight: 1.5 }}>
              Las cifras salen del movimiento real del turno, no del reparto teórico: una avería o una supresión cambian dónde se acumula la gente.
            </div>
          </Bloque>
        </>
      )}

      {seccion === "malla" && (
        <Bloque titulo="Malla de circulación">
          <MallaLinea g={g} />
        </Bloque>
      )}

      {seccion === "campana" && <Historico camp={camp} />}
    </div>
  );
}

/* Panel de pruebas: elegir familia, avería, grado y circulación, y lanzarlo.
   Solo aparece con el modo de pruebas activo.                           */
function PanelPruebas({ g, lanzar }) {
  const [fam, setFam] = useState("averia");
  const [av, setAv] = useState("traccion");
  const [gr, setGr] = useState("leve");
  const [tren, setTren] = useState(g.trenes.find((t) => t.estado !== "suprimido" && t.unidades.length)?.i ?? 1);

  const tipo = AVERIAS_MATERIAL.find((x) => x.id === av);
  const grados = (tipo && tipo.grados) || ["leve", "habitual", "grave", "muygrave"];
  const NOMBRE_GR = { leve: "Leve", habitual: "Habitual", grave: "Grave", muygrave: "Muy grave" };
  const sel = { width: "100%", background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: R.normal, padding: 9, fontFamily: "inherit", fontSize: T.base, marginBottom: 8 };

  return (
    <div style={{ marginBottom: 20 }}>
      <select value={fam} onChange={(e) => setFam(e.target.value)} style={sel}>
        <option value="averia">Avería de material</option>
        {TABLA.filter((f) => f.id !== "averia").map((f) => {
          const d = POOL.find((x) => x.id === f.id);
          return (
            <option key={f.id} value={f.id}>
              {NOMBRE_FAMILIA[f.id] || f.id}
            </option>
          );
        })}
      </select>

      {fam === "averia" && (
        <>
          <select value={av} onChange={(e) => setAv(e.target.value)} style={sel}>
            {AVERIAS_MATERIAL.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </select>
          <select value={gr} onChange={(e) => setGr(e.target.value)} style={sel}>
            {grados.map((x) => (
              <option key={x} value={x}>
                {NOMBRE_GR[x]}
              </option>
            ))}
          </select>
          <select value={tren} onChange={(e) => setTren(Number(e.target.value))} style={sel}>
            {g.trenes
              .filter((t) => t.estado !== "suprimido" && t.unidades.length)
              .map((t) => (
                <option key={t.i} value={t.i}>
                  Circulación {t.i} · {numeroTren(t, g.reloj)} · {t.unidades.map((u) => u.id).join(" + ")}
                </option>
              ))}
          </select>
        </>
      )}

      <button
        onClick={() => lanzar(fam, av, gr, tren)}
        style={{ width: "100%", background: P.info, color: P.blanco, border: "none", borderRadius: R.normal, padding: 12, fontFamily: "inherit", fontWeight: 700, fontSize: T.base, cursor: "pointer" }}
      >
        Lanzar incidencia
      </button>
    </div>
  );
}

function Vacio({ txt, pista, icono = "—" }) {
  return (
    <div style={{ padding: "20px 12px", textAlign: "center" }}>
      <div
        style={{
          width: 34,
          height: 34,
          margin: "0 auto 8px",
          borderRadius: R.pastilla,
          border: `2px dashed ${P.rule}`,
          color: P.muted,
          fontSize: T.alto,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icono}
      </div>
      <div style={{ fontSize: T.base, fontWeight: 600, color: P.ink }}>{txt}</div>
      {pista && <div style={{ fontSize: T.aux, color: P.muted, marginTop: 4, lineHeight: 1.45 }}>{pista}</div>}
    </div>
  );
}

function Etiqueta({ txt, c }) {
  return (
    <span
      style={{
        fontSize: T.menor,
        fontWeight: 700,
        color: c,
        border: `1px solid ${c}`,
        borderRadius: R.menudo,
        padding: "1px 6px",
        whiteSpace: "nowrap",
        animation: "cgo-entra .2s ease-out",
      }}
    >
      {txt}
    </span>
  );
}

function Kpi({ k, v, c, small }) {
  return (
    <div style={{ ...ST.card, padding: small ? "6px 5px" : "10px 11px", textAlign: small ? "center" : "left", minWidth: 0 }}>
      <div style={{ fontSize: T.micro, letterSpacing: 0.5, textTransform: "uppercase", color: P.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{k}</div>
      <div
        style={{
          fontSize: small ? 14 : 19,
          fontWeight: 700,
          color: c,
          fontFamily: MONO,
          marginTop: 2,
          letterSpacing: small ? -0.4 : 0,
          whiteSpace: "nowrap",
        }}
      >
        {v}
      </div>
    </div>
  );
}

function Fonts() {
  return (
    <style>{`
      /* Las familias se cargan desde index.html con preconexión: importarlas
         desde aquí se resuelve tarde y la página se repinta con la tipografía
         suplente, moviendo todo de sitio al llegar la definitiva. */
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      /* cifras de ancho fijo: horas, retrasos y números de tren no se mueven */
      body { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
      /* Se reserva siempre el hueco de la barra de desplazamiento. El Libro es
         más corto que el resto de pantallas, así que al entrar desaparecía la
         barra, el área visible se ensanchaba y el contenido centrado saltaba
         unos píxeles a un lado. */
      html { scrollbar-gutter: stable; }
      /* Se desactiva el gesto de recargar tirando hacia abajo: en un juego a
         pantalla completa estorba y chocaba con el arrastre de las hojas. No
         todos los navegadores lo respetan, así que además la partida se
         guarda sola y una recarga no cuesta el turno.                     */
      html, body { overscroll-behavior: none; overscroll-behavior-y: none; }
      body { margin: 0; }

      /* Movimiento. Los cambios de estado aparecían de golpe: una etiqueta que
         surge, un color que salta, una incidencia que irrumpe. Un cuarto de
         segundo basta para que el ojo siga el cambio sin que estorbe.      */
      /* Los botones responden al tacto. La regla alcanza a todos, pero con el
         recorte de lo que queda fuera de pantalla solo hay una quincena
         dibujada a la vez, así que ya no pesa.                          */
      button:not(:disabled) {
        transition: background-color .18s ease-out, border-color .18s ease-out, color .18s ease-out, transform .22s cubic-bezier(.16, .84, .28, 1), opacity .22s ease-out;
      }
      button:active:not(:disabled) {
        transform: scale(.97);
        opacity: .72;
        transition: none;
      }
      /* La pestaña se hunde al pulsarla, como una tecla. Solo alcanza a cinco
         elementos, así que no tiene coste apreciable.                     */
      .cgo-tab { touch-action: manipulation; }
      /* El hundido entra de golpe y sale despacio. La ida sin transición se
         pinta antes de que el navegador empiece a montar la pantalla nueva,
         que es lo que se comía la animación en las pantallas pesadas; la
         vuelta, larga y con curva suave, es la que da la sensación de que
         el botón cede y se recupera en vez de saltar.                   */
      .cgo-tab > span {
        transition: transform .34s cubic-bezier(.16, .84, .28, 1), opacity .34s ease-out;
      }
      .cgo-tab:active > span {
        transform: translateY(1.5px) scale(.98);
        opacity: .94;
        transition: none;
      }

      @keyframes cgo-hoja { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      /* las etiquetas de estado aparecen con un matiz, no de golpe */
      @keyframes cgo-entra { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
      @keyframes cgo-sale { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-2px); } }

      /* Despliegue con altura: al desaparecer el bloque, la ficha recuperaba
         su tamaño de golpe. Animando también el alto, la tarjeta se cierra
         acompañando al contenido en vez de dar un salto.                 */
      @keyframes cgo-abre {
        from { opacity: 0; max-height: 0; margin-top: 0; }
        to { opacity: 1; max-height: 48px; margin-top: 8px; }
      }
      @keyframes cgo-cierra {
        from { opacity: 1; max-height: 48px; margin-top: 8px; }
        to { opacity: 0; max-height: 0; margin-top: 0; }
      }
      @keyframes cgo-fondo { from { opacity: 0; } to { opacity: 1; } }



      /* quien prefiera no ver animaciones, no las ve */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
      }
      button:focus-visible { outline: 2px solid ${COLOR.rojo}; outline-offset: 2px; }
    `}</style>
  );
}
