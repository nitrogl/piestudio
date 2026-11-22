/**
 * Everything derived from the text of a model: tree, diagnostics, symbols,
 * metadata.
 *
 * The text is the single source of truth. Each edit produces a new text and a
 * new Analysis of it; the views read what they need from here and never keep
 * their own copy of the model.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Analysis {
  /**
   * The libraries (.pvl) loaded, each {name, text}: the studio sets them. A
   * model that names some with @library hints uses those, in its order, as
   * ProVerif's -lib options do; another model uses them all.
   *
   * @type {Array<Object>}
   */
  static libraries: any[] = [];

  /**
   * Analyses a text.
   *
   * @param {string} text The model.
   * @param {Object} options {fileName}.
   * @return {Object} A new Analysis.
   */
  static of(text: string, options: any = {}) {
    return new Analysis(text, options);
  }

  text: string;
  options: any;
  program: any;
  syntaxErrors: any;
  tokens: any;
  comments: any;
  lineIndex: any;
  features: any;
  check: any;
  checkFailure: any;
  meta: any;
  metaRange: any;
  diagnostics: any[];
  ok: boolean;
  libraryProblems: any[];
  libraries: any[];
  missingLibraries: any[];

  /**
   * Parses and check a text.
   *
   * @param {string} text The model.
   * @param {Object} options {fileName}.
   */
  constructor(text: string, options: any = {}) {
    this.text = text;
    this.options = options;
    const parsed = PvParser.parse(text);
    this.program = parsed.program;
    this.syntaxErrors = parsed.errors;
    this.tokens = parsed.tokens;
    this.comments = parsed.comments;
    this.lineIndex = parsed.lineIndex;
    this.features = parsed.features;
    try {
      this.check = PvChecker.check(parsed.program, { lineIndex: parsed.lineIndex });
    } catch (e: any) {
      // I must never lose the editor because of a bug of mine: I report it and carry on
      this.check = { diagnostics: [{ severity: "error", message: I18n.t("internal error of the checker: {message}", { message: e.message }), start: 0, end: 0, seq: 0, internal: true }], symbols: new Map(), occurrences: [], types: new WeakMap(), global: null, queries: [], processInfo: new Map(), eventUses: new Map(), settings: new Map(), hasChoice: false, hasBarrier: false, maxPhase: 0 };
      this.checkFailure = e;
    }
    const meta = StudioMeta.read(parsed.comments);
    this.meta = meta.value;
    this.metaRange = meta.range;
    this.diagnostics = [
        ...parsed.errors.map(e => ({ severity: "error", ...e, source: "syntax" }))
      , ...this.check.diagnostics.map(d => ({ ...d, source: "check" }))
    ].sort((a, b) => a.start - b.start || ((a.seq === undefined || a.seq === null ? 0 : a.seq)) - ((b.seq === undefined || b.seq === null ? 0 : b.seq)));
    this.ok = parsed.errors.length === 0;
    this.libraryProblems = [];
    const loaded = options.libraries || Analysis.libraries;
    const named = HintParser.libraries(this.comments.map(comment => ({ text: text.slice(comment.start, comment.end), start: comment.start })));
    this.libraries = named.length ? named.map(item => Analysis.findLibrary(loaded, item.name)).filter(Boolean) : loaded;
    this.missingLibraries = named.filter(item => !Analysis.findLibrary(loaded, item.name));
    if (this.libraries.length && this.ok) {
      this.checkWithLibraries(this.libraries);
    }
  }

  /**
   * Finds a library by the name of its file, without its folder; the
   * extension .pvl may be left out, as with ProVerif's -lib option.
   *
   * @param {Array<Object>} libraries The libraries, {name, text}.
   * @param {string} name The name, or the path, of the file.
   * @return {Object|null} The library, or null.
   */
  static findLibrary(libraries: any[], name: string) {
    const base = file => {
      const last = String(file).split(/[\\/]/).pop();
      return /\.pvl$/i.test(last) ? last : last + ".pvl";
    };
    
    return libraries.find(library => base(library.name) === base(name)) || null;
  }

  /**
   * Checks the model after the declarations of its libraries, as ProVerif
   * reads them: the diagnostics of the model come from that check, and
   * those inside the libraries are kept apart, with their library.
   *
   * @param {Array<Object>} libraries The libraries, {name, text}.
   */
  checkWithLibraries(libraries: any[]) {
    let prelude = "";
    const starts = [];
    libraries.forEach(library => {
      starts.push({ name: library.name, start: prelude.length });
      prelude += library.text + "\n";
    });
    const whole = PvParser.parse(prelude + this.text);
    let check;
    try {
      check = PvChecker.check(whole.program, { lineIndex: whole.lineIndex });
    } catch (e) {
      // The model alone was checked: I keep that
      return;
    }
    const shift = prelude.length;
    const own = [...whole.errors.map(e => ({ severity: "error", ...e, source: "syntax" })), ...check.diagnostics.map(d => ({ ...d, source: "check" }))];
    own.filter(d => d.start < shift).forEach(d => {
      const library = starts.filter(item => item.start <= d.start).pop();
      const line = whole.lineIndex.pos(d.start).line - whole.lineIndex.pos(library.start).line + 1;
      // Where the problem is in its library
      this.libraryProblems.push({ ...d, start: d.start - library.start, end: d.end - library.start, library: library.name, line: line });
    });
    this.diagnostics = own.filter(d => d.start >= shift).map(d => ({ ...d, start: d.start - shift, end: d.end - shift }))
      .sort((a, b) => a.start - b.start);
  }

  /**
   * Gives the errors (syntax and semantic).
   */
  get errors() {
    return this.diagnostics.filter(d => d.severity === "error");
  }

  /**
   * Gives the first error ProVerif would report (syntax first, then checking
   * order).
   *
   * @return {Object|null} The diagnostic or null.
   */
  firstError() {
    const syntax = this.syntaxErrors.find(e => (e.severity || "error") === "error");
    if (syntax) {
      return syntax;
    }
    return this.check.diagnostics.filter(d => d.severity === "error").sort((a, b) => a.seq - b.seq)[0] || null;
  }

  /**
   * Finds the symbol at an offset of the text.
   *
   * @param {number} offset The offset.
   * @return {Object} {occurrence, symbol} or null.
   */
  symbolAt(offset: number) {
    return PvChecker.symbolAt(this.check, offset);
  }

  /**
   * Lists the occurrences of a symbol.
   *
   * @param {string} symId The id of the symbol.
   * @return {Array} The occurrences, definition included.
   */
  occurrencesOf(symId: string) {
    return PvChecker.occurrencesOf(this.check, symId);
  }

  /**
   * Gives the global symbol of a name (type, function, name, event, ...).
   *
   * @param {string} name The identifier.
   * @return {Object} The symbol or undefined.
   */
  global(name: string) {
    return this.check.global ? this.check.global.get(name) : undefined;
  }

  /**
   * Gives the type the checker computed for a node.
   *
   * @param {Object} node A term or pattern node.
   * @return {Object} The type name or undefined.
   */
  typeOf(node: any) {
    return this.check.types ? this.check.types.get(node) : undefined;
  }

  /**
   * Gives the value of a setting as written in the model, or null.
   *
   * @param {string} name The setting.
   * @return {Object|null} The value text or null.
   */
  setting(name: string) {
    const s = this.check.settings && this.check.settings.get(name);
    return s ? s.value : null;
  }
}
// ----------------------------------------------------------------
