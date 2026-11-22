/**
 * What Studio Core needs to know about ProVerif and PieStudio: the names,
 * the lexer of the code view and its keywords, the conventions of the Design
 * mode for the actions of ProVerif, the actions of the palette of the
 * diagram, and what the hints of a comment apply to. Loading this file
 * configures the core.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvLanguage {
  /**
   * The application, for StudioCore.configure.
   *
   * @type {Object}
   */
  static APP = {
      id: "piestudio"
    , name: "PieStudio"
    , language: "ProVerif"
    , extension: ".pv"
    , engineSource: "proverif"
  };

  /**
   * The conventions of ProVerif, added to those of the core: its actions,
   * the structure of processes, diff, fail and the rules of destructors,
   * and the colours of the attacker. The names of the parts and the titles
   * of the groups are translated where they show.
   *
   * @type {Object}
   */
  static CONVENTIONS = {
      DEFAULTS: {
          // new: "{#1} \\overset{\\scriptstyle\\;\\$}{\\leftarrow} {#2}"
          new: "\\nu {#1}: {#2}"
        , let: "{#1} \\leftarrow {#2}"
        , letFilter: "\\mathsf{choose}\\ {#1}\\ \\mathsf{s.t.}\\ {#2}"
        , in: "\\mathsf{{#1}} \\left({#2}\\right)"
        , out: "\\overline{\\mathsf{{#1}}} \\langle {#2} \\rangle"
        , event: "{#1}"
        , insert: "\\mathsf{insert}\\ {#1}"
        , get: "\\mathsf{get}\\ {#1}"
        , getSuchthat: "\\mathsf{get}\\ {#1}\\ \\mathsf{s.t.}\\ {#2}"
        , if: "\\mathsf{if}\\ {#1}"
        , phase: "\\mathsf{phase}\\ {#1}"
        , sync: "\\mathsf{sync}\\ {#1}"
        , call: "{#1}"
        , nil: "0"
        , yield: "\\mathsf{yield}"
        , repl: "!"
        , par: "\\mid"
        , choice: "\\mathcal{D}[{#1}, {#2}]" // D for an informal call to a distinguisher in observational equivalence
        , fail: "\\mathsf{fail}"
        , reduces: "{#1} \\rightarrow {#2}"
        , attackerActiveColor: "#c62828"
        , attackerPassiveColor: "#e8870b"
        
          // The builtin types of ProVerif
        , "type:bitstring": "\\{0,1\\}^*"
        , "type:bool": "\\mathbb{B}"
        , "type:nat": "\\mathbb{N}"
        , "type:channel": "\\mathcal{C}" // this is my way
      }
    , FIELDS: {
        new: [I18n.mark("name"), I18n.mark("type")], let: [I18n.mark("pattern"), I18n.mark("value")], letFilter: [I18n.mark("variables"), I18n.mark("condition")],
        in: [I18n.mark("channel"), I18n.mark("pattern")], out: [I18n.mark("channel"), I18n.mark("message")], event: [I18n.mark("event")], insert: [I18n.mark("row")],
        get: [I18n.mark("row")], getSuchthat: [I18n.mark("row"), I18n.mark("condition")], if: [I18n.mark("condition")], phase: [I18n.mark("number")],
        sync: [I18n.mark("number")], call: [I18n.mark("call")], reduces: [I18n.mark("left"), I18n.mark("right")]
      }
    , GROUPS: [
          { title: I18n.mark("Actions"), keys: ["new", "let", "letFilter", "in", "out", "event", "insert", "get", "getSuchthat", "if", "phase", "sync", "call", "nil", "yield", "repl", "par"] }
        , { title: I18n.mark("Terms"), keys: ["choice", "fail", "reduces"] }
        , { title: I18n.mark("Builtin types"), keys: ["type:bitstring", "type:bool", "type:nat", "type:channel"] }
        , { title: I18n.mark("Colours"), keys: ["attackerActiveColor", "attackerPassiveColor"] }
      ]
  };

  /**
   * The actions of the palette of the diagram: the kind of node they
   * create, their label (a keyword of ProVerif, which stays in English),
   * their icon and what they do (translated where it shows).
   *
   * @type {Array<Object>}
   */
  static PALETTE = [
      { kind: "New", label: "new", icon: "fa-dice", title: I18n.mark("A fresh name: new k: key, or k <-R key as in CryptoVerif") }
    , { kind: "Let", label: "let", icon: "fa-equals", title: I18n.mark("Compute or match: let x = M in, or x <- M; as in CryptoVerif") }
    , { kind: "Out", label: "out", icon: "fa-arrow-right-from-bracket", title: I18n.mark("Send a message: out(c, M)") }
    , { kind: "In", label: "in", icon: "fa-arrow-right-to-bracket", title: I18n.mark("Receive a message: in(c, x: T)") }
    , { kind: "If", label: "if", icon: "fa-code-branch", title: I18n.mark("A test: if M then ... else ...") }
    , { kind: "Event", label: "event", icon: "fa-flag", title: I18n.mark("An event, for correspondence queries") }
    , { kind: "Insert", label: "insert", icon: "fa-table-cells", title: I18n.mark("Insert a row into a table") }
    , { kind: "Get", label: "get", icon: "fa-magnifying-glass", title: I18n.mark("Look up a row of a table") }
    , { kind: "Call", label: "call", icon: "fa-play", title: I18n.mark("Run a process macro: P(args)") }
    , { kind: "Phase", label: "phase", icon: "fa-clock", title: I18n.mark("Start a new phase") }
  ];

  /**
   * The names of the kinds of symbols, in English: kindName translates
   * them.
   *
   * @type {Object<string, string>}
   */
  static KINDS: Record<string, string> = {
      type: I18n.mark("type")
    , name: I18n.mark("name")
    , fun: I18n.mark("function")
    , event: I18n.mark("event")
    , table: I18n.mark("table")
    , pred: I18n.mark("predicate")
    , process: I18n.mark("process")
    , letfun: I18n.mark("function (letfun)")
    , var: I18n.mark("variable")
    , letEq: I18n.mark("variable")
    , reserved: I18n.mark("keyword")
  };

  /**
   * The icon of each kind of block.
   *
   * @type {Object<string, string>}
   */
  static ICONS: Record<string, string> = {
      New: "fa-dice"
    , In: "fa-arrow-right-to-bracket"
    , Out: "fa-arrow-right-from-bracket"
    , Let: "fa-equals"
    , LetFilter: "fa-filter"
    , If: "fa-code-branch"
    , Event: "fa-flag"
    , Insert: "fa-table-cells"
    , Get: "fa-magnifying-glass"
    , Call: "fa-play"
    , Phase: "fa-clock"
    , Sync: "fa-arrows-left-right-to-line"
    , Repl: "fa-repeat"
    , Par: "fa-grip-lines-vertical"
    , Nil: "fa-circle-stop"
    , Branch: "fa-share"
  };

  /**
   * The kinds of blocks that can be moved: the sequential actions.
   *
   * @type {Set<string>}
   */
  static MOVABLE: Set<string> = new Set(["New", "In", "Out", "Event", "Insert", "Phase", "Sync", "Let", "LetFilter", "Get"]);

  /**
   * Names a kind of symbol in the language of the interface.
   *
   * @param {string} kind The kind: type, name, fun...
   * @return {string} Its name: "function" for fun, in English.
   */
  static kindName(kind: string): string {
    return Object.prototype.hasOwnProperty.call(PvLanguage.KINDS, kind) ? I18n.t(PvLanguage.KINDS[kind]) : kind;
  }

  /**
   * Splits code into tokens, for the code view.
   *
   * @param {string} text The code.
   * @return {Object} The tokens and the comments, as PvLexer gives them.
   */
  static tokenize(text: string) {
    return PvLexer.tokenize(text, { allowTilde: true });
  }

  /**
   * Gives the class of a token that is not a symbol of the model, for the
   * code view.
   *
   * @param {Object} tok The token.
   * @param {string} text The code.
   * @return {string} "kw", "kw2", "num", "str", "op", or "" for an
   *   identifier that is not a keyword.
   */
  static tokenClass(tok: any, text: string): string {
    if (tok.type === "IDENT") {
      return ["attacker", "mess", "true", "false"].includes(tok.value) ? "kw2" : "";
    }
    if (tok.type === "INT" || tok.type === "FLOAT") {
      return "num";
    }
    if (tok.type === "STRING") {
      return "str";
    }
    if (PvToken.KEYWORDS.has(text.slice(tok.start, tok.end)) || tok.type === "INJEVENT") {
      return "kw";
    }
    return "op";
  }

  /**
   * Maps the start of each leading comment of a model to what it describes,
   * for the hints of the notation.
   *
   * @param {Analysis} analysis The Analysis.
   * @return {Object} Map from comment start to {kind: 'decl' | 'action',
   *   node, index, path}.
   */
  static hintOwners(analysis: Analysis) {
    const map = new Map();
    const prog = analysis.program;
    if (!prog) {
      return map;
    }
    prog.decls.forEach((d, i) => {
      for (const c of d.leadingComments || []) {
        map.set(c.start, { kind: "decl", node: d, index: i });
      }
      if (d.kind === "ProcessDecl") {
        PvLanguage.processOwners(d.body, ["decls", i, "body"], map);
      }
    });
    if (prog.process) {
      PvLanguage.processOwners(prog.process, ["process"], map);
    }
    if (prog.equivalence) {
      prog.equivalence.forEach((p, i) => PvLanguage.processOwners(p, ["equivalence", i], map));
    }
    return map;
  }

  /**
   * Records the comments that precede process actions.
   *
   * @param {Object} p A process.
   * @param {string} path Its path.
   * @param {Function} map The map to fill.
   */
  static processOwners(p: any, path: any[], map: any) {
    if (!p || typeof p !== "object") {
      return;
    }
    for (const c of p.leadingComments || []) {
      map.set(c.start, { kind: "action", node: p, path });
    }
    for (const k of ["next", "then", "else", "left", "right", "body"]) {
      if (p[k] && typeof p[k] === "object" && p[k].kind) {
        PvLanguage.processOwners(p[k], [...path, k], map);
      }
    }
  }

  /**
   * Tells whether a process action sends or receives a message, for the
   * hint @inout.
   *
   * @param {Object} node The action.
   * @return {string|null} "out", "in", or null for another action.
   */
  static messageSide(node: any): string | null {
    if (node && node.kind === "Out") {
      return "out";
    }
    return node && node.kind === "In" ? "in" : null;
  }

  /**
   * Finds the symbol that a hint before a declaration applies to.
   *
   * @param {Object} o The declaration after the comment, {kind: "decl",
   *   node, index}.
   * @return {Object} {name, kind, index} or null; kind is the kind of the
   *   declaration.
   */
  static hintTarget(o: any) {
    const d = o.node;
    switch (d.kind) {
      case "TypeDecl":
      case "FunDecl":
      case "EventDecl":
      case "TableDecl":
      case "PredDecl":
      case "LetFunDecl":
      case "ProcessDecl":
        return { name: d.name.name, kind: d.kind, index: o.index };

      case "ConstDecl":
      case "FreeDecl":
      case "ChannelDecl":
        return { name: d.names[0].name, names: d.names.map(n => n.name), kind: d.kind, index: o.index };

      case "ReducDecl": {
        const t = d.rules[0] && d.rules[0].term;
        if (t && t.kind === "BinOp" && t.op === "=" && t.left.kind === "App") {
          return { name: t.left.fn.name, kind: "ReducDecl", index: o.index };
        }
        return null;
      }

      case "EquationDecl": {
        // the user writes the notation of fst before "equation ...; fst(concat(a, b)) = a."
        const t = d.eqs[0] && d.eqs[0].term;
        const lhs = t && t.kind === "BinOp" && (t.op === "=" || t.op === "<>") ? t.left : t;
        if (lhs && lhs.kind === "App") {
          return { name: lhs.fn.name, kind: "EquationDecl", index: o.index };
        }
        return null;
      }

      case "SetDecl":
        return { name: d.name.name, kind: "SetDecl", index: o.index };

      case "QueryDecl":
      case "LemmaDecl":
      case "NonInterfDecl":
      case "WeakSecretDecl":
        return { name: null, kind: d.kind, index: o.index, node: d };

      default:
        return null;
    }
  }
}
// ----------------------------------------------------------------

StudioCore.configure({
    ...PvLanguage.APP
  , conventions: PvLanguage.CONVENTIONS
  , tokenize: PvLanguage.tokenize
  , tokenClass: PvLanguage.tokenClass
  , hintOwners: PvLanguage.hintOwners
  , hintTarget: PvLanguage.hintTarget
  , messageSide: PvLanguage.messageSide
  , explain: PvExplain.explain
});
