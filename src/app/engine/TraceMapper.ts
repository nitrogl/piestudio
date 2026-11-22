/**
 * Mapping an attack trace of ProVerif back to the actions of the model, as a
 * sequence chart.
 *
 * ProVerif numbers the actions of the process it prints at the start of its
 * output ({n}, with the macros expanded and the variables renamed) and its
 * traces refer to those numbers. It parses that listing, aligns it with the
 * model (macros expanded the same way) and so map every step of the trace to
 * the action that made it. The result is a sequence chart: one lifeline per
 * instance of a process (party and copy) plus the attacker.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class TraceMapper {
  /**
   * The children of process nodes that are followed.
   *
   * @type {Array}
   */
  static CHILDREN = ["next", "then", "else", "left", "right", "body"];

  /**
   * Parses a process listing of ProVerif and attach the occurrence numbers to
   * its nodes.
   *
   * @param {Object} listing The listing.
   * @return {Object} {root, byOcc, errors}.
   */
  static parseListing(listing: any) {
    const { text, marks } = OutputParser.stripOccurrences(listing);
    const r = PvParser.parseFragment(text, "process");
    if (!r.node) {
      return { root: null, byOcc: new Map(), errors: r.errors };
    }
    const markAt = new Map();
    for (const m of marks) {
      let o = m.offset;
      while (o < text.length && /\s/.test(text[o])) {
        o++;
      }
      markAt.set(o, m.occ);
    }
    const byOcc = new Map();
    const visit = (p, parent) => {
      if (!p || typeof p !== "object") {
        return;
      }
      if (p.kind === "Paren") {
        visit(p.body, parent);
        return;
      }
      p.parentNode = parent;
      const occ = markAt.get(p.start);
      if (occ !== undefined && p.kind !== "Par" && p.kind !== "Nil") {
        p.occ = occ;
        byOcc.set(occ, p);
      }
      for (const k of TraceMapper.CHILDREN) {
        if (p[k] && p[k].kind) {
          visit(p[k], p);
        }
      }
    };
    visit(r.node, null);
    return { root: r.node, byOcc, errors: r.errors };
  }

  /**
   * Expands the process of the model: calls become the bodies of their
   * macros.
   *
   * @param {Object} program The program.
   * @param {string} which 'process' or 'equivalence'.
   * @param {Object} eqIndex The side of the equivalence.
   * @return {Object} The expanded tree, each node {kind, src, path, chain}.
   */
  static expandSource(program: any, which: string = "process", eqIndex: any = 0) {
    const macros = new Map();
    program.decls.forEach((d, i) => {
      if (d.kind === "ProcessDecl") {
        macros.set(d.name.name, { decl: d, index: i });
      }
    });
    const rootPath = which === "process" ? ["process"] : ["equivalence", eqIndex];
    const root = which === "process" ? program.process : (program.equivalence ? program.equivalence[eqIndex] : null);
    const build = (p, path, chain, depth) => {
      if (!p) {
        return null;
      }
      if (p.kind === "Paren" || p.kind === "ProgBegin") {
        return build(p.body, [...path, "body"], chain, depth);
      }
      if (p.kind === "Call") {
        const m = macros.get(p.name.name);
        if (!m || depth > 30) {
          return { kind: "Nil", src: p, path, chain };
        }
        return build(m.decl.body, ["decls", m.index, "body"], [...chain, { name: p.name.name, callPath: path, call: p }], depth + 1);
      }
      const n = { kind: p.kind, src: p, path, chain };
      for (const k of TraceMapper.CHILDREN) {
        if (p[k] && p[k].kind) {
          n[k] = build(p[k], [...path, k], chain, depth);
        }
      }
      return n;
    };
    return build(root, rootPath, [], 0);
  }

  /**
   * Gives the signature of an action for the alignment.
   *
   * @param {number} n A node.
   * @return {Object} The signature.
   */
  static signature(n: any) {
    const p = n.src || n;
    const safe = f => {
      try {
        return f();
      } catch (e) {
        return "?";
      }
    };
    switch (n.kind) {
      case "New":
        return "New:" + (p.type && p.type.name);

      case "In":
        return "In:" + safe(() => PvPrinter.term(p.chan));

      case "Out":
        return "Out:" + safe(() => PvPrinter.term(p.chan));

      case "Event":
        return "Event:" + (p.name && p.name.name);

      case "Insert":
        return "Insert:" + (p.table && p.table.name);

      case "Get":
        return "Get:" + (p.table && p.table.name);

      case "Phase":
        return "Phase:" + p.n;

      case "Sync":
        return "Sync:" + p.n;

      default:
        return n.kind;
    }
  }

  /**
   * Lists the actions of a tree in a fixed order.
   *
   * @param {Object} root The tree.
   * @return {Array} The actions.
   */
  static linearize(root: any) {
    const out = [];
    const visit = n => {
      if (!n) {
        return;
      }
      if (n.kind === "Paren" || n.kind === "ProgBegin") {
        visit(n.body);
        return;
      }
      if (n.kind !== "Nil" && n.kind !== "Par") {
        out.push(n);
      }
      for (const k of ["left", "right", "body", "next", "then", "else"]) {
        if (n[k]) {
          visit(n[k]);
        }
      }
    };
    visit(root);
    return out;
  }

  /**
   * Aligns two sequences of actions by their signatures (longest common
   * subsequence).
   *
   * @param {Object} a A sequence.
   * @param {Object} b A sequence.
   * @return {Object} The pairs.
   */
  static align(a: any, b: any) {
    const n = a.length;
    const m = b.length;
    const sa = a.map(TraceMapper.signature);
    const sb = b.map(TraceMapper.signature);
    const W = m + 1;
    const dp = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i * W + j] = sa[i] === sb[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      }
    }
    const pairs = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (sa[i] === sb[j]) {
        pairs.push([a[i], b[j]]);
        i++;
        j++;
      } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) {
        i++;
      } else {
        j++;
      }
    }
    return pairs;
  }

  /**
   * Maps the occurrence numbers of a listing to the model.
   *
   * @param {Object} listing The listing.
   * @param {Object} program The program of the model.
   * @param {Object} opts {equivalenceIndex}.
   * @return {Object} {map: Map occ -> {path, node, chain, printed}, listing}.
   */
  static mapOccurrences(listing: any, program: any, opts: any = {}) {
    const parsed = TraceMapper.parseListing(listing);
    const map = new Map();
    if (!parsed.root || !program) {
      return { map, listing: parsed };
    }
    let root = null;
    if (program.process) {
      root = TraceMapper.expandSource(program, "process");
    } else if (program.equivalence) {
      root = TraceMapper.expandSource(program, "equivalence", opts.equivalenceIndex === undefined || opts.equivalenceIndex === null ? 0 : opts.equivalenceIndex);
    }
    const src = root ? TraceMapper.linearize(root) : [];
    const printed = TraceMapper.linearize(parsed.root);
    for (const [p, s] of TraceMapper.align(printed, src)) {
      if (p.occ === undefined) {
        continue;
      }
      map.set(p.occ, { path: s.path, node: s.src, chain: s.chain, printed: p });
    }
    return { map, listing: parsed };
  }

  /**
   * Gives the thread of a printed node: the parallel and replication branches
   * above it.
   *
   * @param {Object} node A node of the listing.
   * @return {Object} The key, such as "LR!".
   */
  static threadKey(node: any) {
    const unwrap = n => {
      while (n && n.kind === "Paren") {
        n = n.body;
      }

      return n;
    };
    const parts = [];
    let cur = node;
    let child = null;
    while (cur) {
      if (cur.kind === "Par" && child) {
        parts.push(unwrap(cur.left) === child ? "L" : "R");
      }
      if (cur.kind === "Repl" && child) {
        parts.push("!");
      }
      child = cur;
      cur = cur.parentNode;
    }
    return parts.reverse().join("");
  }

  /**
   * Builds the sequence chart of a trace.
   *
   * @param {Object} trace The trace from OutputParser.
   * @param {Object} listing The listing of the process the query was run on.
   * @param {Analysis} analysis The Analysis of the model, or null.
   * @return {Object} {lanes, attackerLane, steps, found, conclusion}.
   */
  static build(trace: any, listing: any, analysis: Analysis) {
    const { map, listing: parsed } = analysis ? TraceMapper.mapOccurrences(listing, analysis.program) : { map: new Map(), listing: TraceMapper.parseListing(listing) };
    const lanes = [];
    const laneIndex = new Map();
    const getLane = (key, label, info) => {
      if (!laneIndex.has(key)) {
        laneIndex.set(key, lanes.length);
        lanes.push({ id: key, label, ...info });
      }
      return laneIndex.get(key);
    };
    const steps = [];
    const threadNames = new Map();
    const laneOf = (occ, copyList) => {
      const printed = parsed.byOcc.get(occ);
      const m = map.get(occ);
      const tk = printed ? TraceMapper.threadKey(printed) : "occ" + occ;
      const copy = (copyList || []).join(", ");
      if (!threadNames.has(tk)) {
        threadNames.set(tk, tk === "" ? "main" : "process " + (threadNames.size + (threadNames.has("") ? 0 : 1)));
      }
      const role = m && m.chain.length ? m.chain[m.chain.length - 1].name : threadNames.get(tk);
      const lane = getLane(tk + "|" + copy, copy ? role + " [" + copy + "]" : role, { role, copy: copyList || [], thread: tk });
      let source = null;
      if (m) {
        const n = m.node;
        source = { path: m.path, start: n.hstart === undefined || n.hstart === null ? n.start : n.hstart, end: n.hend === undefined || n.hend === null ? n.end : n.hend, chain: m.chain.map(c => c.name), node: n };
      }
      return { lane, source };
    };
    trace.steps.forEach((st, i) => {
      let lane = null;
      let source = null;
      let lane2 = null;
      let source2 = null;
      if (st.occ !== undefined) {
        ({ lane, source } = laneOf(st.occ, st.copy));
      }
      if (st.kind === "comm" && st.recvOcc !== undefined) {
        ({ lane: lane2, source: source2 } = laneOf(st.recvOcc, st.recvCopy));
      }
      steps.push({ index: i, ...st, lane, source, lane2, source2, label: TraceMapper.stepLabel(st) });
    });
    return { lanes, attackerLane: lanes.length, steps, found: trace.found, conclusion: trace.conclusion };
  }

  /**
   * Gives a short label of a step.
   *
   * @param {Object} st The step.
   * @return {string} The text.
   */
  static stepLabel(st: any): string {
    switch (st.kind) {
      case "new":
        return I18n.t("new {name}: {type} creating {value}", { name: st.name, type: st.type, value: st.value });

      case "out":
        return "out(" + st.channel + ", " + st.message + ")";

      case "comm":
        return I18n.t("{channel}: {message} (between processes)", { channel: st.channel, message: st.message });

      case "in":
        return "in(" + st.channel + ", " + st.message + ")";

      case "event":
        return "event " + st.event;

      case "insert":
        return "insert " + st.entry;

      case "get":
        return "get " + st.entry;

      case "attacker-knows":
        return I18n.t("attacker obtains {message}", { message: st.message });

      case "event-executed":
        return I18n.t("event {event} executed", { event: st.event });

      default:
        return st.text.replace(/\s+/g, " ");
    }
  }
}
// ----------------------------------------------------------------
