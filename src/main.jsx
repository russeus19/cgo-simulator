import React from "react";
import { createRoot } from "react-dom/client";
import CGOC7 from "./App.jsx";

/* El juego lleva su propio <style> con la tipografía y el reseteo básico, así
   que no hace falta ninguna hoja de estilos aparte.

   No se usa StrictMode: en desarrollo monta cada componente dos veces y el
   motor de simulación avanza el reloj en un intervalo, con lo que el turno
   correría al doble de velocidad. En producción no ocurriría, pero es
   preferible que desarrollo y producción se comporten igual.            */
createRoot(document.getElementById("root")).render(<CGOC7 />);
