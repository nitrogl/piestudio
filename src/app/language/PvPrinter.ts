/**
 * Pretty-printer from the syntax tree to canonical ProVerif source.
 *
 * What it guarantees (and what the tests check over the corpus): parsing its
 * output gives back the same tree (modulo explicit parentheses, positions and
 * comments), and ProVerif accepts it. It adds parentheses wherever the yacc
 * precedences, the dangling else or the open continuations of processes
 * require them.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvPrinter {
  /**
   * Precedence levels of the binary operators (as in PvParser.BIN).
   *
   * @type {Object}
   */
  static BIN_PREC = { "==>": 1, "||": 3, "&&": 4, "=": 5, "<>": 6, "<=": 7, ">=": 8, ">": 9, "<": 10 };

  /**
   * Associativity of the binary operators.
   *
   * @type {Object}
   */
  static BIN_ASSOC = { "==>": "nonassoc", "||": "right", "&&": "right", "=": "nonassoc", "<>": "nonassoc", "<=": "nonassoc", ">=": "nonassoc", ">": "nonassoc", "<": "nonassoc" };

  /**
   * Term constructs that extend as far as possible to the right.
   *
   * @type {Set<string>}
   */
  static PREFIX_TERMS: Set<string> = new Set(["TNew", "TIf", "TLet", "TLetFilter", "TEvent", "TInsert", "TGet", "GLet"]);

  /**
   * Enriched terms laid out on several lines in letfun bodies.
   *
   * @type {Set<string>}
   */
  static MULTILINE_TERMS: Set<string> = new Set(["TNew", "TIf", "TLet", "TLetFilter", "TEvent", "TInsert", "TGet"]);

  /**
   * Default options.
   *
   * @type {Object}
   */
  static DEFAULTS = { indent: "  ", comments: true, width: 100 };

  opts: any;

  /**
   * Prepares a printer.
   *
   * @param {Object} opts {indent, comments, width}.
   */
  constructor(opts: any = {}) {
    this.opts = { ...PvPrinter.DEFAULTS, ...opts };
  }

  // Static shortcuts

  /**
   * Prints a term on one line. @param t the term @return the text.
   */
  static term(t) {
    return new PvPrinter().term(t);
  }

  /**
   * Prints a pattern. @param p the pattern @return the text.
   */
  static pattern(p) {
    return new PvPrinter().pattern(p);
  }

  /**
   * Prints a process. @param p the process @param opts options @param level
   * indentation @return the text.
   */
  static process(p, opts = {}, level = 0) {
    return new PvPrinter(opts).process(p, level);
  }

  /**
   * Prints a declaration. @param d the declaration @param opts options
   * @return the text.
   */
  static decl(d, opts = {}) {
    return new PvPrinter(opts).decl(d);
  }

  /**
   * Prints a program. @param prog the program @param opts options @return the
   * text.
   */
  static program(prog, opts = {}) {
    return new PvPrinter(opts).program(prog);
  }

  /**
   * Prints variable declarations. @param vs the declarations @return "x: T,
   * y: U or fail".
   */
  static varTypes(vs) {
    return new PvPrinter().varTypes(vs);
  }

  /**
   * Prints a query. @param q the query @return the text.
   */
  static query(q) {
    return new PvPrinter().query(q);
  }

  /**
   * Prints options. @param opts the options @return " [a, b]" or "".
   */
  static options(opts) {
    return new PvPrinter().options(opts);
  }

  /**
   * Prints the head of a process action. @param p the process @return the
   * text.
   */
  static head(p) {
    return new PvPrinter().headText(p);
  }

  /**
   * Tells whether a let is written with an arrow, "x <- M;", the style of
   * CryptoVerif: only when it binds a variable or _, without else branch,
   * which is all that ProVerif reads in that style.
   *
   * @param {Object} p A Let process or a TLet term.
   * @return {boolean} Whether it is written with the arrow.
   */
  static arrowLet(p: any): boolean {
    return !!p.arrow && !p.else && Ast.basicPattern(p.pattern);
  }

  /**
   * Tells whether a new name is written "k <-R key", the style of
   * CryptoVerif: only when the name has no arguments.
   *
   * @param {Object} p A New process or a TNew term.
   * @return {boolean} Whether it is written with the random arrow.
   */
  static randomNew(p: any): boolean {
    return !!p.random && !p.newArgs;
  }

  // Terms

  /**
   * Gives the precedence level of a term as an operand.
   *
   * @param {Object} t The term.
   * @return {Object} 0 for prefix constructs, 100 for atoms.
   */
  termPrec(t: any) {
    switch (t.kind) {
      case "BinOp":
        return PvPrinter.BIN_PREC[t.op];

      case "Plus":
      case "Minus":
        return 11;

      default:
        return PvPrinter.PREFIX_TERMS.has(t.kind) ? 0 : 100;
    }
  }

  /**
   * Joins printed arguments, never producing "(*" which would open a comment.
   *
   * @param {Array} parts Printed arguments.
   * @return {Object} The comma separated text.
   */
  joinArgs(parts: any[]) {
    return parts.map((p, i) => (i === 0 && p.startsWith("*") ? " " + p : p)).join(", ");
  }

  /**
   * Prints options.
   *
   * @param {Object} opts The options.
   * @return {Object} " [a, b = c]" or "".
   */
  options(opts: any) {
    if (!opts || !opts.length) {
      return "";
    }
    return " [" + opts.map(o => {
      if (o.value === null || o.value === undefined) {
        return o.name.name;
      }
      if (o.braces || o.value.length !== 1) {
        return o.name.name + " = {" + o.value.map(v => v.name).join(", ") + "}";
      }
      return o.name.name + " = " + o.value[0].name;
    }).join(", ") + "]";
  }

  /**
   * Prints "[x1, ..., xn]" after new and event.
   *
   * @param {Object} a The identifiers or null.
   * @return {string} The text.
   */
  newArgs(a: any): string {
    if (a === null || a === undefined) {
      return "";
    }
    return "[" + a.map(x => x.name).join(", ") + "]";
  }

  /**
   * Prints a term on one line.
   *
   * @param {Object} t The term.
   * @return {string} The text.
   */
  term(t: any): string {
    switch (t.kind) {
      case "Ident":
        return t.name;
        
      case "Int":
        return String(t.value);
        
      case "Fail":
        return "fail";
        
      case "App": {
        let s = t.fn.name + "(" + this.joinArgs(t.args.map(a => this.term(a))) + ")";
        if (t.phase !== undefined && t.phase !== null) {
          s += " phase " + t.phase;
        }
        if (t.at) {
          s += "@" + t.at.name;
        }
        return s;
      }

      case "Tuple":
        return "(" + this.joinArgs(t.items.map(a => this.term(a))) + ")";
        
      case "Choice":
        return t.keyword + "[" + this.term(t.left) + ", " + this.term(t.right) + "]";
        
      case "Not":
        return "not(" + this.term(t.arg) + ")";
        
      case "Proj":
        return t.proj + "(" + this.term(t.arg) + ")";
        
      case "FAny":
        return "*" + t.name.name;
        
      case "Plus": {
        if (t.intFirst) {
          const inner = this.termPrec(t.term) <= 11 ? "(" + this.term(t.term) + ")" : this.term(t.term);
          return t.n + " + " + inner;
        }
        const inner = this.termPrec(t.term) < 11 ? "(" + this.term(t.term) + ")" : this.term(t.term);
        return inner + " + " + t.n;
      }

      case "Minus": {
        const inner = this.termPrec(t.term) < 11 ? "(" + this.term(t.term) + ")" : this.term(t.term);
        return inner + " - " + t.n;
      }

      case "BinOp":
        return this.binOp(t);
        
      case "GEvent":
        return (t.injective ? "inj-event" : "event") + "(" + this.joinArgs(t.args.map(a => this.term(a))) + ")" + (t.at ? "@" + t.at.name : "");
        
      case "GTable":
        return "table(" + this.term(t.arg) + ")" + (t.phase !== null && t.phase !== undefined ? " phase " + t.phase : "") + (t.at ? "@" + t.at.name : "");
        
      case "GNew": {
        if (t.bindings === null) {
          return "new " + t.name.name;
        }
        return "new " + t.name.name + "[" + t.bindings.map(b => (b.key.repl !== undefined ? "!" + b.key.repl : b.key.name) + " = " + this.term(b.term)).join("; ") + "]";
      }

      case "GLet": {
        if (t.arrow) {
          return t.name.name + " <- " + this.term(t.value) + "; " + this.term(t.body);
        }
        // the body of "let x = M in N" in queries only extends over operators tighter than "="
        const body = this.termPrec(t.body) <= 5 ? "(" + this.term(t.body) + ")" : this.term(t.body);
        return "let " + t.name.name + " = " + this.term(t.value) + " in " + body;
      }

      case "TNew":
        return PvPrinter.randomNew(t)
          ? t.name.name + " <-R " + t.type.name + "; " + this.term(t.body)
          : "new " + t.name.name + this.newArgs(t.newArgs) + ": " + t.type.name + "; " + this.term(t.body);
          
      case "TIf":
        return "if " + this.term(t.cond) + " then " + this.term(t.then) + (t.else ? " else " + this.term(t.else) : "");
        
      case "TLet":
        if (PvPrinter.arrowLet(t)) {
          return this.pattern(t.pattern) + " <- " + this.term(t.value) + "; " + this.term(t.then);
        }
        return "let " + this.pattern(t.pattern) + " = " + this.term(t.value) + " in " + this.term(t.then) + (t.else ? " else " + this.term(t.else) : "");
        
      case "TLetFilter":
        return "let " + this.varTypes(t.vars) + " suchthat " + this.term(t.cond) + " in " + this.term(t.then) + (t.else ? " else " + this.term(t.else) : "");
        
      case "TEvent":
        return "event " + t.name.name + (t.args ? "(" + this.joinArgs(t.args.map(a => this.term(a))) + ")" : "") + this.newArgs(t.newArgs) + "; " + this.term(t.body);
        
      case "TInsert":
        return "insert " + t.table.name + "(" + this.joinArgs(t.args.map(a => this.term(a))) + "); " + this.term(t.body);
        
      case "TGet":
        return "get " + t.table.name + "(" + this.joinArgs(t.patterns.map(p => this.pattern(p))) + ")" + (t.cond ? " suchthat " + this.term(t.cond) : "") + this.options(t.options) + " in " + this.term(t.then) + (t.else ? " else " + this.term(t.else) : "");
      
      /* There shouldn't be a default here */
      default:
        throw new Error("PvPrinter.term: unknown node " + t.kind);
    }
  }

  /**
   * Prints a binary operation with the parentheses its operands need.
   *
   * @param {Object} t The BinOp node.
   * @return {string} The text.
   */
  binOp(t: any): string {
    const p = PvPrinter.BIN_PREC[t.op];
    const assoc = PvPrinter.BIN_ASSOC[t.op];
    const lp = this.termPrec(t.left);
    const rp = this.termPrec(t.right);
    const lNeed = lp < p || (lp === p && assoc !== "left") || t.left.kind === "GLet";
    // I always parenthesise prefix constructs as operands: what follows them would be absorbed
    const rNeed = rp < p || (rp === p && assoc !== "right");
    const l = lNeed ? "(" + this.term(t.left) + ")" : this.term(t.left);
    const r = rNeed ? "(" + this.term(t.right) + ")" : this.term(t.right);
    
    return l + " " + t.op + " " + r;
  }

  /**
   * Prints a term that is followed by more tokens (for example the condition
   * of an if).
   *
   * @param {Object} t The term.
   * @return {string} The text, in parentheses when it is a prefix construct.
   */
  termClosed(t: any): string {
    const s = this.term(t);
    
    return PvPrinter.PREFIX_TERMS.has(t.kind) ? "(" + s + ")" : s;
  }

  /**
   * Prints a pattern.
   *
   * @param {Object} p The pattern.
   * @return {string} The text.
   */
  pattern(p: any): string {
    switch (p.kind) {
      case "PVar":
        return p.type ? p.name.name + ": " + p.type.name : p.name.name;
        
      case "PAny":
        return p.type ? "_: " + p.type.name : "_";
        
      case "PTuple":
        return "(" + this.joinArgs(p.items.map(x => this.pattern(x))) + ")";
        
      case "PApp":
        return p.fn.name + "(" + this.joinArgs(p.args.map(x => this.pattern(x))) + ")";
        
      case "PEq":
        return "=" + this.term(p.term);
        
      case "PInt":
        return String(p.value);
        
      case "PChoice":
        return p.keyword + "[" + this.pattern(p.left) + ", " + this.pattern(p.right) + "]" + (p.type ? ": " + p.type.name : "");
        
      case "PPlus": {
        const inner = p.pattern.kind === "PPlus" && p.intFirst ? "(" + this.pattern(p.pattern) + ")" : this.pattern(p.pattern);
        return p.intFirst ? p.n + " + " + inner : inner + " + " + p.n;
      }

      default:
        throw new Error("PvPrinter.pattern: unknown node " + p.kind);
    }
  }

  /**
   * Prints variable declarations.
   *
   * @param {Object} vs The declarations.
   * @return {Object} "x: T, y: U or fail".
   */
  varTypes(vs: any) {
    return vs.map(v => v.name.name + ": " + v.type.name + (v.mayFail ? " or fail" : "")).join(", ");
  }

  // Processes

  /**
   * Tells whether printing a process leaves an open conditional at its end
   * (dangling else).
   *
   * @param {Object} p The process.
   * @return {boolean} True when a following "else" would attach inside.
   */
  openTail(p: any): boolean {
    switch (p.kind) {
      case "New":
      case "In":
      case "Out":
      case "Event":
      case "Insert":
      case "Phase":
      case "Sync":
        return this.openTail(p.next);
        
      case "If":
      case "Let":
      case "LetFilter":
      case "Get":
        if (p.else) {
          return this.openTail(p.else);
        }
        if (p.kind === "Let" && (PvPrinter.arrowLet(p) || !p.hasIn)) {
          return p.hasIn ? this.openTail(p.then) : false;
        }
        return true;
        
      case "Par":
        return this.openTail(p.right);
        
      case "Repl":
        return this.openTail(p.body);
        
      case "ProgBegin":
        return this.openTail(p.body);
      
      default:
        return false;
    }
  }

  /**
   * Tells whether a process is atomic enough to print on one line after a
   * replication.
   *
   * @param {Object} p The process.
   * @return {boolean} True for 0, calls and replicated atoms.
   */
  isAtomicProc(p: any): boolean {
    return p.kind === "Nil" || p.kind === "Call" || (p.kind === "Repl" && !p.index && this.isAtomicProc(p.body));
  }

  /**
   * Tells whether "let p = M" or "get ..." needs its "in" (because a
   * continuation or an else follows).
   *
   * @param {Object} p The process.
   * @return {boolean} True when "in" must be printed.
   */
  needsIn(p: any): boolean {
    if (p.kind === "Get") {
      return p.hasIn || !(p.then.kind === "Nil" && p.then.implicit);
    }
    return p.hasIn || !(p.then.kind === "Nil" && p.then.implicit) || !!p.else;
  }

  /**
   * Prints the head of a process action, without its continuation.
   *
   * @param {Object} p The process.
   * @return {string} The text.
   */
  headText(p: any): string {
    switch (p.kind) {
      case "New":
        return PvPrinter.randomNew(p) ? p.name.name + " <-R " + p.type.name : "new " + p.name.name + this.newArgs(p.newArgs) + ": " + p.type.name;
        
      case "In":
        return "in(" + this.term(p.chan) + ", " + this.pattern(p.pattern) + ")" + this.options(p.options);
        
      case "Out":
        return "out(" + this.term(p.chan) + ", " + this.term(p.msg) + ")" + (p.progEnd ? " }" : "");
        
      case "Event":
        return "event " + p.name.name + (p.args ? "(" + this.joinArgs(p.args.map(a => this.term(a))) + ")" : "") + this.newArgs(p.newArgs);
        
      case "Insert":
        return "insert " + p.table.name + "(" + this.joinArgs(p.args.map(a => this.term(a))) + ")";
        
      case "Phase":
        return "phase " + p.n;
        
      case "Sync":
        return "sync " + p.n + (p.tag ? " [" + p.tag.name + "]" : "");
        
      case "If":
        return "if " + this.termClosed(p.cond) + " then";
        
      case "Let":
        if (PvPrinter.arrowLet(p)) {
          return this.pattern(p.pattern) + " <- " + this.term(p.value);
        }
        return "let " + this.pattern(p.pattern) + " = " + this.term(p.value) + (this.needsIn(p) ? " in" : "");
        
      case "LetFilter":
        return "let " + this.varTypes(p.vars) + " suchthat " + this.term(p.cond) + this.options(p.options) + (this.needsIn(p) ? " in" : "");
        
      case "Get":
        return "get " + p.table.name + "(" + this.joinArgs(p.patterns.map(x => this.pattern(x))) + ")" + (p.cond ? " suchthat " + this.term(p.cond) : "") + this.options(p.options) + (this.needsIn(p) ? " in" : "");
        
      case "Call": {
        const base = p.args ? p.name.name + "(" + this.joinArgs(p.args.map(a => this.term(a))) + ")" : p.name.name;
        if (!p.sync) {
          return base;
        }
        return base + (p.sync.prefix ? " [sync: tag prefix " + p.sync.prefix.name + "]" : " [sync: no tag prefix]");
      }

      case "Nil":
        return p.yield ? "yield" : "0";
        
      case "Repl":
        return p.foreach ? "foreach " + p.index.i.name + " <= " + p.index.n.name + " do" : (p.index ? "! " + p.index.i.name + " <= " + p.index.n.name : "!");
        
      case "ProgBegin":
        return String(p.name.name) + (p.options.length ? " [" + p.options.map(o => o.a.name + " " + o.dir + " " + o.b.name).join(", ") + "]" : "") + " {";
        
      default:
        return "";
    }
  }

  /**
   * Gives a one-line rendering of short simple processes.
   *
   * @param {Object} p The process.
   * @return {string} The text, or null when the process needs several lines.
   */
  inlineProc(p: any): string {
    if (p.leadingComments && p.leadingComments.length) {
      return null;
    }
    switch (p.kind) {
      case "Nil":
      case "Call":
        return this.headText(p);
        
      case "Repl": {
        if (p.foreach) {
          return null;
        }
        const b = this.inlineProc(p.body);
        if (b === null || p.body.kind === "Par") {
          return null;
        }
        return (p.index ? this.headText(p) + " " : "!") + b;
      }

      default:
        return null;
    }
  }

  /**
   * Prints a process.
   *
   * @param {Object} p The process.
   * @param {number} level Indentation level.
   * @return {string} The text.
   */
  process(p: any, level: number = 0): string {
    const out = new LineBuffer(this.opts);
    this.emitProc(p, level, out);
    
    return out.toString();
  }

  /**
   * Emits a process into a buffer.
   *
   * @param {Object} p The process.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   */
  emitProc(p: any, level: number, out: any) {
    out.comments(p, level);
    const seq = (head, next) => {
      if (next.kind === "Nil" && next.implicit) {
        out.line(level, head);
        out.trailing(p);
        return;
      }
      out.line(level, head + ";");
      out.trailing(p);
      this.emitProc(next, level, out);
    };
    switch (p.kind) {
      case "Nil":
      case "Call":
        out.line(level, this.headText(p)); out.trailing(p);
        return;
        
      case "New":
      case "In":
      case "Out":
      case "Event":
      case "Insert":
      case "Phase":
      case "Sync":
        seq(this.headText(p), p.next);
        return;
        
      case "Paren":
        out.line(level, "(");
        this.emitProc(p.body, level + 1, out);
        out.line(level, ")");
        return;
        
      case "Repl": {
        const inl = this.inlineProc(p);
        if (inl !== null) {
          out.line(level, inl);
          return;
        }
        const h = this.headText(p);
        if (p.body.kind === "Paren") {
          out.line(level, h + (p.foreach ? " (" : "("));
          this.emitProc(p.body.body, level + 1, out);
          out.line(level, ")");
          return;
        }
        if (this.isAtomicProc(p.body)) {
          const inlined = this.inlineProc(p.body);
          out.line(level, String(h) + (p.index || p.foreach ? " " : "") + (inlined === null || inlined === undefined ? this.headText(p.body) : inlined));
          return;
        }
        out.line(level, h + (p.foreach ? " (" : "("));
        this.emitProc(p.body, level + 1, out);
        out.line(level, ")");
        return;
      }

      case "ProgBegin":
        out.line(level, this.headText(p));
        this.emitProc(p.body, level, out);
        return;
        
      case "Let":
        if (PvPrinter.arrowLet(p)) {
          seq(this.headText(p), p.then);
          return;
        }
        
        if (!this.needsIn(p)) {
          out.line(level, this.headText(p));
          out.trailing(p);
          return;
        }
        
        this.emitBranching(p, level, out);
        return;
        
      case "LetFilter":
      case "Get":
        if (!this.needsIn(p)) {
          out.line(level, this.headText(p));
          out.trailing(p);
          if (p.else) {
            out.line(level, "else");
            this.emitProc(p.else, level + 1, out);
          }
          return;
        }
        this.emitBranching(p, level, out);
        return;
        
      case "If":
        this.emitBranching(p, level, out);
        return;
        
      case "Par":
        this.emitPar(p, level, out);
        return;
        
      default:
        throw new Error("PvPrinter.emitProc: unknown node " + p.kind);
    }
  }

  /**
   * Emits a conditional with its branches, protecting the then branch from
   * the dangling else.
   *
   * @param {Object} p The conditional.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   * @param {string} prefix "else " inside an else-if chain.
   */
  emitBranching(p: any, level: number, out: any, prefix: string = "") {
    const head = prefix + this.headText(p);
    
    if (!p.else) {
      out.line(level, head);
      out.trailing(p);
      this.emitProc(p.then, prefix ? level + 1 : level, out);
      return;
    }
    
    out.line(level, head);
    out.trailing(p);
    const thenNeedsParen = this.openTail(p.then) && p.then.kind !== "Paren";
    
    if (thenNeedsParen) {
      out.line(level + 1, "(");
      this.emitProc(p.then, level + 2, out);
      out.line(level + 1, ")");
    } else {
      this.emitProc(p.then, level + 1, out);
    }
    
    const e = p.else;
    if (e.kind === "If" && !(e.leadingComments && e.leadingComments.length)) {
      this.emitBranching(e, level, out, "else ");
      return;
    }
    
    out.line(level, "else");
    this.emitProc(e, level + 1, out);
  }

  /**
   * Flattens nested parallel compositions.
   *
   * @param {Object} p A Par node.
   * @return {Object} Its operands, left to right.
   */
  flattenPar(p: any) {
    const items = [];
    let cur = p;
    while (cur.kind === "Par" && !(cur !== p && cur.leadingComments && cur.leadingComments.length)) {
      items.push(cur.left);
      cur = cur.right;
    }
    items.push(cur);
    
    return items;
  }

  /**
   * Emits a parallel composition, on one line when it is short.
   *
   * @param {Object} p The Par node.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   */
  emitPar(p: any, level: number, out: any) {
    const items = this.flattenPar(p);
    const inl = items.map(x => this.inlineProc(x));
    
    if (inl.every(s => s !== null)) {
      const one = inl.join(" | ");
      if (one.length + level * this.opts.indent.length <= this.opts.width) {
        out.line(level, one);
        return;
      }
    }
    
    items.forEach((it, i) => {
      const body = it.kind === "Paren" ? it.body : it;
      if (i === 0) {
        out.line(level, "(");
      } else {
        out.append(" | (");
      }
      
      if (it.kind === "Paren") {
        out.comments(it, level + 1);
      }
      
      if (inl[i] !== null) {
        out.line(level + 1, inl[i]);
      } else {
        this.emitProc(body, level + 1, out);
      }
      
      out.line(level, ")");
    });
  }

  // Declarations

  /**
   * Prints the forall prefix of a rule.
   *
   * @param {Object} vs The variables.
   * @return {Object} "forall x: T; " or "".
   */
  forall(vs: any) {
    return vs.length ? "forall " + this.varTypes(vs) + "; " : "";
  }

  /**
   * Prints the "let x = t in" / "x <- t;" prefixes of an extended equation.
   *
   * @param {Array} lets The bindings.
   * @return {string} The text.
   */
  lets(lets: any[]): string {
    return (lets || []).map(l => (l.arrow ? l.name.name + " <- " + this.term(l.value) + "; " : "let " + l.name.name + " = " + this.term(l.value) + " in ")).join("");
  }

  /**
   * Prints the body of a rewrite rule (lhs = rhs, or the raw term when it is
   * not an equality).
   *
   * @param {Object} r The rule.
   * @return {string} The text.
   */
  ruleBody(r: any): string {
    if (r.lhs && r.rhs) {
      return this.term({ kind: "BinOp", op: "=", left: r.lhs, right: r.rhs });
    }
    return this.term(r.term);
  }

  /**
   * Prints a query.
   *
   * @param {Object} q The query.
   * @return {string} The text.
   */
  query(q: any): string {
    switch (q.kind) {
      case "RealQuery":
        return this.term(q.term) + (q.publicVars.length ? " public_vars " + q.publicVars.map(x => x.name).join(", ") : "");
        
      case "SecretQuery":
        return "secret " + q.name.name + (q.publicVars.length ? " public_vars " + q.publicVars.map(x => x.name).join(", ") : "") + this.options(q.options);
        
      case "PutBegin":
        return "putbegin " + (q.injective ? "inj-event" : "event") + ": " + q.names.map(x => x.name).join(", ");
        
      default:
        throw new Error("PvPrinter.query: " + q.kind);
    }
  }

  /**
   * Prints the "x: T;" prefix of a query, lemma, not or nounif.
   *
   * @param {Object} vs The variables.
   * @return {string} The text.
   */
  varsPrefix(vs: any): string {
    return vs.length ? this.varTypes(vs) + "; " : "";
  }

  /**
   * Prints the fact of a nounif declaration with its let bindings.
   *
   * @param {Function} f The NULet or NUFact node.
   * @return {string} The text.
   */
  noUnifFact(f: any): string {
    if (f.kind === "NULet") {
      if (f.arrow) {
        return f.name.name + " <- " + this.term(f.value) + "; " + this.noUnifFact(f.body);
      }
      
      return "let " + f.name.name + " = " + this.term(f.value) + " in " + this.noUnifFact(f.body);
    }
    
    let s = f.pred.name;
    if (f.args !== null) {
      s += "(" + this.joinArgs(f.args.map(a => this.term(a))) + ")";
    }
    
    if (f.phase !== null && f.phase !== undefined) {
      s += " phase " + f.phase;
    }
    
    return s;
  }

  /**
   * Prints a string literal with its escapes.
   *
   * @param {string} s The string.
   * @return {Object} The quoted text.
   */
  stringLit(s: string) {
    return "\"" + s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r").replace(/\x08/g, "\\b") + "\"";
  }

  /**
   * Emits an enriched term over several lines (letfun bodies).
   *
   * @param {Object} t The term.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   */
  emitTerm(t: any, level: number, out: any) {
    switch (t.kind) {
      case "TNew":
      case "TEvent":
      case "TInsert": {
        const s = this.term({ ...t, body: { kind: "Ident", name: "\u0000" } });
        out.line(level, s.slice(0, s.indexOf("\u0000")).trimEnd());
        this.emitTerm(t.body, level, out);
        return;
      }

      case "TLet":
        if (PvPrinter.arrowLet(t)) {
          out.line(level, this.pattern(t.pattern) + " <- " + this.term(t.value) + ";");
          this.emitTerm(t.then, level, out);
          return;
        }
        out.line(level, "let " + this.pattern(t.pattern) + " = " + this.term(t.value) + " in");
        this.branchTerm(t, level, out);
        return;
        
      case "TLetFilter":
        out.line(level, "let " + this.varTypes(t.vars) + " suchthat " + this.term(t.cond) + " in");
        this.branchTerm(t, level, out);
        return;
        
      case "TGet":
        out.line(level, "get " + t.table.name + "(" + this.joinArgs(t.patterns.map(x => this.pattern(x))) + ")" + (t.cond ? " suchthat " + this.term(t.cond) : "") + this.options(t.options) + " in");
        this.branchTerm(t, level, out);
        return;
        
      case "TIf":
        out.line(level, "if " + this.termClosed(t.cond) + " then");
        this.branchTerm(t, level, out);
        return;
        
      default:
        out.line(level, this.term(t));
    }
  }

  /**
   * Tells whether an enriched term ends with an open conditional.
   *
   * @param {Object} t The term.
   * @return {boolean} True when a following else would attach inside.
   */
  termOpenTail(t: any): boolean {
    switch (t.kind) {
      case "TNew":
      case "TEvent":
      case "TInsert":
        return this.termOpenTail(t.body);
        
      case "TLet":
        if (PvPrinter.arrowLet(t)) {
          return this.termOpenTail(t.then);
        }
        return t.else ? this.termOpenTail(t.else) : true;
        
      case "TIf":
      case "TLetFilter":
      case "TGet":
        return t.else ? this.termOpenTail(t.else) : true;
        
      default:
        return false;
    }
  }

  /**
   * Emits the branches of an enriched conditional term.
   *
   * @param {Object} t The term.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   */
  branchTerm(t: any, level: number, out: any) {
    if (!t.else) {
      this.emitTerm(t.then, level, out);
      return;
    }
    
    if (this.termOpenTail(t.then)) {
      out.line(level + 1, "(");
      this.emitTerm(t.then, level + 2, out);
      out.line(level + 1, ")");
    } else {
      this.emitTerm(t.then, level + 1, out);
    }
    
    out.line(level, "else");
    this.emitTerm(t.else, level + 1, out);
  }

  /**
   * Prints a declaration.
   *
   * @param {Object} d The declaration.
   * @return {string} The text.
   */
  decl(d: any): string {
    const out = new LineBuffer(this.opts);
    this.emitDecl(d, 0, out);
    
    return out.toString();
  }

  /**
   * Emits a declaration with its comments.
   *
   * @param {Object} d The declaration.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   */
  emitDecl(d: any, level: number, out: any) {
    this.emitDeclBody(d, level, out);
    out.trailing(d);
  }

  /**
   * Emits the text of a declaration.
   *
   * @param {Object} d The declaration.
   * @param {number} level Indentation level.
   * @param {Object} out The buffer.
   */
  emitDeclBody(d: any, level: number, out: any) {
    out.comments(d, level);
    const L = s => out.line(level, s);
    switch (d.kind) {
      case "TypeDecl":
        L("type " + d.name.name + this.options(d.options) + ".");
        return;
        
      case "FunDecl": {
        const sig = "fun " + d.name.name + "(" + d.argTypes.map(t => t.name).join(", ") + "): " + d.retType.name;
        if (!d.reduc) {
          L(String(sig) + this.options(d.options) + ".");
          return;
        }
        
        L(sig);
        
        d.reduc.forEach((r, i) => {
          const last = i === d.reduc.length - 1;
          L((i === 0 ? "reduc" : "otherwise") + " " + this.forall(r.forall) + this.lets(r.lets) + this.ruleBody(r) + (last ? this.options(d.options) + "." : ""));
        });
        
        return;
      }

      case "ReducDecl":
        d.rules.forEach((r, i) => {
          const last = i === d.rules.length - 1;
          const txt = String(this.forall(r.forall)) + this.lets(r.lets) + this.ruleBody(r) + (last ? this.options(d.options) + "." : ";");
          L(i === 0 ? "reduc " + txt : "      " + txt);
        });
        return;
        
      case "ConstDecl":
        L("const " + d.names.map(n => n.name).join(", ") + ": " + d.type.name + this.options(d.options) + ".");
        return;
        
      case "EquationDecl":
        d.eqs.forEach((e, i) => {
          const last = i === d.eqs.length - 1;
          const txt = String(this.forall(e.forall)) + this.lets(e.lets) + this.term(e.term) + (last ? this.options(d.options) + "." : ";");
          L(i === 0 ? "equation " + txt : "         " + txt);
        });
        return;
        
      case "EventDecl":
        L("event " + d.name.name + (d.argTypes ? "(" + d.argTypes.map(t => t.name).join(", ") + ")" : "") + ".");
        return;
        
      case "PredDecl":
        L("pred " + d.name.name + (d.argTypes ? "(" + d.argTypes.map(t => t.name).join(", ") + ")" : "") + this.options(d.options) + ".");
        return;
        
      case "TableDecl":
        L("table " + d.name.name + "(" + d.argTypes.map(t => t.name).join(", ") + ").");
        return;
        
      case "ProcessDecl":
        L("let " + d.name.name + (d.params ? "(" + this.varTypes(d.params) + ")" : "") + " =");
        this.emitProc(d.body, level + 1, out);
        out.append(".");
        return;
        
      case "LetFunDecl": {
        const head = "letfun " + d.name.name + (d.params ? "(" + this.varTypes(d.params) + ")" : "") + " =";
        
        if (!PvPrinter.MULTILINE_TERMS.has(d.body.kind)) {
          L(head + " " + this.term(d.body) + ".");
          return;
        }
        
        L(head);
        this.emitTerm(d.body, level + 1, out);
        out.append(".");
        
        return;
      }

      case "SetDecl": {
        const v = d.value;
        L("set " + d.name.name + " = " + (v.kind === "string" ? this.stringLit(v.value) : String(v.value)) + ".");
        return;
      }

      case "NoUnifDecl": {
        const w = d.weight ? "/" + (d.weight.neg ? "-" : "") + d.weight.n : "";
        L(d.keyword + " " + this.varsPrefix(d.vars) + this.noUnifFact(d.fact) + w + this.options(d.options) + ".");
        return;
      }

      case "QueryDecl": {
        const qs = d.queries.map(q => this.query(q));
        const prefix = "query " + this.varsPrefix(d.vars);
        const one = prefix + qs.join("; ") + this.options(d.options) + ".";
        if (one.length <= this.opts.width || qs.length === 1) {
          L(one);
          return;
        }
        L(prefix.trimEnd());
        qs.forEach((q, i) => out.line(level + 1, q + (i === qs.length - 1 ? this.options(d.options) + "." : ";")));
        return;
      }

      case "LemmaDecl": {
        const ls = d.lemmas.map(l => {
          let s = this.term(l.term);
          if (l.ror) {
            s += " for { secret " + l.ror.secret.name + (l.publicVars.length ? " public_vars " + l.publicVars.map(x => x.name).join(", ") : "") + " [" + l.ror.option.name + "] }";
          } else if (l.publicVars.length) {
            s += " for { public_vars " + l.publicVars.map(x => x.name).join(", ") + " }";
          }
          return s;
        });
        L(d.keyword + " " + this.varsPrefix(d.vars) + ls.join("; ") + this.options(d.options) + ".");
        return;
      }

      case "NonInterfDecl":
        L("noninterf " + this.varsPrefix(d.vars) + d.items.map(it => it.name.name + (it.among ? " among (" + this.joinArgs(it.among.map(a => this.term(a))) + ")" : "")).join(", ") + ".");
        return;
        
      case "WeakSecretDecl":
        L("weaksecret " + d.name.name + ".");
        return;
        
      case "NotDecl":
        L("not " + this.varsPrefix(d.vars) + this.term(d.term) + ".");
        return;
        
      case "ElimTrueDecl":
        L("elimtrue " + this.varsPrefix(d.vars) + this.term(d.term) + ".");
        return;
        
      case "ChannelDecl":
        L("channel " + d.names.map(n => n.name).join(", ") + ".");
        return;
        
      case "FreeDecl":
        L("free " + d.names.map(n => n.name).join(", ") + ": " + d.type.name + this.options(d.options) + ".");
        return;
        
      case "ClausesDecl":
        d.clauses.forEach((c, i) => {
          const last = i === d.clauses.length - 1;
          const body = c.kind === "fact" ? this.term(c.concl)
            : this.term(c.hyp) + " " + (c.kind === "clause" ? "->" : c.kind === "equiv" ? "<->" : "<=>") + " " + this.term(c.concl);
          const txt = String(this.forall(c.forall)) + body + (last ? "." : ";");
          L(i === 0 ? "clauses " + txt : "        " + txt);
        });
        return;
        
      case "DefineDecl":
        L("def " + d.name.name + "(" + d.params.map(x => x.name).join(", ") + ") {");
        d.decls.forEach(x => {
          if (x.blankBefore) {
            out.line(0, "");
          }

          this.emitDecl(x, level + 1, out);
        });
        L("}");
        return;
        
      case "ExpandDecl":
        L("expand " + d.name.name + "(" + d.args.map(x => x.name).join(", ") + ").");
        return;
        
      case "RawDecl":
        L(d.text);
        return;
        
      default:
        throw new Error("PvPrinter.decl: unknown declaration " + d.kind);
    }
  }

  /**
   * Prints a whole program.
   *
   * @param {Object} prog The Program node.
   * @return {string} The text, ending with a newline.
   */
  program(prog: any): string {
    const out = new LineBuffer(this.opts);
    prog.decls.forEach((d, i) => {
      if (i > 0 && (d.blankBefore || d.kind === "ProcessDecl" || prog.decls[i - 1].kind === "ProcessDecl")) {
        out.line(0, "");
      }
      this.emitDecl(d, 0, out);
    });
    
    for (const c of prog.trailingComments === undefined || prog.trailingComments === null ? [] : prog.trailingComments) {
      if (c.start < ((prog.processStart === undefined || prog.processStart === null ? Infinity : prog.processStart))) {
        out.comments({ leadingComments: [c] }, 0);
      }
    }
    
    if (prog.process) {
      if (out.lines.length) {
        out.line(0, "");
      }
      out.line(0, "process");
      this.emitProc(prog.process, 1, out);
    } else if (prog.equivalence) {
      if (out.lines.length) {
        out.line(0, "");
      }
      out.line(0, "equivalence");
      for (const p of prog.equivalence) {
        out.comments(p, 1);
        out.line(1, "(");
        this.emitProc(p.kind === "Paren" ? p.body : p, 2, out);
        out.line(1, ")");
      }
    }
    
    for (const c of prog.trailingComments === undefined || prog.trailingComments === null ? [] : prog.trailingComments) {
      if (c.start >= ((prog.processStart === undefined || prog.processStart === null ? Infinity : prog.processStart))) {
        out.comments({ leadingComments: [c] }, 0);
      }
    }
    
    return out.toString() + "\n";
  }
}
// ----------------------------------------------------------------
