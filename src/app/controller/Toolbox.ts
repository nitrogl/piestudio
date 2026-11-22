/**
 * The tools of the studio beyond the edit of one construct: refactoring in
 * a selection, libraries, the LaTeX of the protocol, the report of a
 * verification, verifying as the model changes, and themes.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Toolbox {
  /**
   * The key of the libraries in the local storage.
   *
   * @type {string}
   */
  static LIBRARIES_KEY = "piestudio.libraries";

  studio: PieStudio;
  session: RefactorSession;
  candidates: any[];
  libraries: any;
  tried: Set<string>;
  editor: FileEditor;
  watching: boolean;
  theme: ThemeSettings;
  bar: RefactorBar;
  watchTimer: number;

  /**
   * @param {Object} params The parameters.
   * @param {PieStudio} params.studio The application.
   */
  constructor(params?: { studio?: PieStudio }) {
    this.studio = params.studio;
    this.session = null;
    this.candidates = [];
    this.libraries = PieStudio.loadPreference(Toolbox.LIBRARIES_KEY, []).filter(library => library && typeof library.text === "string");
    this.tried = new Set();
    this.editor = null;
    this.watching = PieStudio.loadPreference("watch", false) === true;
    this.theme = ThemeSettings.load();
    this.bar = new RefactorBar({
        container: "#code"
      , handlers: {
            choose: id => this.choose(id)
          , all: included => this.includeAll(included)
          , apply: name => this.applyRefactoring(name)
          , cancel: () => this.closeRefactoring()
        }
    });
  }

  /**
   * Shows in the menus whether the model is verified as it changes.
   */
  updateMenus() {
    $("[data-command=\"toggleWatch\"] .st-check-mark").toggleClass("fa-square-check", this.watching).toggleClass("fa-square", !this.watching);
  }

  /**
   * Starts a refactoring in the selection of the code (or in the whole
   * model): the name under the caret, or the most used one.
   */
  startRefactoring() {
    const studio = this.studio;
    if (!studio.analysis.ok) {
      Toast.show(I18n.t("Fix the syntax errors of the code first."), "warning");
      return;
    }
    if (studio.view === "diagram") {
      studio.setView("both");
    }
    const selection = studio.code.getSelection();
    let range = null;
    if (selection.end > selection.start) {
      // The refactoring takes whole lines
      const text = studio.getText();
      range = { start: text.lastIndexOf("\n", selection.start - 1) + 1, end: text.indexOf("\n", selection.end - 1) < 0 ? text.length : text.indexOf("\n", selection.end - 1) };
    }
    const candidates = RefactorSession.candidates(studio.analysis, range);
    if (candidates.length === 0) {
      Toast.show(I18n.t("There is no name to rename in the selection."), "info");
      return;
    }
    const hit = studio.analysis.symbolAt(selection.start);
    const chosen = hit && hit.symbol && candidates.some(candidate => candidate.symbol.id === hit.symbol.id) ? hit.symbol : candidates[0].symbol;
    this.candidates = candidates;
    this.openRefactoring(chosen, range);
  }

  /**
   * Opens a refactoring session on a name.
   *
   * @param {Object} symbol The symbol.
   * @param {Object|null} range The part of the model.
   */
  openRefactoring(symbol: any, range: any) {
    this.session = new RefactorSession(this.studio.analysis, symbol, range);
    this.studio.code.setReadOnly(true);
    this.bar.open(this.session, this.candidates);
    this.showOccurrences();
    if (this.session.occurrences.length) {
      this.studio.code.scrollToOffset(this.session.occurrences[0].start);
    }
  }

  /**
   * Marks the occurrences of the session in the code.
   */
  showOccurrences() {
    this.studio.code.setMarks(this.session.occurrences.map(occurrence => ({
        start: occurrence.start
      , end: occurrence.end
      , cls: occurrence.included ? "st-refactor-on" : "st-refactor-off"
    })));
  }

  /**
   * Includes or leaves out the occurrence clicked in the code.
   *
   * @param {number} offset The offset clicked.
   */
  codeClicked(offset: number) {
    if (this.session && this.session.toggle(offset)) {
      this.showOccurrences();
      this.bar.update();
    }
  }

  /**
   * Renames another name of the selection.
   *
   * @param {string} id The symbol.
   */
  choose(id: string) {
    const candidate = this.candidates.find(item => String(item.symbol.id) === String(id));
    if (candidate) {
      this.openRefactoring(candidate.symbol, this.session.range);
    }
  }

  /**
   * Includes every occurrence, or none.
   *
   * @param {boolean} included True to include them all.
   */
  includeAll(included: boolean) {
    this.session.setAll(included);
    this.showOccurrences();
    this.bar.update();
  }

  /**
   * Applies the new name, as one step of the history, after asking when it
   * has problems.
   *
   * @param {string} name The new name.
   */
  applyRefactoring(name: string) {
    const session = this.session;
    const result = session.check(name);
    const apply = () => {
      const label = I18n.n("Rename {name} to {to} ({count} place)", "Rename {name} to {to} ({count} places)", session.included().length, { name: session.symbol.name, to: name });
      const text = session.apply(name);
      this.closeRefactoring();
      this.studio.commit(text, label);
      Toast.show(label + ".", "success", 2500);
    };
    if (result.ok) {
      apply();
    } else if (ModelEditor.validIdentifier(name) || session.included().length === 0 || name === session.symbol.name) {
      Toast.show(result.problems[0], "warning");
    } else {
      this.studio.dialogs.confirm(I18n.t("Apply the refactoring?"), result.problems.join(" "), I18n.t("Apply anyway")).then(yes => {
        if (yes) {
          apply();
        }
      });
    }
  }

  /**
   * Ends the refactoring without changing anything.
   */
  closeRefactoring() {
    if (!this.session) {
      return;
    }
    this.session = null;
    this.bar.close();
    this.studio.code.setMarks([]);
    this.studio.code.setReadOnly(false);
  }

  /**
   * Adds libraries (.pvl files), replacing those with the same name.
   *
   * @param {Array<File>} files The files.
   */
  addLibraries(files: File[]) {
    Promise.all(files.map(file => file.text().then(text => ({ name: file.name, text: text })))).then(list => this.addLibraryTexts(list));
  }

  /**
   * Adds libraries given as texts, replacing those with the same name.
   *
   * @param {Array<Object>} list The libraries, {name, text}.
   */
  addLibraryTexts(list: any[]) {
    list.forEach(library => {
      library.text = library.text.replace(/\r\n?/g, "\n");
      this.libraries = this.libraries.filter(item => item.name !== library.name).concat([library]);
    });
    this.librariesChanged();
    Toast.show(I18n.n("Library {names} loaded: its declarations are checked with the model and given to ProVerif.",
      "Libraries {names} loaded: their declarations are checked with the model and given to ProVerif.", list.length, { names: list.map(library => library.name).join(", ") }), "success");
  }

  /**
   * Loads the libraries that the model names (@library) and that are
   * missing, when the page can reach them: by their web address, or by their
   * path from the page, served by a web server. The page cannot read a file
   * of the computer that the user did not choose: the others wait for the
   * user to open them, as the problems of the model say.
   */
  fetchLibraries() {
    if (typeof location === "undefined" || location.protocol === "file:") {
      return;
    }
    
    this.studio.analysis.missingLibraries.filter(item => !this.tried.has(item.name)).forEach(item => {
      this.tried.add(item.name);
      fetch(item.name)
        .then(response => (response.ok ? response.text() : null))
        .then(text => {
          // A server may answer a missing file with a page
          if (text !== null && !/^\s*</.test(text)) {
            this.addLibraryTexts([{ name: item.name.split("/").pop(), text: text }]);
          }
        })
        .catch(() => {});
    });
  }

  /**
   * Edits a library, in the code editor of a pop-up, with its problems.
   *
   * @param {number} index The library.
   */
  editLibrary(index: number) {
    const library = this.libraries[index];
    if (!library) {
      return;
    }
    
    const check = text => {
      const libraries = this.libraries.map(item => (item === library ? { name: item.name, text: text } : item));
      const analysis = Analysis.of(this.studio.getText(), { fileName: this.studio.fileName, libraries: libraries });
      const problems = analysis.libraryProblems.filter(problem => problem.library === library.name)
        .map(problem => ({ severity: problem.severity, message: problem.message, start: problem.start, end: Math.max(problem.end, problem.start + 1) }));
      return { analysis: null, problems: problems };
    };
    
    this.editor = this.editor || new FileEditor({ dialogs: this.studio.dialogs });
    this.editor.open({ name: library.name, text: library.text, check: check }).then(text => {
      if (text !== null) {
        library.text = text;
        this.librariesChanged();
        Toast.show(I18n.t("{name} changed: the model is checked with it again.", { name: library.name }), "success");
      }
    });
  }

  /**
   * Removes a library.
   *
   * @param {number} index The library.
   */
  removeLibrary(index: number) {
    this.libraries.splice(index, 1);
    this.librariesChanged();
  }

  /**
   * Keeps the libraries and checks the model again.
   */
  librariesChanged() {
    PieStudio.savePreference(Toolbox.LIBRARIES_KEY, this.libraries);
    Analysis.libraries = this.libraries;
    // What ProVerif said before is about other libraries
    this.studio.checker.forget();
    this.studio.proverifCheck = { text: null, status: "idle", problems: [] };
    this.studio.refresh();
  }

  /**
   * @return {Array<Object>} The libraries for the engine, {name, text}:
   *   those that the model uses.
   */
  engineFiles() {
    return this.studio.analysis.libraries.map(library => ({ name: Toolbox.safeName(library.name), text: library.text }));
  }

  /**
   * @return {Array<string>} The arguments that give the libraries to
   *   ProVerif.
   */
  engineArgs(): string[] {
    const args = [];
    this.engineFiles().forEach(file => args.push("-lib", ProVerifEngine.WORK_DIR + "/" + file.name));
    return args;
  }

  /**
   * Makes a file name safe for the engine.
   *
   * @param {string} name The name.
   * @return {string} The safe name, ending with .pvl.
   */
  static safeName(name: string): string {
    const safe = String(name).replace(/[^A-Za-z0-9._-]/g, "_");
    return /\.pvl$/.test(safe) ? safe : safe + ".pvl";
  }

  /**
   * Shows the LaTeX (TikZ) of the honest run of the protocol.
   */
  exportTikz() {
    const studio = this.studio;
    const code = TikzWriter.write(studio.model, studio.writer, studio.fileName);
    const $code = $("<textarea class=\"form-control st-mono\" rows=\"14\" spellcheck=\"false\" readonly></textarea>").val(code);
    studio.dialogs.open({
        title: I18n.t("LaTeX of the protocol (TikZ)")
      , icon: "fa-file-lines"
      , size: "lg"
      , body: $("<div></div>").append($code, $("<div class=\"form-text\"></div>").text(I18n.t("The honest run, as paired in the diagram, in the notation of the Design mode.")))
      , buttons: [
            { label: I18n.t("Close"), style: "secondary", value: null }
          , { label: I18n.t("Copy"), style: "outline-primary", action: () => {
                navigator.clipboard.writeText(code).then(() => Toast.show(I18n.t("LaTeX copied."), "success", 1500));
                return undefined;
              }
            }
          , { label: I18n.t("Download .tex"), style: "primary", action: () => {
                PieStudio.download(ExportPlanner.baseName(studio.fileName) + "-protocol.tex", code);
                return true;
              }
            }
        ]
    });
  }

  /**
   * Downloads the report of the last verification.
   */
  report() {
    const studio = this.studio;
    const run = studio.verifier.run;
    if (run.status === "idle" || run.status === "running") {
      Toast.show(I18n.t("Verify the model first: the report gives the results of the last verification."), "info");
      return;
    }
    const html = ReportWriter.write({ fileName: studio.fileName, text: run.modelText || studio.getText(), run: run, libraries: this.libraries });
    PieStudio.download(ExportPlanner.baseName(studio.fileName) + "-report.html", html, "text/html");
  }

  /**
   * Turns on or off the verification after each change.
   */
  toggleWatch() {
    this.watching = !this.watching;
    PieStudio.savePreference("watch", this.watching);
    this.updateMenus();
    Toast.show(this.watching ? I18n.t("The model is verified again after each change.") : I18n.t("Verify with F5."), "info", 2000);
  }

  /**
   * Follows a change of the model: verifies it a moment later, when it is
   * watched and parses.
   */
  changed() {
    clearTimeout(this.watchTimer);
    if (!this.watching || !this.studio.analysis.ok) {
      return;
    }
    this.watchTimer = setTimeout(() => {
      if (!this.studio.verifier.isRunning() && this.studio.analysis.ok) {
        this.studio.verifier.start();
      }
    }, 1500);
  }

  /**
   * Applies the theme of the user, over the light or dark choice.
   *
   * @param {string} base "light" or "dark".
   */
  applyTheme(base: string) {
    this.theme.apply(base);
  }
}
// ----------------------------------------------------------------
