/**
 * @file Drives PieStudio in a headless Chromium through the main loop: edit
 * a block, undo and redo, drop an action from the palette, move it, verify,
 * follow the attack trace, which stays where it is, read it in both modes,
 * drag the diagram with the middle button, export split files, stop
 * at the memory budget, mirror a symmetric party, rename everywhere, write
 * new and let in the style of CryptoVerif, fit a phone screen, then refactor
 * in a selection, use a library, write the LaTeX of the protocol, and speak
 * Italian and a language that a student loads from a PO file, which the
 * languages.js that the Language pane gives then brings to whoever opens the
 * page; and verify the model in a page opened from disk.
 *
 * Usage: npm install && node tests/check-ui.ts [dist | LINK]
 *   With "dist", it checks the copy built by dist.sh instead of the sources;
 *   with a link (https://.../piestudio/), the copy that a web server gives
 *   there, which must be of the version of the sources (the files to
 *   translate are compared with those of lang/).
 *   PLAYWRIGHT_CHROMIUM may give the path of a Chromium to use.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */

import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { root, checker } from "./load.ts";

declare const PieStudio: any, I18n: any, TikzWriter: any, $: any, bootstrap: any;

const { check, failures } = checker();
const subject = process.argv[2] || "";
const link = /^https?:\/\//.test(subject) ? subject.replace(/\/?(index\.html)?$/, "/index.html") : null;
const folder = subject === "dist" ? path.join(root, "dist") : root;
// The page loads everything from its folder, the core and the engine included
const served = folder;
const start = "/index.html";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

/**
 * Serves the application on a free port of localhost.
 *
 * @return {Promise<http.Server>} The server, listening.
 */
