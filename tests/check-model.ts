/**
 * @file Checks the model: unlimited undo and redo, renaming, the edits of
 * the diagram, the split of incompatible goals, the zip of the export, the
 * diagram of an example, its arrows with and without @inout, and the
 * formulas of the Design mode.
 *
 * Usage: node tests/check-model.ts
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import { root, loadClasses, checker } from "./load.ts";

const pie = loadClasses();
const { check, failures } = checker();
const example = name => fs.readFileSync(path.join(root, "examples", name), "utf8");

// History: every step is kept, undo and redo walk them all
const history = new pie.EditHistory("a");
for (let i = 0; i < 1000; i++) {
  history.commit("a" + i, { label: "Step " + i });
}
let undone = 0;
while (history.canUndo) {
  history.undo();
  undone++;
}
let redone = 0;
while (history.canRedo) {
  history.redo();
  redone++;
}
check(undone === 1000 && redone === 1000, "1000 steps undone and redone");
check(history.goTo(500) !== null && history.timeline().filter(entry => entry.applied).length === 500, "jump to step 500 from the timeline");

// Rename: the channel c becomes net in every declaration and process
const handshake = example("handshake.pv");
let analysis = pie.Analysis.of(handshake);
const channel = analysis.symbolAt(handshake.indexOf("c: channel")).symbol;
const renamed = pie.ModelEditor.renameSymbol(analysis, channel.id, "net");
const after = pie.Analysis.of(renamed.text);
check(renamed.count > 5 && after.ok && after.errors.length === 0 && !/\bout\(c,/.test(renamed.text), "rename c to net: " + renamed.count + " places");
check(pie.ModelEditor.renameSymbol(analysis, channel.id, "pk").error !== undefined, "rename refused when the name is taken");

// Edits of the diagram keep the model valid
const clientIndex = analysis.program.decls.findIndex(decl => decl.kind === "ProcessDecl");
const body = ["decls", clientIndex, "body"];
let program = pie.ProcessEditor.insertBefore(analysis.program, body.concat(["next"]), pie.ProcessEditor.makeAction("New", { name: "nonce", type: "bitstring" }));
let text = pie.ModelEditor.applyProgram(analysis, program);
check(/out\(c, pkA\);\s*new nonce: bitstring;\s*in\(c/.test(text) && pie.Analysis.of(text).errors.length === 0, "insert an action");
analysis = pie.Analysis.of(text);
program = pie.ProcessEditor.moveAction(analysis.program, body.concat(["next"]), body);
text = pie.ModelEditor.applyProgram(analysis, program);
check(/=\s*new nonce: bitstring;\s*out\(c, pkA\)/.test(text), "move an action up");
analysis = pie.Analysis.of(text);
program = pie.ProcessEditor.removeAction(analysis.program, body, "then");
text = pie.ModelEditor.applyProgram(analysis, program);
check(text === handshake, "remove it: the model is back as it was");

// Goals that ProVerif verifies in separate runs
const mixed = pie.Analysis.of(example("mixed-goals.pv"));
const plan = pie.ExportPlanner.plan(mixed, { fileName: "mixed-goals.pv" });
check(plan.needSplit && plan.files.length === 2 && plan.files.every(file => file.errors.length === 0), "mixed goals: " + plan.files.map(file => file.name).join(", "));
check(!pie.ExportPlanner.plan(pie.Analysis.of(handshake), { fileName: "handshake.pv" }).needSplit, "handshake: one file");

// The zip of the export lists its files
const zip = pie.ZipWriter.make(plan.files.map(file => ({ name: file.name, text: file.text })));
const bytes = Buffer.from(zip);
check(bytes.readUInt32LE(0) === 0x04034b50 && plan.files.every(file => bytes.includes(Buffer.from(file.name))), "zip of " + bytes.length + " bytes");

// The diagram: one lane per party and the main process, arrows paired
const table = pie.NotationTable.build(pie.Analysis.of(handshake), { pp: "", conventions: new pie.Conventions() });
const model = pie.DiagramModel.build(pie.Analysis.of(handshake), table);
check(model.lanes.length === 3 && model.links.length === 3, "handshake diagram: " + model.lanes.length + " lanes, " + model.links.length + " messages");
const symmetric = pie.Analysis.of(example("symmetric.pv"));
const mirrored = pie.DiagramModel.build(symmetric, pie.NotationTable.build(symmetric, { pp: "", conventions: new pie.Conventions() }));
check(mirrored.lanes.some(lane => lane.kind === "mirror"), "symmetric party drawn with its mirrored copy");
const grouping = body => {
  const analysis = pie.Analysis.of("free c: channel.\nfree a, b, d, e: bitstring.\n\nprocess\n  " + body + "\n");
  const diagram = pie.DiagramModel.build(analysis, pie.NotationTable.build(analysis, { pp: "", conventions: new pie.Conventions() }));
  const shape = block => (block.branches ? "(" + block.branches.map(branch => shape(branch.block)).join(" | ") + ")" : "P");
  return shape(diagram.lanes[0].root);
};
const groupings = ["(out(c, a) | out(c, b)) | (out(c, d) | out(c, e))", "out(c, a) | out(c, b) | out(c, d)", "out(c, a) | (out(c, b) | out(c, d))"].map(grouping);
check(groupings.join(", ") === "((P | P) | (P | P)), (P | P | P), (P | (P | P))", "parallel branches as written: " + groupings.join(", "));
// What the main process publishes goes to the attacker when another process
// is to send a message that fits; @inout names the arrows, the only ones then
const flow = "free c: channel.\nfree d: channel [private].\ntype pkey.\nfree ka, kb: pkey.\n\n"
  + "let A(m: bitstring) =\n  in(c, k: pkey);\n  OUT_A\n  out(c, m);\n  in(c, r: bitstring).\n\n"
  + "let B() =\n  in(c, k: pkey);\n  IN_B\n  in(c, m: bitstring);\n  in(d, ok: bool);\n  out(c, m).\n\n"
  + "let H() =\n  LOST\n  out(d, true).\n\nprocess\n  out(c, (ka, kb));\n  (!A((ka, kb)) | !B() | !H())\n";
const arrows = text => {
  const analysis = pie.Analysis.of(text);
  const flowTable = pie.NotationTable.build(analysis, { pp: "", conventions: new pie.Conventions() });
  const diagram = pie.DiagramModel.build(analysis, flowTable);
  const code = id => text.slice(diagram.blocks.get(id).range[0], diagram.blocks.get(id).range[1]).replace(/;$/, "");
  return { links: diagram.links.map(link => code(link.from) + " > " + code(link.to) + (link.name ? " " + link.name : "")).join(", "), problems: flowTable.problems.map(problem => problem.message).join(" | ") };
};
const honest = arrows(flow.replace(/ *(OUT_A|IN_B|LOST)\n/g, ""));
check(honest.links === "out(c, m) > in(c, m: bitstring), out(d, true) > in(d, ok: bool), out(c, m) > in(c, r: bitstring)" && honest.problems === "",
  "an honest run: the main process publishes to the attacker: " + honest.links);
const named = arrows(flow.replace("OUT_A", "(* @inout m1 *)").replace("IN_B", "(* @inout m1 *)").replace("LOST", "(* @inout lost *)"));
check(named.links === "out(c, m) > in(c, m: bitstring) m1" && named.problems === "@inout lost: no input has this name",
  "@inout: the named arrows only, " + named.links + "; " + named.problems);
const misplaced = arrows(flow.replace("OUT_A", "").replace("IN_B", "").replace("LOST", "").replace("  in(d, ok: bool);", "  (* @inout m2 *)\n  if m = m then\n  in(d, ok: bool);"));
check(misplaced.problems === "@inout goes in a comment just before an output or an input", "@inout before a test: " + misplaced.problems);

// Design mode: let and new as assignments, types framed
const writer = new pie.LatexWriter(table);
const main = pie.Analysis.of(handshake).program.process;
const fresh = writer.action(main.body ? main.body : main);
check(/\\overset\{\\scriptstyle\\;\\\$\}\{\\leftarrow\}/.test(fresh) && /\\htmlClass\{st-type\}/.test(fresh), "new k: T as k <-rand T: " + fresh);
// The builtin types: a notation of their own, which the settings, @notation and @convention change
const builtin = (hints, conventions) => {
  const analysis = pie.Analysis.of(hints + "free c: channel.\nprocess 0\n");
  const builtinTable = pie.NotationTable.build(analysis, { conventions: new pie.Conventions(conventions) });
  const builtinWriter = new pie.LatexWriter(builtinTable);
  return { tex: ["bitstring", "bool", "nat", "channel"].map(name => builtinWriter.type(name)).join(" "), problems: builtinTable.problems.length };
};
const plain = builtin("", {});
const settings = builtin("", { "type:bool": "\\{\\top, \\bot\\}" });
const hinted = builtin("(* @notation '\\mathsf{bits}' bitstring *)\n(* @convention type:nat '\\mathbb{Z}' *)\n", {});
check(plain.tex.includes("\\{0,1\\}^*") && plain.tex.includes("\\mathbb{B}") && plain.tex.includes("\\mathbb{N}") && settings.tex.includes("\\{\\top, \\bot\\}")
  && hinted.tex.includes("\\mathsf{bits}") && hinted.tex.includes("\\mathbb{Z}") && hinted.problems === 0,
  "builtin types: " + plain.tex + "; changed in the settings, by @notation and by @convention: " + hinted.tex);
const letAction = pie.ProcessEditor.makeAction("Let", { pattern: "x", value: "pk(skA)" });
const typedModel = "type key.\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n"
  + "equation forall x: key; f(x) = x.\npred p(key).\nletfun twice(x: key) = (x, x).\nprocess 0\n";
const typedTable = pie.NotationTable.build(pie.Analysis.of(typedModel), { conventions: new pie.Conventions({}) });
const typedWriter = new pie.LatexWriter(typedTable);
const declared = pie.Analysis.of(typedModel).program.decls.slice(2).map(decl => typedWriter.declaration(decl));
check(declared.every(tex => tex && /\\htmlClass\{st-type\}\{\\mathsf\{key\}\}/.test(tex)) && /\\forall m\{:\}/.test(declared[0]) && /\\rightarrow/.test(declared[0]),
  "types in reductions, equations, predicates and letfun, framed: " + declared[0]);
check(/\\leftarrow/.test(writer.action(letAction)), "let x = M as x <- M: " + writer.action(letAction));

// The style of CryptoVerif for new and let, which ProVerif reads too
const head = node => pie.PvPrinter.head(node);
const random = pie.ProcessEditor.makeAction("New", { name: "k", type: "key", random: true });
const arrow = pie.ProcessEditor.makeAction("Let", { pattern: "x: bitstring", value: "pk(skA)", arrow: true });
const tuple = pie.ProcessEditor.makeAction("Let", { pattern: "(x, y)", value: "m", arrow: true });
const branching = pie.ProcessEditor.makeAction("Let", { pattern: "x", value: "m", arrow: true, withElse: true });
check(head(random) === "k <-R key" && head(arrow) === "x: bitstring <- pk(skA)" && head(tuple) === "let (x, y) = m in" && head(branching) === "let x = m in",
  "new and let in the style of CryptoVerif, when ProVerif reads them so: " + head(random) + "; " + head(arrow) + "; " + head(tuple));
const styled = pie.Analysis.of("free c: channel.\nfun f(bitstring): bitstring.\nprocess\n  n <-R bitstring;\n  x <- f(n);\n  out(c, x)\n");
const letPath = ["process", "next"];
const keptArrow = pie.ProcessEditor.updateAction(styled.program, letPath, { value: "f(f(n))" });
const lostArrow = pie.ProcessEditor.updateAction(styled.program, letPath, { pattern: "(y, z)" });
const elseArrow = pie.ProcessEditor.updateAction(styled.program, letPath, { withElse: true });
const keptRandom = pie.ProcessEditor.updateAction(styled.program, ["process"], { type: "key" });
check(head(pie.Ast.getAt(keptArrow, letPath)) === "x <- f(f(n))" && head(pie.Ast.getAt(lostArrow, letPath)) === "let (y, z) = f(n) in"
  && head(pie.Ast.getAt(elseArrow, letPath)) === "let x = f(n) in" && head(pie.Ast.getAt(keptRandom, ["process"])) === "n <-R key",
  "an edit keeps the style, unless the pattern or an else branch needs let ... in");
check(pie.ModelEditor.styleOf(styled.program) === "cryptoverif" && pie.ModelEditor.styleOf(pie.Analysis.of(handshake).program) === "proverif",
  "the style that a model uses most");

// Every example, rewritten in the style of CryptoVerif and back: the same
// model, the comments kept
const shape = program => JSON.stringify(pie.Ast.stripLocations(program), (key, value) => (["random", "arrow", "hasIn"].includes(key) ? undefined : value));
fs.readdirSync(path.join(root, "examples")).filter(file => file.endsWith(".pv")).sort().forEach(file => {
  const source = pie.Analysis.of(example(file));
  const cv = pie.ModelEditor.restyle(source, "cryptoverif");
  const cvAnalysis = pie.Analysis.of(cv.text);
  const back = pie.ModelEditor.restyle(cvAnalysis, "proverif");
  const backAnalysis = pie.Analysis.of(back.text);
  const comments = text => (text.match(/\(\*[\s\S]*?\*\)/g) || []).join("\n");
  check(cvAnalysis.ok && backAnalysis.ok && shape(cvAnalysis.program) === shape(source.program) && shape(backAnalysis.program) === shape(source.program)
    && comments(cv.text) === comments(source.text) && back.count === cv.count + pie.ModelEditor.restyle(source, "proverif").count,
    "   " + file + ": " + cv.count + " new and let in the style of CryptoVerif, then back");
});

// A let with an arrow before the else of a test goes into parentheses
const dangling = pie.Analysis.of("free c: channel.\nfun f(bitstring): bitstring.\nletfun g(m: bitstring) = if m = m then y <- f(m); y else m.\n"
  + "process\n  in(c, x: bitstring);\n  if x = x then y <- f(x); z <- f(y); out(c, z) else out(c, x)\n");
const unarrowed = pie.ModelEditor.restyle(dangling, "proverif");
check(/then \(let y = f\(m\) in y\) else m/.test(unarrowed.text) && /then \(let y = f\(x\) in let z = f\(y\) in out\(c, z\)\) else out\(c, x\)/.test(unarrowed.text)
  && shape(pie.Analysis.of(unarrowed.text).program) === shape(dangling.program),
  "a let before the else of an enclosing test is put in parentheses: " + unarrowed.text.trim().split("\n").pop().trim());

process.exit(failures() ? 1 : 0);
