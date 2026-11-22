/**
 * @file Loads the classes of the application into a context, as the page
 * does with its script tags, for the checks that run under Node.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.join(import.meta.dirname, "..");

/**
 * The classes of the studio that need no browser, from the root, in the
 * order of index.html.
 *
 * @type {Array<string>}
 */
const CLASSES: string[] = [
    "js/app/language/PvToken", "js/app/language/Ast", "js/app/language/CommentAttacher", "js/app/language/PvLexer", "js/app/language/PvParser"
  , "js/app/language/PvPrinter", "js/app/language/Scope", "js/app/language/PvSettings", "js/app/language/MacroExpander"
  , "js/app/language/QueryChecker", "js/app/language/PvChecker", "js/app/language/Modifiers", "js/app/language/PvExplain", "js/app/language/PvLanguage"
  , "js/app/model/Analysis", "js/app/model/ModelEditor", "js/app/model/ProcessEditor", "js/app/model/ExportPlanner", "js/app/model/DeclSpecs"
  , "js/app/model/DiagramModel", "js/app/model/Examples", "js/app/notation/LatexWriter", "js/app/notation/TraceWriter", "js/app/engine/OutputParser"
  , "js/app/engine/TraceMapper", "js/app/engine/TraceNames", "js/app/model/RefactorSession", "js/app/model/ReportWriter"
];

/**
 * Studio Core, as the page loads it, and its declarations, which name its
 * classes.
 *
 * @type {string}
 */
const CORE = "studio-core/studio-core.min.js";
const CORE_TYPES = "studio-core/studio-core.d.ts";

/**
 * Runs Studio Core in a context, where its classes become properties.
 *
 * @param {Object} context The context.
 */
function loadCore(context) {
  const source = fs.readFileSync(path.join(root, CORE), "utf8");
  const types = fs.readFileSync(path.join(root, CORE_TYPES), "utf8");
  const names = [...types.matchAll(/^declare class ([A-Za-z_$][\w$]*)/gm)].map(match => match[1]);
  vm.runInContext(source + "\n" + names.map(name => "this." + name + " = " + name + ";").join("\n"), context, { filename: CORE });
}
// ----------------------------------------------------------------

/**
 * Loads Studio Core and the classes into a new context.
 *
 * @return {Object} The context, where every class is defined.
 */
function loadClasses() {
  const context = vm.createContext({ console: console, TextEncoder: TextEncoder, TextDecoder: TextDecoder });
  loadCore(context);
  CLASSES.forEach(file => {
    const name = path.basename(file);
    const source = fs.readFileSync(path.join(root, file + ".js"), "utf8");
    vm.runInContext(source + "\nthis." + name + " = " + name + ";", context, { filename: file + ".js" });
  });
  return context;
}
// ----------------------------------------------------------------

/**
 * Counts the checks, and prints each one.
 *
 * @return {Object} check(ok, label), and failures() for the exit code.
 */
function checker() {
  let failures = 0;
  return {
      check: (ok, label) => {
        console.log((ok ? "PASS " : "FAIL ") + label);
        if (!ok) {
          failures++;
        }
      }
    , failures: () => failures
  };
}
// ----------------------------------------------------------------

export { root, loadCore, loadClasses, checker };
