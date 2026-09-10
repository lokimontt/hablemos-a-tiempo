const SLIDE_DURATION = 7000;
const ANSWER_REVEAL_TIME = 3000;

const slides = [
  {
    type: "intro",
    accent: "#9bd34c",
    eyebrow: "Una conversación puede abrir una salida",
    title: "¿Mito o <em>realidad?</em>",
    description:
      "Cinco preguntas breves para reconocer ideas equivocadas y aprender cómo acompañar a alguien que está sufriendo.",
    image: "./assets/no-estas-solo-banner.jpeg",
    imageAlt: "Afiche de Salud Digital: No estás solo, no estás sola. Llama al *4141.",
  },
  {
    type: "myth",
    number: 1,
    accent: "#ff8a68",
    statement: "“Si realmente se quiere suicidar, no lo dice”.",
    reality:
      "La mayoría de las personas que mueren por suicidio han advertido de sus intenciones. Escuchar esas señales es importante.",
    orbit: ["Escuchar", "Observar", "Acompañar"],
  },
  {
    type: "myth",
    number: 2,
    accent: "#85d6dd",
    statement: "“Es mejor mantener en secreto los pensamientos suicidas de alguien”.",
    reality:
      "Una persona con conducta suicida sufre y puede no encontrar otras alternativas. Necesita apoyo, atención y conexión con ayuda profesional.",
    orbit: ["Hablar", "Cuidar", "Conectar"],
  },
  {
    type: "myth",
    number: 3,
    accent: "#f2c94c",
    statement: "“Quienes intentan suicidarse solo quieren llamar la atención”.",
    reality:
      "Una conducta suicida expresa sufrimiento intenso. Debe tomarse siempre en serio, con escucha, apoyo y atención oportuna.",
    orbit: ["Validar", "Creer", "Apoyar"],
  },
  {
    type: "myth",
    number: 4,
    accent: "#ff8a68",
    statement: "“Preguntar si alguien ha pensado en suicidarse puede darle la idea de hacerlo”.",
    reality:
      "Preguntar de forma directa no instala la idea. Muchas personas se sienten aliviadas cuando pueden hablar con sinceridad de lo que sienten.",
    orbit: ["Preguntar", "Calma", "Sin juzgar"],
  },
  {
    type: "myth",
    number: 5,
    accent: "#9bd34c",
    statement: "“Solo los especialistas pueden prevenir que ocurra un suicidio”.",
    reality:
      "Todas y todos podemos ayudar a prevenir el suicidio. No hace falta ser especialista para escuchar, apoyar y acercar ayuda profesional.",
    orbit: ["Todos", "Cerca", "A tiempo"],
  },
  {
    type: "actions",
    accent: "#85d6dd",
    eyebrow: "Si alguien puede estar en riesgo",
    title: "¿Cómo puedes acompañar?",
    actions: [
      "Muestra interés y ofrece apoyo.",
      "Pregunta cómo se siente y qué dificultades está viviendo.",
      "Pregunta directamente por el suicidio y escucha con calma, sin prejuicios.",
      "Ayúdale a contactar apoyo profesional y acompáñale.",
    ],
  },
  {
    type: "help",
    accent: "#9bd34c",
    eyebrow: "Línea de Prevención del Suicidio",
    title: "No estás solo. No estás sola.",
    image: "./assets/linea-4141-afiche.jpeg",
    imageAlt:
      "Afiche de la Línea de Prevención del Suicidio *4141: servicio gratuito, confidencial y disponible 24 horas al día.",
  },
];

const slideHost = document.querySelector("#slide");
const counter = document.querySelector("#counter");
const dots = document.querySelector("#dots");
const progressFill = document.querySelector("#progressFill");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const playButton = document.querySelector("#playButton");
const fullscreenButton = document.querySelector("#fullscreenButton");

let currentIndex = 0;
let isPlaying = true;
let isAnswerVisible = false;
let selectedAnswer = null;
let elapsedBeforeStart = 0;
let startedAt = performance.now();
let advanceTimer = null;
let revealTimer = null;
let animationFrame = null;
let pausedByVisibility = false;

function getElapsed() {
  if (!isPlaying) return elapsedBeforeStart;
  return elapsedBeforeStart + (performance.now() - startedAt);
}

function clearClock() {
  window.clearTimeout(advanceTimer);
  window.clearTimeout(revealTimer);
  window.cancelAnimationFrame(animationFrame);
}

