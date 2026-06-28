/* =========================================================
   QUIZ.JS — Gráfico comparativo + Quiz animado
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

function renderizarGrafico(idContenedor, datosSimple, datosCompuesto) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const montoMaximo = datosCompuesto[datosCompuesto.length - 1].monto;

  datosSimple.forEach((puntoSimple, indice) => {
    const puntoCompuesto = datosCompuesto[indice];
    const alturaSimplePct   = (puntoSimple.monto   / montoMaximo) * 100;
    const alturaCompuestoPct = (puntoCompuesto.monto / montoMaximo) * 100;

    const grupo = document.createElement("div");
    grupo.className = "grupo-barra";

    // Empieza en altura 0 y anima con un pequeño retraso por columna
    const delay = indice * 60;
    grupo.innerHTML = `
      <div class="par-barras">
        <div class="barra simple"
             style="height:0%; transition-delay:${delay}ms"
             data-altura="${alturaSimplePct}"
             title="Simple · Año ${puntoSimple.anio}: $${puntoSimple.monto.toFixed(2)}"></div>
        <div class="barra compuesto"
             style="height:0%; transition-delay:${delay + 30}ms"
             data-altura="${alturaCompuestoPct}"
             title="Compuesto · Año ${puntoCompuesto.anio}: $${puntoCompuesto.monto.toFixed(2)}"></div>
      </div>
      <span class="etiqueta-anio">Año ${puntoSimple.anio}</span>
    `;
    contenedor.appendChild(grupo);
  });

  // Anima las barras al siguiente frame para que la transición CSS se dispare
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      contenedor.querySelectorAll(".barra").forEach(b => {
        b.style.height = b.dataset.altura + "%";
      });
    });
  });
}

// Gráfico estático de la página de estudio: $1000, 5%, 10 años
const datosSimpleEjemplo    = calcularMontoSimple(1000, 0.05, 10);
const datosCompuestoEjemplo = calcularMontoCompuesto(1000, 0.05, 10);
renderizarGrafico("grafico-comparativo", datosSimpleEjemplo, datosCompuestoEjemplo);

/* ---------- Quiz ---------- */

document.getElementById("btn-calificar").addEventListener("click", function () {
  const preguntas = document.querySelectorAll(".pregunta");
  let correctas = 0;

  preguntas.forEach((pregunta) => {
    pregunta.classList.remove("correcta", "incorrecta");
    pregunta.querySelectorAll(".opcion").forEach(op =>
      op.classList.remove("marcada", "respuesta-correcta")
    );

    const respuestaCorrecta = pregunta.dataset.correcta;
    const seleccionado = pregunta.querySelector("input[type=radio]:checked");

    if (!seleccionado) {
      pregunta.classList.add("incorrecta");
      // Mostrar la correcta
      const inputCorrecto = pregunta.querySelector(`input[value="${respuestaCorrecta}"]`);
      if (inputCorrecto) inputCorrecto.closest(".opcion").classList.add("respuesta-correcta");
      return;
    }

    seleccionado.closest(".opcion").classList.add("marcada");

    if (seleccionado.value === respuestaCorrecta) {
      correctas++;
      pregunta.classList.add("correcta");
    } else {
      pregunta.classList.add("incorrecta");
      const inputCorrecto = pregunta.querySelector(`input[value="${respuestaCorrecta}"]`);
      if (inputCorrecto) inputCorrecto.closest(".opcion").classList.add("respuesta-correcta");
    }
  });

  mostrarResultado(correctas, preguntas.length);
});

function mostrarResultado(correctas, total) {
  const caja = document.getElementById("resultado-quiz");
  caja.style.display = "block";
  caja.className = "";

  let emoji, mensaje, clase;
  if (correctas === total) {
    emoji = "🏆"; clase = "bien";
    mensaje = "¡Perfecto! Dominas el interés simple y compuesto.";
  } else if (correctas >= Math.ceil(total / 2)) {
    emoji = "📚"; clase = "regular";
    mensaje = "Vas bien, repasa las preguntas marcadas.";
  } else {
    emoji = "💡"; clase = "mal";
    mensaje = "Repasa las secciones 2 y 3 antes de continuar.";
  }

  caja.classList.add(clase);
  caja.textContent = `${emoji}  ${correctas} / ${total} — ${mensaje}`;

  // Scroll suave hacia el resultado
  caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
