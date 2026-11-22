/**
 * @file Checks the ProVerif language core: the examples parse and type
 * check, the printer gives back what it read, and broken models are
 * refused at the line where ProVerif 2.05 refuses them.
 *
 * Usage: node tests/check-language.ts
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { root, loadClasses, checker } from "./load.ts";

const pie = loadClasses();
const { check, failures } = checker();

/**
 * Drops the positions and comments of a tree, to compare two parses.
 *
 * @param {Object} tree A syntax tree.
 * @return {string} Its shape, as JSON.
 */
function shape(tree: any): string {
  const skip = new Set(["start", "end", "hstart", "hend", "leadingComments", "trailingComments", "blankBefore"]);
  return JSON.stringify(tree, (key, value) => (skip.has(key) ? undefined : typeof value === "bigint" ? String(value) : value));
}
// ----------------------------------------------------------------

let compiled: WebAssembly.Module = null;

/**
 * Runs ProVerif 2.05 on a model (the broken ones stop at once).
 *
 * @param {string} source The model.
 * @return {Promise<string>} What ProVerif printed.
 */
function proverifCheck(source: string): Promise<string> {
  const context = vm.createContext({
      console: console
    , WebAssembly: WebAssembly
    , TextDecoder: TextDecoder
    , TextEncoder: TextEncoder
    , atob: atob
    , location: { href: "http://localhost/engine/proverif.js" }
    , importScripts: () => {}
  });
  context.self = context;
  vm.runInContext(fs.readFileSync(path.join(root, "engine/proverif.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "engine/ProVerifEngine.js"), "utf8") + "\nthis.ProVerifEngine = ProVerifEngine;", context);
  let output = "";
  const engine = new context.ProVerifEngine({
      scope: context
    , module: compiled || (compiled = new WebAssembly.Module(fs.readFileSync(path.join(root, "engine/proverif.wasm"))))
    , maxMemory: 256*1048576
    , onOutput: (channel, text) => {
        output += text;
      }
  });
  return engine.run(source, "model.pv", []).then(() => output);
}
// ----------------------------------------------------------------

(async () => {
  // The examples parse, type check, and print back as they were read
  const examples = fs.readdirSync(path.join(root, "examples")).filter(file => file.endsWith(".pv")).sort();
  examples.forEach(file => {
    const text = fs.readFileSync(path.join(root, "examples", file), "utf8");
    const analysis = pie.Analysis.of(text);
    const errors = analysis.diagnostics.filter(d => d.severity === "error" && d.code !== "incompatible-queries");
    check(analysis.ok && errors.length === 0, file + " parses and type checks" + (errors.length ? ": " + errors[0].message : ""));
    check(pie.ModelEditor.applyProgram(analysis, analysis.program) === text, file + " prints back unchanged");
    const printed = pie.Analysis.of(pie.PvPrinter.program ? pie.PvPrinter.program(analysis.program) : pie.ModelEditor.applyProgram(analysis, analysis.program));
    check(shape(printed.program.decls) === shape(analysis.program.decls), file + " reads back the same tree");
  });

  // Broken models: the first error is on the line where ProVerif sees it
  const base = "free c: channel.\ntype key.\nfun senc(bitstring, key): bitstring.\nevent done(key).\n";
  const broken = [
      ["missing period", base + "free k: key\nprocess 0\n"]
    , ["unknown type", base + "free k: nonce.\nprocess 0\n"]
    , ["undeclared name", base + "process out(c, m)\n"]
    , ["wrong arity", base + "free k: key.\nprocess out(c, senc(k))\n"]
    , ["type mismatch", base + "free k: key.\nprocess out(c, senc(k, k))\n"]
    , ["unknown event", base + "query x: key; event(started(x)).\nprocess 0\n"]
    , ["unknown process", base + "process Client(c)\n"]
    , ["unclosed comment", base + "(* forgotten\nprocess 0\n"]
  ];
  for (const [label, source] of broken) {
    const analysis = pie.Analysis.of(source);
    const first = analysis.diagnostics.filter(d => d.severity === "error").sort((a, b) => a.start - b.start)[0];
    const output = await proverifCheck(source);
    const reported = /line (\d+)/.exec(output);
    const line = first ? analysis.lineIndex.pos(first.start).line : null;
    check(first && reported && Number(reported[1]) === line, label + ": line " + line + " as ProVerif (" + (first ? first.message : "no error") + ")");
  }
  process.exit(failures() ? 1 : 0);
})();
