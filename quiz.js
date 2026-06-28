/* =========================================================
   QUIZ.JS
   Dos responsabilidades en este archivo, separadas con claridad:
   1) Dibujar el gráfico comparativo (interés simple vs compuesto)
   2) Calificar el quiz de 5 preguntas
   ========================================================= */

/* ---------- 1) Fórmulas financieras ----------
   Mismas fórmulas explicadas en la página, aquí ya en código.
   Las dejamos sueltas (no en una clase) a propósito: son fáciles
   de leer, copiar y modificar una por una si el docente lo pide. */

function calcularMontoSimple(capital, tasaDecimal, periodos) {
  // M = C × (1 + i × t)  -> lo calculamos año por año para graficar
  const resultados = [];
  for (let anio = 1; anio <= periodos; anio++) {
    const monto = capital * (1 + tasaDecimal * anio);
    resultados.push({ anio, monto });
  }
  return resultados;
}

function calcularMontoCompuesto(capital, tasaDecimal, periodos) {
  // M = C × (1 + i)^t  -> año por año
  const resultados = [];
  for (let anio = 1; anio <= periodos; anio++) {
    const monto = capital * Math.pow(1 + tasaDecimal, anio);
    resultados.push({ anio, monto });
  }
  return resultados;
}

/* ---------- 2) Dibujar las barras comparativas ---------- */

function renderizarGrafico(idContenedor, datosSimple, datosCompuesto) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  contenedor.innerHTML = ""; // limpiar antes de dibujar

  // La barra más alta del gráfico (siempre es la última de "compuesto",
  // porque crece más rápido) sirve para escalar el resto en porcentaje.
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

// Ejemplo fijo de la página de estudio: $1000 al 5% anual, 10 años.
// Si quieres practicar una modificación, prueba a cambiar estos 3 valores.
const CAPITAL_EJEMPLO = 1000;
const TASA_EJEMPLO = 0.05;
const ANIOS_EJEMPLO = 10;

const datosSimpleEjemplo = calcularMontoSimple(CAPITAL_EJEMPLO, TASA_EJEMPLO, ANIOS_EJEMPLO);
const datosCompuestoEjemplo = calcularMontoCompuesto(CAPITAL_EJEMPLO, TASA_EJEMPLO, ANIOS_EJEMPLO);

renderizarGrafico("grafico-comparativo", datosSimpleEjemplo, datosCompuestoEjemplo);

/* ---------- 3) Calificar el quiz ---------- */

document.getElementById("btn-calificar").addEventListener("click", function () {
  const preguntas = document.querySelectorAll(".pregunta");
  let correctas = 0;

  preguntas.forEach((pregunta) => {
    // Quitar resultados de un intento anterior
    pregunta.classList.remove("correcta", "incorrecta");
    pregunta.querySelectorAll(".opcion").forEach((op) => {
      op.classList.remove("marcada", "respuesta-correcta");
    });

    const respuestaCorrecta = pregunta.dataset.correcta;
    const seleccionado = pregunta.querySelector("input[type=radio]:checked");

    if (!seleccionado) {
      // El estudiante no respondió esta pregunta: se cuenta como incorrecta
      pregunta.classList.add("incorrecta");
      return;
    }

    const opcionSeleccionada = seleccionado.closest(".opcion");
    opcionSeleccionada.classList.add("marcada");

    if (seleccionado.value === respuestaCorrecta) {
      correctas++;
      pregunta.classList.add("correcta");
    } else {
      pregunta.classList.add("incorrecta");
      // Mostrar cuál era la opción correcta
      const inputCorrecto = pregunta.querySelector(`input[value="${respuestaCorrecta}"]`);
      inputCorrecto.closest(".opcion").classList.add("respuesta-correcta");
    }
  });

  mostrarResultado(correctas, preguntas.length);
});

function mostrarResultado(correctas, total) {
  const caja = document.getElementById("resultado-quiz");
  caja.style.display = "block";

  let mensaje;
  if (correctas === total) {
    mensaje = "¡Excelente! Dominas el interés simple y compuesto.";
  } else if (correctas >= total / 2) {
    mensaje = "Vas bien, repasa las preguntas marcadas en rojo.";
  } else {
    mensaje = "Repasa las secciones 2 y 3 antes de seguir.";
  }

  caja.textContent = `Resultado: ${correctas} / ${total} — ${mensaje}`;
}
