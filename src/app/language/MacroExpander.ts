/**
 * Expansion of the "def M(x1, ..., xn) { ... }" and "expand M(a1, ..., an)."
 * macros.
 *
 * Follows expand_macros and rename_decl of pitsyntax.ml: the declarations of
 * a macro are copied at each expansion, its parameters are replaced by the
 * arguments, the identifiers already declared where the macro was defined
 * keep their meaning and every other identifier becomes "@n_x", where n
 * numbers the expansions. That is ProVerif's hygiene, and it is why errors
 * inside expanded macros mention identifiers such as "@2_x".
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class MacroExpander {
  /**
   * Identifiers that renaming never touches.
   *
   * @type {Set<string>}
   */
  static SPECIAL: Set<string> = new Set(["=", "<>", "not", "&&", "||", "event", "inj-event", "==>", "choice", ">", ">=", "<=", "<"]);

  checker: PvChecker;
  expansionNumber: number;

  /**
   * Prepares the expansion.
   *
   * @param {PvChecker} checker The PvChecker that receives diagnostics and
   *   symbols.
   */
  constructor(checker: PvChecker) {
    this.checker = checker;
    this.expansionNumber = 0;
  }

  /**
   * Lists the identifier a declaration declares (the declares function of
   * pitsyntax.ml).
   *
   * @param {Object} d A declaration.
   * @param {Function} onError Called with (message, node) when a reduc does
   *   not start with a function application.
   * @return {string} The identifier node, or null.
   */
  static declares(d: any, onError: Function = null): string {
    switch (d.kind) {
      case "TypeDecl":
      case "FunDecl":
      case "PredDecl":
      case "EventDecl":
      case "TableDecl":
      case "ProcessDecl":
      case "LetFunDecl":
        return d.name;

      case "ReducDecl": {
        const r = d.rules[0];
        const top = MacroExpander.topSymbol(r);
        if (top.error) {
          if (onError) {
            onError(top.error, top.node);
          }

          return null;
        }
        return top.fn;
      }

      default:
        return null;
    }
  }

  /**
   * Lists all identifiers declared by a declaration (one per name for free,
   * const and channel).
   *
   * @param {Object} d A declaration.
   * @param {Function} onError See declares.
   * @return {string} The identifier nodes.
   */
  static declaredIds(d: any, onError: Function = null) {
    if (d.kind === "ConstDecl" || d.kind === "FreeDecl" || d.kind === "ChannelDecl") {
      return d.names;
    }
    const one = MacroExpander.declares(d, onError);
    return one ? [one] : [];
  }

  /**
   * Finds the function defined by a rewrite rule (get_top_symbol_reduc).
   *
   * @param {Object} r A rule.
   * @return {Object} {fn} or {error, node}.
   */
  static topSymbol(r: any) {
    const t = r.term;
    if (t.kind === "BinOp" && t.op === "=") {
      if (t.left.kind === "App") {
        return { fn: t.left.fn };
      }
      return { error: "In \"reduc\", all rewrite rules should begin with function application", node: MacroExpander.extentOf(t.left) };
    }
    return { error: "In \"reduc\", all rewrite rules should be an equality between two terms", node: MacroExpander.extentOf(t) };
  }

  /**
   * Gives the extent ProVerif attaches to a term ("snd t").
   *
   * Parentheses are transparent in pitparser.mly: "( t )" is t with the
   * extent t had, so the parentheses around a term are not part of it (the
   * rules that contain it do cover them, which PvParser mirrors with
   * pstart).
   *
   * @param {Object} t A term.
   * @return {Object} {start, end}.
   */
  static extentOf(t: any) {
    return { start: t.start, end: t.end };
  }

  /**
   * Expands all macros.
   *
   * @param {Array} decls The top-level declarations.
   * @param {Object} alreadyDef Identifiers of the initial environment.
   * @return {Object} The expanded declarations (expanded copies carry
   *   __expansion).
   */
  run(decls: any[], alreadyDef: any) {
    return this.expand(decls, new Map(), new Set(alreadyDef), null);
  }

  /**
   * Expands a list of declarations with a given macro table.
   *
   * @param {Array} list The declarations.
   * @param {Object} table Macro name -> {decl, already, table, sym}.
   * @param {Object} alreadyDef Identifiers defined so far (extended).
   * @param {Object} ctx The ExpandDecl being expanded, or null at the top
   *   level.
   * @return {Object} The expanded declarations.
   */
  expand(list: any[], table: any, alreadyDef: any, ctx: any) {
    const c = this.checker;
    const out = [];
    for (const d of list) {
      if (d.kind === "DefineDecl") {
        if (table.has(d.name.name)) {
          c.error("Macro " + d.name.name + " already defined.", d.name);
          continue;
        }
        for (let i = 0; i < d.params.length; i++) {
          for (let j = i + 1; j < d.params.length; j++) {
            if (d.params[i].name === d.params[j].name) {
              c.error("Macro contains twice the argument " + d.params[i].name, d.params[j]);
              break;
            }
          }
        }
        const sym = c.newSymbol("macro", d.name.name, d.name, { decl: d });
        table = new Map(table).set(d.name.name, { decl: d, already: new Set(alreadyDef), table, sym });
        continue;
      }
      if (d.kind === "ExpandDecl") {
        const m = table.get(d.name.name);
        if (!m) {
          c.error("Macro " + d.name.name + " not defined.", d.name);
          continue;
        }
        c.ref(m.sym, d.name);
        if (m.decl.params.length !== d.args.length) {
          c.error("Macro " + d.name.name + " expects " + m.decl.params.length + " arguments, but is here given " + d.args.length + " arguments.", d.name);
          continue;
        }
        const applied = this.apply(d, m);
        if (!applied) {
          continue;
        }
        const where = ctx || d;
        const expanded = this.expand(applied, m.table, new Set(m.already), where);
        for (const x of expanded) {
          if (x.__expansion === undefined || x.__expansion === null) {
            x.__expansion = where;
          }
          for (const id of MacroExpander.declaredIds(x)) {
            alreadyDef.add(id.name);
          }
        }
        for (const a of d.args) {
          const e = c.global.get(a.name);

          if (e) {
            c.ref(e, a);
          }
        }
        out.push(...expanded);
        continue;
      }
      for (const id of MacroExpander.declaredIds(d)) {
        alreadyDef.add(id.name);
      }
      out.push(d);
    }
    return out;
  }

  /**
   * Renames the declarations of a macro for one expansion (apply in
   * pitsyntax.ml).
   *
   * @param {Object} exp The ExpandDecl.
   * @param {Object} m The macro table entry.
   * @return {Object|null} The renamed declarations, or null after an error.
   */
  apply(exp: any, m: any) {
    this.expansionNumber++;
    const n = this.expansionNumber;
    const ren = new Map();
    for (const a of m.already) {
      ren.set(a, a);
    }
    m.decl.params.forEach((p, i) => ren.set(p.name, exp.args[i].name));
    const rename = s => {
      if (MacroExpander.SPECIAL.has(s) || s.startsWith("!") || s.startsWith("-")) {
        return s;
      }
      if (!ren.has(s)) {
        ren.set(s, "@" + n + "_" + s);
      }
      return ren.get(s);
    };
    const out = [];
    for (const x of m.decl.decls) {
      if (x.kind === "SetDecl") {
        this.checker.error("set is not allowed inside macro definitions", x.name);
        return null;
      }
      if (x.kind === "DefineDecl") {
        this.checker.error("macro definitions are not allowed inside macro definitions", x.name);
        return null;
      }
      const proj = this.findProjection(x);
      if (proj) {
        this.checker.error("projections not allowed here", proj);
        return null;
      }
      out.push(this.renameDecl(x, rename));
    }
    return out;
  }

  /**
   * Looks for a projection in a declaration (they cannot be renamed).
   *
   * @param {Object} d A declaration.
   * @return {Object|null} The Proj node, or null.
   */
  findProjection(d: any) {
    let found = null;
    const visit = v => {
      if (found || v === null || typeof v !== "object") {
        return;
      }
      if (Array.isArray(v)) {
        v.forEach(visit);
        return;
      }
      if (v.kind === "Proj") {
        found = v;
        return;
      }
      for (const k of Object.keys(v)) {
        if (k !== "leadingComments" && k !== "trailingComments") {
          visit(v[k]);
        }
      }
    };
    visit(d);
    return found;
  }

  /**
   * Copies a declaration, renaming its identifiers.
   *
   * @param {Object} decl The declaration.
   * @param {Function} rename The renaming function.
   * @return {Object} The copy.
   */
  renameDecl(decl: any, rename: Function) {
    const copy = (n, key, parent) => {
      if (n === null || typeof n !== "object") {
        return n;
      }
      if (Array.isArray(n)) {
        return n.map(x => copy(x, key, parent));
      }
      if (key === "options" || key === "leadingComments" || key === "trailingComments") {
        return n;
      }
      if (parent && parent.kind === "Sync" && key === "tag") {
        return n;
      }
      if (parent && parent.kind === "ProgBegin" && (key === "name" || key === "options")) {
        return n;
      }
      const out: any = {};
      for (const k of Object.keys(n)) {
        out[k] = copy(n[k], k, n);
      }
      // identifier objects {name, start, end} and Ident terms
      if (typeof out.name === "string" && (out.kind === undefined || out.kind === "Ident")) {
        out.name = rename(out.name);
      }
      return out;
    };
    return copy(decl, null, null);
  }
}
// ----------------------------------------------------------------
