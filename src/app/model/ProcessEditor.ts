/**
 * Structural edits of processes, as the diagram makes them.
 *
 * A path is an array of keys from the root of the program, for example
 * ['decls', 4, 'body', 'next', 'then'] or ['process', 'next']. It builds new
 * programs that share every untouched node with the old one, so that
 * ModelEditor.applyProgram re-prints only what changed.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class ProcessEditor {
  /**
   * Makes an implicit end of process.
   *
   * @return {Object} A Nil node.
   */
  static nil() {
    return { kind: "Nil", yield: false, implicit: true, start: -1, end: -1 };
  }

  /**
   * Makes an identifier node without position.
   *
   * @param {string} name The identifier.
   * @return {Object} The node.
   */
  static id(name: string) {
    return { name, start: -1, end: -1 };
  }

  /**
   * Gives the field that holds the continuation of a process node, when it
   * has a single one.
   *
   * @param {string} kind The kind of the node.
   * @return {Object|null} 'next', 'then', 'body' or null.
   */
  static contField(kind: string) {
    switch (kind) {
      case "New":
      case "In":
      case "Out":
      case "Event":
      case "Insert":
      case "Phase":
      case "Sync":
        return "next";

      case "Let":
      case "LetFilter":
      case "Get":
      case "If":
        return "then";

      case "Repl":
      case "Paren":
      case "ProgBegin":
        return "body";

      default:
        return null;
    }
  }

  /**
   * Parses a fragment or throw an EditError naming the field.
   *
   * @param {string} src The text.
   * @param {string} flavor The grammar.
   * @param {string} what The name of the field, in English: the error
   *   translates it.
   * @return {Object} The node.
   */
  static parseOrThrow(src: string, flavor: string, what: string) {
    const r = PvParser.parseFragment(String(src === undefined || src === null ? "" : src).trim(), flavor);
    if (r.errors.length || !r.node) {
      const e = r.errors[0];
      throw new EditError(I18n.t(what) + ": " + (e ? (e.detail || e.message) : I18n.t("empty")));
    }
    return r.node;
  }

  /**
   * Builds a process action from the fields of a form (strings). The
   * fields random (of a new name) and arrow (of a let) ask for the style of
   * CryptoVerif, "k <-R key;" and "x <- M;", which the action takes when
   * ProVerif can read it so.
   *
   * @param {string} kind The kind of action.
   * @param {Function} f The fields.
   * @return {Object} The node, with an empty continuation.
   */
  static makeAction(kind: string, f: any = {}) {
    const P = ProcessEditor;
    const term = (s, what) => P.parseOrThrow(s, "pterm", what);
    const pat = (s, what) => P.parseOrThrow(s, "pattern", what);
    const ident = (s, what) => {
      const v = String(s === undefined || s === null ? "" : s).trim();
      const err = ModelEditor.validIdentifier(v);
      if (err) {
        throw new EditError(I18n.t(what) + ": " + err);
      }
      return P.id(v);
    };
    const termList = (s, what) => {
      const v = String(s === undefined || s === null ? "" : s).trim();
      if (!v) {
        return [];
      }
      return P.parseOrThrow("(" + v + ", x)", "pterm", what).items.slice(0, -1);
    };
    const patList = (s, what) => {
      const v = String(s === undefined || s === null ? "" : s).trim();
      if (!v) {
        return [];
      }
      return P.parseOrThrow("(" + v + ", x)", "pattern", what).items.slice(0, -1);
    };
    const opts = precise => (precise ? [{ name: P.id("precise"), value: null, braces: false }] : []);
    switch (kind) {
      case "New": {
        // newArgs: null without brackets, '' for "new k[]: T", 'x, y' for "new k[x, y]: T"
        const na = f.newArgs === undefined || f.newArgs === null ? null : String(f.newArgs).split(",").map(x => x.trim()).filter(Boolean).map(x => ident(x, I18n.mark("argument of the name")));
        // I write "k <-R key", the style of CryptoVerif, only for a name without arguments
        return { kind, name: ident(f.name, I18n.mark("name")), newArgs: na, type: ident(f.type || "bitstring", I18n.mark("type")), next: P.nil(), random: !!f.random && na === null };
      }

      case "In":
        return { kind, chan: term(f.chan || "c", I18n.mark("channel")), pattern: pat(f.pattern || "x: bitstring", I18n.mark("pattern")), options: opts(f.precise), next: P.nil() };

      case "Out":
        return { kind, chan: term(f.chan || "c", I18n.mark("channel")), msg: term(f.msg, I18n.mark("message")), next: P.nil(), progEnd: false };

      case "Event": {
        const has = String(f.args === undefined || f.args === null ? "" : f.args).trim() !== "";
        return { kind, name: ident(f.name, I18n.mark("event")), args: has ? termList(f.args, I18n.mark("arguments")) : null, newArgs: null, next: P.nil() };
      }

      case "Insert":
        return { kind, table: ident(f.table, I18n.mark("table")), args: termList(f.args, I18n.mark("arguments")), next: P.nil() };

      case "Phase": {
        const n = Number(f.n);
        if (!Number.isInteger(n) || n <= 0) {
          throw new EditError(I18n.t("phase: a positive integer is expected"));
        }
        return { kind, n, next: P.nil() };
      }

      case "Sync": {
        const n = Number(f.n);
        if (!Number.isInteger(n) || n <= 0) {
          throw new EditError(I18n.t("sync: a positive integer is expected"));
        }
        return { kind, n, tag: f.tag ? ident(f.tag, I18n.mark("tag")) : null, next: P.nil() };
      }

      case "Let": {
        // I write "x <- M;", the style of CryptoVerif, only for a variable or _
        // without else branch
        const pattern = pat(f.pattern, I18n.mark("pattern"));
        return { kind, pattern: pattern, value: term(f.value, I18n.mark("value")), then: P.nil(), else: f.withElse ? P.nil() : null, hasIn: true, arrow: !!f.arrow && !f.withElse && Ast.basicPattern(pattern) };
      }

      case "LetFilter": {
        const vars = String(f.vars || "").split(",").map(s => s.trim()).filter(Boolean).map(v => {
          const m = v.match(/^(\S+)\s*:\s*(\S+)$/);
          if (!m) {
            throw new EditError(I18n.t("variables: x: type is expected, not {text}", { text: "\"" + v + "\"" }));
          }
          return { name: ident(m[1], I18n.mark("variable")), type: ident(m[2], I18n.mark("type")) };
        });
        if (!vars.length) {
          throw new EditError(I18n.t("variables: at least one typed variable is required"));
        }
        return { kind, vars, cond: term(f.cond, I18n.mark("condition")), options: opts(f.precise), then: P.nil(), else: f.withElse ? P.nil() : null, hasIn: true };
      }

      case "If":
        return { kind, cond: term(f.cond, I18n.mark("condition")), then: P.nil(), else: f.withElse ? P.nil() : null };

      case "Get":
        return { kind, table: ident(f.table, I18n.mark("table")), patterns: patList(f.patterns, I18n.mark("patterns")), cond: f.cond && String(f.cond).trim() ? term(f.cond, I18n.mark("condition")) : null, options: opts(f.precise), then: P.nil(), else: f.withElse ? P.nil() : null, hasIn: true };

      case "Call": {
        const a = String(f.args === undefined || f.args === null ? "" : f.args).trim();
        return { kind, name: ident(f.name, I18n.mark("process")), args: a ? termList(a, I18n.mark("arguments")) : (f.parens ? [] : null) };
      }

      case "Repl":
        return { kind, body: P.nil(), index: null, foreach: false };

      case "Par":
        return { kind, left: P.nil(), right: P.nil() };

      case "Nil":
        return { kind: "Nil", yield: false, implicit: false };

      default:
        throw new EditError(I18n.t("unknown action {kind}", { kind: kind }));
    }
  }

  /**
   * Tells whether an action has a given option (such as precise).
   *
   * @param {Object} node The action.
   * @param {string} name The option.
   * @return {boolean} True when present.
   */
  static hasOption(node: any, name: string): boolean {
    return (node.options || []).some(o => o.name.name === name);
  }

  /**
   * Gives the editable fields of an action, as the forms show them.
   *
   * @param {Object} node The action.
   * @return {Array} The fields (strings and booleans).
   */
  static actionFields(node: any) {
    const T = t => PvPrinter.term(t);
    const Pt = p => PvPrinter.pattern(p);
    switch (node.kind) {
      case "New":
        return { name: node.name.name, type: node.type.name, random: !!node.random, newArgs: node.newArgs ? node.newArgs.map(a => a.name).join(", ") : null };

      case "In":
        return { chan: T(node.chan), pattern: Pt(node.pattern), precise: ProcessEditor.hasOption(node, "precise") };

      case "Out":
        return { chan: T(node.chan), msg: T(node.msg) };

      case "Event":
        return { name: node.name.name, args: (node.args || []).map(T).join(", ") };

      case "Insert":
        return { table: node.table.name, args: node.args.map(T).join(", ") };

      case "Phase":
        return { n: node.n };

      case "Sync":
        return { n: node.n, tag: node.tag ? node.tag.name : "" };

      case "Let":
        return { pattern: Pt(node.pattern), value: T(node.value), withElse: !!node.else, arrow: !!node.arrow };

      case "LetFilter":
        return { vars: node.vars.map(v => v.name.name + ": " + v.type.name).join(", "), cond: T(node.cond), precise: ProcessEditor.hasOption(node, "precise"), withElse: !!node.else };

      case "If":
        return { cond: T(node.cond), withElse: !!node.else };

      case "Get":
        return { table: node.table.name, patterns: node.patterns.map(Pt).join(", "), cond: node.cond ? T(node.cond) : "", precise: ProcessEditor.hasOption(node, "precise"), withElse: !!node.else };

      case "Call":
        return { name: node.name.name, args: (node.args || []).map(T).join(", ") };

      default:
        return {};
    }
  }

  /**
   * Replaces the editable fields of the action at a path, keeping its
   * continuations.
   *
   * @param {Object} program The program.
   * @param {string} path The path of the action.
   * @param {Array} fields The new fields (missing ones keep their value).
   * @return {Object} The new program.
   */
  static updateAction(program: any, path: any[], fields: any) {
    const old = Ast.getAt(program, path);
    if (!old) {
      throw new EditError(I18n.t("no such node"));
    }
    const fresh = ProcessEditor.makeAction(old.kind, { ...ProcessEditor.actionFields(old), ...fields });
    const merged = { ...old, ...fresh };
    for (const k of Ast.PROCESS_CHILDREN[old.kind] || []) {
      merged[k] = old[k];
    }
    if (Ast.BRANCHING.has(old.kind)) {
      if (fields.withElse === true && !old.else) {
        merged.else = ProcessEditor.nil();
      }
      if (fields.withElse === false) {
        merged.else = null;
      }
      if (old.kind !== "If") {
        merged.hasIn = true;
      }
    }
    if (old.kind === "Let") {
      merged.arrow = !!fresh.arrow && !merged.else;
    }
    if ((old.kind === "New" && !("newArgs" in fields)) || old.kind === "Event") {
      merged.newArgs = old.newArgs;
    }
    if (old.kind === "New") {
      merged.random = !!fresh.random && !merged.newArgs;
    }
    if (old.kind === "Out") {
      merged.progEnd = old.progEnd;
    }
    merged.leadingComments = old.leadingComments;
    return Ast.setAt(program, path, merged);
  }

  /**
   * Replaces the action at a path by an action of another kind, keeping what
   * follows it.
   *
   * A conditional keeps its else branch when it becomes another conditional;
   * a conditional with a non-empty else branch cannot become a sequential
   * action, since that branch would be lost.
   *
   * @param {Object} program The program.
   * @param {string} path The path of the action.
   * @param {Object} action A node from makeAction.
   * @return {Object} The new program.
   */
  static replaceAction(program: any, path: any[], action: any) {
    const old = Ast.getAt(program, path);
    if (!old) {
      throw new EditError(I18n.t("no such node"));
    }
    const fOld = ProcessEditor.contField(old.kind);
    const fNew = ProcessEditor.contField(action.kind);
    if (!fOld || !fNew || old.kind === "Repl" || action.kind === "Repl") {
      throw new EditError(I18n.t("only actions followed by a continuation can change kind"));
    }
    const node = { ...action, leadingComments: old.leadingComments };
    node[fNew] = old[fOld];
    if (Ast.BRANCHING.has(action.kind)) {
      node.else = Ast.BRANCHING.has(old.kind) && old.else ? old.else : (action.else || null);
      if (node.kind !== "If") {
        node.hasIn = true;
      }
      if (node.kind === "Let") {
        node.arrow = false;
      }
    } else if (Ast.BRANCHING.has(old.kind) && old.else && !(old.else.kind === "Nil" && !old.else.yield)) {
      throw new EditError(I18n.t("this action has an else branch: remove the branch first, or keep a conditional"));
    }
    return Ast.setAt(program, path, node);
  }

  /**
   * Sets the options of the action at a path (the modifiers of the pop-up,
   * such as precise).
   *
   * @param {Object} program The program.
   * @param {string} path The path of the action.
   * @param {Array} names The option names.
   * @return {Object} The new program.
   */
  static setActionOptions(program: any, path: any[], names: any[]) {
    const old = Ast.getAt(program, path);
    if (!old || !("options" in old)) {
      throw new EditError(I18n.t("this action has no options"));
    }
    const prev = new Map((old.options || []).map(o => [o.name.name, o]));
    const options = names.map(n => prev.get(n) || { name: ProcessEditor.id(n), value: null, braces: false });
    return Ast.setAt(program, path, { ...old, options });
  }

  /**
   * Inserts an action before the process at a path.
   *
   * @param {Object} program The program.
   * @param {string} path The path of the process that will follow the action.
   * @param {Object} action A node from makeAction.
   * @return {Object} The new program.
   */
  static insertBefore(program: any, path: any[], action: any) {
    const target = Ast.getAt(program, path);
    if (!target || !Ast.isProcess(target)) {
      throw new EditError(I18n.t("insertion point is not a process"));
    }
    const node = { ...action };
    const f = ProcessEditor.contField(node.kind);
    let cont = target;
    // "P; 0" is written "P": an explicit 0 after the new action becomes implicit
    if (cont.kind === "Nil" && !cont.yield && !(cont.leadingComments && cont.leadingComments.length)) {
      cont = ProcessEditor.nil();
    }
    // the comments that preceded the target now precede the new action
    if (target.leadingComments && target.leadingComments.length) {
      node.leadingComments = target.leadingComments;
      cont = { ...target, leadingComments: undefined };
    }
    if (node.kind === "Par") {
      node.left = cont;
      node.right = node.right || ProcessEditor.nil();
    } else if (f) {
      node[f] = cont;
    } else if (node.kind === "Call" || node.kind === "Nil") {
      // a terminal action replaces an empty continuation, or runs in parallel with it
      if (target.kind === "Nil") {
        return Ast.setAt(program, path, node);
      }
      return Ast.setAt(program, path, { kind: "Par", left: node, right: cont });
    }
    return Ast.setAt(program, path, node);
  }

  /**
   * Removes the process node at a path and keep its continuation.
   *
   * @param {Object} program The program.
   * @param {string} path The path.
   * @param {boolean} keep For branchings, 'then'/'else' or 'left'/'right':
   *   the branch kept.
   * @return {Object} The new program.
   */
  static removeAction(program: any, path: any, keep: any) {
    const node = Ast.getAt(program, path);
    if (!node) {
      throw new EditError(I18n.t("no such node"));
    }
    let repl;
    switch (node.kind) {
      case "Par":
        repl = keep === "left" ? node.left : node.right;
        break;

      case "If":
      case "Let":
      case "LetFilter":
      case "Get":
        repl = keep === "else" && node.else ? node.else : node.then;
        break;

      case "Nil":
        return program;

      case "Call":
        repl = ProcessEditor.nil();
        break;

      default:
        repl = node[ProcessEditor.contField(node.kind)] || ProcessEditor.nil();
    }
    // removing a branch of a parallel composition removes the composition
    const parentPath = path.slice(0, -1);
    const parent = Ast.getAt(program, parentPath);
    if (parent && parent.kind === "Par" && repl.kind === "Nil") {
      const other = path[path.length - 1] === "left" ? parent.right : parent.left;
      return Ast.setAt(program, parentPath, other);
    }
    if (node.leadingComments && node.leadingComments.length && repl && repl.kind !== "Nil") {
      repl = { ...repl, leadingComments: [...node.leadingComments, ...(repl.leadingComments || [])] };
    }
    return Ast.setAt(program, path, repl);
  }

  /**
   * Finds the path of a node (by identity) in a tree.
   *
   * @param {Object} root The tree.
   * @param {Object} target The node.
   * @param {string} path The path so far (recursion).
   * @return {Object|null} The path or null.
   */
  static findPath(root: any, target: any, path: any[] = []) {
    if (root === target) {
      return path;
    }
    if (!root || typeof root !== "object") {
      return null;
    }
    for (const k of Object.keys(root)) {
      if (k === "leadingComments" || k === "trailingComments" || k === "features") {
        continue;
      }
      const v = root[k];
      if (v && typeof v === "object") {
        const r = ProcessEditor.findPath(v, target, [...path, k]);
        if (r) {
          return r;
        }
      }
    }
    return null;
  }

  /**
   * Tells whether a path is a prefix of another.
   *
   * @param {Object} a A path.
   * @param {Object} b A path.
   * @return {boolean} True when a is a prefix of b.
   */
  static isPrefix(a: any, b: any): boolean {
    return a.length <= b.length && a.every((x, i) => x === b[i]);
  }

  /**
   * Moves an action (with its else branch) so that it runs just before the
   * process at another path.
   *
   * Its former continuation takes its place. This is the edit behind the
   * reordering of blocks by height in the diagram.
   *
   * @param {Object} program The program.
   * @param {number} from The path of the action.
   * @param {number} to The path of the process before which it goes.
   * @return {Object} The new program.
   */
  static moveAction(program: any, from: any, to: any) {
    const P = ProcessEditor;
    const node = Ast.getAt(program, from);
    const target = Ast.getAt(program, to);
    if (!node || !target) {
      throw new EditError(I18n.t("no such node"));
    }
    const f = P.contField(node.kind);
    if (!f || node.kind === "Repl" || node.kind === "Paren" || node.kind === "ProgBegin") {
      throw new EditError(I18n.t("only sequential actions and conditionals can be moved"));
    }
    if (P.isPrefix(from, to) && to.length > from.length && to[from.length] !== f) {
      throw new EditError(I18n.t("cannot move a conditional into its own else branch"));
    }
    if (P.isPrefix(from, to) && to.length === from.length + 1) {
      return program;
    }
    const detached = { ...node, [f]: P.nil() };
    const p1 = P.removeAction(program, from, "then");
    let newTo;
    if (P.isPrefix(to, from)) {
      newTo = to;
    } else if (P.isPrefix(from, to)) {
      newTo = [...from, ...to.slice(from.length + 1)];
    } else {
      newTo = to;
    }
    return P.insertBefore(p1, newTo, detached);
  }

  /**
   * Wraps the process at a path into a replication, or unwrap it.
   *
   * @param {Object} program The program.
   * @param {string} path The path.
   * @return {Object} The new program.
   */
  static toggleReplication(program: any, path: any[]) {
    const node = Ast.getAt(program, path);
    if (node.kind === "Repl") {
      return Ast.setAt(program, path, node.body);
    }
    return Ast.setAt(program, path, { kind: "Repl", body: node, index: null, foreach: false });
  }

  /**
   * Runs a process (or 0) in parallel with the process at a path.
   *
   * @param {Object} program The program.
   * @param {string} path The path.
   * @param {Object} extra The process to add, or null for 0.
   * @return {Object} The new program.
   */
  static addParallel(program: any, path: any[], extra: any = null) {
    const node = Ast.getAt(program, path);
    return Ast.setAt(program, path, { kind: "Par", left: node, right: extra || ProcessEditor.nil() });
  }

  /**
   * Gives an else branch to the conditional at a path, or remove it.
   *
   * @param {Object} program The program.
   * @param {string} path The path.
   * @param {boolean} on True to add, false to remove.
   * @return {Object} The new program.
   */
  static setElse(program: any, path: any[], on: boolean) {
    const node = Ast.getAt(program, path);
    if (!Ast.BRANCHING.has(node.kind)) {
      throw new EditError(I18n.t("only conditionals have an else branch"));
    }
    const n = { ...node, else: on ? (node.else || ProcessEditor.nil()) : null };
    if (n.kind !== "If") {
      n.hasIn = true;
    }
    if (n.kind === "Let") {
      n.arrow = false;
    }
    return Ast.setAt(program, path, n);
  }
}
// ----------------------------------------------------------------
