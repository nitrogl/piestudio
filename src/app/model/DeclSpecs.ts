/**
 * The kinds of declarations of ProVerif and their forms: fields, reading,
 * writing, checking.
 *
 * For each kind, the fields of its pop-up form, how to read them from a
 * parsed declaration (from) and how to write the ProVerif text back
 * (toSource). The modifiers (private, data, typeConverter, convergent,
 * linear, block, memberOptim...) are check boxes. Types, names, constants and
 * functions also have their LaTeX notation, kept in an @notation hint
 * in the comment before the declaration. No UI code here.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class DeclSpecs {
  /**
   * Gives the option names of a declaration.
   *
   * @param {Object} d The declaration.
   * @return {Array} The names.
   */
  static optNames(d: any) {
    return (d.options || []).map(o => o.name.name);
  }

  /**
   * Writes options.
   *
   * @param {Array} list Option names (falsy entries are skipped).
   * @return {Object} " [a, b]" or "".
   */
  static optsStr(list: any[]) {
    const l = list.filter(Boolean);
    return l.length ? " [" + l.join(", ") + "]" : "";
  }

  /**
   * Splits a comma separated list.
   *
   * @param {string} s The text.
   * @return {Object} The trimmed non-empty items.
   */
  static splitList(s: string) {
    return String(s || "").split(",").map(x => x.trim()).filter(Boolean);
  }

  /**
   * Gives the text of a node in the source, when it stands for exactly that
   * node.
   *
   * @param {Object} a The analysis.
   * @param {number} n The node.
   * @param {string} flavor The grammar of the node.
   * @return {Object} The original text, or the printed node.
   */
  static src(a: any, n: any, flavor: string = "pterm") {
    if (n && n.start >= 0 && n.end > n.start) {
      const s = a.text.slice(n.start, n.end);
      const r = PvParser.parseFragment(s, flavor);
      if (!r.errors.length && r.node && JSON.stringify(Ast.stripLocations(r.node)) === JSON.stringify(Ast.stripLocations(n))) {
        return s;
      }
    }
    return PvPrinter.term(n);
  }

  /**
   * Writes "forall vars; " or nothing.
   *
   * @param {string} vars The text of the variables.
   * @return {Object} The prefix.
   */
  static forallStr(vars: string) {
    return vars && vars.trim() ? "forall " + vars.trim() + "; " : "";
  }

  /**
   * Gives the options of a declaration other than some known ones.
   *
   * @param {Object} d The declaration.
   * @param {Object} known The known names.
   * @return {Array} The other names, comma separated.
   */
  static extraOpts(d: any, known: any) {
    return DeclSpecs.optNames(d).filter(o => !known.includes(o)).join(", ");
  }

  /**
   * Gives the rows of rewrite rules.
   *
   * @param {Object} a The analysis.
   * @param {Array} rules The rules.
   * @return {Object} [{forall, lhs, rhs}].
   */
  static ruleRows(a: any, rules: any[]) {
    return rules.map(r => ({ forall: r.forall.length ? PvPrinter.varTypes(r.forall) : "", lhs: DeclSpecs.src(a, r.lhs, "term"), rhs: DeclSpecs.src(a, r.rhs, "term") }));
  }

  // The notation hint in the leading comment

  /**
   * The hints that give the notation of a symbol.
   *
   * @type {RegExp}
   */
  static NOTATION_HINT: RegExp = /@(notation|infix|prefix|postfix)\s+('(?:[^']|'')*'|"(?:[^"]|"")*")/;

  /**
   * Reads the leading comments of a declaration and the notation hint they
   * carry.
   *
   * @param {Object} d The declaration.
   * @return {Object} {comments: [text], hint: {index, kind, value, match} |
   *   null}.
   */
  static leading(d: any) {
    const comments = (d.leadingComments || []).map(c => c.text);
    let hint = null;
    comments.forEach((text, index) => {
      if (hint) {
        return;
      }
      const m = DeclSpecs.NOTATION_HINT.exec(text);
      if (!m) {
        return;
      }
      const q = m[2][0];
      const value = m[2].slice(1, -1).split(q + q).join(q);
      hint = { index, kind: m[1], value, match: m[0] };
    });
    return { comments, hint };
  }

  /**
   * Writes the leading comments of a declaration with a new notation.
   *
   * @param {Object} v The values of the form (_comments, _hint, notationKind,
   *   notation).
   * @return {Object} The comments text to put before the declaration (with a
   *   final newline), or ''.
   */
  static leadingSource(v: any) {
    const comments = (v._comments || []).slice();
    const kind = v.notationKind || "notation";
    const tex = String(v.notation || "").trim();
    const hintText = tex ? "@" + kind + " '" + tex.replace(/'/g, "''") + "'" : "";
    const h = v._hint;
    if (h && comments[h.index] !== undefined) {
      let c = comments[h.index].replace(h.match, hintText);
      if (/^\(\*\s*\*\)$/.test(c)) {
        c = "";
      }
      comments[h.index] = c;
    } else if (hintText) {
      comments.push("(* " + hintText + " *)");
    }
    const kept = comments.filter(c => c && c.trim());
    return kept.length ? kept.join("\n") + "\n" : "";
  }

  /**
   * Gives the notation fields of a declaration.
   *
   * @param {Object} d The declaration.
   * @return {Object} {_comments, _hint, notationKind, notation}.
   */
  static notationFrom(d: any) {
    const { comments, hint } = DeclSpecs.leading(d);
    return { _comments: comments, _hint: hint, notationKind: hint ? hint.kind : "notation", notation: hint ? hint.value : "" };
  }

  // Kinds

  /**
   * The specifications, by kind (DestructorFun is "fun ... reduc"). Their
   * titles, help, labels and hints are in English: the views translate them
   * where they show.
   *
   * @type {Object}
   */
  static SPECS = {
      TypeDecl: {
        title: I18n.mark("Type"), keyword: "type", icon: "type", notation: true,
        help: I18n.mark("A type of messages. channel, bitstring, bool and nat are built in."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "key" }
          , { key: "options", label: I18n.mark("Options (for CryptoVerif)"), kind: "text", placeholder: "large, fixed" }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arity: 0 }
        ],
        defaults: () => ({ name: "", options: "", notation: "", notationKind: "notation" }),
        from: d => ({ name: d.name.name, options: DeclSpecs.optNames(d).join(", "), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "type " + v.name.trim() + DeclSpecs.optsStr(DeclSpecs.splitList(v.options)) + "."
      }
    , FreeDecl: {
        title: I18n.mark("Free name"), keyword: "free", icon: "name", notation: true,
        help: I18n.mark("Names known from the start: public channels and constants, or secrets unknown to the attacker ([private])."),
        fields: [
            { key: "names", label: I18n.mark("Names"), kind: "idents", placeholder: "c, d" }
          , { key: "type", label: I18n.mark("Type"), kind: "type", placeholder: "channel" }
          , { key: "private", label: "private", kind: "check", hint: I18n.mark("unknown to the attacker (a private channel is drawn dotted)") }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arity: 0 }
        ],
        defaults: () => ({ names: "", type: "channel", private: false, notation: "", notationKind: "notation" }),
        from: d => ({ names: d.names.map(n => n.name).join(", "), type: d.type.name, private: DeclSpecs.optNames(d).includes("private"), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "free " + DeclSpecs.splitList(v.names).join(", ") + ": " + v.type.trim() + (v.private ? " [private]" : "") + "."
      }
    , ChannelDecl: {
        title: I18n.mark("Channel"), keyword: "channel", icon: "channel",
        help: I18n.mark("Public channels (the same as free c: channel)."),
        fields: [{ key: "names", label: I18n.mark("Channels"), kind: "idents", placeholder: "c" }],
        defaults: () => ({ names: "" }),
        from: d => ({ names: d.names.map(n => n.name).join(", ") }),
        toSource: v => "channel " + DeclSpecs.splitList(v.names).join(", ") + "."
      }
    , ConstDecl: {
        title: I18n.mark("Constant"), keyword: "const", icon: "const", notation: true,
        help: I18n.mark("Public constants of a type."),
        fields: [
            { key: "names", label: I18n.mark("Constants"), kind: "idents", placeholder: "A, B" }
          , { key: "type", label: I18n.mark("Type"), kind: "type", placeholder: "host" }
          , { key: "private", label: "private", kind: "check", hint: I18n.mark("unknown to the attacker") }
          , { key: "options", label: I18n.mark("Other options"), kind: "text", placeholder: "data" }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arity: 0 }
        ],
        defaults: () => ({ names: "", type: "bitstring", private: false, options: "", notation: "", notationKind: "notation" }),
        from: d => ({ names: d.names.map(n => n.name).join(", "), type: d.type.name, private: DeclSpecs.optNames(d).includes("private"), options: DeclSpecs.extraOpts(d, ["private"]), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "const " + DeclSpecs.splitList(v.names).join(", ") + ": " + v.type.trim() + DeclSpecs.optsStr([v.private && "private", ...DeclSpecs.splitList(v.options)]) + "."
      }
    , FunDecl: {
        title: I18n.mark("Constructor"), keyword: "fun", icon: "fun", notation: true,
        help: I18n.mark("A function symbol that builds messages (encryption, signature, hash, pairing). The attacker can apply it unless it is private."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "senc" }
          , { key: "args", label: I18n.mark("Argument types"), kind: "types", placeholder: "bitstring, key" }
          , { key: "ret", label: I18n.mark("Result type"), kind: "type", placeholder: "bitstring" }
          , { key: "private", label: "private", kind: "check", hint: I18n.mark("the attacker cannot apply it") }
          , { key: "data", label: "data", kind: "check", hint: I18n.mark("the attacker can also take it apart, like a tuple") }
          , { key: "typeConverter", label: "typeConverter", kind: "check", hint: I18n.mark("the identity, changing the type") }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arityFrom: "args" }
        ],
        defaults: () => ({ name: "", args: "bitstring", ret: "bitstring", private: false, data: false, typeConverter: false, notation: "", notationKind: "notation" }),
        from: d => ({ name: d.name.name, args: d.argTypes.map(t => t.name).join(", "), ret: d.retType.name, private: DeclSpecs.optNames(d).includes("private"), data: DeclSpecs.optNames(d).includes("data"), typeConverter: DeclSpecs.optNames(d).includes("typeConverter"), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "fun " + v.name.trim() + "(" + DeclSpecs.splitList(v.args).join(", ") + "): " + v.ret.trim() + DeclSpecs.optsStr([v.data && "data", v.private && "private", v.typeConverter && "typeConverter"]) + "."
      }
    , DestructorFun: {
        title: I18n.mark("Destructor (fun ... reduc)"), keyword: "fun reduc", icon: "destructor", notation: true,
        help: I18n.mark("A function defined by rewrite rules tried in order (otherwise). It fails when no rule applies."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "sdec" }
          , { key: "args", label: I18n.mark("Argument types"), kind: "types", placeholder: "bitstring, key" }
          , { key: "ret", label: I18n.mark("Result type"), kind: "type", placeholder: "bitstring" }
          , { key: "rules", label: I18n.mark("Rewrite rules (tried in order)"), kind: "rules" }
          , { key: "private", label: "private", kind: "check", hint: I18n.mark("the attacker cannot apply it") }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arityFrom: "args" }
        ],
        defaults: () => ({ name: "", args: "bitstring, key", ret: "bitstring", rules: [{ forall: "x: bitstring, k: key", lhs: "", rhs: "x" }], private: false, notation: "", notationKind: "notation" }),
        from: (d, a) => ({ name: d.name.name, args: d.argTypes.map(t => t.name).join(", "), ret: d.retType.name, rules: DeclSpecs.ruleRows(a, d.reduc), private: DeclSpecs.optNames(d).includes("private"), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "fun " + v.name.trim() + "(" + DeclSpecs.splitList(v.args).join(", ") + "): " + v.ret.trim() + "\nreduc " + v.rules.map(r => String(DeclSpecs.forallStr(r.forall)) + r.lhs.trim() + " = " + r.rhs.trim()).join("\notherwise ") + (v.private ? " [private]" : "") + "."
      }
    , ReducDecl: {
        title: I18n.mark("Destructor (reduc)"), keyword: "reduc", icon: "destructor", notation: true,
        help: I18n.mark("Rewrite rules defining a destructor of constructors declared with fun, e.g. sdec(senc(x, k), k) = x."),
        fields: [
            { key: "rules", label: I18n.mark("Rewrite rules"), kind: "rules" }
          , { key: "private", label: "private", kind: "check", hint: I18n.mark("the attacker cannot apply it") }
          , { key: "notation", label: I18n.mark("Notation of the destructor (LaTeX)"), kind: "notation", arityFrom: "rules" }
        ],
        defaults: () => ({ rules: [{ forall: "x: bitstring, k: key", lhs: "sdec(senc(x, k), k)", rhs: "x" }], private: false, notation: "", notationKind: "notation" }),
        from: (d, a) => ({ rules: DeclSpecs.ruleRows(a, d.rules), private: DeclSpecs.optNames(d).includes("private"), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "reduc " + v.rules.map(r => String(DeclSpecs.forallStr(r.forall)) + r.lhs.trim() + " = " + r.rhs.trim()).join(";\n      ") + (v.private ? " [private]" : "") + "."
      }
    , EquationDecl: {
        title: I18n.mark("Equation"), keyword: "equation", icon: "equation", notation: true,
        help: I18n.mark("Equational theory, e.g. Diffie-Hellman exp(exp(g, x), y) = exp(exp(g, y), x). A notation here is the one of the function on the left."),
        fields: [
            { key: "rules", label: I18n.mark("Equations"), kind: "rules", eq: true }
          , { key: "convergent", label: "convergent", kind: "check", hint: I18n.mark("the equations form a convergent rewrite system") }
          , { key: "linear", label: "linear", kind: "check", hint: I18n.mark("the equations are linear") }
          , { key: "notation", label: I18n.mark("Notation of the function on the left (LaTeX)"), kind: "notation", arityFrom: "lhs" }
        ],
        defaults: () => ({ rules: [{ forall: "x: exponent, y: exponent", lhs: "exp(exp(g, x), y)", rhs: "exp(exp(g, y), x)" }], convergent: false, linear: false, notation: "", notationKind: "notation" }),
        from: (d, a) => ({
            rules: d.eqs.map(e => {
              const t = e.term;
              const isEq = t && t.kind === "BinOp" && t.op === "=";
              return { forall: e.forall.length ? PvPrinter.varTypes(e.forall) : "", lhs: isEq ? DeclSpecs.src(a, t.left, "term") : DeclSpecs.src(a, t, "term"), rhs: isEq ? DeclSpecs.src(a, t.right, "term") : "" };
            })
          , convergent: DeclSpecs.optNames(d).includes("convergent")
          , linear: DeclSpecs.optNames(d).includes("linear")
          , ...DeclSpecs.notationFrom(d)
        }),
        toSource: v => DeclSpecs.leadingSource(v) + "equation " + v.rules.map(r => String(DeclSpecs.forallStr(r.forall)) + r.lhs.trim() + (r.rhs.trim() ? " = " + r.rhs.trim() : "")).join(";\n         ") + DeclSpecs.optsStr([v.convergent && "convergent", v.linear && "linear"]) + "."
      }
    , EventDecl: {
        title: I18n.mark("Event"), keyword: "event", icon: "event", notation: true,
        help: I18n.mark("Events mark steps of the protocol; correspondence queries relate them (authentication). Drawn in green boxes."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "beginA" }
          , { key: "args", label: I18n.mark("Argument types"), kind: "types", placeholder: "host, host, nonce" }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arityFrom: "args" }
        ],
        defaults: () => ({ name: "", args: "", notation: "", notationKind: "notation" }),
        from: d => ({ name: d.name.name, args: (d.argTypes || []).map(t => t.name).join(", "), ...DeclSpecs.notationFrom(d) }),
        toSource: v => String(DeclSpecs.leadingSource(v)) + (DeclSpecs.splitList(v.args).length ? "event " + v.name.trim() + "(" + DeclSpecs.splitList(v.args).join(", ") + ")." : "event " + v.name.trim() + ".")
      }
    , TableDecl: {
        title: I18n.mark("Table"), keyword: "table", icon: "table", notation: true,
        help: I18n.mark("Tables store rows private to the honest processes (insert and get), e.g. a key directory. Drawn in purple boxes."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "keys" }
          , { key: "args", label: I18n.mark("Column types"), kind: "types", placeholder: "host, pkey" }
          , { key: "notation", label: I18n.mark("Notation (LaTeX)"), kind: "notation", arityFrom: "args" }
        ],
        defaults: () => ({ name: "", args: "", notation: "", notationKind: "notation" }),
        from: d => ({ name: d.name.name, args: d.argTypes.map(t => t.name).join(", "), ...DeclSpecs.notationFrom(d) }),
        toSource: v => DeclSpecs.leadingSource(v) + "table " + v.name.trim() + "(" + DeclSpecs.splitList(v.args).join(", ") + ")."
      }
    , PredDecl: {
        title: I18n.mark("Predicate"), keyword: "pred", icon: "pred",
        help: I18n.mark("Predicates defined by clauses, usable in let ... suchthat and in queries."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "mem" }
          , { key: "args", label: I18n.mark("Argument types"), kind: "types", placeholder: "bitstring, bitstring" }
          , { key: "block", label: "block", kind: "check", hint: I18n.mark("the predicate is not defined by clauses") }
          , { key: "memberOptim", label: "memberOptim", kind: "check", hint: I18n.mark("optimise the membership predicate (arity 2)") }
        ],
        defaults: () => ({ name: "", args: "", block: false, memberOptim: false }),
        from: d => ({ name: d.name.name, args: (d.argTypes || []).map(t => t.name).join(", "), block: DeclSpecs.optNames(d).includes("block"), memberOptim: DeclSpecs.optNames(d).includes("memberOptim") }),
        toSource: v => "pred " + v.name.trim() + (DeclSpecs.splitList(v.args).length ? "(" + DeclSpecs.splitList(v.args).join(", ") + ")" : "") + DeclSpecs.optsStr([v.block && "block", v.memberOptim && "memberOptim"]) + "."
      }
    , LetFunDecl: {
        title: I18n.mark("Term macro (letfun)"), keyword: "letfun", icon: "letfun",
        help: I18n.mark("A macro for terms, expanded where it is used."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "mac" }
          , { key: "params", label: I18n.mark("Parameters"), kind: "vars", placeholder: "x: bitstring, k: key" }
          , { key: "body", label: I18n.mark("Definition"), kind: "term", placeholder: "hash((k, x))", multiline: true }
        ],
        defaults: () => ({ name: "", params: "", body: "" }),
        from: (d, a) => ({ name: d.name.name, params: d.params ? PvPrinter.varTypes(d.params) : "", body: DeclSpecs.src(a, d.body) }),
        toSource: v => "letfun " + v.name.trim() + (v.params.trim() ? "(" + v.params.trim() + ")" : "") + " = " + v.body.trim() + "."
      }
    , ProcessDecl: {
        title: I18n.mark("Process (party)"), keyword: "let", icon: "process",
        help: I18n.mark("A process macro: one party of the protocol. Its actions are edited in the diagram."),
        fields: [
            { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "Client" }
          , { key: "params", label: I18n.mark("Parameters"), kind: "vars", placeholder: "skA: skey, pkB: pkey" }
        ],
        defaults: () => ({ name: "", params: "" }),
        from: d => ({ name: d.name.name, params: d.params ? PvPrinter.varTypes(d.params) : "" }),
        toSource: v => "let " + v.name.trim() + (v.params.trim() ? "(" + v.params.trim() + ")" : "") + " =\n  0."
      }
    , QueryDecl: {
        title: I18n.mark("Query"), keyword: "query", icon: "query",
        help: I18n.mark("Security properties to verify: secrecy attacker(s), correspondences event(e1(x)) ==> event(e2(x)), injective ones with inj-event."),
        fields: [
            { key: "vars", label: I18n.mark("Variables"), kind: "vars", placeholder: "x: host, k: key", infer: true, hint: I18n.mark("Types of the variables of the queries (Infer finds them from the events).") }
          , { key: "rows", label: I18n.mark("Queries"), kind: "queries" }
          , { key: "options", label: I18n.mark("Options"), kind: "goalOptions", placeholder: "induction, proveAll" }
        ],
        defaults: () => ({ vars: "", rows: [{ q: "" }], options: "" }),
        from: (d, a) => ({ vars: PvPrinter.varTypes(d.vars), rows: d.queries.map(q => ({ q: q.start >= 0 ? a.text.slice(q.start, q.end) : PvPrinter.query(q) })), options: DeclSpecs.optNames(d).join(", ") }),
        toSource: v => "query " + (v.vars.trim() ? v.vars.trim() + "; " : "") + v.rows.map(r => r.q.trim()).filter(Boolean).join(";\n      ") + DeclSpecs.optsStr(DeclSpecs.splitList(v.options)) + "."
      }
    , LemmaDecl: {
        title: I18n.mark("Lemma, axiom or restriction"), keyword: "lemma", icon: "lemma",
        help: I18n.mark("lemma: proved, then used to help other proofs; axiom: assumed; restriction: excludes traces."),
        fields: [
            { key: "keyword", label: I18n.mark("Kind"), kind: "select", options: ["lemma", "axiom", "restriction"] }
          , { key: "vars", label: I18n.mark("Variables"), kind: "vars", placeholder: "x: key", infer: true }
          , { key: "rows", label: I18n.mark("Statements"), kind: "queries" }
          , { key: "options", label: I18n.mark("Options"), kind: "goalOptions", placeholder: "induction, maxSubset" }
        ],
        defaults: () => ({ keyword: "lemma", vars: "", rows: [{ q: "" }], options: "" }),
        from: (d, a) => ({ keyword: d.keyword, vars: PvPrinter.varTypes(d.vars), rows: d.lemmas.map(l => ({ q: l.start >= 0 ? a.text.slice(l.start, l.end) : PvPrinter.term(l.term) })), options: DeclSpecs.optNames(d).join(", ") }),
        toSource: v => v.keyword + " " + (v.vars.trim() ? v.vars.trim() + "; " : "") + v.rows.map(r => r.q.trim()).filter(Boolean).join(";\n      ") + DeclSpecs.optsStr(DeclSpecs.splitList(v.options)) + "."
      }
    , NonInterfDecl: {
        title: I18n.mark("Strong secrecy (noninterf)"), keyword: "noninterf", icon: "noninterf",
        help: I18n.mark("The attacker cannot distinguish runs with different values of these names (optionally among a set of terms)."),
        fields: [
            { key: "vars", label: I18n.mark("Variables (for the among terms)"), kind: "vars", placeholder: "" }
          , { key: "rows", label: I18n.mark("Secrets"), kind: "items" }
        ],
        defaults: () => ({ vars: "", rows: [{ name: "", among: "" }] }),
        from: (d, a) => ({ vars: PvPrinter.varTypes(d.vars), rows: d.items.map(it => ({ name: it.name.name, among: it.among ? it.among.map(t => DeclSpecs.src(a, t)).join(", ") : "" })) }),
        toSource: v => "noninterf " + (v.vars.trim() ? v.vars.trim() + "; " : "") + v.rows.filter(r => r.name.trim()).map(r => r.name.trim() + (r.among.trim() ? " among (" + r.among.trim() + ")" : "")).join(", ") + "."
      }
    , WeakSecretDecl: {
        title: I18n.mark("Weak secret"), keyword: "weaksecret", icon: "weaksecret",
        help: I18n.mark("Resistance to off-line guessing attacks on a low-entropy secret (a password)."),
        fields: [{ key: "name", label: I18n.mark("Secret"), kind: "ident", list: "names", placeholder: "pw" }],
        defaults: () => ({ name: "" }),
        from: d => ({ name: d.name.name }),
        toSource: v => "weaksecret " + v.name.trim() + "."
      }
    , SetDecl: {
        title: I18n.mark("Setting"), keyword: "set", icon: "setting",
        help: I18n.mark("ProVerif settings, e.g. set attacker = passive. A setting at its default value is not written."),
        fields: [{ key: "name", label: I18n.mark("Setting"), kind: "setting" }, { key: "value", label: I18n.mark("Value"), kind: "settingValue" }],
        defaults: () => ({ name: "traceDisplay", value: "long" }),
        from: d => ({ name: d.name.name, value: d.value.kind === "string" ? JSON.stringify(d.value.value) : String(d.value.value) }),
        toSource: v => "set " + v.name.trim() + " = " + v.value.trim() + "."
      }
  };

  /**
   * Kinds that are edited only as source text.
   *
   * @type {Object}
   */
  static SOURCE_ONLY = {
      NotDecl: { title: I18n.mark("Secrecy assumption (not)"), keyword: "not", icon: "not", help: I18n.mark("Facts assumed unreachable, e.g. not attacker(new k). ProVerif checks them."), template: "not attacker(new k)." }
    , NoUnifDecl: { title: I18n.mark("Unification hint (nounif)"), keyword: "nounif", icon: "nounif", help: I18n.mark("nounif / select / noselect guide the resolution strategy, e.g. nounif x: key; attacker(f(*x))."), template: "nounif x: bitstring; attacker(*x)." }
    , ElimTrueDecl: { title: "elimtrue", keyword: "elimtrue", icon: "clauses", help: I18n.mark("Facts always true for a predicate."), template: "elimtrue x: bitstring; p(x)." }
    , ClausesDecl: { title: I18n.mark("Clauses"), keyword: "clauses", icon: "clauses", help: I18n.mark("Horn clauses defining predicates."), template: "clauses forall x: bitstring, l: bitstring; mem(x, (x, l));\n        forall x: bitstring, y: bitstring, l: bitstring; mem(x, l) -> mem(x, (y, l))." }
    , DefineDecl: { title: I18n.mark("Macro (def)"), keyword: "def", icon: "macro", help: I18n.mark("A parameterised block of declarations, instantiated with expand."), template: "def SYMENC(t) {\n  fun enc(bitstring, t): bitstring.\n}" }
    , ExpandDecl: { title: I18n.mark("Macro expansion"), keyword: "expand", icon: "expand", help: I18n.mark("Instantiates a def macro."), template: "expand SYMENC(key)." }
    , RawDecl: { title: I18n.mark("CryptoVerif declaration"), keyword: "param", icon: "raw", help: I18n.mark("param, proba, letproba, proof, implementation: ProVerif ignores them (they are kept for CryptoVerif)."), template: "param N." }
  };

  /**
   * The kinds offered when adding a declaration, grouped as in the sidebar.
   *
   * @type {Array}
   */
  static ADD_MENU = [
      { title: I18n.mark("Types and names"), kinds: ["TypeDecl", "FreeDecl", "ConstDecl"] }
    , { title: I18n.mark("Cryptographic primitives"), kinds: ["FunDecl", "ReducDecl", "DestructorFun", "EquationDecl", "LetFunDecl"] }
    , { title: I18n.mark("Protocol"), kinds: ["EventDecl", "TableDecl", "ProcessDecl"] }
    , { title: I18n.mark("Security goals"), kinds: ["QueryDecl", "NonInterfDecl", "WeakSecretDecl", "LemmaDecl"] }
    , { title: I18n.mark("Advanced"), kinds: ["SetDecl", "PredDecl", "ClausesDecl", "NotDecl", "NoUnifDecl", "ElimTrueDecl", "DefineDecl", "ExpandDecl"] }
  ];

  /**
   * Gives the specification of a declaration.
   *
   * @param {Object} d The declaration.
   * @return {Object} The specification with its key.
   */
  static specOf(d: any) {
    if (d.kind === "FunDecl" && d.reduc) {
      return { key: "DestructorFun", ...DeclSpecs.SPECS.DestructorFun };
    }
    if (DeclSpecs.SPECS[d.kind]) {
      return { key: d.kind, ...DeclSpecs.SPECS[d.kind] };
    }
    const s = DeclSpecs.SOURCE_ONLY[d.kind];
    return s ? { key: d.kind, sourceOnly: true, ...s } : { key: d.kind, sourceOnly: true, title: d.kind, keyword: "", icon: "raw", help: "" };
  }

  /**
   * Gives the specification of a kind.
   *
   * @param {string} key The kind (or DestructorFun).
   * @return {Object|null} The specification or null.
   */
  static specByKey(key: string) {
    if (DeclSpecs.SPECS[key]) {
      return { key, ...DeclSpecs.SPECS[key] };
    }
    if (DeclSpecs.SOURCE_ONLY[key]) {
      return { key, sourceOnly: true, ...DeclSpecs.SOURCE_ONLY[key] };
    }
    return null;
  }

  /**
   * Gives the arity a notation field stands for, from the values of its form.
   *
   * @param {Object} field The field.
   * @param {Object} v The values of the form.
   * @return {number} The number of arguments.
   */
  static notationArity(field: any, v: any): number {
    if (field.arity !== undefined) {
      return field.arity;
    }
    if (field.arityFrom === "args") {
      return DeclSpecs.splitList(v.args).length;
    }
    if (field.arityFrom === "rules" || field.arityFrom === "lhs") {
      const r = (v.rules || [])[0];
      if (!r || !r.lhs) {
        return 0;
      }
      const p = PvParser.parseFragment(r.lhs, "term");
      return p.node && p.node.kind === "App" ? p.node.args.length : 0;
    }
    return 0;
  }

  // Checking

  /**
   * Checks the source of a declaration against the model.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the declaration, or null for a new
   *   one.
   * @param {string} source The source text.
   * @return {Object} {syntax, diagnostics, elsewhere, node, text}.
   */
  static validate(analysis: Analysis, index: number, source: string) {
    const r = PvParser.parseFragment(source.trim(), "decl");
    if (r.errors.length || !r.node) {
      const e = r.errors[0];
      return { syntax: e ? String(e.message) + (e.detail ? ": " + e.detail : "") : I18n.t("empty declaration"), diagnostics: [], elsewhere: [] };
    }
    let text;
    let start;
    if (index === null || index === undefined) {
      const x = ModelEditor.insertDecl(analysis, source.trim());
      text = x.text;
      start = x.offset;
    } else {
      const x = ModelEditor.replaceDecl(analysis, index, source.trim());
      text = x.text;
      start = x.offset;
    }
    const end = start + source.trim().length;
    const a2 = Analysis.of(text);
    const diagnostics = a2.diagnostics.filter(d => d.start >= start && d.start <= end && d.severity !== "info");
    const before = new Set(analysis.diagnostics.map(d => d.message));
    const elsewhere = a2.diagnostics.filter(d => (d.start < start || d.start > end) && d.severity === "error" && !before.has(d.message));
    return { syntax: null, diagnostics, elsewhere, node: r.node, text };
  }

  // Queries

  /**
   * Infers the types of the free variables of queries from the events, tables
   * and predicates they use.
   *
   * @param {Analysis} analysis The analysis.
   * @param {Array} rows The rows of the form ({q}).
   * @param {Object} current The variables already declared ("x: host").
   * @return {Object} The variables text.
   */
  static inferQueryVars(analysis: Analysis, rows: any[], current: any = "") {
    const declared = new Map(DeclSpecs.splitList(current).map(v => {
      const m = v.match(/^([^:\s]+)\s*:\s*(\S+)$/);
      return m ? [m[1], m[2]] : [v, null];
    }));
    const found = new Map();
    const known = n => {
      const s = analysis.global(n);
      return s && s.kind !== "var";
    };
    const visitArgs = (args, types) => {
      args.forEach((a, i) => {
        if (a && a.kind === "Ident" && !known(a.name) && !found.has(a.name)) {
          found.set(a.name, (types && types[i]) || "bitstring");
        } else {
          visit(a);
        }
      });
    };
    const visit = n => {
      if (!n || typeof n !== "object") {
        return;
      }
      if (Array.isArray(n)) {
        n.forEach(visit);
        return;
      }
      if (n.kind === "GEvent") {
        for (const ev of n.args) {
          if (ev.kind === "App") {
            const s = analysis.global(ev.fn.name);
            visitArgs(ev.args, s && s.kind === "event" ? s.args : null);
          } else {
            visit(ev);
          }
        }
        return;
      }
      if (n.kind === "GTable") {
        if (n.arg && n.arg.kind === "App") {
          const s = analysis.global(n.arg.fn.name);
          visitArgs(n.arg.args, s && s.kind === "table" ? s.args : null);
        }
        return;
      }
      if (n.kind === "App") {
        const s = analysis.global(n.fn.name);
        if (s && (s.kind === "fun" || s.kind === "pred")) {
          visitArgs(n.args, s.args);
          return;
        }
        if (n.fn.name === "attacker" || n.fn.name === "mess") {
          visitArgs(n.args, null);
          return;
        }
      }
      for (const k of Object.keys(n)) {
        if (k !== "start" && k !== "end") {
          visit(n[k]);
        }
      }
    };
    for (const r of rows) {
      const q = String(r.q || "").trim().replace(/\s+public_vars\s+[\s\S]*$/, "").replace(/\s+for\s*\{[\s\S]*\}\s*$/, "");
      if (!q || /^(secret|putbegin)\b/.test(q)) {
        continue;
      }
      const p = PvParser.parseFragment(q, "gterm");
      if (p.node) {
        visit(p.node);
      }
    }
    const out = new Map(declared);
    for (const [x, t] of found) {
      if (!out.has(x) || !out.get(x)) {
        out.set(x, t);
      }
    }
    return [...out].map(([x, t]) => (t ? x + ": " + t : x)).join(", ");
  }

  /**
   * Proposes queries built from the events and names of the model.
   *
   * @param {Analysis} analysis The analysis.
   * @return {Object} [{label, q}].
   */
  static queryTemplates(analysis: Analysis) {
    const g = analysis.check.global;
    const events = [];
    const secrets = [];
    if (g) {
      for (const [name, s] of g.map) {
        if (s.kind === "event") {
          events.push({ name, args: s.args || [] });
        }
        if (s.kind === "name" && s.free && s.private && s.type !== "channel") {
          secrets.push(name);
        }
      }
    }
    for (const s of analysis.check.symbols.values()) {
      if (s.kind === "name" && s.bound && !secrets.includes(s.name) && secrets.length < 6) {
        secrets.push(s.name);
      }
    }
    const t = [];
    const freeNames = new Set(secrets.filter(n => g && g.get(n) && g.get(n).kind === "name"));
    const ref = n => (freeNames.has(n) ? n : "new " + n);
    const secret = secrets[0] || "s";
    t.push({ label: I18n.t("Secrecy of {name}", { name: secret }), q: "attacker(" + (secrets.length ? ref(secret) : secret) + ")" });
    for (const n of secrets.slice(1, 4)) {
      t.push({ label: I18n.t("Secrecy of {name}", { name: n }), q: "attacker(" + ref(n) + ")" });
    }
    const ev = (e, vars) => String(e.name) + (e.args.length ? "(" + vars.slice(0, e.args.length).join(", ") + ")" : "");
    const vars = ["x1", "x2", "x3", "x4", "x5", "x6"];
    const isEnd = n => /^(end|term|commit|finish|accept)/i.test(n);
    const ends = events.filter(e => isEnd(e.name));
    const begins = events.filter(e => !isEnd(e.name));
    for (const e of ends.slice(0, 3)) {
      const b = begins.find(x => x.args.length === e.args.length && x.args.every((a, i) => a === e.args[i])) || begins.find(x => x.args.length === e.args.length) || begins[0];
      if (!b) {
        continue;
      }
      t.push({ label: I18n.t("Authentication: {end} implies {begin}", { end: e.name, begin: b.name }), q: "event(" + ev(e, vars) + ") ==> event(" + ev(b, vars) + ")" });
      t.push({ label: I18n.t("Injective: {end} implies {begin}", { end: e.name, begin: b.name }), q: "inj-event(" + ev(e, vars) + ") ==> inj-event(" + ev(b, vars) + ")" });
    }
    for (const e of events.slice(0, 3)) {
      t.push({ label: I18n.t("Reachability of {name}", { name: e.name }), q: "event(" + ev(e, vars) + ")" });
    }
    const bound = secrets.find(n => !freeNames.has(n));
    if (bound) {
      t.push({ label: I18n.t("Real-or-random secrecy of {name}", { name: bound }), q: "secret " + bound + " [real_or_random]" });
    }
    return t;
  }
}
// ----------------------------------------------------------------
