/**
 * Small, dependency-free helpers shared by the other modules.
 * Exposed as CryptoClimb.utils.
 */
(function (global) {
  'use strict';

  const app = (global.CryptoClimb = global.CryptoClimb || {});

  /**
   * Lower-cases, trims and collapses whitespace so answers compare fairly.
   * @param {string} text
   * @returns {string}
   */
  function normalise(text) {
    return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Converts bytes to a lower-case hexadecimal string.
   * @param {ArrayLike<number>} bytes
   * @returns {string}
   */
  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Random integer between min and max, both inclusive.
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Picks one random element from a non-empty list.
   * @template T
   * @param {readonly T[]} list
   * @returns {T}
   */
  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  /**
   * Returns a shuffled copy of the list (Fisher–Yates). The input is not modified.
   * @template T
   * @param {readonly T[]} list
   * @returns {T[]}
   */
  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Formats a number of seconds as mm:ss.
   * @param {number} totalSeconds
   * @returns {string}
   */
  function formatClock(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  app.utils = Object.freeze({ normalise, bytesToHex, randomInt, pick, shuffle, formatClock });
})(window);
