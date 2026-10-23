/**
 * Pure cipher, hashing and encryption helpers. Nothing in here touches the DOM.
 * Exposed as CryptoClimb.ciphers.
 */
(function (global) {
  'use strict';

  const app = global.CryptoClimb;
  const { utils } = app;

  const ALPHABET_SIZE = 26;
  const CODE_UPPER_A = 65;
  const CODE_LOWER_A = 97;
  const LETTER_PATTERN = /[A-Za-z]/g;
  const AES_KEY_BITS = 128;
  const AES_IV_BYTES = 12;

  /**
   * Returns the char code of "A" or "a", depending on the letter's case.
   * @param {string} letter A single ASCII letter.
   * @returns {number}
   */
  function alphabetBase(letter) {
    return letter <= 'Z' ? CODE_UPPER_A : CODE_LOWER_A;
  }

  /**
   * Shifts one letter forwards (positive) or backwards (negative), wrapping around.
   * @param {string} letter A single ASCII letter.
   * @param {number} shift
   * @returns {string}
   */
  function shiftLetter(letter, shift) {
    const base = alphabetBase(letter);
    const position = letter.charCodeAt(0) - base;
    const shifted = (((position + shift) % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
    return String.fromCharCode(base + shifted);
  }

  /**
   * Caesar cipher. Use a negative shift to decrypt. Non-letters are left alone.
   * @param {string} text
   * @param {number} shift
   * @returns {string}
   */
  function caesar(text, shift) {
    return text.replace(LETTER_PATTERN, (letter) => shiftLetter(letter, shift));
  }

  /**
   * Atbash cipher: A↔Z, B↔Y, … It is its own inverse.
   * @param {string} text
   * @returns {string}
   */
  function atbash(text) {
    return text.replace(LETTER_PATTERN, (letter) => {
      const base = alphabetBase(letter);
      const position = letter.charCodeAt(0) - base;
      return String.fromCharCode(base + (ALPHABET_SIZE - 1 - position));
    });
  }

  /**
   * Vigenère cipher. The key only advances on letters, so spaces do not consume key characters.
   * @param {string} text
   * @param {string} key Letters only.
   * @param {boolean} [decrypt=false]
   * @returns {string}
   */
  function vigenere(text, key, decrypt = false) {
    const shifts = Array.from(key.toUpperCase(), (char) => char.charCodeAt(0) - CODE_UPPER_A);
    let keyIndex = 0;
    return text.replace(LETTER_PATTERN, (letter) => {
      const shift = shifts[keyIndex % shifts.length];
      keyIndex += 1;
      return shiftLetter(letter, decrypt ? -shift : shift);
    });
  }

  /**
   * XORs the text with a repeating key and returns the result as hex.
   * Unlike Vigenère, the key advances on every character, including spaces.
   * @param {string} text
   * @param {string} key
   * @returns {string}
   */
  function xorToHex(text, key) {
    return Array.from(text, (char, index) => {
      const mixed = char.charCodeAt(0) ^ key.charCodeAt(index % key.length);
      return mixed.toString(16).padStart(2, '0');
    }).join('');
  }

  /**
   * SHA-256 digest of a string, as hex.
   * @param {string} text
   * @returns {Promise<string>}
   */
  async function sha256Hex(text) {
    const digest = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return utils.bytesToHex(new Uint8Array(digest));
  }

  /**
   * Encrypts text with a freshly generated AES-128-GCM key and IV.
   * The 16-byte authentication tag is appended to the ciphertext.
   * @param {string} plaintext
   * @returns {Promise<{keyHex: string, ivHex: string, cipherHex: string}>}
   */
  async function aesGcmEncrypt(plaintext) {
    const { subtle } = global.crypto;
    const key = await subtle.generateKey({ name: 'AES-GCM', length: AES_KEY_BITS }, true, ['encrypt']);
    const rawKey = new Uint8Array(await subtle.exportKey('raw', key));
    const iv = global.crypto.getRandomValues(new Uint8Array(AES_IV_BYTES));
    const cipher = new Uint8Array(
      await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)),
    );

    return {
      keyHex: utils.bytesToHex(rawKey),
      ivHex: utils.bytesToHex(iv),
      cipherHex: utils.bytesToHex(cipher),
    };
  }

  app.ciphers = Object.freeze({ caesar, atbash, vigenere, xorToHex, sha256Hex, aesGcmEncrypt });
})(window);
