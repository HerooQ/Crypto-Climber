/**
 * Turns a stage definition into a concrete puzzle: what to display and how to check an answer.
 * Exposed as CryptoClimb.challenges.
 *
 * Every builder returns:
 *   data       Text shown in the puzzle's code block.
 *   note       Optional { label, value } line (a known shift or key, or the hash candidates).
 *   isCorrect  (answer: string) => boolean | Promise<boolean>
 */
(function (global) {
  'use strict';

  const app = global.CryptoClimb;
  const { utils, ciphers } = app;

  const HIDDEN_KEYS = Object.freeze(['KEY', 'SUN', 'MAP', 'CAT', 'ICE', 'RED']);
  const HIDDEN_SHIFT_RANGE = Object.freeze({ min: 1, max: 25 });
  const HASH_CANDIDATE_COUNT = 4;
  const ACCEPTED_PRIMITIVE_ANSWERS = Object.freeze(['sha-256', 'sha256', 'sha 256']);

  /**
   * Builds a checker that compares the player's answer with the expected text.
   * @param {string} expected
   * @returns {function(string): boolean}
   */
  function matches(expected) {
    const target = utils.normalise(expected);
    return (answer) => utils.normalise(answer) === target;
  }

  /** @type {Record<string, function(object, {take: function(number): string[]}): Promise<object>>} */
  const builders = {
    async caesar(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      return {
        data: ciphers.caesar(plain, stage.shift),
        note: { label: 'Shift:', value: String(stage.shift) },
        isCorrect: matches(plain),
      };
    },

    async unknownCaesar(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      const shift = utils.randomInt(HIDDEN_SHIFT_RANGE.min, HIDDEN_SHIFT_RANGE.max);
      return {
        data: ciphers.caesar(plain, shift),
        note: null,
        isCorrect: matches(plain),
      };
    },

    async atbash(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      return {
        data: ciphers.atbash(plain),
        note: null,
        isCorrect: matches(plain),
      };
    },

    async vigenere(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      return {
        data: ciphers.vigenere(plain, stage.key),
        note: { label: 'Key:', value: stage.key },
        isCorrect: matches(plain),
      };
    },

    async unknownVigenere(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      const key = utils.pick(HIDDEN_KEYS);
      return {
        data: ciphers.vigenere(plain, key),
        note: null,
        isCorrect: matches(plain),
      };
    },

    async xor(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      return {
        data: ciphers.xorToHex(plain, stage.key),
        note: { label: 'Key:', value: stage.key },
        isCorrect: matches(plain),
      };
    },

    async unknownXor(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      const key = utils.pick(HIDDEN_KEYS);
      return {
        data: ciphers.xorToHex(plain, key),
        note: null,
        isCorrect: matches(plain),
      };
    },

    async hash(stage, pool) {
      const [answer, ...decoys] = pool.take(HASH_CANDIDATE_COUNT);
      const candidates = utils.shuffle([answer, ...decoys]);
      return {
        data: await ciphers.sha256Hex(answer),
        note: { label: 'Candidates:', value: candidates.join(' · ') },
        isCorrect: matches(answer),
      };
    },

    async aes(stage, pool) {
      const plain = pool.take(stage.wordCount).join(' ');
      const { keyHex, ivHex, cipherHex } = await ciphers.aesGcmEncrypt(plain);
      return {
        data: `KEY (hex): ${keyHex}\nIV (hex):  ${ivHex}\nCIPHER:     ${cipherHex}`,
        note: null,
        isCorrect: matches(plain),
      };
    },

    async identify() {
      return {
        data: 'One-way function. No secret key. Fixed 256-bit digest. No decryption operation.',
        note: null,
        isCorrect: (answer) => ACCEPTED_PRIMITIVE_ANSWERS.includes(utils.normalise(answer)),
      };
    },
  };

  /**
   * Generates the puzzle for a stage.
   * @param {object} stage An entry from CryptoClimb.stages.
   * @param {{take: function(number): string[]}} pool Word pool from CryptoClimb.words.createPool.
   * @returns {Promise<{data: string, note: ({label: string, value: string}|null), isCorrect: function(string): (boolean|Promise<boolean>)}>}
   */
  async function build(stage, pool) {
    const builder = builders[stage.type];
    if (!builder) {
      throw new Error(`Unknown stage type: ${stage.type}`);
    }
    return builder(stage, pool);
  }

  app.challenges = Object.freeze({ build });
})(window);