function updateProgress() {
  const percentage = Math.min(getElapsed() / SLIDE_DURATION, 1);
  progressFill.style.transform = `scaleX(${percentage})`;

  if (isPlaying && percentage < 1) {
    animationFrame = window.requestAnimationFrame(updateProgress);
  }
}

function scheduleClock({ reset = false } = {}) {
  clearClock();

  if (reset) {
    elapsedBeforeStart = 0;
  }

  startedAt = performance.now();
  updateProgress();

  if (!isPlaying) return;

  const elapsed = elapsedBeforeStart;
  advanceTimer = window.setTimeout(() => goTo(currentIndex + 1), Math.max(0, SLIDE_DURATION - elapsed));

  if (slides[currentIndex].type === "myth" && !isAnswerVisible) {
    const revealIn = ANSWER_REVEAL_TIME - elapsed;
    if (revealIn <= 0) {
      revealAnswer("auto");
    } else {
      revealTimer = window.setTimeout(() => revealAnswer("auto"), revealIn);
    }
  }
}

function introTemplate(slide) {
  return `
    <article class="slide slide--intro" style="--slide-accent: ${slide.accent}">
      <div class="slide__copy">
        <p class="eyebrow">${slide.eyebrow}</p>
        <h1 class="display-title">${slide.title}</h1>
        <p class="intro-copy">${slide.description}</p>
        <p class="intro-note"><span aria-hidden="true">7</span> Una nueva pantalla cada 7 segundos</p>
      </div>
      <figure class="visual-panel" style="--panel-image: url('${slide.image}')">
        <img src="${slide.image}" alt="${slide.imageAlt}" />
        <figcaption class="visual-panel__label">Hablar del suicidio con cuidado, de forma directa y sin prejuicios, puede salvar vidas.</figcaption>
      </figure>
    </article>
  `;
}

function mythTemplate(slide) {
  const isLong = slide.statement.length > 78;
  const responseMessage =
    selectedAnswer === "realidad"
      ? "La respuesta correcta es: mito. "
      : selectedAnswer === "mito"
        ? "Correcto: es un mito. "
        : "Es un mito. ";

  return `
    <article class="slide slide--myth" style="--slide-accent: ${slide.accent}">
      <div class="slide__copy">
        <p class="eyebrow">Mito ${slide.number} · ¿Mito o realidad?</p>
        <h2 class="statement ${isLong ? "statement--long" : ""}">${slide.statement}</h2>
        <p class="choice-prompt">Elige una respuesta o espera para descubrirla:</p>
        <div class="choices" aria-label="Elige mito o realidad">
          <button class="choice-button ${selectedAnswer === "mito" ? "is-selected" : ""}" type="button" data-answer="mito" ${isAnswerVisible ? "disabled" : ""}>Mito</button>
          <button class="choice-button ${selectedAnswer === "realidad" ? "is-selected" : ""}" type="button" data-answer="realidad" ${isAnswerVisible ? "disabled" : ""}>Realidad</button>
        </div>
        <div class="answer-card" ${isAnswerVisible ? "" : "hidden"}>
          <span class="answer-card__verdict">${responseMessage}</span>
          <p>${slide.reality}</p>
        </div>
      </div>
      <aside class="myth-visual" aria-hidden="true">
        <span class="myth-visual__number">${String(slide.number).padStart(2, "0")}</span>
        <div class="word-orbit">
          <strong>${slide.orbit[0]}</strong>
          <span>${slide.orbit[1]}</span>
          <span>${slide.orbit[2]}</span>
          <b class="word-orbit__center">Importa</b>
        </div>
      </aside>
    </article>
  `;
}

function actionsTemplate(slide) {
  return `
    <article class="slide slide--actions" style="--slide-accent: ${slide.accent}">
      <div class="slide__copy">
        <p class="eyebrow">${slide.eyebrow}</p>
        <h2 class="section-title">${slide.title}</h2>
        <ol class="action-list">
          ${slide.actions.map((action) => `<li>${action}</li>`).join("")}
        </ol>
      </div>
      <aside class="quote-panel">
        <span class="quote-panel__symbol" aria-hidden="true">“</span>
        <blockquote>¿Has pensado en quitarte la vida?</blockquote>
        <p>Preguntar directamente puede salvar vidas.</p>
      </aside>
    </article>
  `;
}

