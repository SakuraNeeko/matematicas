/* =========================================================
   SIMULADOR.JS
   Misma lógica de fórmulas que en quiz.js, pero aquí se usan
   con los datos que el usuario escribe en el formulario.
   ========================================================= */

/* ---------- Fórmulas financieras (idénticas a la teoría) ---------- */

function calcularMontoSimple(capital, tasaDecimal, periodos) {
  // M = C × (1 + i × t)
  const resultados = [];
  for (let anio = 1; anio <= periodos; anio++) {
    const monto = capital * (1 + tasaDecimal * anio);
    resultados.push({ anio, monto });
  }
  return resultados;
}

function calcularMontoCompuesto(capital, tasaDecimal, periodos) {
  // M = C × (1 + i)^t
  const resultados = [];
  for (let anio = 1; anio <= periodos; anio++) {
    const monto = capital * Math.pow(1 + tasaDecimal, anio);
    resultados.push({ anio, monto });
  }
  return resultados;
}

/* ---------- Convertir una serie de montos en "interés del período" ---------- */
// Útil para la tabla: a cada año le interesa saber cuánto interés generó
// ESE año en particular, no solo el acumulado.

function calcularInteresPorPeriodo(serieDeMontos, capitalInicial) {
  return serieDeMontos.map((punto, indice) => {
    const montoAnterior = indice === 0 ? capitalInicial : serieDeMontos[indice - 1].monto;
    return {
      anio: punto.anio,
      interesPeriodo: punto.monto - montoAnterior,
      montoAcumulado: punto.monto,
    };
  });
}

/* ---------- Dibujar las barras comparativas (igual que en la teoría) ---------- */

function renderizarGrafico(idContenedor, datosSimple, datosCompuesto) {
  const contenedor = document.getElementById(idContenedor);
  contenedor.innerHTML = "";

  const montoMaximo = datosCompuesto[datosCompuesto.length - 1].monto;

  datosSimple.forEach((puntoSimple, indice) => {
    const puntoCompuesto = datosCompuesto[indice];
    const alturaSimplePct = (puntoSimple.monto / montoMaximo) * 100;
    const alturaCompuestoPct = (puntoCompuesto.monto / montoMaximo) * 100;

    const grupo = document.createElement("div");
    grupo.className = "grupo-barra";
    grupo.innerHTML = `
      <div class="par-barras">
        <div class="barra simple" style="height:${alturaSimplePct}%" title="Simple: $${puntoSimple.monto.toFixed(2)}"></div>
        <div class="barra compuesto" style="height:${alturaCompuestoPct}%" title="Compuesto: $${puntoCompuesto.monto.toFixed(2)}"></div>
      </div>
      <span class="etiqueta-anio">Año ${puntoSimple.anio}</span>
    `;
    contenedor.appendChild(grupo);
  });
}

/* ---------- Llenar la tabla de resultados ---------- */

function llenarTabla(idCuerpoTabla, filas) {
  const cuerpo = document.getElementById(idCuerpoTabla);
  cuerpo.innerHTML = "";

  filas.forEach((fila) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fila.anio}</td>
      <td>$${fila.interesPeriodo.toFixed(2)}</td>
      <td>$${fila.montoAcumulado.toFixed(2)}</td>
    `;
    cuerpo.appendChild(tr);
  });
}

/* ---------- Función principal: se ejecuta al presionar "Calcular" ---------- */

document.getElementById("form-simulador").addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue

  // 1) Leer los datos del formulario
  const capital = parseFloat(document.getElementById("capital").value);
  const tasaPorcentaje = parseFloat(document.getElementById("tasa").value);
  const anios = parseInt(document.getElementById("anios").value, 10);
  const tipo = document.getElementById("tipo").value; // "simple" o "compuesto"

  const tasaDecimal = tasaPorcentaje / 100; // 5% -> 0.05

  // 2) Calcular ambas series (para el gráfico comparativo siempre se muestran las dos)
  const serieSimple = calcularMontoSimple(capital, tasaDecimal, anios);
  const serieCompuesto = calcularMontoCompuesto(capital, tasaDecimal, anios);

  // 3) Elegir qué serie usar para el resumen y la tabla, según lo que el usuario pidió
  const serieElegida = tipo === "simple" ? serieSimple : serieCompuesto;
  const montoFinal = serieElegida[serieElegida.length - 1].monto;
  const interesGenerado = montoFinal - capital;

  // 4) Mostrar el resumen (interés generado y monto final)
  document.getElementById("valor-interes").textContent = `$${interesGenerado.toFixed(2)}`;
  document.getElementById("valor-monto").textContent = `$${montoFinal.toFixed(2)}`;
  document.getElementById("tipo-en-titulo").textContent = tipo;

  // 5) Llenar la tabla año por año con la serie elegida
  const filasTabla = calcularInteresPorPeriodo(serieElegida, capital);
  llenarTabla("cuerpo-tabla", filasTabla);

  // 6) Dibujar el gráfico comparativo con ambas series
  renderizarGrafico("grafico-simulador", serieSimple, serieCompuesto);

  // 7) Mostrar la sección de resultados (estaba oculta antes de calcular)
  document.getElementById("seccion-resultado").style.display = "block";
});