function serve(): Promise<http.Server> {
  const server = http.createServer((request, response) => {
    const file = path.join(served, decodeURIComponent(request.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!file.startsWith(served) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}
// ----------------------------------------------------------------

/**
 * Gives a PO file without its obsolete messages (#~), which lang/ keeps so
 * that no translation is lost, and the Language pane leaves out.
 *
 * @param {string} text The PO file.
 * @return {string} Its current messages.
 */
function current(text: string): string {
  return text.split("\n").filter(line => !line.startsWith("#~")).join("\n").replace(/\s+$/, "\n");
}
// ----------------------------------------------------------------

/**
 * Runs one check of the page; an exception makes it fail.
 *
 * @param {string} label What it checks.
 * @param {function():Promise<boolean|string>} body The check: false when it
 *   fails, or a string to show when it passes.
 */
async function step(label: string, body: (() => Promise<boolean | string>)) {
  try {
    const result = await body();
    check(result !== false, label + (typeof result === "string" ? ": " + result : ""));
  } catch (e: any) {
    check(false, label + ": " + e.message.split("\n")[0]);
  }
}
// ----------------------------------------------------------------

(async () => {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch (e) {
    console.log("SKIP Playwright is not installed (npm install)");
    return;
  }
  const server = link ? null : await serve();
  const url = link || "http://127.0.0.1:" + (server.address() as AddressInfo).port + start;
  const browser = await playwright.chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, acceptDownloads: true, locale: "en-US" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
  await page.waitForTimeout(1200);

  const text = () => page.evaluate(() => PieStudio.getInstance().getText());
  const modalShown = async () => {
    await page.waitForSelector("#st-modal.show");
    await page.waitForFunction(() => !bootstrap.Modal.getInstance(document.querySelector("#st-modal"))._isTransitioning);
  };
  const modalHidden = async () => {
    await page.waitForSelector("#st-modal:not(.show)", { state: "attached" });
    await page.waitForFunction(() => !document.querySelector(".modal-backdrop"));
  };
  const verified = () => page.waitForFunction(() => !document.querySelector("#verify-button").classList.contains("btn-danger"), null, { timeout: 120000 })
    .then(() => page.waitForTimeout(300));
  // Saves the settings, which load the page again when the language changes
  const saveAndReload = async () => {
    await Promise.all([page.waitForNavigation(), page.locator("#st-modal .modal-footer .btn-primary").click()]);
    await page.waitForFunction(() => typeof PieStudio !== "undefined" && PieStudio.instance !== null && PieStudio.instance.model !== null, null, { timeout: 30000 });
    await page.waitForTimeout(500);
  };
  const original = await text();

  await step("the example is drawn", async () => {
    const lanes = await page.locator(".st-lane").count();
    return lanes === 3 ? lanes + " lanes, " + await page.locator(".st-block").count() + " blocks" : false;
  });

  await step("a double click edits a block, undo and redo", async () => {
    await page.locator(".st-lane-macro .st-block.st-k-out > .st-block-head").first().dblclick();
    await modalShown();
    await page.locator("#st-modal [data-key=msg]").fill("(pkA, pkA)");
    await page.locator("#st-modal .modal-footer .btn-primary").click();
    await modalHidden();
    const edited = await text();
    await page.keyboard.press("Control+z");
    const undone = await text();
    await page.keyboard.press("Control+Shift+z");
    const redone = await text();
    await page.keyboard.press("Control+z");
    return edited.includes("out(c, (pkA, pkA))") && undone === original && redone === edited;
  });

  await step("an action dropped from the palette", async () => {
    const source = await page.locator(".st-palette-item[data-kind=New]").boundingBox();
    const target = await page.locator(".st-lane-macro .st-block.st-k-in > .st-block-head").first().boundingBox();
    await page.mouse.move(source.x + source.width/2, source.y + source.height/2);
    await page.mouse.down();
    await page.mouse.move(source.x + 40, source.y + 10, { steps: 5 });
    await page.mouse.move(target.x + 30, target.y + 3, { steps: 15 });
    await page.mouse.up();
    await modalShown();
    await page.locator("#st-modal [data-key=name]").fill("nonce");
    await page.locator("#st-modal .modal-footer .btn-primary").click();
    await modalHidden();
    return /out\(c, pkA\);\s*new nonce: bitstring;\s*in\(c/.test(await text());
  });

  await step("verify and follow the attack trace, which stays where it is", async () => {
    await page.keyboard.press("Control+z");
    await page.keyboard.press("F5");
    await verified();
    const status = await page.locator(".st-run-status").innerText();
    const index = await page.evaluate(() => {
      const pane = document.querySelector("[data-pane=trace]");
      pane.scrollTop = 80;
      pane.querySelector(".st-msc-wrap").setAttribute("data-kept", "yes");
      const top = pane.querySelector(".st-msc-heads").getBoundingClientRect().bottom;
      const bottom = pane.getBoundingClientRect().bottom;
      const shown = Array.from(pane.querySelectorAll(".st-msc-box, .st-msc-label")).filter(element => {
        const box = element.getBoundingClientRect();
        return box.top > top + 4 && box.bottom < bottom - 4;
      });
      return shown.length > 1 ? shown[1].getAttribute("data-index") : null;
    });
    const scroll = await page.evaluate(() => document.querySelector("[data-pane=trace]").scrollTop);
    await page.locator("[data-pane=trace] .st-msc-wrap [data-index=\"" + index + "\"]").first().click();
    const kept = await page.evaluate(() => {
      const pane = document.querySelector("[data-pane=trace]");
      return { scroll: pane.scrollTop, same: pane.querySelector(".st-msc-wrap[data-kept=yes]") !== null, on: pane.querySelectorAll(".st-on").length };
    });
    const traced = await page.locator(".st-block.st-traced").count();
    return /3 goals: 1 proved, 2 false/.test(status) && index !== null && traced === 1 && kept.same && kept.on > 0 && kept.scroll === scroll
      ? status.replace(/\s+/g, " ") + "; step " + (Number(index) + 1) + " chosen, the trace still at " + scroll + " px" : false;
  });

  await step("the trace in the notation of the mode, its names without the numbers of ProVerif, nothing cut", async () => {
    const shown = async () => page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll("[data-pane=trace] .st-msc-box, [data-pane=trace] .st-msc-label")) as HTMLElement[];
      return { formulas: labels.filter(label => label.querySelector(".katex")).length, code: labels.filter(label => label.querySelector(".st-msc-code")).length
        , numbered: labels.filter(label => /[A-Za-z]_\d/.test(label.textContent)).length, cut: labels.filter(label => label.scrollWidth > label.clientWidth + 1).length
        , over: labels.filter((label, i) => i > 0 && label.getBoundingClientRect().top < labels[i - 1].getBoundingClientRect().bottom - 1).length, all: labels.length };
    });
    await page.evaluate(() => PieStudio.getInstance().setMode("design"));
    await page.waitForTimeout(300);
    const design = await shown();
    await page.evaluate(() => PieStudio.getInstance().setMode("expert"));
    await page.waitForTimeout(300);
    const expert = await shown();
    await page.evaluate(() => PieStudio.getInstance().setMode("design"));
    const fine = design.all > 0 && design.formulas >= design.all - 1 && expert.formulas === 0 && expert.code >= expert.all - 1
      && [design, expert].every(mode => mode.numbered === 0 && mode.cut === 0 && mode.over === 0);
    return fine ? design.formulas + " formulas of " + design.all + " steps in the Design mode, " + expert.code + " lines of code in the Expert mode" : false;
  });

  await step("the middle button of the mouse drags the diagram, across and down", async () => {
    const drag = async () => {
      const box = await page.locator("#diagram").boundingBox();
      await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
      await page.mouse.down({ button: "middle" });
      await page.mouse.move(box.x + box.width/2 - 90, box.y + box.height/2 - 60, { steps: 4 });
      const dragging = await page.evaluate(() => document.querySelector("#diagram").classList.contains("st-panning"));
      await page.mouse.up({ button: "middle" });
      return dragging;
    };
    await page.evaluate(() => {
      PieStudio.getInstance().diagram.setZoom(2);
      const diagram = document.querySelector("#diagram");
      diagram.scrollLeft = 0;
      diagram.scrollTop = 0;
    });
    const dragging = await drag();
    const moved = await page.evaluate(() => {
      const diagram = document.querySelector("#diagram");
      const at = { left: diagram.scrollLeft, top: diagram.scrollTop, still: diagram.classList.contains("st-panning") };
      PieStudio.getInstance().diagram.setZoom(1);
      return at;
    });
    return dragging && !moved.still && moved.left === 90 && moved.top === 60 ? "moved by " + moved.left + " and " + moved.top + " px" : false;
  });

  await step("goals that need separate runs: verified in parallel, exported as several files", async () => {
    await page.evaluate(() => PieStudio.getInstance().openExample("mixed-goals"));
    await page.waitForTimeout(500);
    await page.keyboard.press("F5");
    await verified();
    const files = new Set(await page.locator(".st-result td:nth-child(3)").allInnerTexts());
    const parallel = await page.evaluate(() => PieStudio.getInstance().verifier.run.limit === 2*PieStudio.getInstance().verifier.run.budget);
    await page.keyboard.press("Control+e");
    await modalShown();
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#st-modal .modal-footer .btn-primary").click()]);
    await modalHidden();
    return files.size === 2 && parallel && download.suggestedFilename() === "mixed-goals.zip" ? [...files].join(", ") : false;
  });

  await step("the run stops at its memory budget", async () => {
    const names = [];
    for (let i = 0; i < 20000; i++) {
      names.push("n" + i);
    }
    const model = "free c: channel.\n" + names.map(name => "free " + name + ": bitstring.\n").join("") + "process\n  out(c, (" + names.join(", ") + "))\n";
    await page.evaluate(model => {
      const studio = PieStudio.getInstance();
      studio.load(model, "names.pv", "", false);
      studio.settings.maxMemoryMB = 33;
    }, model);
    await page.click("#verify-button");
    await verified();
    const status = await page.locator(".st-run-status").innerText();
    return /memory budget of 33 MB/.test(status) ? status.replace(/\s+/g, " ") : false;
  });

  await step("the same run with no memory limit", async () => {
    await page.evaluate(() => {
      PieStudio.getInstance().settings.maxMemoryMB = 0;
    });
    await page.click("#verify-button");
    await verified();
    const status = await page.locator(".st-run-status").innerText();
    await page.evaluate(() => {
      PieStudio.getInstance().settings.maxMemoryMB = 1024;
    });
    return /no limit/.test(status) && !/Stopped/.test(status) ? status.replace(/\s+/g, " ") : false;
  });

  await step("a symmetric party with its mirrored copy", async () => {
    await page.evaluate(() => PieStudio.getInstance().openExample("handshake"));
    await page.waitForTimeout(500);
    await page.locator(".st-lane-macro .st-symmetric").first().click();
    const mirrors = await page.locator(".st-lane.st-mirror").count();
    return mirrors === 1 && /\(\* @symmetric \*\)\nlet clientA/.test(await text());
  });

  await step("rename everywhere (F2)", async () => {
    const before = await text();
    await page.locator(".st-decl", { hasText: "channel" }).first().click();
    await page.keyboard.press("F2");
    await modalShown();
    await page.locator("#st-modal input").first().fill("net");
    await page.locator("#st-modal .modal-footer .btn-primary").click();
    await modalHidden();
    const after = await text();
    await page.click("#diagram");
    await page.keyboard.press("Control+z");
    return /out\(net, /.test(after) && !/out\(c, /.test(after) && await text() === before;
  });

  await step("new and let in the style of CryptoVerif", async () => {
    const before = await text();
    const blocks = await page.locator(".st-block").count();
    await page.locator(".st-menu-button", { hasText: "Edit" }).click();
    await page.locator("[data-command=restyle][data-style=cryptoverif]").click();
    await page.waitForTimeout(300);
    const after = await text();
    const redrawn = await page.locator(".st-block").count();
    // I add a new name: it takes the style of the model
    const source = await page.locator(".st-palette-item[data-kind=New]").boundingBox();
    const target = await page.locator(".st-lane-macro .st-block.st-k-in > .st-block-head").first().boundingBox();
    await page.mouse.move(source.x + source.width/2, source.y + source.height/2);
    await page.mouse.down();
    await page.mouse.move(source.x + 40, source.y + 10, { steps: 5 });
    await page.mouse.move(target.x + 30, target.y + 3, { steps: 15 });
    await page.mouse.up();
    await modalShown();
    const ticked = await page.locator("#st-modal [data-key=random]").isChecked();
    await page.locator("#st-modal [data-key=name]").fill("nonce");
    await page.locator("#st-modal .modal-footer .btn-primary").click();
    await modalHidden();
    const added = await text();
    await page.click("#diagram");
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Control+z");
    const count = (after.match(/ <-R | <- /g) || []).length;
    return / <-R /.test(after) && !/\bnew [A-Za-z][A-Za-z0-9_']*: /.test(after) && !/\blet [A-Za-z][A-Za-z0-9_']* = /.test(after) && redrawn === blocks
      && ticked && /nonce <-R bitstring;\s*in\(c/.test(added) && await text() === before ? count + " new and let rewritten, a new name added as nonce <-R bitstring" : false;
  });

  await step("a phone screen without horizontal scrolling", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  });

  await page.setViewportSize({ width: 1500, height: 950 });
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
  await page.waitForTimeout(2000);

  await step("refactoring in a selection, applied once", async () => {
    const range = await page.evaluate(() => {
      const text = PieStudio.getInstance().getText();
      const code = PieStudio.getInstance().code;
      code.textarea.focus();
      code.textarea.setSelectionRange(text.indexOf("let clientA"), text.indexOf("let serverB") - 1);
      return text.indexOf("let serverB");
    });
    await page.keyboard.press("Shift+F2");
    await page.waitForSelector(".st-refactor:visible");
    const id = await page.evaluate(() => [...document.querySelectorAll<HTMLOptionElement>(".st-refactor select option")].find(option => /^k \(/.test(option.textContent)).value);
    await page.locator(".st-refactor select").selectOption(id);
    await page.locator(".st-refactor input").fill("x");
    const unchanged = await text() === original;
    await page.locator(".st-refactor input").fill("sessionKey");
    await page.locator(".st-refactor input").press("Enter");
    const after = await text();
    return unchanged && /sessionKey/.test(after.slice(0, range + 20)) && /new k: key/.test(after);
  });

  await step("a library checked with the model and given to ProVerif", async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "piestudio-"));
    fs.writeFileSync(path.join(folder, "crypto.pvl"), "type key.\nfun senc(bitstring, key): bitstring.\n");
    await page.evaluate(() => PieStudio.getInstance().load("free c: channel.\nfree s: bitstring [private].\nquery attacker(s).\nprocess new k: key; out(c, senc(s, k))\n", "lib.pv", "", false));
    await page.setInputFiles("#library-input", path.join(folder, "crypto.pvl"));
    await page.waitForTimeout(1500);
    await page.keyboard.press("F5");
    await verified();
    const status = await page.locator(".st-run-status").innerText();
    const errorsLeft = await page.evaluate(() => PieStudio.getInstance().problems().filter(problem => problem.severity === "error").length);
    await page.evaluate(() => PieStudio.getInstance().tools.removeLibrary(0));
    return /1 goal: 1 proved/.test(status) && errorsLeft === 0 ? status.replace(/\s+/g, " ") : false;
  });

  await step("the LaTeX of the protocol", async () => {
    await page.evaluate(() => PieStudio.getInstance().openExample("mixed-goals"));
    await page.waitForTimeout(500);
    await page.evaluate(() => PieStudio.getInstance().openExample("handshake"));
    const tikz = await page.evaluate(() => TikzWriter.write(PieStudio.getInstance().model, PieStudio.getInstance().writer, "handshake.pv"));
    return /\\begin\{tikzpicture\}/.test(tikz);
  });

  await step("Italian, chosen in the settings: the page loads again with the model and the history of its changes", async () => {
    await page.evaluate(() => {
      const studio = PieStudio.getInstance();
      studio.commit(studio.getText() + "\n(* A note *)\n", "A note");
    });
    const before = await text();
    await page.evaluate(() => PieStudio.getInstance().openSettings("language"));
    await modalShown();
    await page.locator("#st-modal select[data-key=language]").selectOption("it");
    await saveAndReload();
    const after = await text();
    const menus = (await page.locator(".st-menu-button").allInnerTexts()).join(", ");
    // A text of the page that has a translation and still shows in English
    const english = await page.evaluate(() => {
      const left = [];
      document.querySelectorAll("[data-i18n]").forEach(element => {
        const listed = I18n.normalize(element.getAttribute("data-i18n"));
        const texts = listed ? [] : Array.from(element.childNodes).filter(node => node.nodeType === 3).map(node => I18n.normalize(node.nodeValue));
        const values = texts.concat((listed ? listed.split(" ") : I18n.ATTRIBUTES).map(name => I18n.normalize(element.getAttribute(name) || "")));
        values.filter(value => value && typeof I18n.current.messages[value] === "string" && I18n.current.messages[value] !== value).forEach(value => left.push(value));
      });
      return left;
    });
    const groups = (await page.locator(".st-group-title").allInnerTexts()).join(", ");
    const lang = await page.evaluate(() => document.documentElement.lang);
    const label = await page.evaluate(() => PieStudio.getInstance().history.undoLabel);
    await page.evaluate(() => PieStudio.getInstance().undo());
    const undone = await text();
    return after === before && undone + "\n(* A note *)\n" === before && label === "A note" && /^File, Modifica, Visualizza, Aiuto$/.test(menus) && english.length === 0
      && /Partecipanti/.test(groups) && lang === "it" ? menus : false;
  });

  await step("Italian: the verification, its plurals, the pop-ups, the about box, a phone screen", async () => {
    await page.evaluate(() => PieStudio.getInstance().openExample("handshake"));
    await page.waitForTimeout(500);
    await page.keyboard.press("F5");
    await verified();
    const status = await page.locator("[data-pane=results] .st-run-status").innerText();
    const verdicts = (await page.locator(".st-result .st-verdict").allInnerTexts()).join(", ");
    const head = await page.locator("[data-pane=results] thead").innerText();
    await page.locator(".st-lane-macro .st-block.st-k-out > .st-block-head").first().dblclick();
    await modalShown();
    const action = await page.locator("#st-modal .modal-title").innerText();
    const labels = (await page.locator("#st-modal .st-form-label").allInnerTexts()).join(", ");
    await page.locator("#st-modal .modal-footer .btn-secondary").click();
    await modalHidden();
    await page.evaluate(() => PieStudio.getInstance().about());
    await modalShown();
    const title = await page.locator("#st-modal .modal-title").innerText();
    const about = await page.locator("#st-modal .modal-body").innerText();
    const close = await page.locator("#st-modal .modal-footer .btn").innerText();
    await page.locator("#st-modal .modal-footer .btn").click();
    await modalHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const phone = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && $(".st-view-toggle").is(":hidden"));
    await page.setViewportSize({ width: 1500, height: 950 });
    const ok = /3 obiettivi\. Dimostrati: 1; falsi: 2\./.test(status) && /vero/.test(verdicts) && /falso/.test(verdicts) && /Obiettivo di sicurezza/.test(head)
      && /Modifica l'output \(out\)/.test(action) && /Canale/.test(labels) && /Informazioni su PieStudio/.test(title) && /editor visuale di modelli ProVerif/.test(about)
      && close === "Chiudi" && phone;
    if (!ok) {
      throw new Error(JSON.stringify({ status: status, verdicts: verdicts, head: head, action: action, labels: labels, title: title, close: close, phone: phone }));
    }
    return status.replace(/\s+/g, " ");
  });

  await step("a translation that a student loads from a PO file shows at once, without the messages it gets wrong", async () => {
    const po = path.join(os.tmpdir(), "piestudio-zh-" + process.pid + ".po");
    fs.writeFileSync(po, ["msgid \"\"", "msgstr \"\"", "\"Language: zh_CN\\n\"", "\"Plural-Forms: nplurals=1; plural=0;\\n\"", "\"X-Language-Name: \u4e2d\u6587\\n\"", "",
      "msgid \"File\"", "msgstr \"\u6587\u4ef6\"", "", "msgid \"Save the model (.pv)\"", "msgstr \"\u4fdd\u5b58\u6a21\u578b (.pv)\"", "",
      "msgid \"{count} error\"", "msgid_plural \"{count} errors\"", "msgstr[0] \"{count} \u4e2a\u9519\u8bef\"", "", "msgid \"Opened {file}\"", "msgstr \"\u5df2\u6253\u5f00\"", ""].join("\n"));
    await page.evaluate(() => PieStudio.getInstance().openSettings("language"));
    await modalShown();
    await page.setInputFiles("#st-modal input[type=file]", po);
    await page.waitForSelector("#st-modal .st-language-message .alert");
    const note = await page.locator("#st-modal .st-language-message").innerText();
    const chosen = await page.locator("#st-modal select[data-key=language]").inputValue();
    await saveAndReload();
    fs.unlinkSync(po);
    const menu = await page.locator(".st-menu-button").first().innerText();
    const save = await page.locator("[data-command=save]").innerText();
    const shown = await page.evaluate(() => [I18n.t("Opened {file}", { file: "a.pv" }), I18n.n("{count} error", "{count} errors", 2), document.documentElement.lang]);
    const ok = /tradotti: 3 su \d+/.test(note) && /omette \{file\}/.test(note) && chosen === "zh_CN" && menu === "\u6587\u4ef6" && /\u4fdd\u5b58\u6a21\u578b/.test(save)
      && shown[0] === "Opened a.pv" && shown[1] === "2 \u4e2a\u9519\u8bef" && shown[2] === "zh-CN";
    if (!ok) {
      throw new Error(JSON.stringify({ note: note, chosen: chosen, menu: menu, save: save, shown: shown }));
    }
    return note.replace(/\s+/g, " ");
  });

  await step("the languages.js that the pane gives, put in lang/, gives the student's language to whoever opens the page", async () => {
    await page.evaluate(() => PieStudio.getInstance().openSettings("language"));
    await modalShown();
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#st-modal .st-language-buttons button", { hasText: "languages.js" }).click()]);
    const script = fs.readFileSync(await download.path(), "utf8");
    await page.locator("#st-modal .modal-footer .btn-secondary").click();
    await modalHidden();
    // Someone else opens the page, whose lang/languages.js is now the one that the pane gave
    const visitor = await browser.newContext({ locale: "zh-CN" });
    const other = await visitor.newPage();
    other.on("pageerror", error => errors.push("visitor: " + error.message));
    await other.route(/\/lang\/languages\.js$/, route => route.fulfill({ contentType: "text/javascript", body: script }));
    await other.goto(url);
    await other.waitForFunction(() => typeof PieStudio !== "undefined" && PieStudio.instance !== null && PieStudio.instance.model !== null, null, { timeout: 30000 });
    const menu = await other.locator(".st-menu-button").first().innerText();
    const listed = await other.evaluate(() => I18n.list().map(language => language.code + ":" + language.origin).join(" "));
    await visitor.close();
    if (menu !== "\u6587\u4ef6" || listed !== "en:built-in it:built-in zh_CN:built-in" || /[^\x00-\x7e]/.test(script)) {
      throw new Error(JSON.stringify({ menu: menu, listed: listed }));
    }
    return listed;
  });

  await step("the files to translate that the pane gives are those of lang/; back to English", async () => {
    await page.evaluate(() => PieStudio.getInstance().openSettings("language"));
    await modalShown();
    const [template] = await Promise.all([page.waitForEvent("download"), page.locator("#st-modal .st-language-buttons button", { hasText: ".pot" }).click()]);
    const same = fs.readFileSync(await template.path(), "utf8") === fs.readFileSync(path.join(folder, "lang", "template.pot"), "utf8");
    await page.locator("#st-modal select[data-key=language]").selectOption("it");
    const [italian] = await Promise.all([page.waitForEvent("download"), page.locator("#st-modal .st-language-buttons button", { hasText: "Italiano" }).click()]);
    const sameItalian = current(fs.readFileSync(await italian.path(), "utf8")) === current(fs.readFileSync(path.join(folder, "lang", "it.po"), "utf8"));
    await page.locator("#st-modal .st-language-item .btn-link").click();
    await page.locator("#st-modal select[data-key=language]").selectOption("en");
    await saveAndReload();
    const menus = (await page.locator(".st-menu-button").allInnerTexts()).join(", ");
    const stored = await page.evaluate(() => [localStorage.getItem("piestudio.language"), localStorage.getItem("piestudio.translations")]);
    return same && sameItalian && menus === "File, Edit, View, Help" && stored[0] === "\"en\"" && stored[1] === "{}";
  });

  await step("a page opened from disk verifies the model in the page", async () => {
    const local = await browser.newPage({ viewport: { width: 1300, height: 900 }, locale: "en-US" });
    local.on("pageerror", error => errors.push("file: " + error.message));
    await local.goto("file://" + path.join(folder, "index.html"));
    await local.waitForTimeout(1500);
    await local.keyboard.press("F5");
    await local.waitForFunction(() => /goals?:/.test((document.querySelector(".st-run-status") || {}).textContent || ""), null, { timeout: 120000 });
    const status = await local.locator(".st-run-status").innerText();
    const mode = await local.evaluate(() => PieStudio.getInstance().verifier.runner.getMode());
    await local.close();
    return /3 goals: 1 proved, 2 false/.test(status) && mode === "page" ? status.replace(/\s+/g, " ") : false;
  });

  check(errors.length === 0, "no errors in the page" + (errors.length ? ": " + errors.join(" | ") : ""));
  await browser.close();
  if (server) {
    server.close();
  }
  process.exit(failures() ? 1 : 0);
})();