function helpTemplate(slide) {
  return `
    <article class="slide slide--help" style="--slide-accent: ${slide.accent}">
      <div class="help-copy">
        <p class="eyebrow">${slide.eyebrow}</p>
        <p class="help-number">*4141</p>
        <h2 class="help-title">${slide.title}</h2>
        <div class="help-meta" aria-label="Características de la línea">
          <span>Gratis</span>
          <span>Confidencial</span>
          <span>24 horas, todos los días</span>
          <span>Desde celulares</span>
        </div>
        <a class="call-button" href="tel:*4141">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7.1 3.8 9.7 3a1.6 1.6 0 0 1 1.9.9l1.2 3a1.6 1.6 0 0 1-.5 1.8l-1.5 1.2a12 12 0 0 0 3.3 3.3l1.2-1.5a1.6 1.6 0 0 1 1.8-.5l3 1.2a1.6 1.6 0 0 1 .9 1.9l-.8 2.6a3 3 0 0 1-3.1 2.1C10.4 18.4 5.6 13.6 5 6.9a3 3 0 0 1 2.1-3.1Z" /></svg>
          Llamar ahora
        </a>
      </div>
      <figure class="visual-panel help-visual" style="--panel-image: url('${slide.image}')">
        <img src="${slide.image}" alt="${slide.imageAlt}" />
        <figcaption class="visual-panel__label">Atención profesional para una crisis de salud mental asociada al suicidio.</figcaption>
      </figure>
    </article>
  `;
}

function renderDots() {
  dots.innerHTML = slides
    .map(
      (_, index) => `
        <button
          class="dot-button"
          type="button"
          aria-label="Ir a la pantalla ${index + 1} de ${slides.length}"
          aria-current="${index === currentIndex}"
          data-slide="${index}"
        ></button>
      `,
    )
    .join("");
}

function renderSlide() {
  const slide = slides[currentIndex];
  document.querySelector(".carousel").style.setProperty("--slide-accent", slide.accent);
  counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;

  if (slide.type === "intro") slideHost.innerHTML = introTemplate(slide);
  if (slide.type === "myth") slideHost.innerHTML = mythTemplate(slide);
  if (slide.type === "actions") slideHost.innerHTML = actionsTemplate(slide);
  if (slide.type === "help") slideHost.innerHTML = helpTemplate(slide);

  renderDots();
}

function goTo(index) {
  currentIndex = (index + slides.length) % slides.length;
  isAnswerVisible = false;
  selectedAnswer = null;
  renderSlide();
  scheduleClock({ reset: true });
}

function revealAnswer(answer) {
  if (slides[currentIndex].type !== "myth" || isAnswerVisible) return;

  elapsedBeforeStart = getElapsed();
  selectedAnswer = answer === "auto" ? null : answer;
  isAnswerVisible = true;
  renderSlide();
  scheduleClock();
}

function setPlaying(nextValue, { visibilityChange = false } = {}) {
  if (nextValue === isPlaying) return;

  if (!nextValue) {
    elapsedBeforeStart = getElapsed();
  }

  isPlaying = nextValue;
  playButton.classList.toggle("is-paused", !isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "Pausar avance automático" : "Reanudar avance automático");
  playButton.querySelector("span").textContent = isPlaying ? "Pausar" : "Continuar";

  if (!visibilityChange) pausedByVisibility = false;
  scheduleClock();
}

previousButton.addEventListener("click", () => goTo(currentIndex - 1));
nextButton.addEventListener("click", () => goTo(currentIndex + 1));
playButton.addEventListener("click", () => setPlaying(!isPlaying));

slideHost.addEventListener("click", (event) => {
  const answerButton = event.target.closest("[data-answer]");
  if (!answerButton) return;
  revealAnswer(answerButton.dataset.answer);
});

dots.addEventListener("click", (event) => {
  const dot = event.target.closest("[data-slide]");
  if (!dot) return;
  goTo(Number(dot.dataset.slide));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") goTo(currentIndex - 1);
  if (event.key === "ArrowRight") goTo(currentIndex + 1);

  if (event.key === " " && !event.target.closest("button, a")) {
    event.preventDefault();
    setPlaying(!isPlaying);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isPlaying) {
    pausedByVisibility = true;
    setPlaying(false, { visibilityChange: true });
  } else if (!document.hidden && pausedByVisibility) {
    pausedByVisibility = false;
    setPlaying(true, { visibilityChange: true });
  }
});

if (!document.documentElement.requestFullscreen) {
  fullscreenButton.hidden = true;
} else {
  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      fullscreenButton.hidden = true;
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.querySelector("span").textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
  });
}

renderSlide();
scheduleClock({ reset: true });
