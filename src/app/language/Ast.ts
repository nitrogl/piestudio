/**
 * Abstract syntax of ProVerif typed models, and helpers to walk and rebuild
 * it.
 *
 * Nodes are plain objects with a "kind", concrete enough to print
 * a model back faithfully (choice/diff, 0/yield, new/<-R are remembered) and
 * abstract enough to drive the visual editor. Every node has start/end
 * offsets into its source. Process actions also have hstart/hend: the extent
 * of the action alone (for example "new k: key"), without its continuation.
 *
 * Program { decls[], process?, equivalence?: [P, Q], trailingComments[] }
 *
 * Declarations (all may have leadingComments[] and trailingComments[]):
 *
 *   TypeDecl       { name, options }
 *   FunDecl        { name, argTypes[], retType, options, reduc?: Rule[] }  (fun ... reduc ... otherwise)
 *   ReducDecl      { rules: Rule[], options }
 *   ConstDecl      { names[], type, options }
 *   EquationDecl   { eqs: Equation[], options }
 *   EventDecl      { name, argTypes[] | null }       (null when written without parentheses)
 *   PredDecl       { name, argTypes[] | null, options }
 *   TableDecl      { name, argTypes[] }
 *   ProcessDecl    { name, params: VarDecl[] | null, body }
 *   LetFunDecl     { name, params: VarDecl[] | null, body }
 *   SetDecl        { name, value: { kind: 'ident' | 'string' | 'int', value } }
 *   NoUnifDecl     { keyword: 'nounif' | 'noselect' | 'select', vars, fact, options }
 *   QueryDecl      { vars, queries: Query[], options }
 *   LemmaDecl      { keyword: 'lemma' | 'axiom' | 'restriction', vars, lemmas: {term, ror, publicVars}[], options }
 *   NonInterfDecl  { vars, items: { name, among: Term[] | null }[] }
 *   WeakSecretDecl { name }
 *   NotDecl        { vars, term }
 *   ElimTrueDecl   { vars, term }
 *   ChannelDecl    { names[] }
 *   FreeDecl       { names[], type, options }
 *   ClausesDecl    { clauses: { forall, kind: 'fact' | 'clause' | 'equiv' | 'equiveq', hyp?, concl }[] }
 *   DefineDecl     { name, params[], decls[] }
 *   ExpandDecl     { name, args[] }
 *   RawDecl        { keyword, text }  CryptoVerif declarations that ProVerif ignores
 *                                      (param, proba, letproba, proof, implementation)
 *
 * Rule = { forall: VarDecl[], lets: Let[], lhs, rhs, otherwise? } Equation =
 * { forall: VarDecl[], lets: Let[], term } Let = { name, value, arrow } for
 * "let x = t in" or "x <- t;" before an equation (2.04) Identifiers are {
 * name, start, end }. VarDecl = { name, type, mayFail? }. Options are [{
 * name, value: null | Ident[], braces? }].
 *
 * Terms (shared by the term, pterm, gterm and gformat grammars):
 *
 *   Ident { name }   App { fn, args[], phase?, at? }   Tuple { items[] }
 *   Choice { keyword, left, right }   Int { value }   Plus { term, n, intFirst }
 *   Minus { term, n }   BinOp { op, left, right }   Not { arg }   Fail {}   Proj { proj, arg }
 *   Enriched process terms: TNew, TIf, TLet, TLetFilter, TEvent, TInsert, TGet
 *   Query terms: GEvent { injective, args[], at }, GTable { arg, phase, at },
 *                GNew { name, bindings }, GLet { name, value, body, arrow }
 *   Nounif formats: FAny { name }
 *
 * Patterns: PVar { name, type }, PAny { type } (the 2.05 pattern _), PTuple {
 * items[] },
 *
 *   PApp { fn, args[] }, PEq { term }, PInt { value }, PPlus { pattern, n, intFirst },
 *   PChoice { keyword, left, right, type } (with set allowDiffPatterns = true)
 *
 * Processes: Nil { yield, implicit }, Par { left, right }, Repl { body,
 * index, foreach },
 *
 *   New { name, newArgs, type, next, random }, In { chan, pattern, options, next },
 *   Out { chan, msg, next, progEnd }, If { cond, then, else }, Let { pattern, value, then, else, hasIn, arrow },
 *   LetFilter { vars, cond, options, then, else, hasIn }, Insert { table, args, next },
 *   Get { table, patterns, cond, options, then, else, hasIn }, Event { name, args, newArgs, next },
 *   Phase { n, next }, Sync { n, tag, next }, Call { name, args, sync },
 *   Paren { body } (kept for faithful printing), ProgBegin { name, options, body }
 *
 * Queries: RealQuery { term, publicVars }, SecretQuery { name, publicVars,
 * options },
 *
 *   PutBegin { injective, names[] }
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Ast {
  /**
   * Kinds of process nodes.
   *
   * @type {Set<string>}
   */
  static PROCESS_KINDS: Set<string> = new Set([
    "Nil", "Par", "Repl", "New", "In", "Out", "If", "Let", "LetFilter", "Insert", "Get",
    "Event", "Phase", "Sync", "Call", "Paren", "ProgBegin"
  ]);

  /**
   * Fields of each process kind that hold sub-processes, in order.
   *
   * @type {Object}
   */
  static PROCESS_CHILDREN = {
    Nil: [], Par: ["left", "right"], Repl: ["body"], New: ["next"], In: ["next"], Out: ["next"],
    If: ["then", "else"], Let: ["then", "else"], LetFilter: ["then", "else"], Insert: ["next"],
    Get: ["then", "else"], Event: ["next"], Phase: ["next"], Sync: ["next"], Call: [],
    Paren: ["body"], ProgBegin: ["body"]
  };

  /**
   * Process kinds whose continuation is a single "next" process.
   *
   * @type {Set<string>}
   */
  static SEQUENTIAL: Set<string> = new Set(["New", "In", "Out", "Event", "Insert", "Phase", "Sync"]);

  /**
   * Process kinds that branch into then/else.
   *
   * @type {Set<string>}
   */
  static BRANCHING: Set<string> = new Set(["If", "Let", "LetFilter", "Get"]);

  /**
   * Tells whether a node is a process.
   *
   * @param {number} n Any value.
   * @return {boolean} True for process nodes.
   */
  static isProcess(n: any): boolean {
    return !!n && Ast.PROCESS_KINDS.has(n.kind);
  }

  /**
   * Builds an identifier node.
   *
   * @param {string} name The identifier text.
   * @param {number} start Optional offset.
   * @param {number} end Optional offset.
   * @return {Object} {name, start, end}.
   */
  static ident(name: string, start: number = -1, end: number = -1) {
    return { name, start, end };
  }

  /**
   * Makes a deep copy of a tree.
   *
   * @param {Object} node Any JSON-like value.
   * @return {Object} The copy.
   */
  static clone(node: any) {
    return structuredClone(node);
  }

  /**
   * Visits every object node of a tree in pre-order.
   *
   * @param {Object} node The root.
   * @param {Function} fn Called as fn(node, parent, key); returning false
   *   skips the children.
   * @param {Object} parent The parent of node (for the recursion).
   * @param {string} key The key of node in its parent (for the recursion).
   */
  static walk(node: any, fn: Function, parent: any = null, key: any = null) {
    if (node === null || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((c, i) => Ast.walk(c, fn, parent, i));
      return;
    }
    if (fn(node, parent, key) === false) {
      return;
    }
    for (const k of Object.keys(node)) {
      if (k === "leadingComments" || k === "trailingComments" || k === "start" || k === "end") {
        continue;
      }
      const v = node[k];
      if (v && typeof v === "object") {
        Ast.walk(v, fn, node, k);
      }
    }
  }

  /**
   * Reads the value at a path of keys.
   *
   * @param {Object} root The tree.
   * @param {string} path An array of keys.
   * @return {Object} The value, or undefined.
   */
  static getAt(root: any, path: any) {
    let cur = root;
    for (const k of path) {
      if (cur === null || cur === undefined) {
        return undefined;
      }
      cur = cur[k];
    }
    return cur;
  }

  /**
   * Replaces the value at a path, copying the nodes along the path only.
   *
   * @param {Object} root The tree.
   * @param {string} path An array of keys.
   * @param {string} value The new value.
   * @return {Object} The new root.
   */
  static setAt(root: any, path: any[], value: any) {
    if (path.length === 0) {
      return value;
    }
    const [k, ...rest] = path;
    const copy = Array.isArray(root) ? root.slice() : { ...root };
    copy[k] = Ast.setAt(root[k], rest, value);
    return copy;
  }

  /**
   * Strips locations, comments and layout hints, to compare trees
   * structurally.
   *
   * @param {Object} node The tree.
   * @return {Object} A copy without positions; explicit process parentheses
   *   are transparent.
   */
  static stripLocations(node: any) {
    if (node === null || typeof node !== "object") {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(Ast.stripLocations);
    }
    if (node.kind === "Paren") {
      return Ast.stripLocations(node.body);
    }
    const out = {};
    for (const k of Object.keys(node)) {
      if (Ast.LAYOUT_KEYS.has(k)) {
        continue;
      }
      out[k] = Ast.stripLocations(node[k]);
    }
    return out;
  }

  /**
   * Keys that only carry positions or layout.
   *
   * @type {Set<string>}
   */
  static LAYOUT_KEYS: Set<string> = new Set([
    "start", "end", "hstart", "hend", "leadingComments", "trailingComments", "blankBefore",
    "processStart", "processBroken", "implicit", "text", "paren", "pstart", "pend", "features"
  ]);

  /**
   * Tells whether a pattern is basic: a variable or _, typed or not. Only
   * such a pattern can be bound with an arrow, "x <- M;", the style of
   * CryptoVerif that ProVerif also reads.
   *
   * @param {Object} p A pattern.
   * @return {boolean} Whether it is basic.
   */
  static basicPattern(p: any): boolean {
    return !!p && (p.kind === "PVar" || p.kind === "PAny");
  }

  /**
   * Lists the variables bound by a pattern, in order.
   *
   * @param {Object} p A pattern.
   * @param {Array} out The array to fill.
   * @return {Array} The array of identifier nodes.
   */
  static patternVars(p: any, out: any[] = []) {
    if (!p) {
      return out;
    }
    switch (p.kind) {
      case "PVar":
        out.push(p.name);
        break;

      case "PTuple":
        p.items.forEach(x => Ast.patternVars(x, out));
        break;

      case "PApp":
        p.args.forEach(x => Ast.patternVars(x, out));
        break;

      case "PPlus":
        Ast.patternVars(p.pattern, out);
        break;

      case "PChoice":
        Ast.patternVars(p.left, out);
        Ast.patternVars(p.right, out);
        break;

      default:
        break;
    }
    return out;
  }

  /**
   * Gives the sub-processes of a process node, in order.
   *
   * @param {Object} p A process.
   * @return {Array} An array of [key, child] pairs (children may be null).
   */
  static processChildren(p: any) {
    return (Ast.PROCESS_CHILDREN[p.kind] || []).map(k => [k, p[k]]);
  }
}
// ----------------------------------------------------------------
