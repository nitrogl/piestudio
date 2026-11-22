/**
 * Semantic checker of ProVerif typed models, following pitsyntax.ml of
 * ProVerif 2.05.
 *
 * Checks scopes, types, arities, declaration options, macros, processes and
 * goals, with ProVerif's own messages and in ProVerif's own order, so that
 * the first error reported is the one ProVerif reports. Unlike ProVerif it does
 * not stop: after an error the faulty type becomes '?', which matches
 * anything, and it goes on, so that the editor can show every problem at once.
 *
 * Besides diagnostics it builds what the studio needs: a symbol table with the
 * definition and the references of every identifier (highlighting, rename,
 * navigation), the type of every term, and facts about the processes.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvChecker {
  /**
   * The type given to ill-typed terms; it matches every type.
   *
   * @type {string}
   */
  static UNKNOWN = "?";

  /**
   * Functions that cannot be defined by reduc.
   *
   * @type {Set<string>}
   */
  static SPECIAL_FUNCTIONS: Set<string> = new Set(["choice", "||", "&&", "=", "<>", "<", ">", "<=", ">="]);

  /**
   * Identifiers of the initial environment that are not usable symbols
   * (2.05).
   *
   * @type {Array}
   */
  static RESERVED = ["mess", "table", "attacker", "subterm", "any_type", "time", "sid"];

  /**
   * Types of the initial environment.
   *
   * @type {Array}
   */
  static INITIAL_TYPES = ["channel", "bitstring", "bool", "nat"];

  /**
   * The message of check_no_def and record_id.
   */
  static alreadyDefined(s) {
    return "identifier " + s + " already defined (as a free name, a function, a predicate, a type, an event, a table, or a process)";
  }

  /**
   * Spells a list of argument types as ProVerif does.
   *
   * @param {Object} tl The types.
   * @return {Object} "0 argument", "1 argument of type t" or "n arguments of
   *   types t1, ..., tn".
   */
  static argsToString(tl: any) {
    if (tl.length === 0) {
      return "0 argument";
    }
    if (tl.length === 1) {
      return "1 argument of type " + tl[0];
    }
    return tl.length + " arguments of types " + tl.join(", ");
  }

  /**
   * Compares two types, '?' matching everything.
   *
   * @param {Object} a A type.
   * @param {Object} b A type.
   * @return {boolean} True when compatible.
   */
  static sameType(a: any, b: any): boolean {
    return a === b || a === PvChecker.UNKNOWN || b === PvChecker.UNKNOWN;
  }

  /**
   * Compares two lists of types.
   *
   * @param {Object} as Types.
   * @param {Object} bs Types.
   * @return {boolean} True when they have the same length and compatible
   *   types.
   */
  static sameTypes(as: any, bs: any): boolean {
    return as.length === bs.length && as.every((a, i) => PvChecker.sameType(a, bs[i]));
  }

  /**
   * Checks a program in one call.
   *
   * @param {Object} program The Program node from PvParser.
   * @param {Object} options {} (reserved).
   * @return {Object} The check result, see run().
   */
  static check(program: any, options: any = {}) {
    return new PvChecker(program, options).run();
  }

  program: any;
  options: any;
  diags: any[];
  symbols: Map<any, any>;
  occurrences: any[];
  types: WeakMap<WeakKey, any>;
  global: Scope;
  symCounter: number;
  hasChoice: any;
  hasBarrier: any;
  maxPhase: number;
  mainMaxPhase: number;
  replDepth: number;
  restrictions: Map<any, any>;
  boundNameNodes: Map<any, any>;
  boundNameCount: Map<any, any>;
  boundVarCount: Map<any, any>;
  keyCompromise: number;
  allowDiffPatterns: boolean;
  queries: any[];
  lemmas: any[];
  nots: any[];
  nounifs: any[];
  goalDecls: any[];
  eventUses: Map<any, any>;
  processInfo: Map<any, any>;
  boundNames: Map<any, any>;
  reported: Set<any>;
  globalRefIds: Set<any>;
  predUses: any[];
  inExpansion: any;
  currentProc: any;
  queryChecker: QueryChecker;
  expanded: any;
  lateStage: boolean;
  settingValues: Map<any, any>;
  pendingRef: any;

  /**
   * Prepares the check of a program.
   *
   * @param {Object} program The Program node.
   * @param {Object} options Checking options.
   */
  constructor(program: any, options: any = {}) {
    this.program = program;
    this.options = options;
    this.diags = [];
    this.symbols = new Map();
    this.occurrences = [];
    this.types = new WeakMap();
    this.global = new Scope();
    this.symCounter = 0;
    // ProVerif sets has_choice and has_barrier while parsing, wherever choice or sync occur
    const features = program.features || new Set();
    this.hasChoice = features.has("choice");
    this.hasBarrier = features.has("sync");
    this.maxPhase = 0;
    this.mainMaxPhase = 0;
    this.replDepth = 0;
    this.restrictions = new Map();
    this.boundNameNodes = new Map();
    this.boundNameCount = new Map();
    this.boundVarCount = new Map();
    this.keyCompromise = 0;
    this.allowDiffPatterns = false;
    this.queries = [];
    this.lemmas = [];
    this.nots = [];
    this.nounifs = [];
    this.goalDecls = [];
    this.eventUses = new Map();
    this.processInfo = new Map();
    this.boundNames = new Map();
    this.reported = new Set();
    this.globalRefIds = new Set();
    this.predUses = [];
    this.inExpansion = null;
    this.currentProc = null;
    this.queryChecker = new QueryChecker(this);
  }

  // Diagnostics and symbols

  /**
   * Records a diagnostic.
   *
   * @param {Object} severity 'error', 'warning' or 'info'.
   * @param {string} message The ProVerif message.
   * @param {Object} node Anything with start/end.
   * @param {Object} extra More fields (code, global, detail).
   */
  diag(severity: any, message: string, node: any, extra: any = {}) {
    const start = node && node.start !== undefined && node.start >= 0 ? node.start : 0;
    const end = node && node.end !== undefined && node.end >= 0 ? node.end : start;
    const d = { severity, message, start, end, seq: this.diags.length, ...extra };
    if (this.lateStage) {
      d.late = true;
    }
    if (this.inExpansion) {
      const ex = this.inExpansion;
      d.expansion = { name: ex.name.name, start: ex.start, end: ex.end };
      d.detail = (d.detail ? d.detail + " " : "") + "(in the expansion of macro " + ex.name.name + ")";
    }
    this.diags.push(d);
  }

  /**
   * Records an error. @param msg the message @param node the location @param
   * extra more fields.
   */
  error(msg, node, extra?) {
    this.diag("error", msg, node, extra);
  }

  /**
   * Records a warning. @param msg the message @param node the location @param
   * extra more fields.
   */
  warn(msg, node, extra?) {
    this.diag("warning", msg, node, extra);
  }

  /**
   * Records an information. @param msg the message @param node the location
   * @param extra more fields.
   */
  info(msg, node, extra) {
    this.diag("info", msg, node, extra);
  }

  /**
   * Creates a symbol and record its definition.
   *
   * @param {string} kind Type, fun, name, event, table, pred, letfun,
   *   process, var, macro, reserved.
   * @param {string} name Its identifier.
   * @param {string} defNode The identifier node of its definition (or null
   *   for built-ins).
   * @param {Object} extra More fields.
   * @return {Object} The symbol.
   */
  newSymbol(kind: string, name: string, defNode: any, extra: any = {}) {
    const id = "s" + ++this.symCounter;
    const sym = { id, kind, name, def: defNode && defNode.start >= 0 ? { start: defNode.start, end: defNode.end } : null, refs: 0, ...extra };
    this.symbols.set(id, sym);
    if (defNode && defNode.start >= 0 && !this.inExpansion) {
      this.occurrences.push({ start: defNode.start, end: defNode.end, sym: id, def: true });
    }
    return sym;
  }

  /**
   * Records a reference to a symbol.
   *
   * @param {Object} sym The symbol.
   * @param {string} node The identifier node.
   */
  ref(sym: any, node: any) {
    if (!sym || !node || node.start < 0) {
      return;
    }
    sym.refs++;
    // virtual nodes stand for symbols ProVerif inserts itself ("0" and "+" of integers)
    if (!this.inExpansion && !node.virtual) {
      this.occurrences.push({ start: node.start, end: node.end, sym: sym.id, def: false });
    }
  }

  /**
   * Lists the process variables visible in a scope, innermost binding first.
   *
   * @param {Scope} scope The scope.
   * @return {Object} A map from identifiers to variable symbols.
   */
  localVars(scope: Scope) {
    const out = new Map();
    const seen = new Set();
    for (let s = scope; s; s = s.parent) {
      for (const [k, v] of s.map) {
        if (seen.has(k)) {
          continue;
        }
        seen.add(k);
        if (v.kind === "var" && v.local) {
          out.set(k, v);
        }
      }
    }
    return out;
  }

  /**
   * Remembers the type of a term.
   *
   * @param {Object} node The term.
   * @param {Object} t Its type.
   * @return {Object} The type.
   */
  setType(node: any, t: any) {
    if (node && typeof node === "object") {
      this.types.set(node, t);
    }
    return t;
  }

  // Entry point

  /**
   * Runs the whole check in ProVerif's order.
   *
   * @return {Object} {diagnostics, symbols, occurrences, types, hasChoice,
   *   hasBarrier, maxPhase, keyCompromise, queries, lemmas, processInfo,
   *   global, eventUses, settings}.
   */
  run() {
    const prog = this.program;
    this.checkSettings(prog.decls);
    this.initEnv();
    this.recordIds(prog.decls);
    const decls = new MacroExpander(this).run(prog.decls, [...this.global.map.keys()]);
    this.expanded = decls;
    for (const d of decls) {
      if (d.kind !== "QueryDecl") {
        continue;
      }
      for (const q of d.queries) {
        if (q.kind === "SecretQuery") {
          this.globalRefIds.add(q.name.name);
        }
        if (q.kind === "SecretQuery" || q.kind === "RealQuery") {
          q.publicVars.forEach(v => this.globalRefIds.add(v.name));
        }
      }
    }
    this.collectBound(decls);
    for (const d of decls) {
      if (d.kind === "SetDecl") {
        continue;
      }
      this.inExpansion = d.__expansion || null;
      this.checkOne(d);
      this.inExpansion = null;
    }
    if (prog.process) {
      this.checkMainProcess(prog.process);
    }
    if (prog.equivalence) {
      for (const p of prog.equivalence) {
        this.checkMainProcess(p);
      }
    }
    this.maxPhase = this.mainMaxPhase;
    this.goalCompatibilityChecks();
    this.queryChecker.maxPhaseChecks();
    this.queryChecker.translateQueries();
    this.queryChecker.translateLemmas();
    // what follows ProVerif checks while it translates the model into clauses
    this.lateStage = true;
    const late = this.diags.length;
    this.translationChecks();
    this.queryChecker.translateNots();
    this.queryChecker.translateNounifs();
    this.queryChecker.checkDelayedNames();
    // what follows ProVerif checks when it encodes the queries, as the verification starts
    if (!this.diags.some(d => d.severity === "error")) {
      this.queryChecker.temporalChecks(this.options.lineIndex || null);
    }
    // without anything to verify ProVerif stops before all this: those problems are only warnings then
    if (!this.hasQuery()) {
      for (const d of this.diags.slice(late)) {
        if (d.severity !== "error") {
          continue;
        }
        d.severity = "warning";
        d.detail = (d.detail ? d.detail + " " : "") + "(ProVerif reports this only when the model has something to verify.)";
      }
    }
    this.lints();
    this.diags.sort((a, b) => a.start - b.start || a.seq - b.seq);
    this.occurrences.sort((a, b) => a.start - b.start);
    return {
        diagnostics: this.diags
      , symbols: this.symbols
      , occurrences: this.occurrences
      , types: this.types
      , hasChoice: this.hasChoice
      , hasBarrier: this.hasBarrier
      , maxPhase: this.maxPhase
      , keyCompromise: this.keyCompromise
      , queries: this.goalDecls
      , processInfo: this.processInfo
      , global: this.global
      , eventUses: this.eventUses
      , settings: this.settingValues
      , expanded: this.expanded
    };
  }

  // PvSettings, environment, identifiers

  /**
   * Tells whether ProVerif will verify something (has_query of main.ml):
   * otherwise it stops after the parsing.
   *
   * @return {boolean} True with a query, a noninterf or weaksecret goal, a
   *   biprocess or an equivalence.
   */
  hasQuery(): boolean {
    const prog = this.program;
    if (prog.equivalence || this.hasChoice) {
      return true;
    }
    return prog.decls.some(d => (d.kind === "QueryDecl" && d.queries && d.queries.length) || d.kind === "NonInterfDecl" || d.kind === "WeakSecretDecl");
  }

  /**
   * Interprets the top-level settings first, as parse_file does.
   *
   * @param {Array} decls The top-level declarations.
   */
  checkSettings(decls: any[]) {
    this.settingValues = new Map();
    let ignoreTypesSet = false;
    for (const d of decls) {
      if (d.kind !== "SetDecl") {
        continue;
      }
      const name = d.name.name;
      const r = PvSettings.validate(name, d.value);
      // ProVerif reports bad settings at the name of the parameter
      if (r) {
        this.diag(r.severity, r.message, d.name, { code: "setting" });
      }
      if (!r || r.severity !== "error") {
        this.settingValues.set(name, { value: String(d.value.value), decl: d });
        if (name === "keyCompromise") {
          this.keyCompromise = d.value.value === "strict" ? 2 : d.value.value === "approx" ? 1 : 0;
        }
        if (name === "allowDiffPatterns") {
          this.allowDiffPatterns = ["true", "yes"].includes(String(d.value.value));
        }
        if (name === "ignoreTypes") {
          if (ignoreTypesSet) {
            this.warn("ignore_types set twice", d.name);
          }
          ignoreTypesSet = true;
        }
      }
    }
  }

  /**
   * Fills the initial environment (initialize_env).
   */
  initEnv() {
    const fn = (name, args, ret, cat) => this.global.set(name, this.newSymbol("fun", name, null, { args, ret, cat, builtin: true }));
    fn("true", [], "bool", "data");
    fn("false", [], "bool", "data");
    fn("not", ["bool"], "bool", "destr");
    fn("&&", ["bool", "bool"], "bool", "destr");
    fn("||", ["bool", "bool"], "bool", "destr");
    fn("0", [], "nat", "data");
    fn("+", ["nat"], "nat", "data");
    fn(">", ["nat", "nat"], "bool", "destr");
    fn(">=", ["nat", "nat"], "bool", "destr");
    fn("<", ["nat", "nat"], "bool", "destr");
    fn("<=", ["nat", "nat"], "bool", "destr");
    fn("is_nat", ["nat"], "bool", "destr");
    for (const r of PvChecker.RESERVED) {
      this.global.set(r, this.newSymbol("reserved", r, null, { builtin: true }));
    }
    for (const t of PvChecker.INITIAL_TYPES) {
      this.global.set(t, this.newSymbol("type", t, null, { builtin: true }));
    }
  }

  /**
   * Detects duplicate top-level identifiers, as Display.record_id does before
   * macro expansion.
   *
   * @param {Array} decls The top-level declarations.
   */
  recordIds(decls: any[]) {
    const seen = new Set(this.global.map.keys());
    for (const d of decls) {
      const ids = MacroExpander.declaredIds(d, (msg, node) => {
        this.error(msg, node);
      });
      for (const id of ids) {
        if (seen.has(id.name)) {
          this.error(PvChecker.alreadyDefined(id.name), id, { code: "duplicate" });
          this.reported.add(id);
        } else {
          seen.add(id.name);
        }
      }
    }
  }

  /**
   * Checks that an identifier is not declared yet (check_no_def).
   *
   * @param {number} id The identifier node.
   * @return {boolean} True when it is already declared (and it was reported).
   */
  noDef(id: any): boolean {
    if (this.reported.has(id)) {
      return true;
    }
    if (this.global.map.has(id.name)) {
      this.error(PvChecker.alreadyDefined(id.name), id, { code: "duplicate" });
      this.reported.add(id);
      return true;
    }
    return false;
  }

  /**
   * Resolves a type identifier (get_type_polym).
   *
   * @param {number} id The identifier node.
   * @param {Object} opts {polym, sid, time}: whether any_type, sid and time
   *   are allowed.
   * @return {Object} The type name, or '?'.
   */
  getType(id: any, { polym = false, sid = false, time = false }: any = {}) {
    if (!id) {
      return PvChecker.UNKNOWN;
    }
    const s = id.name;
    if (s === "any_type") {
      if (polym) {
        return "any_type";
      }
      this.error("polymorphic type not allowed here", id);
      return PvChecker.UNKNOWN;
    }
    if (s === "sid") {
      if (sid) {
        return "sid";
      }
      this.error("sid type not allowed here", id);
      return PvChecker.UNKNOWN;
    }
    if (s === "time") {
      if (time) {
        return "time";
      }
      this.error("time type not allowed here", id);
      return PvChecker.UNKNOWN;
    }
    const e = this.global.get(s);
    if (!e) {
      this.error("type " + s + " not declared", id);
      return PvChecker.UNKNOWN;
    }
    if (e.kind !== "type") {
      this.error(s + " should be a type", id);
      return PvChecker.UNKNOWN;
    }
    this.ref(e, id);
    return s;
  }

  /**
   * Adds typed variables to an environment (add_env).
   *
   * @param {Array} vars The declarations.
   * @param {Object} base The environment.
   * @param {Object} opts {sid, time} allowed types.
   * @return {Object} The extended environment.
   */
  addEnv(vars: any[], base: any, { sid = false, time = false }: any = {}) {
    let scope = base;
    for (const v of vars) {
      const t = this.getType(v.type, { sid, time });
      const ex = scope.get(v.name.name);
      if (ex) {
        if (ex.kind === "var") {
          this.error("variable " + v.name.name + " already defined", v.name);
        } else {
          this.warn("identifier " + v.name.name + " rebound", v.name);
        }
      }
      scope = scope.with(v.name.name, this.newSymbol("var", v.name.name, v.name, { type: t, local: true, queryVar: true }));
    }
    return scope;
  }

  /**
   * Adds typed variables, some of which may fail, to the global environment
   * (add_env_may_fail).
   *
   * @param {Array} vars The declarations.
   * @return {Object} The environment.
   */
  mayFailEnv(vars: any[]) {
    let scope = this.global;
    for (const v of vars) {
      const t = this.getType(v.type);
      const ex = scope.get(v.name.name);
      if (ex) {
        if (ex.kind === "var") {
          if (ex.mayFail && v.mayFail) {
            this.error("variable " + v.name.name + " already defined", v.name);
          } else if (v.mayFail) {
            this.error("variable " + v.name.name + " was already defined as a may fail variable", v.name);
          } else {
            this.error("variable " + v.name.name + " was already defined as a message variable", v.name);
          }
        } else {
          this.warn("identifier " + v.name.name + " rebound", v.name);
        }
      }
      scope = scope.with(v.name.name, this.newSymbol("var", v.name.name, v.name, { type: t, mayFail: !!v.mayFail, local: true }));
    }
    return scope;
  }

  /**
   * Lists the names and variables bound by the processes, for queries (the
   * glob tables).
   *
   * Like ProVerif, it looks at the main processes with their process calls
   * expanded; a macro called twice binds its names twice.
   *
   * @param {Array} decls The expanded declarations.
   */
  collectBound(decls: any[]) {
    const macroBodies = new Map();
    for (const d of decls) {
      if (d.kind === "ProcessDecl") {
        macroBodies.set(d.name.name, d);
      }
    }
    const names = this.boundNameCount;
    const vars = this.boundVarCount;
    const nodes = this.boundNameNodes;
    const add = (m, n) => m.set(n, (m.get(n) || 0) + 1);
    const addName = node => {
      add(names, node.name.name);
      if (!nodes.has(node.name.name)) {
        nodes.set(node.name.name, []);
      }
      nodes.get(node.name.name).push(node);
    };
    const patVars = p => {
      for (const id of Ast.patternVars(p)) {
        add(vars, id.name);
      }
    };
    const visiting = new Set();
    const visitTerm = t => {
      if (!t || typeof t !== "object") {
        return;
      }
      if (Array.isArray(t)) {
        t.forEach(visitTerm);
        return;
      }
      switch (t.kind) {
        case "TNew":
          addName(t);
          visitTerm(t.body);
          return;

        case "TLet":
          patVars(t.pattern);
          visitTerm(t.value);
          visitTerm(t.then);
          visitTerm(t.else);
          return;

        case "TLetFilter":
          t.vars.forEach(v => add(vars, v.name.name));
          visitTerm(t.cond);
          visitTerm(t.then);
          visitTerm(t.else);
          return;

        case "TGet":
          t.patterns.forEach(patVars);
          visitTerm(t.cond);
          visitTerm(t.then);
          visitTerm(t.else);
          return;

        default:
          for (const k of Object.keys(t)) {
            const v = t[k];

            if (v && typeof v === "object" && k !== "leadingComments") {
              visitTerm(v);
            }
          }
      }
    };
    const visit = p => {
      if (!p) {
        return;
      }
      switch (p.kind) {
        case "New":
          addName(p);
          visit(p.next);
          return;

        case "In":
          visitTerm(p.chan);
          patVars(p.pattern);
          visit(p.next);
          return;

        case "Out":
          visitTerm(p.chan);
          visitTerm(p.msg);
          visit(p.next);
          return;

        case "Let":
          visitTerm(p.value);
          patVars(p.pattern);
          visit(p.then);
          visit(p.else);
          return;

        case "LetFilter":
          p.vars.forEach(v => add(vars, v.name.name));
          visitTerm(p.cond);
          visit(p.then);
          visit(p.else);
          return;

        case "Get":
          p.patterns.forEach(patVars);
          visitTerm(p.cond);
          visit(p.then);
          visit(p.else);
          return;

        case "If":
          visitTerm(p.cond);
          visit(p.then);
          visit(p.else);
          return;

        case "Event":
          visitTerm(p.args);
          visit(p.next);
          return;

        case "Insert":
          visitTerm(p.args);
          visit(p.next);
          return;

        case "Call": {
          visitTerm(p.args);
          const m = macroBodies.get(p.name.name);
          if (m && !visiting.has(m)) {
            visiting.add(m);
            (m.params || []).forEach(v => add(vars, v.name.name));
            visit(m.body);
            visiting.delete(m);
          }
          return;
        }

        default:
          for (const [, c] of Ast.processChildren(p)) {
            visit(c);
          }
      }
    };
    if (this.program.process) {
      visit(this.program.process);
    }
    if (this.program.equivalence) {
      this.program.equivalence.forEach(visit);
    }
  }

  // Declarations

  /**
   * Checks one declaration (check_one).
   *
   * @param {Object} d The declaration.
   */
  checkOne(d: any) {
    switch (d.kind) {
      case "TypeDecl": {
        const s = d.name.name;
        if (s === "any_type") {
          this.error("type any_type reserved for polymorphism", d.name);
          return;
        }
        if (s === "sid") {
          this.error("type sid reserved for session identifiers", d.name);
          return;
        }
        if (this.noDef(d.name)) {
          return;
        }
        this.global.set(s, this.newSymbol("type", s, d.name, { decl: d }));
        return;
      }

      case "FunDecl":
        if (d.reduc) {
          this.checkRedMayFail(d);
        } else {
          this.checkFunDecl(d.name, d.argTypes, d.retType, d.options, d, false);
        }
        return;

      case "ConstDecl":
        for (const n of d.names) {
          this.checkFunDecl(n, [], d.type, d.options, d, true);
        }
        return;

      case "EquationDecl":
        this.checkEquations(d);
        return;

      case "ReducDecl":
        this.checkRed(d);
        return;

      case "PredDecl":
        this.checkPred(d);
        return;

      case "EventDecl": {
        const args = (d.argTypes || []).map(t => this.getType(t));
        if (this.noDef(d.name)) {
          return;
        }
        this.global.set(d.name.name, this.newSymbol("event", d.name.name, d.name, { args, decl: d }));
        return;
      }

      case "TableDecl": {
        const args = d.argTypes.map(t => this.getType(t));
        if (this.noDef(d.name)) {
          return;
        }
        this.global.set(d.name.name, this.newSymbol("table", d.name.name, d.name, { args, decl: d }));
        return;
      }

      case "ProcessDecl":
        this.checkProcessDecl(d);
        return;

      case "QueryDecl":
        this.queryChecker.declareQuery(d);
        return;

      case "LemmaDecl":
        this.queryChecker.declareLemma(d);
        return;

      case "NonInterfDecl":
        this.checkNonInterf(d);
        return;

      case "WeakSecretDecl": {
        this.goalDecls.push({ decl: d, kind: "weaksecret" });
        this.nonInterfName(d.name, this.global);
        return;
      }

      case "NoUnifDecl":
        this.nounifs.push(d);
        return;

      case "ElimTrueDecl": {
        const scope = this.mayFailEnv(d.vars);
        this.checkSimpleFact(d.term, scope);
        return;
      }

      case "NotDecl":
        this.nots.push(d);
        return;

      case "FreeDecl":
        for (const n of d.names) {
          this.addFreeName(n, d.type, d.options, d);
        }
        return;

      case "ChannelDecl":
        for (const n of d.names) {
          this.addFreeName(n, { name: "channel", start: -1, end: -1 }, [], d);
        }
        return;

      case "ClausesDecl":
        this.checkClauses(d);
        return;

      case "LetFunDecl":
        this.checkLetFun(d);
        return;

      case "RawDecl":
      case "SetDecl":
      case "DefineDecl":
      case "ExpandDecl":
        return;

      default:
        this.error("unknown declaration " + d.kind, d);
    }
  }

  /**
   * Rejects parameters on options that take none (no_param_option_list).
   *
   * @param {Object} opts The options.
   * @return {boolean} True when all options are parameterless.
   */
  noParamOptions(opts: any): boolean {
    for (const o of opts || []) {
      if (o.value) {
        this.error("This option should not have any parameter.", o.name);
        return false;
      }
    }
    return true;
  }

  /**
   * Checks a constructor or constant declaration (check_fun_decl).
   *
   * @param {string} nameId The name.
   * @param {Array} argTypes Argument type identifiers.
   * @param {Object} retType Result type identifier.
   * @param {Object} options The options.
   * @param {Object} decl The declaration.
   * @param {boolean} isConst True for const declarations.
   */
  checkFunDecl(nameId: any, argTypes: any[], retType: any, options: any, decl: any, isConst: boolean) {
    if (!this.noParamOptions(options)) {
      return;
    }
    const args = argTypes.map(t => this.getType(t));
    const ret = this.getType(retType);
    if (this.noDef(nameId)) {
      return;
    }
    if (ret === "nat" || ret === "bool") {
      if (argTypes.length === 0) {
        this.error("The constant " + nameId.name + " cannot be declared with type '" + ret + "'", nameId);
      } else {
        this.error("The function " + nameId.name + " cannot be declared with '" + ret + "' as a return type", nameId);
      }
    }
    let data = false;
    let priv = false;
    let tc = false;
    for (const o of options || []) {
      switch (o.name.name) {
        case "data":
          data = true;
          break;

        case "projection":
        case "uniform":
          break;

        case "private":
          priv = true;
          break;

        case "typeConverter":
          if (args.length !== 1) {
            this.error("only unary functions can be declared \"typeConverter\"", nameId);
          }
          data = true;
          tc = true;
          break;

        default:
          this.error("for functions, the only allowed options are data, private, typeConverter, and projection and uniform, which are ignored, for compatibility with CryptoVerif", o);
      }
    }
    if (data && priv) {
      this.error("a function cannot be declared both data or typeConverter and private", nameId);
    }
    const sym = this.newSymbol("fun", nameId.name, nameId, { args, ret, cat: data ? "data" : "constr", private: priv, typeConverter: tc, isConst, decl });
    this.global.set(nameId.name, sym);
  }

  /**
   * Gives the function category used by f_eq_tuple, f_any and
   * f_eq_tuple_name.
   *
   * @param {Object} r The result of applySymb or a symbol.
   * @return {Object} 'data', 'constr', 'destr', 'choice' or 'name'.
   */
  categoryOf(r: any) {
    if (r.special === "choice") {
      return "choice";
    }
    if (r.special) {
      return "destr";
    }
    if (r.sym && r.sym.kind === "name") {
      return "name";
    }
    return r.sym ? r.sym.cat : "destr";
  }

  /**
   * Checks that a function may appear in an equation, a clause or a
   * non-interference query.
   *
   * @param {Object} cat Its category.
   * @param {string} s Its name.
   * @param {Object} node Where to report.
   * @param {string} mode 'eq' (f_eq_tuple), 'any' (f_any) or 'ni'
   *   (f_eq_tuple_name).
   */
  funAllowed(cat: any, s: string, node: any, mode: string) {
    if (mode === "eq") {
      if (cat === "name") {
        this.error(s + " is a name; it should not appear in equations or rewrite rules", node);
      } else if (cat === "destr") {
        this.error(s + " is a function defined by rewrite rules; it should not appear in equations or rewrite rules", node);
      } else if (cat === "choice") {
        this.error(s + " should not appear in equations or rewrite rules", node);
      }
    } else if (mode === "any") {
      if (cat === "choice") {
        this.error("function choice should not appear in clauses or elimtrue", node);
      } else if (cat === "name") {
        this.error("names should not appear in clauses or elimtrue", node);
      }
    } else if (mode === "ni") {
      if (cat === "destr") {
        this.error(s + " is a function defined by rewrite rules. It should not appear in non-interference queries", node);
      } else if (cat === "choice") {
        this.error(s + " should not appear in non-interference queries", node);
      }
    }
  }

  /**
   * Looks up a function symbol applied to argument types (get_apply_symb).
   *
   * The operators of the grammar are functions for ProVerif: =, <> and choice
   * are polymorphic; "- n" is the minus function; &&, ||, not, +, <, ... are
   * built-in symbols of the initial environment.
   *
   * @param {Function} name The function name ("=", "<>", "choice", "-", or an
   *   identifier).
   * @param {Object} node Where to report.
   * @param {Array} tys The argument types.
   * @param {Scope} scope The environment.
   * @return {Object} {sym?, special?, ret} or null after an error that leaves
   *   no symbol.
   */
  applySymb(name: any, node: any, tys: any[], scope: Scope) {
    const S = PvChecker;
    if (name === "=" || name === "<>" || name === "choice") {
      if (!S.sameType(tys[0], tys[1])) {
        this.error("function " + name + " expects two arguments of same type but is here given " + S.argsToString(tys), node);
      }
      return { special: name, ret: name === "choice" ? (tys[0] === S.UNKNOWN ? tys[1] : tys[0]) : "bool" };
    }
    if (name === "-") {
      if (!S.sameType(tys[0], "nat")) {
        this.error("function minus expects 1 argument of type nat but is here given " + S.argsToString(tys), node);
      }
      return { special: "minus", ret: "nat" };
    }
    const e = scope.get(name);
    if (!e) {
      this.error(name + " not defined", node);
      return null;
    }
    this.ref(e, node);
    if (e.kind === "fun") {
      if (!S.sameTypes(e.args, tys)) {
        this.error("function " + name + " expects " + S.argsToString(e.args) + " but is here given " + S.argsToString(tys), node);
      }
      return { sym: e, ret: e.ret };
    }
    if (e.kind === "pred") {
      const ok = e.args.length === tys.length && e.args.every((t, i) => S.sameType(t, tys[i]) || t === "any_type");
      if (!ok) {
        this.error("predicate " + name + " expects " + S.argsToString(e.args) + " but is here given " + S.argsToString(tys), node);
      }
      return { sym: e, ret: "bool" };
    }
    if (e.kind === "letfun") {
      if (!S.sameTypes(e.args, tys)) {
        this.error("letfun function " + name + " expects " + S.argsToString(e.args) + " but is here given " + S.argsToString(tys), node);
      }
      return { sym: e, ret: e.ret };
    }
    return { sym: e, ret: S.UNKNOWN };
  }

  /**
   * Looks up a function, failing on predicates and other symbols (get_fun).
   *
   * @param {Function} name The function name.
   * @param {Object} node Where to report.
   * @param {Array} tys The argument types.
   * @param {Scope} scope The environment.
   * @return {Object} {sym?, special?, ret} or null.
   */
  getFun(name: any, node: any, tys: any[], scope: Scope) {
    const r = this.applySymb(name, node, tys, scope);
    if (!r) {
      return null;
    }
    if (r.special || (r.sym && r.sym.kind === "fun")) {
      return r;
    }
    this.error(name + " should be a function", node);
    return null;
  }

  /**
   * Looks up a predicate (get_pred).
   *
   * @param {string} name The predicate name.
   * @param {Object} node Where to report.
   * @param {Array} tys The argument types.
   * @param {Scope} scope The environment.
   * @return {Object|null} The predicate symbol, or null.
   */
  getPred(name: string, node: any, tys: any[], scope: Scope) {
    const r = this.applySymb(name, node, tys, scope);
    if (!r) {
      return null;
    }
    if (r.sym && r.sym.kind === "pred") {
      return r.sym;
    }
    this.error(name + " should be a predicate", node);
    return null;
  }

  /**
   * Looks up an event (get_event_fun), with the session argument of key
   * compromise.
   *
   * @param {number} id The event identifier.
   * @param {Array} tys The argument types.
   * @param {Scope} scope The environment.
   * @return {Object|null} The event symbol, or null.
   */
  getEvent(id: any, tys: any[], scope: Scope) {
    const S = PvChecker;
    const e = scope.get(id.name);
    if (!e) {
      this.error("event " + id.name + " not defined", id);
      return null;
    }
    this.ref(e, id);
    if (e.kind !== "event") {
      this.error(id.name + " should be an event", id);
      return null;
    }
    const args = this.keyCompromise ? ["sid", ...e.args] : e.args;
    const given = this.keyCompromise ? ["sid", ...tys] : tys;
    if (!S.sameTypes(args, given)) {
      this.error("function " + id.name + " expects " + S.argsToString(args) + " but is here given " + S.argsToString(given), id);
    }
    return e;
  }

  /**
   * Looks up a table (get_table_fun).
   *
   * @param {number} id The table identifier.
   * @param {Array} tys The argument types.
   * @param {Scope} scope The environment.
   * @return {Object} The table symbol, or null.
   */
  getTable(id: any, tys: any[], scope: Scope) {
    const S = PvChecker;
    const e = scope.get(id.name);
    if (!e) {
      this.error("table " + id.name + " not defined", id);
      return null;
    }
    this.ref(e, id);
    if (e.kind !== "table") {
      this.error(id.name + " should be a table", id);
      return null;
    }
    if (!S.sameTypes(e.args, tys)) {
      this.error("table " + id.name + " expects " + S.argsToString(e.args) + " but is here given " + S.argsToString(tys), id);
    }
    return e;
  }

  /**
   * Gives the virtual function application ProVerif sees for an operator
   * node.
   *
   * @param {Object} t A term node.
   * @return {Object} {name, node, args} for operators, or null.
   */
  operatorOf(t: any) {
    switch (t.kind) {
      case "BinOp":
        return { name: t.op, node: t, args: [t.left, t.right] };

      case "Not":
        return { name: "not", node: t, args: [t.arg] };

      case "Choice":
        return { name: "choice", node: t, args: [t.left, t.right] };

      case "Plus":
        return { name: "+", node: t, args: [t.term] };

      case "Minus":
        return { name: "-", node: t, args: [t.term], display: "- " + t.n };

      default:
        return null;
    }
  }

  // Terms of equations, rewrite rules, clauses, noninterf (check_eq_term)

  /**
   * Checks a term of an equation, a rewrite rule, a clause or a
   * non-interference query.
   *
   * @param {Object} t The term.
   * @param {Scope} scope The environment.
   * @param {string} mode 'eq', 'any' or 'ni' (see funAllowed).
   * @param {boolean} failTop Whether a may-fail variable is allowed at the
   *   top.
   * @param {boolean} failAll Whether may-fail variables are allowed
   *   everywhere.
   * @return {Object} The type.
   */
  checkEqTerm(t: any, scope: Scope, mode: string, failTop: boolean = false, failAll: boolean = false) {
    const S = PvChecker;
    switch (t.kind) {
      case "Fail":
        this.error("The constant fail should not appear in this term", t);
        return S.UNKNOWN;

      case "Ident": {
        const e = scope.get(t.name);
        if (!e) {
          this.error("identifier " + t.name + " not defined", t);
          return S.UNKNOWN;
        }
        this.ref(e, t);
        if (e.kind === "var") {
          if (e.mayFail && !(failTop || failAll)) {
            this.error("The may-fail variable " + t.name + " cannot be used in this term.", t);
            return e.type;
          }
          return this.setType(t, e.type);
        }
        if (e.kind === "fun") {
          if (e.args.length) {
            this.error("function " + t.name + " expects " + e.args.length + " arguments but is used without arguments", t);
            return e.ret;
          }
          this.funAllowed(e.cat, t.name, t, mode);
          return this.setType(t, e.ret);
        }
        if (e.kind === "name") {
          this.funAllowed("name", t.name, t, mode);
          return this.setType(t, e.type);
        }
        if (e.kind === "letEq") {
          return this.setType(t, e.type);
        }
        this.error("identifier " + t.name + " should be a function, a variable, or a name", t);
        return S.UNKNOWN;
      }

      case "Int":
        return this.setType(t, "nat");

      case "App": {
        const tys = t.args.map(a => this.checkEqTerm(a, scope, mode, false, failAll));
        const r = this.getFun(t.fn.name, t.fn, tys, scope);
        if (!r) {
          return S.UNKNOWN;
        }
        this.funAllowed(this.categoryOf(r), t.fn.name, t.fn, mode);
        return this.setType(t, r.ret);
      }

      case "Tuple":
        t.items.forEach(a => this.checkEqTerm(a, scope, mode, false, failAll));
        return this.setType(t, "bitstring");

      case "Proj":
        this.error("projections not allowed here", t);
        return S.UNKNOWN;

      default: {
        const op = this.operatorOf(t);
        if (!op) {
          this.error("a term is expected here", t);
          return S.UNKNOWN;
        }
        const tys = op.args.map(a => this.checkEqTerm(a, scope, mode, false, failAll));
        const r = this.getFun(op.name, op.node, tys, scope);
        if (!r) {
          return S.UNKNOWN;
        }
        this.funAllowed(this.categoryOf(r), op.display || op.name, op.node, mode);
        return this.setType(t, r.ret);
      }
    }
  }

  /**
   * Checks the "let x = t in" prefixes of an extended equation
   * (check_extended_equation).
   *
   * @param {Array} lets The bindings.
   * @param {Scope} scope The environment of the forall variables.
   * @param {boolean} mayFail Whether may-fail variables are allowed in the
   *   bound terms.
   * @return {Object} The extended environment.
   */
  checkLets(lets: any[], scope: Scope, mayFail: boolean) {
    let s = scope;
    for (const l of lets || []) {
      const ex = s.get(l.name.name);
      if (ex) {
        this.error(ex.kind === "var" ? "variable " + l.name.name + " already defined" : "identifier " + l.name.name + " already defined", l.name);
        continue;
      }
      const ty = this.checkEqTerm(l.value, s, "eq", mayFail, false);
      s = s.with(l.name.name, this.newSymbol("letEq", l.name.name, l.name, { type: ty, local: true }));
    }
    return s;
  }

  /**
   * Checks an equation declaration (check_equations).
   *
   * @param {Object} d The EquationDecl.
   */
  checkEquations(d: any) {
    if (!this.noParamOptions(d.options)) {
      return;
    }
    let info = null;
    if (d.options.length) {
      if (d.options.length === 1 && ["convergent", "linear"].includes(d.options[0].name.name)) {
        info = d.options[0].name.name;
      } else {
        this.error("for equations, the only allowed options are either convergent or linear", d.options[0].name);
        return;
      }
    }
    for (const eq of d.eqs) {
      const scope = this.checkLets(eq.lets, this.addEnv(eq.forall, this.global), false);
      const t = eq.term;
      if (t.kind === "BinOp" && (t.op === "=" || t.op === "<>")) {
        if (t.op === "<>" && info) {
          this.error("disequations should not have options [convergent] or [linear]", t);
        }
        const a = this.checkEqTerm(t.left, scope, "eq");
        const b = this.checkEqTerm(t.right, scope, "eq");
        this.setType(t, "bool");
        if (!PvChecker.sameType(a, b)) {
          this.error("the two members of an equation should have the same type", { start: t.start, end: t.end });
        }
      } else {
        const a = this.checkEqTerm(t, scope, "eq");
        if (!PvChecker.sameType(a, "bool")) {
          this.error("when an equation declaration is just a term, it should have type bool", MacroExpander.extentOf(t));
        }
      }
    }
  }

  /**
   * Collects the variables of the environment used in terms.
   *
   * @param {Array} terms The terms.
   * @param {Scope} scope The environment.
   * @param {Object} out A set of symbol ids.
   * @return {Object} The set.
   */
  varsOf(terms: any[], scope: Scope, out: any = new Set()) {
    const visit = t => {
      if (!t || typeof t !== "object") {
        return;
      }
      if (t.kind === "Ident") {
        const e = scope.get(t.name);

        if (e && e.kind === "var") {
          out.add(e.id);
        } else if (e && e.kind === "letEq" && e.vars) {
          e.vars.forEach(v => out.add(v));
        }

        return;
      }
      for (const k of ["args", "items", "left", "right", "term", "arg"]) {
        const v = t[k];
        if (Array.isArray(v)) {
          v.forEach(visit);
        } else if (v && typeof v === "object") {
          visit(v);
        }
      }
    };
    terms.forEach(visit);
    return out;
  }

  /**
   * Checks a "reduc" declaration (check_red).
   *
   * @param {Object} d The ReducDecl.
   */
  checkRed(d: any) {
    const S = PvChecker;
    if (!this.noParamOptions(d.options)) {
      return;
    }
    const first = d.rules[0];
    const top = MacroExpander.topSymbol(first);
    if (top.error) {
      this.error(top.error, top.node);
      return;
    }
    const f = top.fn;
    if (S.SPECIAL_FUNCTIONS.has(f.name)) {
      this.error(f.name + " not allowed here", f);
      return;
    }
    if (this.noDef(f)) {
      return;
    }
    const sigs = [];
    for (const r of d.rules) {
      const scope0 = this.addEnv(r.forall, this.global);
      const scope = this.checkLets(r.lets, scope0, false);
      const t = r.term;
      if (!(t.kind === "BinOp" && t.op === "=")) {
        this.error("In \"reduc\", all rewrite rules should be an equality between two terms", MacroExpander.extentOf(t));
        continue;
      }
      if (t.left.kind !== "App") {
        this.error("In \"reduc\", all rewrite rules should begin with function application", MacroExpander.extentOf(t.left));
        continue;
      }
      const lfn = t.left.fn;
      if (lfn.name !== f.name) {
        this.error("In \"reduc\", all rewrite rules should begin with the same function " + f.name, lfn);
        continue;
      }
      // OCaml evaluates the pair (lhs, rhs) right to left
      const tyr = this.checkEqTerm(t.right, scope, "eq");
      const tyl = t.left.args.map(a => this.checkEqTerm(a, scope, "eq"));
      const lv = this.varsOf(t.left.args, scope);
      const rv = this.varsOf([t.right], scope);
      if ([...rv].some(v => !lv.has(v))) {
        this.error("All variables of the right-hand side of a \"reduc\" definition\nshould also occur in the left-hand side.", lfn);
      }
      sigs.push({ args: tyl, ret: tyr });
      if (r !== first) {
        this.pendingRef = lfn;
      }
    }
    if (sigs.length) {
      for (const s of sigs.slice(1)) {
        if (!S.sameTypes(sigs[0].args, s.args)) {
          this.error("the arguments of function " + f.name + " do not have the same type in all rewrite rules", f);
        }
        if (!S.sameType(sigs[0].ret, s.ret)) {
          this.error("the result of function " + f.name + " does not have the same type in all rewrite rules", f);
        }
      }
    }
    let priv = false;
    for (const o of d.options) {
      if (o.name.name === "private") {
        priv = true;
      } else {
        this.error("for functions defined by rewrite rules, the only allowed option is private", o);
      }
    }
    const sym = this.newSymbol("fun", f.name, f, { args: sigs.length ? sigs[0].args : [], ret: sigs.length ? sigs[0].ret : S.UNKNOWN, cat: "destr", private: priv, decl: d });
    for (const r of d.rules.slice(1)) {
      const t = r.term;
      if (t.kind === "BinOp" && t.op === "=" && t.left.kind === "App" && t.left.fn.name === f.name) {
        this.ref(sym, t.left.fn);
      }
    }
    this.global.set(f.name, sym);
  }

  /**
   * Checks a "fun ... reduc ... otherwise" declaration (check_red_may_fail).
   *
   * @param {Object} d The FunDecl with rules.
   */
  checkRedMayFail(d: any) {
    const S = PvChecker;
    if (!this.noParamOptions(d.options)) {
      return;
    }
    const args = d.argTypes.map(t => this.getType(t));
    const ret = this.getType(d.retType);
    const f = d.name;
    if (this.noDef(f)) {
      return;
    }
    if (S.SPECIAL_FUNCTIONS.has(f.name)) {
      this.error(f.name + " not allowed here", f);
      return;
    }
    const sym = this.newSymbol("fun", f.name, f, { args, ret, cat: "destr", private: false, decl: d });
    for (const r of d.reduc) {
      const scope0 = this.mayFailEnv(r.forall);
      const scope = this.checkLets(r.lets, scope0, true);
      const t = r.term;
      if (!(t.kind === "BinOp" && t.op === "=")) {
        this.error("In \"reduc\", all rewrite rules should be an equality between two terms", MacroExpander.extentOf(t));
        continue;
      }
      if (t.left.kind !== "App") {
        this.error("In \"reduc\", all rewrite rules should begin with function application", MacroExpander.extentOf(t.left));
        continue;
      }
      const lfn = t.left.fn;
      if (lfn.name !== f.name) {
        this.error("In \"reduc\", all rewrite rules should begin with the same function " + f.name, lfn);
        continue;
      }
      this.ref(sym, lfn);
      if (t.left.args.length !== args.length) {
        this.error("Function " + f.name + " expects " + args.length + " argument(s) but is here given " + t.left.args.length + " argument(s)", lfn);
        continue;
      }
      t.left.args.forEach((a, i) => this.checkMayFailTerm(a, scope, args[i]));
      this.checkMayFailTerm(t.right, scope, ret);
    }
    for (const o of d.options) {
      if (o.name.name === "private") {
        sym.private = true;
      } else {
        this.error("for functions defined by rewrite rules, the only allowed option is private", o);
      }
    }
    this.global.set(f.name, sym);
  }

  /**
   * Checks a term of a rule that may be "fail" (check_may_fail_term).
   *
   * @param {Object} t The term.
   * @param {Scope} scope The environment.
   * @param {Object} expected The expected type.
   */
  checkMayFailTerm(t: any, scope: Scope, expected: any) {
    if (t.kind === "Fail") {
      this.setType(t, expected);
      return;
    }
    const ty = this.checkEqTerm(t, scope, "eq", true, false);
    if (!PvChecker.sameType(ty, expected)) {
      this.error("the term is of type " + ty + " but the type " + expected + " was expected", MacroExpander.extentOf(t));
    }
  }

  /**
   * Checks a predicate declaration (check_pred).
   *
   * @param {Object} d The PredDecl.
   */
  checkPred(d: any) {
    if (!this.noParamOptions(d.options)) {
      return;
    }
    const c = d.name;
    if (["attacker", "mess", "event", "inj-event"].includes(c.name)) {
      this.error("predicate name " + c.name + " is reserved. You cannot declare it", c);
      return;
    }
    if (this.noDef(c)) {
      return;
    }
    const args = (d.argTypes || []).map(t => this.getType(t, { polym: true }));
    let blocking = false;
    for (const o of d.options) {
      if (o.name.name === "memberOptim") {
        if (args.length !== 2) {
          this.error("memberOptim makes sense only for predicates of arity 2", o.name);
        }
      } else if (o.name.name === "block") {
        blocking = true;
      } else {
        this.error("unknown predicate qualifier " + o.name.name, o.name);
      }
    }
    this.global.set(c.name, this.newSymbol("pred", c.name, c, { args, blocking, decl: d }));
  }

  /**
   * Checks a free name (add_free_name).
   *
   * @param {number} n The name.
   * @param {Object} typeId Its type identifier.
   * @param {Object} options Its options.
   * @param {Object} decl The declaration.
   */
  addFreeName(n: any, typeId: any, options: any, decl: any) {
    if (!this.noParamOptions(options)) {
      return;
    }
    let priv = false;
    for (const o of options || []) {
      if (o.name.name === "private") {
        priv = true;
      } else {
        this.error("for free names, the only allowed option is private", o);
        return;
      }
    }
    const t = typeId.start < 0 && typeId.name === "channel" ? "channel" : this.getType(typeId);
    if (this.noDef(n)) {
      return;
    }
    if (t === "nat" || t === "bool") {
      this.error("The name " + n.name + " cannot be declared with the type '" + t + "'", n);
    }
    this.global.set(n.name, this.newSymbol("name", n.name, n, { type: t, private: priv, free: true, decl }));
  }

  /**
   * Checks a clauses declaration (check_clause).
   *
   * @param {Object} d The ClausesDecl.
   */
  checkClauses(d: any) {
    for (const c of d.clauses) {
      const scope = this.mayFailEnv(c.forall);
      if (c.kind === "fact") {
        this.checkSimpleFact(c.concl, scope);
      } else {
        this.checkHypFact(c.hyp, scope, c.kind !== "clause");
        this.checkSimpleFact(c.concl, scope);
      }
    }
  }

  /**
   * Checks the arguments of a fact and its predicate (check_cterm).
   *
   * @param {string} name The predicate name.
   * @param {Object} node Where to report.
   * @param {Array} args The arguments.
   * @param {Scope} scope The environment.
   */
  checkCTerm(name: string, node: any, args: any[], scope: Scope) {
    const tys = args.map(a => this.checkEqTerm(a, scope, "any", false, true));
    this.getPred(name, node, tys, scope);
  }

  /**
   * Checks a fact of a clause conclusion or an elimtrue (check_simple_fact).
   *
   * @param {Object} t The fact.
   * @param {Scope} scope The environment.
   */
  checkSimpleFact(t: any, scope: Scope) {
    switch (t.kind) {
      case "Fail":
        this.error("The constant fail should not appear in this fact", t);
        return;

      case "Tuple":
        this.error("tuples not allowed here", t);
        return;

      case "Proj":
        this.error("projections not allowed here", t);
        return;

      case "Ident":
        this.checkCTerm(t.name, t, [], scope);
        return;

      case "Int":
        this.checkCTerm("0", t, [], scope);
        return;

      case "App":
        this.checkCTerm(t.fn.name, t.fn, t.args, scope);
        return;

      default: {
        const op = this.operatorOf(t);
        if (op) {
          this.checkCTerm(op.display || op.name, op.node, op.args, scope);
        } else {
          this.error("a fact is expected here", t);
        }
      }
    }
  }

  /**
   * Checks the hypothesis of a clause (check_hyp).
   *
   * @param {Object} t The hypothesis.
   * @param {Scope} scope The environment.
   * @param {boolean} simple True for equivalences, where = and <> are not
   *   allowed.
   */
  checkHypFact(t: any, scope: Scope, simple: boolean) {
    if (t.kind === "BinOp" && t.op === "&&") {
      this.checkHypFact(t.left, scope, simple);
      this.checkHypFact(t.right, scope, simple);
      return;
    }
    if (t.kind === "BinOp" && (t.op === "=" || t.op === "<>")) {
      if (simple) {
        this.error(t.op + " not allowed here", t);
        return;
      }
      const a = this.checkEqTerm(t.left, scope, "any", false, true);
      const b = this.checkEqTerm(t.right, scope, "any", false, true);
      if (!PvChecker.sameType(a, b)) {
        this.error("the two arguments of an " + (t.op === "=" ? "equality" : "inequality") + " test should have the same type", t);
      }
      return;
    }
    this.checkSimpleFact(t, scope);
  }

  /**
   * Checks a name used in non-interference or weak secrecy
   * (get_non_interf_name).
   *
   * @param {number} id The identifier.
   * @param {Scope} scope The environment.
   * @return {string} The name symbol, or null.
   */
  nonInterfName(id: any, scope: Scope) {
    const e = scope.get(id.name);
    if (!e) {
      this.error("Name " + id.name + " is not declared", id);
      return null;
    }
    this.ref(e, id);
    if (e.kind !== "name") {
      this.error("Non-interference can only be tested on private free names", id);
      return null;
    }
    if (!e.private) {
      this.error("Non-interference is certainly false on public values, such as " + id.name, id);
      return null;
    }
    return e;
  }

  /**
   * Checks a noninterf declaration (get_non_interf).
   *
   * @param {Object} d The NonInterfDecl.
   */
  checkNonInterf(d: any) {
    this.goalDecls.push({ decl: d, kind: "noninterf" });
    for (const it of d.items) {
      const scope = this.addEnv(d.vars, this.global);
      const n = this.nonInterfName(it.name, scope);
      if (!it.among) {
        continue;
      }
      for (const t of it.among) {
        const ty = this.checkEqTerm(t, this.addEnv(d.vars, this.global), "ni");
        if (n && !PvChecker.sameType(ty, n.type)) {
          this.error("this term has type " + ty + " but should have type " + n.type, MacroExpander.extentOf(t));
        }
      }
    }
  }

  // Process macros and letfun

  /**
   * Checks a process macro "let P(params) = body." (TPDef in check_one).
   *
   * @param {Object} d The ProcessDecl.
   */
  checkProcessDecl(d: any) {
    const dup = this.noDef(d.name);
    let scope = this.global;
    const params = [];
    for (const p of d.params || []) {
      const t = this.getType(p.type);
      const ex = scope.get(p.name.name);
      if (ex && ex.kind === "var") {
        this.error("variable " + p.name.name + " already defined", p.name);
      }
      const sym = this.newSymbol("var", p.name.name, p.name, { type: t, mayFail: !!p.mayFail, local: true, param: true });
      scope = scope.with(p.name.name, sym);
      params.push({ name: p.name.name, type: t, mayFail: !!p.mayFail, sym });
    }
    const info = { decl: d, params, calls: [], minPhase: Infinity, maxPhase: 0, outs: [], ins: [], events: [] };
    const saved = this.currentProc;
    this.currentProc = info;
    this.checkProcess(d.body, scope, 0);
    this.currentProc = saved;
    if (dup) {
      return;
    }
    this.global.set(d.name.name, this.newSymbol("process", d.name.name, d.name, { params: params.map(p => p.type), paramInfo: params, decl: d, info }));
    this.processInfo.set(d.name.name, info);
  }

  /**
   * Checks a "letfun f(params) = M." declaration.
   *
   * @param {Object} d The LetFunDecl.
   */
  checkLetFun(d: any) {
    const dup = this.noDef(d.name);
    let scope = this.global;
    const args = [];
    for (const p of d.params || []) {
      const t = this.getType(p.type);
      const ex = scope.get(p.name.name);
      if (ex && ex.kind === "var") {
        this.error("variable " + p.name.name + " already defined", p.name);
      }
      scope = scope.with(p.name.name, this.newSymbol("var", p.name.name, p.name, { type: t, mayFail: !!p.mayFail, local: true, param: true }));
      args.push(t);
    }
    const ret = this.checkPTerm(d.body, scope);
    if (dup) {
      return;
    }
    this.global.set(d.name.name, this.newSymbol("letfun", d.name.name, d.name, { args, ret, decl: d }));
  }

  // Terms of processes (check_et)

  /**
   * Maps a list right to left, as check_et_list evaluates it, keeping the
   * order of results.
   *
   * @param {Array} list The items.
   * @param {Function} fn The function.
   * @return {Object} The results in the original order.
   */
  rtl(list: any[], fn: Function) {
    const out = new Array(list.length);
    for (let i = list.length - 1; i >= 0; i--) {
      out[i] = fn(list[i]);
    }
    return out;
  }

  /**
   * Rejects names and variables bound in terms that queries reference
   * (check_no_global_ref).
   *
   * @param {number} id The identifier node.
   */
  noGlobalRef(id: any) {
    if (this.globalRefIds.has(id.name)) {
      this.error("Variable or name " + id.name + " defined in a term and referenced in a query. This is not allowed because in general the expansion of terms may not allow " + id.name + " to be defined exactly when it is in the initial process", id);
    }
  }

  /**
   * Checks the arguments of a restriction or an event "[x1, ..., xn]"
   * (get_restr_arg).
   *
   * @param {Array} args The identifiers, or null.
   * @param {Scope} scope The environment.
   */
  restrArgs(args: any[], scope: Scope) {
    if (!args) {
      return;
    }
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (args.slice(i + 1).some(b => b.name === a.name)) {
        continue;
      }
      const e = scope.get(a.name);
      if (!e) {
        this.error("variable " + a.name + " not defined", a);
        continue;
      }
      this.ref(e, a);
      if (e.kind !== "var") {
        this.error(a.name + " should be a variable", a);
      }
    }
  }

  /**
   * Binds a name created by new.
   *
   * Alsoes remember the restriction, with the scope and the number of
   * replications above it, for the "new n[x = M; !1 = i]" terms of goals.
   *
   * @param {Object} node The New or TNew node.
   * @param {Scope} scope The environment.
   * @param {boolean} inTerm True for "new" inside a term.
   * @return {Object} {scope, sym, type}.
   */
  bindName(node: any, scope: Scope, inTerm: boolean) {
    const nameId = node.name;
    if (inTerm) {
      this.noGlobalRef(nameId);
    }
    const ty = this.getType(node.type);
    if (scope.has(nameId.name)) {
      this.warn("identifier " + nameId.name + " rebound", nameId);
    }
    if (ty === "nat" || ty === "bool") {
      this.error("The name " + nameId.name + " cannot be declared with the type '" + ty + "'", nameId);
    }
    const sym = this.newSymbol("name", nameId.name, nameId, { type: ty, bound: true, local: true });
    this.restrictions.set(node, { sym, scope, depth: this.replDepth, inMacro: !!this.currentProc });
    this.recordBound(sym);
    return { scope: scope.with(nameId.name, sym), sym, type: ty };
  }

  /**
   * Checks an identifier used as a term of a process (get_term_from_ident).
   *
   * @param {Object} t The Ident node.
   * @param {Scope} scope The environment.
   * @return {Object} Its type.
   */
  identTerm(t: any, scope: Scope) {
    const S = PvChecker;
    const e = scope.get(t.name);
    if (!e) {
      this.error("Variable, function, name, or predicate " + t.name + " not declared", t);
      return this.setType(t, S.UNKNOWN);
    }
    this.ref(e, t);
    switch (e.kind) {
      case "var":
      case "name":
        return this.setType(t, e.type);

      case "fun":
        if (e.args.length) {
          this.error("function " + t.name + " expects " + e.args.length + " arguments but is used without arguments", t);
        }
        return this.setType(t, e.ret);

      case "letfun":
        if (e.args.length) {
          this.error("letfun function " + t.name + " expects " + S.argsToString(e.args) + " but is used without arguments", t);
        }
        return this.setType(t, e.ret);

      case "pred":
        if (e.args.length) {
          this.error("predicate " + t.name + " expects " + S.argsToString(e.args) + " but is used without arguments", t);
        }
        this.predUses.push(t);
        return this.setType(t, "bool");

      default:
        this.error("identifier " + t.name + " should be a variable, a function, a name, or a predicate", t);
        return this.setType(t, S.UNKNOWN);
    }
  }

  /**
   * Checks a term of a process (check_et).
   *
   * @param {Object} t The term.
   * @param {Scope} scope The environment.
   * @return {Object} Its type.
   */
  checkPTerm(t: any, scope: Scope) {
    const S = PvChecker;
    switch (t.kind) {
      case "Ident":
        return this.identTerm(t, scope);

      case "Int":
        return this.setType(t, "nat");

      case "App": {
        const tys = this.rtl(t.args, a => this.checkPTerm(a, scope));
        const r = this.applySymb(t.fn.name, t.fn, tys, scope);
        if (!r) {
          return this.setType(t, S.UNKNOWN);
        }
        if (r.special || ["fun", "letfun"].includes(r.sym.kind)) {
          return this.setType(t, r.ret);
        }
        if (r.sym.kind === "pred") {
          this.predUses.push(t);
          return this.setType(t, "bool");
        }
        this.error(t.fn.name + " should be a function or a predicate", t.fn);
        return this.setType(t, S.UNKNOWN);
      }

      case "Tuple":
        this.rtl(t.items, a => this.checkPTerm(a, scope));
        return this.setType(t, "bitstring");

      case "TNew": {
        const { scope: s2 } = this.bindName(t, scope, true);
        const ty = this.checkPTerm(t.body, s2);
        this.restrArgs(t.newArgs, scope);
        return this.setType(t, ty);
      }

      case "TIf": {
        const c = this.checkPTerm(t.cond, scope);
        const a = this.checkPTerm(t.then, scope);
        const b = t.else ? this.checkPTerm(t.else, scope) : a;
        if (!S.sameType(c, "bool")) {
          this.error("The type of the condition in the test is " + c + " but a boolean is expected.", t);
        }
        if (!S.sameType(a, b)) {
          this.error("The then and else branches of the test should have the same type, but the then branch is of type " + a + " and the else branch is of type " + b + ".", t);
        }
        return this.setType(t, a);
      }

      case "TLet": {
        for (const id of Ast.patternVars(t.pattern)) {
          this.noGlobalRef(id);
        }
        const vt = this.checkPTerm(t.value, scope);
        const s2 = this.checkPattern(t.pattern, scope, vt, scope, t);
        const a = this.checkPTerm(t.then, s2);
        const b = t.else ? this.checkPTerm(t.else, scope) : a;
        if (!S.sameType(a, b)) {
          this.error("the in and else branches should have the same type", t);
        }
        return this.setType(t, a);
      }

      case "TLetFilter": {
        t.vars.forEach(v => this.noGlobalRef(v.name));
        const s2 = this.filterVars(t.vars, scope);
        this.checkFact(t.cond, s2);
        const a = this.checkPTerm(t.then, s2);
        const b = t.else ? this.checkPTerm(t.else, scope) : a;
        if (!S.sameType(a, b)) {
          this.error("the in and else branches should have the same type", MacroExpander.extentOf(t.cond));
        }
        this.predUses.push(t);
        return this.setType(t, a);
      }

      case "TEvent": {
        const tys = this.rtl(t.args || [], a => this.checkPTerm(a, scope));
        this.restrArgs(t.newArgs, scope);
        const ty = this.checkPTerm(t.body, scope);
        const ev = this.getEvent(t.name, tys, scope);
        if (ev) {
          this.useEvent(ev.name, "process");
        }
        return this.setType(t, ty);
      }

      case "TInsert": {
        const tys = this.rtl(t.args, a => this.checkPTerm(a, scope));
        this.getTable(t.table, tys, scope);
        return this.setType(t, this.checkPTerm(t.body, scope));
      }

      case "TGet": {
        this.preciseOption(t.options);
        t.patterns.forEach(p => {
          for (const id of Ast.patternVars(p)) {
            this.noGlobalRef(id);
          }
        });
        const s2 = this.getPatterns(t.table, t.patterns, scope);
        if (s2 === null) {
          return this.setType(t, S.UNKNOWN);
        }
        if (t.cond) {
          const c = this.checkPTerm(t.cond, s2);
          if (!this.okGetCond(t.cond)) {
            this.error("new, insert, event, and let x1..xn suchthat with n>0 are not allowed in conditions of get", MacroExpander.extentOf(t.cond));
          }
          if (!S.sameType(c, "bool")) {
            this.error("this term has type " + c + " but should have type bool", MacroExpander.extentOf(t.cond));
          }
        }
        const a = this.checkPTerm(t.then, s2);
        const b = t.else ? this.checkPTerm(t.else, scope) : a;
        if (!S.sameType(a, b)) {
          this.error("The then and else branches of get should have the same type, but the then branch is of type " + a + " and the else branch is of type " + b + ".", t.table);
        }
        return this.setType(t, a);
      }

      case "Fail":
        this.error("fail not allowed here", t);
        return S.UNKNOWN;

      case "Proj":
        this.error("projections not allowed here", t);
        return S.UNKNOWN;

      default: {
        const op = this.operatorOf(t);
        if (!op) {
          this.error("unexpected " + t.kind + " in a term", t);
          return S.UNKNOWN;
        }
        const tys = this.rtl(op.args, a => this.checkPTerm(a, scope));
        if (op.name === "choice") {
          this.hasChoice = true;
        }
        const r = this.applySymb(op.name, op.node, tys, scope);
        return this.setType(t, r ? r.ret : S.UNKNOWN);
      }
    }
  }

  /**
   * Tells whether a term may be the condition of a get (ok_get_cond).
   *
   * @param {Object} t The term.
   * @return {boolean} False when it contains new, insert, event or a let
   *   suchthat binding variables.
   */
  okGetCond(t: any): boolean {
    let ok = true;
    const visit = n => {
      if (!ok || !n || typeof n !== "object") {
        return;
      }
      if (Array.isArray(n)) {
        n.forEach(visit);
        return;
      }
      if (n.kind === "TNew" || n.kind === "TInsert" || n.kind === "TEvent" || (n.kind === "TLetFilter" && n.vars.length)) {
        ok = false;
        return;
      }
      for (const k of Object.keys(n)) {
        if (k !== "leadingComments" && k !== "trailingComments") {
          visit(n[k]);
        }
      }
    };
    visit(t);
    return ok;
  }

  /**
   * Checks the precise option of in, get and let ... suchthat
   * (get_precise_option).
   *
   * @param {Object} opts The options.
   * @return {boolean} True for [precise].
   */
  preciseOption(opts: any): boolean {
    if (!opts || !opts.length) {
      return false;
    }
    if (opts.length === 1 && opts[0].name.name === "precise" && !opts[0].value) {
      return true;
    }
    this.error("Process input, get, let suchthat can only have \"precise\" as option.", opts[0].name);
    return false;
  }

  /**
   * Binds the variables of a let ... suchthat.
   *
   * @param {Array} vars The declarations.
   * @param {Scope} scope The environment.
   * @return {Object} The extended environment.
   */
  filterVars(vars: any[], scope: Scope) {
    let s2 = scope;
    for (const v of vars) {
      if (s2.has(v.name.name)) {
        this.warn("identifier " + v.name.name + " rebound", v.name);
      }
      const ty = this.getType(v.type);
      s2 = s2.with(v.name.name, this.newSymbol("var", v.name.name, v.name, { type: ty, local: true }));
    }
    return s2;
  }

  /**
   * Checks the condition of a let ... suchthat (check_fact).
   *
   * @param {Object} t The condition.
   * @param {Scope} scope The environment with the bound variables.
   */
  checkFact(t: any, scope: Scope) {
    switch (t.kind) {
      case "Ident":
        this.getPred(t.name, t, [], scope);
        return;

      case "Int":
        this.getPred("0", t, [], scope);
        return;

      case "Tuple":
        this.error("tuples not allowed here", t);
        return;

      case "TNew":
      case "TIf":
      case "TLet":
      case "TLetFilter":
      case "TEvent":
      case "TInsert":
      case "TGet":
        this.error("new, if, let allowed in terms, but not at this position in conditions", t);
        return;

      case "BinOp":
        if (t.op === "=") {
          const a = this.checkPTerm(t.left, scope);
          const b = this.checkPTerm(t.right, scope);
          if (!PvChecker.sameType(a, b)) {
            this.error("the two arguments of an equality test should have the same type", t);
          }
          return;
        }
        break;

      case "App": {
        const tys = this.rtl(t.args, a => this.checkPTerm(a, scope));
        this.getPred(t.fn.name, t.fn, tys, scope);
        return;
      }

      default:
        break;
    }
    const op = this.operatorOf(t);
    if (!op) {
      this.error("a predicate application is expected here", t);
      return;
    }
    const tys = this.rtl(op.args, a => this.checkPTerm(a, scope));
    this.getPred(op.display || op.name, op.node, tys, scope);
  }

  /**
   * Checks that the variables of a let ... suchthat only occur under
   * constructors in its fact.
   *
   * @param {Object} t The fact.
   * @param {Array} vars The declarations of the bound variables.
   * @param {Scope} scope The environment with those variables.
   */
  checkFilterVarsUnderConstructors(t: any, vars: any[], scope: Scope) {
    const syms = new Set(vars.map(v => scope.get(v.name.name)).filter(Boolean));
    const mentions = n => {
      let found = false;
      Ast.walk(n, x => {
        if (x.kind === "Ident" && syms.has(scope.get(x.name))) {
          found = true;
        }
      });
      return found;
    };
    let bad = false;
    const visit = u => {
      if (bad || !u || typeof u !== "object") {
        return;
      }
      if (u.kind === "Ident" || u.kind === "Int") {
        return;
      }
      if (u.kind === "Tuple") {
        u.items.forEach(visit);
        return;
      }
      if (u.kind === "App") {
        const e = scope.get(u.fn.name);
        if (e && e.kind === "fun" && e.cat !== "destr") {
          u.args.forEach(visit);
          return;
        }
        if (e && e.kind === "name") {
          return;
        }
      }
      if (u.kind === "Plus") {
        visit(u.term);
        return;
      }
      if (mentions(u)) {
        bad = true;
      }
    };
    const args = t.kind === "App" ? t.args : t.kind === "BinOp" && t.op === "=" ? [t.left, t.right] : [];
    args.forEach(visit);
    if (bad) {
      this.error("Variables <vars> bound by \"let <vars> suchthat <fact>\" should only occur under constructors in <fact>", MacroExpander.extentOf(t));
    }
  }

  // Patterns (check_ep)

  /**
   * Checks the patterns of a get against the columns of its table.
   *
   * @param {Object} tableId The table identifier.
   * @param {Array} patterns The patterns.
   * @param {Scope} scope The environment.
   * @return {Object|null} The extended environment, or null when the table is
   *   unusable.
   */
  getPatterns(tableId: any, patterns: any[], scope: Scope) {
    const e = scope.get(tableId.name);
    if (!e) {
      this.error("table " + tableId.name + " not defined", tableId);
      return null;
    }
    this.ref(e, tableId);
    if (e.kind !== "table") {
      this.error(tableId.name + " should be a table", tableId);
      return null;
    }
    if (e.args.length !== patterns.length) {
      this.error("Table " + tableId.name + " expects " + e.args.length + " argument(s) but is here given " + patterns.length + " argument(s)", tableId);
      return null;
    }
    let s2 = scope;
    patterns.forEach((p, i) => {
      s2 = this.checkPattern(p, scope, e.args[i], s2, tableId);
    });
    return s2;
  }

  /**
   * Checks a pattern (check_ep) and bind its variables.
   *
   * @param {Object} p The pattern.
   * @param {Object} env The environment terms of "=M" are checked in (the one
   *   before the pattern).
   * @param {Object} expected The expected type, or null when unknown.
   * @param {Object} acc The environment with the variables bound so far by
   *   the same pattern.
   * @param {Object} ext The node ProVerif reports some errors at (null when
   *   it reports none).
   * @return {Object} The environment extended with the variables of the
   *   pattern.
   */
  checkPattern(p: any, env: any, expected: any, acc: any, ext: any) {
    const S = PvChecker;
    const known = expected !== null && expected !== undefined;
    switch (p.kind) {
      case "PVar": {
        let ty;
        if (!p.type && !known) {
          this.error("variable " + p.name.name + " should be declared with a type", p.name);
          ty = S.UNKNOWN;
        } else if (p.type && !known) {
          ty = this.getType(p.type);
        } else if (!p.type) {
          ty = expected;
        } else {
          ty = this.getType(p.type);
          if (!S.sameType(ty, expected)) {
            this.error("variable " + p.name.name + " is declared of type " + p.type.name + " but should be of type " + expected, p.type);
          }
          ty = expected === S.UNKNOWN ? ty : expected;
        }
        this.setType(p, ty);
        if (acc.has(p.name.name)) {
          this.warn("identifier " + p.name.name + " rebound", p.name);
        }
        return acc.with(p.name.name, this.newSymbol("var", p.name.name, p.name, { type: ty, local: true }));
      }

      case "PAny": {
        let ty;
        if (!p.type && !known) {
          this.error("the any term pattern '_' should be declared with a type", p);
          ty = S.UNKNOWN;
        } else if (p.type && !known) {
          ty = this.getType(p.type);
        } else if (!p.type) {
          ty = expected;
        } else {
          ty = this.getType(p.type);
          if (!S.sameType(ty, expected)) {
            this.error("the any term pattern '_' is declared of type " + p.type.name + " but should be of type " + expected, p.type);
          }
        }
        this.setType(p, ty);
        return acc;
      }

      case "PTuple": {
        if (known && !S.sameType(expected, "bitstring")) {
          this.error("pattern is of type bitstring but should be of type " + expected, ext || p, { global: !ext });
        }
        let s = acc;
        for (const it of p.items) {
          s = this.checkPattern(it, env, null, s, ext);
        }
        this.setType(p, "bitstring");
        return s;
      }

      case "PEq": {
        const ty = this.checkPTerm(p.term, env);
        if (known && !S.sameType(ty, expected)) {
          this.error("pattern is of type " + ty + " but should be of type " + expected, MacroExpander.extentOf(p.term));
        }
        this.setType(p, ty);
        return acc;
      }

      case "PChoice": {
        if (!this.allowDiffPatterns) {
          this.error("diff or choice is allowed in patterns only when the setting allowDiffPatterns is true", p);
          return acc;
        }
        let t2 = expected;
        if (p.type) {
          const ty = this.getType(p.type);
          if (known && !S.sameType(ty, expected)) {
            this.error("choice patterns is declared of type " + p.type.name + " but should be of type " + expected, p.type);
          }
          if (!known) {
            t2 = ty;
          }
        }
        let s = this.checkPattern(p.left, env, t2, acc, ext);
        s = this.checkPattern(p.right, env, t2, s, ext);
        if (p.left.kind === "PChoice" || p.right.kind === "PChoice") {
          this.error("nested diff or choice patterns are forbidden", p);
        }
        const a = this.types.get(p.left);
        const b = this.types.get(p.right);
        if (a && b && !S.sameType(a, b)) {
          this.error("the two terms of a diff or choice pattern should have the same type", p);
        }
        this.hasChoice = true;
        this.setType(p, a || t2 || S.UNKNOWN);
        return s;
      }

      case "PInt":
      case "PPlus":
        return this.checkDataPattern(p.kind === "PInt" ? "0" : "+", p, p.kind === "PInt" ? [] : [p.pattern], env, expected, acc, ext, p);

      case "PApp":
        return this.checkDataPattern(p.fn.name, p.fn, p.args, env, expected, acc, ext, p);

      default:
        this.error("unexpected pattern " + p.kind, p);
        return acc;
    }
  }

  /**
   * Checks a pattern built with a data constructor (PPatFunApp, also used for
   * integers).
   *
   * @param {string} name The constructor.
   * @param {Object} fnNode Where to report.
   * @param {Array} args The sub-patterns.
   * @param {Object} env See checkPattern.
   * @param {Object} expected See checkPattern.
   * @param {Object} acc See checkPattern.
   * @param {Object} ext See checkPattern.
   * @param {Object} p The pattern node.
   * @return {Object} The extended environment.
   */
  checkDataPattern(name: string, fnNode: any, args: any[], env: any, expected: any, acc: any, ext: any, p: any) {
    const S = PvChecker;
    const e = env.get(name);
    if (!e) {
      this.error("function " + name + " not defined", fnNode);
      return acc;
    }
    this.ref(e, fnNode);
    if (e.kind !== "fun") {
      this.error("only functions can be applied, not " + name, fnNode);
      return acc;
    }
    if (expected !== null && expected !== undefined && !S.sameType(expected, e.ret)) {
      this.error("pattern is of type " + e.ret + " but should be of type " + expected, fnNode);
    }
    if (e.args.length !== args.length) {
      this.error("Function " + name + " expects " + e.args.length + " argument(s) but is here given " + args.length + " argument(s)", fnNode);
      return acc;
    }
    let s = acc;
    args.forEach((a, i) => {
      s = this.checkPattern(a, env, e.args[i], s, ext);
    });
    if (e.cat !== "data") {
      this.error("only data functions are allowed in patterns, not " + name, fnNode);
    }
    this.setType(p, e.ret);
    return s;
  }

  // Processes (check_process)

  /**
   * Checks a main process (process P, or one side of equivalence P Q).
   *
   * @param {Object} p The process.
   */
  checkMainProcess(p: any) {
    this.inExpansion = null;
    this.checkProcess(p, this.global, 0);
  }

  /**
   * Checks a process.
   *
   * @param {Object} p The process.
   * @param {Scope} scope The environment.
   * @param {number} phase The current phase.
   */
  checkProcess(p: any, scope: Scope, phase: number) {
    const S = PvChecker;
    switch (p.kind) {
      case "Nil":
        return;

      case "Paren":
      case "ProgBegin":
        this.checkProcess(p.body, scope, phase);
        return;

      // OCaml evaluates Par(check p1, check p2) right to left
      case "Par":
        this.checkProcess(p.right, scope, phase);
        this.checkProcess(p.left, scope, phase);
        return;

      case "Repl":
        this.replDepth++;
        this.checkProcess(p.body, scope, phase);
        this.replDepth--;
        return;

      case "If": {
        const c = this.checkPTerm(p.cond, scope);
        this.checkProcess(p.then, scope, phase);
        if (p.else) {
          this.checkProcess(p.else, scope, phase);
        }
        if (!S.sameType(c, "bool")) {
          this.error("The condition on the test should be of type boolean", MacroExpander.extentOf(p.cond));
        }
        return;
      }

      case "Call":
        this.checkCall(p, scope, phase);
        return;

      case "New": {
        const { scope: s2 } = this.bindName(p, scope, false);
        this.checkProcess(p.next, s2, phase);
        this.restrArgs(p.newArgs, scope);
        return;
      }

      case "In": {
        this.preciseOption(p.options);
        const ct = this.checkPTerm(p.chan, scope);
        if (!S.sameType(ct, "channel")) {
          this.error("this term has type " + ct + " but should have type channel", MacroExpander.extentOf(p.chan));
        }
        const s2 = this.checkPattern(p.pattern, scope, null, scope, null);
        if (this.currentProc) {
          this.currentProc.ins.push(p);
        }
        this.checkProcess(p.next, s2, phase);
        return;
      }

      case "Out": {
        const ct = this.checkPTerm(p.chan, scope);
        if (!S.sameType(ct, "channel")) {
          this.error("this term has type " + ct + " but should have type channel", MacroExpander.extentOf(p.chan));
        }
        this.checkPTerm(p.msg, scope);
        if (this.currentProc) {
          this.currentProc.outs.push(p);
        }
        this.checkProcess(p.next, scope, phase);
        return;
      }

      case "Let": {
        const vt = this.checkPTerm(p.value, scope);
        const s2 = this.checkPattern(p.pattern, scope, vt, scope, null);
        this.checkProcess(p.then, s2, phase);
        if (p.else) {
          this.checkProcess(p.else, scope, phase);
        }
        return;
      }

      case "LetFilter": {
        this.preciseOption(p.options);
        const s2 = this.filterVars(p.vars, scope);
        this.checkFact(p.cond, s2);
        this.checkProcess(p.then, s2, phase);
        if (p.else) {
          this.checkProcess(p.else, s2, phase);
        }
        this.checkFilterVarsUnderConstructors(p.cond, p.vars, s2);
        this.predUses.push(p);
        return;
      }

      case "Event": {
        const tys = this.rtl(p.args || [], a => this.checkPTerm(a, scope));
        this.restrArgs(p.newArgs, scope);
        if (this.currentProc) {
          this.currentProc.events.push(p);
        }
        this.checkProcess(p.next, scope, phase);
        const e = this.getEvent(p.name, tys, scope);
        if (e) {
          this.useEvent(e.name, "process");
        }
        return;
      }

      case "Insert": {
        const tys = this.rtl(p.args, a => this.checkPTerm(a, scope));
        this.getTable(p.table, tys, scope);
        this.checkProcess(p.next, scope, phase);
        return;
      }

      case "Get": {
        this.preciseOption(p.options);
        const s2 = this.getPatterns(p.table, p.patterns, scope);
        if (s2 === null) {
          return;
        }
        this.checkProcess(p.then, s2, phase);
        if (p.else) {
          this.checkProcess(p.else, scope, phase);
        }
        if (p.cond) {
          const c = this.checkPTerm(p.cond, s2);
          if (!this.okGetCond(p.cond)) {
            this.error("new, insert, event, and let x1..xn suchthat with n>0 are not allowed in conditions of get", MacroExpander.extentOf(p.cond));
          }
          if (!S.sameType(c, "bool")) {
            this.error("this term has type " + c + " but should have type bool", MacroExpander.extentOf(p.cond));
          }
        }
        return;
      }

      case "Phase": {
        if (phase >= p.n) {
          this.error("phases should be in increasing order", p);
        }
        // the phases of a macro count only where it is called (get_max_used_phase of the expanded process)
        if (this.currentProc) {
          this.currentProc.minPhase = Math.min(this.currentProc.minPhase, p.n);
          this.currentProc.maxPhase = Math.max(this.currentProc.maxPhase, p.n);
        } else {
          this.mainMaxPhase = Math.max(this.mainMaxPhase, p.n);
        }
        this.checkProcess(p.next, scope, p.n);
        return;
      }

      case "Sync":
        this.hasBarrier = true;
        this.checkProcess(p.next, scope, phase);
        return;

      default:
        this.error("unknown process " + p.kind, p);
    }
  }

  /**
   * Checks a process call (PLetDef).
   *
   * @param {Object} p The Call node.
   * @param {Scope} scope The environment.
   * @param {number} phase The current phase.
   */
  checkCall(p: any, scope: Scope, phase: number) {
    const S = PvChecker;
    const tys = this.rtl(p.args || [], a => this.checkPTerm(a, scope));
    const e = scope.get(p.name.name);
    if (!e) {
      this.error("process " + p.name.name + " not defined", p.name);
      return;
    }
    this.ref(e, p.name);
    if (e.kind !== "process") {
      this.error(p.name.name + " should be a process", p.name);
      return;
    }
    if (!S.sameTypes(e.params, tys)) {
      this.error("process " + p.name.name + " expects " + S.argsToString(e.params) + " but is here given " + S.argsToString(tys), p.name);
      return;
    }
    for (const pi of e.paramInfo || []) {
      if (pi.mayFail && this.globalRefIds.has(pi.name)) {
        this.error("This process has a parameter " + pi.name + " of type ... or fail; this argument cannot be used in query secret or in public_vars", p.name);
      }
    }
    const minPhase = e.info ? e.info.minPhase : Infinity;
    if (minPhase !== Infinity && minPhase <= phase) {
      this.error("process " + p.name.name + " called in phase " + phase + " and uses phase " + minPhase + ": phases should be in increasing order", p.name);
    }
    if (this.currentProc) {
      this.currentProc.calls.push(p.name.name);
      if (e.info) {
        this.currentProc.minPhase = Math.min(this.currentProc.minPhase, e.info.minPhase);
        this.currentProc.maxPhase = Math.max(this.currentProc.maxPhase, e.info.maxPhase);
      }
    } else if (e.info) {
      this.mainMaxPhase = Math.max(this.mainMaxPhase, e.info.maxPhase);
    }
  }

  /**
   * Remembers a name bound by new in a process (for queries "new n").
   *
   * @param {string} sym The name symbol.
   */
  recordBound(sym: any) {
    if (!this.boundNames.has(sym.name)) {
      this.boundNames.set(sym.name, []);
    }
    this.boundNames.get(sym.name).push(sym);
  }

  /**
   * Counts the uses of an event.
   *
   * @param {string} name The event.
   * @param {Object} where 'process' or 'query'.
   */
  useEvent(name: string, where: any) {
    const u = this.eventUses.get(name) || { process: 0, query: 0 };
    u[where]++;
    this.eventUses.set(name, u);
  }

  // Whole-model checks

  /**
   * Gives a location for errors that ProVerif reports without one.
   *
   * @return {Object} The extent of the "process" or "equivalence" keyword.
   */
  goalAnchor() {
    const prog = this.program;
    if (prog.equivalence) {
      return { start: prog.processStart, end: prog.processStart + 11 };
    }
    if (prog.process) {
      return { start: prog.processStart, end: prog.processStart + 7 };
    }
    return { start: 0, end: 0 };
  }

  /**
   * Applies the checks of parse_file after the processes: incompatible goals.
   */
  goalCompatibilityChecks() {
    const prog = this.program;
    const realQueries = this.goalDecls.filter(q => ["query", "noninterf", "weaksecret"].includes(q.kind));
    const anchor = this.goalAnchor();
    if (prog.equivalence) {
      if (this.keyCompromise) {
        this.error("Key compromise is incompatible with equivalence", anchor, { global: true });
      }
      if (this.hasChoice) {
        this.error("Equivalence is incompatible with choice", anchor, { code: "incompatible-queries", global: true });
      } else if (realQueries.length) {
        this.error("Queries are incompatible with equivalence", realQueries[0].decl, { code: "incompatible-queries", global: true, related: realQueries.map(q => q.decl) });
      }
    } else if (this.hasChoice && realQueries.length) {
      this.error("Queries are incompatible with choice", realQueries[0].decl, { code: "incompatible-queries", global: true, related: realQueries.map(q => q.decl) });
    }
  }

  /**
   * Applies the checks that ProVerif makes when it translates the model to
   * clauses.
   */
  translationChecks() {
    const anchor = this.goalAnchor();
    const prog = this.program;
    if (!prog.process && !prog.equivalence) {
      return;
    }
    if (prog.equivalence) {
      if (this.hasBarrier) {
        this.error("When showing equivalence of two processes, the processes cannot contain sync", anchor, { global: true });
      }
      const restriction = this.goalDecls.find(q => q.kind === "restriction");
      if (restriction) {
        this.error("Restrictions are not allowed when ProVerif proves the equivalence of two processes", restriction.decl, { global: true });
      }
    }
    if (this.hasChoice && this.keyCompromise) {
      this.error("Key compromise is incompatible with choice", anchor, { global: true });
    }
    if (this.hasBarrier && this.keyCompromise) {
      this.error("Key compromise is incompatible with sync", anchor, { global: true });
    }
    // pi_max_used_phase includes the phases of the goals
    if (this.hasBarrier && (this.queryChecker.maxPhase || 0) > 0) {
      this.error("Phase is incompatible with sync", anchor, { global: true });
    }
    if (this.predUses.length && (this.hasChoice || prog.equivalence)) {
      this.error("Predicates are currently incompatible with proofs of equivalences.", this.predUses[0], { global: true });
    }
    const ni = this.goalDecls.find(q => q.kind === "noninterf");
    if (ni && this.predUses.length) {
      this.error("Predicates are currently incompatible with non-interference.", this.predUses[0], { global: true });
    }
    if (this.keyCompromise && this.mainMaxPhase > 0) {
      this.error("Phases are incompatible with key compromise.\nKey compromise is itself already a phase scenario", anchor, { global: true });
    }
  }

  /**
   * Adds hints that ProVerif does not give but that help modelling.
   */
  lints() {
    for (const [name, u] of this.eventUses) {
      if (u.query && !u.process) {
        const e = this.global.get(name);
        this.diags.push({ severity: "warning", message: "event " + name + " is used in a goal but never executed by the processes", start: e && e.def ? e.def.start : 0, end: e && e.def ? e.def.end : 0, seq: this.diags.length, code: "event-never-executed", lint: true });
      }
    }
    if (!this.program.process && !this.program.equivalence) {
      return;
    }
    for (const sym of this.symbols.values()) {
      if (sym.builtin || !sym.def || sym.refs > 0) {
        continue;
      }
      if (sym.kind === "process") {
        this.diags.push({ severity: "info", message: "process " + sym.name + " is never used", start: sym.def.start, end: sym.def.end, seq: this.diags.length, code: "unused", lint: true });
      }
    }
  }

  // Results helpers

  /**
   * Finds the symbol occurrence at an offset.
   *
   * @param {Object} result A check result.
   * @param {number} offset The offset.
   * @return {Object} {occurrence, symbol} or null.
   */
  static symbolAt(result: any, offset: number) {
    for (const o of result.occurrences) {
      if (o.start <= offset && offset <= o.end) {
        return { occurrence: o, symbol: result.symbols.get(o.sym) };
      }
    }
    return null;
  }

  /**
   * Lists the occurrences (definition and references) of a symbol.
   *
   * @param {Object} result A check result.
   * @param {string} symId The symbol id.
   * @return {Array} The occurrences.
   */
  static occurrencesOf(result: any, symId: string) {
    return result.occurrences.filter(o => o.sym === symId);
  }
}
// ----------------------------------------------------------------
