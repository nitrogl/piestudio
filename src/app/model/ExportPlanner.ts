/**
 * Splitting a model into several .pv files when ProVerif cannot verify all
 * its goals in one run.
 *
 * ProVerif refuses, in one run:
 *
 *   - reachability or correspondence queries, noninterf or weaksecret together
 *     with a biprocess (choice[,] or diff[,]): "Queries are incompatible with choice";
 *   - any of them together with "equivalence P Q": "Queries are incompatible with equivalence".
 *
 * Splits such a model into consistent files: the equivalence on the
 * biprocess, and the other goals on the process projected on the left (and
 * optionally the right) side of every choice. Other modes put each kind of
 * goal, or each declaration of goals, in its own file. PvSettings at their
 * default value are dropped (ProVerif behaves the same without them), and so
 * is the layout comment of the studio.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class ExportPlanner {
  /**
   * Gives the name a goal declares, for the name of its file.
   *
   * @param {Object} decl The declaration of the goal.
   * @return {string|null} The name, or null.
   */
  static declaredName(decl: any): string | null {
    const name = decl.name || (decl.items && decl.items[0] && decl.items[0].name);
    return name ? name.name : null;
  }

  /**
   * Tells whether a tree contains choice[,] or diff[,].
   *
   * @param {Object} node The tree.
   * @return {boolean} True when it does.
   */
  static containsChoice(node: any): boolean {
    let found = false;
    const visit = n => {
      if (found || !n || typeof n !== "object") {
        return;
      }
      if (Array.isArray(n)) {
        n.forEach(visit);
        return;
      }
      if (n.kind === "Choice" || n.kind === "PChoice") {
        found = true;
        return;
      }
      for (const k of Object.keys(n)) {
        if (k !== "leadingComments" && k !== "trailingComments" && k !== "features") {
          visit(n[k]);
        }
      }
    };
    visit(node);
    return found;
  }

  /**
   * Replaces every choice[L, R] by one of its sides.
   *
   * @param {Object} node The tree.
   * @param {string} side 'left' or 'right'.
   * @return {Object} The projected copy.
   */
  static project(node: any, side: string) {
    if (!node || typeof node !== "object") {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(x => ExportPlanner.project(x, side));
    }
    if (node.kind === "Choice" || node.kind === "PChoice") {
      return ExportPlanner.project(side === "left" ? node.left : node.right, side);
    }
    const out = {};
    for (const k of Object.keys(node)) {
      out[k] = (k === "leadingComments" || k === "trailingComments") ? node[k] : ExportPlanner.project(node[k], side);
    }
    return out;
  }

  /**
   * Projects a whole program; untouched declarations keep their identity.
   *
   * @param {Object} program The program.
   * @param {string} side 'left' or 'right'.
   * @return {Object} The projected program.
   */
  static projectChoice(program: any, side: string) {
    const decls = program.decls.map(d => (ExportPlanner.containsChoice(d) && (d.kind === "ProcessDecl" || d.kind === "LetFunDecl") ? ExportPlanner.project(d, side) : d));
    const process = program.process && ExportPlanner.containsChoice(program.process) ? ExportPlanner.project(program.process, side) : program.process;
    return { ...program, decls, process };
  }

  /**
   * Describes a declaration in one line.
   *
   * @param {Analysis} analysis The analysis.
   * @param {Object} d The declaration.
   * @return {string} The text.
   */
  static describe(analysis: Analysis, d: any): string {
    const t = analysis.text.slice(d.start, d.end).replace(/\s+/g, " ");
    return t.length > 90 ? t.slice(0, 87) + "..." : t;
  }

  /**
   * Classifies the security goals of a model.
   *
   * @param {Analysis} analysis The analysis.
   * @return {Object} {goals, choice, equivalence, incompatible}.
   */
  static classifyGoals(analysis: Analysis) {
    const prog = analysis.program;
    const goals = [];
    prog.decls.forEach((d, index) => {
      const label = ExportPlanner.describe(analysis, d);
      if (d.kind === "QueryDecl") {
        goals.push({ index, kind: "query", decl: d, label });
      } else if (d.kind === "NonInterfDecl") {
        goals.push({ index, kind: "noninterf", decl: d, label });
      } else if (d.kind === "WeakSecretDecl") {
        goals.push({ index, kind: "weaksecret", decl: d, label });
      } else if (d.kind === "LemmaDecl") {
        goals.push({ index, kind: d.keyword, decl: d, label, auxiliary: true });
      }
    });
    const choice = !!analysis.check.hasChoice;
    if (choice) {
      goals.push({ kind: "biprocess", label: I18n.t("Observational equivalence of the biprocess (choice)") });
    }
    if (prog.equivalence) {
      goals.push({ kind: "equivalence", label: I18n.t("Observational equivalence of the two processes") });
    }
    const real = goals.filter(g => g.kind === "query" || g.kind === "noninterf" || g.kind === "weaksecret");
    let incompatible = null;
    if (prog.equivalence && real.length) {
      incompatible = I18n.t("Queries are incompatible with equivalence");
    } else if (choice && real.length) {
      incompatible = I18n.t("Queries are incompatible with choice");
    }
    return { goals, choice, equivalence: !!prog.equivalence, incompatible };
  }

  /**
   * Removes declarations from a text.
   *
   * @param {string} text The text.
   * @param {Analysis} analysis Its analysis.
   * @param {Array} indices The indices of the declarations.
   * @return {string} The new text.
   */
  static removeDecls(text: string, analysis: Analysis, indices: any): string {
    const ranges = [...indices].map(i => {
      let [a, b] = ModelEditor.declRange(analysis, i);
      while (b < text.length && /[ \t]/.test(text[b])) {
        b++;
      }
      if (text[b] === "\n") {
        b++;
      }
      return [a, b];
    }).sort((x, y) => y[0] - x[0]);
    for (const [a, b] of ranges) {
      text = text.slice(0, a) + text.slice(b);
    }
    return text;
  }

  /**
   * Drops the settings at their default value.
   *
   * @param {string} text The text.
   * @return {string} The new text.
   */
  static dropDefaultSettings(text: string): string {
    const a = Analysis.of(text);
    const idx = [];
    a.program.decls.forEach((d, i) => {
      if (d.kind === "SetDecl" && PvSettings.isDefault(d.name.name, d.value.value)) {
        idx.push(i);
      }
    });
    return idx.length ? ExportPlanner.removeDecls(text, a, idx) : text;
  }

  /**
   * Gives the base name of a file.
   *
   * @param {string} name The file name.
   * @return {string} The name without .pv.
   */
  static baseName(name: string): string {
    return (name || "model.pv").replace(/\.pv$/i, "");
  }

  /**
   * Plans the files of an export.
   *
   * @param {Analysis} analysis The analysis of the model.
   * @param {Object} options {fileName, mode: 'auto' | 'kind' | 'each', sides:
   *   'left' | 'right' | 'both', omitDefaults}.
   * @return {Object} {goals, choice, equivalence, incompatible, needSplit,
   *   files: [{name, description, goals, text, errors}]}.
   */
  static plan(analysis: Analysis, options: any = {}) {
    const { fileName = "model.pv", mode = "auto", sides = "left", omitDefaults = true } = options;
    const base = ExportPlanner.baseName(fileName);
    const cls = ExportPlanner.classifyGoals(analysis);
    const prog = analysis.program;
    const queryGoals = cls.goals.filter(g => g.kind === "query" || g.kind === "noninterf" || g.kind === "weaksecret");
    const allQueryIdx = queryGoals.map(g => g.index);
    const files = [];
    const header = desc => "(* " + base + ".pv: " + desc + ".\n   " + I18n.t("Generated by PieStudio; verify with: proverif <this file>").replace(/\*\)/g, "* )") + " *)\n\n";
    let groups;
    if (mode === "each") {
      groups = queryGoals.map(g => ({ indices: [g.index], label: g.label, tag: String(g.kind) + g.index }));
    } else if (mode === "kind") {
      groups = [];
      const qs = queryGoals.filter(g => g.kind === "query");
      if (qs.length) {
        groups.push({ indices: qs.map(g => g.index), label: I18n.t("reachability and correspondence queries"), tag: "queries" });
      }
      for (const g of queryGoals.filter(x => x.kind !== "query")) {
        groups.push({ indices: [g.index], label: g.label, tag: g.kind + "-" + (ExportPlanner.declaredName(g.decl) || g.index) });
      }
    } else {
      groups = queryGoals.length ? [{ indices: allQueryIdx, label: I18n.t("queries"), tag: "queries" }] : [];
    }
    const needSplit = !!cls.incompatible;
    const finish = (name, description, text, goals) => {
      let t = StudioMeta.strip(text);
      if (omitDefaults) {
        t = ExportPlanner.dropDefaultSettings(t);
      }
      // lemmas whose matching query is not in this file would be refused
      for (let k = 0; k < 3; k++) {
        const a = Analysis.of(t);
        const bad = new Set();
        for (const d of a.diagnostics) {
          if (d.code === "lemma-unmatched" || /Lemma not used because there is no matching query/.test(d.message)) {
            const i = a.program.decls.findIndex(x => x.start <= d.start && d.end <= x.end);
            if (i >= 0) {
              bad.add(i);
            }
          }
        }
        if (!bad.size) {
          break;
        }
        t = ExportPlanner.removeDecls(t, a, bad);
      }
      const final = header(description) + t.replace(/^\s+/, "");
      const a = Analysis.of(final);
      files.push({ name, description, goals, text: final, errors: a.errors });
    };
    if (!needSplit && mode === "auto") {
      finish(base + ".pv", I18n.t("all goals (no split needed)"), analysis.text, cls.goals.map(g => g.label));
      return { ...cls, needSplit, files };
    }
    if (cls.choice || cls.equivalence) {
      const t = ExportPlanner.removeDecls(analysis.text, analysis, allQueryIdx);
      finish(base + ".equiv.pv", cls.equivalence ? I18n.t("observational equivalence of the two processes") : I18n.t("observational equivalence (biprocess)"), t,
        [cls.equivalence ? "equivalence P Q" : I18n.t("biprocess (choice)")]);
    }
    const variants = [];
    if (cls.equivalence) {
      const list = sides === "both" ? [0, 1] : [sides === "right" ? 1 : 0];
      for (const s of list) {
        const p = prog.equivalence[s];
        const r = ModelEditor.mainRange(analysis);
        const text = analysis.text.slice(0, r[0]) + "process\n" + PvPrinter.process(p.kind === "Paren" ? p.body : p, {}, 1) + analysis.text.slice(r[1]);
        variants.push({ text, suffix: list.length > 1 ? (s === 0 ? ".P1" : ".P2") : "", note: s === 0 ? I18n.t("first process of the equivalence") : I18n.t("second process of the equivalence") });
      }
    } else if (cls.choice) {
      const list = sides === "both" ? ["left", "right"] : [sides];
      for (const s of list) {
        const text = ModelEditor.applyProgram(analysis, ExportPlanner.projectChoice(prog, s));
        variants.push({ text, suffix: list.length > 1 ? "." + s : "", note: s === "left" ? I18n.t("choice[,] projected on its left side") : I18n.t("choice[,] projected on its right side") });
      }
    } else {
      variants.push({ text: analysis.text, suffix: "", note: null });
    }
    for (const v of variants) {
      const av = Analysis.of(v.text);
      for (const g of groups) {
        const others = allQueryIdx.filter(i => !g.indices.includes(i));
        const t = ExportPlanner.removeDecls(v.text, av, others);
        const nm = groups.length > 1 || mode !== "auto" ? base + "." + g.tag + v.suffix + ".pv" : base + ".queries" + v.suffix + ".pv";
        finish(nm, String(g.label) + (v.note ? ", " + v.note : ""), t, g.indices.map(i => (cls.goals.find(x => x.index === i) || {}).label));
      }
      if (!groups.length && !cls.choice && !cls.equivalence) {
        finish(String(base) + v.suffix + ".pv", I18n.t("model"), v.text, []);
      }
    }
    return { ...cls, needSplit, files };
  }
}
// ----------------------------------------------------------------
