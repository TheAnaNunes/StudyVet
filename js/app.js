// StudyVet - logica principal do app (trilha + quiz estilo Duolingo)

const XP_PER_CORRECT = 10;
const MAX_HEARTS = 5;

const state = {
  modules: [],       // lista ordenada de modulos
  questionsByModule: {}, // { moduloId: [perguntas ordenadas] }
  progress: null,
  quiz: null,         // estado da licao em andamento
};

const el = (id) => document.getElementById(id);

async function fetchText(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return "";
    return await res.text();
  } catch (e) {
    return "";
  }
}

function isModuleRow(row) {
  return "id_modulo" in row && "titulo" in row && "ordem" in row;
}
function isQuestionRow(row) {
  return "id_pergunta" in row && "id_modulo" in row && "pergunta" in row;
}

async function loadAllData() {
  const [modulosText, perguntasText] = await Promise.all([
    fetchText("data/modulos.csv"),
    fetchText("data/perguntas.csv"),
  ]);

  let modules = modulosText ? parseCSV(modulosText) : [];
  let questions = perguntasText ? parseCSV(perguntasText) : [];

  const imported = Storage.getImportedCSVs();
  Object.values(imported).forEach((text) => {
    const rows = parseCSV(text);
    if (rows.length === 0) return;
    if (isModuleRow(rows[0])) modules = modules.concat(rows);
    else if (isQuestionRow(rows[0])) questions = questions.concat(rows);
  });

  // dedup por id (ultima ocorrencia vence, permite CSV importado sobrescrever)
  modules = dedupById(modules, "id_modulo");
  questions = dedupById(questions, "id_pergunta");

  modules.sort((a, b) => (parseInt(a.ordem) || 0) - (parseInt(b.ordem) || 0));

  const questionsByModule = {};
  questions.forEach((q) => {
    if (!questionsByModule[q.id_modulo]) questionsByModule[q.id_modulo] = [];
    questionsByModule[q.id_modulo].push(q);
  });
  Object.values(questionsByModule).forEach((list) =>
    list.sort((a, b) => (parseInt(a.ordem) || 0) - (parseInt(b.ordem) || 0))
  );

  state.modules = modules.filter((m) => (questionsByModule[m.id_modulo] || []).length > 0);
  state.questionsByModule = questionsByModule;
}

function dedupById(rows, idField) {
  const map = new Map();
  rows.forEach((r) => { if (r[idField]) map.set(r[idField], r); });
  return Array.from(map.values());
}

// ---------- TELA DA TRILHA ----------

function renderPath() {
  state.progress = Storage.getProgress();
  el("streak-count").textContent = state.progress.streak;

  renderModuleList(el("path-list"), { gated: true });
  renderModuleList(el("topics-list"), { gated: false });
}

