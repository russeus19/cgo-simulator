import React, { useState, useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   CGO · LÍNEA C-7
   Asignación de material + turno de mañana
   ══════════════════════════════════════════════════════════════ */

const ROJO = "#D7282F";
const P = {
  ground: "#E9EBEA",
  surface: "#FFFFFF",
  ink: "#11161A",
  muted: "#6B7780",
  rule: "#D5DAD9",
  sunken: "#F3F5F4",
  ok: "#0E7A50",
  warn: "#D98200",
  alert: "#C8102E",
};

/* ── infraestructura ────────────────────────────────────────── */

const LIN = { "C-7": "#D7282F", "C-1": "#5BB3E4", "C-9": "#0E7A50", "C-2": "#00A24B", "C-3": "#7B2E8E", "C-4": "#004B93", "C-5": "#F2A104", "C-8": "#8A8F94", "C-10": "#00A192" };
const METRO = "#0065B3";
const LINEA = "C-7"; // línea de las circulaciones de esta partida

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

const ESTACIONES = [
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

const BANDAS = {
  0: { n: "Las Rozas – Príncipe Pío", d: "con C-10" },
  6: { n: "Chamartín – Pitis", d: "con C-8" },
  10: { n: "Túnel de la Risa", d: "con C-2, C-8 y C-10" },
  13: { n: "Corredor del Henares", d: "con C-2 y C-8" },
};

const N = ESTACIONES.length;

/* Índices de las tres cabeceras. Se calculan a partir del nombre para que
   añadir o quitar paradas no vuelva a descolocar nada: estaban escritos a
   mano y al insertar los puestos de circulación dejaron de apuntar donde
   debían.                                                                */
const IDX_PIO = 0;
const IDX_CHAMARTIN = ESTACIONES.findIndex((e) => e.n === "Chamartín");
const IDX_ALCALA = N - 1;
// puntos donde la C-7 comparte vía con mercancías, buscados por nombre
const IDX_ROZAS = ESTACIONES.findIndex((e) => e.n === "Las Rozas");
const IDX_PITIS = ESTACIONES.findIndex((e) => e.n === "Pitis");
const IDX_VICALVARO = ESTACIONES.findIndex((e) => e.n === "Vicálvaro");
const RECORRIDO = 100; // min de extremo a extremo
const INV_ALCALA = 20; // rotación en Alcalá de Henares
const INV_PIO = 40; // rotación en Príncipe Pío
const MANIOBRA = 4; // mínimo técnico para invertir en estación intermedia
const MIN_ANTELACION = 3; // margen mínimo para preparar el itinerario de rotación
const CICLO = RECORRIDO * 2 + INV_ALCALA + INV_PIO; // 260 min
const INTERVALO = 20; // frecuencia cadenciada
// fases clave del ciclo
const LLEGA_ALCALA = RECORRIDO; // 100
const SALE_ALCALA = RECORRIDO + INV_ALCALA; // 120
const LLEGA_PIO = SALE_ALCALA + RECORRIDO; // 220
const LONGITUD = 71.6; // km de extremo a extremo
const KM_MIN = LONGITUD / RECORRIDO; // km recorridos por minuto

const CHAMARTIN = "Chamartín";
const ALCALA = "Alcalá de Henares";
const PIO = "Príncipe Pío";
const T_CHAMARTIN = 41;
const PASOS = [
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

function fijarTurno(id) {
  const t = TURNOS.find((x) => x.id === id) || TURNOS[0];
  TURNO_ID = t.id;
  INICIO = t.ini;
  FIN = t.fin;
}
const KM_TURNO = Math.round(((LONGITUD / RECORRIDO) * (FIN - INICIO)) / 10) * 10; // km que recorre una unidad en el turno
const CIRCULACIONES = CICLO / INTERVALO; // 13 trenes simultáneos

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
const esSimple = (id) => !!id && CATALOGO.find((u) => u.id === id).serie === "450";
const slotCompleto = (par) => (par[0] ? (esSimple(par[0]) ? !par[1] : !!par[1]) : false);
const LIBRES_C7 = DISPONIBLES_C7.filter((u) => !u.enTaller);

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

// reservas de contingencia por cabecera: solo se tocan si algo se tuerce
const RESERVAS = [
  [CHAMARTIN, 5],
  [ALCALA, 1],
  [PIO, 1],
];

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

const SERIE_TREN = 21800;
const SERIE_VACIO = 37200; // marchas de material sin viajeros
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
const marchaActual = (t) => (t.marchas || []).find((m) => !m.real);

function cerrarMarcha(g, t, idx, motivo = null) {
  const m = marchaActual(t);
  if (!m) return;
  const k = Math.max(0, Math.min(N - 1, Math.round(idx)));
  const real = ESTACIONES[k].n;
  m.real = true;
  m.finReal = Math.round(g.reloj);
  m.hastaReal = real;
  if (real !== m.hasta) m.motivo = motivo || "terminó antes";
}

/* Al rotar antes de tiempo la marcha en curso acaba ahí y nace otra en
   sentido contrario, que sustituye a las que ya no se van a hacer.      */
function partirMarcha(g, t, idx, dir) {
  const m = marchaActual(t);
  const k = Math.max(0, Math.min(N - 1, Math.round(idx)));
  cerrarMarcha(g, t, k, "rotación anticipada");
  const pos = (t.marchas || []).indexOf(m);
  const destino = dir === "alcala" ? ALCALA : PIO;
  const nueva = {
    ini: Math.round(g.reloj),
    fin: Math.round(g.reloj) + (dir === "alcala" ? ESTACIONES[N - 1].t - ESTACIONES[k].t : LLEGA_PIO - (LLEGA_PIO - ESTACIONES[k].t)),
    desde: ESTACIONES[k].n,
    hasta: destino,
    dir,
    num: numDeMarcha(g.reloj, dir === "pio", t.esVacio),
    real: false,
    inicioReal: Math.round(g.reloj),
  };
  if (pos >= 0) t.marchas.splice(pos + 1, 0, nueva);
  else t.marchas.push(nueva);
}

function rotacionDelDia(t, desde = 5 * 60, hasta = 24 * 60) {
  const out = [];
  for (let k = -3; k < 12; k++) {
    const salePio = t.offset + CICLO * k;
    const llegaAlc = salePio + RECORRIDO;
    const saleAlc = salePio + SALE_ALCALA;
    const llegaPio = salePio + LLEGA_PIO;
    if (llegaAlc >= desde && salePio <= hasta)
      out.push({ ini: salePio, fin: llegaAlc, desde: PIO, hasta: ALCALA, dir: "alcala", num: numDeMarcha(salePio, false) });
    if (llegaPio >= desde && saleAlc <= hasta)
      out.push({ ini: saleAlc, fin: llegaPio, desde: ALCALA, hasta: PIO, dir: "pio", num: numDeMarcha(saleAlc, true) });
  }
  return out.sort((a, b) => a.ini - b.ini);
}

const numCorto = (t, reloj) => String(numeroTren(t, reloj) % 100).padStart(2, "0");

function describir(s) {
  if (s.dir === "maniobra") return `Inversión en ${s.cabecera}`;
  const e = Math.floor(s.idx);
  const f = s.idx - e;
  if (f < 0.07) return `En ${ESTACIONES[e].n}`;
  if (f > 0.93) return `En ${ESTACIONES[Math.min(N - 1, e + 1)].n}`;
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

  const candidatos = [];
  for (let n = -1; n < 8; n++) {
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
  for (let n = -1; n < 8; n++) {
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

const VIAJEROS_DIA = 150000;
const PESO_ESC = { 2: 2, 3: 4, 4: 8, 5: 16 };
// los puestos de circulación no prestan servicio de viajeros: peso cero
const PESO = ESTACIONES.map((e) => (e.puesto ? 0 : PESO_ESC[e.esc] || 4));

// centralidad 0 (extremos) a 1 (centro de la línea, junto a Nuevos Ministerios)
const CENTRO = 46;
const CENTRALIDAD = ESTACIONES.map((e) => 1 - Math.abs(e.t - CENTRO) / Math.max(CENTRO, RECORRIDO - CENTRO));

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
const VIAJEROS_MIN_100 = VIAJEROS_DIA / HORAS_INTENSIDAD / 60; // subidas por minuto en toda la línea al 100 %

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

// peso de generación de una estación y peso de atracción como destino
const pesoOrigen = (i, mar) => PESO[i] * (1 + SESGO * mar * (1 - CENTRALIDAD[i]));
const pesoDestino = (i, mar) => PESO[i] * (1 + SESGO * mar * CENTRALIDAD[i]);

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

  const bajan = t.pax[i] || 0;
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

const ocupadasEn = (g, i) => new Set((g.apartado[i] || []).map((x) => x.via));

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

// vías de inversión ocupadas ahora mismo por trenes en cabecera
const viasConTren = (g, i, excluir) =>
  new Set(g.trenes.filter((t) => t.estado !== "suprimido" && t.i !== excluir && t.viaCab && t.viaCab.idx === i).map((t) => t.viaCab.via));



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
const SIN_GENERALES = [IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA];
// estaciones que de verdad prestan servicio, para contar afectados
const CON_SERVICIO = ESTACIONES.filter((e) => !e.puesto).length;
const DATOS_DIR = {
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
  const disponibles = (i) => (TURNO_ID === "noche" && ESTACIONES[i].cab ? viasNocturnas(g, i, reserva) : viasLibres(g, i));
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
const tieneAgujas = (i) => i === 0 || i === N - 1 || !!ESTACIONES[i].rot || !!ESTACIONES[i].agujas;

// tramo entre agujas que queda en vía única por una incidencia en `idx`
function limitesTramo(idx) {
  let a = idx;
  while (a > 0 && !tieneAgujas(a)) a -= 1;
  let b = idx + (tieneAgujas(idx) ? 1 : 0);
  while (b < N - 1 && !tieneAgujas(b)) b += 1;
  if (b <= a) b = Math.min(N - 1, a + 1);
  return { a, b };
}

const tramosUnicos = (g) => g.restricciones.filter((x) => x.dir && x.tramo);

// posición continua del tren dentro del recorrido, en índice de estación
function idxDe(t, reloj) {
  const s = situacion(t, reloj);
  return s.dir === "maniobra" ? s.idx : s.idx;
}

// tren que ocupa ahora mismo el tramo de vía única
// ¿está el tren físicamente dentro del tramo de vía única?
function dentroTramo(t, reloj, tramo) {
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
  return tramosUnicos(g).some((x) => x.dir === s.dir && s.idx > x.tramo.a && s.idx < x.tramo.b);
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
      // los que están en vía desviada (apartados, rotando o cambiando material)
      // no ocupan la vía general y no pueden bloquear a los de atrás
      .filter((t) => t.estado !== "suprimido" && !t.enDesviada && !t.rotando && !(t.detenido && t.detenido.cambio))
      .map((t) => ({ t, pr: progresoDe(fase(t, g.reloj)) }))
      .filter((o) => o.pr && o.pr.dir === dir)
      .sort((a, b) => b.pr.x - a.pr.x);
    if (lista.length) lista[0].t.bloqueadoPor = null;
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
    const eta = etaEnSentido(t, g.reloj, i, s2.dir);
    if (eta < MIN_ANTELACION || eta > 200) continue;
    out.push({ idx: i, nombre: e.n, eta: Math.round(eta), vias: libres });
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
    gen: (c) => ({
      texto: "Fallo en el sistema de freno. El protocolo no permite mantener la velocidad máxima.",
      opciones: [
        desacople(c, 10),
        ...opcionesCambio(c),
        retirada(c, 5),
        { label: "Continuar con marcha limitada", detalle: "Pierde tiempo en cada recorrido", ef: { limitacion: { i: c.i, m: 6 }, riesgo: { i: c.i, p: 0.15 } } },
      ],
    }),
  },
  {
    id: "clima", nombre: "Avería de climatización", p: 20,
    leve: "Se comprueba que es solo un coche el que circula sin climatización. Se reubica a los viajeros de ese coche.",
    gen: (c) => ({
      texto: "La unidad se queda sin climatización y no puede prestar servicio con viajeros.",
      opciones: [desacople(c, 6), ...opcionesCambio(c), retirada(c, 3)],
    }),
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
        { label: "Condenar la puerta y continuar", detalle: "Paradas más largas el resto del turno", ef: { limitacion: { i: c.i, m: 2 }, retraso: { i: c.i, m: 5 }, afect: 300 } },
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
    id: "alarma", nombre: "Accionamiento indebido de aparato de alarma", p: 50,
    gen: (c) => ({
      texto: "Alguien acciona el aparato de alarma sin motivo. El tren queda inmovilizado hasta que el maquinista lo repone.",
      opciones: [{ label: "Reponer el aparato y reanudar", detalle: "El maquinista rearma el aparato y el tren continúa", ef: { retraso: { i: c.i, m: 4 } } }],
    }),
  },
  {
    id: "puerta", nombre: "Desbloqueo de una puerta", p: 30,
    gen: (c) => ({
      texto: "Un viajero acciona el desbloqueo de emergencia y abre una puerta. El tren no puede circular hasta asegurarla.",
      opciones: [
        { label: "Condenar la puerta y continuar", detalle: "Paradas más largas el resto del turno", ef: { retraso: { i: c.i, m: 6 }, limitacion: { i: c.i, m: 2 }, afect: 250 } },
        { label: "Retirar el tren para revisión", detalle: "Se pierde la circulación", ef: { retirarCabecera: c.i, retraso: { i: c.i, m: 3 } } },
      ],
    }),
  },
  {
    id: "conflictivo", nombre: "Desalojo de viajero conflictivo", p: 20,
    gen: (c) => ({
      texto: "Altercado a bordo. Se requiere la intervención de seguridad para desalojar al viajero.",
      opciones: [
        { label: "Esperar a seguridad en la estación", detalle: "El tren queda retenido hasta la intervención", ef: { retraso: { i: c.i, m: 11 } } },
        { label: "Continuar hasta estación con dotación", detalle: "Menos retraso, el altercado sigue a bordo", ef: { retraso: { i: c.i, m: 5 }, afect: 500 } },
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
    const mq = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
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
      const ctx = { g, tr, u, doble, donde, num, i: tr.i };
      const tipo = sortearAveria();

      // un maquinista con conocimiento puede resolverla sobre la marcha
      if (mq && Math.random() < probResolver(mq)) {
        log(g, "ok", `${mq.nombre} resuelve en marcha ${tipo.nombre.toLowerCase()} de la ${u.id} en el ${num}. Sin consecuencias.`);
        return null;
      }

      const av = tipo.gen(ctx);
      const grav = sortearGravedad(u, mq, tipo, g.reloj);
      const cab = { leve: P.ok, habitual: P.warn, grave: P.alert, muygrave: P.alert }[grav];
      const base = `${u.id} · desgaste ${Math.round(u.desgaste)} % · fiabilidad ${Math.round(u.fiab * 100)} %. ${av.texto} A la altura de ${donde}.`;

      // el grado de la avería decide qué se puede hacer con el tren
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
        texto: `${base}\n\nGravedad ${GRAVEDAD[grav].n}: ${GRAVEDAD[grav].txt}`,
        color: cab,
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
        texto: `Se solicita asistencia sanitaria en ${donde}. El tren queda detenido en andén hasta la llegada del servicio médico.`,
        opciones: [
          { label: "Esperar a los servicios sanitarios", detalle: "Retraso propio y del que viene detrás", ef: { retraso: { i: tr.i, m: 11 } } },
          { label: "Desalojar y apartar el tren", detalle: "Se libera la vía, se pierde la circulación", ef: { suprimir: tr.i, afect: 700 } },
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
        texto: "Sustracción de conductor de señalización. Sin protección, los trenes solo pueden circular con marcha a la vista por el tramo.",
        opciones: [
          { label: "Marcha a la vista en el tramo", detalle: `Todo tren que pase pierde tiempo · ${prevision(dur)}`, ef: { restriccion: { idx: tr.idx, m: 7, dur: dur, txt: `Marcha a la vista ${tr.txt}` }, afect: 800 } },
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
        texto: `${motivo.charAt(0).toUpperCase() + motivo.slice(1)} deriva viajeros hacia la C-7. El ${numeroTren(tr, g.reloj)} llega allí en ${Math.round(etaPunto(tr, g.reloj, donde))} min y no dará abasto con sus ${nf(plazasDe(tr))} plazas.`,
        opciones: [
          puede
            ? { label: "Reforzar con material de reserva", detalle: `Sale una ${tr.serie} de Fuencarral para acoplar`, ef: { reforzar: tr.i, coste: 2400 } }
            : { label: "Refuerzo de personal en andenes", detalle: "Ordena la carga, pero alarga las paradas", ef: { retraso: { i: tr.i, m: 4 }, coste: 1200, afect: 500 } },
          { label: "Asumir la sobreocupación", detalle: "Trenes al límite y paradas más largas", ef: { retraso: { i: tr.i, m: 7 }, afect: 1500 } },
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
        texto: `${modo.txt} Adif estima ${prevision(dur)} hasta el restablecimiento.`,
        opciones: [
          { label: "Circular con rebase autorizado", detalle: "Cada tren que pase pierde tiempo", ef: { restriccion: { idx: sitio.idx, m: modo.m, dur: dur, txt: `${modo.t} ${sitio.txt}`, bloqueaRot: !!modo.rot } } },
        ],
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
        texto: `Un grupo acciona el freno de alarma del ${numeroTren(tr, g.reloj)} y pinta la ${u.id}. El tren queda detenido hasta que se restablece el freno.`,
        opciones: [
          doble
            ? { label: `Desacoplar la ${u.id} para limpieza`, detalle: "Sigue en servicio con la mitad de plazas", ef: { desacoplar: { i: tr.i, u: u.id }, retraso: { i: tr.i, m: 9 } } }
            : { label: "Retirar el tren para limpieza", detalle: "Se pierde la circulación el resto del turno", ef: { suprimir: tr.i } },
          { label: "Reanudar el servicio con la pintada", detalle: "Se limpiará al cierre; mala imagen todo el día", ef: { retraso: { i: tr.i, m: 7 }, afect: 400, coste: 900 } },
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
        texto: "Circulación interrumpida por causa ajena a la explotación. Intervención judicial sin previsión de restablecimiento.",
        opciones: [
          { label: "Mantener el corte hasta el levantamiento", detalle: `Todo tren que llegue al punto queda retenido · ${prevision(dur)}`, ef: { restriccion: { idx: i, m: 16, dur: dur, txt: `Corte en ${e.corto}` }, afect: 2600 } },
          { label: "Plan alternativo por carretera", detalle: "Autobuses en el tramo, coste elevado", ef: { restriccion: { idx: i, m: 9, dur: dur, txt: `Transbordo en ${e.corto}` }, coste: 11500, afect: 900 } },
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
];

// FRECUENCIA, independiente del reparto anterior: probabilidad de que un
// sorteo (uno por hora) produzca alguna incidencia. Pendiente de definir.
const PROB_INCIDENCIA = 0.6;

function sortearIncidencia(reloj) {
  if (Math.random() > PROB_INCIDENCIA) return null; // hora sin novedad
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
const APART_INICIAL = [IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA];
const clave = (i, via) => `${i}|${via}`;

/* Propuesta del taller. En campaña hay que mirar el desgaste heredado, no el
   del catálogo, y descartar lo que está en revisión o averiado: si no,
   propondría material que no existe o que está hecho polvo.               */
function propuestaTaller(camp) {
  const enTaller = new Set(Object.keys((camp && camp.taller) || {}));
  const averiadas = new Set((camp && camp.averiadas) || []);

  const conDesgaste = (u) => {
    const d = camp && camp.desg[u.id] !== undefined ? camp.desg[u.id] : u.desgaste;
    return { ...u, desgaste: d, fiab: fiabDesgaste(d) };
  };

  const orden = (u) => DESGASTE_MAX - u.desgaste; // primero las más descansadas
  const aptas = LIBRES_C7.filter((u) => !enTaller.has(u.id) && !averiadas.has(u.id))
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
  for (const se of ["465", "446"]) {
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
  for (const idx of APART_INICIAL) for (const v of ESTACIONES[idx].apartVias) apart[clave(idx, v)] = [null, null];
  for (const idx of APART_INICIAL) {
    const est = ESTACIONES[idx];
    const via = est.apartVias[0];
    const admite = (u) => !est.apartSeries || est.apartSeries.includes(u.serie);
    let par = null;
    if (resto[450].length - a >= 1 && admite(resto[450][a])) par = [resto[450][a++].id, null];
    else
      for (const se of ["465", "446"]) {
        const k = se === "465" ? b : c;
        if (resto[se].length - k >= 2 && admite(resto[se][k])) {
          par = [resto[se][k].id, resto[se][k + 1].id];
          if (se === "465") b += 2;
          else c += 2;
          break;
        }
      }
    if (par) apart[clave(idx, via)] = par;
  }
  return { slots, apart };
}

function initAsignacion() {
  const apart = {};
  for (const i of APART_INICIAL) for (const v of ESTACIONES[i].apartVias) apart[clave(i, v)] = [null, null];
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
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
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
  taller: {},
  apartado: {},
  slots: null,
  reponer: [],
  retrasos: null,
  andenes: null,
  restricciones: [],
  acum: { turnos: 0, punt: 0, afect: 0, coste: 0, puntos: 0, suprimidas: 0 },
});

// puntuación del turno: puntualidad menos lo que ha costado conseguirla
function puntosTurno(g) {
  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const supr = g.trenes.filter((t) => t.estado === "suprimido").length;
  return Math.round(punt * 10 - g.kpi.afect / 200 - g.kpi.coste / 1000 - supr * 60);
}

/* Fotografía del final del turno: material, desgaste, taller y apartado
   pasan tal cual al turno siguiente. El personal, no: entra gente nueva. */
function estadoTrasTurno(g, camp) {
  const desg = { ...camp.desg, ...g.desg };
  for (const t of g.trenes) for (const u of t.unidades) desg[u.id] = u.desgaste;
  for (const lista of Object.values(g.apartado || {})) for (const x of lista) for (const u of x.unidades) desg[u.id] = u.desgaste;

  const averiadas = [...new Set([...camp.averiadas, ...Object.values(g.apartado || {}).flat().filter((x) => x.averiado).flatMap((x) => x.unidades.map((u) => u.id))])];

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

  const apartado = {};
  for (const [idx, lista] of Object.entries(g.apartado || {}))
    apartado[idx] = lista.filter((x) => x.unidades.length).map((x) => ({ via: x.via, ids: x.unidades.map((u) => u.id), averiado: !!x.averiado }));

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
      idx: t.reponer.idx,
      cuando: t.reponer.cuando % (24 * 60),
      ids: t.reponer.unidades.map((u) => u.id),
    }));

  /* La situación de la línea también se hereda: el turno entrante recoge la
     línea tal y como la deja el saliente. Sin esto, acabar con todo el
     servicio retrasado y los andenes llenos no tenía ninguna consecuencia. */
  const retrasos = g.trenes.filter((t) => !t.esVacio).map((t) => Math.round(t.retraso * 10) / 10);
  const andenes = g.andenes.map((a2) => ({ alcala: Math.round(a2.alcala), pio: Math.round(a2.pio) }));
  const restricciones = (g.restricciones || [])
    .filter((x) => x.hasta > g.reloj)
    .map((x) => ({ ...x, dura: Math.round(x.hasta - g.reloj) }));

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

  const iT = ORDEN_TURNOS.indexOf(camp.turno);
  const ultimo = iT === ORDEN_TURNOS.length - 1;
  return { dia: ultimo ? camp.dia + 1 : camp.dia, turno: ultimo ? ORDEN_TURNOS[0] : ORDEN_TURNOS[iT + 1], desg, averiadas, taller, apartado, slots, reponer, retrasos, andenes, restricciones, acum };
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
    for (const q of FASES_CAB[cab]) for (let k = 0; k < 22; k++) {
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
      lugar: ESTACIONES[idx].cab || ESTACIONES[idx].n,
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
    t.reponer = { idx, cab: ESTACIONES[idx].cab || ESTACIONES[idx].n, cuando, unidades: lote.unidades.map((u) => ({ ...u })), maq: maq.id };
    log(g, "ok", `Circulación ${t.i}: saldrá de ${ESTACIONES[idx].n}${via ? `, ${via}` : ""}, a las ${hhmm(cuando)}.`);
  }
}

function comenzarTurno(slots, apart, camp) {
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
    return { ...c, desgaste: d, fiab: fiabDesgaste(d), vencida: false };
  };

  const trenes = slots.map((par, j) => {
    const unidades = par.filter(Boolean).map(conDesgaste).filter(Boolean);
    const t = {
      i: j + 1,
      serie: unidades[0] ? unidades[0].serie : "446",
      unidades,
      offset: j * INTERVALO,
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

  // 2. el cuadro ya tiene previsto quién entra en cada relevo: son nominales,
  //    no reservas. Se dan de alta en la cabecera y a la hora que les toca.
  for (const t of trenes) {
    if (!t.relevo) continue;
    alta({ tipo: "nominal", estado: "entrante", lugar: t.relevo.cab, entra: Math.max(INICIO, t.relevo.prevista - 25) });
  }

  // 3. reservas de contingencia
  for (const [cab, n] of RESERVAS) for (let x = 0; x < n; x++) alta({ tipo: "reserva", estado: "reserva", lugar: cab });

  const usadas = new Set(slots.flat().filter(Boolean));
  const apartado = {};
  const enVia = new Set();

  if (camp && camp.apartado && Object.keys(camp.apartado).length) {
    // apartado heredado del turno anterior, tal y como quedó
    for (const [i, lista] of Object.entries(camp.apartado)) {
      const idx = Number(i);
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
      const cab = ESTACIONES[rp.idx].cab || ESTACIONES[rp.idx].n;
      const m = alta({ tipo: "nominal", estado: "entrante", lugar: cab, entra: Math.max(INICIO, rp.cuando - 20) });
      t.estado = "suprimido";
      t.unidades = [];
      t.maq = null;
      t.reponer = { idx: rp.idx, cab, cuando: rp.cuando, unidades: uds, maq: m.id };
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
  if (camp && camp.retrasos) trenes.forEach((t, j) => { if (camp.retrasos[j] !== undefined) t.retraso = camp.retrasos[j]; });

  // el cuadro completo del día: lo que cada circulación debería hacer
  for (const t of trenes) t.marchas = rotacionDelDia(t, INICIO - 60, FIN + 60).map((m) => ({ ...m, real: false }));

  // una circulación sin material arranca fuera de servicio
  for (const t of trenes) if (!t.unidades.length && !t.reponer) t.estado = "suprimido";

  const reserva = LIBRES_C7.filter((u) => !usadas.has(u.id) && !enVia.has(u.id) && !enTaller.has(u.id) && !heredadas.has(u.id)).map((u) =>
    conDesgaste(u.id)
  );

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
    vel: 4,
    trenes,
    personal,
    reserva,
    kpi: { muestras: 0, puntuales: 0, afect: 0, coste: 0 },
    log: [{ m: INICIO, k: "info", t: `Turno abierto. ${trenes.length} circulaciones y ${personal.filter((m) => m.tipo === "reserva").length} maquinistas de reserva.` }],
    cola: [],
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
    andenes: camp && camp.andenes ? camp.andenes.map((a2) => ({ ...a2 })) : ESTACIONES.map(() => ({ alcala: 0, pio: 0 })),
    apartado,
    // las restricciones que seguían vigentes continúan, con su tiempo restante
    restricciones: camp && camp.restricciones ? camp.restricciones.map((x) => ({ ...x, hasta: INICIO + x.dura })) : [],
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
function reservasEn(g, cab) {
  return g.personal.filter((m) => m.tipo === "reserva" && m.estado === "reserva" && m.lugar === cab && !m.baja && margenDe(m) >= 60);
}

// relevo ordinario: el nominal al que le toca entrar en esa cabecera
function nominalEn(g, cab) {
  return g.personal.filter((m) => m.tipo === "nominal" && m.estado === "entrante" && m.lugar === cab && m.entra <= g.reloj && !m.baja && margenDe(m) >= 60);
}

/* ── motor ──────────────────────────────────────────────────── */

function minuto(g) {
  const r = g.reloj;
  llenarAndenes(g);

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
    if (o.estado === "suprimido") {
      o.enVU = null;
      continue;
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
    } else if (so.dir !== "maniobra" && !o.enDesviada && !o.rotando) {
      // al aparecer la incidencia puede haber trenes ya dentro: se autoriza a
      // los del sentido que primero se encuentre; los contrarios se retienen
      const dentro = tramos.find((x) => dentroTramo(o, r, x.tramo));
      if (dentro) {
        const k = `${dentro.tramo.a}-${dentro.tramo.b}`;
        const otro = g.trenes.find((x) => x.enVU && `${x.enVU.a}-${x.enVU.b}` === k);
        if (!otro || otro.enVU.dir === so.dir) o.enVU = { a: dentro.tramo.a, b: dentro.tramo.b, dir: so.dir, desde: r };
      }
    }
  }

  const vu = {};
  for (const rest of tramos) {
    const k = `${rest.tramo.a}-${rest.tramo.b}`;
    const ocup = g.trenes.filter((o) => o.enVU && `${o.enVU.a}-${o.enVU.b}` === k);
    vu[k] = { dir: ocup.length ? ocup[0].enVU.dir : null, n: ocup.length };
  }
  const libreVU = (k, dir) => !vu[k] || !vu[k].dir || vu[k].dir === dir;
  const tomarVU = (t, k, dir) => {
    if (vu[k]) {
      vu[k].dir = dir;
      vu[k].n += 1;
    }
    const [a2, b2] = k.split("-").map(Number);
    // la autorización viaja con el tren y guarda cuándo se concedió
    t.enVU = { a: a2, b: b2, dir, desde: t.enVU && t.enVU.a === a2 && t.enVU.b === b2 ? t.enVU.desde : g.reloj };
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
    const sigRep = marchaActual(t);
    if (sigRep) sigRep.inicioReal = Math.round(r);
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
        const libre = libreVU(k, dir);
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

    // inmovilizado por avería muy grave: no se mueve hasta que llegue el socorro
    if (t.inmovil) {
      t.retraso += 1;
      t.inmovil.restante -= 1;
      if (t.inmovil.restante <= 0) {
        const dest = estacionesParaSuprimir(g, t)[0];
        log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: remolcado hasta ${dest ? ESTACIONES[dest.idx].n : "la vía más próxima"}. Vía despejada.`);
        apunta(g, t, "inmovilizado por avería muy grave", r - t.inmovil.desde);
        t.inmovil = null;
        suprimir(g, t, `Tren ${numeroTren(t, g.reloj)}: retirado del servicio por avería muy grave.`, dest ? dest.idx : null);
      }
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
      const mq = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
      if (mq && !t.avisoRot && mq.cond + t.rotando.restante > COND_MAX) {
        t.avisoRot = true;
        g.cola.push({
          tipo: "aviso",
          titulo: `Maniobra demasiado larga en ${ESTACIONES[t.rotando.idx].n}`,
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
      if (nominalEn(g, t.retenido).length || reservasEn(g, t.retenido).length) {
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
      const sig = marchaActual(t);
      if (sig && sig.inicioReal === undefined) sig.inicioReal = Math.round(r);
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
      const mq = g.personal.find((x) => x.id === t.maq);
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
    let retenidoVU = false;
    for (const rest of tramos) {
      const k = `${rest.tramo.a}-${rest.tramo.b}`;
      if (t.enVU && t.enVU.a === rest.tramo.a && t.enVU.b === rest.tramo.b) continue; // ya autorizado
      const sv = situacion(t, r);
      if (sv.dir === "maniobra") continue;
      // ¿pisa ya el tramo, incluida su estación de acceso?
      const pisa = sv.dir === "alcala"
        ? sv.idx >= rest.tramo.a && sv.idx < rest.tramo.b
        : sv.idx <= rest.tramo.b && sv.idx > rest.tramo.a;
      if (!pisa) continue;
      const acceso = sv.dir === "alcala" ? rest.tramo.a : rest.tramo.b;
      const prevista = r - t.retraso;
      // si ya está metido en el tramo, no se le puede echar: se le confirma
      if (dentroTramo(t, r, rest.tramo)) {
        tomarVU(t, k, sv.dir);
        continue;
      }
      if (libreVU(k, sv.dir) && !hayPrioritario(k, prevista, t.i) && !esperaDeFrente(k, sv.dir)) {
        tomarVU(t, k, sv.dir); // el tramo pasa a ser suyo hasta que lo despeje
        continue;
      }
      // no puede pasar: espera el cruce en la estación de acceso
      retenerEnAcceso(g, t, rest.tramo, sv.dir, r);
      retenidoVU = true;
      break;
    }
    if (retenidoVU || t.esperaCruce) continue;

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
      const m = g.personal.find((x) => x.id === t.maq);
      const eta = etaRelevo(t, r);
      if (eta !== Infinity && m.cond + eta > COND_MAX) {
        t.avisado = true;
        const e = etaPrimeraCabecera(t, r);
        g.cola.push({
          tipo: "aviso",
          titulo: `Relevo comprometido en el ${numeroTren(t, g.reloj)}`,
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
    const m = g.personal.find((x) => x.id === t.maq);
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
          m.lugar = ESTACIONES[o.idx].cab || ESTACIONES[o.idx].n;
        }
        log(g, "bad", `El material de ${ESTACIONES[o.idx].n}, ${o.via}, ya no está: se anula el movimiento en vacío.`);
      }
    }
    g.vacios = pend;
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
  g.restricciones = g.restricciones.filter((x) => r < x.hasta);

  if (g.incEspera > 0) g.incEspera -= 1;
  if (r >= g.proximoSorteo) {
    if (g.cola.length || g.incEspera > 0 || g.incCount >= MAX_INCIDENCIAS) {
      g.proximoSorteo = r + 10; // se pospone, no se pierde el sorteo
    } else {
      g.proximoSorteo = r + 55 + Math.floor(Math.random() * 11);
      const def = sortearIncidencia(r);
      const inc = def && def.gen(g);
      if (inc) {
        g.cola.push({ tipo: "inc", ...inc });
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
  const m = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
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
    t.avisado = true;
    g.cola.push({
      tipo: "aviso",
      titulo: `Sin relevo en ${cab}`,
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
  const sale = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
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
  t.relevo = programarRelevo(t, entra, g.reloj);
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
      const sale = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
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
      t.relevo = programarRelevo(t, entra, g.reloj);
      txtMaq = ` Lo toma ${entra.nombre}.`;
    }
  }

  log(g, "ok", `Tren ${numeroTren(t, g.reloj)}: cambiado a ${t.unidades.map((u) => u.id).join(" + ")} en ${e.n}. ${defectuoso.map((u) => u.id).join(" + ")} queda apartado en ${via}, fuera de servicio.${txtMaq}`);
  t.cambio = null;
}


function suprimir(g, t, msg, enIdx = null, enVia = null) {
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
    const m = g.personal.find((x) => x.id === t.maq);
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
  "circularVacio", "coste", "corteVia", "desacoplar", "destinoVacio", "esperarCabecera", "averiaGrave", "fiabBaja", "gen", "limitacion", "moverApartado", "ordenarRotacion", "socorro",
  "reforzar", "relevaReserva", "relevoInmediato", "reponer", "restriccion", "retener", "retirarCabecera",
  "retirarMaq", "retraso", "riesgo", "supresion", "suprimir",
];

function aplicar(g, ef) {
  for (const k of Object.keys(ef || {}))
    if (!EFECTOS.includes(k)) console.warn(`[CGO] efecto desconocido: "${k}". Revisa el registro EFECTOS.`);
  const T = (i) => g.trenes.find((x) => x.i === i);

  if (ef.retraso) {
    const t = T(ef.retraso.i);
    if (t) retrasar(g, t, ef.retraso.m, "la incidencia");
  }
  if (ef.desacoplar) {
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
    const cab = ESTACIONES[idx].cab || ESTACIONES[idx].n;
    const maq = reservasEn(g, cab).sort((a2, b2) => margenDe(b2) - margenDe(a2))[0];
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
      const dest = viasParaApartar(g, t)[0];
      if (dest) {
        // se propone el primer sitio posible, pero el puesto de mando puede cambiarlo
        t.supresion = { idx: dest.idx, via: dest.vias[0], averiado: true };
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
      t.vacio = true; // bypass de puertas: no puede llevar viajeros
      t.pendienteApartar = true; // el puesto de mando elegirá estación y vía
      log(g, "aviso", `Tren ${numeroTren(t, g.reloj)}: desaloja en la próxima parada y circula como material vacío. Falta decidir dónde se aparta.`);
    }
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

  if (ef.corteVia) {
    const t = T(ef.corteVia.i);
    if (t) {
      const s2 = situacion(t, g.reloj);
      const idx = Math.min(N - 1, Math.round(s2.idx));
      const dir = s2.dir === "maniobra" ? "alcala" : s2.dir;
      g.restricciones = [
        ...g.restricciones,
        { idx, m: 0, hasta: FIN + 60, txt: `Material averiado del ${numeroTren(t, g.reloj)}`, dir, tramo: limitesTramo(idx) },
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
  if (ef.restriccion) {
    const { idx, m, dur, txt, bloqueaRot, dir } = ef.restriccion;
    const tramo = dir ? limitesTramo(idx) : null;
    g.restricciones = [...g.restricciones.filter((x) => x.idx !== idx), { idx, m, hasta: g.reloj + dur, txt, bloqueaRot: !!bloqueaRot, dir: dir || null, tramo }];
    if (tramo)
      log(g, "bad", `Vía única entre ${ESTACIONES[tramo.a].n} y ${ESTACIONES[tramo.b].n}: los trenes se cruzarán en esas estaciones.`);
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
  return g;
}

function clonar(p) {
  return {
    ...p,
    trenes: p.trenes.map((t) => ({ ...t, unidades: t.unidades.map((u) => ({ ...u })), pax: [...t.pax], hist: [...t.hist], marchas: [...(t.marchas || [])], acum: { ...t.acum } })),
    personal: p.personal.map((m) => ({ ...m })),
    kpi: { ...p.kpi },
    reserva: p.reserva.map((u) => ({ ...u })),
    cola: [...p.cola],
    restricciones: p.restricciones.map((x) => ({ ...x })),
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
  };
}

function avanzar(prev, dt) {
  let g = clonar(prev);
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

const ST = {
  wrap: { background: P.ground, color: P.ink, minHeight: "100vh", fontFamily: "'Archivo', system-ui, sans-serif", maxWidth: 540, margin: "0 auto", padding: "14px 14px 40px" },
  card: { background: P.surface, borderRadius: 12, border: `1px solid ${P.rule}` },
  eyebrow: { fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", color: P.muted, fontWeight: 600 },
  btn: (on) => ({
    flex: 1,
    border: `1px solid ${on ? P.ink : P.rule}`,
    background: on ? P.ink : P.surface,
    color: on ? "#fff" : P.ink,
    borderRadius: 8,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "ui-monospace, monospace",
    cursor: "pointer",
  }),
};

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
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pantalla, tab, trenSel, estSel, unidadSel]);
  const [camp, setCamp] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modo, setModo] = useState("campana");

  // se recupera la campaña guardada al abrir la aplicación
  useEffect(() => {
    let vivo = true;
    cargarCampana().then((c) => {
      if (!vivo) return;
      setCamp(c);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!g || !g.marcha || g.fin || g.cola.length) return;
    const iv = setInterval(() => setG((p) => (p && p.marcha && !p.cola.length && !p.fin ? avanzar(p, 0.1 * p.vel) : p)), 100);
    return () => clearInterval(iv);
  }, [g && g.marcha, g && g.vel, g && g.fin, g && g.cola.length]);

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
          fijarTurno(c.turno);
          setAsig(initAsignacion());
          setPantalla("asignacion");
        }}
        empezar={(idTurno) => {
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
    const nota = punt >= 92 && g.kpi.afect < 6000 ? "Turno notable" : punt >= 75 ? "Turno aceptable" : "Turno para revisar";
    return (
      <div style={ST.wrap}>
        <Fonts />
        <div style={ST.eyebrow}>Relevo de turno · {hhmm(FIN)}</div>
        <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: -1, margin: "4px 0 14px", lineHeight: 1.05 }}>{nota}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <Kpi k="Puntualidad" v={`${punt.toFixed(1)}%`} c={punt >= 92 ? P.ok : punt >= 75 ? P.warn : P.alert} />
          <Kpi k="Afectados" v={nf(g.kpi.afect)} c={P.ink} />
          <Kpi k="Coste extra" v={`${(g.kpi.coste / 1000).toFixed(1)}k €`} c={P.ink} />
        </div>
        <div style={{ ...ST.card, padding: 13, marginBottom: 12, fontSize: 14 }}>
          {activos.length} de {CIRCULACIONES} circulaciones al cierre · {g.trenes.filter((t) => t.estado === "degradado").length} degradadas ·{" "}
          {g.incCount} incidencia{g.incCount !== 1 ? "s" : ""}
        </div>
        <div style={{ ...ST.card, padding: 12, maxHeight: 280, overflowY: "auto" }}>
          <div style={{ ...ST.eyebrow, marginBottom: 7 }}>Incidencias del turno</div>
          {g.log.filter((l) => l.k === "bad" || l.k === "aviso").map((l, i) => (
            <div key={i} style={{ fontSize: 12.5, marginBottom: 4, display: "flex", gap: 7 }}>
              <span style={{ color: P.muted, fontFamily: "ui-monospace, monospace" }}>{hhmm(l.m)}</span>
              <span style={{ color: l.k === "bad" ? P.alert : P.warn }}>{l.t}</span>
            </div>
          ))}
        </div>
        <div style={{ ...ST.card, padding: 13, margin: "12px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12.5, color: P.muted, flex: 1, lineHeight: 1.4 }}>
            Puntuación del turno
            {modo === "campana" && camp ? ` · acumulado ${nf(camp.acum.puntos + puntosTurno(g))}` : ""}
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: puntosTurno(g) >= 800 ? P.ok : puntosTurno(g) >= 500 ? P.warn : P.alert }}>
            {nf(puntosTurno(g))}
          </span>
        </div>

        <button
          onClick={() => {
            if (modo === "campana") {
              // el turno se cierra y todo pasa al siguiente: material, desgaste y taller
              const sig = estadoTrasTurno(g, camp || campanaNueva());
              setCamp(sig);
              guardarCampana(sig);
              fijarTurno(sig.turno);
              setAsig({ slots: sig.slots, apart: {} });
            } else {
              setAsig(initAsignacion());
            }
            setG(null);
            // en campaña se enlaza directamente con el turno siguiente
            setPantalla(modo === "campana" ? "asignacion" : "portada");
          }}
          style={{ ...ST.btn(true), width: "100%", padding: "14px 0", fontSize: 15 }}
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
      <BarraSuperior g={g} setG={setG} tab={tab} setTab={setTab} />
      <div style={{ height: 88 }} />

      {tab === "trenes" && <Trenes g={g} setRotarDe={setRotarDe} setTrenSel={setTrenSel} setVolverA={setVolverA} setApartarDe={setApartarDe} setSuprimirDe={setSuprimirDe} setReponerDe={setReponerDe} setApartaderoDe={setApartaderoDe} setUnidadSel={setUnidadSel} />}
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
      {tab === "mapa" && <Mapa g={g} detalle={detalle} setDetalle={setDetalle} setEstSel={setEstSel} setTrenSel={setTrenSel} setVolverA={setVolverA} />}
      {tab === "libro" && <Libro g={g} />}

      {rotarDe !== null && <SelectorRotacion g={g} setG={setG} i={rotarDe} close={() => setRotarDe(null)} />}
      {apartarDe !== null && <SelectorApartado g={g} setG={setG} i={apartarDe} close={() => setApartarDe(null)} />}
      {suprimirDe !== null && <SelectorSupresion g={g} setG={setG} i={suprimirDe} close={() => setSuprimirDe(null)} />}
      {reponerDe !== null && <SelectorReposicion g={g} setG={setG} i={reponerDe} close={() => setReponerDe(null)} />}
      {apartaderoDe !== null && <SelectorApartadero g={g} setG={setG} i={apartaderoDe} close={() => setApartaderoDe(null)} />}
      {vacioDe && <SelectorVacio g={g} setG={setG} idx={vacioDe.idx} via={vacioDe.via} close={() => setVacioDe(null)} />}

      {gestionUd && <SelectorTaller g={g} setG={setG} id={gestionUd} close={() => setGestionUd(null)} />}

      {unidadSel && (
        <PerfilUnidad
          g={g}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 70 }}>
          <div style={{ ...ST.card, borderColor: aviso.tipo === "inc" ? P.alert : P.warn, borderWidth: 1.5, padding: 16, maxWidth: 460, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ ...ST.eyebrow, color: aviso.tipo === "inc" ? P.alert : P.warn }}>
              {aviso.tipo === "inc" ? "Incidencia" : "Requiere decisión"} · {hhmm(g.reloj)}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "4px 0 5px", lineHeight: 1.2 }}>{aviso.titulo}</div>
            <div style={{ fontSize: 14, color: P.muted, lineHeight: 1.5, marginBottom: 13 }}>{aviso.texto}</div>
            {aviso.opciones.map((o, i) => (
              <button
                key={i}
                onClick={() => setG((p) => aplicar(clonar(p), o.ef))}
                style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 9, padding: "11px 13px", marginBottom: 7, fontFamily: "inherit", cursor: "pointer", color: P.ink }}
              >
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 12.5, color: P.muted, marginTop: 2 }}>{o.detalle}</div>
              </button>
            ))}
          </div>
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

const AZUL = "#0E2038";
const AZUL_OSC = "#0A1B2E";
const ROJO_CM = "#D7282F";
const ROJO_OSC = "#A81D22";

function IconoPortada({ tipo, c = "#fff", t = 22, grosor = 2 }) {
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
  const col = tipo === "anden" ? "#C9D3DC" : "#17324B";
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
function Skyline({ c = "#24425F" }) {
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
          borderRadius: 14,
          padding: 0,
          marginBottom: 11,
          fontFamily: "inherit",
          cursor: cargando ? "wait" : inactiva ? "not-allowed" : "pointer",
          color: oscura ? "#fff" : AZUL,
          boxShadow: "0 6px 20px rgba(10,27,46,.13)",
          overflow: "hidden",
          opacity: cargando ? 0.6 : inactiva ? 0.45 : 1,
        }}
      >
        <MarcaTarjeta tipo={d.m} />
        <span style={{ position: "relative", display: "block", padding: "20px 18px 17px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 14 }}>
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
                boxShadow: "0 3px 10px rgba(215,40,47,.4)",
              }}
            >
              <IconoPortada tipo={d.ic} t={26} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: 0.2, display: "block", lineHeight: 1.1 }}>{d.n}</span>
              <span style={{ display: "block", width: 38, height: 4, background: ROJO_CM, borderRadius: 2, marginTop: 8 }} />
            </span>
            {id === "campana" && enCurso && (
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.7, color: "#fff", background: ROJO_CM, borderRadius: 4, padding: "3px 7px", flexShrink: 0 }}>EN CURSO</span>
            )}
          </span>

          <span style={{ display: "block", fontSize: 13, lineHeight: 1.6, color: oscura ? "#B9C9D8" : "#4C6076", maxWidth: 260 }}>{d.t}</span>

          <span style={{ display: "block", borderTop: `1px dashed ${oscura ? "#2A4059" : "#D4DDE5"}`, margin: "16px 0 12px" }} />

          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <IconoPortada tipo={d.pi} c={oscura ? "#8FA6BC" : "#78899C"} t={16} grosor={1.8} />
            <span style={{ fontSize: 12, color: oscura ? "#8FA6BC" : "#78899C" }}>{d.p}</span>
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
    <div style={{ ...ST.wrap, padding: 0, background: "#E9EDF1", minHeight: "100vh", overflowX: "hidden" }}>
      <Fonts />

      {/* ── cabecera con la escena ── */}
      <div style={{ position: "relative", minHeight: 330, overflow: "hidden", background: "#F1F5F8" }}>
        <EscenaTren />
        <div style={{ position: "relative", padding: "26px 16px 30px" }}>
          <div style={{ fontSize: 9.5, letterSpacing: 2.6, textTransform: "uppercase", color: "#54687E", fontWeight: 700 }}>Centro de Gestión de Operaciones</div>
          <div style={{ fontSize: 58, fontWeight: 800, color: AZUL, letterSpacing: -3, lineHeight: 0.86, marginTop: 8 }}>CGO</div>
          <div style={{ fontSize: 47, fontWeight: 800, color: ROJO_CM, letterSpacing: -2.4, lineHeight: 0.94, marginTop: 2 }}>Simulator</div>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14 }}>
            <span style={{ width: 32, height: 4, background: ROJO_CM, borderRadius: 2 }} />
            <span style={{ fontSize: 15, color: "#33475C", fontWeight: 600 }}>Cercanías Madrid</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#4C6076", lineHeight: 1.6, marginTop: 14, maxWidth: 215 }}>
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
            gap: 9,
            background: AZUL_OSC,
            color: "#fff",
            padding: "10px 30px 10px 15px",
            borderRadius: "10px 0 0 0",
            clipPath: "polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
            marginBottom: -2,
          }}
        >
          <IconoPortada tipo="tren" c={ROJO_CM} t={16} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6 }}>MODO DE JUEGO</span>
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
        <div style={{ background: "#F3F6F8", borderRadius: 14, display: "flex", padding: "4px 0" }}>
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
                gap: 7,
                textAlign: "center",
              }}
            >
              <IconoPortada tipo={r.i} c={ROJO_CM} t={20} grosor={1.9} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: AZUL, lineHeight: 1.25 }}>{r.n}</span>
                <span style={{ display: "block", fontSize: 10, color: "#78899C", marginTop: 3, lineHeight: 1.3 }}>{r.d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── pie ── */}
      <div style={{ position: "relative", background: AZUL_OSC, padding: "18px 14px", overflow: "hidden" }}>
        <Skyline c="#24425F" />
        <div style={{ position: "relative", textAlign: "center" }}>
          <span style={{ fontSize: 12.5, color: "#B9C9D8" }}>Tú controlas la red. </span>
          <span style={{ fontSize: 12.5, color: ROJO_CM, fontWeight: 700 }}>Cada decisión cuenta.</span>
        </div>
      </div>
    </div>
  );
}
// cabecera reducida para las pantallas interiores
function Logo({ pequeno }) {
  return (
    <div style={{ marginBottom: pequeno ? 18 : 30 }}>
      <div style={{ fontSize: 9.5, letterSpacing: 2.4, textTransform: "uppercase", color: "#5C7188", fontWeight: 700 }}>Centro de Gestión de Operaciones</div>
      <h1 style={{ fontSize: pequeno ? 34 : 52, fontWeight: 800, letterSpacing: pequeno ? -1.5 : -2.4, lineHeight: 0.92, margin: "4px 0 0", color: AZUL }}>
        CGO <span style={{ color: ROJO_CM }}>Simulator</span>
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10 }}>
        <span style={{ height: 3, width: 30, background: ROJO_CM, borderRadius: 2 }} />
        <span style={{ fontSize: 13, color: P.muted }}>Cercanías Madrid</span>
      </div>
    </div>
  );
}

function Seleccion({ modo, camp, cargando, atras, empezar, nueva }) {
  const enCurso = camp && camp.acum.turnos > 0;
  const [turno, setTurno] = useState("manana");
  const defT = TURNOS.find((x) => x.id === (modo === "campana" && camp ? camp.turno : turno)) || TURNOS[0];

  return (
    <div style={{ ...ST.wrap, minHeight: "100vh" }}>
      <Fonts />
      <button
        onClick={atras}
        style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: P.muted, marginBottom: 12 }}
      >
        ‹ Modo de juego
      </button>

      <Logo pequeno />

      <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Línea</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {LINEAS_NUCLEO.map((l) => (
          <span
            key={l.id}
            title={l.n}
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "ui-monospace, monospace",
              color: "#fff",
              background: LIN[l.id],
              opacity: l.id === LINEA ? 1 : 0.28,
              borderRadius: 6,
              padding: "5px 11px",
            }}
          >
            {l.id}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 12, color: P.muted, marginBottom: 22, lineHeight: 1.45 }}>
        Disponible la <strong style={{ color: P.ink }}>{LINEA}</strong>, {LINEAS_NUCLEO.find((l) => l.id === LINEA).n}. El resto del núcleo llegará más
        adelante.
      </div>

      {modo === "rapida" ? (
        <>
          <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Turno</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 22 }}>
            {TURNOS.map((t) => {
              const sel = turno === t.id;
              return (
                <button
                  key={t.id}
                  disabled={!t.ok}
                  onClick={() => setTurno(t.id)}
                  style={{
                    flex: 1,
                    background: sel && t.ok ? P.ink : P.surface,
                    color: sel && t.ok ? "#fff" : P.ink,
                    border: `1px solid ${sel && t.ok ? P.ink : P.rule}`,
                    borderRadius: 10,
                    padding: "12px 6px",
                    fontFamily: "inherit",
                    cursor: t.ok ? "pointer" : "not-allowed",
                    opacity: t.ok ? 1 : 0.4,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t.n}</div>
                  <div style={{ fontSize: 10.5, marginTop: 2, fontFamily: "ui-monospace, monospace", color: sel && t.ok ? "#C7CDD2" : P.muted }}>
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
          <div style={{ ...ST.card, padding: 14, marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: enCurso ? 10 : 0 }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, flex: 1 }}>
                Día {camp ? camp.dia : 1} · turno de {defT.n.toLowerCase()}
              </span>
              <span style={{ fontSize: 12, color: P.muted, fontFamily: "ui-monospace, monospace" }}>{defT.h}</span>
            </div>
            {enCurso && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
                <Kpi k="Turnos" v={String(camp.acum.turnos)} c={P.ink} small />
                <Kpi k="Punt." v={`${camp.acum.punt.toFixed(0)}%`} c={camp.acum.punt >= 92 ? P.ok : camp.acum.punt >= 75 ? P.warn : P.alert} small />
                <Kpi k="Afectados" v={nf(camp.acum.afect)} c={P.ink} small />
                <Kpi k="Puntos" v={nf(camp.acum.puntos)} c={P.ok} small />
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => empezar(modo === "rapida" ? turno : null)}
        disabled={cargando}
        style={{ ...ST.btn(true), width: "100%", padding: "15px 0", fontSize: 15, fontFamily: "inherit", letterSpacing: 0.3, opacity: cargando ? 0.5 : 1 }}
      >
        {modo === "rapida" ? "Entrar al puesto de mando" : enCurso ? "Continuar la campaña" : "Empezar campaña"}
      </button>

      {modo === "campana" && enCurso && (
        <button
          onClick={nueva}
          style={{ width: "100%", background: "transparent", border: "none", color: P.muted, padding: "12px 0 0", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
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
      <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, margin: "3px 0 6px" }}>
        {camp ? `Día ${camp.dia} · ` : ""}turno de {(TURNOS.find((x) => x.id === TURNO_ID) || TURNOS[0]).n.toLowerCase()}
      </h1>
      <div style={{ fontSize: 13, color: P.muted, lineHeight: 1.5, marginBottom: 16 }}>
        El servicio ya está en marcha. Te haces cargo de {CIRCULACIONES} circulaciones con el material que dejó el turno anterior: aquí no se asigna
        nada, solo se toma el mando.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <Kpi k="En línea" v={`${CIRCULACIONES}`} c={P.ok} small />
        <Kpi k="Plazas" v={`${(plazas / 1000).toFixed(1)}k`} c={P.ink} small />
        <Kpi k="Punta" v={nf(demPunta)} c={P.warn} small />
      </div>

      {flojas.length > 0 && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 10, borderColor: P.alert }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: P.alert, marginBottom: 4 }}>
            {flojas.length} unidad{flojas.length === 1 ? "" : "es"} no llega al final del turno
          </div>
          <div style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace", lineHeight: 1.5 }}>
            {flojas.map((u) => `${u.id} · ${Math.round(u.desgaste)} %`).join("  ·  ")}
          </div>
        </div>
      )}

      {camp && camp.retrasos && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 12, borderColor: camp.retrasos.some((x) => x > 5) ? P.warn : P.rule }}>
          <div style={{ ...ST.eyebrow, marginBottom: 8 }}>Cómo te dejan la línea</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            <Kpi
              k="Retraso medio"
              v={`${(camp.retrasos.reduce((n, v) => n + v, 0) / Math.max(1, camp.retrasos.length)).toFixed(1)}′`}
              c={camp.retrasos.some((x) => x > 8) ? P.alert : camp.retrasos.some((x) => x > 5) ? P.warn : P.ok}
              small
            />
            <Kpi k="En andén" v={nf((camp.andenes || []).reduce((n, a2) => n + a2.alcala + a2.pio, 0))} c={P.ink} small />
            <Kpi k="Restricc." v={String((camp.restricciones || []).length)} c={(camp.restricciones || []).length ? P.warn : P.ok} small />
          </div>
          <div style={{ fontSize: 11.5, color: P.muted, marginTop: 9, lineHeight: 1.45 }}>
            Los retrasos, los viajeros que siguen esperando y las restricciones vigentes pasan contigo al turno entrante.
          </div>
        </div>
      )}

      <div style={ST.eyebrow}>Composiciones en servicio</div>
      <div style={{ ...ST.card, padding: 12, margin: "6px 0 10px" }}>
        {comps.map((c, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k) }}>
            <span style={{ fontSize: 10.5, color: P.muted, width: 22, flexShrink: 0 }}>{String(k + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 12.5, fontFamily: "ui-monospace, monospace", fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.map((u) => u.id).join(" + ") || "—"}
            </span>
            <span style={{ fontSize: 11, color: P.muted, flexShrink: 0 }}>{nf(c.reduce((m, u) => m + u.plazas, 0))} pl</span>
            <span
              style={{ fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace, monospace", flexShrink: 0, color: c.some((u) => !cubreTurno(u)) ? P.alert : P.muted }}
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
              const [idx, via] = clv.split("|");
              return (
                <div key={clv} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k) }}>
                  <span style={{ fontSize: 12, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ESTACIONES[idx].n} · {via}
                  </span>
                  <span style={{ fontSize: 11.5, fontFamily: "ui-monospace, monospace", color: P.muted, flexShrink: 0 }}>
                    {par.filter(Boolean).join(" + ")}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button onClick={empezar} style={{ ...ST.btn(true), width: "100%", padding: "15px 0", fontSize: 15, fontFamily: "inherit" }}>
        Tomar el servicio
      </button>
    </div>
  );
}

function Asignacion({ asig, setAsig, slotSel, setSlotSel, empezar, camp }) {
  const usadas = new Set([...asig.slots.flat(), ...Object.values(asig.apart).flat()].filter(Boolean));
  const listas = asig.slots.filter(slotCompleto).length;
  const completo = listas === CIRCULACIONES;
  const uni = (id) => CATALOGO.find((u) => u.id === id);
  const plazasSlot = (par) => par.filter(Boolean).reduce((n, id) => n + uni(id).plazas, 0);

  const lib = (s) => LIBRES_C7.filter((u) => u.serie === s).length;
  const demPunta = demandaPorTren();
  const cubiertas = asig.slots.filter((par) => slotCompleto(par) && plazasSlot(par) >= demPunta).length;

  return (
    <div style={ST.wrap}>
      <Fonts />
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
        <span style={{ background: ROJO, color: "#fff", fontSize: 17, fontWeight: 700, padding: "2px 9px", borderRadius: 6 }}>C-7</span>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Asignación de material</div>
          <div style={{ fontSize: 11, color: P.muted }}>Antes de abrir el turno de mañana</div>
        </div>
      </div>

      <div style={{ ...ST.card, padding: 13, margin: "12px 0", fontSize: 13, lineHeight: 1.5, color: P.muted }}>
        {CIRCULACIONES} circulaciones. Las <strong style={{ color: P.ink }}>446 y 465</strong> circulan acopladas de dos en dos; la{" "}
        <strong style={{ color: P.ink }}>450 de doble piso</strong> presta servicio en composición simple. La demanda en punta ronda los{" "}
        <strong style={{ color: P.ink }}>{nf(demPunta)} viajeros</strong> a bordo por circulación. Vigila el{" "}
        <strong style={{ color: P.ink }}>kilometraje hasta revisión</strong>: una unidad recorre unos {KM_TURNO} km en el turno.
      </div>

      {(() => {
        const cortas = [...usadas].map(uni).filter((u) => u && !cubreTurno(u));
        return cortas.length ? (
          <div style={{ ...ST.card, borderColor: P.alert, padding: "9px 12px", marginBottom: 10, fontSize: 12.5, lineHeight: 1.45 }}>
            <strong style={{ color: P.alert }}>{cortas.length} unidad(es) no llegan al final del turno</strong>: {cortas.map((u) => u.id).join(", ")}. Les
            vencerá la revisión en línea.
          </div>
        ) : null;
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        <Kpi k="Cubiertas" v={`${listas}/${CIRCULACIONES}`} c={completo ? P.ok : P.warn} small />
        <Kpi k="450 libres" v={String(lib("450"))} c={P.ink} small />
        <Kpi k="465 libres" v={String(lib("465"))} c={P.ink} small />
        <Kpi k="446 libres" v={String(lib("446"))} c={P.ink} small />
      </div>

      <div style={{ ...ST.card, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: P.muted, marginBottom: 5 }}>
          <span>Circulaciones que cubren la punta</span>
          <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: cubiertas === CIRCULACIONES ? P.ok : P.warn }}>
            {cubiertas}/{CIRCULACIONES}
          </span>
        </div>
        <div style={{ height: 5, background: P.sunken, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${(cubiertas / CIRCULACIONES) * 100}%`, height: "100%", background: cubiertas === CIRCULACIONES ? P.ok : P.warn }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setAsig({ ...asig, ...propuestaTaller(camp) })} style={{ ...ST.btn(false), fontFamily: "inherit" }}>
          Propuesta de taller
        </button>
        <button onClick={() => setAsig(initAsignacion())} style={{ ...ST.btn(false), fontFamily: "inherit", flex: 0.6 }}>
          Vaciar
        </button>
      </div>

      {asig.slots.map((par, i) => {
        const u0 = par[0] ? uni(par[0]) : null;
        const simple = esSimple(par[0]);
        const plazas = plazasSlot(par);
        const cubre = plazas >= demPunta;
        const lista = slotCompleto(par);
        return (
          <div key={i} style={{ ...ST.card, padding: 11, marginBottom: 8, borderColor: lista ? P.rule : P.warn }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <div style={{ width: 20, height: 22, background: ROJO, borderRadius: 3, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace, monospace", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Circulación {i + 1}</span>
              <span style={{ fontSize: 10.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>
                sale como {numeroTren({ offset: i * INTERVALO, retraso: 0 }, INICIO)}
              </span>
              {u0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: SERIE_COLOR[u0.serie], borderRadius: 3, padding: "1px 5px", fontFamily: "ui-monospace, monospace" }}>
                  {u0.serie} {simple ? "simple" : "doble"}
                </span>
              )}
              <span style={{ fontSize: 11.5, marginLeft: "auto", fontFamily: "ui-monospace, monospace", fontWeight: 600, color: plazas === 0 ? P.muted : cubre ? P.ok : P.warn }}>
                {nf(plazas)} pl.
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1].map((j) => {
                if (j === 1 && simple)
                  return (
                    <div key={j} style={{ flex: 1, border: `1px dashed ${P.rule}`, borderRadius: 8, padding: "8px 9px", fontSize: 11.5, color: P.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      composición simple
                    </div>
                  );
                const u = par[j] ? uni(par[j]) : null;
                return (
                  <button
                    key={j}
                    onClick={() => setSlotSel({ i, j })}
                    style={{ flex: 1, textAlign: "left", background: P.surface, border: `1px solid ${u ? P.rule : P.alert}`, borderRadius: 8, padding: "8px 9px", fontFamily: "inherit", cursor: "pointer", color: P.ink, minWidth: 0 }}
                  >
                    {u ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{u.id}</div>
                        <div style={{ display: "flex", gap: 6, fontSize: 10.5, color: P.muted, marginTop: 2 }}>
                          <span style={{ color: u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }}>{Math.round(u.fiab * 100)}%</span>
                          <span style={{ color: !cubreTurno(u) ? P.alert : turnosRestantes(u) < 2 ? P.warn : P.muted }}>{Math.round(u.desgaste)}% desg.</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12.5, color: P.muted, padding: "6px 0" }}>— asignar —</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ ...ST.eyebrow, margin: "18px 0 6px" }}>Material apartado</div>
      <div style={{ ...ST.card, padding: 12, marginBottom: 10, fontSize: 12.5, color: P.muted, lineHeight: 1.5 }}>
        Puedes dejar composiciones estacionadas en Príncipe Pío, Chamartín y Alcalá por si las necesitas durante el turno.
      </div>

      {APART_INICIAL.map((idx) => {
        const est = ESTACIONES[idx];
        const compartidas = (est.rotVias || []).filter((v) => est.apartVias.includes(v));
        const ocupadas = est.apartVias.filter((v) => (asig.apart[clave(idx, v)] || []).some(Boolean));
        const rotLibres = (est.rotVias || []).filter((v) => !ocupadas.includes(v)).length;
        return (
          <div key={idx} style={{ ...ST.card, padding: 11, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{est.n}</span>
              {est.apartSeries && <span style={{ fontSize: 10.5, color: P.muted }}>solo serie {est.apartSeries.join("/")}</span>}
              {compartidas.length > 0 && (
                <span style={{ fontSize: 10.5, marginLeft: "auto", color: rotLibres ? P.muted : P.alert, fontWeight: rotLibres ? 400 : 700 }}>
                  {rotLibres} vía(s) libres para invertir
                </span>
              )}
            </div>
            {est.apartVias.map((via) => {
              const par = asig.apart[clave(idx, via)] || [null, null];
              const simple = esSimple(par[0]);
              return (
                <div key={via} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: P.muted, width: 46, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>{via}</span>
                  {[0, 1].map((j) => {
                    if (j === 1 && simple)
                      return <div key={j} style={{ flex: 1, border: `1px dashed ${P.rule}`, borderRadius: 8, padding: "7px 9px", fontSize: 11, color: P.muted, textAlign: "center" }}>simple</div>;
                    const u = par[j] ? uni(par[j]) : null;
                    return (
                      <button
                        key={j}
                        onClick={() => setSlotSel({ apart: clave(idx, via), j, series: est.apartSeries })}
                        style={{ flex: 1, textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 8, padding: "7px 9px", fontFamily: "ui-monospace, monospace", fontSize: 12, cursor: "pointer", color: u ? P.ink : P.muted }}
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
        style={{ ...ST.btn(completo), width: "100%", padding: "14px 0", fontSize: 15, fontFamily: "inherit", opacity: completo ? 1 : 0.45, cursor: completo ? "pointer" : "not-allowed" }}
      >
        {completo ? "Abrir el turno" : `Faltan ${CIRCULACIONES - listas} circulaciones por cubrir`}
      </button>

      {slotSel && (
        <SelectorUnidad
          camp={camp}
          usadas={usadas}
          actual={(slotSel.apart ? asig.apart[slotSel.apart] : asig.slots[slotSel.i])[slotSel.j]}
          pareja={(slotSel.apart ? asig.apart[slotSel.apart] : asig.slots[slotSel.i])[slotSel.j === 0 ? 1 : 0]}
          primera={slotSel.j === 0}
          soloSeries={slotSel.series}
          close={() => setSlotSel(null)}
          elegir={(id) => {
            if (slotSel.apart) {
              const apart = { ...asig.apart };
              const par = [...(apart[slotSel.apart] || [null, null])];
              const quita = par[slotSel.j] === id;
              par[slotSel.j] = quita ? null : id;
              if (!quita && slotSel.j === 0 && esSimple(id)) par[1] = null;
              apart[slotSel.apart] = par;
              setAsig({ ...asig, apart });
            } else {
              const slots = asig.slots.map((x) => [...x]);
              const quita = slots[slotSel.i][slotSel.j] === id;
              slots[slotSel.i][slotSel.j] = quita ? null : id;
              if (!quita && slotSel.j === 0 && esSimple(id)) slots[slotSel.i][1] = null;
              setAsig({ ...asig, slots });
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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "80vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={{ ...ST.eyebrow, marginBottom: 9 }}>Material disponible</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {series.map((s) => {
            const bloqueada = serieObligada && serieObligada !== s;
            return (
              <button
                key={s}
                disabled={bloqueada}
                onClick={() => cambiarSerie(s)}
                style={{
                  flex: 1,
                  background: serie === s ? P.ink : P.surface,
                  color: serie === s ? "#fff" : P.ink,
                  border: `1px solid ${serie === s ? P.ink : P.rule}`,
                  borderRadius: 8,
                  padding: "8px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, monospace",
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
          <div style={{ fontSize: 11.5, color: P.muted, marginBottom: 10 }}>
            La composición ya lleva una {serieObligada}: no se pueden acoplar series distintas.
          </div>
        )}
        {!serieObligada && serie === "450" && (
          <div style={{ fontSize: 11.5, color: P.muted, marginBottom: 10 }}>
            Doble piso en composición simple: una sola rama cubre la circulación entera.
          </div>
        )}

        {deps.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
            {(deps.length > 1 ? ["todos", ...deps] : deps).map((d) => (
              <button
                key={d}
                onClick={() => setDep(d)}
                style={{
                  background: dep === d ? P.ink : P.surface,
                  color: dep === d ? "#fff" : P.ink,
                  border: `1px solid ${dep === d ? P.ink : P.rule}`,
                  borderRadius: 20,
                  padding: "5px 11px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {d === "todos" ? "Todos" : d}
                {d !== "todos" && (
                  <span style={{ opacity: 0.65, marginLeft: 5, fontFamily: "ui-monospace, monospace" }}>
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
                background: sel ? P.ink : P.surface,
                color: sel ? "#fff" : P.ink,
                border: `1px solid ${P.rule}`,
                borderRadius: 9,
                padding: "10px 12px",
                marginBottom: 6,
                fontFamily: "inherit",
                cursor: bloqueada ? "not-allowed" : "pointer",
                opacity: bloqueada ? 0.42 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{u.id}</span>
                {u.deposito && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: DEPOSITOS[u.deposito].color, borderRadius: 3, padding: "1px 5px" }}>{u.deposito}</span>
                )}
                {DEPOSITOS[u.deposito].nota && !u.enTaller && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: sel ? "#fff" : P.muted, border: `1px solid ${P.rule}`, borderRadius: 3, padding: "0 4px" }}>CEDIDA</span>
                )}
                {u.reformada && <span style={{ fontSize: 9, fontWeight: 700, color: sel ? "#fff" : P.muted, border: `1px solid ${P.rule}`, borderRadius: 3, padding: "0 4px" }}>REFORMADA</span>}
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: sel ? "#fff" : u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }}>
                  {Math.round(u.fiab * 100)}%
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: sel ? "#C7CDD2" : P.muted, marginTop: 3 }}>
                {u.enTaller
                  ? "En taller · no disponible"
                  : usadas.has(u.id) && !sel
                  ? "Ya asignada a otra circulación"
                  : `${u.lote} · desgaste ${Math.round(u.desgaste)} % · fiab. ${Math.round(u.fiab * 100)} %${cubreTurno(u) ? "" : " · no cubre el turno"}`}
              </div>
            </button>
          );
        })}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ── trenes ─────────────────────────────────────────────────── */

function Trenes({ g, setRotarDe, setTrenSel, setVolverA, setApartarDe, setSuprimirDe, setReponerDe, setApartaderoDe, setUnidadSel }) {
  return (
    <div>
      {g.trenes.map((t) => {
        const s = situacion(t, g.reloj);
        const m = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
        const supr = t.estado === "suprimido";
        const borde = supr ? P.rule : t.retenido || t.excesoAutorizado ? P.alert : t.detenido || t.esperaCab || t.retraso > 8 ? P.warn : P.rule;

        const txt = t.vacio && !supr
          ? `En vacío hacia ${t.supresion ? ESTACIONES[t.supresion.idx].corto : "la primera vía libre"}`
          : supr
          ? t.reponer
            ? `Repone en ${ESTACIONES[t.reponer.idx].corto} a las ${hhmm(t.reponer.cuando)}`
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
          : describir(s);
        return (
          <div key={t.i} style={{ ...ST.card, borderColor: borde, padding: 12, marginBottom: 8, opacity: supr ? 0.5 : 1 }}>
            <div onClick={() => { setVolverA(null); setTrenSel(t.i); }} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
              <div style={{ width: 20, height: 24, background: supr || t.rotando || t.detenido || t.esperaCab ? P.muted : t.esVacio ? P.ink : ROJO, clipPath: supr || t.rotando || t.detenido || t.esperaCab ? "none" : s.dir === "pio" ? CLIP_SUBE : CLIP_BAJA, borderRadius: 3, color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "ui-monospace, monospace", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: s.dir === "pio" ? 5 : 0, paddingBottom: s.dir === "pio" ? 0 : 5, flexShrink: 0 }}>
                {numCorto(t, g.reloj)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#fff",
                      background: t.esVacio ? P.ink : LIN[LINEA],
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontFamily: "ui-monospace, monospace",
                      flexShrink: 0,
                    }}
                  >
                    {t.esVacio ? "MV" : LINEA}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "ui-monospace, monospace", letterSpacing: -0.3 }}>{numeroTren(t, g.reloj)}</span>
                  <span style={{ fontSize: 10.5, color: P.muted, letterSpacing: 0.4 }}>{t.esVacio ? "material vacío" : `circ. ${t.i}`}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{txt}</div>
                <div style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>
                  {t.unidades.length === 0 && "sin material"}
                  {t.unidades.map((u, k) => (
                    <span key={u.id}>
                      {k > 0 && " + "}
                      <span
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setUnidadSel(u.id);
                        }}
                        style={{ cursor: "pointer", borderBottom: `1px dotted ${P.rule}`, color: P.ink }}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <div style={{ flex: 1, height: 4, background: P.sunken, borderRadius: 2, overflow: "hidden", maxWidth: 110 }}>
                        <div style={{ width: `${oc}%`, height: "100%", background: oc > 92 ? P.alert : oc > 70 ? P.warn : P.ok }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>
                        {nf(ab)}/{nf(cap)}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 700, color: colRetraso(retrasoEfectivo(t)), flexShrink: 0 }}>
                {supr ? "—" : rt(t.retraso) === 0 ? "0′" : `+${rt(t.retraso)}′`}
              </div>
            </div>

            {(t.rotacion || t.limitacion > 0 || t.retirarCab || t.cambio || t.apartaPaso || t.supresion || t.vacio || t.pendienteApartar || t.bloqueadoPor) && (
              <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
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
                {t.bloqueadoPor && <Etiqueta txt={`Detrás del ${numeroTren(g.trenes.find((x) => x.i === t.bloqueadoPor), g.reloj)}`} c={P.alert} />}
                {t.retirarCab && <Etiqueta txt="Retirada en cabecera" c={P.alert} />}
              </div>
            )}

            {!supr && m && (
              <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${P.sunken}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                    {m.nombre}
                    <Media m={m} />
                  </div>
                  <div style={{ fontSize: 11.5, color: t.excesoAutorizado ? P.alert : P.muted }}>
                    {t.excesoAutorizado ? "Conduciendo por encima del límite" : t.relevo ? `Relevo ${hhmm(t.relevo.prevista)} · ${t.relevo.cab}` : "Sin relevo en el turno"}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>{dur(m.cond)}</div>
                  <div style={{ width: 56, height: 4, background: P.sunken, borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                    <div style={{ width: `${Math.min(100, (m.cond / COND_MAX) * 100)}%`, height: "100%", background: m.cond > COND_MAX * 0.92 ? P.alert : m.cond > COND_MAX * 0.75 ? P.warn : P.ok }} />
                  </div>
                </div>
              </div>
            )}

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
                  marginTop: 6,
                  background: P.surface,
                  color: t.supresion && t.supresion.via ? P.warn : P.alert,
                  border: `1px solid ${t.supresion && t.supresion.via ? P.warn : P.alert}`,
                  borderRadius: 7,
                  padding: "8px 0",
                  fontFamily: "inherit",
                  fontSize: 12,
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
                style={{ width: "100%", marginTop: 9, background: P.surface, color: t.reponer ? P.muted : P.ok, border: `1px solid ${t.reponer ? P.sunken : P.ok}`, borderRadius: 7, padding: "9px 0", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: t.reponer ? "default" : "pointer" }}
              >
                {t.reponer ? `Repone a las ${hhmm(t.reponer.cuando)} en ${ESTACIONES[t.reponer.idx].corto}` : "Reponer circulación"}
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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "78vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Rotación del {numeroTren(t, g.reloj)}</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>{retTxt(retrasoEfectivo(t))} hacia {destino}</div>
        <div style={{ fontSize: 13, color: P.muted, marginBottom: 14, lineHeight: 1.45 }}>
          Termina recorrido antes de la cabecera e invierte allí para que la vuelta salga en hora, tomando el número de tren que corresponda. Solo en
          estaciones con cambio de agujas y con al menos {MIN_ANTELACION} min de antelación, que es lo que se tarda en preparar el itinerario. Si el
          ahorro supera al retraso, el tren espera en andén hasta la hora de su nueva marcha.
        </div>
        {cands.length === 0 && (
          <div style={{ fontSize: 13, color: P.alert, background: P.sunken, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            No hay estaciones con cambio de agujas por delante en este momento.
          </div>
        )}
        {cands.length > 0 && (
          <div style={{ fontSize: 11.5, color: P.muted, background: P.sunken, borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.45 }}>
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
            style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${!c.tarde && c.gana > 0 ? P.rule : P.sunken}`, borderRadius: 9, padding: "11px 12px", marginBottom: 6, fontFamily: "inherit", cursor: c.tarde ? "not-allowed" : "pointer", color: P.ink, opacity: c.tarde ? 0.4 : c.gana > 0 ? 1 : 0.6 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.tarde ? P.alert : c.gana > 0 ? P.ok : P.muted, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>
                {c.tarde ? "sin margen" : c.gana > 0 ? `gana ${c.gana}′` : "sin ganancia"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>
              paso en {c.eta} min ·{" "}
              <span style={{ color: c.espera > 30 ? P.alert : c.espera > 15 ? P.warn : P.muted, fontWeight: c.espera > 15 ? 700 : 400 }}>
                {c.espera} min de maniobra
              </span>{" "}
              · reanuda <span style={{ color: c.trasRotar > 0 ? P.warn : P.ok, fontWeight: 600 }}>{retTxt(c.trasRotar)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, marginTop: 1 }}>
              deja {c.sinServicio} estación{c.sinServicio !== 1 ? "es" : ""} sin servicio hasta {c.cabecera}
            </div>
          </button>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink, marginTop: 4 }}>
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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 62 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "78vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Adelantamiento</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>
          Apartar el {numeroTren(t, g.reloj)}
        </div>
        <div style={{ fontSize: 13, color: P.muted, marginBottom: 14, lineHeight: 1.45 }}>
          {v.detras
            ? `El ${numeroTren(v.detras, g.reloj)} viene ${Math.round(v.dDetras)} min por detrás${
                v.dDetras > 12 ? " y de momento no le alcanza" : " y no puede adelantar en vía"
              }. Apartando este tren a una vía desviada, el de atrás pasa por la general.`
            : "Ahora mismo no hay ningún tren por detrás en este sentido: apartarse solo serviría para perder tiempo."}
        </div>
        {ests.length === 0 && (
          <div style={{ fontSize: 13, color: P.alert, background: P.sunken, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
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
            style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 9, padding: "11px 12px", marginBottom: 6, fontFamily: "inherit", cursor: "pointer", color: P.ink }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{e.nombre}</span>
              <span style={{ fontSize: 12.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>llega en {e.eta} min</span>
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>
              {e.libres.length > 1 ? `${e.libres.length} vías libres: ${e.libres.join(", ")}` : e.via} · +2 min de entrada y +2 de salida, más la espera
              hasta que pase el de atrás
            </div>
          </button>
        ))}
        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink, marginTop: 4 }}>
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
  const nom = (e) => g.personal.filter((m) => m.tipo === "nominal" && m.estado === e);
  const res = (cab) => g.personal.filter((m) => m.tipo === "reserva" && m.estado === "reserva" && m.lugar === cab);
  const grupos = [
    ["Conduciendo", g.personal.filter((m) => m.estado === "conduciendo")],
    ["Nominales pendientes de entrar", nom("entrante")],
    [`Reserva en ${CHAMARTIN}`, res(CHAMARTIN)],
    [`Reserva en ${ALCALA}`, res(ALCALA)],
    [`Reserva en ${PIO}`, res(PIO)],
    // maquinistas que van de viajero a hacerse cargo de material apartado
    ["De viajero hacia el material", g.personal.filter((m) => m.estado === "enViaje")],
    ["Agente acompañante", g.personal.filter((m) => m.estado === "acompanante")],
    ["En maniobras", g.personal.filter((m) => m.estado === "maniobras")],
    ["En descanso", g.personal.filter((m) => m.estado === "descanso")],
    ["Jornada finalizada", g.personal.filter((m) => m.estado === "fin")],
  ];
  return (
    <div>
      <div style={{ ...ST.card, padding: "9px 11px", marginBottom: 12, fontSize: 12, color: P.muted, lineHeight: 1.45 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => verInfo("relevos")}
            style={{
              background: info === "relevos" ? P.ink : P.surface,
              color: info === "relevos" ? "#fff" : P.ink,
              border: `1px solid ${info === "relevos" ? P.ink : P.rule}`,
              borderRadius: "50%",
              width: 24,
              height: 24,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Archivo', system-ui, sans-serif",
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Cómo funcionan los relevos"
          >
            i
          </button>
          <span style={{ fontSize: 11.5 }}>Relevos y jornada</span>
        </div>

        {info === "relevos" && (
          <div style={{ marginTop: 8, background: P.sunken, borderRadius: 8, padding: "10px 12px", lineHeight: 1.5 }}>
            La mayor parte de los maquinistas son de la cabecera de <strong style={{ color: P.ink }}>Chamartín</strong> y ahí se realizan prácticamente
            todos los relevos. Sin embargo, también habrá relevos de forma puntual en las cabeceras de Alcalá y Príncipe Pío.
            <div style={{ marginTop: 8 }}>
              <strong style={{ color: P.alert }}>IMPORTANTE:</strong> la jornada de conducción continuada no puede superar por reglamento las 5 horas y
              30 minutos. Si se realiza un descanso de 45 minutos, se puede alargar hasta las 9 horas de conducción.
            </div>
          </div>
        )}

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${P.sunken}`, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {Object.keys(INFO_ATRIB).map((k) => (
            <button
              key={k}
              onClick={() => verInfo(k)}
              style={{
                background: info === k ? P.ink : P.surface,
                color: info === k ? "#fff" : P.ink,
                border: `1px solid ${info === k ? P.ink : P.rule}`,
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
                cursor: "pointer",
              }}
            >
              {INFO_ATRIB[k].k}
            </button>
          ))}
          <button
            onClick={() => verInfo("todos")}
            style={{
              background: info === "todos" ? P.ink : P.surface,
              color: info === "todos" ? "#fff" : P.ink,
              border: `1px solid ${info === "todos" ? P.ink : P.rule}`,
              borderRadius: "50%",
              width: 24,
              height: 24,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              lineHeight: 1,
            }}
            title="Qué significa cada atributo"
          >
            i
          </button>
          <span style={{ fontSize: 11 }}>La pastilla junto al nombre es la media de los tres.</span>
        </div>
        {/* solo se pintan claves de atributo: "relevos" tiene su propio panel */}
        {(info === "todos" || INFO_ATRIB[info]) && (
          <div style={{ marginTop: 8, background: P.sunken, borderRadius: 8, padding: "9px 11px" }}>
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
          <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: P.muted, fontWeight: 700, marginBottom: 6 }}>
            {titulo} · {lista.length}
          </div>
          {lista.length === 0 && <div style={{ fontSize: 12.5, color: P.muted, paddingLeft: 2 }}>—</div>}
          {lista.map((m) => (
            <div key={m.id} style={{ ...ST.card, padding: "9px 11px", marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  {m.nombre}
                  <Media m={m} />
                  {m.baja && <span style={{ color: P.alert, fontSize: 11 }}>indispuesto</span>}
                </span>
                <span style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>
                  {m.estado === "conduciendo" || m.estado === "acompanante"
                    ? `circ. ${m.tren}`
                    : m.estado === "descanso"
                    ? `${m.descanso} min`
                    : m.estado === "entrante"
                    ? `${hhmm(m.entra)} · ${m.lugar}`
                    : ""}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
                <div style={{ flex: 1, height: 4, background: P.sunken, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (m.jornada / JORNADA_MAX) * 100)}%`, height: "100%", background: m.jornada > JORNADA_MAX * 0.85 ? P.alert : m.jornada > JORNADA_MAX * 0.6 ? P.warn : P.ok }} />
                </div>
                <span style={{ fontSize: 11, color: P.muted, fontFamily: "ui-monospace, monospace" }}>{dur(m.jornada)}</span>
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


function Mapa({ g, detalle, setDetalle, setEstSel, setTrenSel, setVolverA }) {
  const ALTO = detalle ? 50 : 30;
  const BANDA = 30;
  const GUT = 82; // canalón de vía: deja sitio al punto de retraso
  const VIA_A = 24;
  const VIA_B = 44;

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
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 11, flex: 1, fontSize: 11, color: P.muted, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 16, height: 9, border: `2.5px solid ${ROJO}`, borderRadius: 5, display: "inline-block", background: P.surface }} /> estación
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 3, background: ROJO, borderRadius: 1, display: "inline-block" }} /> apeadero
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 13, background: ROJO, clipPath: CLIP_BAJA, display: "inline-block" }} /> Alcalá
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 13, background: ROJO, clipPath: CLIP_SUBE, display: "inline-block" }} /> P. Pío
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>⇄ vía desviada</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 4, height: 12, background: `repeating-linear-gradient(180deg, ${P.surface} 0 3px, ${P.warn} 3px 6px)`, display: "inline-block" }} /> vía única
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.ok, display: "inline-block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.warn, display: "inline-block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.alert, display: "inline-block" }} /> retraso
          </span>
        </div>
        <button onClick={() => setDetalle(!detalle)} style={{ background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 7, padding: "6px 10px", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, color: P.ink, cursor: "pointer", flexShrink: 0 }}>
          {detalle ? "Ocultar correspondencias" : "Mostrar correspondencias"}
        </button>
      </div>

      <div style={{ ...ST.card, position: "relative", height: H, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 12, top: ys[9], width: 56, height: ys[12] - ys[9], background: P.sunken, borderRadius: 6 }} />
        {[VIA_A, VIA_B].map((x) => (
          <div key={x} style={{ position: "absolute", left: x, top: ys[0], width: 3.5, height: ys[N - 1] - ys[0], background: ROJO, borderRadius: 2 }} />
        ))}

        {/* tramos en vía única: la vía cortada se dibuja interrumpida */}
        {tramosUnicos(g).map((rest, k) => {
          const x = rest.dir === "alcala" ? VIA_A : VIA_B;
          return (
            <div
              key={`vu${k}`}
              style={{
                position: "absolute",
                left: x - 1,
                top: ys[rest.tramo.a],
                width: 5.5,
                height: ys[rest.tramo.b] - ys[rest.tramo.a],
                background: `repeating-linear-gradient(180deg, ${P.surface} 0 5px, ${P.warn} 5px 9px)`,
                borderRadius: 2,
              }}
            />
          );
        })}

        {bandas.map((b) => (
          <div key={b.n} style={{ position: "absolute", left: GUT, top: b.y, right: 0, height: BANDA, paddingRight: 12, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, width: "100%" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{b.n}</span>
              <span style={{ height: 1, background: P.rule, flex: 1 }} />
              <span style={{ fontSize: 9.5, color: P.muted, whiteSpace: "nowrap" }}>{b.d}</span>
            </div>
          </div>
        ))}

        {ESTACIONES.map((e, i) => {
          const grande = !!e.cab || !!e.term;
          const ap = e.tipo === "ap";
          const w = ap ? 26 : grande ? 38 : 32;
          const hh = ap ? 4 : grande ? 16 : 13;
          const bw = grande ? 4 : 3;
          const cx = (VIA_A + VIA_B) / 2 + 1.75;
          const libres = e.cab ? reservasEn(g, e.cab).length : 0;
          const rest = g.restricciones.find((x) => x.idx === i);
          const col = rest ? P.warn : ROJO;
          return (
            <div key={e.n}>
              <div style={{ position: "absolute", left: cx - w / 2, top: ys[i] - hh / 2, width: w, height: hh, background: ap ? col : P.surface, border: ap ? "none" : `${bw}px solid ${col}`, borderRadius: ap ? 2 : 9, boxSizing: "border-box" }} />
              <button
                onClick={() => setEstSel(i)}
                style={{ all: "unset", cursor: "pointer", position: "absolute", left: GUT, top: ys[i] - ALTO / 2, height: ALTO, right: 0, paddingRight: 12, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, boxSizing: "border-box" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      // mismo cuerpo y peso que el resto; solo cambia el color,
                      // para distinguir las que no prestan servicio comercial
                      fontSize: grande ? 13.5 : ap ? 12.5 : 13,
                      fontWeight: grande ? 700 : ap ? 400 : 600,
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
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: P.warn, borderRadius: 3, padding: "1px 5px", flexShrink: 0, fontFamily: "ui-monospace, monospace" }}>
                      +{rest.m}′{rest.dir === "alcala" ? " ▼" : rest.dir === "pio" ? " ▲" : ""}
                    </span>
                  )}
                  {e.rot && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: P.muted, border: `1px solid ${P.rule}`, borderRadius: 3, padding: "0 4px", flexShrink: 0 }} title="tiene vía desviada: permite rotar o apartar">
                      ⇄
                    </span>
                  )}
                  {e.cab && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: libres ? P.ink : P.alert, borderRadius: 3, padding: "1px 5px", fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>●{libres}</span>
                  )}
                </div>
                {detalle && (
                  <div style={{ display: "flex", gap: 3, whiteSpace: "nowrap", overflow: "hidden" }}>
                    {e.c.map((l) => <Enlace key={l} txt={l} bg={LIN[l]} />)}
                    {e.metro && <Enlace txt="M" bg={METRO} />}
                    {e.ml && <Enlace txt="ML" bg={ML} />}
                    {(g.apartado[i] || []).length > 0 && <Enlace txt={`APART ×${g.apartado[i].length}`} bg={P.ink} />}
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
                left: maniobrando ? (VIA_A + VIA_B) / 2 - 6 : enViaBaja ? VIA_A - 6.5 : VIA_B - 6.5,
                width: 18,
                height: 22,
                // el material en vacío se distingue en negro
                background: maniobrando || quieto ? P.muted : t.esVacio ? P.ink : ROJO,
                clipPath: maniobrando ? "none" : baja ? CLIP_BAJA : CLIP_SUBE,
                borderRadius: maniobrando ? 4 : 3,
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: !maniobrando && baja ? 5 : 0,
                paddingTop: !maniobrando && !baja ? 5 : 0,
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))",
                transition: "top .12s linear",
                zIndex: 3,
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
          const xTren = maniobrando ? (VIA_A + VIA_B) / 2 - 6 : enViaBaja ? VIA_A - 6.5 : VIA_B - 6.5;
          // sentido Alcalá a la izquierda de la flecha; sentido Pío a la derecha
          const x = enViaBaja ? xTren - 12 : xTren + 19;
          // la punta de la flecha desplaza el número 2,5 px: el círculo se
          // alinea con el número, no con el centro del marcador
          const dy = maniobrando ? 0 : baja ? -2.5 : 2.5;
          return (
            <div
              key={`r${t.i}`}
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
                border: "1.5px solid #fff",
                boxSizing: "content-box",
                cursor: "pointer",
                transition: "top .12s linear",
                zIndex: 4,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PerfilEstacion({ g, i, close, verTren, moverVacio }) {
  const e = ESTACIONES[i];
  const apartado = g.apartado[i] || [];
  const libres = viasLibres(g, i);
  const reservas = e.cab ? reservasEn(g, e.cab) : [];
  const nominales = e.cab ? g.personal.filter((m) => m.tipo === "nominal" && m.estado === "entrante" && m.lugar === e.cab) : [];
  const rest = g.restricciones.find((x) => x.idx === i);
  const sentidos = [
    ["hacia Alcalá de Henares", pasoPorEstacion(g, i, "alcala"), "alcala"],
    ["hacia Príncipe Pío", pasoPorEstacion(g, i, "pio"), "pio"],
  ];

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 65 }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "84vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span style={{ ...ST.eyebrow }}>{e.puesto ? "Estación sin servicio comercial" : e.tipo === "est" ? "Estación" : "Apeadero"}</span>
          {e.rot && <span style={{ fontSize: 9, fontWeight: 700, color: P.muted, border: `1px solid ${P.rule}`, borderRadius: 3, padding: "0 4px" }}>⇄ posibilidad de rotación</span>}
        </div>
        <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>{e.n}</div>
        <div style={{ display: "flex", gap: 3, margin: "7px 0 14px", flexWrap: "wrap" }}>
          <Enlace txt={LINEA} bg={LIN[LINEA]} />
          {e.c.map((l) => <Enlace key={l} txt={l} bg={LIN[l]} />)}
          {e.metro && <Enlace txt="M" bg={METRO} />}
          {e.ml && <Enlace txt="ML" bg={ML} />}
        </div>

        {rest && (
          <div style={{ background: P.sunken, border: `1px solid ${P.warn}`, borderRadius: 9, padding: "9px 11px", marginBottom: 14, fontSize: 12.5, lineHeight: 1.45 }}>
            <strong>{rest.txt}</strong> · hasta las {hhmm(rest.hasta)}
            {rest.tramo && (
              <div style={{ marginTop: 3 }}>
                Vía única entre <strong>{ESTACIONES[rest.tramo.a].n}</strong> y <strong>{ESTACIONES[rest.tramo.b].n}</strong>. Los trenes de sentido{" "}
                {rest.dir === "alcala" ? "Alcalá" : "Príncipe Pío"} circulan por la contraria y se cruzan en esas estaciones.
              </div>
            )}
          </div>
        )}

        {/* viajeros */}
        {!e.puesto && <Bloque titulo="Viajeros en andén">
          {sentidos.map(([nom, paso, dir], k) => {
            const n = g.andenes[i][dir];
            const bloqueado = (dir === "alcala" && i === N - 1) || (dir === "pio" && i === 0);
            if (bloqueado) return null;
            return (
              <div key={nom} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <Enlace txt={LINEA} bg={LIN[LINEA]} />
                    <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom}</span>
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: n > 400 ? P.alert : n > 180 ? P.warn : P.ink, flexShrink: 0 }}>
                    {nf(n)}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2, fontFamily: "ui-monospace, monospace" }}>
                  último tren hace {Math.round(paso.desde)} min · próximo en {Math.round(paso.hasta)} min
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${P.sunken}`, paddingTop: 8, marginTop: 4, fontSize: 11.5, color: P.muted, lineHeight: 1.4 }}>
            Escala de afluencia {e.esc}/5 · llegan {(VIAJEROS_MIN_100 * intensidad(g.reloj) * pesoOrigen(i, marea(g.reloj)) / ESTACIONES.reduce((n2, _, j) => n2 + pesoOrigen(j, marea(g.reloj)), 0)).toFixed(1)} viajeros por minuto
          </div>
        </Bloque>}

        {/* material */}
        {viasGenerales(i) && (
          <Bloque titulo="Vías generales">
            {viasGenerales(i).map((v, k) => {
              const prox = proximoPaso(g, i, v.dir);
              return (
                <div key={v.via} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{v.via}</span>
                      <span style={{ fontSize: 11, color: P.muted, marginLeft: 7, whiteSpace: "nowrap" }}>
                        {v.paridad} · hacia {v.sentido}
                      </span>
                    </span>
                    {prox && (
                      <FilaVia
                        g={g}
                        tren={prox.t}
                        txt={`pasa en ${Math.round(prox.eta)} min`}
                        col={prox.eta <= 3 ? P.ok : P.muted}
                        fondo={ROJO}
                        onClick={() => verTren(prox.t.i)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </Bloque>
        )}

        {e.rotVias && (
        <Bloque titulo={e.paso ? "Vías de paso e inversión" : "Vías desviadas"}>
          {
            estadoViasRot(g, i).map((v, k) => (
              <div key={v.via} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ minWidth: 52, flexShrink: 0 }}>
                    <span style={{ fontSize: 12.5, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{v.via}</span>
                    {v.pasoDir && (
                      <span style={{ fontSize: 10, color: P.muted, display: "block" }}>
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
                      fondo={ROJO}
                      onClick={() => verTren(v.pasoTren.t.i)}
                    />
                  ) : v.tipo === "tren" ? (
                    <FilaVia g={g} tren={v.tren} txt={`sale en ${v.sale} min`} col={P.ok} fondo={ROJO} onClick={() => verTren(v.tren.i)} />
                  ) : v.tipo === "material" ? (
                    <span style={{ fontSize: 12, color: P.warn, fontWeight: 600 }}>material apartado</span>
                  ) : (
                    <span style={{ fontSize: 12, color: P.ok, fontWeight: 600 }}>libre</span>
                  )}
                </div>
                {v.prox && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 5, paddingLeft: 52 }}>
                    <span style={{ fontSize: 11, color: P.muted, flexShrink: 0 }}>siguiente</span>
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
                    <div key={d} style={{ background: fondoFila(e.rotVias.length), padding: "8px 10px", margin: "0 -12px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ minWidth: 52, flexShrink: 0 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700 }}>{d === "pio" ? "impares" : "pares"}</span>
                        <span style={{ fontSize: 10, color: P.muted, display: "block" }}>vía s/n</span>
                      </span>
                      <FilaVia g={g} tren={prox.t} txt={`pasa en ${Math.round(prox.eta)} min`} col={prox.eta <= 3 ? P.ok : P.muted} fondo={ROJO} onClick={() => verTren(prox.t.i)} />
                    </div>
                  ) : null;
                })}
              <div style={{ fontSize: 11, color: P.muted, marginTop: 8, lineHeight: 1.4 }}>
                Por estas vías los trenes circulan con carácter normal. Las indicadas son las habituales, pero cualquiera de la{" "}
                {e.rotVias[0].replace("vía ", "")} a la {e.rotVias[e.rotVias.length - 1].replace("vía ", "")} puede emplearse según las necesidades de
                la circulación.
              </div>
            </>
          )}
          {(e.rotDir || (e.apartVias || []).some((v) => e.rotVias.includes(v))) && (
            <div style={{ fontSize: 11, color: P.muted, marginTop: 7, lineHeight: 1.4 }}>
              {e.rotDir ? `Solo se invierte en sentido ${e.rotDir === "pio" ? "Príncipe Pío" : "Alcalá"}. ` : ""}
              {(e.apartVias || []).some((v) => e.rotVias.includes(v)) ? "Vías compartidas con el apartadero." : ""}
            </div>
          )}
        </Bloque>
        )}

        {e.apartVias && (
        <Bloque titulo="Apartadero">
          {(
            <>
              {apartado.map((x, k) => (
                <div key={k} style={{ background: fondoFila(k), padding: "8px 10px", margin: "0 -12px", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{x.unidades.map((u) => u.id).join(" + ")}</span>
                    <span style={{ fontSize: 12, color: P.muted }}>{x.via}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: x.averiado ? P.alert : P.muted, marginTop: 2 }}>
                    {x.averiado ? "Averiado · fuera de servicio hasta reparación" : `${nf(x.unidades.reduce((n, u) => n + u.plazas, 0))} plazas · disponible`} ·
                    desde las {hhmm(x.desde)}
                  </div>
                  {/* llevar el material a otro sitio con una marcha en vacío */}
                  <button
                    onClick={() => moverVacio(x.via)}
                    style={{ width: "100%", marginTop: 7, background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 6, padding: "6px 0", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    Mover en vacío
                  </button>
                </div>
              ))}
              {apartado.length === 0 && <div style={{ fontSize: 12.5, color: P.muted, marginBottom: 6 }}>Sin material apartado.</div>}
              <div style={{ borderTop: `1px solid ${P.sunken}`, paddingTop: 8, marginTop: 4, fontSize: 12.5 }}>
                <span style={{ color: P.muted }}>{e.apartSeries ? `Solo serie ${e.apartSeries.join("/")} · ` : ""}Vías libres: </span>
                {libres.length ? (
                  <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{libres.join(", ")}</span>
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
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k), gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {m.nombre}
                  <Media m={m} />
                </span>
                <span style={{ color: P.muted, fontFamily: "ui-monospace, monospace" }}>margen {dur(margenDe(m))}</span>
              </div>
            ))}
            {nominales.map((m, k) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k + reservas.length), color: P.muted }}>
                <span>{m.nombre}</span>
                <span style={{ fontFamily: "ui-monospace, monospace" }}>entra {hhmm(m.entra)}</span>
              </div>
            ))}
          </Bloque>
        )}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink, marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ── barra superior fija ────────────────────────────────────────
   Aparece al perder de vista la cabecera. Debe caber en un móvil,
   así que va en dos filas muy compactas.                          */

const TABS = [
  { k: "trenes", l: "Trenes" },
  { k: "personal", l: "Personal" },
  { k: "taller", l: "Taller" },
  { k: "mapa", l: "Mapa" },
  { k: "libro", l: "Libro" },
];

/* Los cinco iconos comparten lenguaje: silueta maciza de 13×13 con los
   detalles recortados en el color del fondo. Así pesan lo mismo y se leen
   igual sobre blanco que sobre el color de la línea.                      */
function Icono({ tipo, activo, fondo }) {
  const c = activo ? "#fff" : P.muted;
  const bg = fondo || P.surface;
  const caja = { display: "block", position: "relative", width: 13, height: 13 };

  if (tipo === "trenes")
    return (
      <span style={caja}>
        <span style={{ position: "absolute", left: 1, top: 0, width: 11, height: 13, background: c, borderRadius: "4px 4px 2px 2px" }} />
        <span style={{ position: "absolute", left: 3, top: 2.5, width: 7, height: 4, background: bg, borderRadius: 1 }} />
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
        <span key={y} style={{ position: "absolute", left: 3, top: y, width: n === 2 ? 4 : 7, height: 1.5, background: bg, borderRadius: 1 }} />
      ))}
    </span>
  );
}

// las tres pastillas de la barra comparten medidas para alinearse bien
const PASTILLA = {
  width: 52,
  height: 28,
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "ui-monospace, monospace",
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
        gap: 1,
        background: P.sunken,
        border: `1px solid ${P.rule}`,
        lineHeight: 1,
      }}
    >
      {/* misma tipografía que las etiquetas del Libro: la pastilla impone
          monoespaciada al valor, pero el rótulo va en la de la interfaz */}
      <span
        style={{
          fontSize: 8,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: P.muted,
          fontWeight: 600,
          fontFamily: "'Archivo', system-ui, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {k}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: c }}>{v}</span>
    </span>
  );
}

function BarraSuperior({ g, setG, tab, setTab }) {
  const [abierto, setAbierto] = useState(false);
  const activos = g.trenes.filter((t) => t.estado !== "suprimido");
  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const retrasoMedio = activos.length ? activos.reduce((n, t) => n + retrasoEfectivo(t), 0) / activos.length : 0;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: P.surface,
          borderBottom: `1px solid ${P.rule}`,
          boxShadow: "0 2px 10px rgba(10,14,17,.10)",
          padding: "7px 0 4px",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 5px" }}>
          <span style={{ ...PASTILLA, background: LIN[LINEA], color: "#fff", border: "none" }}>{LINEA}</span>

          <button
            onClick={() => setG((p) => ({ ...p, marcha: !p.marcha }))}
            style={{ ...PASTILLA, border: `1px solid ${P.rule}`, background: g.marcha ? P.surface : P.ink, color: g.marcha ? P.ink : "#fff", cursor: "pointer" }}
          >
            {g.marcha ? "❚❚" : "▶"}
          </button>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setAbierto(!abierto)}
              style={{ ...PASTILLA, border: `1px solid ${abierto ? P.ink : P.rule}`, background: abierto ? P.ink : P.surface, color: abierto ? "#fff" : P.ink, cursor: "pointer" }}
            >
              ×{g.vel} ▾
            </button>
            {abierto && (
              <div style={{ position: "absolute", top: 28, left: 0, background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 8, boxShadow: "0 4px 14px rgba(10,14,17,.16)", padding: 4, zIndex: 40 }}>
                {[1, 4, 10, 40].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setG((p) => ({ ...p, vel: v }));
                      setAbierto(false);
                    }}
                    style={{ display: "block", width: 52, border: "none", background: g.vel === v ? P.sunken : "transparent", color: g.vel === v ? P.ink : P.muted, borderRadius: 5, padding: "6px 0", fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", cursor: "pointer" }}
                  >
                    ×{v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <MiniKpi k="PUNT" v={`${punt.toFixed(0)}%`} c={punt >= 92 ? P.ok : punt >= 75 ? P.warn : P.alert} />
          <MiniKpi k="RETR" v={retrasoMedio < 0.05 ? "0′" : `+${retrasoMedio.toFixed(1)}′`} c={colRetrasoMedio(retrasoMedio)} />
          <MiniKpi k="CIRCUL" v={`${activos.length}/${CIRCULACIONES}`} c={activos.length === CIRCULACIONES ? P.ok : P.warn} />

          <span style={{ ...PASTILLA, width: "auto", padding: "0 8px", fontSize: 18, letterSpacing: -0.7 }}>{hhmm(g.reloj)}</span>
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 5, padding: "0 22px" }}>
          {TABS.map((x) => {
            const on = tab === x.k;
            return (
              <button
                key={x.k}
                onClick={() => setTab(x.k)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: "7px 7px 0 0",
                  background: on ? LIN[LINEA] : "transparent",
                  color: on ? "#fff" : P.muted,
                  padding: "5px 0 7px",
                  fontFamily: "inherit",
                  fontSize: 10.5,
                  fontWeight: on ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <span style={{ width: 14, height: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icono tipo={x.k} activo={on} fondo={on ? LIN[LINEA] : P.surface} />
                </span>
                <span style={{ textAlign: "center", width: "100%" }}>{x.l}</span>
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
const CABECERAS_REP = [IDX_PIO, IDX_CHAMARTIN, IDX_ALCALA];

// fases del ciclo en que una circulación pasa por esa cabecera
const fasesEn = (idx) => (idx === 0 ? [0] : idx === N - 1 ? [SALE_ALCALA] : [ESTACIONES[idx].t, LLEGA_PIO - ESTACIONES[idx].t]);

// próxima hora a la que la marcha de ese tren pasa por la cabecera
function proximaReposicion(t, idx, desde, hasta = null) {
  const tope = hasta === null ? FIN : hasta;
  let mejor = null;
  for (const q of fasesEn(idx))
    for (let k = -1; k < 10; k++) {
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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 65 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "84vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Material vacío</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>Dónde apartar el {numeroTren(t, g.reloj)}</div>
        <div style={{ fontSize: 12.5, color: P.muted, marginBottom: 12, lineHeight: 1.45 }}>
          {t.vacio
            ? "El tren circula sin viajeros con el bypass de puertas activado. "
            : "El tren queda fuera de servicio. "}
          Elige la estación y la vía donde quedará estacionado.
        </div>

        {t.supresion && (
          <div style={{ ...ST.card, padding: "10px 12px", marginBottom: 12, borderColor: P.warn }}>
            <div style={{ fontSize: 11, color: P.muted, marginBottom: 3 }}>
              {t.supresion.noche ? `Termina servicio a las ${hhmm(t.supresion.hora)} en` : "Destino previsto ahora"}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>
              {ESTACIONES[t.supresion.idx].n}
              {t.supresion.via ? ` · ${t.supresion.via}` : ""}
            </div>
          </div>
        )}

        {puntos.length === 0 && (
          <div style={{ fontSize: 13, color: P.alert, background: P.sunken, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            No hay ninguna vía de apartado libre por delante que admita esta serie.
          </div>
        )}

        {puntos.map((p2) => (
          <div key={p2.idx} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{p2.nombre}</span>
              <span style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>llega en {p2.eta} min</span>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {p2.vias.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setG((p3) => aplicar(clonar(p3), { destinoVacio: { i, idx: p2.idx, via: v } }));
                    close();
                  }}
                  style={{ background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", cursor: "pointer" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink, marginTop: 4 }}>
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
  const maq = g.personal.find((m) => m.id === orden.maqId);
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
        fin: null,
        desde: ESTACIONES[idx].n,
        hasta: aTaller ? `taller de ${dep}` : ESTACIONES[destino].n,
        dir,
        num: null,
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
    background: on ? P.ink : P.surface,
    color: on ? "#fff" : P.ink,
    border: `1px solid ${on ? P.ink : P.rule}`,
    borderRadius: 20,
    padding: "6px 12px",
    fontSize: 11.5,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    marginRight: 5,
    marginBottom: 5,
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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 66 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "86vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Material en vacío</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>{lote.unidades.map((u) => u.id).join(" + ")}</div>
        <div style={{ fontSize: 12.5, color: P.muted, marginBottom: 14, lineHeight: 1.45 }}>
          Apartado en {ESTACIONES[idx].n}, {via}. El maquinista irá de viajero en el primer tren que pase por su residencia y, una vez allí, sacará el
          material hasta donde le digas.
        </div>

        <div style={{ ...ST.eyebrow, marginBottom: 7 }}>Maquinista de reserva</div>
        {reservas.length === 0 && <div style={{ fontSize: 12.5, color: P.alert, marginBottom: 10 }}>No hay ningún maquinista de reserva libre.</div>}
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

        <div style={{ ...ST.eyebrow, marginBottom: 7 }}>Destino</div>
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
          style={{ width: "100%", background: maq && dest ? P.ink : P.sunken, color: maq && dest ? "#fff" : P.muted, border: "none", borderRadius: 9, padding: 13, fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: maq && dest ? "pointer" : "not-allowed", marginTop: 12 }}
        >
          Ordenar la marcha en vacío
        </button>
        <button onClick={close} style={{ width: "100%", background: "transparent", border: "none", color: P.muted, padding: "12px 0 0", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function SelectorReposicion({ g, setG, i, close }) {
  const t = g.trenes.find((x) => x.i === i);
  if (!t) return null;

  const puntos = CABECERAS_REP.map((idx) => {
    const cab = ESTACIONES[idx].cab || ESTACIONES[idx].n;
    return {
      idx,
      nombre: ESTACIONES[idx].n,
      cuando: proximaReposicion(t, idx, g.reloj),
      comps: composicionesDisponibles(g, idx),
      reservas: reservasEn(g, cab).length,
    };
  }).filter((p2) => p2.cuando !== null);

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 64 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "84vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Reposición</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>Circulación {t.i}</div>
        <div style={{ fontSize: 12.5, color: P.muted, marginBottom: 14, lineHeight: 1.45 }}>
          La marcha sigue existiendo: con material y maquinista vuelve al servicio cuando su horario pase de nuevo por una cabecera. Hacen falta{" "}
          {MARGEN_REPOSICION} min de preparación.
        </div>

        {puntos.length === 0 && (
          <div style={{ fontSize: 13, color: P.alert, background: P.sunken, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            Ya no quedan pasos por cabecera antes del final del turno.
          </div>
        )}

        {puntos.map((p2) => (
          <div key={p2.idx} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{p2.nombre}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: P.ink }}>{hhmm(p2.cuando)}</span>
              <span style={{ fontSize: 11, color: P.muted }}>en {Math.round(p2.cuando - g.reloj)} min</span>
            </div>

            {!p2.reservas && <div style={{ fontSize: 11.5, color: P.alert, marginBottom: 5 }}>Sin maquinista de reserva en esta cabecera.</div>}
            {p2.comps.length === 0 && <div style={{ fontSize: 11.5, color: P.muted }}>No hay material disponible aquí.</div>}

            {p2.comps.map((c) => (
              <button
                key={c.clave}
                disabled={!p2.reservas}
                onClick={() => {
                  setG((p3) => aplicar(clonar(p3), { reponer: { i, idx: p2.idx, clave: c.clave, cuando: p2.cuando } }));
                  close();
                }}
                style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 8, padding: "9px 11px", marginBottom: 5, fontFamily: "inherit", cursor: p2.reservas ? "pointer" : "not-allowed", opacity: p2.reservas ? 1 : 0.4, color: P.ink }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{c.unidades.map((u) => u.id).join(" + ")}</span>
                  <span style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>{nf(c.unidades.reduce((n, u) => n + u.plazas, 0))} pl</span>
                </div>
                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{c.origen}</div>
              </button>
            ))}
          </div>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink, marginTop: 4 }}>
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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 63 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "80vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Supresión</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: "3px 0 4px" }}>Suprimir el {numeroTren(t, g.reloj)}</div>
        <div style={{ fontSize: 12.5, color: P.muted, marginBottom: 14, lineHeight: 1.45 }}>
          El tren termina recorrido, los viajeros transbordan al siguiente y el material queda estacionado, listo para entrar en taller. Se pierde la
          circulación el resto del turno.
        </div>

        {ests.length === 0 && (
          <div style={{ fontSize: 13, color: P.alert, background: P.sunken, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
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
            style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 9, padding: "11px 12px", marginBottom: 6, fontFamily: "inherit", cursor: "pointer", color: P.ink }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{e.nombre}</span>
              <span style={{ fontSize: 12.5, color: P.muted, fontFamily: "ui-monospace, monospace" }}>llega en {e.eta} min</span>
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>
              {e.via} · deja {e.sinServicio} estación{e.sinServicio !== 1 ? "es" : ""} sin esta circulación
              {aBordo > 1 ? ` · ${nf(aBordo)} viajeros a bordo ahora` : ""}
            </div>
          </button>
        ))}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink, marginTop: 4 }}>
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
      const { [id]: fuera, ...resto } = n.taller;
      n.taller = resto;
      n.reserva = [...n.reserva, { ...cat, desgaste: nuevo, fiab: fiabDesgaste(nuevo), vencida: false }];
      log(n, t.restan > 0 ? "aviso" : "ok", `${id} sale de ${t.dep}${t.restan > 0 ? " antes de terminar" : ""} con el desgaste al ${Math.round(nuevo)} %.`);
      return n;
    });
    close();
  };

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "86vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        <div style={ST.eyebrow}>Taller</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "ui-monospace, monospace", letterSpacing: -0.6 }}>{id}</div>
        <div style={{ fontSize: 12.5, color: averiada ? P.alert : P.muted, marginBottom: 12 }}>
          {est.txt} · desgaste {Math.round(d)} % · fiabilidad {Math.round(fiabDesgaste(d) * 100)} %
        </div>

        {enTaller ? (
          <>
            <Bloque titulo="En reparación">
              <div style={{ padding: "6px 0", fontSize: 12.5 }}>
                {[["Trabajo", REVISIONES[enTaller.tipo].n], ["Taller", enTaller.dep], ["Turnos restantes", String(enTaller.restan)]].map(([k, v], n2) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(n2) }}>
                    <span style={{ color: P.muted }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </Bloque>
            <button
              onClick={sacar}
              style={{ width: "100%", background: enTaller.restan > 0 ? P.surface : P.ink, color: enTaller.restan > 0 ? P.ink : "#fff", border: `1px solid ${enTaller.restan > 0 ? P.warn : P.ink}`, borderRadius: 9, padding: 13, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 8 }}
            >
              {enTaller.restan > 0 ? "Sacar antes de tiempo · solo cuenta lo hecho" : "Sacar de taller"}
            </button>
          </>
        ) : est.corto === "Circulando" ? (
          <div style={{ fontSize: 12.5, color: P.muted, background: P.sunken, borderRadius: 8, padding: "10px 12px", marginBottom: 10, lineHeight: 1.45 }}>
            La unidad está en servicio. Hay que apartarla, o esperar al cierre del turno, para poder meterla en taller.
          </div>
        ) : (
          <>
            {averiada && (
              <div style={{ fontSize: 12, color: P.alert, background: P.sunken, borderRadius: 8, padding: "9px 11px", marginBottom: 10, lineHeight: 1.45 }}>
                Unidad inútil: solo admite reparación, y no vuelve al servicio hasta terminarla.
              </div>
            )}
            {opciones.map((o) => (
              <div key={o.dep} style={{ ...ST.card, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Enlace txt={o.dep} bg={(DEPOSITOS[o.dep] || {}).color || P.muted} />
                  {o.propio && <span style={{ fontSize: 9.5, fontWeight: 700, color: P.muted, border: `1px solid ${P.rule}`, borderRadius: 3, padding: "0 4px" }}>SU TALLER</span>}
                  <span style={{ fontSize: 11.5, color: o.libres ? P.ok : P.alert, fontWeight: 700, marginLeft: "auto" }}>
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
                      style={{ display: "block", width: "100%", textAlign: "left", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 8, padding: "9px 11px", marginBottom: 5, fontFamily: "inherit", cursor: o.libres ? "pointer" : "not-allowed", opacity: o.libres ? 1 : 0.4, color: P.ink }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{rv.n}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: P.ok }}>
                          {Math.round(d)}% → {Math.round(queda)}%
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>
                        {rv.turnos} {rv.turnos === 1 ? "turno" : "turnos"} fuera de servicio · {nf(rv.coste)} € · fiabilidad {Math.round(fiabDesgaste(queda) * 100)} %
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </>
        )}

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: P.ok, flex: 1 }}>
              {listas.length} unidad{listas.length === 1 ? "" : "es"} lista{listas.length === 1 ? "" : "s"} para salir
            </span>
            <button
              onClick={sacarTodas}
              style={{ background: P.ok, color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Sacar todas
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: P.muted, fontFamily: "ui-monospace, monospace", lineHeight: 1.5 }}>
            {listas.map(([id, t]) => `${id} · ${t.dep}`).join("  ·  ")}
          </div>
        </div>
      )}

      {/* ── pendientes de decisión ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ ...ST.eyebrow, flex: 1 }}>Pendientes · {pend.length}</span>
        <button
          onClick={() => setSel(propuestaMantenimiento(g, semilla))}
          style={{ background: P.surface, color: P.ink, border: `1px solid ${P.rule}`, borderRadius: 7, padding: "5px 11px", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
        >
          Proponer
        </button>
        {nSel > 0 && (
          <button
            onClick={() => setSel({})}
            style={{ background: "transparent", color: P.muted, border: "none", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
          >
            Limpiar
          </button>
        )}
      </div>

      {pend.length === 0 && (
        <div style={{ ...ST.card, padding: 12, marginBottom: 8, fontSize: 12.5, color: P.muted }}>
          Nada pendiente. Solo se puede mandar a taller material parado: suprime un tren o espera a que se aparte alguna unidad.
        </div>
      )}

      {pend.map((p) => {
        const marcada = sel[p.u.id];
        const opciones = talleresPara(g, p.u, semilla);
        return (
          <div key={p.u.id} style={{ ...ST.card, padding: 12, marginBottom: 6, borderColor: marcada ? P.ink : p.averiada ? P.alert : P.rule }}>
            <div
              onClick={() => marcar(p.u.id, marcada ? null : { tipo: revisionSugerida(p), dep: (opciones.find((o) => o.libres > 0) || opciones[0] || {}).dep })}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${marcada ? P.ink : P.rule}`,
                  background: marcada ? P.ink : P.surface,
                  color: "#fff",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {marcada ? "✓" : ""}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{p.u.id}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: p.d >= 85 ? P.alert : p.d >= 60 ? P.warn : P.muted }}>
                {Math.round(p.d)}%
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: p.est.c, flex: 1, textAlign: "right", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.est.txt}
              </span>
            </div>

            {marcada && (
              <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${P.sunken}` }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
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
                        background: marcada.tipo === tipo ? P.ink : P.surface,
                        color: marcada.tipo === tipo ? "#fff" : P.ink,
                        border: `1px solid ${marcada.tipo === tipo ? P.ink : P.rule}`,
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 11,
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
                        color: marcada.dep === o.dep ? "#fff" : o.libres ? P.ink : P.muted,
                        border: `1px solid ${marcada.dep === o.dep ? "transparent" : P.rule}`,
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 11,
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
                <div style={{ fontSize: 11, color: P.muted, marginTop: 6 }}>
                  {Math.round(p.d)}% → {Math.round(Math.max(0, p.d - REVISIONES[marcada.tipo].quita))}% · {nf(REVISIONES[marcada.tipo].coste)} €
                </div>
              </div>
            )}
          </div>
        );
      })}

      {nSel > 0 && (
        <div style={{ ...ST.card, padding: 12, marginTop: 4, marginBottom: 10, borderColor: avisos.length ? P.alert : P.ink }}>
          {avisos.map((a2) => (
            <div key={a2.serie} style={{ fontSize: 12, color: P.alert, fontWeight: 600, marginBottom: 5, lineHeight: 1.4 }}>
              Serie {a2.serie}: quedarían {a2.disponibles} unidades disponibles y hacen falta {a2.enServicio} para cubrir el turno.
            </div>
          ))}
          <button
            onClick={confirmar}
            disabled={Object.values(sel).some((v) => !v.dep)}
            style={{ width: "100%", background: P.ink, color: "#fff", border: "none", borderRadius: 8, padding: 13, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
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
          <div key={dep} style={{ ...ST.card, padding: "10px 12px", marginBottom: 6 }}>
            <div
              onClick={() => dentro.length && setTallerAbierto(desplegado ? null : dep)}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: dentro.length ? "pointer" : "default" }}
            >
              <Enlace txt={dep} bg={(DEPOSITOS[dep] || {}).color || P.muted} />
              <span style={{ fontSize: 11, color: P.muted, flex: 1 }}>{t.series.join(" y ")}</span>
              {dentro.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: ROJO }}>
                  {dentro.length} dentro {desplegado ? "▲" : "▼"}
                </span>
              )}
              <span style={{ fontSize: 11.5, fontWeight: 700, color: libres - reservadas > 0 ? P.ok : P.alert }}>
                {Math.max(0, libres - reservadas)} libres
              </span>
            </div>
            <div style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden", marginTop: 7, background: P.sunken }}>
              {Array.from({ length: t.plazas }).map((_, k) => (
                <div
                  key={k}
                  style={{
                    flex: 1,
                    background: k < ajenas ? P.muted : k < ajenas + propias ? ROJO : k < ajenas + propias + reservadas ? P.warn : P.ok,
                    borderRight: k < t.plazas - 1 ? "1px solid #fff" : "none",
                  }}
                />
              ))}
            </div>

            {desplegado && (
              <div style={{ marginTop: 9, borderTop: `1px solid ${P.sunken}`, paddingTop: 7 }}>
                {dentro.map(([uid, v], k) => {
                  const cu = CATALOGO.find((x) => x.id === uid);
                  const parcial = REVISIONES[v.tipo].quita * ((REVISIONES[v.tipo].turnos - v.restan) / REVISIONES[v.tipo].turnos);
                  return (
                    <div key={uid} style={{ padding: "7px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k) }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>{uid}</span>
                        {cu && cu.deposito !== dep && <Enlace txt={cu.deposito} bg={(DEPOSITOS[cu.deposito] || {}).color || P.muted} />}
                        <span style={{ fontSize: 11, color: P.muted, flex: 1, textAlign: "right", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {REVISIONES[v.tipo].n}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: v.restan > 0 ? P.warn : P.ok, flexShrink: 0 }}>
                          {v.restan > 0 ? `${v.restan} turno${v.restan === 1 ? "" : "s"}` : "lista"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                        <span style={{ fontSize: 10.5, color: P.muted, flex: 1 }}>
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
                            color: v.restan > 0 ? P.warn : "#fff",
                            border: `1px solid ${v.restan > 0 ? P.warn : P.ok}`,
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 11,
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
        style={{ width: "100%", background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 11, marginTop: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", color: P.ink }}
      >
        {verFlota ? "Ocultar" : "Ver"} flota completa · {nf(CATALOGO.length)} unidades
      </button>

      {verFlota &&
        Object.keys(TALLERES).map((dep) => {
          const uds = CATALOGO.filter((u) => u.deposito === dep);
          if (!uds.length) return null;
          const abierta = abierto === dep;
          return (
            <div key={dep} style={{ ...ST.card, padding: 12, marginTop: 6 }}>
              <button onClick={() => setAbierto(abierta ? null : dep)} style={{ all: "unset", display: "flex", alignItems: "center", gap: 8, width: "100%", cursor: "pointer" }}>
                <Enlace txt={dep} bg={(DEPOSITOS[dep] || {}).color || P.muted} />
                <span style={{ fontSize: 11.5, color: P.muted, flex: 1 }}>{uds.length} unidades</span>
                <span style={{ fontSize: 11.5, color: P.muted }}>{abierta ? "▲" : "▼"}</span>
              </button>
              {abierta && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${P.sunken}`, paddingTop: 6 }}>
                  {uds.map((u0, k) => {
                    const dv = desgasteDe(g, u0.id);
                    const est = estadoUnidad(g, u0.id);
                    return (
                      <div
                        key={u0.id}
                        onClick={() => verUnidad(u0.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k), cursor: "pointer" }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "ui-monospace, monospace", width: 62, flexShrink: 0 }}>{u0.id}</span>
                        <span style={{ fontSize: 11.5, fontFamily: "ui-monospace, monospace", width: 40, color: dv >= 85 ? P.alert : dv >= 60 ? P.warn : P.muted, flexShrink: 0 }}>
                          {Math.round(dv)}%
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: est.c, flex: 1, textAlign: "right", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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

function PerfilUnidad({ g, id, close, volverA, volver, verTaller, gestionar }) {
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
  const marchas = tren ? rotacionDelDia(tren) : [];
  const actual = marchas.find((x) => g.reloj >= x.ini && g.reloj < x.fin);

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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 68 }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "88vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        {volverA && (
          <button onClick={volver} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: P.muted, marginBottom: 8 }}>
            ‹ Volver a {volverA.nombre}
          </button>
        )}
        <div style={ST.eyebrow}>Material rodante</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "3px 0 2px" }}>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "ui-monospace, monospace", letterSpacing: -1 }}>{u.id}</span>
          {u.reformada && <Etiqueta txt="Reformada" c={P.ok} />}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: lote && lote.averiado ? P.alert : P.muted, marginBottom: 14 }}>{situacionTxt}</div>

        <Bloque titulo="Ficha técnica">
          {filas.map(([k, v], n) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(n), fontSize: 12.5 }}>
              <span style={{ color: P.muted }}>{k}</span>
              <span style={{ fontWeight: 600, fontFamily: typeof v === "string" ? "ui-monospace, monospace" : "inherit" }}>{v}</span>
            </div>
          ))}
        </Bloque>

        <Bloque titulo="Estado">
          <div style={{ padding: "6px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ color: P.muted }}>Fiabilidad</span>
              <span style={{ fontWeight: 700, fontFamily: "ui-monospace, monospace", color: u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }}>
                {Math.round(u.fiab * 100)} %
              </span>
            </div>
            <div style={{ height: 5, background: P.sunken, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${u.fiab * 100}%`, height: "100%", background: u.fiab >= 0.97 ? P.ok : u.fiab >= 0.945 ? P.warn : P.alert }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ color: P.muted }}>Desgaste</span>
              <span style={{ fontWeight: 700, fontFamily: "ui-monospace, monospace", color: !cubreTurno(u) ? P.alert : turnosRestantes(u) < 2 ? P.warn : P.ink }}>
                {Math.round(u.desgaste)} %
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: P.muted }}>
              {cubreTurno(u)
                ? `Le quedan ${turnosRestantes(u).toFixed(1)} turnos · ${tasaDesgaste(u)} pts por cada 100 km`
                : `No cubre el turno completo: agotaría el ciclo`}
            </div>
          </div>
        </Bloque>

        <Bloque titulo="Acoplamiento">
          <div style={{ padding: "6px 0", fontSize: 12.5 }}>
            {pareja.length === 0 ? (
              <span style={{ color: P.muted }}>{SERIES[u.serie].doble ? "Sin acoplar" : "Composición simple: circula sola"}</span>
            ) : (
              pareja.map((x) => (
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{x.id}</span>
                  <span style={{ color: P.muted }}>{nf(x.plazas)} plazas · fiab. {Math.round(x.fiab * 100)} %</span>
                </div>
              ))
            )}
            {tren && (
              <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${P.sunken}`, color: P.muted }}>
                Oferta conjunta del tren: {nf(plazasDe(tren))} plazas
              </div>
            )}
          </div>
        </Bloque>

        <Bloque titulo="Trenes que hace hoy">
          {marchas.length === 0 && <div style={{ fontSize: 12.5, color: P.muted, padding: "6px 0" }}>Sin servicio asignado en este turno.</div>}
          {marchas.map((x, k) => {
            const enCurso = enCursoM === x;
            const pasada = x.real;
            // una vez terminada manda lo que pasó de verdad
            const desde = x.desde;
            const hasta = x.real && x.hastaReal ? x.hastaReal : x.hasta;
            const hIni = x.inicioReal !== undefined ? x.inicioReal : x.ini;
            const hFin = x.real && x.finReal !== undefined ? x.finReal : x.fin;
            const tarde = x.real && x.finReal !== undefined && x.finReal - x.fin > 2;
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k), opacity: pasada ? 0.45 : 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: "#fff", background: enCurso ? ROJO : x.real ? P.ink : P.muted, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
                  {x.num}
                </span>
                <span style={{ fontSize: 12.5, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {desde} → {hasta}
                  {x.motivo && <span style={{ color: P.warn, fontWeight: 600 }}> · {x.motivo}</span>}
                </span>
                <span style={{ fontSize: 12, color: P.muted, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>
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
            style={{ width: "100%", background: P.surface, color: P.ink, border: `1px solid ${g.taller[id] ? P.warn : P.rule}`, borderRadius: 9, padding: 13, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 8 }}
          >
            {g.taller[id] ? "Gestionar salida de taller" : "Enviar a taller"}
          </button>
        )}
        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PerfilTren({ g, i, close, setRotarDe, setApartarDe, setSuprimirDe, setReponerDe, volverA, volver, verUnidad }) {
  const [infoAtr, setInfoAtr] = useState(null); // antes de cualquier return
  const t = g.trenes.find((x) => x.i === i);
  if (!t) return null;
  const sit = situacion(t, g.reloj);
  const m = t.maq ? g.personal.find((x) => x.id === t.maq) : null;
  const supr = t.estado === "suprimido";
  const aBordo = t.pax.reduce((a, b) => a + b, 0);
  const cap = plazasDe(t) || 1;
  const oc = Math.min(100, (aBordo / cap) * 100);
  /* Rotación: primero lo que el tren ha hecho de verdad, y a continuación lo
     que le queda por hacer según el cuadro. Si rota antes o se retira, la
     marcha real se cierra donde toque y no donde estaba previsto.       */
  const marchas = t.marchas || [];
  const enCursoM = marchaActual(t);


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
    <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(10,14,17,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 66 }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: P.surface, width: "100%", maxWidth: 540, maxHeight: "88vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 16 }}>
        {volverA && (
          <button
            onClick={volver}
            style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: P.muted, marginBottom: 8 }}
          >
            ‹ Volver a {volverA.nombre}
          </button>
        )}
        <div style={ST.eyebrow}>Circulación {t.i}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              // el material en vacío no presta servicio en ninguna línea
              background: t.esVacio ? P.ink : LIN[LINEA],
              borderRadius: 5,
              // mismo tamaño exacto que la pastilla de la línea, aunque "MV"
              // ocupe menos: si no, el número de tren bailaba de sitio
              padding: "2px 0",
              minWidth: 34,
              textAlign: "center",
              fontFamily: "ui-monospace, monospace",
              flexShrink: 0,
            }}
          >
            {t.esVacio ? "MV" : LINEA}
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, fontFamily: "ui-monospace, monospace", letterSpacing: -1 }}>{numeroTren(t, g.reloj)}</span>
          <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: colRetraso(retrasoEfectivo(t)) }}>
            {supr ? "—" : retTxt(retrasoEfectivo(t))}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{estadoTxt}</div>

        <Bloque titulo="Composición">
          <div style={{ padding: "6px 0" }}>
            {t.unidades.length === 0 && <div style={{ fontSize: 12.5, color: P.muted }}>Sin material.</div>}
            {t.unidades.map((u, ku) => (
              <div key={u.id} onClick={() => verUnidad && verUnidad(u.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(ku), fontSize: 12.5, cursor: verUnidad ? "pointer" : "default" }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, borderBottom: verUnidad ? `1px dotted ${P.rule}` : "none" }}>{u.id}</span>
                <span style={{ color: P.muted, fontSize: 11.5 }}>
                  {nf(u.plazas)} pl · fiab {Math.round(u.fiab * 100)}% · desgaste {Math.round(u.desgaste)} %
                </span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${P.sunken}`, marginTop: 7, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: P.muted, marginBottom: 4 }}>
                <span>Ocupación</span>
                <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: oc > 92 ? P.alert : oc > 70 ? P.warn : P.ok }}>
                  {nf(aBordo)} / {nf(cap)} · {Math.round(oc)}%
                </span>
              </div>
              <div style={{ height: 6, background: P.sunken, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${oc}%`, height: "100%", background: oc > 92 ? P.alert : oc > 70 ? P.warn : P.ok }} />
              </div>
            </div>
          </div>
        </Bloque>

        {m && (
          <Bloque titulo="Conducción">
            <div style={{ padding: "6px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{m.nombre}</span>
                <Media m={m} />
              </div>
              <div style={{ fontSize: 12, color: P.muted }}>
                {dur(m.cond)} de conducción continua · jornada {dur(m.jornada)}
              </div>
              <div style={{ fontSize: 12, color: t.excesoAutorizado ? P.alert : P.muted, marginTop: 3 }}>
                {t.excesoAutorizado ? "Conduciendo por encima del límite" : t.relevo ? `Relevo previsto ${hhmm(t.relevo.prevista)} en ${t.relevo.cab}` : "Sin relevo en el turno"}
              </div>
              <Atributos m={m} onInfo={(k) => setInfoAtr((x) => (x === k ? null : k))} />
              {infoAtr && (
                <div style={{ marginTop: 8, background: P.sunken, borderRadius: 8, padding: "9px 11px", fontSize: 12, color: P.muted, lineHeight: 1.45 }}>
                  <strong style={{ color: P.ink }}>{INFO_ATRIB[infoAtr].n}</strong>: {INFO_ATRIB[infoAtr].t}
                </div>
              )}
            </div>
          </Bloque>
        )}

        <Bloque titulo="Histórico de retraso">
          <div style={{ padding: "4px 0" }}>
            {t.hist.length === 0 && t.acum.paradas < 0.5 && (t.acum.bloqueo || 0) < 0.5 && Math.abs(t.acum.maquinista) < 0.5 && (
              <div style={{ fontSize: 12.5, color: P.muted }}>Sin incidencias. Marcha conforme al horario.</div>
            )}
            {t.hist.map((h, k) => (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "5px 10px", margin: "0 -12px", borderRadius: 6, background: fondoFila(k), fontSize: 12.5 }}>
                <span style={{ color: P.muted, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>{hhmm(h.m)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{h.txt}</span>
                <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: h.min > 0 ? P.alert : P.ok, flexShrink: 0 }}>
                  {h.min > 0 ? `+${Math.round(h.min)}` : Math.round(h.min)}′
                </span>
              </div>
            ))}
            {(t.acum.paradas >= 0.5 || (t.acum.bloqueo || 0) >= 0.5 || Math.abs(t.acum.maquinista) >= 0.5) && (
              <div style={{ borderTop: `1px solid ${P.sunken}`, marginTop: 6, paddingTop: 7 }}>
                {t.acum.paradas >= 0.5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
                    <span style={{ color: P.muted }}>Exceso de tiempo de parada</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: P.alert }}>+{Math.round(t.acum.paradas)}′</span>
                  </div>
                )}
                {(t.acum.bloqueo || 0) >= 0.5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
                    <span style={{ color: P.muted }}>Marcha condicionada por el tren de delante</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: P.alert }}>+{Math.round(t.acum.bloqueo)}′</span>
                  </div>
                )}
                {Math.abs(t.acum.maquinista) >= 0.5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}>
                    <span style={{ color: P.muted }}>Marcha de {m ? m.nombre : "el maquinista"}</span>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: t.acum.maquinista > 0 ? P.alert : P.ok }}>
                      {t.acum.maquinista > 0 ? "+" : ""}
                      {Math.round(t.acum.maquinista)}′
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Bloque>

        <Bloque titulo="Rotación del día">
          {marchas.map((x, k) => {
            const enCurso = enCursoM === x;
            const pasada = x.real;
            // una vez terminada manda lo que pasó de verdad
            const desde = x.desde;
            const hasta = x.real && x.hastaReal ? x.hastaReal : x.hasta;
            const hIni = x.inicioReal !== undefined ? x.inicioReal : x.ini;
            const hFin = x.real && x.finReal !== undefined ? x.finReal : x.fin;
            const tarde = x.real && x.finReal !== undefined && x.finReal - x.fin > 2;
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
                  borderRadius: 6,
                  opacity: pasada ? 0.5 : 1,
                  color: enCurso ? P.ink : "inherit",
                  fontWeight: enCurso ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: "#fff", background: enCurso ? ROJO : x.real ? P.ink : P.muted, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
                  {x.num}
                </span>
                <span style={{ fontSize: 12.5, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {desde} → {hasta}
                  {x.motivo && <span style={{ color: P.warn, fontWeight: 600 }}> · {x.motivo}</span>}
                </span>
                <span style={{ fontSize: 12, color: P.muted, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>
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

        <button onClick={close} style={{ width: "100%", background: P.sunken, border: `1px solid ${P.rule}`, borderRadius: 9, padding: 12, fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer", color: P.ink }}>
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
      style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, justifyContent: "flex-end", minWidth: 0, cursor: onClick ? "pointer" : "default" }}
    >
      <span style={{ fontSize: 11, color: P.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
        {tren.unidades.map((u) => u.id).join(" + ")}
        <br />
        <span style={{ color: col, fontWeight: 700 }}>{txt}</span>
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "ui-monospace, monospace", color: "#fff", background: fondo, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
        {numeroTren(tren, g.reloj)}
      </span>
    </span>
  );
}

function Bloque({ titulo, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...ST.eyebrow, marginBottom: 6 }}>{titulo}</div>
      <div style={{ background: P.surface, border: `1px solid ${P.rule}`, borderRadius: 10, padding: "4px 12px 10px" }}>{children}</div>
    </div>
  );
}

function Enlace({ txt, bg }) {
  return <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: bg, borderRadius: 3, padding: "1px 4px", fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>{txt}</span>;
}

function Libro({ g }) {
  const punt = g.kpi.muestras ? (g.kpi.puntuales / g.kpi.muestras) * 100 : 100;
  const activos = g.trenes.filter((t) => t.estado !== "suprimido");
  const retrasoMedio = activos.length ? activos.reduce((n, t) => n + retrasoEfectivo(t), 0) / activos.length : 0;
  const enAnden = g.andenes.reduce((n, a) => n + a.alcala + a.pio, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 6 }}>
        <Kpi k="Punt." v={`${punt.toFixed(0)}%`} c={punt >= 92 ? P.ok : punt >= 75 ? P.warn : P.alert} small />
        <Kpi k="Retraso" v={`${retrasoMedio.toFixed(1)}′`} c={colRetrasoMedio(retrasoMedio)} small />
        <Kpi k="Circul." v={`${activos.length}/${CIRCULACIONES}`} c={activos.length === CIRCULACIONES ? P.ok : P.warn} small />
        <Kpi k="Andén" v={nf(enAnden)} c={enAnden > 4000 ? P.alert : P.ink} small />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, marginBottom: 10 }}>
        <Kpi k="Afectados" v={nf(g.kpi.afect)} c={g.kpi.afect > 6000 ? P.alert : P.ink} small />
        <Kpi k="Coste" v={`${(g.kpi.coste / 1000).toFixed(1)}k €`} c={P.ink} small />
        <Kpi k="Incid." v={String(g.incCount)} c={P.ink} small />
      </div>

      <div style={{ ...ST.card, padding: 12, maxHeight: 460, overflowY: "auto" }}>
      {[...g.log].reverse().map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 12.5, lineHeight: 1.4 }}>
          <span style={{ color: P.muted, fontFamily: "ui-monospace, monospace", flexShrink: 0 }}>{hhmm(l.m)}</span>
          <span style={{ color: l.k === "bad" ? P.alert : l.k === "aviso" ? P.warn : l.k === "ok" ? P.ok : P.muted }}>{l.t}</span>
        </div>
      ))}
      </div>
    </div>
  );
}

const colRetraso = (n) => (rt(n) === 0 ? P.ok : n <= 5 ? P.warn : P.alert);
const colRetrasoMedio = (n) => (n <= 3 ? P.ok : n <= 8 ? P.warn : P.alert);
const fondoFila = (k) => (k % 2 ? P.sunken : P.surface);
const colAtrib = (v) => (v >= 70 ? P.ok : v >= 40 ? P.warn : P.alert);

function Media({ m }) {
  const v = mediaAtrib(m);
  return (
    <span
      style={{
        fontFamily: "ui-monospace, monospace",
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        background: colAtrib(v),
        borderRadius: 4,
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

function Atributos({ m, onInfo }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
      {["pun", "pro", "con"].map((k) => {
        const v = m[k];
        return (
          <div key={k} style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <button
                onClick={() => onInfo && onInfo(k)}
                style={{ all: "unset", cursor: "pointer", fontSize: 9.5, color: P.muted, fontWeight: 700, letterSpacing: 0.6, borderBottom: `1px dotted ${P.rule}` }}
              >
                {INFO_ATRIB[k].k}
              </button>
              <span style={{ color: colAtrib(v), fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: 10.5 }}>{v}</span>
            </div>
            <div style={{ height: 3, background: P.sunken, borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
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
    <div style={{ display: "flex", gap: 5, marginTop: 9 }}>
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
            borderRadius: 7,
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

function Etiqueta({ txt, c }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: c, border: `1px solid ${c}`, borderRadius: 4, padding: "1px 6px" }}>{txt}</span>
  );
}

function Kpi({ k, v, c, small }) {
  return (
    <div style={{ ...ST.card, padding: small ? "6px 5px" : "10px 11px", textAlign: small ? "center" : "left", minWidth: 0 }}>
      <div style={{ fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase", color: P.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{k}</div>
      <div
        style={{
          fontSize: small ? 14 : 19,
          fontWeight: 700,
          color: c,
          fontFamily: "ui-monospace, monospace",
          marginTop: 1,
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
      @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; }
      button:focus-visible { outline: 2px solid ${ROJO}; outline-offset: 2px; }
    `}</style>
  );
}
