/**
 * Reading the text output of ProVerif: errors, process listings, results,
 * derivations and traces.
 *
 * Extracts the errors and warnings (with their locations), the listings of
 * the processes with their occurrence numbers {n}, one record per goal with
 * its verdict, derivation and attack trace, and the final summary. It is
 * tolerant to the variations between the 2.0x versions.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class OutputParser {
  /**
   * A location line of ProVerif.
   *
   * @type {RegExp}
   */
  static LOC: RegExp = /^File "([^"]*)", line (\d+), (?:characters? (\d+)(?:-(\d+))?|character (\d+) - line (\d+), character (\d+))(?::)?$/;

  /**
   * Lines that start a step of a trace.
   *
   * @type {RegExp}
   */
  static STEP_START: RegExp = /^(new |out\(|in\(|event |insert |get |let |if |The attacker |The event |Phase |phase |sync |The message |A trace has been found|Could not find a trace|An attack|Unified |Iterating |Fixpoint |1st process|2nd process|Initial state|Additional knowledge)/;

  /**
   * The names of the verdicts of ProVerif, in English: verdictName
   * translates them.
   *
   * @type {Object<string, string>}
   */
  static VERDICTS: Record<string, string> = {
      "true": I18n.mark("true")
    , "false": I18n.mark("false")
    , "cannot be proved": I18n.mark("cannot be proved")
  };

  /**
   * Names a verdict of ProVerif in the language of the interface.
   *
   * @param {string} verdict The verdict: "true", "false" or "cannot be
   *   proved".
   * @return {string} Its name, the verdict itself in English.
   */
  static verdictName(verdict: string): string {
    return Object.prototype.hasOwnProperty.call(OutputParser.VERDICTS, verdict) ? I18n.t(OutputParser.VERDICTS[verdict]) : String(verdict);
  }

  /**
   * The end of a step: occurrence, copy and goal marker.
   *
   * @type {*}
   */
  static AT = " at \\{(\\d+)\\}(?: in copy (.*?))?( \\(goal\\))?$";

  /**
   * Parses an output.
   *
   * @param {string} text The output.
   * @return {Object} {errors, warnings, processes, sections, results,
   *   summary, raw}.
   */
  static parse(text: string) {
    const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
    const out = { errors: [], warnings: [], processes: new Map(), sections: [], results: [], summary: [], raw: text };
    let i = 0;
    let section = null;
    let block = null;
    const newBlock = (title, startLine) => {
      block = { title, startLine, lines: [], derivation: null, trace: null, goal: null, result: null, section: section ? out.sections.length - 1 : -1 };
      return block;
    };
    while (i < lines.length) {
      const line = lines[i];
      const loc = line.match(OutputParser.LOC);
      if (loc && i + 1 < lines.length && /^(Error|Warning): /.test(lines[i + 1])) {
        const kind = lines[i + 1].startsWith("Error") ? "error" : "warning";
        let msg = lines[i + 1].replace(/^(Error|Warning): /, "");
        let j = i + 2;
        while (j < lines.length && lines[j] && !OutputParser.LOC.test(lines[j]) && !/^(Error|Warning):|^Process \d+|^Biprocess \d+|^-- /.test(lines[j]) && kind === "warning") {
          msg += "\n" + lines[j];
          j++;
        }
        const rec = loc[5]
          ? { file: loc[1], line: +loc[2], col: +loc[5], endLine: +loc[6], endCol: +loc[7], message: msg, severity: kind }
          : { file: loc[1], line: +loc[2], col: +loc[3], endLine: +loc[2], endCol: loc[4] ? +loc[4] : +loc[3], message: msg, severity: kind };
        (kind === "error" ? out.errors : out.warnings).push(rec);
        i = j;
        continue;
      }
      if (/^Error: /.test(line)) {
        out.errors.push({ message: line.slice(7), severity: "error" });
        i++;
        continue;
      }
      if (/^Warning: /.test(line)) {
        out.warnings.push({ message: line.slice(9), severity: "warning" });
        i++;
        continue;
      }
      if (/^Internal error: /.test(line)) {
        out.errors.push({ message: line, severity: "error", internal: true });
        i++;
        continue;
      }
      const pm = line.match(/^(?:--\s+(?:(.*?) in )?)?(Process|process|Biprocess|biprocess) (\d+) \((.*)\):\s*$/);
      if (pm) {
        if (pm[1] !== undefined) {
          section = { kind: OutputParser.sectionKind(pm[1]), title: pm[1], process: Number(pm[3]), processKind: pm[2].toLowerCase(), line: i + 1, blocks: [] };
          out.sections.push(section);
          block = null;
          if (section.kind !== "query" && section.kind !== "process") {
            section.blocks.push(newBlock(pm[1], i + 1));
          }
        }
        const start = i + 1;
        let j = start;
        while (j < lines.length && lines[j].trim() !== "" && !/^-- /.test(lines[j])) {
          j++;
        }
        out.processes.set(Number(pm[3]), { kind: pm[2].toLowerCase(), num: Number(pm[3]), title: pm[4], text: lines.slice(start, j).join("\n"), line: start + 1 });
        i = j;
        continue;
      }
      const sm = line.match(/^-- (.*?)(?: in (process|biprocess) (\d+))?\.?\s*$/);
      if (sm && !/^-{3,}/.test(line)) {
        const title = sm[1];
        const kind = OutputParser.sectionKind(title);
        section = { kind, title, process: sm[3] !== undefined ? Number(sm[3]) : null, processKind: sm[2] || null, line: i + 1, blocks: [] };
        out.sections.push(section);
        block = null;
        if (kind !== "query" && kind !== "process") {
          section.blocks.push(newBlock(title, i + 1));
        }
        i++;
        continue;
      }
      if (/^-{20,}$/.test(line) && /^Verification summary:/.test(lines[i + 1] || "")) {
        let j = i + 2;
        while (j < lines.length && !/^-{20,}$/.test(lines[j])) {
          const l = lines[j].trim();
          if (l) {
            const v = OutputParser.verdictOf(l);
            out.summary.push({ text: l, goal: v ? v.goal : l, verdict: v ? v.verdict : "unknown" });
          }
          j++;
        }
        i = j + 1;
        section = null;
        block = null;
        continue;
      }
      const st = line.match(/^Starting query (.*)$/);
      if (st) {
        if (!section) {
          section = { kind: "query", title: st[1], process: null, line: i + 1, blocks: [] };
          out.sections.push(section);
        }
        section.blocks.push(newBlock(st[1], i + 1));
        i++;
        continue;
      }
      if (/^RESULT /.test(line)) {
        const v = OutputParser.verdictOf(line.slice(7));
        const r = { text: line.slice(7), goal: v ? v.goal : line.slice(7), verdict: v ? v.verdict : "unknown", line: i + 1, section: out.sections.length - 1, block: null, extra: v ? v.extra : "" };
        // "RESULT (even event(...) ==> event(...) is false.)" completes the previous result
        if (/^\(/.test(r.text) && out.results.length) {
          out.results[out.results.length - 1].note = r.text.replace(/^\(|\)\.?$/g, "");
          i++;
          continue;
        }
        if (block && !block.result) {
          block.result = r;
          r.block = block;
        } else if (section) {
          const b = newBlock(r.goal, i + 1);
          section.blocks.push(b);
          b.result = r;
          r.block = b;
        }
        out.results.push(r);
        block = null;
        i++;
        continue;
      }
      if (!block && section && (/^goal reachable: /.test(line) || /^Derivation:\s*$/.test(line) || OutputParser.isTraceStart(line, lines, i))) {
        section.blocks.push(newBlock(section.title, i + 1));
      }
      if (block) {
        if (/^goal reachable: /.test(line)) {
          block.goal = line.slice(16);
        } else if (/^Derivation:\s*$/.test(line)) {
          const { steps, abbreviations, end } = OutputParser.derivation(lines, i + 1);
          block.derivation = { steps, abbreviations, line: i + 1 };
          i = end;
          continue;
        } else if (OutputParser.isTraceStart(line, lines, i)) {
          const { trace, end } = OutputParser.trace(lines, i);
          block.trace = trace;
          i = end;
          continue;
        }
        block.lines.push(line);
      }
      i++;
    }
    for (const s of out.sections) {
      for (const b of s.blocks) {
        if (b.result && b.trace) {
          b.result.trace = b.trace;
        }
      }
    }
    for (const s of out.sections) {
      for (const b of s.blocks) {
        if (!b.result) {
          continue;
        }
        b.result.derivation = b.derivation;
        b.result.goalFact = b.goal;
        b.result.processNum = s.process;
        b.result.sectionKind = s.kind;
      }
    }
    return out;
  }

  /**
   * Reads the verdict of a result line.
   *
   * @param {string} s The text after RESULT.
   * @return {Object} {goal, verdict, extra} or null; verdict is 'true',
   *   'false' or 'cannot be proved'.
   */
  static verdictOf(s: string) {
    const t = s.replace(/\s+$/, "");
    const m = t.match(/^(.*?)\s+(is true|is false|cannot be proved|is proved)\b(.*?)\.?$/);
    if (!m) {
      return null;
    }
    const v = m[2] === "is true" || m[2] === "is proved" ? "true" : m[2] === "is false" ? "false" : "cannot be proved";
    return { goal: m[1].trim(), verdict: v, extra: m[3].trim().replace(/^\(|\)$/g, "") };
  }

  /**
   * Tells the kind of a section from its title, the text after "-- ".
   *
   * @param {string} title The title.
   * @return {string} query, equivalence, noninterf, weaksecret, lemma,
   *   process or other.
   */
  static sectionKind(title: string): string {
    if (/^Query /.test(title)) {
      return "query";
    }
    if (/^Observational equivalence/.test(title)) {
      return "equivalence";
    }
    if (/^Non-interference/.test(title)) {
      return "noninterf";
    }
    if (/^Weak secret/.test(title)) {
      return "weaksecret";
    }
    if (/^(Lemma|Axiom|Restriction)/.test(title)) {
      return "lemma";
    }
    if (/^After compilation of barriers|^Biprocess|^Process/.test(title)) {
      return "process";
    }
    return "other";
  }

  /**
   * Reads a derivation.
   *
   * @param {Array} lines The lines of the output.
   * @param {number} i The first line after "Derivation:".
   * @return {Object} {steps, abbreviations, end}.
   */
  static derivation(lines: any[], i: number) {
    const steps = [];
    const abbreviations = [];
    let j = i;
    if (/^Abbreviations:/.test(lines[j] || "")) {
      j++;
      while (j < lines.length && lines[j].trim() !== "") {
        abbreviations.push(lines[j]);
        j++;
      }
    }
    while (j < lines.length) {
      const l = lines[j];
      if (l.trim() === "") {
        j++;

        if (j < lines.length && /^\d+\. /.test(lines[j])) {
          continue;
        }

        break;
      }
      const m = l.match(/^(\d+)\. (.*)$/);
      if (m) {
        steps.push({ num: Number(m[1]), lines: [m[2]] });
      } else if (steps.length) {
        steps[steps.length - 1].lines.push(l);
      }
      j++;
    }
    while (j < lines.length && lines[j].trim() === "") {
      j++;
    }
    return { steps, abbreviations, end: j };
  }

  /**
   * Tells whether a line starts a trace.
   *
   * @param {number} line The line.
   * @param {Array} lines All lines.
   * @param {number} i Its index.
   * @return {boolean} True when it does.
   */
  static isTraceStart(line: any, lines: any[], i: number): boolean {
    if (/^A more detailed output of the traces is available with/.test(line)) {
      return true;
    }
    if (/^(new |out\(|in\(|event |insert |get )[^\n]* at \{\d+\}/.test(line)) {
      return true;
    }
    if (/^Initial state|^1st process|^-{3,} *$/.test(line) && /\{\d+\}/.test(lines.slice(i, i + 40).join("\n"))) {
      return /^Initial state/.test(line);
    }
    return false;
  }

  /**
   * Reads a trace in the short display (steps separated by blank lines).
   *
   * @param {Array} lines The lines of the output.
   * @param {number} i The first line of the trace.
   * @return {Object} {trace: {steps, found, conclusion, lines}, end}.
   */
  static trace(lines: any[], i: number) {
    const trace = { steps: [], found: null, conclusion: [], lines: [] };
    let j = i;
    if (/^A more detailed output/.test(lines[j])) {
      j++;

      if (/^\s+set traceDisplay/.test(lines[j] || "")) {
        j++;
      }
    }
    let buf = [];
    const flush = () => {
      if (!buf.length) {
        return;
      }
      const step = OutputParser.step(buf.join("\n"));
      if (step) {
        trace.steps.push(step);
      }
      buf = [];
    };
    for (; j < lines.length; j++) {
      const l = lines[j];
      if (/^RESULT |^-- |^Starting query |^-{20,}$/.test(l)) {
        break;
      }
      trace.lines.push(l);
      if (trace.found !== null) {
        if (l.trim()) {
          trace.conclusion.push(l);
        }

        continue;
      }
      if (/^A trace has been found\.?/.test(l)) {
        flush();
        trace.found = true;
        continue;
      }
      if (/^Could not find a trace|^Could not reconstruct/.test(l)) {
        flush();
        trace.found = false;
        trace.conclusion.push(l);
        continue;
      }
      if (/^(Unified |Iterating |Fixpoint )/.test(l)) {
        continue;
      }
      if (l.trim() === "") {
        flush();
        continue;
      }
      if (buf.length && OutputParser.STEP_START.test(l) && /^(new |out\(|in\(|event |insert |get )/.test(l)) {
        flush();
      }
      buf.push(l);
    }
    flush();
    return { trace, end: j };
  }

  /**
   * Splits the copy indices of a step.
   *
   * @param {string} s The text after "in copy".
   * @return {Object} The indices.
   */
  static copies(s: string) {
    if (!s) {
      return [];
    }
    return s.split(/,\s*/).map(x => x.trim()).filter(Boolean);
  }

  /**
   * Reads one step of a trace.
   *
   * @param {string} text The step.
   * @return {Object} The step record {kind, occ, copy, goal, text, ...}.
   */
  static step(text: string) {
    const t = text.trim();
    const AT = OutputParser.AT;
    const C = OutputParser.copies;
    let m;
    if ((m = t.match(new RegExp("^new (\\S+?): (\\S+) creating (\\S+)" + AT)))) {
      return { kind: "new", name: m[1], type: m[2], value: m[3], occ: +m[4], copy: C(m[5]), goal: !!m[6], text: t };
    }
    const RECV = " at \\{(\\d+)\\}(?: in copy (.*?))? received at \\{(\\d+)\\}(?: in copy (.*?))?( \\(goal\\))?$";
    // out(c, M) [with ~M = T, ...]: the message shown is M with its ~M replaced by their terms
    let o;
    if ((m = t.match(new RegExp("^out\\(([\\s\\S]*?)" + RECV))) && (o = OutputParser.ioBody(m[1]))) {
      return { kind: "comm", channel: o.channel, var: o.var, message: o.message, ...(o.defs ? { defs: o.defs } : {}), occ: +m[2], copy: C(m[3]), recvOcc: +m[4], recvCopy: C(m[5]), goal: !!m[6], text: t };
    }
    if ((m = t.match(new RegExp("^out\\(([\\s\\S]*?)" + AT))) && (o = OutputParser.ioBody(m[1]))) {
      return { kind: "out", channel: o.channel, var: o.var, message: o.message, ...(o.defs ? { defs: o.defs } : {}), occ: +m[2], copy: C(m[3]), goal: !!m[4], text: t };
    }
    if ((m = t.match(new RegExp("^in\\(([\\s\\S]*?)" + AT))) && (o = OutputParser.ioBody(m[1]))) {
      return { kind: "in", channel: o.channel, recipe: o.raw, message: o.message, ...(o.defs ? { defs: o.defs } : {}), occ: +m[2], copy: C(m[3]), goal: !!m[4], text: t };
    }
    if ((m = t.match(new RegExp("^event ([\\s\\S]*?)" + AT)))) {
      return { kind: "event", event: m[1], occ: +m[2], copy: C(m[3]), goal: !!m[4], text: t };
    }
    if ((m = t.match(new RegExp("^insert ([\\s\\S]*?)" + AT)))) {
      return { kind: "insert", entry: m[1], occ: +m[2], copy: C(m[3]), goal: !!m[4], text: t };
    }
    if ((m = t.match(new RegExp("^get ([\\s\\S]*?)" + AT)))) {
      return { kind: "get", entry: m[1], occ: +m[2], copy: C(m[3]), goal: !!m[4], text: t };
    }
    if ((m = t.match(/^The attacker has the message ([\s\S]*?) = ([\s\S]*?)\.$/))) {
      return { kind: "attacker-knows", recipe: m[1], message: m[2], goal: true, text: t };
    }
    if ((m = t.match(/^The event ([\s\S]*?) is executed at \{(\d+)\}(?: in copy (.*?))?\.$/))) {
      return { kind: "event-executed", event: m[1], occ: +m[2], copy: C(m[3]), goal: true, text: t };
    }
    if (/^The attacker tests/.test(t)) {
      return { kind: "attacker-test", goal: true, text: t };
    }
    if ((m = t.match(new RegExp("^(\\w+)\\b([\\s\\S]*?)" + AT)))) {
      return { kind: m[1], detail: m[2].trim(), occ: +m[3], copy: C(m[4]), goal: !!m[5], text: t };
    }
    return { kind: "note", text: t, goal: false };
  }

  /**
   * Reads what follows "out(" or "in(" in a step: "c, M) with ~M_1 = T1, ~M_2
   * = T2".
   *
   * @param {string} body The text up to " at {n}".
   * @return {Object} {channel, raw, message, var, defs} or null; message is M
   *   with each ~M replaced by its term, var the ~M when M is a single one,
   *   defs the terms by ~M (or null).
   */
  static ioBody(body: string) {
    let depth = 0;
    let comma = -1;
    let i = 0;
    for (; i < body.length; i++) {
      const c = body[i];
      if (c === "(" || c === "[") {
        depth++;
      } else if (c === ")" || c === "]") {
        if (depth === 0) {
          break;
        }

        depth--;
      } else if (c === "," && depth === 0 && comma < 0) {
        comma = i;
      }
    }
    if (i >= body.length || comma < 0) {
      return null;
    }
    const channel = body.slice(0, comma).trim();
    const raw = body.slice(comma + 1, i).trim();
    const rest = body.slice(i + 1).trim();
    let defs = null;
    if (rest) {
      const w = /^with ([\s\S]*)$/.exec(rest);
      if (!w) {
        return null;
      }
      defs = {};
      for (const part of OutputParser.splitTop(w[1])) {
        const d = /^([^\s=]+) = ([\s\S]*)$/.exec(part.trim());
        if (d) {
          defs[d[1]] = d[2].trim();
        }
      }
    }
    let message = raw;
    const names = defs ? Object.keys(defs) : [];
    for (const v of names) {
      const esc = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      message = message.replace(new RegExp(esc + "(?![\\w])", "g"), () => defs[v]);
    }
    return { channel, raw, message, var: names.length === 1 && raw === names[0] ? raw : null, defs };
  }

  /**
   * Splits a text at its commas outside parentheses and brackets.
   *
   * @param {string} s The text.
   * @return {Object} The parts.
   */
  static splitTop(s: string) {
    const parts = [];
    let depth = 0;
    let from = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(" || c === "[") {
        depth++;
      } else if (c === ")" || c === "]") {
        depth--;
      } else if (c === "," && depth === 0) {
        parts.push(s.slice(from, i));
        from = i + 1;
      }
    }
    parts.push(s.slice(from));
    return parts;
  }

  /**
   * Writes with ASCII operators the symbols ProVerif may print instead (in
   * results and listings).
   *
   * @param {string} text The text.
   * @return {string} The text with <>, <=, >=, && and ||.
   */
  static ascii(text: string): string {
    return String(text).replace(/\u2260/g, "<>").replace(/\u2264/g, "<=").replace(/\u2265/g, ">=").replace(/\u2227/g, "&&").replace(/\u2228/g, "||");
  }

  /**
   * Blanks the occurrence markers of a process listing and list them.
   *
   * The listing keeps its offsets: each {n} becomes spaces. The few symbols
   * that ProVerif may print instead of ASCII operators are mapped back.
   *
   * @param {Object} listing The listing.
   * @return {Object} {text, marks: [{offset, occ}]}.
   */
  static stripOccurrences(listing: any) {
    let text = OutputParser.ascii(listing);
    const marks = [];
    text = text.replace(/\{(\d+)\}/g, (m, n, off) => {
      marks.push({ offset: off + m.length, occ: Number(n) });
      return " ".repeat(m.length);
    });
    return { text, marks };
  }

  /**
   * Turns a location of the output (1-based line and column) into offsets of
   * a source.
   *
   * @param {string} src The source.
   * @param {Object} rec {line, col, endLine, endCol}.
   * @return {Object} {start, end}.
   */
  static locationToOffsets(src: string, rec: any) {
    const starts = [0];
    for (let i = 0; i < src.length; i++) {
      if (src[i] === "\n") {
        starts.push(i + 1);
      }
    }
    const lineStart = l => starts[Math.max(0, Math.min(starts.length - 1, l - 1))];
    if (!rec.line) {
      return { start: 0, end: 0 };
    }
    const start = lineStart(rec.line) + Math.max(0, rec.col - 1);
    const end = lineStart(rec.endLine === undefined || rec.endLine === null ? rec.line : rec.endLine) + Math.max(0, rec.endCol === undefined || rec.endCol === null ? rec.col : rec.endCol);
    return { start, end: Math.max(end, start) };
  }
}
// ----------------------------------------------------------------
