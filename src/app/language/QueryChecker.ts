/**
 * Checks of queries, lemmas, axioms, restrictions, "not" and "nounif"
 * declarations (ProVerif 2.05).
 *
 * ProVerif checks goals late. While it checks the declarations it only
 * records them (check_one); it looks at the phases they mention when the
 * processes are known (parse_file), translates the queries and the lemmas
 * after the processes (transl_query, transl_lemma), the "not" and "nounif"
 * declarations while it builds the clauses (get_not, get_nounif), and the
 * arguments of bound names "new n[x = M]" of queries even later
 * (check_delayed_names). PvChecker calls it at the same moments, so that its
 * first error is ProVerif's first error.
 *
 * A goal term is checked into a small record {type, vars, choice, isVar}:
 * vars are the ids of the variables it contains (after the substitution of
 * the "let" bindings of goals), which is what the premise checks need.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class QueryChecker {
  /**
   * Options that fix_query_options moves from the last "query secret" to the
   * whole query.
   *
   * @type {Set<string>}
   */
  static QUERY_OPTIONS: Set<string> = new Set(["maxSubset", "proveAll", "noneSat", "noneVerif", "discardSat", "discardVerif",
    "fullSat", "fullVerif", "instantiateSat", "instantiateVerif", "induction", "noInduction", "keep"]);

  /**
   * Functions that cannot appear in terms of goals (check_query_term).
   *
   * @type {Set<string>}
   */
  static NOT_IN_TERMS: Set<string> = new Set(["=", "<>", "<=", ">=", ">", "<", "is_nat", "==>", "&&", "||", "event", "inj-event", "table"]);

  /**
   * Functions that cannot appear in the argument of table(...) in goals
   * (check_table_term).
   *
   * @type {Set<string>}
   */
  static NOT_IN_TABLE_TERMS: Set<string> = new Set(["=", "<>", "==>", "&&", "||", "event", "inj-event", "table"]);

  /**
   * Functions that cannot be used as events (check_event).
   *
   * @type {Set<string>}
   */
  static NOT_IN_EVENTS: Set<string> = new Set(["||", "&&", "not", "==>", ">", "<", ">=", "<=", "is_nat"]);

  /**
   * How transl_option_lemma_query names each kind of goal.
   *
   * @type {Object}
   */
  static KIND_NAME = { query: "A query", axiom: "An axiom", lemma: "A lemma", restriction: "A restriction" };

  /**
   * The message for choice in lemmas of non-equivalence models.
   *
   * @type {string}
   */
  static LEMMA_CHOICE = "choice can only be used in lemmas when the main query is an equivalence of (bi)processes,\nor if they have been specified for a query secret with the option real_or_random or pv_real_or_random.";

  c: PvChecker;
  queryDecls: any[];
  lemmaDecls: any[];
  corresp: any[];
  delayed: any[];
  fresh: number;
  translated: Map<any, any>;
  maxPhase: number;

  /**
   * Prepares the checks for a checker.
   *
   * @param {PvChecker} checker The PvChecker that owns it.
   */
  constructor(checker: PvChecker) {
    this.c = checker;
    this.queryDecls = [];
    this.lemmaDecls = [];
    this.corresp = [];
    this.delayed = [];
    this.fresh = 0;
    this.translated = new Map();
  }

  // Small helpers

  /**
   * Gives the extent ProVerif attaches to a goal term (parentheses around it
   * excluded).
   *
   * @param {Object} t A node.
   * @return {Object} {start, end}.
   */
  static ext(t: any) {
    return { start: t.start, end: t.end };
  }

  /**
   * Makes the record of an ill-typed goal term.
   *
   * @param {Array} parts Records of sub-terms whose variables are kept.
   * @return {Object} The record.
   */
  unknown(parts: any[] = []) {
    const vars = new Set();
    for (const p of parts) {
      for (const v of p.vars) {
        vars.add(v);
      }
    }
    return { type: "?", vars, choice: parts.some(p => p.choice), isVar: false };
  }

  /**
   * Unions the variables of records.
   *
   * @param {Array} parts The records.
   * @return {Object} A new set.
   */
  static varsOf(parts: any[]) {
    const vars = new Set();
    for (const p of parts) {
      for (const v of p.vars) {
        vars.add(v);
      }
    }
    return vars;
  }

  /**
   * Tells whether a type is the time type (the unknown type is not).
   *
   * @param {Object} t A type.
   * @return {boolean} True for time.
   */
  static isTime(t: any): boolean {
    return t === "time";
  }

  /**
   * Looks at a goal term the way pitparser.mly builds it.
   *
   * My parser keeps operators, events, tables and integers as distinct nodes;
   * ProVerif turns all of them into function applications PGFunApp (or
   * PGPhase when a phase follows), with "0" as an identifier and "n + k" as k
   * applications of "+". The checks match on that shape, so it is rebuilt.
   *
   * @param {Object} t A goal term (gterm or gformat).
   * @return {Object} {tag, name, nameNode, args, at, phase}; tag is app,
   *   phase, ident, tuple, name, let or any.
   */
  view(t: any) {
    const whole = QueryChecker.ext(t);
    switch (t.kind) {
      case "App":
        return { tag: t.phase !== null && t.phase !== undefined ? "phase" : "app", name: t.fn.name, nameNode: t.fn, args: t.args, at: t.at || null, phase: t.phase };

      case "BinOp":
        return { tag: "app", name: t.op, nameNode: whole, args: [t.left, t.right], at: null };

      case "Not":
        return { tag: "app", name: "not", nameNode: whole, args: [t.arg], at: null };

      case "Choice":
        return { tag: "app", name: "choice", nameNode: whole, args: [t.left, t.right], at: null };

      case "GEvent":
        return { tag: "app", name: t.injective ? "inj-event" : "event", nameNode: whole, args: t.args, at: t.at || null };

      case "GTable":
        return { tag: t.phase !== null && t.phase !== undefined ? "phase" : "app", name: "table", nameNode: whole, args: [t.arg], at: t.at || null, phase: t.phase };

      case "Plus": {
        if (t.n === 0) {
          return this.view(t.term);
        }
        const inner = t.n === 1 ? t.term : { ...t, n: t.n - 1 };
        return { tag: "app", name: "+", nameNode: whole, args: [inner], at: null, virtual: true };
      }

      case "Int": {
        if (t.value === 0) {
          return { tag: "ident", name: "0", nameNode: { ...whole, virtual: true } };
        }
        return { tag: "app", name: "+", nameNode: { ...whole, virtual: true }, args: [{ kind: "Int", value: t.value - 1, start: t.start, end: t.end }], at: null };
      }

      case "Ident":
        return { tag: "ident", name: t.name, nameNode: t };

      case "Tuple":
        return { tag: "tuple", args: t.items };

      case "GNew":
        return { tag: "name" };

      case "GLet":
        return { tag: "let" };

      case "FAny":
        return { tag: "any", name: t.name.name, nameNode: t.name };

      default:
        return { tag: "other" };
    }
  }

  // Recording (check_one)

  /**
   * Records a query declaration (TQuery in check_one, with
   * fix_query_options).
   *
   * @param {Object} d The QueryDecl.
   */
  declareQuery(d: any) {
    const c = this.c;
    let options = d.options || [];
    let movedFrom = null;
    if (!options.length && d.queries.length) {
      const last = d.queries[d.queries.length - 1];
      if (last.kind === "SecretQuery" && last.options.length && last.options.every(o => !o.value && QueryChecker.QUERY_OPTIONS.has(o.name.name))) {
        options = last.options;
        movedFrom = last;
      }
    }
    c.noParamOptions(options);
    this.queryDecls.push({ decl: d, options, movedFrom });
    c.goalDecls.push({ decl: d, kind: "query" });
    this.corresp.push({ decl: d, terms: d.queries.filter(q => q.kind === "RealQuery").map(q => q.term) });
  }

  /**
   * Records a lemma, axiom or restriction declaration (TLemma in check_one).
   *
   * @param {Object} d The LemmaDecl.
   */
  declareLemma(d: any) {
    const c = this.c;
    c.noParamOptions(d.options || []);
    this.lemmaDecls.push({ decl: d, options: d.options || [] });
    c.goalDecls.push({ decl: d, kind: d.keyword });
    this.corresp.push({ decl: d, terms: d.lemmas.map(l => l.term) });
  }

  // Phases (parse_file)

  /**
   * Computes the largest phase as parse_file does, with its warnings and
   * errors.
   *
   * ProVerif folds over lists it built by prepending, so it visits the goals
   * from the last declared to the first, and "max a b" evaluates b first.
   */
  maxPhaseChecks() {
    const c = this.c;
    const mpp = c.keyCompromise === 2 ? 1 : c.maxPhase;
    let max = mpp;
    for (const item of [...this.corresp].reverse()) {
      for (const t of item.terms) {
        max = Math.max(max, this.maxPhaseQuery(t, mpp));
      }
    }
    for (const d of [...c.nots].reverse()) {
      max = Math.max(max, this.maxPhaseEvent(d.term, mpp));
    }
    for (const d of [...c.nounifs].reverse()) {
      max = Math.max(max, this.maxPhaseNounif(d.fact, mpp));
    }
    this.maxPhase = max;
  }

  /**
   * Gives the largest phase of a query (max_phase_query).
   *
   * @param {Object} t The goal term.
   * @param {Object} mpp The largest phase of the processes.
   * @return {Object} The phase.
   */
  maxPhaseQuery(t: any, mpp: any) {
    if (t.kind === "BinOp" && (t.op === "==>" || t.op === "||" || t.op === "&&")) {
      const b = this.maxPhaseQuery(t.right, mpp);
      const a = this.maxPhaseQuery(t.left, mpp);
      return Math.max(a, b);
    }
    if (t.kind === "GLet") {
      return this.maxPhaseQuery(t.body, mpp);
    }
    return this.maxPhaseEvent(t, mpp);
  }

  /**
   * Gives the phase of an atom of a goal (max_phase_event).
   *
   * @param {Object} t The atom.
   * @param {Object} mpp The largest phase of the processes.
   * @return {Object} The phase.
   */
  maxPhaseEvent(t: any, mpp: any) {
    const v = this.view(t);
    if (v.tag !== "phase") {
      return 0;
    }
    if (["mess", "attacker", "table"].includes(v.name)) {
      if (v.phase > mpp) {
        this.c.warn("phase greater than the maximum phase used in the process.\nIs that really what you want?", QueryChecker.ext(t));
      }
      return v.phase;
    }
    this.c.error("phases can be used only with attacker, mess, or table", v.nameNode);
    return 0;
  }

  /**
   * Gives the phase of a nounif declaration (max_phase_nounif,
   * max_phase_format).
   *
   * @param {Function} f The NULet or NUFact node.
   * @param {Object} mpp The largest phase of the processes.
   * @return {Object} The phase.
   */
  maxPhaseNounif(f: any, mpp: any) {
    if (f.kind === "NULet") {
      return this.maxPhaseNounif(f.body, mpp);
    }
    const n = f.phase === null || f.phase === undefined ? -1 : f.phase;
    const where = this.nounifPredExt(f);
    if (["attacker", "mess", "table"].includes(f.pred.name)) {
      if (n > mpp) {
        this.c.warn("nounif declaration for a phase greater than used", where);
      }
      return n;
    }
    if (n !== -1) {
      this.c.error("declared predicates do not depend on phases, so no phase should be specified in such facts in queries", where);
    }
    return 0;
  }

  /**
   * Gives the extent ProVerif gives to the predicate of a nounif fact.
   *
   * @param {Function} f The NUFact.
   * @return {Object} {start, end}.
   */
  nounifPredExt(f: any) {
    if (f.pred.name === "table" || f.pred.name === "event") {
      if (f.pred.start === f.start) {
        return QueryChecker.ext(f);
      }
    }
    return f.pred;
  }

  // Names and variables bound by the processes

  /**
   * Tells whether the processes are known well enough to resolve bound names.
   *
   * @return {boolean} True when there is a main process that parsed.
   */
  processKnown(): boolean {
    const p = this.c.program;
    return !!(p.process || p.equivalence) && !p.processBroken;
  }

  /**
   * Resolves "query secret x" and "public_vars x"
   * (find_all_var_name_in_glob_table).
   *
   * @param {number} id The identifier.
   * @return {Object} The expansion of x into the names and variables it
   *   denotes (one entry each).
   */
  findAllVarName(id: any) {
    const c = this.c;
    if (!this.processKnown()) {
      return [id.name];
    }
    const n = (c.boundNameCount.get(id.name) || 0) + (c.boundVarCount.get(id.name) || 0);
    if (n === 0) {
      c.error(id.name + " should be a bound name or a variable", id);
      return [];
    }
    for (const sym of c.boundNames.get(id.name) || []) {
      c.ref(sym, id);
    }
    return new Array(n).fill(id.name);
  }

  /**
   * Resolves "new n" in a goal (find_name_in_glob_table).
   *
   * @param {number} id The identifier of the name.
   * @return {Object} The restriction record {sym, scope, depth, inMacro},
   *   null after an error, or undefined when it cannot be told.
   */
  findName(id: any) {
    const c = this.c;
    if (!this.processKnown()) {
      return undefined;
    }
    const n = c.boundNameCount.get(id.name) || 0;
    if (n === 0) {
      c.error(id.name + " should be a bound name.", id);
      return null;
    }
    if (n > 1) {
      c.error(id.name + " cannot be used in queries, not, or nounif. Its definition is ambiguous. (For example, several restrictions might define " + id.name + ".)", id);
      return null;
    }
    const node = (c.boundNameNodes.get(id.name) || [])[0];
    const info = node ? c.restrictions.get(node) : null;
    if (info) {
      c.ref(info.sym, id);
    }
    return info || undefined;
  }

  // Terms of goals (check_query_term)

  /**
   * Checks an identifier used as a term of a goal (get_ident_any).
   *
   * @param {string} name The identifier.
   * @param {Object} node Where to report.
   * @param {Object} st The state.
   * @return {Object} The record.
   */
  identAny(name: string, node: any, st: any) {
    const c = this.c;
    const e = st.env.get(name);
    if (!e) {
      c.error("identifier " + name + " not defined", node);
      return this.unknown();
    }
    c.ref(e, node);
    switch (e.kind) {
      case "var":
        if (e.link) {
          return { ...e.link, vars: new Set(e.link.vars) };
        }
        return { type: e.type, vars: new Set([e.id]), choice: false, isVar: true };

      case "name":
        return { type: e.type, vars: new Set(), choice: false, isVar: false };

      case "fun":
        if (e.cat !== "data" && e.cat !== "constr") {
          c.error("function " + name + " is defined by \"reduc\". Such a function should not be used in a query", node);
          return this.unknown();
        }
        if (e.args.length) {
          c.error("function " + name + " has expects " + e.args.length + " arguments but is used without arguments", node);
          return { type: e.ret, vars: new Set(), choice: false, isVar: false };
        }
        return { type: e.ret, vars: new Set(), choice: false, isVar: false };

      default:
        c.error("identifier " + name + " should be a variable, a free name, or a function", node);
        return this.unknown();
    }
  }

  /**
   * Checks a term of a goal (check_query_term).
   *
   * @param {Object} t The term.
   * @param {Object} st The state {env, lemma, equivalence, choiceMsg,
   *   encode}.
   * @return {Object} The record {type, vars, choice, isVar}.
   */
  term(t: any, st: any) {
    const c = this.c;
    const v = this.view(t);
    switch (v.tag) {
      case "ident":
        return this.identAny(v.name, v.nameNode, st);

      case "phase":
        c.error("phase unexpected in query terms", QueryChecker.ext(t));
        return this.unknown();

      case "app": {
        if (v.at) {
          c.error("Unexpected temporal identifier " + v.at.name + " in query terms.", v.at);
          return this.unknown();
        }
        if (QueryChecker.NOT_IN_TERMS.has(v.name)) {
          c.error(v.name + " unexpected in query terms", v.nameNode);
          return this.unknown();
        }
        const args = v.args.map(a => this.term(a, st));
        const r = c.getFun(v.name, v.nameNode, args.map(a => a.type), st.env);
        if (!r) {
          return this.unknown(args);
        }
        const cat = c.categoryOf(r);
        if (cat === "choice") {
          if (st.choiceMsg) {
            c.error(st.choiceMsg, v.nameNode);
          }
        } else if (cat !== "data" && cat !== "constr") {
          c.error("function " + v.name + " is defined by \"reduc\". Such a function should not be used in a query", v.nameNode);
        }
        return { type: r.ret, vars: QueryChecker.varsOf(args), choice: cat === "choice" || args.some(a => a.choice), isVar: false };
      }

      case "tuple": {
        const items = v.args.map(a => this.term(a, st));
        if (items.some(a => QueryChecker.isTime(a.type))) {
          c.error("terms of time type are not authorised as arguments of a tuple.", QueryChecker.ext(t));
        }
        return { type: "bitstring", vars: QueryChecker.varsOf(items), choice: items.some(a => a.choice), isVar: false };
      }

      case "name":
        return this.nameTerm(t, st, false);

      case "let":
        return this.term(t.body, this.addBinding(t, st));

      default:
        c.error("a term is expected here", QueryChecker.ext(t));
        return this.unknown();
    }
  }

  /**
   * Checks "new n[...]" in a goal (PGName).
   *
   * For queries and lemmas, ProVerif does not know the arguments of names yet
   * and checks the bindings after the translation into clauses: they are queued.
   * For "not" and "nounif" (encode) it checks them at once.
   *
   * @param {Object} t The GNew node.
   * @param {Object} st The state.
   * @param {boolean} format True in nounif declarations.
   * @return {Object} The record (a fresh variable of the type of the name).
   */
  nameTerm(t: any, st: any, format: boolean) {
    const info = this.findName(t.name);
    if (info === null) {
      return this.unknown();
    }
    const type = info ? info.sym.type : "?";
    const job = { t, st, format, info, encode: st.encode };
    if (t.bindings && t.bindings.length) {
      if (st.encode) {
        this.checkBindings(job, false);
      } else {
        this.delayed.push(job);
      }
    }
    return { type, vars: new Set(["new" + ++this.fresh]), choice: false, isVar: true };
  }

  /**
   * Checks the bindings of "new n[x = M; !1 = i]" (binding_find,
   * prepare_include_info).
   *
   * @param {Object} job {t, st, format, info, encode}.
   * @param {boolean} late True when it runs after the translation
   *   (check_delayed_names).
   */
  checkBindings(job: any, late: boolean) {
    const c = this.c;
    const { t, st, format, info } = job;
    const n = t.name.name;
    const st2 = { ...st, encode: true };
    const known = info ? this.c.localVars(info.scope) : null;
    const seen = new Set();
    for (const b of t.bindings) {
      const key = b.key.repl !== undefined ? "!" + b.key.repl : b.key.name;
      const keyNode = b.key.repl !== undefined ? { start: b.start, end: b.end } : b.key;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      let expected = null;
      if (info) {
        if (b.key.repl !== undefined) {
          if (!info.inMacro && b.key.repl > info.depth) {
            c.error("variable " + key + " not defined at restriction " + n + ".", t.name, { code: "bound-name-arg" });
            continue;
          }
          expected = "sid";
        } else {
          const sym = known.get(key);
          if (!sym) {
            if (late) {
              c.error("variable " + key + " not defined at restriction " + n, keyNode, { code: "bound-name-arg" });
            } else {
              c.error("variable " + key + " not defined at restriction " + n + ".", t.name, { code: "bound-name-arg" });
            }
            continue;
          }
          expected = sym.type;
        }
      }
      const r = format ? this.format(b.term, st2) : this.term(b.term, st2);
      if (expected && !(this.c.constructor as typeof PvChecker).sameType(r.type, expected)) {
        c.error("this variable is of type " + expected + " but is given a value of type " + r.type, keyNode);
        continue;
      }
      if (key.startsWith("!") && !r.isVar) {
        c.error("session identifiers should be variables", keyNode);
      }
    }
  }

  /**
   * Checks the bindings of names of queries and lemmas, after everything else
   * (check_delayed_names).
   */
  checkDelayedNames() {
    for (const job of this.delayed) {
      this.c.inExpansion = job.t.__expansion || null;
      this.checkBindings(job, true);
    }
    this.c.inExpansion = null;
  }

  /**
   * Binds "let x = M in" or "x <- M;" in a goal (add_binding).
   *
   * @param {Object} t The GLet node.
   * @param {Object} st The state.
   * @return {Object} The new state.
   */
  addBinding(t: any, st: any) {
    const c = this.c;
    const ex = st.env.get(t.name.name);
    if (ex && ex.kind === "var") {
      c.error("variable " + t.name.name + " already defined", t.name);
    }
    const val = this.term(t.value, st);
    if (QueryChecker.isTime(val.type)) {
      c.error("time type not authorised in a variable binding.", t.name);
    }
    const sym = c.newSymbol("var", t.name.name, t.name, { type: val.type, local: true, link: val });
    return { ...st, env: st.env.with(t.name.name, sym) };
  }

  /**
   * Checks a temporal annotation "@ i" (check_time).
   *
   * @param {string} at The identifier, or null.
   * @param {Object} st The state.
   */
  checkTime(at: any, st: any) {
    if (!at) {
      return;
    }
    const c = this.c;
    const before = c.diags.length;
    const r = this.identAny(at.name, at, st);
    if (c.diags.length > before && c.diags[c.diags.length - 1].severity === "error") {
      return;
    }
    if (r.type !== "time" && r.type !== "?") {
      c.error("temporal variables should have type time.", at);
      return;
    }
    if (st.lemma) {
      c.error("Declared axioms and lemmas cannot contain variables of type time.", at);
    }
  }

  /**
   * Gives the time variable of an event or a fact, as encode_queries.ml sees
   * it.
   *
   * @param {Object} at The temporal identifier node, or null.
   * @param {Object} st The state.
   * @return {Object} {node, key} where key identifies the variable, or null
   *   without "@".
   */
  timeVar(at: any, st: any) {
    if (!at) {
      return null;
    }
    const e = st.env.get(at.name);
    return { node: at, key: e && e.kind === "var" ? e.id : "?" + at.name };
  }

  /**
   * Gives the sides of a comparison for the checks on time variables.
   *
   * @param {Array} args The argument nodes.
   * @param {Array} recs Their records.
   * @param {boolean} swap True for <= and <, which ProVerif turns into >= and
   *   > with the sides swapped.
   * @return {Object} [{node, key, time}].
   */
  sides(args: any[], recs: any[], swap: boolean) {
    const out = args.map((n, i) => {
      const r = recs[i];
      const key = r && r.isVar && r.vars.size === 1 ? [...r.vars][0] : null;
      return { node: n, key, time: !!r && r.type === "time" };
    });
    return swap ? out.reverse() : out;
  }

  /**
   * Tells whether a goal uses time variables (exists_at_realquery).
   *
   * @param {Object} r The checked goal {premise, concl}.
   * @return {boolean} True when it does.
   */
  static usesTime(r: any): boolean {
    const atom = f => !!f && (!!f.at || ((f.kind === "eq" || f.kind === "neq" || f.kind === "geq" || f.kind === "gr") && !!f.sides && f.sides[0].time));
    const concl = q => {
      if (!q) {
        return false;
      }
      if (q.kind === "event") {
        return atom(q.ev);
      }
      if (q.kind === "nested") {
        return atom(q.ev) || concl(q.concl);
      }
      if (q.kind === "and" || q.kind === "or") {
        return concl(q.left) || concl(q.right);
      }
      return false;
    };
    return r.premise.some(atom) || concl(r.concl);
  }

  /**
   * Checks the time variables of the correspondence queries, as ProVerif does
   * when it encodes them (encode_temporal_realquery).
   *
   * In E ==> H, two facts of E, or a fact of E and one of H, or two facts of
   * the same disjunct of H, cannot have the same time variable; and a time
   * variable compared in a disjunct must be the one of a fact of the disjunct
   * or of E. ProVerif finds this only when it starts the verification, after
   * everything else.
   *
   * @param {Object} lineIndex The LineIndex of the text, to write locations.
   */
  temporalChecks(lineIndex: any) {
    const c = this.c;
    const where = n => (lineIndex ? lineIndex.extent(n.start, n.end) : "offset " + n.start);
    const line1 = "In a correspondence query E ==> H, a fact/event of E and a different fact/event from H or E cannot be assigned the same time variable.";
    const line2 = "Moreover, when considering H in its disjunctive normal form (i.e. H equivalent to H_1 || ... || H_n), two facts or events of the same disjunct H_i cannot be assigned the same time variable";
    let fresh = 0;
    const withAt = f => ({ f, at: f.at || { node: null, key: "fresh" + ++fresh } });
    const distinct = (l1, l2) => {
      for (const a of l1) {
        for (const b of l2) {
          if (a.at.key !== b.at.key) {
            continue;
          }
          const node = a.at.node || b.at.node;
          const first = a.at.node && b.at.node ? "Time variable also assigned at " + where(b.at.node) + ".\n" : "";
          throw Object.assign(new Error(String(first) + line1 + "\n" + line2), { node: node || a.f.node, pv: true });
        }
      }
    };
    const isTimeConstraint = f => (f.kind === "eq" || f.kind === "neq" || f.kind === "geq" || f.kind === "gr") && f.sides && f.sides[0].time;
    const dnfEvent = (f, next) => {
      if (f.kind === "event" || f.kind === "fact") {
        next([withAt(f)], []);
      } else if (isTimeConstraint(f)) {
        next([], [f]);
      } else {
        next([], []);
      }
    };
    const dnf = (q, next) => {
      switch (q.kind) {
        case "true":
          next([], []);
          break;

        case "false":
          break;

        case "event":
          dnfEvent(q.ev, next);
          break;

        case "nested":
          dnf(q.concl, (e1, t1) => dnfEvent(q.ev, (e2, t2) => {
            distinct(e1, e2);
            next([...e2, ...e1], [...t2, ...t1]);
          }));
          break;

        case "and":
          dnf(q.left, (e1, t1) => dnf(q.right, (e2, t2) => {
            distinct(e1, e2);
            next([...e1, ...e2], [...t1, ...t2]);
          }));
          break;

        case "or":
          dnf(q.left, next);
          dnf(q.right, next);
          break;

        default:
          break;
      }
    };
    for (const Q of this.queryDecls) {
      for (const res of this.translated.get(Q.decl) || []) {
        if (res.kind !== "real" || !res.r || !QueryChecker.usesTime(res.r)) {
          continue;
        }
        try {
          const premises = res.r.premise.filter(f => f.kind === "event" || f.kind === "fact").map(withAt);
          for (let i = premises.length - 2; i >= 0; i--) {
            distinct([premises[i]], premises.slice(i + 1));
          }
          dnf(res.r.concl, (evl, constr) => {
            distinct(premises, evl);
            const assigned = new Set([...premises, ...evl].map(x => x.at.key));
            for (const f of constr) {
              for (const side of f.sides) {
                if (side.key && !assigned.has(side.key)) {
                  throw Object.assign(new Error("Time variable not assigned. In a correspondence query E ==> H, when considering H in its disjunctive normal form (i.e. H equivalent to H_1 || ... || H_n), any time variable occurring in a disjunct should be assigned by a fact in the same disjunct or in E"), { node: side.node, pv: true });
                }
              }
            }
          });
        } catch (e: any) {
          if (!e.pv) {
            throw e;
          }
          c.error(e.message, e.node);
          // ProVerif stops at the first one
          return;
        }
      }
    }
  }

  /**
   * Checks the two sides of an inequality (check_inequality_type).
   *
   * @param {Object} st The state.
   * @param {Object} a The type on the left.
   * @param {Object} b The type on the right.
   * @param {Object} e Where to report.
   */
  inequalityType(st: any, a: any, b: any, e: any) {
    const c = this.c;
    if (!(c.constructor as typeof PvChecker).sameType(a, b)) {
      c.error("the two arguments of an inequality test should have the same type", e);
      return;
    }
    const t = a === "?" ? b : a;
    if (st.lemma && t === "time") {
      c.error("Declared axioms and lemmas cannot contain variables of type time", e);
      return;
    }
    if (t !== "nat" && t !== "time" && t !== "?") {
      c.error("the two arguments of an inequality test should have the type nat or the type time.", e);
    }
  }

  /**
   * Checks the argument of table(...) in a goal (check_table_term).
   *
   * @param {Object} t The argument.
   * @param {Object} st The state.
   * @return {Object} The records of the arguments of the table.
   */
  tableTerm(t: any, st: any) {
    const c = this.c;
    const v = this.view(t);
    if (v.tag === "app" && !v.at) {
      if (QueryChecker.NOT_IN_TABLE_TERMS.has(v.name)) {
        c.error(v.name + " unexpected in query terms", v.nameNode);
        return [];
      }
      const args = v.args.map(a => this.term(a, st));
      c.getTable({ name: v.name, start: v.nameNode.start, end: v.nameNode.end, virtual: v.nameNode.virtual }, args.map(a => a.type), st.env);
      return args;
    }
    if (v.tag === "app" && v.at) {
      c.error("Unexpected temporal identifier " + v.at.name + " in query terms.", v.at);
      return [];
    }
    c.error("Table term expected", QueryChecker.ext(t));
    return [];
  }

  // Facts of goals (check_event)

  /**
   * Checks attacker, mess and table facts (check_attacker, check_mess,
   * check_table).
   *
   * @param {string} name Attacker, mess or table.
   * @param {Array} args The arguments.
   * @param {Object} at The temporal identifier or null.
   * @param {Object} e The extent of the fact.
   * @param {Object} st The state.
   * @return {Object} The fact record.
   */
  builtinFact(name: string, args: any[], at: any, e: any, st: any) {
    const c = this.c;
    const fact = { kind: "fact", pred: name, terms: [], node: e, at: this.timeVar(at, st) };
    if (name === "attacker") {
      if (args.length !== 1) {
        c.error("arity of predicate attacker should be 1", e);
        return fact;
      }
      fact.terms = [this.term(args[0], st)];
      this.checkTime(at, st);
    } else if (name === "mess") {
      if (args.length !== 2) {
        c.error("arity of predicate mess should be 2", e);
        return fact;
      }
      const a = this.term(args[0], st);
      const b = this.term(args[1], st);
      fact.terms = [a, b];
      if (!(c.constructor as typeof PvChecker).sameType(a.type, "channel")) {
        c.error("First argument of mess is of type " + a.type + " and should be of type channel", e);
        return fact;
      }
      this.checkTime(at, st);
    } else {
      if (args.length !== 1) {
        c.error("arity of predicate table should be 1", e);
        return fact;
      }
      fact.terms = this.tableTerm(args[0], st);
      this.checkTime(at, st);
    }
    return fact;
  }

  /**
   * Checks an atom of a goal (check_event).
   *
   * @param {Object} t The atom.
   * @param {Object} st The state.
   * @param {boolean} inPremise True before "==>".
   * @return {Object} The fact record {kind, pred?, inj?, terms, node}.
   */
  event(t: any, st: any, inPremise: boolean) {
    const c = this.c;
    const S = c.constructor as typeof PvChecker;
    const e = QueryChecker.ext(t);
    const v = this.view(t);
    const cmp = (msg, kind?) => {
      const st2 = { ...st, choiceMsg: msg };
      const a = this.term(v.args[0], st2);
      const b = this.term(v.args[1], st2);
      return { a, b, kind };
    };
    if (v.tag === "app" && !v.at) {
      switch (v.name) {
        case "<>":
        case "=": {
          const { a, b } = cmp(v.name === "<>" ? "Disequalities in queries, lemmas, and axioms should not contain choice." : "Equalities in queries, lemmas, and axioms should not contain choice.");
          if (!S.sameType(a.type, b.type)) {
            c.error("the two arguments of " + (v.name === "<>" ? "a disequality" : "an equality") + " test should have the same type", e);
          }
          return { kind: v.name === "<>" ? "neq" : "eq", terms: [a, b], node: e, sides: this.sides(v.args, [a, b], false) };
        }

        case ">=":
        case ">":
        case "<=":
        case "<": {
          const { a, b } = cmp("Inequalities in queries, lemmas, and axioms should not contain choice.");
          this.inequalityType(st, a.type, b.type, e);
          const strict = (v.name === ">" || v.name === "<") && (a.type === "time" || b.type === "time");
          return { kind: strict ? "gr" : "geq", terms: [a, b], node: e, sides: this.sides(v.args, [a, b], v.name === "<=" || v.name === "<") };
        }

        case "is_nat": {
          if (v.args.length !== 1) {
            break;
          }
          const a = this.term(v.args[0], { ...st, choiceMsg: "Predicates is_nat in queries, lemmas, and axioms should not contain choice." });
          if (!S.sameType(a.type, "nat")) {
            c.error("the argument of the predicate is_nat should have the type nat.", e);
          }
          return { kind: "isnat", terms: [a], node: e };
        }

        default:
          break;
      }
    }
    if (v.tag === "app" && (v.name === "event" || v.name === "inj-event")) {
      return this.eventAtom(v, st, e);
    }
    if (v.tag === "app" && !v.at && v.name === "subterm") {
      return this.subterm(v, st, e, inPremise);
    }
    if (v.tag === "app" && ["attacker", "mess", "table"].includes(v.name)) {
      return this.builtinFact(v.name, v.args, v.at, e, st);
    }
    if (v.tag === "app" && !v.at) {
      if (QueryChecker.NOT_IN_EVENTS.has(v.name)) {
        c.error(v.name + " unexpected in events", v.nameNode);
        return { kind: "fact", pred: "user", terms: [], node: e };
      }
      const args = v.args.map(a => this.term(a, st));
      c.getPred(v.name, v.nameNode, args.map(a => a.type), st.env);
      return { kind: "fact", pred: "user", terms: args, node: e };
    }
    if (v.tag === "phase") {
      if (["mess", "attacker", "table"].includes(v.name)) {
        return this.builtinFact(v.name, v.args, v.at, e, st);
      }
      c.error("phases can be used only with attacker, mess, or table", v.nameNode);
      return { kind: "fact", pred: "user", terms: [], node: e };
    }
    if (v.tag === "ident") {
      c.getPred(v.name, v.nameNode, [], st.env);
      return { kind: "fact", pred: "user", terms: [], node: e };
    }
    if (v.tag === "let") {
      return this.event(t.body, this.addBinding(t, st), inPremise);
    }
    if (v.tag === "app" && v.at) {
      c.error("only the predicates event, inj-event, attacker, mess and table can have a temporal identifier.", v.at);
      return { kind: "fact", pred: "user", terms: [], node: e };
    }
    c.error("an event should be a predicate application", e);
    return { kind: "fact", pred: "user", terms: [], node: e };
  }

  /**
   * Checks event(...) and inj-event(...) in a goal.
   *
   * @param {Object} v The view of the atom.
   * @param {Object} st The state.
   * @param {Object} e Its extent.
   * @return {Object} The fact record.
   */
  eventAtom(v: any, st: any, e: any) {
    const c = this.c;
    const inj = v.name === "inj-event";
    const fact: any = { kind: "event", inj, terms: [], node: e, name: null };
    const inner = v.args.length === 1 ? this.view(v.args[0]) : null;
    let f = null;
    let tl = [];
    if (inner && inner.tag === "app" && !inner.at) {
      f = inner;
      tl = inner.args;
    } else if (inner && inner.tag === "ident") {
      f = inner;
      tl = [];
    }
    if (!f) {
      c.error("predicate " + v.name + " should have one argument, which is a function application", v.nameNode);
      return fact;
    }
    this.checkTime(v.at, st);
    fact.at = this.timeVar(v.at, st);
    const args = tl.map(a => this.term(a, st));
    fact.terms = args;
    const ev = c.getEvent({ name: f.name, start: f.nameNode.start, end: f.nameNode.end, virtual: f.nameNode.virtual }, args.map(a => a.type), st.env);
    if (ev) {
      c.useEvent(ev.name, "query");
      fact.name = ev.name;
    }
    return fact;
  }

  /**
   * Checks subterm(M, N) (check_subterm_pred).
   *
   * @param {Object} v The view of the atom.
   * @param {Object} st The state.
   * @param {Object} e Its extent.
   * @param {boolean} inPremise True before "==>".
   * @return {Object} The fact record.
   */
  subterm(v: any, st: any, e: any, inPremise: boolean) {
    const c = this.c;
    const fact = { kind: "fact", pred: "subterm", terms: [], node: e };
    if (!inPremise) {
      c.error("subterm predicate should only occur in the premise of an axiom or a restriction", e);
      return fact;
    }
    if (v.args.length !== 2) {
      c.error("arity of predicate subterm should be 2", e);
      return fact;
    }
    const a = this.term(v.args[0], st);
    const b = this.term(v.args[1], st);
    if (a.choice || b.choice) {
      c.error("subterm predicate should not contain choice", e);
    }
    fact.terms = [a, b];
    return fact;
  }

  /**
   * Checks the premise of a goal (check_ev_list).
   *
   * @param {Object} t The premise.
   * @param {Object} st The state.
   * @return {Array} The list of fact records.
   */
  premise(t: any, st: any) {
    const c = this.c;
    if (t.kind === "BinOp" && t.op === "&&") {
      const b = this.premise(t.right, st);
      const a = this.premise(t.left, st);
      return [...a, ...b];
    }
    const ev = this.event(t, st, true);
    const e = QueryChecker.ext(t);
    if (ev.kind === "eq") {
      c.error("Equality test should not occur in premise of queries.", e);
    } else if ((ev.kind === "neq" || ev.kind === "geq" || ev.kind === "gr") && ev.terms.some(x => x.type === "time")) {
      c.error("Disequalities and inequalities on time variables should not occur before the premise.", e);
    } else if (ev.kind === "fact") {
      if (st.lemma === "lemma" && ev.pred === "subterm") {
        c.error("Declared lemmas should only contain attacker predicates, message predicates, table predicates, events or user defined predicates in their premises.", e);
      } else if (!st.lemma && ev.pred === "subterm") {
        c.error("Subterm predicates can only be used in the premise of an axiom or a restriction.", e);
      }
    } else if (ev.kind === "event" && ev.inj && st.lemma) {
      c.error("Declared lemmas, axioms, and restrictions should not contain injective events in their premise.", e); // or cannot?
    }
    return [ev];
  }

  /**
   * Checks the conclusion of a goal (check_hyp).
   *
   * @param {Object} t The conclusion.
   * @param {Object} st The state.
   * @return {Object} The conclusion tree.
   */
  conclusion(t: any, st: any) {
    const c = this.c;
    if (t.kind === "BinOp" && t.op === "==>") {
      if (st.lemma) {
        c.error("Declared lemmas, axioms, and restrictions should not contain nested queries.", QueryChecker.ext(t));
      }
      const ev = this.event(t.left, st, false);
      if (ev.kind !== "event") {
        c.error("Inequalities, disequalities, equalities, is_nat, and facts cannot occur before ==> in nested queries", QueryChecker.ext(t.left));
      }
      const concl = this.conclusion(t.right, st);
      return { kind: "nested", ev, concl };
    }
    if (t.kind === "BinOp" && (t.op === "||" || t.op === "&&")) {
      const right = this.conclusion(t.right, st);
      const left = this.conclusion(t.left, st);
      return { kind: t.op === "||" ? "or" : "and", left, right };
    }
    if (t.kind === "Ident" && t.name === "false") {
      return { kind: "false" };
    }
    if (t.kind === "Ident" && t.name === "true") {
      return { kind: "true" };
    }
    if (t.kind === "GLet") {
      return this.conclusion(t.body, this.addBinding(t, st));
    }
    const ev = this.event(t, st, false);
    if (st.lemma && ev.kind === "event" && ev.inj) {
      c.error("Declared lemmas, axioms, and restrictions should not contain injective events.", QueryChecker.ext(t));
    }
    return { kind: "event", ev };
  }

  /**
   * Checks that the variables of subterm, inequality and disequality facts of
   * a premise are bound elsewhere (check_variables_in_premise).
   *
   * @param {Object} e The extent of the goal.
   * @param {Object} evl The facts of the premise.
   */
  premiseVariables(e: any, evl: any) {
    const c = this.c;
    const bound = f => (f.kind === "fact" && f.pred === "subterm") || f.kind === "neq" || f.kind === "geq" || f.kind === "isnat";
    const must = evl.filter(bound);
    const others = evl.filter(f => !bound(f));
    if (!others.length) {
      c.error("The premise of an axiom or restriction cannot contain only subterm, disequality, or inequality facts.", e);
      return;
    }
    const vars = QueryChecker.varsOf(others.flatMap(f => f.terms));
    const covered = r => [...r.vars].every(x => vars.has(x));
    for (const f of must) {
      if (f.kind === "fact") {
        if (f.terms.length === 2 && !covered(f.terms[1])) {
          c.error("If a fact subterm(t,t') occurs in the premise of an axiom or a restriction then all variables in t' should also occur in another fact (different from a subterm, inequality, disequality fact) in the premise.", e);
          return;
        }
      } else if (f.kind === "isnat") {
        if (!f.terms.every(covered)) {
          c.error("If a predicate is_nat(t) occurs in the premise of an axiom, a restriction, a lemma, or a query then all variables in t should also occur in another fact (different from a subterm, inequality, disequality fact) in the premise.", e);
          return;
        }
      } else if (!f.terms.every(covered)) {
        c.error("If an inequality or disequality occurs in the premise of an axiom, a restriction, a lemma, or a query then all variables in it should also occur in another fact (different from a subterm, inequality, disequality fact) in the premise.", e);
        return;
      }
    }
  }

  /**
   * Checks a correspondence goal (check_real_query_top).
   *
   * @param {Object} t The goal term.
   * @param {Object} st The state.
   * @return {Object} {premise, concl}.
   */
  realQuery(t: any, st: any) {
    if (t.kind === "BinOp" && t.op === "==>") {
      const premise = this.premise(t.left, st);
      this.premiseVariables(QueryChecker.ext(t), premise);
      const concl = this.conclusion(t.right, st);
      return { premise, concl };
    }
    if (t.kind === "GLet") {
      return this.realQuery(t.body, this.addBinding(t, st));
    }
    const premise = this.premise(t, st);
    this.premiseVariables(QueryChecker.ext(t), premise);
    return { premise, concl: { kind: "false" } };
  }

  // Queries (transl_query)

  /**
   * Checks the options of a goal declaration (transl_option_lemma_query).
   *
   * @param {string} kind 'query', 'lemma', 'axiom' or 'restriction'.
   * @param {Object} options The options.
   */
  goalOptions(kind: string, options: any) {
    const c = this.c;
    const isQuery = kind === "query";
    let remove = null;
    let maxSubset = false;
    let sat = false;
    let verif = false;
    let induction = false;
    let keep = false;
    const satMsg = "An option for the application of this lemma during the saturation procedure as already been declared.";
    const verifMsg = "An option for the application of this lemma during the verification procedure as already been declared.";
    for (const o of options) {
      const s = o.name.name;
      const at = o.name;
      switch (s) {
        case "removeEvents":
        case "keepEvents": {
          const other = s === "removeEvents" ? "keepEvents" : "removeEvents";
          if (isQuery) {
            c.error("A query cannot have the option " + s + ". Only lemmas, axioms, and restrictions can.", at);
            return;
          }
          if (remove === other) {
            c.error("The option " + s + " cannot be declared at the same time as " + other + ".", at);
            return;
          }
          if (remove === s) {
            c.error("The option " + s + " has already been declared.", at);
            return;
          }
          remove = s;
          break;
        }

        case "maxSubset":
          if (kind !== "lemma") {
            c.error(QueryChecker.KIND_NAME[kind] + " cannot have the option maxSubset. Only lemmas can.", at);
            return;
          }
          if (maxSubset) {
            c.error("The option maxSubset was already declared.", at);
            return;
          }
          maxSubset = true;
          break;

        case "proveAll":
          if (!isQuery) {
            c.error(QueryChecker.KIND_NAME[kind] + " cannot have the option proveAll. Only queries can.", at);
            return;
          }
          if (maxSubset) {
            c.error("The option proveAll was already declared.", at);
            return;
          }
          maxSubset = true;
          break;

        case "noneSat":
        case "discardSat":
        case "fullSat":
        case "instantiateSat":
          if (sat) {
            c.error(satMsg, at);
            return;
          }
          sat = true;
          break;

        case "noneVerif":
        case "discardVerif":
        case "fullVerif":
        case "instantiateVerif":
          if (verif) {
            c.error(verifMsg, at);
            return;
          }
          verif = true;
          break;

        case "induction":
        case "noInduction":
          if (induction) {
            c.error("The option induction or noInduction has already been declared.", at);
            return;
          }
          induction = true;
          break;

        case "keep":
          if (isQuery || kind === "lemma") {
            c.error("Only axioms and restrictions can have the option 'keep'.", at);
            return;
          }
          if (keep) {
            c.error("The option keep has already been declared.", at);
            return;
          }
          keep = true;
          break;

        default:
          c.error("Unknown option", at);
          return;
      }
    }
  }

  /**
   * Tells whether a conclusion contains an injective event
   * (has_inj_conclusion_query).
   *
   * @param {Object} concl The conclusion tree.
   * @return {boolean} True when it does.
   */
  static injConclusion(concl: any): boolean {
    switch (concl.kind) {
      case "event":
        return concl.ev.kind === "event" && concl.ev.inj;

      case "nested":
        return (concl.ev.kind === "event" && concl.ev.inj) || QueryChecker.injConclusion(concl.concl);

      case "and":
      case "or":
        return QueryChecker.injConclusion(concl.left) || QueryChecker.injConclusion(concl.right);

      default:
        return false;
    }
  }

  /**
   * Checks that injective events are used coherently
   * (Reduction_helper.check_inj_coherent).
   *
   * @param {Object} q The checked query {premise, concl}.
   * @param {Object} node Where to anchor the message (ProVerif gives no
   *   location).
   */
  injCoherent(q: any, node: any) {
    if (!QueryChecker.injConclusion(q.concl)) {
      return;
    }
    const inj = q.premise.filter(f => f.kind === "event" && f.inj).length;
    const plain = q.premise.filter(f => f.kind === "event" && !f.inj).length;
    if (inj > 0 || plain === 1) {
      return;
    }
    if (plain === 0) {
      this.c.error("In a query e ==> h, if h contains an injective event, then e must be an event (or better an injective event) or a conjunction of facts containing at least one injective event.", node, { global: true });
    } else {
      this.c.error("If a query contains several facts before ==> and has injective events, then it must have at least one injective event before ==>", node, { global: true });
    }
  }

  /**
   * Translates the queries, in declaration order (transl_query for each
   * declaration).
   */
  translateQueries() {
    const c = this.c;
    for (const Q of this.queryDecls) {
      const d = Q.decl;
      c.inExpansion = d.__expansion || null;
      const before = c.diags.filter(x => x.severity === "error").length;
      const env = c.addEnv(d.vars || [], c.global, { sid: true, time: true });
      const st = { env, lemma: null, equivalence: false, choiceMsg: "choice cannot be used in queries", encode: false };
      const results = [];
      for (const q of d.queries) {
        if (q.kind === "RealQuery") {
          const r = this.realQuery(q.term, st);
          const pub = q.publicVars.flatMap(id => this.findAllVarName(id));
          results.push({ q, kind: "real", r, pub });
        } else if (q.kind === "SecretQuery") {
          const secret = this.findAllVarName(q.name);
          const pub = q.publicVars.flatMap(id => this.findAllVarName(id));
          const opts = q === Q.movedFrom ? [] : q.options;
          let ror = false;
          if (c.noParamOptions(opts)) {
            for (const o of opts) {
              const s = o.name.name;
              if (s === "reachability" || s === "pv_reachability") {
                ror = false;
              } else if (s === "real_or_random" || s === "pv_real_or_random") {
                ror = true;
              } else if (!s.startsWith("cv_")) {
                c.error("The allowed options for query secret are reachability, pv_reachability, real_or_random, pv_real_or_random, and for compatibility with CryptoVerif, all options starting with cv_", o.name);
                break;
              }
            }
          }
          results.push({ q, kind: "secret", secret, pub, ror });
        } else if (q.kind === "PutBegin") {
          for (const id of q.names) {
            const e = st.env.get(id.name);
            if (!e) {
              c.error("unknown event " + id.name, id);
            } else {
              c.ref(e, id);

              if (e.kind !== "event") {
                c.error(id.name + " should be an event", id);
              }
            }
          }
          results.push({ q, kind: "putbegin" });
        }
      }
      this.goalOptions("query", Q.options);
      const clean = c.diags.filter(x => x.severity === "error").length === before;
      if (clean) {
        for (const res of results) {
          if (res.kind === "real") {
            this.injCoherent(res.r, res.q);
          }
        }
      }
      this.translated.set(d, results);
    }
    c.inExpansion = null;
  }

  // Lemmas, axioms and restrictions (transl_lemma)

  /**
   * Tells whether the model proves an equivalence (Equivalence or a
   * biprocess).
   *
   * @return {boolean} True for equivalence and for models with choice.
   */
  isEquivalence(): boolean {
    return !!this.c.program.equivalence || this.c.hasChoice;
  }

  /**
   * Compares two expanded lists of names (Terms.same_term_lists).
   *
   * @param {Object} a A list.
   * @param {Object} b A list.
   * @return {boolean} True when equal.
   */
  static sameList(a: any, b: any): boolean {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }

  /**
   * Tells whether a lemma matches one of the queries of the model.
   *
   * @param {Object} pub The expanded public variables of the lemma.
   * @param {Object} ror The expanded secret of its real-or-random
   *   specification, or null.
   * @return {boolean} True when it matches.
   */
  lemmaMatches(pub: any, ror: any): boolean {
    for (const g of this.c.goalDecls) {
      if (g.kind === "noninterf" || g.kind === "weaksecret") {
        if (!pub.length && !ror) {
          return true;
        }
        continue;
      }
      if (g.kind !== "query") {
        continue;
      }
      for (const res of this.translated.get(g.decl) || []) {
        if (res.kind === "real") {
          if (QueryChecker.sameList(pub, res.pub) && !ror) {
            return true;
          }
        } else if (res.kind === "secret") {
          if (!res.ror) {
            if (QueryChecker.sameList(pub, res.pub) && !ror) {
              return true;
            }
          } else if (QueryChecker.sameList(pub, res.pub) && ror && QueryChecker.sameList(ror, res.secret)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Translates the lemmas, axioms and restrictions in declaration order
   * (transl_lemma).
   */
  translateLemmas() {
    const c = this.c;
    const equivalence = this.isEquivalence();
    for (const L of this.lemmaDecls) {
      const d = L.decl;
      c.inExpansion = d.__expansion || null;
      const before = c.diags.filter(x => x.severity === "error").length;
      const env = c.addEnv(d.vars || [], c.global, { sid: true, time: true });
      const st = { env, lemma: d.keyword, equivalence, choiceMsg: null, encode: false };
      const checked = d.lemmas.map(l => {
        const st2 = !equivalence && !l.ror ? { ...st, choiceMsg: QueryChecker.LEMMA_CHOICE } : st;
        const r = this.realQuery(l.term, st2);
        const pub = l.publicVars.flatMap(id => this.findAllVarName(id));
        let ror = null;
        if (l.ror) {
          const opt = l.ror.option.name;
          if (opt !== "real_or_random" && opt !== "pv_real_or_random") {
            c.error("A lemma can only be specified to a query secret with the option real_or_random or pv_real_or_random.", l.ror.option);
          }
          ror = this.findAllVarName(l.ror.secret);
        }
        return { l, r, pub, ror };
      });
      const clean = c.diags.filter(x => x.severity === "error").length === before;
      if (clean && this.processKnown()) {
        for (const { l, pub, ror } of checked) {
          const bad = equivalence ? (pub.length > 0 || ror !== null) : !this.lemmaMatches(pub, ror);
          if (bad) {
            c.error("Lemma not used because there is no matching query", QueryChecker.ext(l.term), { code: "lemma-unmatched" });
          }
        }
      }
      this.goalOptions(d.keyword, L.options);
    }
    c.inExpansion = null;
  }

  // Not declarations (get_not)

  /**
   * Checks the "not" declarations, last declared first (get_not, then
   * pitransl's get_not).
   */
  translateNots() {
    const c = this.c;
    for (const d of [...c.nots].reverse()) {
      c.inExpansion = d.__expansion || null;
      const before = c.diags.filter(x => x.severity === "error").length;
      const env = c.addEnv(d.vars || [], c.global, { sid: true });
      const st = { env, lemma: null, equivalence: false, choiceMsg: null, encode: true };
      const ev = this.event(d.term, st, false);
      const clean = c.diags.filter(x => x.severity === "error").length === before;
      if (clean && ev.kind !== "fact") {
        c.error("The only allowed facts in \"not\" declarations are attacker, mess, table, and user-defined predicates.", d, { global: true });
      }
    }
    c.inExpansion = null;
  }

  // Nounif declarations (get_nounif)

  /**
   * Gives the weight of a nounif or select declaration as ProVerif stores it.
   *
   * @param {Object} d The NoUnifDecl.
   * @return {Object} 'pos' (NoUnifPosDefault), 'neg' (NoUnifNegDefault) or
   *   the number of NoUnifValue.
   */
  static nounifValue(d: any) {
    const select = d.keyword === "select";
    if (!d.weight) {
      return select ? "pos" : "neg";
    }
    const n = d.weight.neg ? -d.weight.n : d.weight.n;
    return select ? n : -n;
  }

  /**
   * Checks the options of a nounif declaration (check_nounif_options).
   *
   * @param {Object} d The NoUnifDecl.
   * @param {string} value Its weight, see nounifValue.
   * @param {Object} st The state.
   * @return {Object} {ops, induction} or null after an error.
   */
  nounifOptions(d: any, value: string, st: any) {
    const c = this.c;
    if (!d.options.length) {
      return { ops: ["hypothesis"], induction: null };
    }
    const positive = value === "pos" || (typeof value === "number" && value > 0);
    let hyp = false;
    let hypDecl = false;
    let concl = false;
    let ignore = false;
    let induction = null;
    const noParam = o => {
      if (o.value) {
        c.error("The option " + o.name.name + " should not have any parameter.", o.name);
        return false;
      }
      return true;
    };
    for (const o of d.options) {
      const s = o.name.name;
      switch (s) {
        case "hypothesis":
          if (hypDecl) {
            c.warn("The option hypothesis has already been declared", o.name);
          }
          if (!noParam(o)) {
            return null;
          }
          hypDecl = true;
          hyp = true;
          break;

        case "conclusion":
          if (concl) {
            c.warn("The option conclusion has already been declared", o.name);
          }
          if (!noParam(o)) {
            return null;
          }
          concl = true;
          break;

        case "ignoreAFewTimes":
          if (ignore) {
            c.warn("The option ignoreAFewTimes has already been declared", o.name);
          }
          if (positive) {
            c.error("The option ignoreAFewTimes cannot be used with a positive select (or a negative nounif).", o.name);
            return null;
          }
          if (!noParam(o)) {
            return null;
          }
          ignore = true;
          hyp = true;
          break;

        case "inductionOn":
          if (induction) {
            c.warn("The option inductionOn has already been declared", o.name);
          }
          if (positive) {
            c.error("The option inductionOn cannot be used with a positive select (or a negative nounif).", o.name);
            return null;
          }
          if (!o.value) {
            c.error("The option inductionOn expects a parameter.", o.name);
            return null;
          }
          induction = o.value;
          hyp = true;
          break;

        default:
          c.error("The only options available for nounif declaration are: hypothesis, conclusion, ignoreAFewTimes and inductionOn. The option inductionOn takes a variable as parameter.", o.name);
          return null;
      }
    }
    const ops = [];
    if (induction) {
      ops.push("inductionSat");
    }
    if (ignore) {
      ops.push("inductionVerif");
    }
    if (concl) {
      ops.push("conclusion");
    }
    if (hyp) {
      ops.push("hypothesis");
    }
    let vars = null;
    if (induction) {
      vars = [];
      for (const id of induction) {
        const e = st.env.get(id.name);
        if (!e) {
          c.error("identifier " + id.name + " not defined", id);
          return null;
        }
        c.ref(e, id);
        if (e.kind !== "var") {
          c.error(id.name + " should be a variable", id);
          return null;
        }
        if (e.type !== "nat" && e.type !== "?") {
          c.error("variable " + id.name + " used for inductions should be of type nat but is here of type " + e.type, id);
          return null;
        }
        vars.push({ sym: e, id });
      }
    }
    return { ops, induction: vars };
  }

  /**
   * Checks an identifier of a nounif fact (fget_ident_any).
   *
   * @param {string} name The identifier.
   * @param {Object} node Where to report.
   * @param {Object} st The state.
   * @return {Object} The format record {type, vars, anys, choice, isVar}.
   */
  formatIdent(name: string, node: any, st: any) {
    const c = this.c;
    const none = () => ({ type: "?", vars: new Set(), anys: new Set(), choice: false, isVar: false });
    const e = st.env.get(name);
    if (!e) {
      c.error("identifier " + name + " not defined", node);
      return none();
    }
    c.ref(e, node);
    switch (e.kind) {
      case "var":
        if (e.link) {
          return { ...e.link, vars: new Set(e.link.vars), anys: new Set(e.link.anys || []) };
        }
        return { type: e.type, vars: new Set([e.id]), anys: new Set(), choice: false, isVar: true };

      case "name":
        return { type: e.type, vars: new Set(), anys: new Set(), choice: false, isVar: false };

      case "fun":
        if (e.cat !== "data" && e.cat !== "constr") {
          c.error("function " + name + " is defined by \"reduc\". Such a function should not be used in a \"nounif\" declaration", node);
          return none();
        }
        if (e.args.length) {
          c.error("function " + name + " expects " + e.args.length + " arguments but is used without arguments", node);
          return none();
        }
        return { type: e.ret, vars: new Set(), anys: new Set(), choice: false, isVar: false };

      default:
        c.error("identifier " + name + " should be a variable, a function, or a name", node);
        return none();
    }
  }

  /**
   * Checks a term of a nounif declaration (check_gformat).
   *
   * @param {Object} t The term.
   * @param {Object} st The state.
   * @return {Object} The format record {type, vars, anys, choice, isVar}.
   */
  format(t: any, st: any) {
    const c = this.c;
    const merge = (parts, type, choice) => ({
        type
      , vars: QueryChecker.varsOf(parts)
      , anys: new Set(parts.flatMap(p => [...(p.anys || [])]))
      , choice: choice || parts.some(p => p.choice)
      , isVar: false
    });
    const v = this.view(t);
    switch (v.tag) {
      case "ident":
        return this.formatIdent(v.name, v.nameNode, st);

      case "app": {
        const args = v.args.map(a => this.format(a, st));
        const r = c.getFun(v.name, v.nameNode, args.map(a => a.type), st.env);
        if (!r) {
          return merge(args, "?", false);
        }
        const cat = c.categoryOf(r);
        if (cat !== "data" && cat !== "constr" && cat !== "choice") {
          c.error("function " + v.name + " is defined by \"reduc\". Such a function should not be used in a \"nounif\" declaration", v.nameNode);
        }
        return merge(args, r.ret, cat === "choice");
      }

      case "tuple":
        return merge(v.args.map(a => this.format(a, st)), "bitstring", false);

      case "any": {
        const e = st.env.get(v.name);
        if (!e) {
          c.error("variable " + v.name + " is not defined", v.nameNode);
          return merge([], "?", false);
        }
        c.ref(e, v.nameNode);
        if (e.kind !== "var") {
          c.error(v.name + " should be a variable", v.nameNode);
          return merge([], "?", false);
        }
        if (e.link) {
          c.error("variables preceded by * must not be defined by a binding", v.nameNode);
          return merge([], e.type, false);
        }
        return { type: e.type, vars: new Set(), anys: new Set([e.id]), choice: false, isVar: true };
      }

      case "name": {
        const r = this.nameTerm(t, st, true);
        return { ...r, anys: new Set() };
      }

      case "let":
        return this.format(t.body, this.addFBinding(t, st));

      default:
        c.error("a term is expected here", QueryChecker.ext(t));
        return merge([], "?", false);
    }
  }

  /**
   * Binds "let x = M in" in a nounif declaration (add_fbinding).
   *
   * @param {Object} t The GLet or NULet node.
   * @param {Object} st The state.
   * @return {Object} The new state.
   */
  addFBinding(t: any, st: any) {
    const c = this.c;
    const ex = st.env.get(t.name.name);
    if (ex && ex.kind === "var") {
      c.error("variable " + t.name.name + " already defined", t.name);
    }
    const val = this.format(t.value, st);
    const sym = c.newSymbol("var", t.name.name, t.name, { type: val.type, local: true, link: val });
    return { ...st, env: st.env.with(t.name.name, sym) };
  }

  /**
   * Checks the fact of a nounif declaration (check_gfact_format).
   *
   * @param {Function} f The NUFact.
   * @param {Object} st The state.
   * @param {Array} ops The options from nounifOptions.
   * @return {Object} The format records of its arguments.
   */
  formatFact(f: any, st: any, ops: any[]) {
    const c = this.c;
    const s = f.pred.name;
    const where = this.nounifPredExt(f);
    const args = f.args || [];
    switch (s) {
      case "attacker":
        if (args.length !== 1) {
          c.error("arity of predicate attacker should be 1", where);
          return [];
        }
        return [this.format(args[0], st)];

      case "mess": {
        if (args.length !== 2) {
          c.error("arity of predicate mess should be 2", where);
          return [];
        }
        const a = this.format(args[0], st);
        const b = this.format(args[1], st);
        if (!(c.constructor as typeof PvChecker).sameType(a.type, "channel")) {
          c.error("First argument of mess is of type " + a.type + " and should be of type channel", where);
        }
        return [a, b];
      }

      case "table": {
        if (args.length !== 1) {
          c.error("arity of predicate table should be 1", where);
          return [];
        }
        return [this.formatTableOrEvent(args[0], st, false)];
      }

      case "event": {
        const concl = ops.includes("conclusion");
        const ind = ops.includes("inductionSat");
        if (!concl && !ind) {
          c.error("Nounif declaration on an event must have the option 'conclusion' or 'inductionOn'", where);
          return [];
        }
        if (concl && ind) {
          c.error("Nounif declaration on an event cannot have both the options 'conclusion' and 'inductionOn'. Make two separate declarations.", where);
          return [];
        }
        if (args.length !== 1) {
          c.error("arity of predicate event should be 1", where);
          return [];
        }
        return [this.formatTableOrEvent(args[0], st, true)];
      }

      default: {
        const fs = args.map(a => this.format(a, st));
        c.getPred(s, f.pred, fs.map(a => a.type), st.env);
        return fs;
      }
    }
  }

  /**
   * Checks the argument of table(...) or event(...) in a nounif declaration.
   *
   * @param {Object} t The argument.
   * @param {Object} st The state.
   * @param {boolean} isEvent True for event, false for table.
   * @return {Object} The format record of the whole argument.
   */
  formatTableOrEvent(t: any, st: any, isEvent: boolean) {
    const c = this.c;
    if (t.kind !== "App") {
      c.error(isEvent ? "Event term expected" : "Table term expected", QueryChecker.ext(t));
      return { type: "?", vars: new Set(), anys: new Set(), choice: false, isVar: false };
    }
    const args = t.args.map(a => this.format(a, st));
    const tys = args.map(a => a.type);
    if (isEvent) {
      const e = st.env.get(t.fn.name);
      if (!e) {
        c.error("event " + t.fn.name + " not defined", t.fn);
      } else {
        c.ref(e, t.fn);
        if (e.kind !== "event") {
          c.error(t.fn.name + " should be an event", t.fn);
        } else if (!(c.constructor as typeof PvChecker).sameTypes(e.args, tys)) {
          c.error("function " + t.fn.name + " expects " + (c.constructor as typeof PvChecker).argsToString(e.args) + " but is here given " + (c.constructor as typeof PvChecker).argsToString(tys), t.fn);
        }
      }
    } else {
      c.getTable(t.fn, tys, st.env);
    }
    return {
        type: "?"
      , vars: QueryChecker.varsOf(args)
      , anys: new Set(args.flatMap(a => [...a.anys]))
      , choice: args.some(a => a.choice)
      , isVar: false
    };
  }

  /**
   * Checks the nounif declarations, last declared first (get_nounif).
   */
  translateNounifs() {
    const c = this.c;
    for (const d of [...c.nounifs].reverse()) {
      c.inExpansion = d.__expansion || null;
      const env = c.addEnv(d.vars || [], c.global, { sid: true });
      const st = { env, lemma: null, equivalence: false, choiceMsg: null, encode: true };
      const value = QueryChecker.nounifValue(d);
      const opts = this.nounifOptions(d, value, st);
      
      if (!opts) {
        continue;
      }
      
      let f = d.fact;
      let st2 = st;
      while (f.kind === "NULet") {
        st2 = this.addFBinding(f, st2);
        f = f.body;
      }
      const args = this.formatFact(f, st2, opts.ops);
      
      if (!opts.induction) {
        continue;
      }
      const anys = new Set(args.flatMap(a => [...(a.anys || [])]));
      const vars = new Set(args.flatMap(a => [...a.vars]));
      let ok = true;
      
      for (const { sym, id } of opts.induction) {
        if (anys.has(sym.id)) {
          c.error("The variable " + id.name + " declared for induction should not be used with * in the fact.", id); // other clues?
          ok = false;
          break;
        }
      }
      
      if (!ok) {
        continue;
      }
      
      for (const { sym, id } of opts.induction) {
        if (!vars.has(sym.id)) {
          c.error("The variable " + id.name + " declared for induction should occur in the fact.", id);
          break;
        }
      }
    }
    c.inExpansion = null;
  }
}
// ----------------------------------------------------------------
