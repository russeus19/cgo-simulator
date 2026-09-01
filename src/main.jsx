import React from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import CGOC7 from "./App.jsx";

/* Red de seguridad. Cuando algo falla durante el dibujado, React desmonta todo
   y la página se queda en blanco, sin ninguna pista de qué ha pasado. Esto
   recoge el error y lo enseña con el punto exacto del código, que es lo que
   hace falta para arreglarlo.                                             */
class Salvavidas extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, pila: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ pila: info.componentStack });
    console.error("[CGO] error durante el dibujado:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const caja = { fontFamily: "'Archivo', system-ui, sans-serif", maxWidth: 540, margin: "0 auto", padding: 16, color: "#11161A" };
    const rotulo = { fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", color: "#6B7780", fontWeight: 600 };
    const pre = {
      background: "#F3F5F4",
      border: "1px solid #D5DAD9",
      borderRadius: 8,
      padding: 12,
      fontSize: 12,
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
      overflowX: "auto",
      fontFamily: "ui-monospace, monospace",
    };
    const err = this.state.error;
    return (
      <div style={caja}>
        <div style={rotulo}>Error del simulador</div>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: -1, margin: "4px 0 12px" }}>Algo ha fallado al dibujar la pantalla</h1>
        <p style={{ fontSize: 13, color: "#6B7780", lineHeight: 1.5, marginTop: 0 }}>
          El detalle está abajo y también en la consola del navegador. Al recargar se vuelve a la portada; la campaña guardada no se pierde.
        </p>
        <div style={pre}>{String(err && err.stack ? err.stack : err)}</div>
        {this.state.pila && (
          <>
            <div style={{ ...rotulo, margin: "16px 0 6px" }}>Dónde ocurrió</div>
            <div style={pre}>{this.state.pila}</div>
          </>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            width: "100%",
            marginTop: 16,
            background: "#11161A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: 13,
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}

/* No se usa StrictMode: en desarrollo monta cada componente dos veces y el
   motor de simulación avanza el reloj en un intervalo, con lo que el turno
   correría al doble de velocidad. En producción no ocurriría, pero es
   preferible que desarrollo y producción se comporten igual.            */
createRoot(document.getElementById("root")).render(
  <Salvavidas>
    <CGOC7 />
    <Analytics />
  </Salvavidas>
);