function renderModuleList(list, { gated }) {
  list.innerHTML = "";

  let lastMateria = null;
  let previousCompleted = true; // primeiro modulo de cada trilha sempre desbloqueado

  state.modules.forEach((mod) => {
    if (mod.materia !== lastMateria) {
      const heading = document.createElement("div");
      heading.className = "subject-heading";
      heading.textContent = mod.materia;
      list.appendChild(heading);
      lastMateria = mod.materia;
    }

    const modProgress = state.progress.modules[mod.id_modulo];
    const completed = !!(modProgress && modProgress.completed);
    const unlocked = !gated || previousCompleted;

    const card = document.createElement("div");
    card.className = "module-card" + (completed ? " done" : "") + (!unlocked ? " locked" : "");

    const totalQ = (state.questionsByModule[mod.id_modulo] || []).length;
    const bestCorrect = modProgress ? modProgress.bestCorrect : 0;
    const pct = totalQ ? Math.round((bestCorrect / totalQ) * 100) : 0;

    card.innerHTML = `
      <div class="module-order">${completed ? "✓" : mod.ordem}</div>
      <div class="module-info">
        <div class="module-title">${escapeHtml(mod.titulo)}</div>
        <div class="module-desc">${escapeHtml(mod.descricao || "")}</div>
        <div class="module-progress"><div class="module-progress-fill" style="width:${pct}%"></div></div>
      </div>
    `;

    if (unlocked) {
      card.addEventListener("click", () => startLesson(mod.id_modulo));
    }

    list.appendChild(card);
    previousCompleted = completed;
  });

  if (state.modules.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:32px 0;">
      Nenhum modulo encontrado. Importe um CSV para comecar.</p>`;
  }
}

function setActiveTab(tab) {
  el("tab-trilha").classList.toggle("active", tab === "trilha");
  el("tab-topicos").classList.toggle("active", tab === "topicos");
  el("path-list").classList.toggle("hidden", tab !== "trilha");
  el("topics-list").classList.toggle("hidden", tab !== "topicos");
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ---------- QUIZ ----------

function startLesson(moduleId) {
  const questions = shuffle([...(state.questionsByModule[moduleId] || [])]);
  state.quiz = {
    moduleId,
    questions,
    index: 0,
    correctCount: 0,
    hearts: MAX_HEARTS,
    selected: null,
    answered: false,
  };
  showScreen("screen-quiz");
  renderQuestion();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuestion() {
  const q = state.quiz;
  const question = q.questions[q.index];

  el("progress-fill").style.width = `${(q.index / q.questions.length) * 100}%`;
  el("hearts").textContent = "❤️".repeat(q.hearts) + "🖤".repeat(MAX_HEARTS - q.hearts);

  el("question-text").textContent = question.pergunta;

  const options = [
    { key: "a", text: question.opcao_a },
    { key: "b", text: question.opcao_b },
    { key: "c", text: question.opcao_c },
    { key: "d", text: question.opcao_d },
  ].filter((o) => o.text);

  const list = el("options-list");
  list.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt.text;
    btn.dataset.key = opt.key;
    btn.addEventListener("click", () => selectOption(opt.key));
    list.appendChild(btn);
  });

  q.selected = null;
  q.answered = false;
  el("feedback-box").className = "feedback-box hidden";
  const actionBtn = el("action-btn");
  actionBtn.textContent = "Verificar";
  actionBtn.className = "action-btn";
  actionBtn.disabled = true;
}

function selectOption(key) {
  const q = state.quiz;
  if (q.answered) return;
  q.selected = key;
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.key === key);
  });
  el("action-btn").disabled = false;
}

function checkAnswer() {
  const q = state.quiz;
  const question = q.questions[q.index];
  const correct = question.resposta_correta.trim().toLowerCase();
  const isCorrect = q.selected === correct;

  q.answered = true;
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.key === correct) btn.classList.add("correct");
    else if (btn.dataset.key === q.selected) btn.classList.add("wrong");
  });

  const feedbackBox = el("feedback-box");
  feedbackBox.className = "feedback-box " + (isCorrect ? "ok" : "fail");
  el("feedback-title").textContent = isCorrect ? "Certinho!" : "Nao foi dessa vez";
  el("feedback-explanation").textContent = question.explicacao || "";

  if (isCorrect) {
    q.correctCount += 1;
  } else {
    q.hearts = Math.max(0, q.hearts - 1);
  }

  const actionBtn = el("action-btn");
  actionBtn.textContent = "Continuar";
  actionBtn.className = "action-btn" + (isCorrect ? "" : " fail-state");
  actionBtn.disabled = false;
}

function advanceQuiz() {
  const q = state.quiz;

  if (!q.answered) { checkAnswer(); return; }

  if (q.hearts <= 0) { finishLesson(false); return; }

  q.index += 1;
  if (q.index >= q.questions.length) { finishLesson(true); return; }

  renderQuestion();
}

function finishLesson(completedAll) {
  const q = state.quiz;
  const xpGained = q.correctCount * XP_PER_CORRECT;
  const total = q.questions.length;
  const outOfHearts = q.hearts <= 0;
  const passed = completedAll && !outOfHearts;

  const progress = Storage.recordLessonResult(q.moduleId, passed ? total : q.correctCount, total, xpGained);
  state.progress = progress;

  el("result-emoji").textContent = outOfHearts ? "💔" : (passed ? "🎉" : "🙂");
  el("result-title").textContent = outOfHearts
    ? "Sem coracoes! Tente de novo"
    : "Licao concluida!";
  el("result-correct").textContent = `${q.correctCount}/${total}`;
  el("result-xp").textContent = xpGained;

  showScreen("screen-result");
}

// ---------- NAVEGACAO ----------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  el(id).classList.remove("hidden");
}

function backToPath() {
  state.quiz = null;
  showScreen("screen-path");
  renderPath();
}

// ---------- IMPORTACAO DE CSV ----------

function setupImport() {
  el("import-btn").addEventListener("click", () => el("import-input").click());
  el("import-input").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const text = await file.text();
      Storage.saveImportedCSV(file.name, text);
    }
    e.target.value = "";
    await loadAllData();
    renderPath();
  });
}

// ---------- INIT ----------

async function init() {
  el("quiz-close").addEventListener("click", backToPath);
  el("action-btn").addEventListener("click", advanceQuiz);
  el("result-continue").addEventListener("click", backToPath);
  el("about-btn").addEventListener("click", () => showScreen("screen-about"));
  el("about-close").addEventListener("click", backToPath);
  el("tab-trilha").addEventListener("click", () => setActiveTab("trilha"));
  el("tab-topicos").addEventListener("click", () => setActiveTab("topicos"));
  setupImport();

  await loadAllData();
  renderPath();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
