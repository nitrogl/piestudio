/**
 * Edits of the text of a model: declarations, the main process, renames,
 * settings, options.
 *
 * Every edit of the studio (from the code editor, the diagram or the forms)
 * produces a new text. When the change is structural, it re-prints only the
 * declarations it touches, so that the formatting and the comments of the
 * user survive everywhere else.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class ModelEditor {
  /**
   * Groups of declarations: a new declaration goes after the last one of its
   * group.
   *
   * @type {Array}
   */
  static GROUPS = [
      ["SetDecl"]
    , ["TypeDecl"]
    , ["ChannelDecl", "FreeDecl", "ConstDecl"]
    , ["FunDecl", "ReducDecl", "EquationDecl", "DefineDecl", "ExpandDecl", "RawDecl"]
    , ["EventDecl", "PredDecl", "TableDecl", "ClausesDecl", "ElimTrueDecl"]
    , ["LetFunDecl"]
    , ["QueryDecl", "LemmaDecl", "NonInterfDecl", "WeakSecretDecl", "NotDecl", "NoUnifDecl"]
    , ["ProcessDecl"]
  ];

  /**
   * Identifiers of ProVerif: a letter, then letters, digits, _ and '.
   *
   * @type {RegExp}
   */
  static IDENT: RegExp = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff][a-zA-Z0-9_'\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff]*$/;

  /**
   * Gives the group of a kind of declaration.
   *
   * @param {string} kind The kind.
   * @return {Object} Its index in GROUPS.
   */
  static groupOf(kind: string) {
    return ModelEditor.GROUPS.findIndex(g => g.includes(kind));
  }

  /**
   * Splices a string.
   *
   * @param {string} text The text.
   * @param {Object} a Start offset.
   * @param {Object} b End offset.
   * @param {string} s The replacement.
   * @return {string} The new text.
   */
  static splice(text: string, a: any, b: any, s: string): string {
    return text.slice(0, a) + s + text.slice(b);
  }

  /**
   * Checks that a string can be an identifier.
   *
   * @param {string} name The candidate.
   * @return {null} Null when valid, else a message.
   */
  static validIdentifier(name: string) {
    if (!ModelEditor.IDENT.test(name)) {
      return I18n.t("Identifiers start with a letter and contain letters, digits, _ and '");
    }
    if (PvToken.KEYWORDS.has(name)) {
      return I18n.t("{name} is a ProVerif keyword", { name: name });
    }
    return null;
  }

  /**
   * Gives the range of a top-level declaration, its leading comments
   * included.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the declaration.
   * @return {Object} [start, end].
   */
  static declRange(analysis: Analysis, index: number) {
    const d = analysis.program.decls[index];
    let start = d.start;
    if (d.leadingComments && d.leadingComments.length) {
      start = Math.min(start, d.leadingComments[0].start);
    }
    return [start, d.end];
  }

  /**
   * Gives the range of the main process ("process ..." or "equivalence ..."),
   * without the metadata comment.
   *
   * @param {Analysis} analysis The analysis.
   * @return {Object|null} [start, end] or null.
   */
  static mainRange(analysis: Analysis) {
    const prog = analysis.program;
    if (prog.processStart === undefined) {
      return null;
    }
    let end = prog.end;
    if (analysis.metaRange && analysis.metaRange[0] > prog.processStart) {
      end = analysis.metaRange[0];
    }
    while (end > prog.processStart && /\s/.test(analysis.text[end - 1])) {
      end--;
    }
    return [prog.processStart, end];
  }

  /**
   * Prints the parts of a new program that differ (by identity) from the
   * analysed one and splice them in.
   *
   * @param {Analysis} analysis The analysis of the current text.
   * @param {Object} program The new program (unchanged nodes keep their
   *   identity).
   * @param {Object} opts Printer options.
   * @return {string} The new text.
   */
  static applyProgram(analysis: Analysis, program: any, opts: any = {}): string {
    const old = analysis.program;
    let text = analysis.text;
    const edits = [];
    program.decls.forEach((d, i) => {
      if (old.decls[i] !== d) {
        edits.push({ range: ModelEditor.declRange(analysis, i), text: PvPrinter.decl(d, opts) });
      }
    });
    if (program.process !== old.process || program.equivalence !== old.equivalence) {
      const r = ModelEditor.mainRange(analysis);
      let s = "";
      if (program.process) {
        s = "process\n" + PvPrinter.process(program.process, opts, 1);
      } else if (program.equivalence) {
        s = "equivalence\n" + program.equivalence.map(p => "  (\n" + PvPrinter.process(p.kind === "Paren" ? p.body : p, opts, 2) + "\n  )").join("\n");
      }
      if (r) {
        edits.push({ range: r, text: s });
      } else {
        edits.push({ range: [text.length, text.length], text: (text.endsWith("\n") ? "\n" : "\n\n") + s + "\n" });
      }
    }
    edits.sort((a, b) => b.range[0] - a.range[0]);
    for (const e of edits) {
      text = ModelEditor.splice(text, e.range[0], e.range[1], e.text);
    }
    return text;
  }

  /**
   * Inserts a declaration after the last declaration of its group.
   *
   * @param {Analysis} analysis The analysis.
   * @param {Object} decl A declaration node or its source text.
   * @param {Object} opts Printer options.
   * @return {Object} {text, offset} where offset is where the declaration
   *   starts.
   */
  static insertDecl(analysis: Analysis, decl: any, opts: any = {}) {
    const text = analysis.text;
    const src = typeof decl === "string" ? decl : PvPrinter.decl(decl, opts);
    const kind = typeof decl === "string" ? (PvParser.parseFragment(decl, "decl").node || { kind: "RawDecl" }).kind : decl.kind;
    const g = ModelEditor.groupOf(kind);
    const decls = analysis.program.decls;
    let after = -1;
    for (let i = 0; i < decls.length; i++) {
      if (ModelEditor.groupOf(decls[i].kind) <= g) {
        after = i;
      }
    }
    let pos;
    let prefix = "";
    let suffix = "\n";
    if (after >= 0) {
      pos = decls[after].end;
      prefix = "\n";
      if (kind === "ProcessDecl" || decls[after].kind === "ProcessDecl" || ModelEditor.groupOf(decls[after].kind) !== g) {
        prefix = "\n\n";
      }
      suffix = "";
    } else if (decls.length) {
      pos = ModelEditor.declRange(analysis, 0)[0];
      suffix = ModelEditor.groupOf(decls[0].kind) !== g ? "\n\n" : "\n";
    } else if (analysis.program.processStart !== undefined) {
      pos = analysis.program.processStart;
      suffix = "\n\n";
    } else {
      pos = text.length;
      prefix = text.length && !text.endsWith("\n") ? "\n" : "";
    }
    return { text: ModelEditor.splice(text, pos, pos, prefix + src + suffix), offset: pos + prefix.length };
  }

  /**
   * Replaces a declaration.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the declaration.
   * @param {Object} decl A declaration node or its source text.
   * @param {Object} opts Printer options.
   * @return {Object} {text, offset}.
   */
  static replaceDecl(analysis: Analysis, index: number, decl: any, opts: any = {}) {
    const [a, b] = ModelEditor.declRange(analysis, index);
    const src = typeof decl === "string" ? decl : PvPrinter.decl(decl, opts);
    return { text: ModelEditor.splice(analysis.text, a, b, src), offset: a };
  }

  /**
   * Deletes a declaration and the line it occupies.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the declaration.
   * @return {Object} {text, offset}.
   */
  static deleteDecl(analysis: Analysis, index: number) {
    const text = analysis.text;
    let [a, b] = ModelEditor.declRange(analysis, index);
    while (b < text.length && /[ \t]/.test(text[b])) {
      b++;
    }
    if (text[b] === "\r") {
      b++;
    }
    if (text[b] === "\n") {
      b++;
    }
    while (a > 0 && /[ \t]/.test(text[a - 1])) {
      a--;
    }
    return { text: ModelEditor.splice(text, a, b, ""), offset: a };
  }

  /**
   * Moves a declaration to another index of the declaration list.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the declaration.
   * @param {number} to Its new index.
   * @return {Object} {text}.
   */
  static moveDecl(analysis: Analysis, index: number, to: number) {
    const decls = analysis.program.decls;
    if (to < 0 || to >= decls.length || to === index) {
      return { text: analysis.text };
    }
    const [a, b] = ModelEditor.declRange(analysis, index);
    const src = analysis.text.slice(a, b);
    const removed = ModelEditor.deleteDecl(analysis, index).text;
    const a2 = Analysis.of(removed);
    const target = to > index ? to - 1 : to;
    const at = to > index ? ModelEditor.declRange(a2, target)[1] : ModelEditor.declRange(a2, target)[0];
    const ins = to > index ? "\n" + src : src + "\n";
    return { text: ModelEditor.splice(removed, at, at, ins) };
  }

  /**
   * Puts declarations in other slots: the declaration order[k] goes where
   * slots[k] was.
   *
   * Every other declaration stays where it is, and each moved declaration
   * keeps its leading comments.
   *
   * @param {Analysis} analysis The analysis.
   * @param {Array} slots The indices of the declarations to permute,
   *   ascending.
   * @param {Object} order The same indices in their new order.
   * @return {string} The new text.
   */
  static permuteDecls(analysis: Analysis, slots: any[], order: any): string {
    const text = analysis.text;
    const src = new Map(slots.map(i => {
      const [a, b] = ModelEditor.declRange(analysis, i);
      return [i, text.slice(a, b)];
    }));
    let out = text;
    for (let k = slots.length - 1; k >= 0; k--) {
      const [a, b] = ModelEditor.declRange(analysis, slots[k]);
      out = ModelEditor.splice(out, a, b, src.get(order[k]));
    }
    return out;
  }

  /**
   * Renames a symbol everywhere it occurs, without touching the rest of the
   * text.
   *
   * @param {Analysis} analysis The analysis.
   * @param {string} symId The id of the symbol (from analysis.check.symbols).
   * @param {Object} newName The new identifier.
   * @return {Object} {text, count} or {error}.
   */
  static renameSymbol(analysis: Analysis, symId: string, newName: any) {
    const err = ModelEditor.validIdentifier(newName);
    if (err) {
      return { error: err };
    }
    const sym = analysis.check.symbols.get(symId);
    if (!sym) {
      return { error: I18n.t("Unknown symbol") };
    }
    if (sym.builtin) {
      return { error: I18n.t("{name} is built in and cannot be renamed", { name: sym.name }) };
    }
    if (sym.name === newName) {
      return { text: analysis.text, count: 0 };
    }
    if (!sym.local) {
      const clash = analysis.global(newName);
      if (clash) {
        return { error: I18n.t("{name} is already declared ({kind})", { name: newName, kind: PvLanguage.kindName(clash.kind) }) };
      }
    }
    const occ = analysis.occurrencesOf(symId);
    // secret, public_vars and "new n" of goals refer to bound names by name
    const extra = [];
    if (sym.kind === "name" && sym.bound) {
      for (const o of analysis.check.occurrences) {
        const s = analysis.check.symbols.get(o.sym);
        if (s && s !== sym && s.kind === "name" && s.bound && s.name === sym.name && !occ.includes(o)) {
          extra.push(o);
        }
      }
    }
    const all = [...occ, ...extra].sort((a, b) => b.start - a.start);
    let text = analysis.text;
    const seen = new Set();
    for (const o of all) {
      if (seen.has(o.start)) {
        continue;
      }
      seen.add(o.start);
      if (text.slice(o.start, o.end) !== sym.name) {
        continue;
      }
      text = ModelEditor.splice(text, o.start, o.end, newName);
    }
    // hints of the notation and keys of the layout may name the symbol too
    text = ModelEditor.renameInHints(text, sym.name, newName);
    if (sym.kind === "process") {
      const a2 = Analysis.of(text);
      const meta = StudioMeta.renameLane(a2.meta, "R:" + sym.name, "R:" + newName);
      if (JSON.stringify(meta) !== JSON.stringify(a2.meta)) {
        text = StudioMeta.write(text, a2.metaRange, meta);
      }
    }
    return { text, count: seen.size };
  }

  /**
   * Renames the explicit targets of deferred notation hints ("@notation '...'
   * name").
   *
   * @param {string} text The text.
   * @param {number} from The old identifier.
   * @param {number} to The new identifier.
   * @return {string} The text.
   */
  static renameInHints(text: string, from: any, to: number): string {
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(@(?:notation|infix|prefix|postfix|label|color|hide|symmetric)\\s+(?:'(?:[^'\\\\]|\\\\.)*'\\s+)?)" + esc + "(?![A-Za-z0-9_'])", "g");
    return text.replace(re, "$1" + to);
  }

  /**
   * Finds the style in which a model writes its new names and its lets:
   * that of CryptoVerif, "k <-R key;" and "x <- M;", when most of those that
   * can be written both ways are written so, and that of ProVerif,
   * "new k: key;" and "let x = M in", otherwise.
   *
   * @param {Object} program The program.
   * @return {string} "cryptoverif" or "proverif".
   */
  static styleOf(program: any): string {
    let arrows = 0;
    let words = 0;
    Ast.walk(program, node => {
      let both = false;
      let arrow = false;
      if (node.kind === "New" || node.kind === "TNew") {
        both = !node.newArgs;
        arrow = !!node.random;
      } else if (node.kind === "Let" || node.kind === "TLet") {
        both = !node.else && Ast.basicPattern(node.pattern);
        arrow = !!node.arrow;
      }
      if (both && arrow) {
        arrows++;
      } else if (both) {
        words++;
      }
    });
    return arrows > words ? "cryptoverif" : "proverif";
  }

  /**
   * Rewrites the new names and the lets of a model in a style: that of
   * CryptoVerif, "k <-R key;" and "x <- M;", or that of ProVerif,
   * "new k: key;" and "let x = M in". ProVerif reads both, in processes and
   * in terms. Only the words that differ are edited, so the layout and the
   * comments stay. What has no arrow form stays as it is: a let of another
   * pattern than a variable or _, or with an else branch, and a name with
   * arguments. A let with an arrow that becomes "let ... in" just before the
   * else of an enclosing test is put in parentheses, so that the else keeps
   * its owner.
   *
   * @param {Analysis} analysis The analysis of the model, which parses.
   * @param {string} style "cryptoverif" or "proverif".
   * @return {Object} {text, count}: the new text, and how many new names
   *   and lets were rewritten.
   */
  static restyle(analysis: Analysis, style: string) {
    const text = analysis.text;
    const tokens = analysis.tokens;
    const arrows = style === "cryptoverif";
    const edits = [];
    const wraps = [];
    const done = new Set();
    let count = 0;
    // I find the first token that starts at an offset or after it
    const next = offset => {
      let low = 0;
      let high = tokens.length;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (tokens[middle].start < offset) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }
      return low < tokens.length ? tokens[low] : null;
    };
    // I remove a keyword with the blank that follows it
    const drop = token => {
      let end = token.end;
      while (end < text.length && /\s/.test(text.charAt(end))) {
        end++;
      }
      edits.push({ start: token.start, end: end, text: "", order: 2 });
    };
    // I turn a separator ("=", ":", "in" and their arrows) into another one,
    // and drop the blank before it unless it holds a comment
    const swap = (from, token, word) => {
      const gap = text.slice(from, token.start);
      const before = /^\s*$/.test(gap) ? (word === ";" || word === ":" ? "" : " ") : gap;
      const after = /\s/.test(text.charAt(token.end)) ? "" : " ";
      edits.push({ start: from, end: token.end, text: before + word + after, order: 2 });
    };
    const is = (token, type, at = null) => !!token && token.type === type && (at === null || token.start === at);
    Ast.walk(analysis.program, node => {
      const kind = node.kind;
      if (done.has(node) || !["New", "TNew", "Let", "TLet"].includes(kind)) {
        return;
      }
      done.add(node);
      const start = kind === "New" || kind === "Let" ? node.hstart : node.start;
      if (!(start >= 0)) {
        return;
      }
      if (kind === "New" || kind === "TNew") {
        if (node.newArgs || !!node.random === arrows) {
          return;
        }
        const separator = next(node.name.end);
        if (arrows) {
          const keyword = next(start);
          if (!is(keyword, "NEW", start) || !is(separator, "COLON")) {
            return;
          }
          drop(keyword);
          swap(node.name.end, separator, "<-R");
        } else {
          if (!is(separator, "RANDOM")) {
            return;
          }
          edits.push({ start: start, end: start, text: "new ", order: 1 });
          swap(node.name.end, separator, ":");
        }
        count++;
        return;
      }
      if (node.else || !Ast.basicPattern(node.pattern) || !!node.arrow === arrows) {
        return;
      }
      const separator = next(node.pattern.end);
      const close = next(node.value.end);
      if (arrows) {
        const keyword = next(start);
        if (!is(keyword, "LET", start) || !is(separator, "EQUAL")) {
          return;
        }
        drop(keyword);
        swap(node.pattern.end, separator, "<-");
        // A let at the end of a process may have no "in": I check that it has one
        if (is(close, "IN") && (kind === "TLet" || node.hasIn)) {
          swap(node.value.end, close, ";");
        }
      } else {
        if (!is(separator, "LEFTARROW")) {
          return;
        }
        edits.push({ start: start, end: start, text: "let ", order: 1 });
        swap(node.pattern.end, separator, "=");
        if (is(close, "SEMI")) {
          swap(node.value.end, close, "in");
        }
        // I put the let in parentheses when an else follows it: the else
        // belongs to an enclosing test, and the let would take it
        if (is(next(node.end), "ELSE")) {
          wraps.push({ start: start, end: node.end });
        }
      }
      count++;
    });
    // I keep the parentheses of the outermost let only, which are enough
    wraps.filter(wrap => !wraps.some(other => other !== wrap && other.start <= wrap.start && other.end >= wrap.end)).forEach(wrap => {
      edits.push({ start: wrap.start, end: wrap.start, text: "(", order: 0 });
      edits.push({ start: wrap.end, end: wrap.end, text: ")", order: 0 });
    });
    // I apply the edits from the end, so that the offsets stay right; at one
    // offset, I replace text first, then insert the keyword, then the
    // parenthesis before it
    edits.sort((a, b) => b.start - a.start || b.order - a.order);
    let result = text;
    edits.forEach(edit => {
      result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    });
    return { text: result, count: count };
  }

  /**
   * Rewrites the header "let Name(params) =" of a process declaration,
   * keeping its body.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the ProcessDecl.
   * @param {Array} fields {name, params}; a new name also renames every call.
   * @return {Object} {text} or {error}.
   */
  static editProcessHeader(analysis: Analysis, index: number, { name, params = "" }: any) {
    const d = analysis.program.decls[index];
    if (!d || d.kind !== "ProcessDecl") {
      return { error: I18n.t("not a process declaration") };
    }
    const p = String(params || "").trim();
    if (p) {
      const r = PvParser.parseFragment("let P(" + p + ") = 0.", "decl");
      if (r.errors.length) {
        return { error: I18n.t("parameters") + ": " + (r.errors[0].detail || r.errors[0].message) };
      }
    }
    const text = analysis.text;
    const after = d.params && d.params.length ? d.params[d.params.length - 1].type.end : d.name.end;
    const eq = text.indexOf("=", after);
    if (eq < 0 || eq > d.body.start) {
      return { error: I18n.t("cannot locate the header of this process") };
    }
    let out = text.slice(0, d.start) + ("let " + d.name.name + (p ? "(" + p + ")" : "") + " =") + text.slice(eq + 1);
    const newName = String(name === undefined || name === null ? d.name.name : name).trim();
    if (newName && newName !== d.name.name) {
      const a1 = Analysis.of(out);
      const occ = a1.check.occurrences.find(o => o.def && o.start === d.start + 4);
      if (!occ) {
        return { error: I18n.t("cannot rename this process") };
      }
      const r = ModelEditor.renameSymbol(a1, occ.sym, newName);
      if (r.error) {
        return { error: r.error };
      }
      out = r.text;
    }
    return { text: out };
  }

  /**
   * Sets a ProVerif setting, removing its declaration when the value is the
   * default.
   *
   * A setting at its default value is shown by the studio but not written in
   * the model: ProVerif behaves the same and the model stays short.
   *
   * @param {Analysis} analysis The analysis.
   * @param {string} name The setting.
   * @param {string} value The value text, or null to remove the setting.
   * @return {Object} {text}.
   */
  static setSetting(analysis: Analysis, name: string, value: string) {
    const decls = analysis.program.decls;
    const indices = [];
    decls.forEach((d, i) => {
      if (d.kind === "SetDecl" && d.name.name === name) {
        indices.push(i);
      }
    });
    const remove = value === null || value === undefined || value === "" || PvSettings.isDefault(name, value);
    let text = analysis.text;
    let a = analysis;
    // I remove from the last one, so that the earlier ranges stay valid
    for (const i of indices.slice(remove ? 0 : 1).reverse()) {
      text = ModelEditor.deleteDecl(a, i).text;
      a = Analysis.of(text);
    }
    if (remove) {
      return { text };
    }
    const v = String(value);
    const src = /^[A-Za-z][A-Za-z0-9_']*$|^[0-9]+$/.test(v) ? "set " + name + " = " + v + "." : "set " + name + " = " + JSON.stringify(v) + ".";
    const keep = indices.length ? a.program.decls.findIndex(d => d.kind === "SetDecl" && d.name.name === name) : -1;
    if (keep >= 0) {
      return { text: ModelEditor.replaceDecl(a, keep, src).text };
    }
    return { text: ModelEditor.insertDecl(a, src).text };
  }

  /**
   * Replaces the options (modifiers such as [private]) of a declaration.
   *
   * @param {Analysis} analysis The analysis.
   * @param {number} index The index of the declaration.
   * @param {Array} names The option names to keep or add, in order.
   * @return {Object} {text} or {error}.
   */
  static setDeclOptions(analysis: Analysis, index: number, names: any[]) {
    const d = analysis.program.decls[index];
    if (!d || !("options" in d)) {
      return { error: I18n.t("this declaration has no options") };
    }
    const old = new Map((d.options || []).map(o => [o.name.name, o]));
    const options = names.map(n => old.get(n) || { name: { name: n, start: -1, end: -1 }, value: null, braces: false });
    const decls = analysis.program.decls.slice();
    decls[index] = { ...d, options };
    return { text: ModelEditor.applyProgram(analysis, { ...analysis.program, decls }) };
  }

  /**
   * Writes the metadata of the studio into the text.
   *
   * @param {Analysis} analysis The analysis.
   * @param {Object} meta The new metadata object.
   * @return {string} The new text.
   */
  static writeMeta(analysis: Analysis, meta: any): string {
    return StudioMeta.write(analysis.text, analysis.metaRange, meta);
  }

  /**
   * Adds a call of a process macro to the main process, in parallel with the
   * rest.
   *
   * @param {Analysis} analysis The analysis.
   * @param {string} name The macro.
   * @param {Object} opts {replicate, args}.
   * @return {Object} {text}.
   */
  static addCallToMain(analysis: Analysis, name: string, { replicate = true, args = null }: any = {}) {
    const call = { kind: "Call", name: { name, start: -1, end: -1 }, args: args && args.length ? args.map(n => ({ kind: "Ident", name: n, start: -1, end: -1 })) : null };
    const proc = replicate ? { kind: "Repl", body: call, index: null, foreach: false } : call;
    const prog = analysis.program;
    return { text: ModelEditor.applyProgram(analysis, { ...prog, process: prog.process ? ModelEditor.appendParallel(prog.process, proc) : proc }) };
  }

  /**
   * Adds a new role: a process macro, and optionally its call in the main
   * process.
   *
   * @param {Analysis} analysis The analysis.
   * @param {string} name The name of the role.
   * @param {Object} params Its parameters ("sk: skey, pk: pkey").
   * @param {Object} opts {replicate, call}.
   * @return {Object} {text}.
   */
  static addRole(analysis: Analysis, name: string, params: any = "", { replicate = true, call = true }: any = {}) {
    const err = ModelEditor.validIdentifier(name);
    if (err) {
      throw new EditError(err);
    }
    if (analysis.global(name)) {
      throw new EditError(I18n.t("{name} is already declared", { name: name }));
    }
    const paramSrc = params.trim() ? "(" + params.trim() + ")" : "";
    const parsed = PvParser.parseFragment("let " + name + paramSrc + " =\n  0.", "decl");
    if (parsed.errors.length) {
      throw new EditError(I18n.t("parameters") + ": " + (parsed.errors[0].detail || parsed.errors[0].message));
    }
    let { text } = ModelEditor.insertDecl(analysis, parsed.node);
    if (call) {
      const a2 = Analysis.of(text);
      const argNames = (parsed.node.params || []).map(p => p.name.name);
      text = ModelEditor.addCallToMain(a2, name, { replicate, args: argNames }).text;
    }
    return { text };
  }

  /**
   * Adds a process as a new parallel branch where the main process forks, or
   * in parallel with all of it.
   *
   * @param {Object} main The main process.
   * @param {Object} proc The process to add.
   * @return {Object} The new main process.
   */
  static appendParallel(main: any, proc: any) {
    const walk = p => {
      switch (p.kind) {
        case "New":
        case "In":
        case "Out":
        case "Event":
        case "Insert":
        case "Phase":
        case "Sync":
          return { ...p, next: walk(p.next) };

        case "Let":
          if (!p.else) {
            return { ...p, then: walk(p.then) };
          }
          return { kind: "Par", left: p, right: proc };

        case "Paren":
          return { ...p, body: walk(p.body) };

        case "Nil":
          return proc;

        case "Par": {
          let cur = p;
          const items = [];
          while (cur.kind === "Par") {
            items.push(cur.left);
            cur = cur.right;
          }
          items.push(cur, proc);
          return items.reduceRight((acc, it) => (acc ? { kind: "Par", left: it, right: acc } : it), null);
        }

        default:
          return { kind: "Par", left: p, right: proc };
      }
    };
    return walk(main);
  }
}
// ----------------------------------------------------------------
