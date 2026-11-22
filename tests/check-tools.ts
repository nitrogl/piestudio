/**
 * @file Checks the tools that need no browser: the refactoring in a
 * selection, the libraries, the engine settings, the LaTeX of the protocol
 * and the report of a verification.
 *
 * Usage: node tests/check-tools.ts
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import { root, loadClasses, checker } from "./load.ts";

const pie = loadClasses();
const { check, failures } = checker();
const handshake = fs.readFileSync(path.join(root, "examples", "handshake.pv"), "utf8");

// The engine settings: budgets up to 4 GB, or none, and no time limit
const settings = new pie.EngineSettings({ maxMemoryMB: 4095, timeoutSeconds: 0 });
check(settings.getMaxMemoryBytes() === 4095*1048576 && settings.getTimeoutSeconds() === 0, "a run may have 4 GB and no time limit");
check(new pie.EngineSettings({ maxMemoryMB: 0 }).getMaxMemoryBytes() === 0 && new pie.EngineSettings({ maxMemoryMB: 10 }).maxMemoryMB === 64,
  "a budget of 0 means no limit; a tiny budget is raised to 64 MB");

// Refactoring: only in the selection, applied once, and checked
const analysis = pie.Analysis.of(handshake);
const range = { start: handshake.indexOf("let clientA"), end: handshake.indexOf("let serverB") };
const k = pie.RefactorSession.candidates(analysis, range).find(candidate => candidate.symbol.name === "k").symbol;
const session = new pie.RefactorSession(analysis, k, range);
const renamed = session.apply("sessionKey");
const client = renamed.slice(range.start, renamed.indexOf("let serverB"));
check(session.occurrences.length === 4 && !/\bk\b/.test(client) && /new k: key/.test(renamed), "rename k in the client only: " + session.occurrences.length + " occurrences");
check(session.check("sessionKey").ok, "the new name is accepted");
check(!session.check("pkB").ok, "a name that captures a parameter is refused: " + session.check("pkB").problems[0]);
check(!session.check("c").ok, "a name declared for the whole model is refused");
check(!session.check("3k").ok, "a name that is not an identifier is refused");
session.toggle(session.occurrences[3].start);
check(session.included().length === 3 && !session.check("sessionKey").ok, "an occurrence left out makes the rename wrong, and it says so");

// Libraries: the model is checked after them, their problems kept apart
const library = { name: "crypto.pvl", text: "type key.\nfun senc(bitstring, key): bitstring.\nfun h(bitstring): bitstrin.\n" };
const model = "free c: channel.\nfree s: bitstring [private].\nprocess new k: key; out(c, senc(s, k))\n";
check(pie.Analysis.of(model).errors.length > 0, "without its library the model has errors");
const withLibrary = pie.Analysis.of(model, { libraries: [library] });
check(withLibrary.errors.length === 0 && withLibrary.libraryProblems.length === 1 && withLibrary.libraryProblems[0].line === 3,
  "with it the model is fine, and the error of the library is on its line 3: " + withLibrary.libraryProblems.map(problem => problem.message).join(""));
// A model that names its libraries uses those, in its order; the others are not used, the missing ones are reported
const other = { name: "other.pvl", text: "type key.\n" };
const named = "(* @library 'lib/crypto.pvl' *)\n" + model;
const picked = pie.Analysis.of(named, { libraries: [other, library] });
const lacking = pie.Analysis.of(named, { libraries: [other] });
const where = lacking.missingLibraries.length ? named.slice(lacking.missingLibraries[0].start, lacking.missingLibraries[0].end) : "";
check(picked.libraries.length === 1 && picked.libraries[0] === library && picked.errors.length === 0 && picked.missingLibraries.length === 0
  && lacking.libraries.length === 0 && where === "@library 'lib/crypto.pvl'" && lacking.errors.length > 0
  && withLibrary.libraries.length === 1 && withLibrary.libraryProblems[0].start === library.text.indexOf("bitstrin."),
  "@library names the libraries of the model: crypto.pvl used, other.pvl not; without it, missing at " + where);

// The LaTeX of the protocol and the report
const table = pie.NotationTable.build(analysis, { pp: "", conventions: new pie.Conventions() });
const tikz = pie.TikzWriter.write(pie.DiagramModel.build(analysis, table), new pie.LatexWriter(table), "handshake.pv");
check(/\\begin\{tikzpicture\}/.test(tikz) && (tikz.match(/\\draw\[message\]/g) || []).length === 3 && !/htmlClass/.test(tikz), "TikZ of the handshake: 2 parties, 3 messages");
const report = pie.ReportWriter.write({ fileName: "m.pv", text: "<model>", run: { results: [{ fileName: "", result: { verdict: "true", goal: "not attacker(s[])" } }], message: "1 goal", ms: 100, memory: 1 }, libraries: [] });
check(/not attacker\(s\[\]\)/.test(report) && /&lt;model&gt;/.test(report), "the report holds the goals and the escaped model");

process.exit(failures() ? 1 : 0);
