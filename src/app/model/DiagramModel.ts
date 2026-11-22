/**
 * What the diagram shows: parties (lanes), the blocks of their actions,
 * chains, messages.
 *
 * Every process macro "let P(...) = ..." is a lane (a party), and the main
 * process has its own lane. Inside a lane each process construct is one
 * block, one line of ProVerif. Sequential blocks form a chain; the order of
 * a chain is the order of the code, and it is also the vertical order of its
 * blocks on the canvas: moving a block above another one reorders the code
 * (DropPlanner). Conditionals and parallel compositions end a chain and open
 * one chain per branch, in the same lane, where they are edited as any
 * chain.
 *
 * Each branch of a parallel composition is a process of its own: outputs
 * and inputs of different processes are paired into message arrows by
 * simulating an honest run (same channel, compatible types, in order),
 * between lanes first; the user can override the pairing. Messages on
 * private channels are dotted. A role shown symmetric gets a second,
 * mirrored, grey copy of its lane.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class DiagramModel {
  /**
   * The children of process nodes.
   *
   * @type {Array}
   */
  static CHILDREN = ["next", "then", "else", "left", "right", "body"];

  /**
   * Builds the model of an analysed program.
   *
   * @param {Analysis} analysis The Analysis.
   * @param {NotationTable} table The NotationTable (labels, colours, hidden,
   *   symmetric).
   * @param {Object} meta The metadata of the studio (links, nolink,
   *   symmetric).
   * @return {Object} The model.
   */
  static build(analysis: Analysis, table: NotationTable = null, meta: any = null) {
    return new DiagramModel(analysis, table, meta || analysis.meta || {}).run();
  }

  analysis: Analysis;
  table: NotationTable;
  meta: any;
  lanes: any[];
  blocks: Map<any, any>;
  chains: Map<any, any>;
  calls: any[];
  seq: number;

  /**
   * Prepares the build.
   *
   * @param {Analysis} analysis The Analysis.
   * @param {NotationTable} table The NotationTable.
   * @param {Object} meta The metadata.
   */
  constructor(analysis: Analysis, table: NotationTable, meta: any) {
    this.analysis = analysis;
    this.table = table;
    this.meta = meta;
    this.lanes = [];
    this.blocks = new Map();
    this.chains = new Map();
    this.calls = [];
    this.seq = 0;
  }

  /**
   * Gives the one-line label of a process node.
   *
   * @param {Object} p The node.
   * @return {string} The text.
   */
  static label(p: any): string {
    try {
      switch (p.kind) {
        case "Repl":
          return PvPrinter.head(p);

        case "Par":
          return "|";

        case "Nil":
          return p.yield ? "yield" : "0";

        default:
          return PvPrinter.head(p).replace(/ (then|in|do)$/, "");
      }
    } catch (e) {
      return p.kind;
    }
  }

  /**
   * Builds everything.
   *
   * @return {Object} {lanes, blocks, chains, links, calls}.
   */
  run() {
    const prog = this.analysis.program;
    const t = this.table;
    if (prog.process) {
      this.addMain(prog.process, ["process"], "main", I18n.t("Main process"), "");
    }
    if (prog.equivalence) {
      prog.equivalence.forEach((p, i) => this.addMain(p, ["equivalence", i], "equiv" + i, I18n.t("Equivalence, side {number}", { number: i + 1 }), ""));
    }
    prog.decls.forEach((d, i) => {
      if (d.kind !== "ProcessDecl") {
        return;
      }
      const name = d.name.name;
      const lane = {
        id: "R:" + name, kind: "macro", name, title: (t && t.label("symbol", name)) || name,
        subtitle: d.params ? "(" + PvPrinter.varTypes(d.params) + ")" : "", params: d.params || [], declIndex: i,
        path: ["decls", i, "body"], color: t ? t.color("symbol", name) : null,
        hidden: !!(t && t.isHidden("symbol", name))
      };
      this.addLane(lane, d.body, ["decls", i, "body"]);
    });
    this.orderLanes();
    this.attachDiagnostics();
    this.decorateComms();
    this.addMirrors();
    this.assignKeys();
    const links = this.pairMessages();
    return { lanes: this.lanes, blocks: this.blocks, chains: this.chains, links, calls: this.calls.map(c => ({ from: c.block.id, to: c.target })) };
  }

  /**
   * Adds the lane of a main process.
   *
   * @param {Object} root The process.
   * @param {string} path Its path.
   * @param {number} id The id of the lane.
   * @param {string} title Its title.
   * @param {Object} subtitle Its subtitle.
   */
  addMain(root: any, path: any[], id: any, title: string, subtitle: any) {
    this.addLane({ id, kind: "main", title, subtitle, path, params: [], color: null }, root, path);
  }

  /**
   * Lists the branches of a parallel composition as it is written: P | Q | R,
   * which the parser nests on the right, has three; a composition in
   * parentheses is one branch, on either side, as in (P | Q) | (R | S).
   *
   * @param {Object} p The Par node.
   * @param {string} path Its path.
   * @return {Object} [{node, path}].
   */
  static parBranches(p: any, path: any[]) {
    const items = [];
    const unwrap = (node, at) => {
      while (node.kind === "Paren") {
        node = node.body;
        at = [...at, "body"];
      }
      return { node, path: at };
    };
    let cur = p;
    let cpath = path;
    while (cur.right.kind === "Par") {
      items.push(unwrap(cur.left, [...cpath, "left"]));
      cur = cur.right;
      cpath = [...cpath, "right"];
    }
    items.push(unwrap(cur.left, [...cpath, "left"]), unwrap(cur.right, [...cpath, "right"]));
    return items;
  }

  /**
   * Adds a lane and build its blocks.
   *
   * @param {Object} lane The lane.
   * @param {Object} root Its process.
   * @param {Object} rootPath The path of the process.
   */
  addLane(lane: any, root: any, rootPath: any) {
    lane.comms = [];
    lane.blockIds = [];
    this.lanes.push(lane);
    lane.root = this.buildChain(root, rootPath, lane, null, lane.id);
  }

  /**
   * Builds a chain of blocks starting at a process.
   *
   * @param {Object} p The first process of the chain.
   * @param {string} path Its path.
   * @param {Object} lane The lane.
   * @param {Object} owner The block whose branch the chain is (null for the
   *   root).
   * @param {string} party The process that runs the chain: the lane, or a
   *   branch of a parallel composition.
   * @return {Object} The first block.
   */
  buildChain(p: any, path: any[], lane: any, owner: any, party: string) {
    const chainId = lane.id + ":" + path.join(".");
    const chain = { id: chainId, lane: lane.id, blocks: [], owner: owner ? owner.id : null, path, party };
    this.chains.set(chainId, chain);
    const first = this.buildBlock(p, path, lane, chain);
    return first;
  }

  /**
   * Builds the block of a process node and the rest of its chain.
   *
   * @param {Object} p The node.
   * @param {string} path Its path.
   * @param {Object} lane The lane.
   * @param {Object} chain The chain it belongs to.
   * @return {Object} The block.
   */
  buildBlock(p: any, path: any[], lane: any, chain: any) {
    while (p && p.kind === "Paren") {
      path = [...path, "body"];
      p = p.body;
    }
    if (!p) {
      return null;
    }
    const b = this.newBlock(p, path, lane, chain);
    if (p.kind === "In" || p.kind === "Out") {
      lane.comms.push(b);
    }
    switch (p.kind) {
      case "New":
      case "In":
      case "Out":
      case "Event":
      case "Insert":
      case "Phase":
      case "Sync":
        b.next = this.buildBlock(p.next, [...path, "next"], lane, chain);
        break;

      case "Let":
      case "LetFilter":
      case "Get":
      case "If":
        if (p.else) {
          b.branches = [
              { label: p.kind === "If" ? "then" : "in", key: "then", block: this.buildChain(p.then, [...path, "then"], lane, b, chain.party) }
            , { label: "else", key: "else", block: this.buildChain(p.else, [...path, "else"], lane, b, chain.party) }
          ];
        } else {
          b.next = this.buildBlock(p.then, [...path, "then"], lane, chain);
        }
        break;

      case "Repl":
      case "ProgBegin":
        b.body = this.buildChain(p.body, [...path, "body"], lane, b, chain.party);
        break;

      case "Par":
        // Each branch is a process of its own, which a @label hint may name
        b.branches = DiagramModel.parBranches(p, path).map((it, i) => ({
            label: (this.table && this.table.label("action", it.path.join("."))) || ""
          , key: "par" + i
          , block: this.buildChain(it.node, it.path, lane, b, chain.party + "/" + (i + 1))
        }));
        break;

      case "Call":
        this.calls.push({ block: b, target: "R:" + p.name.name });
        break;

      default:
        break;
    }
    return b;
  }

  /**
   * Creates a block and register it.
   *
   * @param {Object} p The node.
   * @param {string} path Its path.
   * @param {Object} lane Its lane.
   * @param {Object} chain Its chain.
   * @param {Object} extra More fields.
   * @return {Object} The block.
   */
  newBlock(p: any, path: any[], lane: any, chain: any, extra: any = {}) {
    const id = lane.id + "|" + path.join(".");
    const b = {
      id, path, kind: p.kind, node: p, label: DiagramModel.label(p),
      range: [p.hstart === undefined || p.hstart === null ? p.start : p.hstart, p.hend === undefined || p.hend === null ? p.end : p.hend], implicit: p.kind === "Nil" && !!p.implicit,
      lane: lane.id, chain: chain.id, party: chain.party, index: chain.blocks.length, diagnostics: [], seq: this.seq++, ...extra
    };
    chain.blocks.push(b);
    lane.blockIds.push(id);
    this.blocks.set(id, b);
    return b;
  }

  /**
   * Orders the lanes: the main processes first, then the macros in the order
   * of their calls, then the others.
   */
  orderLanes() {
    const order = new Map();
    let k = 0;
    const visit = (laneId, seen) => {
      for (const c of this.calls) {
        if (c.block.lane !== laneId) {
          continue;
        }
        if (!order.has(c.target) && !seen.has(c.target)) {
          order.set(c.target, k++);
          seen.add(c.target);
          visit(c.target, seen);
        }
      }
    };
    for (const l of this.lanes) {
      if (l.kind === "main") {
        order.set(l.id, k++);
        visit(l.id, new Set([l.id]));
      }
    }
    for (const l of this.lanes) {
      if (!order.has(l.id)) {
        order.set(l.id, k++);
        visit(l.id, new Set([l.id]));
      }
    }
    this.lanes.sort((a, b) => order.get(a.id) - order.get(b.id));
    const called = new Set(this.calls.map(c => c.target));
    for (const l of this.lanes) {
      l.unused = l.kind === "macro" && !called.has(l.id);
    }
  }

  /**
   * Attaches each diagnostic to the innermost block whose code contains it.
   */
  attachDiagnostics() {
    for (const d of this.analysis.diagnostics || []) {
      let best = null;
      for (const b of this.blocks.values()) {
        if (b.implicit) {
          continue;
        }
        if (b.range[0] <= d.start && d.start <= b.range[1] && (!best || b.range[1] - b.range[0] < best.range[1] - best.range[0])) {
          best = b;
        }
      }
      if (best) {
        best.diagnostics.push(d);
      }
    }
  }

  /**
   * Tells whether a channel term is private (a private free name, or a name
   * made by new).
   *
   * @param {Object} t The channel term.
   * @param {Object} b The block (for the scope of bound names).
   * @return {boolean} True when the attacker does not know the channel a
   *   priori.
   */
  privateChannel(t: any): boolean {
    if (!t || t.kind !== "Ident") {
      return false;
    }
    const occ = this.analysis.symbolAt(t.start);
    const sym = occ ? occ.symbol : this.analysis.global(t.name);
    if (!sym) {
      return false;
    }
    if (sym.kind === "name") {
      return !!(sym.private || sym.bound);
    }
    return false;
  }

  /**
   * Gives the inputs and outputs their channel, message type and privacy.
   */
  decorateComms() {
    for (const b of this.blocks.values()) {
      if (b.kind !== "In" && b.kind !== "Out") {
        continue;
      }
      b.channel = (() => {
        try {
          return PvPrinter.term(b.node.chan);
        } catch (e) {
          return "?";
        }
      })();
      b.msgType = b.kind === "Out" ? this.analysis.typeOf(b.node.msg) : this.analysis.typeOf(b.node.pattern);
      b.private = this.privateChannel(b.node.chan);
    }
  }

  /**
   * Adds the mirrored copies of the lanes shown symmetric.
   */
  addMirrors() {
    const want = new Set(this.meta.symmetric || []);
    for (const lane of [...this.lanes]) {
      if (lane.kind !== "macro") {
        continue;
      }
      const on = want.has(lane.id) || (this.table && this.table.isSymmetric(lane.name));
      lane.symmetric = on;
      if (!on) {
        continue;
      }
      const mirror = { ...lane, id: "mirror:" + lane.id, kind: "mirror", mirrorOf: lane.id, title: lane.title + " (mirrored)", comms: [], blockIds: [] };
      const clone = b => {
        if (!b) {
          return null;
        }
        const c = { ...b, id: "mirror:" + b.id, lane: mirror.id, chain: "mirror:" + b.chain, party: "mirror:" + b.party, mirror: true, diagnostics: [] };
        this.blocks.set(c.id, c);
        mirror.blockIds.push(c.id);
        if (b.kind === "In" || b.kind === "Out") {
          mirror.comms.push(c);
        }
        if (b.next) {
          c.next = clone(b.next);
        }
        if (b.body) {
          c.body = clone(b.body);
        }
        if (b.branches) {
          c.branches = b.branches.map(br => ({ ...br, block: clone(br.block) }));
        }
        return c;
      };
      // I copy the comms in the order of the original (pre-order)
      mirror.root = clone(lane.root);
      mirror.comms.sort((a, b) => a.seq - b.seq);
      for (const [id, ch] of [...this.chains]) {
        if (ch.lane !== lane.id) {
          continue;
        }
        this.chains.set("mirror:" + id, { ...ch, id: "mirror:" + id, lane: mirror.id, blocks: ch.blocks.map(b => this.blocks.get("mirror:" + b.id)).filter(Boolean), mirror: true });
      }
      const at = this.lanes.indexOf(lane);
      this.lanes.splice(at + 1, 0, mirror);
    }
  }

  /**
   * Gives every block a key that survives edits elsewhere (for the layout and
   * the links).
   *
   * The key is the lane, the kind and the code of the block, and its rank
   * among the blocks of the lane with the same kind and code.
   */
  assignKeys() {
    for (const lane of this.lanes) {
      const seen = new Map();
      for (const id of lane.blockIds) {
        const b = this.blocks.get(id);
        const base = lane.id + "#" + b.kind + ":" + b.label;
        const k = seen.get(base) || 0;
        seen.set(base, k + 1);
        b.key = base + "#" + k;
      }
    }
  }

  /**
   * Tells whether two types may be the same.
   *
   * @param {Object} a A type or undefined.
   * @param {Object} b A type or undefined.
   * @return {boolean} True when compatible.
   */
  static compatible(a: any, b: any): boolean {
    return !a || !b || a === "?" || b === "?" || a === b;
  }

  /**
   * Tells whether a message may match a pattern (a cheap structural test).
   *
   * @param {string} msg The message term.
   * @param {Object} pat The pattern.
   * @return {boolean} True when it may.
   */
  static structurallyCompatible(msg: any, pat: any): boolean {
    if (!msg || !pat) {
      return true;
    }
    if (pat.kind === "PVar" || pat.kind === "PEq" || pat.kind === "PAny") {
      return true;
    }
    if (pat.kind === "PTuple") {
      if (msg.kind === "Tuple") {
        return msg.items.length === pat.items.length && msg.items.every((m, i) => DiagramModel.structurallyCompatible(m, pat.items[i]));
      }
      return msg.kind === "Ident" || msg.kind === "TLet" || msg.kind === "TIf" || msg.kind === "Choice";
    }
    if (pat.kind === "PApp") {
      if (msg.kind === "App") {
        return msg.fn.name === pat.fn.name;
      }
      return msg.kind !== "Tuple";
    }
    return true;
  }

  /**
   * Pairs outputs with inputs: those that @inout hints name when the model
   * has some, otherwise by simulating an honest run.
   *
   * @return {Object} [{from, to, auto, fromKey, toKey, private, channel,
   *   name}].
   */
  pairMessages() {
    const meta = this.meta;
    const links = [];
    const byKey = new Map();
    for (const l of this.lanes) {
      for (const b of l.comms) {
        byKey.set(b.key, b);
      }
    }
    const used = new Set();
    const mk = (a, b, auto) => ({ from: a.id, to: b.id, auto, fromKey: a.key, toKey: b.key, private: a.private || b.private, channel: a.channel });
    for (const ln of meta.links || []) {
      const a = byKey.get(ln.from);
      const b = byKey.get(ln.to);
      if (a && b && a.kind === "Out" && b.kind === "In") {
        links.push(mk(a, b, false));
        used.add(a.key);
        used.add(b.key);
      }
    }
    if (this.table && this.table.hasInouts()) {
      const comms = [...byKey.values()].filter(b => !used.has(b.key));
      return links.concat(this.table.namedLinks(comms).map(pair => ({ ...mk(pair.from, pair.to, false), name: pair.name })));
    }
    const blocked = new Set(meta.nolink || []);
    // a symmetric party talks to its mirrored copy: the k-th output of each goes to the k-th input of the other
    for (const m of this.lanes) {
      if (m.kind !== "mirror") {
        continue;
      }
      const o = this.lanes.find(l => l.id === m.mirrorOf);
      if (!o) {
        continue;
      }
      const pair = (from, to) => {
        const outs = from.comms.filter(b => b.kind === "Out" && !used.has(b.key) && !blocked.has(b.key));
        const ins = to.comms.filter(b => b.kind === "In" && !used.has(b.key) && !blocked.has(b.key));
        for (let k = 0; k < Math.min(outs.length, ins.length); k++) {
          if (outs[k].channel !== ins[k].channel) {
            continue;
          }
          links.push(mk(outs[k], ins[k], true));
          used.add(outs[k].key);
          used.add(ins[k].key);
        }
      };
      pair(o, m);
      pair(m, o);
    }
    // One thread per process: a lane, or a branch of a parallel composition.
    // The processes first, the setup of the main processes last: messages
    // between processes are preferred
    const parties = new Map();
    for (const l of this.lanes) {
      for (const b of l.comms) {
        if (!parties.has(b.party)) {
          parties.set(b.party, { party: b.party, lane: l.id, setup: l.kind === "main" && b.party === l.id, steps: [], pos: 0, replyTo: null });
        }
        parties.get(b.party).steps.push(b);
      }
    }
    const threads = [...parties.values()].sort((a, b) => Number(a.setup) - Number(b.setup));
    threads.forEach(thread => {
      thread.steps = thread.steps.filter(b => !used.has(b.key) && !blocked.has(b.key));
    });
    const fits = (o, r) => r.channel === o.channel && DiagramModel.compatible(o.msgType, r.msgType) && DiagramModel.structurallyCompatible(o.node.msg, r.node.pattern);
    const coming = (thread, input) => threads.some(other => other.party !== thread.party && other.steps.slice(other.pos).some(b => b.kind === "Out" && fits(b, input)));
    const waiting = (thread, message) => thread.party !== message.party && thread.steps[thread.pos] && thread.steps[thread.pos].kind === "In"
      && fits(message.block, thread.steps[thread.pos]);
    const receive = (thread, message) => {
      links.push(mk(message.block, thread.steps[thread.pos], true));
      thread.pos++;
      thread.replyTo = message.party;
    };
    // The messages sent that no input took yet: the outputs do not wait
    let network = [];
    let clock = 0;
    for (let guard = 0; guard < 4000; guard++) {
      let progress = false;
      for (const thread of threads) {
        while (thread.pos < thread.steps.length) {
          const step = thread.steps[thread.pos];
          if (step.kind === "Out") {
            const message = { block: step, party: thread.party, lane: thread.lane, setup: thread.setup, time: clock++ };
            thread.pos++;
            progress = true;
            // To a process that waits for it: the one it answers, then another lane, then its own
            const receivers = threads.filter(other => waiting(other, message) && (!message.setup || !coming(other, other.steps[other.pos])));
            const receiver = receivers.find(other => other.party === thread.replyTo) || receivers.find(other => other.lane !== thread.lane) || receivers[0];
            if (receiver) {
              receive(receiver, message);
            } else {
              network.push(message);
            }
            continue;
          }
          // An input takes the last message that fits, from another lane first;
          // what a main process publishes before it starts the others, only
          // when no other process is to send a message that fits
          const fitting = network.filter(message => message.party !== thread.party && fits(message.block, step) && (!message.setup || !coming(thread, step)));
          const taken = fitting.filter(message => message.lane !== thread.lane).pop() || fitting.pop();
          if (!taken) {
            break;
          }
          network = network.filter(message => message !== taken);
          receive(thread, taken);
          progress = true;
        }
      }
      if (progress) {
        continue;
      }
      // Every process waits: an input comes from the attacker, the first that
      // no other process is to send a message for, or else the first
      const stuck = threads.filter(thread => thread.pos < thread.steps.length);
      if (!stuck.length) {
        break;
      }
      (stuck.find(thread => !coming(thread, thread.steps[thread.pos])) || stuck[0]).pos++;
    }
    return links;
  }

  /**
   * Finds the innermost block whose code contains an offset.
   *
   * @param {Object} model The model.
   * @param {number} offset The offset.
   * @return {Object|null} The block or null.
   */
  static blockAtOffset(model: any, offset: number) {
    let best = null;
    for (const b of model.blocks.values()) {
      if (b.implicit || b.mirror) {
        continue;
      }
      if (b.range[0] <= offset && offset <= b.range[1] && (!best || b.range[1] - b.range[0] <= best.range[1] - best.range[0])) {
        best = b;
      }
    }
    return best;
  }
}
// ----------------------------------------------------------------
