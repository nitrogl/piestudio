/**
 * Tokenizer of the ProVerif typed language, following pitlexer.mll of
 * ProVerif 2.05.
 *
 * Reproduces the longest-match behaviour of ocamllex: "inj-event",
 * "optim-if", "is-cst", "<-R", "1-proj-f" and floating point literals are
 * single tokens. Comments nest and must be closed (ProVerif 2.04 and later).
 * Unlike ProVerif, it does not stop at the first lexical error: it reports it,
 * skip the offending character and go on, so that the editor can show every
 * problem.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvLexer {
  src: string;
  options: any;
  tokens: any[];
  comments: any[];
  errors: any[];
  pos: number;

  /**
   * Prepares to scan a text.
   *
   * @param {string} src The source text.
   * @param {Object} options {allowTilde: boolean}: whether identifiers may
   *   start with ~ (ProVerif's -allow-tilde).
   */
  constructor(src: string, options: any = {}) {
    this.src = src;
    this.options = options;
    this.tokens = [];
    this.comments = [];
    this.errors = [];
    this.pos = 0;
  }

  /**
   * Tokenizes a text in one call.
   *
   * @param {string} src The source text.
   * @param {Object} options Lexing options, see the constructor.
   * @return {Object} {tokens, comments, errors}.
   */
  static tokenize(src: string, options: any = {}) {
    return new PvLexer(src, options).run();
  }

  /**
   * Tells whether a character may continue an identifier.
   *
   * @param {string} c A one-character string (or undefined).
   * @return {boolean} True for letters, digits, '_', the prime and the
   *   Latin-1 letters of pitlexer.mll.
   */
  static isIdentChar(c: string): boolean {
    if (c === undefined || c === "") {
      return false;
    }
    if (PvLexer.isLetter(c) || PvLexer.isDigit(c) || c === "_" || c === "'") {
      return true;
    }
    const code = c.charCodeAt(0);
    return (code >= 192 && code <= 214) || (code >= 216 && code <= 246) || (code >= 248 && code <= 255);
  }

  /**
   * Tells whether a character is an ASCII letter.
   *
   * @param {string} c A one-character string.
   * @return {boolean} True for a-z and A-Z.
   */
  static isLetter(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
  }

  /**
   * Tells whether a character is a decimal digit.
   *
   * @param {string} c A one-character string.
   * @return {boolean} True for 0-9.
   */
  static isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  /**
   * Tells whether a text is a valid ProVerif identifier (and not a keyword).
   *
   * @param {string} s The candidate.
   * @return {boolean} True when s can name a variable, a function, a type...
   */
  static isIdentifier(s: string): boolean {
    if (typeof s !== "string" || !s.length || !PvLexer.isLetter(s[0])) {
      return false;
    }
    for (let i = 1; i < s.length; i++) {
      if (!PvLexer.isIdentChar(s[i])) {
        return false;
      }
    }
    return !PvToken.KEYWORDS.has(s) && !/^(inj-event|optim-if|is-cst)/.test(s);
  }

  /**
   * Records a token.
   *
   * @param {string} type Token type.
   * @param {string} value Token value.
   * @param {number} start First offset.
   * @param {number} end Offset after the token.
   */
  push(type: string, value: any, start: number, end: number) {
    this.tokens.push(new PvToken(type, value, start, end));
  }

  /**
   * Records a lexical error.
   *
   * @param {string} message The ProVerif message.
   * @param {number} start First offset.
   * @param {number} end Offset after the faulty text.
   */
  error(message: string, start: number, end: number) {
    this.errors.push({ message, start, end, severity: "error", lexical: true });
  }

  /**
   * Scans the whole text.
   *
   * @return {Object} {tokens, comments, errors}.
   */
  run() {
    const src = this.src;
    const n = src.length;
    while (this.pos < n) {
      const i = this.pos;
      const c = src[i];
      if (c === " " || c === "\t" || c === "\f" || c === "\n" || c === "\r") {
        this.pos++;
        continue;
      }
      if (c === "(" && src[i + 1] === "*") {
        this.scanComment();
        continue;
      }
      if (PvLexer.isLetter(c)) {
        this.scanWord();
        continue;
      }
      if (PvLexer.isDigit(c)) {
        this.scanNumber();
        continue;
      }
      if (c === "~") {
        this.scanTilde();
        continue;
      }
      if (c === "\"") {
        this.scanString();
        continue;
      }
      if (this.scanSymbol()) {
        continue;
      }
      this.error("Illegal character", i, i + 1);
      this.pos++;
    }
    this.push("EOF", null, n, n);
    return { tokens: this.tokens, comments: this.comments, errors: this.errors };
  }

  /**
   * Skips a comment, honouring nesting; an unclosed comment is an error at
   * its innermost opener.
   */
  scanComment() {
    const src = this.src;
    const n = src.length;
    const start = this.pos;
    const openers = [start];
    let i = start + 2;
    while (i < n && openers.length) {
      if (src[i] === "*" && src[i + 1] === ")") {
        openers.pop();
        i += 2;
        continue;
      }
      if (src[i] === "(" && src[i + 1] === "*") {
        openers.push(i);
        i += 2;
        continue;
      }
      i++;
    }
    if (openers.length) {
      const o = openers[openers.length - 1];
      this.error("Unterminated comment", o, o + 2);
      i = n;
    }
    this.comments.push({ start, end: i, text: src.slice(start, i) });
    this.pos = i;
  }

  /**
   * Scans an identifier or a keyword, or one of the dashed tokens inj-event,
   * optim-if and is-cst.
   */
  scanWord() {
    const src = this.src;
    const i = this.pos;
    for (const [word, type] of PvLexer.DASHED) {
      if (src.startsWith(word, i)) {
        this.push(type, word, i, i + word.length);
        this.pos = i + word.length;
        return;
      }
    }
    let j = i + 1;
    while (j < src.length && PvLexer.isIdentChar(src[j])) {
      j++;
    }
    const s = src.slice(i, j);
    const kw = PvToken.KEYWORDS.get(s);
    this.push(kw || "IDENT", s, i, j);
    this.pos = j;
  }

  /**
   * Scans an integer, a floating point number or a projection such as
   * 1-proj-pair.
   */
  scanNumber() {
    const src = this.src;
    const n = src.length;
    const i = this.pos;
    let j = i;
    while (j < n && PvLexer.isDigit(src[j])) {
      j++;
    }
    // projection: [0-9]+ "-proj-" [a-zA-Z0-9] [identchars | '-']*
    if (src.startsWith("-proj-", j) && j + 6 < n && (PvLexer.isLetter(src[j + 6]) || PvLexer.isDigit(src[j + 6]))) {
      let k = j + 7;
      while (k < n && (PvLexer.isIdentChar(src[k]) || src[k] === "-")) {
        k++;
      }
      this.push("PROJECTION", src.slice(i, k), i, k);
      this.pos = k;
      return;
    }
    const f = this.floatEnd(j);
    if (f > j) {
      const text = src.slice(i, f);
      this.push("FLOAT", Number(text), i, f);
      this.pos = f;
      return;
    }
    const text = src.slice(i, j);
    const v = Number(text);
    // OCaml's int_of_string on 63-bit integers
    if (!Number.isSafeInteger(v) && BigInt(text) > 4611686018427387903n) {
      this.error("Incorrect integer", i, j);
    }
    this.push("INT", v, i, j);
    this.pos = j;
  }

  /**
   * Finds where a floating point literal ends, after the digits ending at j.
   *
   * @param {number} j Offset after the leading digits.
   * @return {Object} The end of the float literal, or j when the digits are
   *   an integer.
   */
  floatEnd(j: number) {
    const src = this.src;
    const n = src.length;
    const digits = k => {
      while (k < n && PvLexer.isDigit(src[k])) {
        k++;
      }

      return k;
    };
    const exponent = k => {
      if (src[k] !== "e" && src[k] !== "E") {
        return -1;
      }
      let m = k + 1;
      if (src[m] === "+" || src[m] === "-") {
        m++;
      }
      const e = digits(m);
      return e > m ? e : -1;
    };
    let best = j;
    // '.' [0-9]+
    if (src[j] === "." && PvLexer.isDigit(src[j + 1])) {
      best = Math.max(best, digits(j + 1));
    }
    // ('.' [0-9]*)? [eE] [+-]? [0-9]+
    const e1 = exponent(j);
    if (e1 > 0) {
      best = Math.max(best, e1);
    }
    if (src[j] === ".") {
      const e2 = exponent(digits(j + 1));
      if (e2 > 0) {
        best = Math.max(best, e2);
      }
    }
    return best;
  }

  /**
   * Scans an identifier starting with ~, which ProVerif accepts only with
   * -allow-tilde.
   */
  scanTilde() {
    const src = this.src;
    const i = this.pos;
    let j = i + 1;
    while (j < src.length && PvLexer.isIdentChar(src[j])) {
      j++;
    }
    if (!this.options.allowTilde) {
      this.error("~ not allowed.", i, j);
    }
    this.push("IDENT", src.slice(i, j), i, j);
    this.pos = j;
  }

  /**
   * Scans a string literal with its escapes; newlines are allowed inside
   * strings.
   */
  scanString() {
    const src = this.src;
    const n = src.length;
    const start = this.pos;
    let i = start + 1;
    let s = "";
    let closed = false;
    while (i < n) {
      const d = src[i];
      if (d === "\"") {
        closed = true;
        i++;
        break;
      }
      if (d === "\\") {
        const e = src[i + 1];
        if (e !== undefined && e in PvLexer.ESCAPES) {
          s += PvLexer.ESCAPES[e];
          i += 2;
          continue;
        }
        this.error("Illegal escape", i, Math.min(i + 2, n));
        i += 2;
        continue;
      }
      s += d;
      i++;
    }
    if (!closed) {
      this.error("Unterminated string", n, n);
    }
    this.push("STRING", s, start, Math.min(i, n));
    this.pos = Math.min(i, n);
  }

  /**
   * Scans a symbol, preferring the longest one that matches.
   *
   * @return {boolean} True when a symbol was found.
   */
  scanSymbol(): boolean {
    const src = this.src;
    const i = this.pos;
    for (const [sym, type] of PvLexer.SYMBOLS) {
      if (src.startsWith(sym, i)) {
        this.push(type, sym, i, i + sym.length);
        this.pos = i + sym.length;
        return true;
      }
    }
    return false;
  }

  /**
   * Tokens that start like identifiers but contain a dash.
   *
   * @type {Array}
   */
  static DASHED = [["inj-event", "INJEVENT"], ["optim-if", "OPTIMIF"], ["is-cst", "ISCST"]];

  /**
   * Escapes allowed in string literals.
   *
   * @type {Object}
   */
  static ESCAPES = { "\\": "\\", "'": "'", "\"": "\"", n: "\n", t: "\t", b: "\b", r: "\r" };

  /**
   * Symbols, longest first.
   *
   * @type {Array}
   */
  static SYMBOLS = [
    ["==>", "BEFORE"], ["<->", "EQUIV"], ["<=>", "EQUIVEQ"], ["<-R", "RANDOM"],
    ["||", "OR"], ["&&", "WEDGE"], ["->", "RED"], ["<=", "LEQ"], ["<>", "DIFF"],
    [">=", "GEQ"], ["<-", "LEFTARROW"],
    [",", "COMMA"], ["(", "LPAREN"], [")", "RPAREN"], ["[", "LBRACKET"], ["]", "RBRACKET"],
    ["{", "LBRACE"], ["}", "RBRACE"], ["|", "BAR"], [";", "SEMI"], ["!", "REPL"],
    ["=", "EQUAL"], ["/", "SLASH"], [".", "DOT"], ["*", "STAR"], [":", "COLON"],
    ["+", "PLUS"], ["-", "MINUS"], ["^", "POWER"], ["<", "LESS"], [">", "GREATER"],
    ["_", "UNDERSCORE"], ["@", "AT"], ["#", "COUNT"]
  ];
}
// ----------------------------------------------------------------
