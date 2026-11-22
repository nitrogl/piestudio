/**
 * The names of an attack trace as its chart shows them.
 *
 * ProVerif numbers the names that a run makes and the sessions that it
 * opens (Na_2, k_4, a_1). The chart drops the number of a name that is
 * alone, writes the second of two with a prime (Na, Na'), and numbers three
 * or more from 1, in the order in which they come (a_1, a_2, a_3); a name
 * without a number keeps it. The sessions of a process are told apart the
 * same way. A term too long for the chart shows the messages sent before
 * it by the names that ProVerif gives them (~M), as few as it needs, and
 * the message that such a name stands for says so.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class TraceNames {
  /**
   * The length of the code of a term above which the term shows the
   * messages sent before it by their names.
   *
   * @type {number}
   */
  static LONG = 90;

  /**
   * The terms of each kind of step.
   *
   * @type {Object}
   */
  static FIELDS = {
      new: ["value"]
    , out: ["channel", "message"]
    , in: ["channel", "message"]
    , comm: ["channel", "message"]
    , event: ["event"]
    , "event-executed": ["event"]
    , insert: ["entry"]
    , get: ["entry"]
    , "attacker-knows": ["message"]
  };

  marks: Map<string, any>;
  terms: Map<string, any>;
  sessions: any[];
  defined: Map<number, any>;

  /**
   * Creates the names of no trace: of gives those of a trace.
   */
  constructor() {
    this.marks = new Map();
    this.terms = new Map();
    this.sessions = [];
    this.defined = new Map();
  }

  /**
   * Names the terms and the sessions of a trace.
   *
   * @param {Object} view The trace, as built by TraceMapper.
   * @return {TraceNames} The names.
   */
  static of(view: any): TraceNames {
    const names = new TraceNames();
    const items = [];
    view.steps.forEach((step, i) => (TraceNames.FIELDS[step.kind] || []).forEach(field => {
      if (step[field] === undefined || step[field] === null || step[field] === "") {
        return;
      }
      const text = String(step[field]);
      const parsed = PvParser.parseFragment(text, "term");
      items.push({ step: i, field: field, text: text, node: parsed.node && parsed.errors.length === 0 ? parsed.node : null });
    }));
    const order = [];
    const seen = new Set();
    const visit = id => {
      if (!seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
    };
    items.forEach(item => (item.node ? TraceNames.idents(item.node, visit) : TraceNames.textIdents(item.text).forEach(visit)));
    const made = new Set<string>(view.steps.filter(step => step.kind === "new" && step.value).map(step => String(step.value)));
    names.marks = TraceNames.mark(order, made);
    names.sessions = TraceNames.sessionMarks(view.lanes);
    const shortcuts = [];
    view.steps.forEach((step, i) => {
      if ((step.kind === "out" || step.kind === "comm") && step.var && step.message) {
        const parsed = PvParser.parseFragment(String(step.message), "term");
        if (parsed.node && parsed.errors.length === 0) {
          shortcuts.push({ step: i, key: TraceNames.key(parsed.node), name: step.var });
        }
      }
    });
    const used = new Map();
    items.forEach(item => {
      const node = item.node ? TraceNames.shorten(item.node, shortcuts.filter(s => s.step < item.step), names, used) : null;
      names.terms.set(item.step + "." + item.field, node);
    });
    const ordered = Array.from(used.values()).sort((one, other) => one.step - other.step);
    ordered.forEach((shortcut, i) => {
      shortcut.mark = ordered.length === 1 ? "" : ordered.length === 2 ? (i === 0 ? "" : "'") : String(i + 1);
      names.defined.set(shortcut.step, shortcut);
    });
    names.terms.forEach((node, key) => {
      if (node) {
        names.terms.set(key, TraceNames.rename(node, id => names.shown(id, used)));
      }
    });
    return names;
  }

  /**
   * Visits the names of a term, in order.
   *
   * @param {Object} node The term.
   * @param {function(string)} visit Receives each name.
   */
  static idents(node: any, visit: (id: string) => void) {
    if (Array.isArray(node)) {
      node.forEach(child => TraceNames.idents(child, visit));
      return;
    }
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.kind === "Ident") {
      visit(node.name);
      return;
    }
    Object.keys(node).forEach(key => {
      if (key !== "fn") {
        TraceNames.idents(node[key], visit);
      }
    });
  }

  /**
   * Gives the names of a term that ProVerif printed and that does not parse:
   * the identifiers that no "(" follows.
   *
   * @param {string} text The term.
   * @return {Array<string>} The names.
   */
  static textIdents(text: string): string[] {
    return (text.match(/(?<![\w'~-])[A-Za-z][\w']*(?![\w'(])/g) || []);
  }

  /**
   * Marks the names: those of a base (the name without its number) are told
   * apart by nothing when alone, by a prime for the second of two, by a
   * number from 1 when they are more; a name without a number keeps it. The
   * names that the attacker makes (a, a_1) and those that a step of the
   * trace does not make are written as they are, without the notation of the
   * model.
   *
   * @param {Array<string>} order The names, in the order in which they come.
   * @param {Set<string>} made The names that a step of the trace makes.
   * @return {Map<string, Object>} Each name with its base, its mark, and
   *   whether it shows the notation of its base.
   */
  static mark(order: string[], made: Set<string>) {
    const groups = new Map();
    order.forEach(id => {
      const base = id.replace(/_\d+$/, "");
      if (!groups.has(base)) {
        groups.set(base, []);
      }
      groups.get(base).push(id);
    });
    const marks = new Map();
    groups.forEach((ids, base) => {
      const bare = ids.includes(base);
      const others = ids.filter(id => id !== base);
      const mark = new Map();
      if (bare) {
        mark.set(base, "");
      }
      if (ids.length === 2) {
        mark.set(bare ? others[0] : ids[0], bare ? "'" : "");
        if (!bare) {
          mark.set(ids[1], "'");
        }
      } else {
        (bare ? others : ids).forEach((id, i) => mark.set(id, ids.length === 1 ? "" : String(i + 1)));
      }
      const clash = ids.some(id => {
        const shown = TraceNames.code(base, mark.get(id));
        return shown !== id && order.includes(shown) && !ids.includes(shown);
      });
      ids.forEach(id => {
        const attacker = /^a(_\d+)?$/.test(id) && !made.has(id);
        const notation = made.has(id) || (!attacker && id === base);
        marks.set(id, clash ? { base: id, mark: "", notation: notation && id === base } : { base: base, mark: mark.get(id), notation: notation });
      });
    });
    return marks;
  }

  /**
   * Marks the sessions of the processes: a process with one session shows
   * its name alone, with two a prime on the second, with more a number from
   * 1, in the order of the lanes.
   *
   * @param {Array<Object>} lanes The lanes of the trace.
   * @return {Array<Object>} The name and the mark of each lane.
   */
  static sessionMarks(lanes: any[]) {
    const counts = new Map();
    lanes.forEach(lane => {
      if (lane.copy && lane.copy.length) {
        counts.set(lane.role, (counts.get(lane.role) || 0) + 1);
      }
    });
    const seen = new Map();
    return lanes.map(lane => {
      if (!lane.copy || !lane.copy.length) {
        return { name: lane.label, mark: "" };
      }
      const count = counts.get(lane.role);
      const i = seen.get(lane.role) || 0;
      seen.set(lane.role, i + 1);
      return { name: lane.role, mark: count === 1 ? "" : count === 2 ? (i === 0 ? "" : "'") : String(i + 1) };
    });
  }

  /**
   * Writes a name with its mark, as code.
   *
   * @param {string} base The name.
   * @param {string} mark Its mark: nothing, a prime or a number.
   * @return {string} The code.
   */
  static code(base: string, mark: string): string {
    return mark === "" ? base : mark === "'" ? base + "'" : base + "_" + mark;
  }

  /**
   * Gives the code of a term that ProVerif printed, the same for the same
   * term.
   *
   * @param {Object} node The term.
   * @return {string} The code.
   */
  static key(node: any): string {
    try {
      return PvPrinter.term(node).replace(/\s+/g, "");
    } catch (e) {
      return null;
    }
  }

  /**
   * Shortens a term that is too long: its largest parts that are messages
   * sent before become their names, until it is short enough.
   *
   * @param {Object} node The term.
   * @param {Array<Object>} shortcuts The messages sent before it, with their
   *   name and their step.
   * @param {TraceNames} names The names of the trace.
   * @param {Map<string, Object>} used The names of messages used so far, to
   *   which those used here are added.
   * @return {Object} The term.
   */
  static shorten(node: any, shortcuts: any[], names: TraceNames, used: Map<string, any>) {
    const length = term => PvPrinter.term(TraceNames.rename(term, id => names.shown(id, null))).length;
    let shortened = node;
    while (shortcuts.length && length(shortened) > TraceNames.LONG) {
      const parts = [];
      TraceNames.parts(shortened, parts);
      const best = parts.map(part => ({ part: part, shortcut: shortcuts.find(s => s.key === part.key) })).filter(found => found.shortcut)
        .sort((one, other) => other.part.key.length - one.part.key.length)[0];
      if (!best) {
        break;
      }
      if (!used.has(best.shortcut.name)) {
        used.set(best.shortcut.name, { name: best.shortcut.name, step: best.shortcut.step, mark: "" });
      }
      shortened = TraceNames.replace(shortened, best.part.node, { kind: "Ident", name: best.shortcut.name, shortcut: true });
    }
    return shortened;
  }

  /**
   * Lists the parts of a term that a name may stand for, with their code.
   *
   * @param {Object} node The term.
   * @param {Array<Object>} parts The parts, to which they are added.
   */
  static parts(node: any, parts: any[]) {
    if (Array.isArray(node)) {
      node.forEach(child => TraceNames.parts(child, parts));
      return;
    }
    if (!node || typeof node !== "object" || !node.kind || node.shortcut) {
      return;
    }
    if (node.kind !== "Ident") {
      const key = TraceNames.key(node);
      if (key) {
        parts.push({ node: node, key: key });
      }
    }
    Object.keys(node).forEach(key => {
      if (key !== "fn") {
        TraceNames.parts(node[key], parts);
      }
    });
  }

  /**
   * Replaces a part of a term.
   *
   * @param {Object} node The term.
   * @param {Object} part The part.
   * @param {Object} by What takes its place.
   * @return {Object} The new term.
   */
  static replace(node: any, part: any, by: any) {
    if (node === part) {
      return by;
    }
    if (Array.isArray(node)) {
      return node.map(child => TraceNames.replace(child, part, by));
    }
    if (!node || typeof node !== "object") {
      return node;
    }
    const copy = {};
    Object.keys(node).forEach(key => {
      copy[key] = TraceNames.replace(node[key], part, by);
    });
    return copy;
  }

  /**
   * Renames the names of a term.
   *
   * @param {Object} node The term.
   * @param {function(string, boolean):Object} shown Gives the name shown
   *   for a name, or for the name of a message, or null to keep it.
   * @return {Object} The new term, whose names keep what they are shown as.
   */
  static rename(node: any, shown: (id: string, shortcut: boolean) => any) {
    if (Array.isArray(node)) {
      return node.map(child => TraceNames.rename(child, shown));
    }
    if (!node || typeof node !== "object") {
      return node;
    }
    if (node.kind === "Ident") {
      const name = node.trace ? null : shown(node.name, !!node.shortcut);
      return name ? { ...node, name: name.code, trace: name } : node;
    }
    const copy = {};
    Object.keys(node).forEach(key => {
      copy[key] = TraceNames.rename(node[key], shown);
    });
    return copy;
  }

  /**
   * Gives how a name shows.
   *
   * @param {string} id The name, as ProVerif printed it, or the name of a
   *   message (~M_2).
   * @param {Map<string, Object>} used The names of the messages used, or
   *   null.
   * @return {Object} Its code, its base, its mark, whether it is the name of
   *   a message and whether it shows the notation of its base; or null.
   */
  shown(id: string, used: Map<string, any>) {
    if (used && used.has(id)) {
      const shortcut = used.get(id);
      return { code: TraceNames.code("~M", shortcut.mark), base: "M", mark: shortcut.mark, shortcut: true, notation: false };
    }
    const mark = this.marks.get(id);
    return mark ? { code: TraceNames.code(mark.base, mark.mark), base: mark.base, mark: mark.mark, shortcut: false, notation: mark.notation } : null;
  }

  /**
   * Gives a term of a step as it shows.
   *
   * @param {number} step The step.
   * @param {string} field The term: message, channel, value, event or entry.
   * @return {Object|null} The term, renamed, or null when it does not parse.
   */
  term(step: number, field: string) {
    return this.terms.get(step + "." + field) || null;
  }

  /**
   * Renames the names in a term that does not parse.
   *
   * @param {string} text The term.
   * @return {string} The code.
   */
  text(text: string): string {
    return String(text).replace(/(?<![\w'~-])[A-Za-z][\w']*(?![\w'(])/g, id => {
      const name = this.shown(id, null);
      return name ? name.code : id;
    });
  }

  /**
   * Gives the name of the message that a step sends, when a term later shows
   * it by that name.
   *
   * @param {number} step The step.
   * @return {Object|null} The name of the message, as a name of a term, or
   *   null.
   */
  defines(step: number) {
    const shortcut = this.defined.get(step);
    return shortcut ? { code: TraceNames.code("~M", shortcut.mark), base: "M", mark: shortcut.mark, shortcut: true, notation: false } : null;
  }

  /**
   * Gives how a lane shows.
   *
   * @param {number} lane The lane.
   * @return {Object} Its name and its mark.
   */
  lane(lane: number) {
    return this.sessions[lane] || { name: "", mark: "" };
  }
}
// ----------------------------------------------------------------
