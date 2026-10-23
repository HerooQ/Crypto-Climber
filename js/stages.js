/**
 * The level definitions. This file is data only: edit it to add, remove or reorder puzzles.
 * Level numbers are derived from the position in the list, so nothing needs renumbering.
 *
 * Fields
 *   type         Which builder in challenges.js generates the puzzle.
 *   title        Heading shown on the level card and in the results table.
 *   difficulty   Short label shown beside the level number.
 *   explanation  The "What you need to know" text.
 *   examples     Worked examples, one per line.
 *   task         What the player has to do.
 *   hint         Shown inside the collapsible hint.
 *   shift / key  Known values (only for levels where they are shown to the player).
 *   wordCount    How many generated words make up the plaintext.
 *
 * Exposed as CryptoClimb.stages.
 */
(function (global) {
  'use strict';

  const app = global.CryptoClimb;

  const STAGES = [
    {
      type: 'caesar',
      title: 'Caesar I — Warm-up',
      difficulty: 'Very easy',
      explanation: 'A Caesar cipher shifts every letter by a fixed amount. To decrypt, move letters backwards by the same shift.',
      examples: [
        'Example 1: CAT +3 → FDW',
        'Example 2: HELLO +1 → IFMMP',
        'Example 3: FDW -3 → CAT',
      ],
      task: 'Decrypt the generated ciphertext. The shift is shown below.',
      hint: 'Move each letter back by the shown shift.',
      shift: 3,
      wordCount: 1,
    },
    {
      type: 'caesar',
      title: 'Caesar II — Longer message',
      difficulty: 'Easy',
      explanation: 'The same rule works on phrases. Spaces and punctuation stay unchanged.',
      examples: [
        'Example 1: DOG +2 → FQI',
        'Example 2: MEET ME +4 → QIIX QI',
        'Example 3: QIIX QI -4 → MEET ME',
      ],
      task: 'Decrypt the generated phrase using the shown shift.',
      hint: 'Subtract the shift from every letter.',
      shift: 7,
      wordCount: 2,
    },
    {
      type: 'atbash',
      title: 'Atbash — Mirror alphabet',
      difficulty: 'Easy',
      explanation: 'Atbash swaps each letter with its mirror image in the alphabet (A↔Z, B↔Y, C↔X…). There is no key, and applying it twice returns the original text.',
      examples: [
        'Example 1: A → Z, B → Y',
        'Example 2: HELLO → SVOOL',
        'Example 3: SVOOL → HELLO (same operation both ways)',
      ],
      task: 'Decrypt the generated Atbash ciphertext.',
      hint: 'Map each letter to its mirror: position from the end matches position from the start.',
      wordCount: 1,
    },
    {
      type: 'unknownCaesar',
      title: 'Caesar III — Hidden shift',
      difficulty: 'Easy+',
      explanation: 'The shift is no longer given. There are only 25 useful shifts, so trying them systematically is practical.',
      examples: [
        'Example 1: KHOOR → HELLO with -3',
        'Example 2: FDW → CAT with -3',
        'Example 3: Spaces remain spaces.',
      ],
      task: 'Decrypt the ciphertext without being told the shift.',
      hint: 'Try the possible shifts and look for normal English.',
      wordCount: 1,
    },
    {
      type: 'vigenere',
      title: 'Vigenère — Keyed cipher',
      difficulty: 'Medium',
      explanation: "A Vigenère cipher is a Caesar cipher whose shift changes with each letter, driven by a repeating keyword. Each key letter sets that position's shift (A=0, B=1…).",
      examples: [
        'Example 1: key LOCK, plaintext D → shift by L(11) → O',
        'Example 2: HELLO with key ABC → HFNLP',
        'Example 3: The key repeats: L,O,C,K,L,O,C,K…',
      ],
      task: 'Decrypt the generated ciphertext. The key is shown below.',
      hint: "Subtract each key letter's value from the matching ciphertext letter.",
      key: 'LOCK',
      wordCount: 1,
    },
    {
      type: 'xor',
      title: 'XOR — Repeating key',
      difficulty: 'Medium',
      explanation: 'XOR combines plaintext bytes with key bytes. XOR with the same key again reverses the operation.',
      examples: [
        'Example 1: 0x41 XOR 0x10 = 0x51',
        'Example 2: 0x51 XOR 0x10 = 0x41',
        'Example 3: A repeating key cycles through its characters.',
      ],
      task: 'Decrypt the hex ciphertext with the shown repeating key.',
      hint: 'Read two hex characters at a time and XOR with each key letter in turn.',
      key: 'KEY',
      wordCount: 1,
    },
    {
      type: 'unknownVigenere',
      title: 'Vigenère — Hidden key',
      difficulty: 'Medium+',
      explanation: 'Now the keyword is hidden. Short, common keywords are worth trying systematically against the ciphertext.',
      examples: [
        'Example 1: The key is a common 3-letter English word',
        'Example 2: Try each candidate key and check if the result reads as English',
        'Example 3: The key repeats across the whole message.',
      ],
      task: 'Recover the plaintext. The key is a common three-letter English word.',
      hint: 'Try common three-letter keys and look for readable text.',
      wordCount: 2,
    },
    {
      type: 'unknownXor',
      title: 'XOR — Hidden key',
      difficulty: 'Medium+',
      explanation: 'Now the three-letter repeating key is hidden. Weak repeating-key XOR leaks patterns, so readable plaintext can help reveal the key.',
      examples: [
        'Example 1: positions 1,4,7… use the same key byte',
        'Example 2: Known plaintext can reveal a key byte',
        'Example 3: Short keys create repeating patterns.',
      ],
      task: 'Recover the plaintext. The key is a common three-letter English word.',
      hint: 'Try common three-letter keys and look for readable text.',
      wordCount: 2,
    },
    {
      type: 'hash',
      title: 'SHA-256 — Hash, don’t decrypt',
      difficulty: 'Hard',
      explanation: 'A cryptographic hash is a one-way fingerprint. You do not decrypt SHA-256; you hash candidates and compare their digests.',
      examples: [
        'Example 1: SHA-256("hello") begins 2cf24dba…',
        'Example 2: A tiny input change gives a very different digest',
        'Example 3: candidate → hash → compare',
      ],
      task: 'Which candidate word produces the displayed SHA-256 digest?',
      hint: 'Hash each supplied candidate and compare.',
    },
    {
      type: 'aes',
      title: 'AES-GCM — Encryption',
      difficulty: 'Hard+',
      explanation: 'AES is symmetric encryption: the same secret key protects both directions. GCM also authenticates the ciphertext so tampering is detected.',
      examples: [
        'Example 1: plaintext + key + IV → ciphertext',
        'Example 2: ciphertext + same key + IV → plaintext',
        'Example 3: wrong/tampered ciphertext fails authentication',
      ],
      task: 'Decrypt the generated AES-GCM ciphertext with the supplied key and IV.',
      hint: 'Use AES-GCM with the displayed 128-bit key and 12-byte IV. The last 16 bytes (32 hex characters) of the ciphertext are the GCM authentication tag, which most tools expect to be appended exactly like this.',
      wordCount: 2,
    },
    {
      type: 'identify',
      title: 'Final — Identify the primitive',
      difficulty: 'Boss',
      explanation: 'Distinguish encoding, hashing and encryption by asking whether there is a key, whether the operation is intended to be reversible, and whether the output is a fixed-length digest.',
      examples: [
        'Example 1: Base64 → reversible without key → encoding',
        'Example 2: AES-GCM → reversible with key → encryption',
        'Example 3: SHA-256 → fixed 256-bit digest → hashing',
      ],
      task: 'Identify the primitive described below.',
      hint: 'It is one-way, has no decryption step, and produces a fixed 256-bit digest.',
    },
  ];

  app.stages = Object.freeze(STAGES.map((stage) => Object.freeze(stage)));
})(window);
