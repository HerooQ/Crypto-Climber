/**
 * Supplies the plaintext words used to generate puzzles.
 * Tries a public random-word API first and falls back to a built-in list.
 * Exposed as CryptoClimb.words.
 */
(function (global) {
  'use strict';

  const app = global.CryptoClimb;
  const { utils } = app;

  const API_URL = 'https://random-word-api.herokuapp.com/word?number=30&diff=1';
  const REQUEST_TIMEOUT_MS = 5000;
  const MIN_USABLE_WORDS = 12;
  const USABLE_WORD_PATTERN = /^[a-z]{4,9}$/;

  const FALLBACK_WORDS = Object.freeze([
    'planet', 'silver', 'castle', 'forest', 'rocket', 'window', 'candle', 'bridge', 'pencil',
    'garden', 'thunder', 'coffee', 'winter', 'orange', 'marble', 'island', 'dragon', 'button',
    'circle', 'violet',
  ]);

  /**
   * Loads words from the API, or the fallback list if it is slow, down or returns junk.
   * @returns {Promise<{words: string[], source: 'api' | 'fallback'}>}
   */
  async function load() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Word API responded with ${response.status}`);
      }

      const payload = await response.json();
      const words = [...new Set(
        payload
          .filter((word) => typeof word === 'string')
          .map((word) => word.toLowerCase())
          .filter((word) => USABLE_WORD_PATTERN.test(word)),
      )];
      if (words.length < MIN_USABLE_WORDS) {
        throw new Error('Word API returned too few usable words');
      }

      return { words, source: 'api' };
    } catch (error) {
      return { words: [...FALLBACK_WORDS], source: 'fallback' };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Creates a pool that hands out unique words and reshuffles when it runs dry,
   * so a puzzle never receives an undefined or repeated word.
   * @param {readonly string[]} words At least as many unique words as the largest request.
   * @returns {{take: function(number): string[]}}
   */
  function createPool(words) {
    let queue = [];

    return {
      take(count) {
        const taken = [];
        while (taken.length < count) {
          if (queue.length === 0) {
            queue = utils.shuffle(words);
          }
          const next = queue.pop();
          if (!taken.includes(next)) {
            taken.push(next);
          }
        }
        return taken;
      },
    };
  }

  app.words = Object.freeze({ load, createPool });
})(window);
