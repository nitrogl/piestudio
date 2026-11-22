/**
 * @file Checks the engine of PieStudio, ProVerif for WebAssembly: engine/
 * holds the files that scripts/update-engine.sh copies, and every example of
 * PieStudio, verified under Node as the web worker does, gives the output of
 * native ProVerif 2.05 saved in tests/expected, and so does the example with
 * its new names and lets rewritten in the style of CryptoVerif; the models of
 * tests/models give the outputs saved next to them. The engine has its own,
 * fuller checks in its repository.
 *
 * Usage: node tests/check-engine.ts
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { root, loadClasses, checker } from "./load.ts";

const { check, failures } = checker();
const pie = loadClasses();
const engineFolder = path.join(root, "engine");

/**
 * The files of engine/, as scripts/update-engine.sh copies them.
 *
 * @type {Array<string>}
 */
const ENGINE_FILES: string[] = [
    "ProVerifRunner.js", "ProVerifEngine.js", "proverif-worker.js", "proverif.js", "proverif.wasm", "proverif-wasm.js"
  , "ProVerifRunner.d.ts", "ProVerifEngine.d.ts", "NOTICE", "COPYING", "LICENSE-OCaml.txt", "LICENSE-Emscripten.txt"
];

/**
 * Loads the engine into a context that looks like a web worker.
 *
 * @return {Object} The context, where createProVerif and ProVerifEngine are
 *   defined, and the compiled module.
 */
function loadEngine() {
  const context = vm.createContext({
      console: console
    , WebAssembly: WebAssembly
    , TextDecoder: TextDecoder
    , TextEncoder: TextEncoder
    , atob: atob
    , location: { href: "http://localhost/engine/proverif-worker.js" }
    , importScripts: () => {}
  });
  context.self = context;
  vm.runInContext(fs.readFileSync(path.join(engineFolder, "proverif.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(engineFolder, "ProVerifEngine.js"), "utf8")
    + "\nthis.ProVerifEngine = ProVerifEngine;", context);
  const module = new WebAssembly.Module(fs.readFileSync(path.join(engineFolder, "proverif.wasm")));
  return { context: context, module: module };
}
// ----------------------------------------------------------------

/**
 * Runs ProVerif once.
 *
 * @param {Object} loaded The engine, from loadEngine.
 * @param {string} source The model.
 * @param {string} fileName Its file name.
 * @return {Promise<Object>} The result of the run and its output.
 */
function verify(loaded: any, source: string, fileName: string): Promise<any> {
  let output = "";
  const engine = new loaded.context.ProVerifEngine({
      scope: loaded.context
    , module: loaded.module
    , maxMemory: 1024*1048576
    , onOutput: (channel, text) => {
        output += text;
      }
  });
  return engine.run(source, fileName, []).then(result => ({ result: result, output: output }));
}
// ----------------------------------------------------------------

(async () => {
  // The files of the engine, as scripts/update-engine.sh copies them
  const files = fs.readdirSync(engineFolder).sort();
  check(files.join(" ") === ENGINE_FILES.slice().sort().join(" "), "engine/ holds the " + files.length + " files of the engine: " + files.join(", "));

  // The examples, as native ProVerif 2.05 verifies them
  const loaded = loadEngine();
  const examples = fs.readdirSync(path.join(root, "examples")).filter(file => file.endsWith(".pv")).sort();
  for (const file of examples) {
    const text = fs.readFileSync(path.join(root, "examples", file), "utf8");
    const expected = fs.readFileSync(path.join(import.meta.dirname, "expected", file.replace(/\.pv$/, ".out")), "utf8");
    const run = await verify(loaded, text, file);
    const output = run.output.split(loaded.context.ProVerifEngine.WORK_DIR + "/" + file).join(file);
    check(run.result.status === "done" && output === expected,
      file + " " + run.result.status + " exit " + run.result.exitCode + ", " + run.result.ms + " ms");
    // I check that ProVerif reads the style of CryptoVerif as the same model
    const restyled = pie.ModelEditor.restyle(pie.Analysis.of(text), "cryptoverif");
    const again = await verify(loaded, restyled.text, file);
    check(restyled.count > 0 && again.result.status === "done" && again.output.split(loaded.context.ProVerifEngine.WORK_DIR + "/" + file).join(file) === expected,
      "   " + file + " with " + restyled.count + " new and let as in CryptoVerif: the same output");
  }

  const models = fs.readdirSync(path.join(import.meta.dirname, "models")).filter(file => file.endsWith(".pv")).sort();
  for (const file of models) {
    const run = await verify(loaded, fs.readFileSync(path.join(import.meta.dirname, "models", file), "utf8"), file);
    const output = run.output.split(loaded.context.ProVerifEngine.WORK_DIR + "/" + file).join(file);
    check(run.result.status === "done" && output === fs.readFileSync(path.join(import.meta.dirname, "models", file.replace(/\.pv$/, ".out")), "utf8"),
      "tests/models/" + file + " " + run.result.status + " exit " + run.result.exitCode + ", " + run.result.ms + " ms");
  }

  process.exit(failures() ? 1 : 0);
})();
