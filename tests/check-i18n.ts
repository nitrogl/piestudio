/**
 * @file Checks the translations of PieStudio: the files of lang/ are up to
 * date with the messages of the code, no translation is refused (they keep
 * the placeholders and the tags of their messages), the page gets the
 * languages from lang/languages.js, and the Italian translation is
 * complete and written with the keys of an Italian keyboard: its letters
 * with accents are the small ones (no capital E with a grave accent at the
 * start of a sentence), and it has no long dashes, curly quotes or
 * ellipsis characters.
 *
 * Usage: node tests/check-i18n.js
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { root, loadCore, checker } from "./load.ts";
import * as build from "../studio-core/tools/build-i18n.ts";
import pkg from "../package.json" with { type: "json" };

const { check, failures } = checker();

// The files of lang/, as the build would write them
const output = [];
const result = build.main({
    root: root
  , project: "PieStudio " + pkg.version
  , page: "index.html"
  , skip: file => file.startsWith("engine/")
  , source: file => file.replace(/^js\//, "src/").replace(/\.js$/, ".ts")
  , folders: ["src"]
  , license: "GPL-2.0-or-later"
  , log: line => output.push(line)
}, ["--check"]);
check(result.ok, "lang/ is up to date with the messages of the code, and no translation is refused"
  + (result.ok ? "" : ":\n  " + output.filter(line => line.startsWith("ERROR")).join("\n  ")));

// The page: the template and the languages
const page = vm.createContext({});
loadCore(page);
vm.runInContext(fs.readFileSync(path.join(root, "lang", "languages.js"), "utf8"), page);
const I18n = page.I18n;
const template = I18n.parsePo(fs.readFileSync(path.join(root, "lang", "template.pot"), "utf8"));
const italian = I18n.languages.get("it");
check(I18n.entries.length === template.entries.length && I18n.entries.length > 300 && italian && italian.name === "Italiano",
  "the page has the " + I18n.entries.length + " messages of the template, and Italian");
check(italian && I18n.translated(italian) === I18n.entries.length, "Italian translates every message: " + (italian ? I18n.translated(italian) : 0) + " of " + I18n.entries.length);

// The letters of an Italian keyboard
const po = I18n.parsePo(fs.readFileSync(path.join(root, "lang", "it.po"), "utf8"));
// The small letters with accents of the keyboard: a, e (grave and acute), i, o, u
const keyboard = new Set([224, 232, 233, 236, 242, 249]);
const strange = [];
po.entries.filter(entry => !entry.obsolete).forEach(entry => {
  entry.strings.forEach(string => {
    Array.from(string as string).forEach(c => {
      if (c.charCodeAt(0) > 126 && !keyboard.has(c.charCodeAt(0)) && !entry.id.includes(c)) {
        strange.push(c + " (" + c.charCodeAt(0) + ") in " + JSON.stringify(entry.id).slice(0, 60));
      }
    });
  });
});
check(strange.length === 0, "the Italian translation types on an Italian keyboard" + (strange.length ? ": " + strange.slice(0, 5).join("; ") : ""));
check(po.entries.every(entry => entry.flags.indexOf("fuzzy") < 0), "no Italian translation is marked fuzzy, to check");

process.exit(failures() ? 1 : 0);
