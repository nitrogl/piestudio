/**
 * Recursive-descent parser of ProVerif typed models, following pitparser.mly
 * of ProVerif 2.05.
 *
 * Reproduces the yacc grammar, including its precedence declarations
 *
 *   %nonassoc OPTIMIF  %nonassoc BEFORE  %right BAR  %right OR  %right WEDGE
 *   %nonassoc EQUAL  %nonassoc DIFF  %nonassoc LEQ  %nonassoc GEQ  %nonassoc GREATER
 *   %nonassoc LESS  %left PLUS MINUS  %left STAR SLASH  %nonassoc REPL
 *   %nonassoc UNARYMINUS  %nonassoc POWER
 *
 * and the way its shift/reduce conflicts are resolved, so that it accepts and
 * reject the same texts as ProVerif and report syntax errors at the same
 * token. The comparison operators have distinct levels: "a = b <> c" is "a =
 * (b <> c)" and "a = b = c" is an error, as with ocamlyacc. After a syntax
 * error it skips to the next declaration and goes on, so that the editor can show
 * more than one error.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvParser {
  /**
   * Binary operators of the term grammars: precedence level and
   * associativity.
   *
   * @type {Object}
   */
  static BIN = {
      BEFORE: { prec: 1, assoc: "nonassoc", op: "==>" }
    , OR: { prec: 3, assoc: "right", op: "||" }
    , WEDGE: { prec: 4, assoc: "right", op: "&&" }
    , EQUAL: { prec: 5, assoc: "nonassoc", op: "=" }
    , DIFF: { prec: 6, assoc: "nonassoc", op: "<>" }
    , LEQ: { prec: 7, assoc: "nonassoc", op: "<=" }
    , GEQ: { prec: 8, assoc: "nonassoc", op: ">=" }
    , GREATER: { prec: 9, assoc: "nonassoc", op: ">" }
    , LESS: { prec: 10, assoc: "nonassoc", op: "<" }
    , PLUS: { prec: 11, assoc: "left", op: "+" }
    , MINUS: { prec: 11, assoc: "left", op: "-" }
  };

  /**
   * Operators allowed by each term grammar of pitparser.mly.
   *
   * @type {Object}
   */
  static FLAVORS = {
      term: new Set(["OR", "WEDGE", "EQUAL", "DIFF", "PLUS", "MINUS"])
    , pterm: new Set(["OR", "WEDGE", "EQUAL", "DIFF", "LEQ", "GEQ", "GREATER", "LESS", "PLUS", "MINUS"])
    , gterm: new Set(["BEFORE", "OR", "WEDGE", "EQUAL", "DIFF", "LEQ", "GEQ", "GREATER", "LESS", "PLUS"])
    , gformat: new Set(["PLUS"])
  };

  /**
   * Tokens that may start a declaration (for error recovery).
   *
   * @type {Set<string>}
   */
  static DECL_START: Set<string> = new Set([
    "TYPE", "FUN", "REDUCTION", "CONST", "EQUATION", "EVENT", "PREDICATE", "TABLE", "LET", "LETFUN",
    "SET", "NOUNIF", "SELECT", "QUERY", "NONINTERF", "WEAKSECRET", "NOT", "PARAM", "PROBA",
    "LETPROBA", "PROOF", "IMPLEMENTATION", "ELIMTRUE", "CHANNEL", "FREE", "CLAUSES", "DEFINE", "EXPAND",
    "LEMMA", "AXIOM", "RESTRICTION"
  ]);

  src: string;
  toks: any[];
  pos: number;
  errors: any[];
  options: any;
  features: Set<any>;

  /**
   * Prepares to parse a token stream.
   *
   * @param {string} src The source text (sliced for raw declarations).
   * @param {Array} tokens The tokens from PvLexer.
   * @param {Object} options Parsing options (unused for now).
   */
  constructor(src: string, tokens: any[], options: any = {}) {
    this.src = src;
    this.toks = tokens;
    this.pos = 0;
    this.errors = [];
    this.options = options;
    this.features = new Set();
  }

  /**
   * Parses a whole model.
   *
   * @param {string} src The source text.
   * @param {Object} options Parsing options.
   * @return {Object} {program, errors, tokens, comments, lineIndex,
   *   features}.
   */
  static parse(src: string, options: any = {}) {
    const lex = PvLexer.tokenize(src, options);
    const parser = new PvParser(src, lex.tokens, options);
    const program = parser.parseProgram();
    program.features = parser.features;
    try {
      new CommentAttacher(program, lex.comments, src).run();
    } catch (e) { /* I never let comments break parsing */ }
    const errors = [...lex.errors, ...parser.errors].sort((a, b) => a.start - b.start);
    return { program, errors, tokens: lex.tokens, comments: lex.comments, lineIndex: new LineIndex(src), features: parser.features };
  }

  /**
   * Parses a fragment of a model with one of the grammars.
   *
   * @param {string} src The fragment.
   * @param {string} flavor 'pterm', 'term', 'gterm', 'gformat', 'pattern',
   *   'process', 'decl' or 'typeid'.
   * @return {Object} {node, errors}.
   */
  static parseFragment(src: string, flavor: string = "pterm") {
    const lex = PvLexer.tokenize(src);
    const parser = new PvParser(src, lex.tokens);
    let node = null;
    try {
      if (flavor === "pattern") {
        node = parser.parsePattern();
      } else if (flavor === "process") {
        node = parser.parseProcess();
      } else if (flavor === "decl") {
        node = parser.parseDecl();
      } else if (flavor === "typeid") {
        node = parser.typeid();
      } else {
        node = parser.parseTermBin(flavor, 0);
      }
      if (!parser.at("EOF")) {
        parser.fail(parser.peek(), ["EOF"]);
      }
    } catch (e) {
      if (!(e instanceof ParseError)) {
        throw e;
      }
      parser.errors.push({ message: e.message, detail: e.detail, start: e.start, end: e.end, severity: "error" });
    }
    return { node, errors: [...lex.errors, ...parser.errors] };
  }

  // Tokens

  /**
   * Looks ahead.
   *
   * @param {number} k How many tokens after the current one.
   * @return {Object} The token (EOF when past the end).
   */
  peek(k: number = 0) {
    return this.toks[Math.min(this.pos + k, this.toks.length - 1)];
  }

  /**
   * Tests the type of a token ahead.
   *
   * @param {string} type A token type.
   * @param {number} k How many tokens after the current one.
   * @return {boolean} True when it matches.
   */
  at(type: string, k: number = 0): boolean {
    return this.peek(k).type === type;
  }

  /**
   * Consumes the current token.
   *
   * @return {Object} The consumed token.
   */
  next() {
    const t = this.toks[this.pos];
    if (this.pos < this.toks.length - 1) {
      this.pos++;
    }
    return t;
  }

  /**
   * Gives the end offset of the last consumed token.
   */
  prevEnd() {
    return this.pos > 0 ? this.toks[this.pos - 1].end : 0;
  }

  /**
   * Consumes the current token when it has a given type.
   *
   * @param {string} type A token type.
   * @return {Object|null} The token, or null.
   */
  accept(type: string) {
    return this.at(type) ? this.next() : null;
  }

  /**
   * Consumes a token of one of the given types, or fail.
   *
   * @param {Array} types Accepted token types.
   * @return {Object} The consumed token.
   */
  expect(...types: any[]) {
    const t = this.peek();
    if (types.includes(t.type)) {
      return this.next();
    }
    this.fail(t, types);
    return null;
  }

  /**
   * Raises a syntax error at a token.
   *
   * @param {Object} tok The offending token.
   * @param {Object} expected What could have been accepted.
   * @param {string} msg An explicit detail.
   */
  fail(tok: any, expected: any, msg?: string) {
    const detail = msg === undefined || msg === null ? (expected && expected.length ? "unexpected " + tok.describe() + ", expected " + PvToken.expectedText(expected) : "unexpected " + tok.describe()) : msg;
    // ocamllex leaves the position of a string token on its closing quote
    if (tok.type === "STRING" && tok.end > tok.start) {
      throw new ParseError("Syntax error", tok.end - 1, tok.end, detail);
    }
    throw new ParseError("Syntax error", tok.start, tok.end, detail);
  }

  /**
   * Reads an identifier node.
   */
  ident() {
    const t = this.expect("IDENT");
    return { name: t.value, start: t.start, end: t.end };
  }

  /**
   * Reads a type identifier (channel is allowed although it is a keyword).
   */
  typeid() {
    const t = this.peek();
    if (t.type === "IDENT" || t.type === "CHANNEL") {
      this.next();
      return { name: t.value, start: t.start, end: t.end };
    }
    this.fail(t, ["IDENT"]);
    return null;
  }

  /**
   * Reads an integer value.
   */
  int() {
    return this.expect("INT").value;
  }

  /**
   * Sets the extent of a node from a start token to the last consumed token.
   *
   * @param {Object} node The node.
   * @param {Object} startTok A token or an offset.
   * @return {Object} The node.
   */
  finish(node: any, startTok: any) {
    node.start = typeof startTok === "number" ? startTok : startTok.start;
    node.end = this.prevEnd();
    return node;
  }

  /**
   * Records a parse error and go on.
   *
   * @param {Object} e The error (anything else is rethrown).
   */
  recordError(e: any) {
    if (!(e instanceof ParseError)) {
      throw e;
    }
    this.errors.push({ message: e.message, detail: e.detail, start: e.start, end: e.end, severity: "error" });
  }

  // Program

  /**
   * Parses "lib PROCESS tprocess EOF" or "lib EQUIVALENCE tprocess tprocess
   * EOF".
   *
   * @return {Object} The Program node.
   */
  parseProgram() {
    const start = this.peek().start;
    const decls = this.parseLib(false);
    const prog: any = { kind: "Program", decls, process: null, equivalence: null, start, end: this.src.length, trailingComments: [] };
    const t = this.peek();
    if (t.type === "PROCESS") {
      const kw = this.next();
      prog.processStart = kw.start;
      try {
        prog.process = this.parseProcess();
        if (!this.at("EOF")) {
          this.fail(this.peek(), ["EOF"], "unexpected " + this.peek().describe() + " after the main process");
        }
      } catch (e) {
        this.recordError(e);
        prog.processBroken = true;
      }
    } else if (t.type === "EQUIVALENCE") {
      const kw = this.next();
      prog.processStart = kw.start;
      this.features.add("equivalence");
      try {
        const p1 = this.parseProcess();
        const p2 = this.parseProcess();
        prog.equivalence = [p1, p2];
        if (!this.at("EOF")) {
          this.fail(this.peek(), ["EOF"]);
        }
      } catch (e) {
        this.recordError(e);
        prog.processBroken = true;
      }
    } else if (t.type === "EOF") {
      this.errors.push({
        message: "Syntax error", detail: "missing main process: a .pv file ends with \"process P\" (or \"equivalence P Q\")",
        start: t.start, end: t.end, severity: "error", code: "missing-process"
      });
    } else {
      try {
        this.fail(t, ["PROCESS", "EQUIVALENCE"]);
      } catch (e) {
        this.recordError(e);
      }
    }
    return prog;
  }

  /**
   * Skips to a plausible declaration boundary after a syntax error.
   */
  recover() {
    let depth = 0;
    while (!this.at("EOF")) {
      const t = this.peek();
      if (depth === 0 && (t.type === "PROCESS" || t.type === "EQUIVALENCE")) {
        return;
      }
      if (t.type === "LBRACE") {
        depth++;
      }
      if (t.type === "RBRACE") {
        if (depth === 0) {
          return;
        }

        depth--;
      }
      this.next();
      if (t.type === "DOT" && depth === 0 && (PvParser.DECL_START.has(this.peek().type) || this.at("PROCESS") || this.at("EQUIVALENCE") || this.at("EOF"))) {
        return;
      }
    }
  }

  /**
   * Parses a list of declarations (the lib rule).
   *
   * @param {boolean} inDefine True inside "def M(...) { ... }".
   * @return {Array} The declarations.
   */
  parseLib(inDefine: boolean) {
    const decls = [];
    for (;;) {
      const t = this.peek();
      if (t.type === "EOF" || t.type === "PROCESS" || t.type === "EQUIVALENCE") {
        break;
      }
      if (inDefine && t.type === "RBRACE") {
        break;
      }
      const before = this.pos;
      const gapStart = this.prevEnd();
      try {
        const d = this.parseDecl();
        const gap = this.src.slice(gapStart, d.start).replace(/\(\*[\s\S]*?\*\)/g, c => c.replace(/[^\n]/g, " "));
        if (decls.length && /\n[ \t\f\r]*\n/.test(gap)) {
          d.blankBefore = true;
        }
        decls.push(d);
      } catch (e) {
        this.recordError(e);
        if (this.pos === before) {
          this.next();
        }
        this.recover();
      }
    }
    return decls;
  }

  // Declarations

  /**
   * Parses one declaration.
   *
   * @return {Object} The declaration node.
   */
  parseDecl() {
    const t = this.peek();
    switch (t.type) {
      case "TYPE": {
        this.next();
        const name = this.ident();
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "TypeDecl", name, options }, t);
      }

      case "FUN": {
        this.next();
        const name = this.ident();
        this.expect("LPAREN");
        const argTypes = this.parseTypeIdSeq("RPAREN");
        this.expect("RPAREN");
        this.expect("COLON");
        const retType = this.typeid();
        let reduc = null;
        if (this.accept("REDUCTION")) {
          reduc = this.parseReducMayFail();
        }
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "FunDecl", name, argTypes, retType, reduc, options }, t);
      }

      case "REDUCTION": {
        this.next();
        const rules = [];
        do {
          const rs = this.peek().start;
          const forall = this.parseForall(false);
          rules.push(this.parseExtendedEquation(forall, rs, true));
        } while (this.accept("SEMI"));
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "ReducDecl", rules, options }, t);
      }

      case "CONST": {
        this.next();
        const names = this.parseIdentSeq();
        this.expect("COLON");
        const type = this.typeid();
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "ConstDecl", names, type, options }, t);
      }

      case "EQUATION": {
        this.next();
        const eqs = [];
        do {
          const es = this.peek().start;
          const forall = this.parseForall(false);
          eqs.push(this.parseExtendedEquation(forall, es, false));
        } while (this.accept("SEMI"));
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "EquationDecl", eqs, options }, t);
      }

      case "EVENT": {
        this.next();
        const name = this.ident();
        let argTypes = null;
        if (this.accept("LPAREN")) {
          argTypes = this.parseTypeIdSeq("RPAREN");
          this.expect("RPAREN");
        }
        this.expect("DOT");
        return this.finish({ kind: "EventDecl", name, argTypes }, t);
      }

      case "PREDICATE": {
        this.next();
        const name = this.ident();
        let argTypes = null;
        if (this.accept("LPAREN")) {
          argTypes = this.parseTypeIdSeq("RPAREN");
          this.expect("RPAREN");
        }
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "PredDecl", name, argTypes, options }, t);
      }

      case "TABLE": {
        this.next();
        const name = this.ident();
        this.expect("LPAREN");
        const argTypes = this.parseTypeIdSeq("RPAREN");
        this.expect("RPAREN");
        this.expect("DOT");
        return this.finish({ kind: "TableDecl", name, argTypes }, t);
      }

      case "LET": {
        this.next();
        const name = this.ident();
        let params = null;
        if (this.accept("LPAREN")) {
          params = this.parseMayFailVarTypeSeq("RPAREN");
          this.expect("RPAREN");
        }
        this.expect("EQUAL");
        const body = this.parseProcess();
        this.expect("DOT");
        return this.finish({ kind: "ProcessDecl", name, params, body }, t);
      }

      case "LETFUN": {
        this.next();
        const name = this.ident();
        let params = null;
        if (this.accept("LPAREN")) {
          params = this.parseMayFailVarTypeSeq("RPAREN");
          this.expect("RPAREN");
        }
        this.expect("EQUAL");
        const body = this.parseTermBin("pterm", 0);
        this.expect("DOT");
        return this.finish({ kind: "LetFunDecl", name, params, body }, t);
      }

      case "SET": {
        this.next();
        const name = this.ident();
        this.expect("EQUAL");
        const v = this.peek();
        let value;
        if (v.type === "IDENT") {
          value = { kind: "ident", value: v.value };
        } else if (v.type === "STRING") {
          value = { kind: "string", value: v.value };
        } else if (v.type === "INT") {
          value = { kind: "int", value: v.value };
        } else {
          this.fail(v, ["IDENT", "STRING", "INT"]);
        }
        this.next();
        value.start = v.start;
        value.end = v.end;
        this.expect("DOT");
        return this.finish({ kind: "SetDecl", name, value }, t);
      }

      case "NOUNIF":
      case "SELECT": {
        this.next();
        const keyword = t.value;
        const vars = this.atVarDecls() ? this.parseNeVarTypeSemi() : [];
        const fact = this.parseNoUnifBindings();
        let weight = null;
        if (this.accept("SLASH")) {
          const neg = !!this.accept("MINUS");
          weight = { n: this.int(), neg };
        }
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "NoUnifDecl", keyword, vars, fact, weight, options }, t);
      }

      case "QUERY": {
        this.next();
        const vars = this.atVarDecls() ? this.parseNeVarTypeSemi() : [];
        const queries = [];
        do {
          queries.push(this.parseQuery());
        } while (this.accept("SEMI"));
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "QueryDecl", vars, queries, options }, t);
      }

      case "LEMMA":
      case "AXIOM":
      case "RESTRICTION": {
        this.next();
        const vars = this.atVarDecls() ? this.parseNeVarTypeSemi() : [];
        const lemmas = [];
        do {
          lemmas.push(this.parseLemma());
        } while (this.accept("SEMI"));
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "LemmaDecl", keyword: t.value, vars, lemmas, options }, t);
      }

      case "NONINTERF": {
        this.next();
        const vars = this.atNonInterfVars() ? this.parseNeVarTypeSemi() : [];
        const items = [];
        do {
          const s = this.peek().start;
          const name = this.ident();
          let among = null;
          if (this.accept("AMONG")) {
            this.expect("LPAREN");
            among = [];
            do {
              among.push(this.parseTermBin("term", 0));
            } while (this.accept("COMMA"));
            this.expect("RPAREN");
          }
          items.push({ name, among, start: s, end: this.prevEnd() });
        } while (this.accept("COMMA"));
        this.expect("DOT");
        return this.finish({ kind: "NonInterfDecl", vars, items }, t);
      }

      case "WEAKSECRET": {
        this.next();
        const name = this.ident();
        this.expect("DOT");
        return this.finish({ kind: "WeakSecretDecl", name }, t);
      }

      case "NOT": {
        this.next();
        const vars = this.atVarDecls() ? this.parseNeVarTypeSemi() : [];
        const term = this.parseTermBin("gterm", 0);
        this.expect("DOT");
        return this.finish({ kind: "NotDecl", vars, term }, t);
      }

      case "ELIMTRUE": {
        this.next();
        let vars = [];
        if (this.atVarDecls()) {
          vars = this.parseNeMayFailVarTypeSeq();
          this.expect("SEMI");
        }
        const term = this.parseTermBin("term", 0);
        this.expect("DOT");
        return this.finish({ kind: "ElimTrueDecl", vars, term }, t);
      }

      case "CHANNEL": {
        this.next();
        const names = this.parseIdentSeq();
        this.expect("DOT");
        return this.finish({ kind: "ChannelDecl", names }, t);
      }

      case "FREE": {
        this.next();
        const names = this.parseIdentSeq();
        this.expect("COLON");
        const type = this.typeid();
        const options = this.parseOptions();
        this.expect("DOT");
        return this.finish({ kind: "FreeDecl", names, type, options }, t);
      }

      case "CLAUSES": {
        this.next();
        const clauses = [];
        for (;;) {
          const cs = this.peek().start;
          const forall = this.parseForall(true);
          const a = this.parseTermBin("term", 0);
          let c;
          if (this.accept("RED")) {
            c = { kind: "clause", hyp: a, concl: this.parseTermBin("term", 0) };
          } else if (this.accept("EQUIV")) {
            c = { kind: "equiv", hyp: a, concl: this.parseTermBin("term", 0) };
          } else if (this.accept("EQUIVEQ")) {
            c = { kind: "equiveq", hyp: a, concl: this.parseTermBin("term", 0) };
          } else {
            c = { kind: "fact", concl: a };
          }
          c.forall = forall;
          c.start = cs;
          c.end = this.prevEnd();
          clauses.push(c);
          if (this.accept("SEMI")) {
            continue;
          }
          this.expect("DOT", "SEMI");
          break;
        }
        return this.finish({ kind: "ClausesDecl", clauses }, t);
      }

      case "DEFINE": {
        this.next();
        const name = this.ident();
        this.expect("LPAREN");
        const params = this.parseTypeIdSeq("RPAREN");
        this.expect("RPAREN");
        this.expect("LBRACE");
        const decls = this.parseLib(true);
        this.expect("RBRACE");
        return this.finish({ kind: "DefineDecl", name, params, decls }, t);
      }

      case "EXPAND": {
        this.next();
        const name = this.ident();
        this.expect("LPAREN");
        const args = this.parseTypeIdSeq("RPAREN");
        this.expect("RPAREN");
        this.expect("DOT");
        return this.finish({ kind: "ExpandDecl", name, args }, t);
      }

      case "PARAM": {
        this.next();
        this.parseIdentSeq();
        this.parseOptions();
        this.expect("DOT");
        return this.raw("param", t);
      }

      case "PROBA": {
        this.next();
        this.ident();
        if (this.accept("LPAREN")) {
          if (!this.at("RPAREN")) {
            do {
              this.parseDim(0);
            } while (this.accept("COMMA"));
          }
          this.expect("RPAREN");
        }
        this.parseOptions();
        this.expect("DOT");
        return this.raw("proba", t);
      }

      case "LETPROBA": {
        this.next();
        this.ident();
        if (this.accept("LPAREN")) {
          if (!this.at("RPAREN")) {
            do {
              this.parseIdentSeq();
              this.expect("COLON");
              this.parseDim(0);
            } while (this.accept("COMMA"));
          }
          this.expect("RPAREN");
        }
        this.expect("EQUAL");
        this.parseProbaF(0);
        this.expect("DOT");
        return this.raw("letproba", t);
      }

      case "PROOF": {
        this.next();
        this.expect("LBRACE");
        const okTok = new Set(["IDENT", "STRING", "INT", "STAR", "DOT", "SET", "INSERT", "EQUAL", "COMMA", "LPAREN", "RPAREN"]);
        for (;;) {
          if (!okTok.has(this.peek().type)) {
            this.fail(this.peek(), []);
          }
          while (okTok.has(this.peek().type)) {
            this.next();
          }
          if (this.accept("SEMI")) {
            continue;
          }
          break;
        }
        this.expect("RBRACE");
        return this.raw("proof", t);
      }

      case "IMPLEMENTATION": {
        this.next();
        do {
          this.parseImpl();
        } while (this.accept("SEMI"));
        this.expect("DOT");
        return this.raw("implementation", t);
      }

      default:
        this.fail(t, [], "unexpected " + t.describe() + "; expected a declaration, \"process\" or \"equivalence\"");
        return null;
    }
  }

  /**
   * Builds a raw declaration (CryptoVerif annotations that ProVerif ignores).
   *
   * @param {string} keyword Its keyword.
   * @param {Object} t Its first token.
   * @return {Object} The RawDecl node.
   */
  raw(keyword: string, t: any) {
    if (keyword === "letproba") {
      this.features.add("letproba");
    }
    return this.finish({ kind: "RawDecl", keyword, text: this.src.slice(t.start, this.prevEnd()) }, t);
  }

  /**
   * Tells whether the next tokens start a non-empty variable declaration "x:
   * T" or "x, y: T".
   *
   * @return {boolean} True for "IDENT COLON" or "IDENT COMMA".
   */
  atVarDecls(): boolean {
    return this.at("IDENT") && (this.at("COLON", 1) || this.at("COMMA", 1));
  }

  /**
   * Tells whether "noninterf" is followed by variable declarations rather
   * than secrets.
   *
   * As the yacc parser, it can only decide at the colon of "x1, ...,
   * xn: T".
   *
   * @return {boolean} True for declarations.
   */
  atNonInterfVars(): boolean {
    let k = 0;
    if (!this.at("IDENT", k)) {
      return false;
    }
    for (;;) {
      if (this.at("COLON", k + 1)) {
        return true;
      }
      if (this.at("COMMA", k + 1) && this.at("IDENT", k + 2)) {
        k += 2;
        continue;
      }
      return false;
    }
  }

  /**
   * Parses "nevartype SEMI", the variable prefix of query, lemma, not,
   * nounif, noninterf.
   *
   * @return {Array} The variable declarations.
   */
  parseNeVarTypeSemi() {
    const vs = this.parseNeVarType();
    this.expect("SEMI");
    return vs;
  }

  /**
   * Parses the CryptoVerif implementation annotations (impl).
   */
  parseImpl() {
    const t = this.peek();
    const strList = () => {
      this.expect("STRING");

      while (this.accept("COMMA")) {
        this.expect("STRING");
      }
    };
    switch (t.type) {
      case "TYPE":
        this.next(); this.ident(); this.expect("EQUAL"); this.expect("INT", "STRING");
        if (this.accept("LBRACKET")) {
          do {
            if (!this.accept("PREDICATE")) {
              this.ident();
            }
            this.expect("EQUAL");
            strList();
          } while (this.accept("SEMI"));
          this.expect("RBRACKET");
        }
        return;

      case "FUN":
        this.next(); this.ident(); this.expect("EQUAL"); this.expect("STRING");
        if (this.accept("LBRACKET")) {
          do {
            this.ident();
            this.expect("EQUAL");
            this.expect("STRING");
          } while (this.accept("SEMI"));
          this.expect("RBRACKET");
        }
        return;

      case "TABLE":
      case "CONST":
        this.next(); this.ident(); this.expect("EQUAL"); this.expect("STRING");
        return;

      default:
        this.fail(t, ["TYPE", "FUN", "TABLE", "CONST"]);
    }
  }

  /**
   * Parses a dimension of a CryptoVerif probability (dim, with * and / left
   * associative).
   *
   * @param {number} minPrec 0 for a whole dimension, 1 inside the right
   *   operand of * or /.
   */
  parseDim(minPrec: number) {
    this.ident();
    if (this.accept("POWER")) {
      this.accept("MINUS");
      this.expect("INT");
    }
    while (minPrec === 0 && (this.at("STAR") || this.at("SLASH"))) {
      this.next();
      this.parseDim(1);
    }
  }

  /**
   * Parses a CryptoVerif probability formula (probaf); ProVerif ignores its
   * meaning.
   *
   * @param {number} minPrec Precedence floor: 0 any, 11 additive, 12
   *   multiplicative, 14 unary minus.
   */
  parseProbaF(minPrec: number) {
    const t = this.peek();
    switch (t.type) {
      case "LPAREN":
        this.next();
        this.parseProbaFList();
        this.expect("RPAREN");
        break;

      case "MINUS":
        this.next();
        this.parseProbaF(14);
        break;

      case "OPTIMIF":
        this.next();
        this.parseProbaOptimCond(0);
        this.expect("THEN");
        this.parseProbaF(0);
        this.expect("ELSE");
        this.parseProbaF(0);
        return;

      case "IDENT":
        this.next();
        if (this.accept("LPAREN")) {
          this.parseProbaFArgs();
        }
        break;

      case "COUNT":
        this.next();
        this.ident();
        break;

      case "BAR":
        this.next();
        this.ident();
        this.expect("BAR");
        break;

      case "INT":
      case "FLOAT":
        this.next();
        break;

      default:
        this.fail(t, []);
    }
    this.parseProbaFTail(minPrec);
  }

  /**
   * Parses the binary operators after a probability operand.
   *
   * @param {number} minPrec Precedence floor (see parseProbaF).
   */
  parseProbaFTail(minPrec: number) {
    for (;;) {
      const t = this.peek();
      if (t.type === "POWER" && minPrec <= 15) {
        this.next();
        this.accept("MINUS");
        this.expect("INT");
        if (this.at("POWER")) {
          this.fail(this.peek(), []);
        }
        continue;
      }
      if ((t.type === "STAR" || t.type === "SLASH") && minPrec <= 12) {
        this.next();
        this.parseProbaF(13);
        continue;
      }
      if ((t.type === "PLUS" || t.type === "MINUS") && minPrec <= 11) {
        this.next();
        this.parseProbaF(12);
        continue;
      }
      return;
    }
  }

  /**
   * Parses the arguments of "IDENT ( ... )" in a probability formula, after
   * the parenthesis.
   */
  parseProbaFArgs() {
    const t = this.peek();
    const listOpt = () => {
      if (this.accept("COMMA")) {
        this.parseProbaFList();
      }
    };
    switch (t.type) {
      case "LET":
        this.next();
        if (this.accept("LPAREN")) {
          if (!this.at("RPAREN")) {
            this.parseIdentSeq();
          }

          this.expect("RPAREN");
        } else {
          this.ident();
        }
        listOpt();
        break;

      case "EQUAL":
        this.next(); this.ident(); listOpt();
        break;

      case "OUT":
        this.next();
        if (this.accept("LBRACKET")) {
          this.parseIdentSeq();
          this.expect("RBRACKET");
        }
        this.ident();
        listOpt();
        break;

      case "IN":
        this.next(); this.expect("INT");
        break;

      case "REPL":
      case "FOREACH":
      case "WEDGE":
      case "OR":
      case "IF":
        this.next();
        break;

      case "LBRACKET":
        this.next(); this.expect("INT"); this.expect("RBRACKET");
        break;

      case "NEW":
      case "RANDOM":
        this.next(); this.ident();
        break;

      case "IDENT":
        if (this.at("INT", 1)) {
          this.next();
          this.next();
          break;
        }
        this.parseProbaFList();
        break;

      default:
        this.parseProbaFList();
    }
    this.expect("RPAREN");
  }

  /**
   * Parses "probaf (COMMA probaf)*".
   */
  parseProbaFList() {
    this.parseProbaF(0);
    while (this.accept("COMMA")) {
      this.parseProbaF(0);
    }
  }

  /**
   * Parses the condition of optim-if (probaoptimcond), where && binds tighter
   * than ||.
   *
   * @param {number} minPrec 0 for a full condition, 1 inside the right
   *   operand of ||, 2 inside the right operand of &&.
   */
  parseProbaOptimCond(minPrec: number) {
    const t = this.peek();
    if (t.type === "ISCST") {
      this.next(); this.expect("LPAREN"); this.parseProbaF(0); this.expect("RPAREN");
    } else if (t.type === "LPAREN" && this.condInParens(this.pos)) {
      this.next(); this.parseProbaOptimCond(0); this.expect("RPAREN");
    } else if (t.type === "IDENT" && this.at("LPAREN", 1) && this.condInParens(this.pos + 1)) {
      this.next(); this.next(); this.parseProbaOptimCond(0); this.expect("RPAREN");
    } else {
      this.parseProbaF(0);
      this.expect("EQUAL", "LEQ", "GEQ", "LESS", "GREATER");
      this.parseProbaF(0);
    }
    for (;;) {
      if (this.at("WEDGE") && minPrec <= 1) {
        this.next();
        this.parseProbaOptimCond(2);
        continue;
      }
      if (this.at("OR") && minPrec === 0) {
        this.next();
        this.parseProbaOptimCond(1);
        continue;
      }
      return;
    }
  }

  /**
   * Guesses whether the parenthesis at a token index encloses a condition
   * rather than a formula.
   *
   * @param {number} index Index of the LPAREN token.
   * @return {boolean} True when a comparison, is-cst, && or || occurs at
   *   depth one before the matching parenthesis.
   */
  condInParens(index: number): boolean {
    let depth = 0;
    for (let i = index; i < this.toks.length; i++) {
      const ty = this.toks[i].type;
      if (ty === "LPAREN") {
        depth++;
      } else if (ty === "RPAREN") {
        depth--;

        if (depth === 0) {
          return false;
        }
      } else if (depth >= 1 && ["EQUAL", "LEQ", "GEQ", "LESS", "GREATER", "ISCST", "WEDGE", "OR"].includes(ty)) {
        return true;
      } else if (ty === "EOF" || ty === "THEN") {
        return false;
      }
    }
    return false;
  }

  /**
   * Parses optional options "[a, b = c, d = {e, f}]".
   *
   * @return {Array} The options (possibly empty).
   */
  parseOptions() {
    if (!this.at("LBRACKET")) {
      return [];
    }
    this.next();
    const opts = [];
    do {
      const s = this.peek().start;
      const name = this.ident();
      let value = null;
      let braces = false;
      if (this.accept("EQUAL")) {
        if (this.accept("LBRACE")) {
          value = this.parseIdentSeq();
          braces = true;
          this.expect("RBRACE");
        } else {
          value = [this.ident()];
        }
      }
      opts.push({ name, value, braces, start: s, end: this.prevEnd() });
    } while (this.accept("COMMA"));
    this.expect("RBRACKET");
    return opts;
  }

  /**
   * Parses "IDENT (COMMA IDENT)*".
   */
  parseIdentSeq() {
    const ids = [this.ident()];
    while (this.accept("COMMA")) {
      ids.push(this.ident());
    }
    return ids;
  }

  /**
   * Parses a possibly empty list of type identifiers.
   *
   * @param {Object} closer The token that ends the list.
   * @return {Object} The type identifiers.
   */
  parseTypeIdSeq(closer: any) {
    if (this.at(closer)) {
      return [];
    }
    const ts = [this.typeid()];
    while (this.accept("COMMA")) {
      ts.push(this.typeid());
    }
    return ts;
  }

  /**
   * Parses nevartype: "x1, ..., xn: T (, ...)*", giving one declaration per
   * variable.
   *
   * @return {Array} The variable declarations.
   */
  parseNeVarType() {
    const vs = [];
    do {
      const names = this.parseIdentSeq();
      this.expect("COLON");
      const type = this.typeid();
      for (const name of names) {
        vs.push({ name, type });
      }
    } while (this.accept("COMMA"));
    return vs;
  }

  /**
   * Parses nemayfailvartypeseq: "x1, ..., xn: T [or fail] (, ...)*".
   *
   * @return {Array} The declarations, with their mayFail flag.
   */
  parseNeMayFailVarTypeSeq() {
    const vs = [];
    do {
      const names = this.parseIdentSeq();
      this.expect("COLON");
      const type = this.typeid();
      let mayFail = false;
      if (this.accept("ORTEXT")) {
        this.expect("FAIL");
        mayFail = true;
      }
      for (const name of names) {
        vs.push({ name, type, mayFail });
      }
    } while (this.accept("COMMA"));
    return vs;
  }

  /**
   * Parses a possibly empty mayfailvartypeseq (parameters of processes and
   * letfun).
   *
   * @param {Object} closer The token that ends the list.
   * @return {Array} The declarations.
   */
  parseMayFailVarTypeSeq(closer: any) {
    if (this.at(closer)) {
      return [];
    }
    return this.parseNeMayFailVarTypeSeq();
  }

  /**
   * Parses forallvartype or forallmayfailvartype: "forall ...;" or nothing.
   *
   * @param {boolean} mayFail Whether "or fail" is allowed.
   * @return {Array} The declarations (empty without forall).
   */
  parseForall(mayFail: boolean) {
    if (!this.accept("FORALL")) {
      return [];
    }
    const vs = mayFail ? this.parseNeMayFailVarTypeSeq() : this.parseNeVarType();
    this.expect("SEMI");
    return vs;
  }

  /**
   * Parses extended_equation: "let x = t in" and "x <- t;" prefixes, then a
   * term (ProVerif 2.04).
   *
   * @param {Object} forall The forall variables already read.
   * @param {number} start Offset of the rule.
   * @param {boolean} isRule True for rewrite rules (then lhs = rhs is split).
   * @return {Object} The rule or equation.
   */
  parseExtendedEquation(forall: any, start: number, isRule: boolean) {
    const lets = [];
    for (;;) {
      const t = this.peek();
      if (t.type === "LET") {
        this.next();
        const name = this.ident();
        this.expect("EQUAL");
        const value = this.parseTermBin("term", 0);
        this.expect("IN");
        lets.push({ name, value, arrow: false, start: t.start, end: this.prevEnd() });
        continue;
      }
      if (t.type === "IDENT" && this.at("LEFTARROW", 1)) {
        const name = this.ident();
        this.next();
        const value = this.parseTermBin("term", 0);
        this.expect("SEMI");
        lets.push({ name, value, arrow: true, start: t.start, end: this.prevEnd() });
        continue;
      }
      break;
    }
    const term = this.parseTermBin("term", 0);
    const node: any = { forall, lets, term, start, end: this.prevEnd() };
    if (isRule) {
      const eq = term.kind === "BinOp" && term.op === "=";
      node.lhs = eq ? term.left : null;
      node.rhs = eq ? term.right : null;
    }
    return node;
  }

  /**
   * Parses treducmayfail: rules separated by "otherwise".
   *
   * @return {Array} The rules.
   */
  parseReducMayFail() {
    const rules = [];
    let first = true;
    do {
      const rs = this.peek().start;
      const forall = this.parseForall(true);
      const r = this.parseExtendedEquation(forall, rs, true);
      r.otherwise = !first;
      rules.push(r);
      first = false;
    } while (this.accept("OTHERWISE"));
    return rules;
  }

  // Nounif

  /**
   * Parses tfnebindingseq: let bindings, then a fact, with an optional phase.
   *
   * @return {Object} The NUFact or NULet node.
   */
  parseNoUnifBindings() {
    const t = this.peek();
    if (t.type === "LET") {
      this.next();
      const name = this.ident();
      this.expect("EQUAL");
      const value = this.parseTermBin("gformat", 0);
      this.expect("IN");
      const body = this.parseNoUnifBindings();
      return this.finish({ kind: "NULet", name, value, body, arrow: false }, t);
    }
    if (t.type === "IDENT" && this.at("LEFTARROW", 1)) {
      const name = this.ident();
      this.next();
      const value = this.parseTermBin("gformat", 0);
      this.expect("SEMI");
      const body = this.parseNoUnifBindings();
      return this.finish({ kind: "NULet", name, value, body, arrow: true }, t);
    }
    let pred;
    let args = null;
    if (t.type === "IDENT") {
      pred = this.ident();
      if (this.accept("LPAREN")) {
        args = this.parseSeq("gformat", "RPAREN");
        this.expect("RPAREN");
      }
    } else if (t.type === "TABLE" || t.type === "EVENT") {
      this.next();
      pred = { name: t.value, start: t.start, end: t.end };
      this.expect("LPAREN");
      args = this.parseSeq("gformat", "RPAREN");
      this.expect("RPAREN");
    } else {
      this.fail(t, ["IDENT", "TABLE", "EVENT", "LET"]);
    }
    let phase = null;
    if (args !== null && this.accept("PHASE")) {
      phase = this.int();
    }
    return this.finish({ kind: "NUFact", pred, args, phase }, t);
  }

  // Queries and lemmas

  /**
   * Parses one query (tquery).
   *
   * @return {Object} A RealQuery, SecretQuery or PutBegin node.
   */
  parseQuery() {
    const t = this.peek();
    if (t.type === "SECRET") {
      this.next();
      const name = this.ident();
      let publicVars = [];
      if (this.accept("PUBLICVARS")) {
        publicVars = this.parseIdentSeq();
      }
      const options = this.parseOptions();
      return this.finish({ kind: "SecretQuery", name, publicVars, options }, t);
    }
    if (t.type === "PUTBEGIN") {
      this.next();
      const inj = this.expect("EVENT", "INJEVENT");
      this.expect("COLON");
      const names = this.parseIdentSeq();
      return this.finish({ kind: "PutBegin", injective: inj.type === "INJEVENT", names }, t);
    }
    const term = this.parseTermBin("gterm", 0);
    let publicVars = [];
    if (this.accept("PUBLICVARS")) {
      publicVars = this.parseIdentSeq();
    }
    return this.finish({ kind: "RealQuery", term, publicVars }, t);
  }

  /**
   * Parses one lemma: a gterm and an optional "for { ... }"
   * (opt_publivars_ror).
   *
   * @return {Object} {term, ror, publicVars, start, end}.
   */
  parseLemma() {
    const ls = this.peek().start;
    const term = this.parseTermBin("gterm", 0);
    const l: any = { term, ror: null, publicVars: [] };
    if (this.accept("FOR")) {
      this.expect("LBRACE");
      if (this.accept("PUBLICVARS")) {
        l.publicVars = this.parseIdentSeq();
      } else {
        this.expect("SECRET", "PUBLICVARS");
        const secret = this.ident();
        if (this.accept("PUBLICVARS")) {
          l.publicVars = this.parseIdentSeq();
        }
        this.expect("LBRACKET");
        const option = this.ident();
        this.expect("RBRACKET");
        l.ror = { secret, option };
      }
      this.expect("RBRACE");
    }
    l.start = ls;
    l.end = this.prevEnd();
    return l;
  }

  // Terms

  /**
   * Parses a possibly empty comma separated list of terms.
   *
   * @param {string} flavor The term grammar.
   * @param {Object} closer The token that ends the list.
   * @return {Array} The terms.
   */
  parseSeq(flavor: string, closer: any) {
    if (this.at(closer)) {
      return [];
    }
    const items = [this.parseTermBin(flavor, 0)];
    while (this.accept("COMMA")) {
      items.push(this.parseTermBin(flavor, 0));
    }
    return items;
  }

  /**
   * Parses a term by precedence climbing over the binary operators of its
   * grammar.
   *
   * "M + n" and "M - n" take an integer on their right.
   *
   * @param {string} flavor 'term', 'pterm', 'gterm' or 'gformat'.
   * @param {number} minPrec The lowest operator level that may be consumed.
   * @return {Object} The term.
   */
  parseTermBin(flavor: string, minPrec: number) {
    const ops = PvParser.FLAVORS[flavor];
    let left = this.parsePrimary(flavor);
    let lastPrec = -1;
    for (;;) {
      const t = this.peek();
      const info = PvParser.BIN[t.type];
      if (!info || !ops.has(t.type) || info.prec < minPrec) {
        break;
      }
      if (info.assoc === "nonassoc" && lastPrec === info.prec) {
        this.fail(t, []);
      }
      this.next();
      if (t.type === "PLUS" || t.type === "MINUS") {
        const nTok = this.expect("INT");
        left = { kind: t.type === "PLUS" ? "Plus" : "Minus", term: left, n: nTok.value, intFirst: false, start: left.pstart === undefined || left.pstart === null ? left.start : left.pstart, end: nTok.end };
        lastPrec = info.prec;
        continue;
      }
      const nextMin = info.assoc === "right" ? info.prec : info.prec + 1;
      const right = this.parseTermBin(flavor, nextMin);
      left = { kind: "BinOp", op: info.op, left, right, start: left.pstart === undefined || left.pstart === null ? left.start : left.pstart, end: right.pend === undefined || right.pend === null ? right.end : right.pend };
      lastPrec = info.prec;
    }
    return left;
  }

  /**
   * Parses an optional temporal annotation "@ i" after an atom of a query
   * (optatident).
   *
   * @param {Object} node The atom; its at field is set and its end extended.
   */
  parseAt(node: any) {
    if (!this.at("AT")) {
      return;
    }
    this.next();
    node.at = this.ident();
    this.features.add("temporal");
    node.end = this.prevEnd();
  }

  /**
   * Parses a primary term of a grammar.
   *
   * @param {string} flavor The term grammar.
   * @return {Object} The term node.
   */
  parsePrimary(flavor: string) {
    const t = this.peek();
    switch (t.type) {
      case "IDENT": {
        if (flavor === "pterm") {
          // x <-R T; M     x <- M; N     x: T <- M; N
          if (this.at("RANDOM", 1)) {
            const name = this.ident();
            this.next();
            const type = this.typeid();
            this.expect("SEMI");
            const body = this.parseTermBin("pterm", 0);
            return this.finish({ kind: "TNew", name, newArgs: null, type, body, random: true }, t);
          }
          if (this.at("LEFTARROW", 1) || this.at("COLON", 1)) {
            return this.parseArrowTLet(t);
          }
        }
        if ((flavor === "gterm" || flavor === "gformat") && this.at("LEFTARROW", 1)) {
          const name = this.ident();
          this.next();
          const value = this.parseTermBin(flavor, 0);
          this.expect("SEMI");
          const body = this.parseTermBin(flavor, 0);
          return this.finish({ kind: "GLet", name, value, body, arrow: true }, t);
        }
        const id = this.ident();
        if (this.at("LPAREN")) {
          this.next();
          const args = this.parseSeq(flavor, "RPAREN");
          this.expect("RPAREN");
          const node = this.finish({ kind: "App", fn: id, args }, t);
          if (flavor === "gterm") {
            if (this.accept("PHASE")) {
              node.phase = this.int();
            }
            this.parseAt(node);
            node.end = this.prevEnd();
          }
          return node;
        }
        return { kind: "Ident", name: id.name, start: id.start, end: id.end };
      }

      case "UNDERSCORE": {
        if (flavor === "pterm") {
          return this.parseArrowTLet(t);
        }
        break;
      }

      case "INT": {
        this.next();
        if (this.at("PLUS")) {
          // INT PLUS term: the rule has the precedence of PLUS (left associative)
          this.next();
          const term = this.parseTermBin(flavor, PvParser.BIN.PLUS.prec + 1);
          return { kind: "Plus", term, n: t.value, intFirst: true, start: t.start, end: term.pend === undefined || term.pend === null ? term.end : term.pend };
        }
        return { kind: "Int", value: t.value, start: t.start, end: t.end };
      }

      case "LPAREN": {
        this.next();
        const items = this.parseSeq(flavor, "RPAREN");
        this.expect("RPAREN");
        if (items.length === 1) {
          return { ...items[0], paren: true, pstart: t.start, pend: this.prevEnd() };
        }
        return this.finish({ kind: "Tuple", items }, t);
      }

      case "CHOICE": {
        this.next();
        this.expect("LBRACKET");
        const left = this.parseTermBin(flavor, 0);
        this.expect("COMMA");
        const right = this.parseTermBin(flavor, 0);
        this.expect("RBRACKET");
        // ProVerif sets has_choice for choice in terms, process terms and patterns, not in goals
        this.features.add(flavor === "gterm" || flavor === "gformat" ? "goal-choice" : "choice");
        return this.finish({ kind: "Choice", keyword: t.value, left, right }, t);
      }

      case "NOT": {
        if (flavor === "gformat") {
          break;
        }
        this.next();
        this.expect("LPAREN");
        const arg = this.parseTermBin(flavor, 0);
        this.expect("RPAREN");
        return this.finish({ kind: "Not", arg }, t);
      }

      case "FAIL":
        if (flavor !== "term") {
          break;
        }
        this.next();
        return this.finish({ kind: "Fail" }, t);

      case "PROJECTION": {
        if (flavor !== "term") {
          break;
        }
        this.next();
        this.expect("LPAREN");
        const arg = this.parseTermBin("term", 0);
        this.expect("RPAREN");
        return this.finish({ kind: "Proj", proj: t.value, arg }, t);
      }

      case "STAR": {
        if (flavor !== "gformat") {
          break;
        }
        this.next();
        const name = this.ident();
        return this.finish({ kind: "FAny", name }, t);
      }

      case "NEW": {
        if (flavor === "pterm") {
          this.next();
          const name = this.ident();
          const newArgs = this.parseNewArg();
          this.expect("COLON");
          const type = this.typeid();
          this.expect("SEMI");
          const body = this.parseTermBin("pterm", 0);
          return this.finish({ kind: "TNew", name, newArgs, type, body, random: false }, t);
        }
        if (flavor === "gterm" || flavor === "gformat") {
          this.next();
          const name = this.ident();
          let bindings = null;
          if (this.accept("LBRACKET")) {
            bindings = [];
            if (!this.at("RBRACKET")) {
              do {
                const bs = this.peek().start;
                let key;
                if (this.accept("REPL")) {
                  key = { repl: this.int() };
                } else {
                  key = this.ident();
                }
                this.expect("EQUAL");
                const term = this.parseTermBin(flavor, 0);
                bindings.push({ key, term, start: bs, end: this.prevEnd() });
              } while (this.accept("SEMI"));
            }
            this.expect("RBRACKET");
          }
          return this.finish({ kind: "GNew", name, bindings }, t);
        }
        break;
      }

      case "LET": {
        if (flavor === "gterm" || flavor === "gformat") {
          this.next();
          const name = this.ident();
          this.expect("EQUAL");
          const value = this.parseTermBin(flavor, 0);
          this.expect("IN");
          // the rule "LET IDENT EQUAL gterm IN gterm" has the precedence of EQUAL (%nonassoc)
          const body = this.parseTermBin(flavor, PvParser.BIN.EQUAL.prec + 1);
          if (flavor === "gterm" && this.at("EQUAL")) {
            this.fail(this.peek(), []);
          }
          return this.finish({ kind: "GLet", name, value, body, arrow: false }, t);
        }
        if (flavor === "pterm") {
          this.next();
          if (this.isLetFilter()) {
            const vars = this.parseNeVarType();
            this.expect("SUCHTHAT");
            const cond = this.parseTermBin("pterm", 0);
            this.expect("IN");
            const then = this.parseTermBin("pterm", 0);
            let els = null;
            if (this.accept("ELSE")) {
              els = this.parseTermBin("pterm", 0);
            }
            return this.finish({ kind: "TLetFilter", vars, cond, then, else: els }, t);
          }
          const pattern = this.parsePattern();
          this.expect("EQUAL");
          const value = this.parseTermBin("pterm", 0);
          this.expect("IN");
          const then = this.parseTermBin("pterm", 0);
          let els = null;
          if (this.accept("ELSE")) {
            els = this.parseTermBin("pterm", 0);
          }
          return this.finish({ kind: "TLet", pattern, value, then, else: els, arrow: false }, t);
        }
        break;
      }

      case "IF": {
        if (flavor !== "pterm") {
          break;
        }
        this.next();
        const cond = this.parseTermBin("pterm", 0);
        this.expect("THEN");
        const then = this.parseTermBin("pterm", 0);
        let els = null;
        if (this.accept("ELSE")) {
          els = this.parseTermBin("pterm", 0);
        }
        return this.finish({ kind: "TIf", cond, then, else: els }, t);
      }

      case "EVENT":
      case "INJEVENT": {
        if (flavor === "gterm") {
          this.next();
          this.expect("LPAREN");
          const args = this.parseSeq("gterm", "RPAREN");
          this.expect("RPAREN");
          const node = this.finish({ kind: "GEvent", injective: t.type === "INJEVENT", args, at: null }, t);
          this.parseAt(node);
          return node;
        }
        if (flavor === "pterm" && t.type === "EVENT") {
          this.next();
          const name = this.ident();
          let args = null;
          if (this.accept("LPAREN")) {
            args = this.parseSeq("pterm", "RPAREN");
            this.expect("RPAREN");
          }
          const newArgs = this.parseNewArg();
          this.expect("SEMI");
          const body = this.parseTermBin("pterm", 0);
          return this.finish({ kind: "TEvent", name, args, newArgs, body }, t);
        }
        break;
      }

      case "INSERT": {
        if (flavor !== "pterm") {
          break;
        }
        this.next();
        const table = this.ident();
        this.expect("LPAREN");
        const args = this.parseSeq("pterm", "RPAREN");
        this.expect("RPAREN");
        this.expect("SEMI");
        const body = this.parseTermBin("pterm", 0);
        return this.finish({ kind: "TInsert", table, args, body }, t);
      }

      case "GET": {
        if (flavor !== "pterm") {
          break;
        }
        this.next();
        const table = this.ident();
        this.expect("LPAREN");
        const patterns = this.parsePatternSeq();
        this.expect("RPAREN");
        let cond = null;
        if (this.accept("SUCHTHAT")) {
          cond = this.parseTermBin("pterm", 0);
        }
        const options = this.parseOptions();
        this.expect("IN");
        const then = this.parseTermBin("pterm", 0);
        let els = null;
        if (this.accept("ELSE")) {
          els = this.parseTermBin("pterm", 0);
        }
        return this.finish({ kind: "TGet", table, patterns, cond, options, then, else: els }, t);
      }

      case "TABLE": {
        if (flavor !== "gterm") {
          break;
        }
        this.next();
        this.expect("LPAREN");
        const arg = this.parseTermBin("gterm", 0);
        this.expect("RPAREN");
        const node = this.finish({ kind: "GTable", arg, phase: null, at: null }, t);
        if (this.accept("PHASE")) {
          node.phase = this.int();
        }
        this.parseAt(node);
        node.end = this.prevEnd();
        return node;
      }

      default:
        break;
    }
    this.fail(t, [], "unexpected " + t.describe() + "; expected a term");
    return null;
  }

  /**
   * Parses "basicpattern LEFTARROW pterm SEMI pterm" in a term.
   *
   * @param {Object} t The first token.
   * @return {Object} The TLet node.
   */
  parseArrowTLet(t: any) {
    const pattern = this.parseBasicPattern();
    this.expect("LEFTARROW");
    const value = this.parseTermBin("pterm", 0);
    this.expect("SEMI");
    const then = this.parseTermBin("pterm", 0);
    return this.finish({ kind: "TLet", pattern, value, then, else: null, arrow: true }, t);
  }

  /**
   * Parses an optional "[x1, ..., xn]" after new and event (newarg).
   *
   * @return {null} Null without brackets, else the identifiers.
   */
  parseNewArg() {
    if (!this.at("LBRACKET")) {
      return null;
    }
    this.next();
    if (this.accept("RBRACKET")) {
      return [];
    }
    const ids = this.parseIdentSeq();
    this.expect("RBRACKET");
    return ids;
  }

  /**
   * Decides, after "let", between "let x1: T1, ... suchthat" and "let pattern
   * =".
   *
   * Like the LR parser, it commits to the filter form when "x: T" is followed
   * by "," or "suchthat", or when "x" is followed by "," (the form "x, y:
   * T").
   *
   * @return {boolean} True for let ... suchthat.
   */
  isLetFilter(): boolean {
    if (!this.at("IDENT", 0)) {
      return false;
    }
    if (this.at("COMMA", 1)) {
      return true;
    }
    if (!this.at("COLON", 1)) {
      return false;
    }
    if (!(this.at("IDENT", 2) || this.at("CHANNEL", 2))) {
      return false;
    }
    return this.at("SUCHTHAT", 3) || this.at("COMMA", 3);
  }

  // Patterns

  /**
   * Parses basicpattern: "x", "x: T", "_" or "_: T".
   *
   * @return {Object} A PVar or PAny node.
   */
  parseBasicPattern() {
    const t = this.peek();
    if (t.type === "UNDERSCORE") {
      this.next();
      this.features.add("wildcard");
      let type = null;
      if (this.accept("COLON")) {
        type = this.typeid();
      }
      return this.finish({ kind: "PAny", type }, t);
    }
    const name = this.ident();
    let type = null;
    if (this.accept("COLON")) {
      type = this.typeid();
    }
    return this.finish({ kind: "PVar", name, type }, t);
  }

  /**
   * Parses a possibly empty comma separated list of patterns.
   */
  parsePatternSeq() {
    if (this.at("RPAREN")) {
      return [];
    }
    const ps = [this.parsePattern()];
    while (this.accept("COMMA")) {
      ps.push(this.parsePattern());
    }
    return ps;
  }

  /**
   * Parses a pattern, with the left associative "p + n".
   *
   * @param {number} minPrec The lowest operator level that may be consumed.
   * @return {Object} The pattern.
   */
  parsePattern(minPrec: number = 0) {
    let left = this.parsePatternPrimary();
    while (this.at("PLUS") && PvParser.BIN.PLUS.prec >= minPrec) {
      this.next();
      const nTok = this.expect("INT");
      left = { kind: "PPlus", pattern: left, n: nTok.value, intFirst: false, start: left.pstart === undefined || left.pstart === null ? left.start : left.pstart, end: nTok.end };
    }
    return left;
  }

  /**
   * Parses a primary pattern.
   *
   * @return {Object} The pattern node.
   */
  parsePatternPrimary() {
    const t = this.peek();
    switch (t.type) {
      case "IDENT": {
        if (this.at("LPAREN", 1)) {
          const fn = this.ident();
          this.next();
          const args = this.parsePatternSeq();
          this.expect("RPAREN");
          return this.finish({ kind: "PApp", fn, args }, t);
        }
        return this.parseBasicPattern();
      }

      case "UNDERSCORE":
        return this.parseBasicPattern();

      case "LPAREN": {
        this.next();
        const items = this.parsePatternSeq();
        this.expect("RPAREN");
        if (items.length === 1) {
          return { ...items[0], paren: true, pstart: t.start, pend: this.prevEnd() };
        }
        return this.finish({ kind: "PTuple", items }, t);
      }

      case "CHOICE": {
        this.next();
        this.expect("LBRACKET");
        const left = this.parsePattern();
        this.expect("COMMA");
        const right = this.parsePattern();
        this.expect("RBRACKET");
        let type = null;
        if (this.accept("COLON")) {
          type = this.typeid();
        }
        this.features.add("choice");
        return this.finish({ kind: "PChoice", keyword: t.value, left, right, type }, t);
      }

      case "INT": {
        this.next();
        if (this.at("PLUS")) {
          this.next();
          const pattern = this.parsePattern(PvParser.BIN.PLUS.prec + 1);
          return { kind: "PPlus", pattern, n: t.value, intFirst: true, start: t.start, end: pattern.pend === undefined || pattern.pend === null ? pattern.end : pattern.pend };
        }
        return { kind: "PInt", value: t.value, start: t.start, end: t.end };
      }

      case "EQUAL": {
        // "tpattern: EQUAL pterm" has the precedence of EQUAL (%nonassoc)
        this.next();
        const term = this.parseTermBin("pterm", PvParser.BIN.EQUAL.prec + 1);
        if (this.at("EQUAL")) {
          this.fail(this.peek(), []);
        }
        return this.finish({ kind: "PEq", term }, t);
      }

      default:
        this.fail(t, [], "unexpected " + t.describe() + "; expected a pattern");
        return null;
    }
  }

  // Processes

  /**
   * Parses "tprocess BAR tprocess" (%right BAR), the loosest construct.
   *
   * @return {Object} The process.
   */
  parseProcess() {
    const left = this.parseProcessUnary();
    if (this.at("BAR")) {
      this.next();
      const right = this.parseProcess();
      return { kind: "Par", left, right, start: left.start, end: right.end, hstart: left.start, hend: left.start };
    }
    return left;
  }

  /**
   * Parses opttprocess: "; P" or nothing (an implicit 0).
   *
   * @return {Object} The continuation.
   */
  optNext() {
    if (this.accept("SEMI")) {
      return this.parseProcess();
    }
    return this.implicitNil();
  }

  /**
   * Builds an implicit 0 at the current position.
   */
  implicitNil() {
    const p = this.prevEnd();
    return { kind: "Nil", yield: false, implicit: true, start: p, end: p, hstart: p, hend: p };
  }

  /**
   * Sets the extents of a process node: the whole construct and its head.
   *
   * @param {Object} node The node.
   * @param {Object} startTok Its first token.
   * @param {Object} hend End offset of its head.
   * @return {Object} The node.
   */
  procNode(node: any, startTok: any, hend: any) {
    node.start = startTok.start;
    node.hstart = startTok.start;
    node.hend = hend;
    node.end = this.prevEnd();
    return node;
  }

  /**
   * Parses an optional sync option of a process call: "[sync: no tag prefix]"
   * or "[sync: tag prefix x]".
   *
   * @return {null} Null, {prefix: null} for no prefix, or {prefix: Ident}.
   */
  parseSyncOpt() {
    // nothing but a sync option can follow a process call with a bracket
    if (!this.at("LBRACKET")) {
      return null;
    }
    const lb = this.next();
    this.expect("BARRIER");
    this.expect("COLON");
    const a = this.ident();
    const b = this.ident();
    const c = this.ident();
    const rb = this.expect("RBRACKET");
    if (a.name === "no" && b.name === "tag" && c.name === "prefix") {
      return { prefix: null, start: lb.start, end: rb.end };
    }
    if (a.name === "tag" && b.name === "prefix") {
      return { prefix: c, start: lb.start, end: rb.end };
    }
    throw new ParseError("Syntax error", rb.start, rb.end, "expected [sync: no tag prefix] or [sync: tag prefix x]");
  }

  /**
   * Parses a process other than a parallel composition.
   *
   * @return {Object} The process node.
   */
  parseProcessUnary() {
    const t = this.peek();
    switch (t.type) {
      case "LPAREN": {
        this.next();
        const body = this.parseProcess();
        this.expect("RPAREN");
        return this.procNode({ kind: "Paren", body }, t, t.end);
      }

      case "INT": {
        this.next();
        if (t.value !== 0) {
          throw new ParseError("The only integer in a process is 0 for the nil process", t.start, t.end);
        }
        return this.procNode({ kind: "Nil", yield: false, implicit: false }, t, t.end);
      }

      case "YIELD":
        this.next();
        return this.procNode({ kind: "Nil", yield: true, implicit: false }, t, t.end);

      case "REPL": {
        this.next();
        let index = null;
        if (this.at("IDENT") && this.at("LEQ", 1)) {
          const i = this.ident();
          this.next();
          const n = this.ident();
          index = { i, n };
        }
        const hend = this.prevEnd();
        const body = this.parseProcessUnary();
        return this.procNode({ kind: "Repl", body, index, foreach: false }, t, hend);
      }

      case "FOREACH": {
        this.next();
        const i = this.ident();
        this.expect("LEQ");
        const n = this.ident();
        this.expect("DO");
        const hend = this.prevEnd();
        const body = this.parseProcessUnary();
        return this.procNode({ kind: "Repl", body, index: { i, n }, foreach: true }, t, hend);
      }

      case "NEW": {
        this.next();
        const name = this.ident();
        const newArgs = this.parseNewArg();
        this.expect("COLON");
        const type = this.typeid();
        const hend = this.prevEnd();
        const next = this.optNext();
        return this.procNode({ kind: "New", name, newArgs, type, next, random: false }, t, hend);
      }

      case "IF": {
        this.next();
        const cond = this.parseTermBin("pterm", 0);
        this.expect("THEN");
        const hend = this.prevEnd();
        const then = this.parseProcess();
        let els = null;
        if (this.accept("ELSE")) {
          els = this.parseProcess();
        }
        return this.procNode({ kind: "If", cond, then, else: els }, t, hend);
      }

      case "IN": {
        this.next();
        this.expect("LPAREN");
        const chan = this.parseTermBin("pterm", 0);
        this.expect("COMMA");
        const pattern = this.parsePattern();
        this.expect("RPAREN");
        const options = this.parseOptions();
        const hend = this.prevEnd();
        const next = this.optNext();
        return this.procNode({ kind: "In", chan, pattern, options, next }, t, hend);
      }

      case "OUT": {
        this.next();
        this.expect("LPAREN");
        const chan = this.parseTermBin("pterm", 0);
        this.expect("COMMA");
        const msg = this.parseTermBin("pterm", 0);
        this.expect("RPAREN");
        const progEnd = !!this.accept("RBRACE");
        const hend = this.prevEnd();
        const next = this.optNext();
        return this.procNode({ kind: "Out", chan, msg, next, progEnd }, t, hend);
      }

      case "LET": {
        this.next();
        if (this.isLetFilter()) {
          const vars = this.parseNeVarType();
          this.expect("SUCHTHAT");
          const cond = this.parseTermBin("pterm", 0);
          const options = this.parseOptions();
          let hend = this.prevEnd();
          let then;
          let els = null;
          let hasIn = false;
          if (this.accept("IN")) {
            hasIn = true;
            hend = this.prevEnd();
            then = this.parseProcess();
            if (this.accept("ELSE")) {
              els = this.parseProcess();
            }
          } else {
            then = this.implicitNil();
          }
          return this.procNode({ kind: "LetFilter", vars, cond, options, then, else: els, hasIn }, t, hend);
        }
        const pattern = this.parsePattern();
        this.expect("EQUAL");
        const value = this.parseTermBin("pterm", 0);
        let hend = this.prevEnd();
        let then;
        let els = null;
        let hasIn = false;
        if (this.accept("IN")) {
          hasIn = true;
          hend = this.prevEnd();
          then = this.parseProcess();
          if (this.accept("ELSE")) {
            els = this.parseProcess();
          }
        } else {
          then = this.implicitNil();
        }
        return this.procNode({ kind: "Let", pattern, value, then, else: els, hasIn, arrow: false }, t, hend);
      }

      case "INSERT": {
        this.next();
        const table = this.ident();
        this.expect("LPAREN");
        const args = this.parseSeq("pterm", "RPAREN");
        this.expect("RPAREN");
        const hend = this.prevEnd();
        const next = this.optNext();
        return this.procNode({ kind: "Insert", table, args, next }, t, hend);
      }

      case "GET": {
        this.next();
        const table = this.ident();
        this.expect("LPAREN");
        const patterns = this.parsePatternSeq();
        this.expect("RPAREN");
        let cond = null;
        if (this.accept("SUCHTHAT")) {
          cond = this.parseTermBin("pterm", 0);
        }
        const options = this.parseOptions();
        let hend = this.prevEnd();
        let then;
        let hasIn = false;
        if (this.accept("IN")) {
          hasIn = true;
          hend = this.prevEnd();
          then = this.parseProcess();
        } else {
          then = this.implicitNil();
        }
        let els = null;
        if (this.accept("ELSE")) {
          els = this.parseProcess();
        }
        return this.procNode({ kind: "Get", table, patterns, cond, options, then, else: els, hasIn }, t, hend);
      }

      case "EVENT": {
        this.next();
        const name = this.ident();
        let args = null;
        if (this.accept("LPAREN")) {
          args = this.parseSeq("pterm", "RPAREN");
          this.expect("RPAREN");
        }
        const newArgs = this.parseNewArg();
        const hend = this.prevEnd();
        const next = this.optNext();
        return this.procNode({ kind: "Event", name, args, newArgs, next }, t, hend);
      }

      case "PHASE": {
        this.next();
        const nTok = this.expect("INT");
        const hend = this.prevEnd();
        const next = this.optNext();
        if (nTok.value <= 0) {
          throw new ParseError("Phases should be positive integers in processes", t.start, this.prevEnd());
        }
        return this.procNode({ kind: "Phase", n: nTok.value, next }, t, hend);
      }

      case "BARRIER": {
        this.next();
        const nTok = this.expect("INT");
        let tag = null;
        if (this.accept("LBRACKET")) {
          tag = this.ident();
          this.expect("RBRACKET");
        }
        const hend = this.prevEnd();
        const next = this.optNext();
        if (nTok.value <= 0) {
          throw new ParseError("Sync numbers should be positive integers", t.start, this.prevEnd());
        }
        this.features.add("sync");
        return this.procNode({ kind: "Sync", n: nTok.value, tag, next }, t, hend);
      }

      case "UNDERSCORE": {
        // _ <- M; P    _: T <- M; P
        const pattern = this.parseBasicPattern();
        this.expect("LEFTARROW");
        const value = this.parseTermBin("pterm", 0);
        const hend = this.prevEnd();
        const then = this.optNext();
        return this.procNode({ kind: "Let", pattern, value, then, else: null, hasIn: true, arrow: true }, t, hend);
      }

      case "IDENT": {
        // x <-R T; P
        if (this.at("RANDOM", 1)) {
          const name = this.ident();
          this.next();
          const type = this.typeid();
          const hend = this.prevEnd();
          const next = this.optNext();
          return this.procNode({ kind: "New", name, newArgs: null, type, next, random: true }, t, hend);
        }
        // x <- M; P    x: T <- M; P
        if (this.at("LEFTARROW", 1) || this.at("COLON", 1)) {
          const pattern = this.parseBasicPattern();
          this.expect("LEFTARROW");
          const value = this.parseTermBin("pterm", 0);
          const hend = this.prevEnd();
          const then = this.optNext();
          return this.procNode({ kind: "Let", pattern, value, then, else: null, hasIn: true, arrow: true }, t, hend);
        }
        // CryptoVerif implementation annotation: R [opts] { P
        if (this.at("LBRACE", 1) || (this.at("LBRACKET", 1) && !this.at("BARRIER", 2))) {
          const name = this.ident();
          const options = [];
          if (this.accept("LBRACKET")) {
            do {
              const a = this.ident();
              const dir = this.expect("GREATER", "LESS");
              const b = this.ident();
              options.push({ a, dir: dir.value, b });
            } while (this.accept("COMMA"));
            this.expect("RBRACKET");
          }
          this.expect("LBRACE");
          const hend = this.prevEnd();
          const body = this.parseProcess();
          return this.procNode({ kind: "ProgBegin", name, options, body }, t, hend);
        }
        const name = this.ident();
        let args = null;
        if (this.accept("LPAREN")) {
          args = this.parseSeq("pterm", "RPAREN");
          this.expect("RPAREN");
        }
        const sync = this.parseSyncOpt();
        return this.procNode({ kind: "Call", name, args, sync }, t, this.prevEnd());
      }

      default:
        this.fail(t, [], "unexpected " + t.describe() + "; expected a process");
        return null;
    }
  }
}
// ----------------------------------------------------------------
