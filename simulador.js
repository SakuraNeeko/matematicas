/* =========================================================
   SIMULADOR.JS — Cálculo + gráfico animado + tabla
   ========================================================= */

function calcularMontoSimple(capital, tasaDecimal, periodos) {
  const resultados = [];
  for (let anio = 1; anio <= periodos; anio++) {
    resultados.push({ anio, monto: capital * (1 + tasaDecimal * anio) });
  }
  return resultados;
}

function calcularMontoCompuesto(capital, tasaDecimal, periodos) {
  const resultados = [];
  for (let anio = 1; anio <= periodos; anio++) {
    resultados.push({ anio, monto: capital * Math.pow(1 + tasaDecimal, anio) });
  }
  return resultados;
}

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

function renderizarGrafico(idContenedor, datosSimple, datosCompuesto) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;
  contenedor.innerHTML = "";

  // Si hay muchos años, filtrar para no saturar el gráfico (máx ~20 barras)
  const total = datosSimple.length;
  const paso  = total > 20 ? Math.ceil(total / 20) : 1;
  const simFiltrado  = datosSimple.filter((_, i) => (i + 1) % paso === 0 || i === total - 1);
  const compFiltrado = datosCompuesto.filter((_, i) => (i + 1) % paso === 0 || i === total - 1);

  const montoMaximo = compFiltrado[compFiltrado.length - 1].monto;

  simFiltrado.forEach((puntoSimple, indice) => {
    const puntoCompuesto    = compFiltrado[indice];
    const alturaSimplePct   = (puntoSimple.monto   / montoMaximo) * 100;
    const alturaCompuestoPct = (puntoCompuesto.monto / montoMaximo) * 100;

    const delay = indice * 50;
    const grupo = document.createElement("div");
    grupo.className = "grupo-barra";
    grupo.innerHTML = `
      <div class="par-barras">
        <div class="barra simple"
             style="height:0%; transition-delay:${delay}ms"
             data-altura="${alturaSimplePct}"
             title="Simple · Año ${puntoSimple.anio}: $${puntoSimple.monto.toFixed(2)}"></div>
        <div class="barra compuesto"
             style="height:0%; transition-delay:${delay + 25}ms"
             data-altura="${alturaCompuestoPct}"
             title="Compuesto · Año ${puntoCompuesto.anio}: $${puntoCompuesto.monto.toFixed(2)}"></div>
      </div>
      <span class="etiqueta-anio">Año ${puntoSimple.anio}</span>
    `;
    contenedor.appendChild(grupo);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      contenedor.querySelectorAll(".barra").forEach(b => {
        b.style.height = b.dataset.altura + "%";
      });
    });
  });
}

function llenarTabla(idCuerpoTabla, filas) {
  const cuerpo = document.getElementById(idCuerpoTabla);
  cuerpo.innerHTML = "";
  filas.forEach((fila, i) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${i * 30}ms`;
    tr.style.animation = "fadeUp 0.3s ease both";
    tr.innerHTML = `
      <td>${fila.anio}</td>
      <td>$${fila.interesPeriodo.toFixed(2)}</td>
      <td>$${fila.montoAcumulado.toFixed(2)}</td>
    `;
    cuerpo.appendChild(tr);
  });
}

/* Animación de conteo numérico para los valores resumen */
function animarContador(elemento, valorFinal, duracionMs = 800) {
  const inicio = performance.now();
  const format = v => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function step(ahora) {
    const progreso = Math.min((ahora - inicio) / duracionMs, 1);
    // Easing: ease-out cubic
    const ease = 1 - Math.pow(1 - progreso, 3);
    elemento.textContent = format(valorFinal * ease);
    if (progreso < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- Submit del formulario ---------- */

document.getElementById("form-simulador").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const capital        = parseFloat(document.getElementById("capital").value);
  const tasaPorcentaje = parseFloat(document.getElementById("tasa").value);
  const anios          = parseInt(document.getElementById("anios").value, 10);
  const tipo           = document.getElementById("tipo").value;
  const tasaDecimal    = tasaPorcentaje / 100;

  const serieSimple    = calcularMontoSimple(capital, tasaDecimal, anios);
  const serieCompuesto = calcularMontoCompuesto(capital, tasaDecimal, anios);

  const serieElegida   = tipo === "simple" ? serieSimple : serieCompuesto;
  const montoFinal     = serieElegida[serieElegida.length - 1].monto;
  const interesGenerado = montoFinal - capital;

  // Mostrar sección antes de animar valores
  const seccion = document.getElementById("seccion-resultado");
  seccion.style.display = "block";

  // Animar contadores
  animarContador(document.getElementById("valor-interes"), interesGenerado);
  animarContador(document.getElementById("valor-monto"),   montoFinal);

  document.getElementById("tipo-en-titulo").textContent = tipo;

  llenarTabla("cuerpo-tabla", calcularInteresPorPeriodo(serieElegida, capital));
  renderizarGrafico("grafico-simulador", serieSimple, serieCompuesto);

  // Scroll suave hacia los resultados
  setTimeout(() => {
    seccion.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
});
