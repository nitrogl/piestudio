/**
 * @file Checks the output parser and the trace mapper on the outputs of
 * ProVerif 2.05 saved in tests/expected, for the examples, and in
 * tests/models, for the models there: every RESULT line gives one result
 * with the same verdict, every attack trace is read, and every step that
 * names an action of the model is mapped to that action, in the listing of
 * the process that its query names; and the names that the chart of a
 * trace shows.
 *
 * Usage: node tests/check-parser.ts
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import { root, loadClasses, checker } from "./load.ts";

const pie = loadClasses();
const { check, failures } = checker();

/**
 * Tells whether ProVerif added a step to encode a goal: the nonce and the
 * channel of real-or-random secrecy, and the event that records a secret.
 *
 * @param {Object} step The step.
 * @return {boolean} True when the model has no such action.
 */
function added(step: any): boolean {
  return (step.kind === "new" && /^rand(_\d+)?$/.test(step.name))
    || ((step.kind === "out" || step.kind === "comm") && /^pub_ch(_\d+)?$/.test(step.channel))
    || (step.kind === "event" && /^\w+_contains\(/.test(step.event));
}
// ----------------------------------------------------------------

/**
 * Tells whether the code that a step is mapped to is the action of the step:
 * the same kind, and the same name, table or event.
 *
 * @param {Object} step The step.
 * @param {string} code The code of its action.
 * @param {string} other The code of the input of a communication.
 * @return {boolean} True when they agree.
 */
function agrees(step: any, code: string, other: string): boolean {
  const head = text => String(text || "").replace(/\(.*$/s, "").trim();
  const name = String(step.name || "").replace(/_\d+$/, "");

  switch (step.kind) {
    case "new":
      return new RegExp("^(new\\s+" + name + "(_\\d+)?\\b|" + name + "(_\\d+)?\\s*<-R)").test(code);

    case "out":
      return /^out\s*\(/.test(code);

    case "in":
      return /^in\s*\(/.test(code);

    case "comm":
      return /^out\s*\(/.test(code) && /^in\s*\(/.test(other);

    case "event":
    case "event-executed":
      return new RegExp("^event\\s+" + head(step.event) + "\\b").test(code);

    case "insert":
    case "get":
      return new RegExp("^" + step.kind + "\\s+" + head(step.entry) + "\\b").test(code);

    default:
      return true;
  }
}
// ----------------------------------------------------------------

const outputs = fs.readdirSync(path.join(import.meta.dirname, "expected")).filter(file => file.endsWith(".out")).sort()
  .map(file => ({ output: path.join(import.meta.dirname, "expected", file), model: path.join(root, "examples", file.replace(/\.out$/, ".pv")) }))
  .concat(fs.readdirSync(path.join(import.meta.dirname, "models")).filter(file => file.endsWith(".out")).sort()
    .map(file => ({ output: path.join(import.meta.dirname, "models", file), model: path.join(import.meta.dirname, "models", file.replace(/\.out$/, ".pv")) })));

outputs.forEach(item => {
  const file = path.basename(item.output);
  const output = fs.readFileSync(item.output, "utf8");
  const text = fs.readFileSync(item.model, "utf8");
  const analysis = pie.Analysis.of(text);
  const parsed = pie.OutputParser.parse(output);
  // A RESULT in parentheses comments on the one before it
  const expected = output.split("\n").filter(line => /^RESULT [^(].* (true|false|cannot be proved)\.$/.test(line))
    .map(line => / (true|false|cannot be proved)\.$/.exec(line)[1].replace("cannot be proved", "cannot"));
  const verdicts = parsed.results.map(result => result.verdict.replace(/^cannot.*/, "cannot"));
  check(verdicts.join(" ") === expected.join(" "), file + ": " + (verdicts.join(" ") || "no goals"));

  const listings = (output.match(/^(?:--\s+(?:.*? in )?)?(?:process|biprocess) \d+ \(that is, .*\):$/gim) || []).length;
  check(parsed.processes.size === listings, "   " + listings + " listing" + (listings === 1 ? "" : "s") + ", numbered " + Array.from(parsed.processes.keys()).join(", "));

  parsed.results.filter(result => result.trace).forEach(result => {
    const num = result.processNum === null || result.processNum === undefined ? 0 : result.processNum;
    const listing = parsed.processes.get(num);
    const view = pie.TraceMapper.build(result.trace, listing ? listing.text : "", analysis);
    const actions = view.steps.filter(step => step.occ !== undefined && !added(step));
    const mapped = actions.filter(step => step.source);
    const wrong = mapped.filter(step => !agrees(step, text.slice(step.source.start, step.source.end), step.source2 ? text.slice(step.source2.start, step.source2.end) : ""));
    check(listing && view.steps.length > 0 && mapped.length === actions.length && wrong.length === 0,
      "   trace of " + result.goal + " in process " + num + ": " + view.steps.length + " steps, " + mapped.length + " of " + actions.length + " actions mapped"
      + (wrong.length ? ", " + wrong.length + " to another action (step " + (view.steps.indexOf(wrong[0]) + 1) + ")" : "") + ", " + view.lanes.length + " lanes");
  });
});

// The names of a trace: no number when alone, a prime for the second of two,
// numbers from 1 for more; a long term shows the messages sent before by name
const named = (output, model, goal) => {
  const analysis = pie.Analysis.of(fs.readFileSync(model, "utf8"));
  const parsed = pie.OutputParser.parse(fs.readFileSync(output, "utf8"));
  const result = parsed.results.filter(item => item.trace)[goal];
  const view = pie.TraceMapper.build(result.trace, parsed.processes.get(result.processNum || 0).text, analysis);
  const names = pie.TraceNames.of(view);
  const writer = new pie.TraceWriter(pie.NotationTable.build(analysis, { pp: "", conventions: new pie.Conventions() }));
  const term = (i, field) => (names.term(i, field) ? pie.PvPrinter.term(names.term(i, field)) : null);
  return { view: view, names: names, writer: writer, term: term, lanes: view.lanes.map((lane, i) => names.lane(i).name + names.lane(i).mark).join(" ")
    , all: view.steps.map((step, i) => (pie.TraceNames.FIELDS[step.kind] || []).map(field => term(i, field)).filter(code => code).join(" ")).join(" ") };
};
const nspk = named(path.join(import.meta.dirname, "expected", "nspk.out"), path.join(root, "examples", "nspk.pv"), 0);
check(nspk.lanes === "main initiator keyRegistration responder" && !/_\d/.test(nspk.all) && nspk.term(12, "message") === "aenc((Na, A), pk(a'))" && nspk.term(6, "message") === "a",
  "nspk.out: the names of the trace without the numbers of ProVerif, " + nspk.term(12, "message"));
const tickets = named(path.join(import.meta.dirname, "models", "tickets.out"), path.join(import.meta.dirname, "models", "tickets.pv"), 0);
const sent = tickets.view.steps.findIndex(step => step.kind === "in");
check(tickets.lanes === "main ticketOffice1 ticketOffice2 ticketOffice3 gate" && /serial_1.*serial_2.*serial_3/.test(tickets.all) && !/_[4-9]/.test(tickets.all)
  && tickets.term(sent, "message") === "(~M_3, ~M_2, ~M_1)" && tickets.names.defines(sent - 1).code === "~M_3"
  && tickets.writer.term(tickets.names.term(sent, "message")) === "\\langle {\\tilde{M}}|_{3}, {\\tilde{M}}|_{2}, {\\tilde{M}}|_{1} \\rangle",
  "tickets.out: three sessions numbered from 1, a long message by the names of those sent before, " + tickets.term(sent, "message"));

process.exit(failures() ? 1 : 0);
