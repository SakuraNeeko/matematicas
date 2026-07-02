/* =========================================================
   SIMULADOR.JS — Cálculo + Chart.js interactivo + tabla
   ========================================================= */

/* ---------- Fórmulas financieras ---------- */

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

/* ---------- Animación de contador numérico ---------- */

function animarContador(elemento, valorFinal, duracionMs = 900) {
  const inicio = performance.now();
  const fmt = v => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function step(ahora) {
    const p = Math.min((ahora - inicio) / duracionMs, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    elemento.textContent = fmt(valorFinal * ease);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- Tabla año por año ---------- */

function llenarTabla(idCuerpoTabla, filas) {
  const cuerpo = document.getElementById(idCuerpoTabla);
  cuerpo.innerHTML = "";
  filas.forEach((fila, i) => {
    const tr = document.createElement("tr");
    tr.style.animation = `fadeUp 0.3s ${i * 25}ms ease both`;
    tr.innerHTML = `
      <td>${fila.anio}</td>
      <td>$${fila.interesPeriodo.toFixed(2)}</td>
      <td>$${fila.montoAcumulado.toFixed(2)}</td>
    `;
    cuerpo.appendChild(tr);
  });
}

/* ============================================================
   GRÁFICO INTERACTIVO CON CHART.JS
   ============================================================ */

let chartInstance = null;   // referencia al gráfico activo
let datosGlobales = null;   // guarda los datos para filtrar sin recalcular
let tipoGrafico = "bar";    // "bar" o "line"

const VERDE  = "#2ecc71";
const DORADO = "#f1c40f";
const VERDE_BG  = "rgba(46, 204, 113, 0.15)";
const DORADO_BG = "rgba(241, 196, 15, 0.15)";

/* Configura Chart.js con tema oscuro */
function construirConfig(labels, simple, compuesto, tipo) {
  const esLinea = tipo === "line";

  const baseDataset = {
    borderWidth: esLinea ? 2.5 : 0,
    pointRadius: esLinea ? 4 : 0,
    pointHoverRadius: esLinea ? 6 : 0,
    borderRadius: esLinea ? 0 : 6,
    borderSkipped: false,
  };

  return {
    type: tipo,
    data: {
      labels,
      datasets: [
        {
          ...baseDataset,
          label: "Interés simple",
          data: simple,
          backgroundColor: esLinea ? DORADO_BG : DORADO,
          borderColor: DORADO,
          pointBackgroundColor: DORADO,
          fill: esLinea,
          tension: esLinea ? 0.3 : 0,
        },
        {
          ...baseDataset,
          label: "Interés compuesto",
          data: compuesto,
          backgroundColor: esLinea ? VERDE_BG : VERDE,
          borderColor: VERDE,
          pointBackgroundColor: VERDE,
          fill: esLinea,
          tension: esLinea ? 0.3 : 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(13, 31, 23, 0.95)",
          borderColor: "rgba(46,204,113,0.3)",
          borderWidth: 1,
          padding: 12,
          titleColor: "#ecf0ec",
          bodyColor: "#a8c4ae",
          titleFont: { family: "Inter", size: 13, weight: "600" },
          bodyFont: { family: "IBM Plex Mono", size: 12 },
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(46,204,113,0.06)", drawBorder: false },
          ticks: {
            color: "#a8c4ae",
            font: { family: "IBM Plex Mono", size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 20,
          },
          border: { color: "rgba(46,204,113,0.15)" },
        },
        y: {
          grid: { color: "rgba(46,204,113,0.06)", drawBorder: false },
          ticks: {
            color: "#a8c4ae",
            font: { family: "IBM Plex Mono", size: 11 },
            callback: v => "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
          },
          border: { color: "rgba(46,204,113,0.15)" },
        },
      },
    },
  };
}

/* Dibuja o actualiza el gráfico con un subconjunto de años */
function renderizarChartJS(rango) {
  if (!datosGlobales) return;

  const { serieSimple, serieCompuesto } = datosGlobales;
  const total = serieSimple.length;

  // Aplicar rango: "todos" muestra todo, número = últimos N años
  const desde = (rango === "todos" || rango >= total) ? 0 : total - rango;
  const simSlice  = serieSimple.slice(desde);
  const compSlice = serieCompuesto.slice(desde);

  const labels   = simSlice.map(p => `Año ${p.anio}`);
  const simData  = simSlice.map(p => parseFloat(p.monto.toFixed(2)));
  const compData = compSlice.map(p => parseFloat(p.monto.toFixed(2)));

  if (chartInstance) {
    // Actualizar datos en vez de recrear (más suave)
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = simData;
    chartInstance.data.datasets[1].data = compData;
    chartInstance.update("active");
  } else {
    const ctx = document.getElementById("grafico-simulador").getContext("2d");
    chartInstance = new Chart(ctx, construirConfig(labels, simData, compData, tipoGrafico));
  }
}

/* Recrea el gráfico cuando cambia el tipo (barras ↔ líneas) */
function cambiarTipoGrafico(tipo) {
  tipoGrafico = tipo;
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  const rangoActivo = document.querySelector(".filtro-btn[data-rango].activo");
  const rango = rangoActivo?.dataset.rango === "todos" ? "todos" : parseInt(rangoActivo?.dataset.rango || "todos");
  renderizarChartJS(rango);
}

/* ---------- Evento: botones de rango ---------- */
document.getElementById("filtro-botones").addEventListener("click", function (e) {
  const btn = e.target.closest(".filtro-btn[data-rango]");
  if (!btn) return;

  document.querySelectorAll(".filtro-btn[data-rango]").forEach(b => b.classList.remove("activo"));
  btn.classList.add("activo");

  const rango = btn.dataset.rango === "todos" ? "todos" : parseInt(btn.dataset.rango);
  renderizarChartJS(rango);
});

/* ---------- Evento: botones de tipo de gráfico ---------- */
document.querySelectorAll(".tipo-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".tipo-btn").forEach(b => b.classList.remove("activo"));
    this.classList.add("activo");
    cambiarTipoGrafico(this.dataset.tipo);
  });
});

/* ---------- Ocultar filtros de rango que superan el total de años ---------- */
function actualizarFiltrosVisibles(totalAnios) {
  document.querySelectorAll(".filtro-btn[data-rango]").forEach(btn => {
    if (btn.dataset.rango === "todos") return;
    const n = parseInt(btn.dataset.rango);
    btn.style.display = n <= totalAnios ? "inline-flex" : "none";
  });
}

/* ============================================================
   SUBMIT DEL FORMULARIO
   ============================================================ */

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

  // Mostrar sección de resultados
  const seccion = document.getElementById("seccion-resultado");
  seccion.style.display = "block";

  // Animar contadores
  animarContador(document.getElementById("valor-interes"), interesGenerado);
  animarContador(document.getElementById("valor-monto"),   montoFinal);

  document.getElementById("tipo-en-titulo").textContent = tipo;

  // Tabla
  llenarTabla("cuerpo-tabla", calcularInteresPorPeriodo(serieElegida, capital));

  // Guardar datos globales y resetear filtro a "todos"
  datosGlobales = { serieSimple, serieCompuesto };
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  document.querySelectorAll(".filtro-btn[data-rango]").forEach(b => b.classList.remove("activo"));
  document.querySelector(".filtro-btn[data-rango='todos']").classList.add("activo");

  actualizarFiltrosVisibles(anios);
  renderizarChartJS("todos");

  // Scroll suave
  setTimeout(() => seccion.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
});
