/**
 * Attachment of source comments to the declarations and actions they
 * describe.
 *
 * A comment on the same line right after an action or a declaration trails
 * it; any other comment leads the next declaration, or the next action of the
 * same declaration. Comments after the last node trail the program.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class CommentAttacher {
  program: any;
  comments: any[];
  src: string;

  /**
   * Prepares the attachment.
   *
   * @param {Object} program The Program node.
   * @param {Array} comments The comments from the lexer.
   * @param {string} src The source text.
   */
  constructor(program: any, comments: any[], src: string = "") {
    this.program = program;
    this.comments = comments;
    this.src = src;
  }

  /**
   * Attaches all comments (leadingComments, trailingComments and
   * program.trailingComments).
   */
  run() {
    const program = this.program;
    if (!this.comments.length) {
      return;
    }
    const allDecls = [];
    const addDecls = ds => ds.forEach(d => {
      allDecls.push(d);

      if (d.kind === "DefineDecl") {
        addDecls(d.decls);
      }
    });
    addDecls(program.decls);
    const mainStart = program.processStart === undefined || program.processStart === null ? Infinity : program.processStart;
    const anchors = [];
    for (const d of allDecls) {
      anchors.push({ start: d.start, node: d, depth: 0 });
    }
    const addProc = p => Ast.walk(p, n => {
      if (Ast.PROCESS_KINDS.has(n.kind) && !(n.kind === "Nil" && n.implicit)) {
        anchors.push({ start: n.start, node: n, depth: 1 });
      }
    });
    for (const d of allDecls) {
      if (d.kind === "ProcessDecl") {
        addProc(d.body);
      }
    }
    if (program.process) {
      addProc(program.process);
    }
    if (program.equivalence) {
      program.equivalence.forEach(addProc);
    }
    anchors.sort((a, b) => a.start - b.start || a.depth - b.depth);

    const containers = allDecls.map(d => [d.start, d.end, d]);
    if (program.process || program.equivalence) {
      containers.push([mainStart, program.end, null]);
    }

    const enders = this.enders(allDecls);
    const sameLine = (a, b) => !/[\n\r]/.test(this.src.slice(a, b));
    for (const c of this.comments) {
      if (this.src) {
        let best = null;
        for (const en of enders) {
          if (en.end <= c.start && sameLine(en.end, c.start) && /^[ \t]*$/.test(this.src.slice(en.end, c.start)) && (!best || en.end > best.end)) {
            best = en;
          }
        }
        if (best) {
          if (!best.node.trailingComments) {
            best.node.trailingComments = [];
          }
          best.node.trailingComments.push(c);
          continue;
        }
      }
      let cont = null;
      for (const [s, e, d] of containers) {
        if (c.start > s && c.start < e) {
          if (!cont || s > cont[0]) {
            cont = [s, e, d];
          }
        }
      }
      let target = null;
      for (const a of anchors) {
        if (a.start < c.end) {
          continue;
        }
        if (cont && a.start >= cont[1]) {
          break;
        }
        target = a.node;
        break;
      }
      if (!target && cont && cont[2]) {
        target = cont[2];
      }
      if (!target) {
        if (c.start >= mainStart && program.process) {
          target = program.process;
        } else {
          program.trailingComments.push(c);
          continue;
        }
      }
      if (!target.leadingComments) {
        target.leadingComments = [];
      }
      target.leadingComments.push(c);
    }
  }

  /**
   * Lists the positions where a trailing comment may follow a node.
   *
   * @param {Array} allDecls All declarations, including those inside macros.
   * @return {Object} [{end, node}].
   */
  enders(allDecls: any[]) {
    const program = this.program;
    const enders = [];
    for (const d of allDecls) {
      if (d.kind !== "ProcessDecl" && d.kind !== "DefineDecl") {
        enders.push({ end: d.end, node: d });
      }
    }
    const addHeads = p => Ast.walk(p, n => {
      if (Ast.PROCESS_KINDS.has(n.kind) && n.kind !== "Par" && n.kind !== "Paren" && !(n.kind === "Nil" && n.implicit)) {
        // the head of a sequential action extends over its ";"
        let e = n.hend;
        const k = this.src.slice(e).match(/^[ \t]*;/);
        if (k && (Ast.SEQUENTIAL.has(n.kind) || n.kind === "Let")) {
          e += k[0].length;
        }
        enders.push({ end: e, node: n });
      }
    });
    for (const d of allDecls) {
      if (d.kind === "ProcessDecl") {
        enders.push({ end: d.end, node: d });
        addHeads(d.body);
      }
    }
    if (program.process) {
      addHeads(program.process);
    }
    return enders;
  }
}
// ----------------------------------------------------------------
