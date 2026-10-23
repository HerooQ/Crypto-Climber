/**
 * UI controller: owns the game state, wires up events and renders the page.
 * All attempt counts live in memory only and disappear when the tab closes.
 */
(function (global) {
  'use strict';

  const { utils, words, stages, challenges } = global.CryptoClimb;

  const ADVANCE_DELAY_MS = 650;
  const TIMER_INTERVAL_MS = 1000;
  const STATUS_LOADING = 'Getting fresh challenge material…';
  const STATUS_API = 'Fresh challenge material loaded from the public word API.';
  const STATUS_FALLBACK = 'API unavailable — using the built-in offline fallback list.';

  const state = {
    runId: 0, // Bumped on every (re)start so stale async work can be ignored.
    levelIndex: 0,
    attempts: [],
    challenge: null,
    pool: null,
    locked: true,
    startedAt: 0,
    timerId: null,
  };

  const dom = {};

  /* ------------------------------------------------------------------ */
  /* DOM helpers                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * @param {string} id
   * @returns {HTMLElement}
   */
  function byId(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing element #${id}`);
    }
    return element;
  }

  /**
   * Creates an element. Text is always inserted as text, never as HTML.
   * @param {string} tag
   * @param {{text?: string}} [options]
   * @param {...(Node|string)} children
   * @returns {HTMLElement}
   */
  function createElement(tag, options = {}, ...children) {
    const element = document.createElement(tag);
    if (options.text !== undefined) {
      element.textContent = options.text;
    }
    element.append(...children);
    return element;
  }

  function cacheDom() {
    Object.assign(dom, {
      levelNumber: byId('level-number'),
      levelTotal: byId('level-total'),
      attemptCount: byId('attempt-count'),
      elapsed: byId('elapsed'),
      progress: byId('progress'),
      progressBar: byId('progress-bar'),
      status: byId('status'),
      restartTop: byId('restart-top'),

      game: byId('game'),
      levelTag: byId('level-tag'),
      levelTitle: byId('level-title'),
      levelExplain: byId('level-explain'),
      levelExamples: byId('level-examples'),
      levelTask: byId('level-task'),
      levelData: byId('level-data'),
      levelNote: byId('level-note'),
      levelNoteLabel: byId('level-note-label'),
      levelNoteValue: byId('level-note-value'),
      levelHint: byId('level-hint'),
      hintDetails: byId('level-hint-details'),
      form: byId('answer-form'),
      answer: byId('answer'),
      submit: byId('submit'),
      feedback: byId('feedback'),

      results: byId('results'),
      resultsTitle: byId('results-title'),
      resultsSummary: byId('results-summary'),
      resultsBody: byId('results-body'),
      restartResults: byId('restart-results'),
    });
  }

  /* ------------------------------------------------------------------ */
  /* Stats, timer and progress                                           */
  /* ------------------------------------------------------------------ */

  function totalAttempts() {
    return state.attempts.reduce((sum, count) => sum + count, 0);
  }

  function elapsedSeconds() {
    return Math.floor((Date.now() - state.startedAt) / 1000);
  }

  function updateStats() {
    dom.levelNumber.textContent = String(Math.min(state.levelIndex + 1, stages.length));
    dom.attemptCount.textContent = String(totalAttempts());
    dom.elapsed.textContent = utils.formatClock(elapsedSeconds());
  }

  /**
   * @param {number} percent 0–100
   */
  function setProgress(percent) {
    dom.progressBar.style.width = `${percent}%`;
    dom.progress.setAttribute('aria-valuenow', String(Math.round(percent)));
  }

  function startTimer() {
    stopTimer();
    state.timerId = global.setInterval(updateStats, TIMER_INTERVAL_MS);
  }

  function stopTimer() {
    if (state.timerId !== null) {
      global.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * @param {string} message
   * @param {'good'|'bad'|''} tone
   */
  function setFeedback(message, tone) {
    dom.feedback.textContent = message;
    dom.feedback.classList.toggle('feedback--good', tone === 'good');
    dom.feedback.classList.toggle('feedback--bad', tone === 'bad');
  }

  function renderLevel(stage, challenge) {
    dom.levelTag.textContent = `Level ${state.levelIndex + 1} · ${stage.difficulty}`;
    dom.levelTitle.textContent = stage.title;
    dom.levelExplain.textContent = stage.explanation;
    dom.levelExamples.textContent = stage.examples.join('\n');
    dom.levelTask.textContent = stage.task;
    dom.levelData.textContent = challenge.data;
    dom.levelHint.textContent = stage.hint;
    dom.hintDetails.open = false;

    const { note } = challenge;
    dom.levelNote.hidden = !note;
    dom.levelNoteLabel.textContent = note ? note.label : '';
    dom.levelNoteValue.textContent = note ? note.value : '';

    dom.answer.value = '';
    dom.answer.disabled = false;
    dom.submit.disabled = false;
    setFeedback('', '');
    setProgress((state.levelIndex / stages.length) * 100);
    updateStats();
    dom.answer.focus();
  }

  function renderResults() {
    const total = totalAttempts();

    dom.resultsSummary.replaceChildren(
      'You finished in ',
      createElement('strong', { text: utils.formatClock(elapsedSeconds()) }),
      ' with ',
      createElement('strong', { text: String(total) }),
      ' total attempts.',
    );

    const rows = stages.map((stage, index) => createElement(
      'tr',
      {},
      createElement('td', { text: String(index + 1) }),
      createElement('td', { text: stage.title }),
      createElement('td', {}, createElement('strong', { text: String(state.attempts[index]) })),
    ));
    dom.resultsBody.replaceChildren(...rows);
  }

  /* ------------------------------------------------------------------ */
  /* Game flow                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * @param {number} runId
   */
  async function showLevel(runId) {
    const stage = stages[state.levelIndex];
    state.locked = true;

    try {
      const challenge = await challenges.build(stage, state.pool);
      if (runId !== state.runId) {
        return;
      }
      state.challenge = challenge;
      renderLevel(stage, challenge);
      state.locked = false;
    } catch (error) {
      if (runId === state.runId) {
        setFeedback(`Could not generate this challenge: ${error.message}`, 'bad');
      }
    }
  }

  /**
   * @param {number} runId
   */
  function advance(runId) {
    if (runId !== state.runId) {
      return;
    }
    if (state.levelIndex === stages.length - 1) {
      finish();
      return;
    }
    state.levelIndex += 1;
    showLevel(runId);
  }

  function finish() {
    stopTimer();
    state.challenge = null;
    updateStats();
    setProgress(100);
    renderResults();
    dom.game.hidden = true;
    dom.results.hidden = false;
    dom.resultsTitle.focus();
  }

  /**
   * @param {SubmitEvent} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    if (state.locked || !state.challenge) {
      return;
    }

    const answer = dom.answer.value.trim();
    if (!answer) {
      return;
    }

    const { runId, levelIndex } = state;
    state.locked = true;
    state.attempts[levelIndex] += 1;
    updateStats();

    let correct = false;
    try {
      correct = await state.challenge.isCorrect(answer);
    } catch (error) {
      correct = false;
    }
    if (runId !== state.runId) {
      return;
    }

    const count = state.attempts[levelIndex];
    if (correct) {
      setFeedback(`Correct — ${count} attempt${count === 1 ? '' : 's'}!`, 'good');
      dom.answer.disabled = true;
      dom.submit.disabled = true;
      global.setTimeout(() => advance(runId), ADVANCE_DELAY_MS);
    } else {
      setFeedback(`Not quite. Attempt #${count}.`, 'bad');
      state.locked = false;
      dom.answer.select();
    }
  }

  async function startGame() {
    state.runId += 1;
    const { runId } = state;

    stopTimer();
    state.levelIndex = 0;
    state.attempts = stages.map(() => 0);
    state.challenge = null;
    state.locked = true;
    state.startedAt = Date.now();

    dom.results.hidden = true;
    dom.game.hidden = false;
    dom.status.textContent = STATUS_LOADING;
    setFeedback('', '');
    setProgress(0);
    updateStats();

    const { words: wordList, source } = await words.load();
    if (runId !== state.runId) {
      return;
    }

    state.pool = words.createPool(wordList);
    dom.status.textContent = source === 'api' ? STATUS_API : STATUS_FALLBACK;
    state.startedAt = Date.now(); // Start the clock once the puzzles are ready.
    startTimer();
    await showLevel(runId);
  }

  function init() {
    cacheDom();
    dom.levelTotal.textContent = String(stages.length);
    dom.form.addEventListener('submit', handleSubmit);
    dom.restartTop.addEventListener('click', startGame);
    dom.restartResults.addEventListener('click', startGame);
    startGame();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
