// Persistencia local (localStorage) de progresso, streak e CSVs importados pelo usuario.
const Storage = (() => {
  const KEY_PROGRESS = "studyvet_progress_v1";
  const KEY_IMPORTS = "studyvet_imports_v1";

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function getProgress() {
    try {
      const raw = localStorage.getItem(KEY_PROGRESS);
      if (!raw) return defaultProgress();
      const parsed = JSON.parse(raw);
      return { ...defaultProgress(), ...parsed };
    } catch (e) {
      return defaultProgress();
    }
  }

  function defaultProgress() {
    return { xp: 0, streak: 0, lastStudyDate: null, modules: {} };
  }

  function saveProgress(progress) {
    localStorage.setItem(KEY_PROGRESS, JSON.stringify(progress));
  }

  function touchStreak() {
    const progress = getProgress();
    const today = todayStr();
    if (progress.lastStudyDate === today) {
      saveProgress(progress);
      return progress;
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (progress.lastStudyDate === yesterday) {
      progress.streak += 1;
    } else {
      progress.streak = 1;
    }
    progress.lastStudyDate = today;
    saveProgress(progress);
    return progress;
  }

  function recordLessonResult(moduleId, correctCount, totalCount, xpGained) {
    const progress = getProgress();
    const prev = progress.modules[moduleId] || { bestCorrect: 0, totalQuestions: totalCount, completed: false, attempts: 0 };
    progress.modules[moduleId] = {
      bestCorrect: Math.max(prev.bestCorrect, correctCount),
      totalQuestions: totalCount,
      completed: prev.completed || correctCount === totalCount,
      attempts: (prev.attempts || 0) + 1,
    };
    progress.xp += xpGained;
    saveProgress(progress);
    return touchStreak();
  }

  function getImportedCSVs() {
    try {
      const raw = localStorage.getItem(KEY_IMPORTS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveImportedCSV(filename, text) {
    const imports = getImportedCSVs();
    imports[filename] = text;
    localStorage.setItem(KEY_IMPORTS, JSON.stringify(imports));
  }

  return { getProgress, saveProgress, recordLessonResult, touchStreak, getImportedCSVs, saveImportedCSV };
})();
