/**
 * Writes the terms, patterns, process actions and declarations of ProVerif
 * in LaTeX for the Design mode. Identifiers, types and the applications of
 * symbols, with their notation, are written by NotationWriter (Studio Core),
 * which this class extends; what has no LaTeX form (terms with processes
 * inside, projections) is written as raw ProVerif code.
 *
 * What it writes, the notation table reads back to the same symbols; the
 * tests check it on every action of the corpus.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class LatexWriter extends NotationWriter {
  /**
   * Binding levels and associativity of ProVerif's operators.
   *
   * @type {Object}
   */
  static OPS = {
      "==>": { level: 1, assoc: "nonassoc", conv: "implies" }
    , "||": { level: 3, assoc: "right", conv: "or" }
    , "&&": { level: 4, assoc: "right", conv: "and" }
    , "=": { level: 5, assoc: "nonassoc", conv: "eq" }
    , "<>": { level: 6, assoc: "nonassoc", conv: "neq" }
    , "<=": { level: 7, assoc: "nonassoc", conv: "leq" }
    , ">=": { level: 8, assoc: "nonassoc", conv: "geq" }
    , ">": { level: 9, assoc: "nonassoc", conv: "gt" }
    , "<": { level: 10, assoc: "nonassoc", conv: "lt" }
  };

  /**
   * Level of "t + n" and "t - n".
   *
   * @type {number}
   */
  static PLUS_LEVEL = 11;

  /**
   * Level of the negation.
   *
   * @type {number}
   */
  static NOT_LEVEL = 70;

  // Terms

  /**
   * Writes a term.
   *
   * @param {Object} t The term.
   * @return {string} The LaTeX.
   */
  term(t: any): string {
    return this.termLevel(t).tex;
  }

  /**
   * Writes a term with its binding level.
   *
   * @param {Object} t The term.
   * @return {Object} {tex, level}.
   */
  termLevel(t: any) {
    const W = LatexWriter;
    const atom = tex => ({ tex, level: W.ATOM });
    switch (t.kind) {
      case "Ident":
        return atom(this.ident(t.name));

      case "Int":
        return atom(String(t.value));

      case "Fail":
        return atom(this.conv.get("fail"));

      case "App": {
        if (t.phase !== undefined && t.phase !== null) {
          return atom(this.raw(PvPrinter.term(t)));
        }
        const args = t.args.map(a => this.termLevel(a));
        const e = this.table ? this.table.notationOf(t.fn.name) : null;
        if (e && e.form !== "constant" && e.arity === t.args.length) {
          return this.applyNotation(e, args);
        }
        const role = this.role(t.fn.name, true);
        return atom(this.ident(t.fn.name, role) + "(" + args.map(a => a.tex).join(", ") + ")");
      }

      case "Tuple":
        return atom(W.fill(this.conv.get("tuple"), { "*": t.items.map(a => this.term(a)).join(", ") }));

      case "Choice":
        return atom(W.fill(this.conv.get("choice"), { 1: this.term(t.left), 2: this.term(t.right) }).replace("\\mathsf{diff}", t.keyword === "choice" ? "\\mathsf{choice}" : "\\mathsf{diff}"));

      case "BinOp": {
        const op = W.OPS[t.op];
        const l = this.termLevel(t.left);
        const r = this.termLevel(t.right);
        const lmin = op.level + 1;
        const rmin = op.assoc === "right" ? op.level : op.level + 1;
        return { tex: W.paren(l, lmin) + " " + this.conv.get(op.conv) + " " + W.paren(r, rmin), level: op.level };
      }

      case "Not": {
        const a = this.termLevel(t.arg);
        return { tex: this.conv.get("not") + " " + W.paren(a, W.NOT_LEVEL), level: W.NOT_LEVEL };
      }

      case "Plus":
      case "Minus": {
        const a = this.termLevel(t.term);
        if (t.intFirst) {
          return { tex: t.n + " + " + W.paren(a, W.PLUS_LEVEL + 1), level: W.PLUS_LEVEL };
        }
        return { tex: W.paren(a, W.PLUS_LEVEL) + " " + (t.kind === "Plus" ? "+" : "-") + " " + t.n, level: W.PLUS_LEVEL };
      }

      case "GEvent":
        return atom("\\mathsf{" + (t.injective ? "inj\\text{-}event" : "event") + "}(" + t.args.map(a => this.term(a)).join(", ") + ")" + (t.at ? "@" + this.ident(t.at.name) : ""));

      case "GTable":
        return atom("\\mathsf{table}(" + this.term(t.arg) + ")");

      case "GNew":
        return atom(t.bindings && t.bindings.length ? this.raw(PvPrinter.term(t)) : "\\mathsf{new}\\ " + this.ident(t.name.name));

      default:
        return atom(this.raw(PvPrinter.term(t)));
    }
  }

  // Patterns

  /**
   * Writes a pattern.
   *
   * @param {Object} p The pattern.
   * @return {string} The LaTeX.
   */
  pattern(p: any): string {
    return this.patternLevel(p).tex;
  }

  /**
   * Writes a pattern with its binding level.
   *
   * @param {Object} p The pattern.
   * @return {Object} {tex, level}.
   */
  patternLevel(p: any) {
    const W = LatexWriter;
    const atom = tex => ({ tex, level: W.ATOM });
    switch (p.kind) {
      case "PVar": {
        const v = this.ident(p.name.name, "var");
        return atom(p.type ? W.fill(this.conv.get("typed"), { 1: v, 2: this.type(p.type.name) }) : v);
      }

      case "PAny":
        return atom(p.type ? W.fill(this.conv.get("typed"), { 1: "\\_", 2: this.type(p.type.name) }) : "\\_");

      case "PTuple":
        return atom(W.fill(this.conv.get("tuple"), { "*": p.items.map(x => this.pattern(x)).join(", ") }));

      case "PEq":
        return atom("{=}" + W.paren(this.termLevel(p.term), W.ATOM));

      case "PApp": {
        const args = p.args.map(a => this.patternLevel(a));
        const e = this.table ? this.table.notationOf(p.fn.name) : null;
        if (e && e.form !== "constant" && e.arity === p.args.length) {
          return this.applyNotation(e, args);
        }
        return atom(this.ident(p.fn.name, "fun") + "(" + args.map(a => a.tex).join(", ") + ")");
      }

      case "PInt":
        return atom(String(p.value));

      case "PPlus": {
        const a = this.patternLevel(p.pattern);
        if (p.intFirst) {
          return { tex: p.n + " + " + W.paren(a, W.PLUS_LEVEL + 1), level: W.PLUS_LEVEL };
        }
        return { tex: W.paren(a, W.PLUS_LEVEL) + " + " + p.n, level: W.PLUS_LEVEL };
      }

      default:
        return atom(this.raw(PvPrinter.pattern(p)));
    }
  }

  // Process actions

  /**
   * Writes the head of a process action with the conventions.
   *
   * @param {Object} p The process node.
   * @return {string} The LaTeX.
   */
  action(p: any): string {
    const W = LatexWriter;
    const c = this.conv;
    const T = t => this.term(t);
    const Pt = x => this.pattern(x);
    switch (p.kind) {
      case "New": {
        let name = this.ident(p.name.name, "var");
        if (p.newArgs) {
          name += "[" + p.newArgs.map(a => this.ident(a.name, "var")).join(", ") + "]";
        }
        return W.fill(c.get("new"), { 1: name, 2: this.type(p.type.name) });
      }

      case "Let":
        return W.fill(c.get("let"), { 1: Pt(p.pattern), 2: T(p.value) });

      case "LetFilter":
        return W.fill(c.get("letFilter"), { 1: p.vars.map(v => W.fill(c.get("typed"), { 1: this.ident(v.name.name, "var"), 2: this.type(v.type.name) })).join(", "), 2: T(p.cond) });

      case "In":
        return W.fill(c.get("in"), { 1: T(p.chan), 2: Pt(p.pattern) });

      case "Out":
        return W.fill(c.get("out"), { 1: T(p.chan), 2: T(p.msg) });

      case "Event":
        return W.fill(c.get("event"), { 1: this.application(p.name.name, p.args ? p.args.map(a => this.termLevel(a)) : null, "event") });

      case "Insert":
        return W.fill(c.get("insert"), { 1: this.application(p.table.name, p.args.map(a => this.termLevel(a)), "table") });

      case "Get": {
        const row = this.application(p.table.name, p.patterns.map(x => this.patternLevel(x)), "table");
        return p.cond ? W.fill(c.get("getSuchthat"), { 1: row, 2: T(p.cond) }) : W.fill(c.get("get"), { 1: row });
      }

      case "If":
        return W.fill(c.get("if"), { 1: T(p.cond) });

      case "Phase":
        return W.fill(c.get("phase"), { 1: String(p.n) });

      case "Sync":
        return W.fill(c.get("sync"), { 1: String(p.n) }) + (p.tag ? "\\ [" + this.ident(p.tag.name, "var") + "]" : "");

      case "Call":
        return W.fill(c.get("call"), { 1: this.application(p.name.name, p.args ? p.args.map(a => this.termLevel(a)) : null, "process") });

      case "Nil":
        return c.get(p.yield ? "yield" : "nil");

      case "Repl":
        return p.index ? this.raw(PvPrinter.head(p)) : c.get("repl");

      case "Par":
        return c.get("par");

      default:
        return this.raw(PvPrinter.head(p));
    }
  }

  // Declarations (for the lists of the sidebar)

  /**
   * Writes the signature of a declaration for display.
   *
   * @param {Object} d The declaration.
   * @return {string} The LaTeX, or null when there is nothing better than the
   *   code.
   */
  declaration(d: any): string {
    const c = this.conv;
    const types = ts => (ts && ts.length ? ts.map(t => this.type(t.name)).join(" \\times ") : null);
    // typed variables, and a formula under them: "forall x: T; M = N" with its types framed
    const typed = vs => vs.map(v => LatexWriter.fill(c.get("typed"), { 1: this.ident(v.name.name, "var"), 2: this.type(v.type.name) })).join(", ");
    const quantified = (vs, body) => (vs && vs.length ? LatexWriter.fill(c.get("forall"), { 1: typed(vs), 2: body }) : body);
    const plain = list => list.every(item => !item.lets || !item.lets.length);
    switch (d.kind) {
      case "TypeDecl":
        return this.type(d.name.name);

      case "FunDecl": {
        const args = types(d.argTypes);
        const head = this.symbolPreview(d.name.name, d.argTypes.length, "fun");
        return head + " : " + (args ? args + " \\to " : "") + this.type(d.retType.name);
      }

      case "ConstDecl":
        return d.names.map(n => this.ident(n.name, "const")).join(", ") + " : " + this.type(d.type.name);

      case "FreeDecl":
        return d.names.map(n => this.ident(n.name, "var")).join(", ") + " : " + this.type(d.type.name);

      case "EventDecl":
        return d.argTypes && d.argTypes.length ? this.ident(d.name.name, "event") + "(" + d.argTypes.map(t => this.type(t.name)).join(", ") + ")" : this.ident(d.name.name, "event");

      case "TableDecl":
        return this.ident(d.name.name, "table") + "(" + d.argTypes.map(t => this.type(t.name)).join(", ") + ")";

      case "ChannelDecl":
        return d.names.map(n => this.ident(n.name, "var")).join(", ") + " : " + this.type("channel");

      case "PredDecl":
        return d.argTypes && d.argTypes.length ? this.ident(d.name.name, "pred") + "(" + d.argTypes.map(t => this.type(t.name)).join(", ") + ")" : this.ident(d.name.name, "pred");

      case "ReducDecl":
        if (!plain(d.rules)) {
          return null;
        }
        return d.rules.map((r, i) => (i && r.otherwise ? "\\ \\mathsf{otherwise}\\ " : (i ? ";\\ " : ""))
          + quantified(r.forall, LatexWriter.fill(c.get("reduces"), { 1: this.term(r.lhs), 2: this.term(r.rhs) }))).join("");

      case "EquationDecl":
        return plain(d.eqs) ? d.eqs.map(e => quantified(e.forall, this.term(e.term))).join(";\\ ") : null;

      case "LetFunDecl":
        return this.ident(d.name.name, "fun") + (d.params && d.params.length ? "(" + typed(d.params) + ")" : "") + " = " + this.term(d.body);

      default:
        return c ? null : null;
    }
  }

}
// ----------------------------------------------------------------
