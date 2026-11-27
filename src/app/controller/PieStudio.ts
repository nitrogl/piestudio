/**
 * The PieStudio application.
 *
 * The model is the text of a ProVerif file: every change, made in the
 * diagram, in a pop-up or in the code, produces a new text, recorded in an
 * unlimited history. After each change the text is parsed and checked, and
 * every view is redrawn from that analysis: the diagram, the declarations,
 * the code and the problems. ProVerif itself checks the model in the
 * background (LiveChecker) and verifies it on demand (Verifier).
 *
 * This is a singleton.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PieStudio {
  /**
   * The application version.
   *
   * @type {string}
   */
  static VERSION = "2.1.32";

  /**
   * The key of the autosaved model in the browser storage.
   *
   * @type {string}
   */
  static STORAGE_KEY = "piestudio.model";

  /**
   * The prefix of the preferences in the browser storage.
   *
   * @type {string}
   */
  static PREFERENCES = "piestudio.";

  /**
   * The model of a new file: a comment, in English, which blank translates,
   * and the code.
   *
   * @type {Object}
   */
  static BLANK = {
      comment: I18n.mark("A new model. Add declarations with the + of the panel on the left, parties with the + of Parties, and actions by dragging them from the palette onto a party.")
    , code: "free c: channel.\n\nprocess\n  0\n"
  };

  /**
   * The single instance.
   *
   * @type {PieStudio|null}
   */
  static instance: PieStudio | null = null;

  /**
   * @return {PieStudio} The application.
   */
  static getInstance(): PieStudio {
    if (PieStudio.instance === null) {
      PieStudio.instance = new PieStudio();
    }
    return PieStudio.instance;
  }

  history: EditHistory;
  settings: EngineSettings;
  conventions: Conventions;
  analysis: any;
  lastGood: any;
  table: NotationTable;
  writer: LatexWriter;
  model: any;
  fileName: string;
  pp: string;
  mode: string;
  view: string;
  flipped: Set<any>;
  selection: any;
  proverifCheck: { text: any; status: string; problems: any[]; };
  codeStyle: any;
  dialogs: Dialogs;
  menu: ContextMenu;
  actionDialog: ActionDialog;
  declarationDialog: DeclarationDialog;
  settingsDialog: SettingsDialog;
  diagram: DiagramView;
  code: CodeView;
  declarations: DeclarationsPanel;
  bottom: BottomPanel;
  verifier: Verifier;
  tools: Toolbox;
  checker: LiveChecker;
  typingTimer: number;
  saveTimer: number;

  /**
   * Creates the studio: getInstance gives the only one.
   */
  constructor() {
    this.history = new EditHistory("");
    this.settings = new EngineSettings();
    this.conventions = Conventions.load();
    this.analysis = Analysis.of("");
    this.lastGood = this.analysis;
    this.table = null;
    this.writer = null;
    this.model = null;
    this.fileName = "untitled.pv";
    this.pp = "";
    this.mode = "design";
    this.view = "both";
    this.flipped = new Set();
    this.selection = null;
    this.proverifCheck = { text: null, status: "idle", problems: [] };
    this.codeStyle = PieStudio.loadPreference("codeStyle", "model");
  }

  /**
   * Creates the views and loads the model of before a new load of the page,
   * the last model, or the first example.
   */
  start() {
    // The page is translated before the views copy any of its texts
    I18n.start(PieStudio.loadPreference("language", "auto"), PieStudio.loadPreference("translations", {}));
    this.dialogs = new Dialogs({ modal: "#st-modal" });
    this.menu = new ContextMenu();
    this.actionDialog = new ActionDialog({ dialogs: this.dialogs });
    this.declarationDialog = new DeclarationDialog({ dialogs: this.dialogs, menu: this.menu });
    this.settingsDialog = new SettingsDialog({ dialogs: this.dialogs });
    this.diagram = new DiagramView({
        container: "#diagram"
      , palette: "#palette"
      , actions: PvLanguage.PALETTE
      , icons: PvLanguage.ICONS
      , movable: PvLanguage.MOVABLE
      , handlers: {
            select: id => this.selectBlock(id)
          , edit: id => this.editBlock(id)
          , menu: (id, x, y) => this.blockMenu(id, x, y)
          , insert: (kind, path, anchor) => this.insertAction(kind, path, anchor)
          , move: (from, to) => this.moveAction(from, to)
          , editLane: id => this.editLane(id)
          , eye: id => this.toggleEye(id)
          , symmetric: id => this.toggleSymmetric(id)
        }
    });
    this.code = new CodeView({
        container: "#code"
      , handlers: {
            change: (text, selection) => this.typed(text, selection)
          , cursor: selection => this.cursorMoved(selection)
          , undo: () => this.undo()
          , redo: () => this.redo()
          , rename: offset => this.renameAt(offset)
          , goTo: offset => this.goToDefinition(offset)
          , click: offset => this.tools.codeClicked(offset)
        }
    });
    this.declarations = new DeclarationsPanel({
        body: "#declarations"
      , filter: "#declarations-filter"
      , count: "#declarations-count"
      , handlers: {
            select: index => this.selectDeclaration(index)
          , edit: index => this.editDeclaration(index)
          , add: (kind, anchor) => this.addDeclaration(kind, anchor)
          , menu: (index, x, y) => this.declarationMenu(index, x, y)
          , move: (index, to) => this.moveDeclaration(index, to)
          , removeLibrary: index => this.tools.removeLibrary(index)
          , editLibrary: index => this.tools.editLibrary(index)
          , openLibrary: () => $("#library-input").val("").trigger("click")
        }
    });
    this.bottom = new BottomPanel({
        root: "#bottom"
      , handlers: {
            problem: problem => this.showProblem(problem)
          , result: index => this.verifier.selectResult(index)
          , step: index => this.verifier.pickStep(index)
          , jump: index => this.jumpHistory(index)
          , toggle: () => $("#bottom").toggleClass("st-closed")
        }
    });
    this.verifier = new Verifier({ studio: this });
    this.tools = new Toolbox({ studio: this });
    Analysis.libraries = this.tools.libraries;
    this.checker = new LiveChecker({
        settings: this.settings
      , onResult: result => this.proverifChecked(result)
      , libraries: () => ({ args: this.tools.engineArgs(), files: this.tools.engineFiles() })
    });

    this.bindCommands();
    this.bindKeyboard();
    this.bindResizing();
    this.bindFiles();
    this.applyTheme(PieStudio.loadPreference("theme", "dark"));
    this.setMode(PieStudio.loadPreference("mode", "design"), false);
    this.setView(PieStudio.loadPreference("view", "both"));
    this.fillExamples();

    const resumed = StudioCore.resumed();
    const linked = StudioCore.linkedModel(["pv"]);
    const saved = PieStudio.loadPreference(PieStudio.STORAGE_KEY, null);
    if (resumed && typeof resumed.fileName === "string" && this.history.restore(resumed.history)) {
      this.resume(resumed.fileName, typeof resumed.pp === "string" ? resumed.pp : "");
    } else if (saved && typeof saved.text === "string") {
      this.load(saved.text, saved.fileName || "untitled.pv", saved.pp || "", false);
    } else if (!linked) {
      this.openExample(Examples.LIST[0].id);
    }
    if (linked) {
      this.openLinkedModel(linked);
    }
    // I let the browser optimise the engine while the user reads the model
    setTimeout(() => this.verifier.warmUp(), 1500);
    this.tools.updateMenus();
  }

  /**
   * Loads a model as a new document, with a fresh history.
   *
   * @param {string} text The model.
   * @param {string} fileName Its file name.
   * @param {string} pp Its pretty printing hints (the text of a .pp file).
   * @param {boolean} announce True to show a message.
   */
  load(text: string, fileName: string, pp: string = "", announce: boolean = true) {
    this.history.reset(text);
    this.fileName = fileName;
    this.pp = pp;
    this.selection = null;
    this.flipped = new Set();
    this.verifier.reset();
    this.refresh({ selection: { start: 0, end: 0 } });
    if (announce) {
      const errors = this.analysis.errors.length;
      Toast.show(errors ? I18n.n("Opened {file}: {count} problem to fix.", "Opened {file}: {count} problems to fix.", errors, { file: fileName })
        : I18n.t("Opened {file}", { file: fileName }), errors ? "warning" : "success", 2500);
    }
  }

  /**
   * Shows again the model of before a new load of the page, whose history
   * is restored.
   *
   * @param {string} fileName Its file name.
   * @param {string} pp Its pretty printing hints.
   */
  resume(fileName: string, pp: string) {
    this.fileName = fileName;
    this.pp = pp;
    this.verifier.reset();
    this.refresh({ selection: { start: 0, end: 0 } });
  }

  /**
   * Writes the model of a new file, with its comment in the language of the
   * interface.
   *
   * @return {string} The model.
   */
  static blank(): string {
    return PieStudio.comment(I18n.t(PieStudio.BLANK.comment)) + "\n\n" + PieStudio.BLANK.code;
  }

  /**
   * Writes a text as a comment of ProVerif, in lines of at most 78
   * characters.
   *
   * @param {string} text The text.
   * @return {string} The comment, (* ... *).
   */
  static comment(text: string): string {
    const lines = [];
    let line = "";
    // A translation cannot end the comment, nor open another one
    String(text).replace(/\(\*/g, "( *").replace(/\*\)/g, "* )").split(/\s+/).filter(word => word !== "").forEach(word => {
      if (line !== "" && line.length + 1 + word.length > 75) {
        lines.push(line);
        line = word;
      } else {
        line = line === "" ? word : line + " " + word;
      }
    });
    lines.push(line);
    return "(* " + lines.join("\n   ") + " *)";
  }

  /**
   * @return {string} The current text of the model.
   */
  getText(): string {
    return this.history.text;
  }

  /**
   * Records a new text and redraws.
   *
   * @param {string} text The new text.
   * @param {string} label What changed, for the history.
   * @param {Object} options The coalescing key of the history and the
   *   selection to show in the code.
   */
  commit(text: string, label: string, options: any = {}) {
    if (this.history.commit(text, { label: label, coalesce: options.coalesce || null })) {
      this.refresh(options);
    }
  }

  /**
   * Analyses the text and redraws every view.
   *
   * @param {Object} options fromCode, when the code view made the change;
   *   selection, the selection to show in the code.
   */
  refresh(options: any = {}) {
    const text = this.getText();
    this.analysis = Analysis.of(text, { fileName: this.fileName });
    
    if (this.analysis.ok) {
      this.lastGood = this.analysis;
    }
    
    const base = this.analysis.ok ? this.analysis : this.lastGood;
    try {
      this.table = NotationTable.build(base, { pp: this.pp, conventions: this.conventions });
    } catch (e) {
      this.table = NotationTable.build(null, { conventions: this.conventions });
    }
    
    this.writer = new LatexWriter(this.table);
    this.model = DiagramModel.build(base, this.table);
    this.applyColours();
    this.redraw();
    
    if (!options.fromCode) {
      this.code.setText(text, options.selection || null);
    }
    
    this.code.setAnalysis(base, this.problems());
    this.bottom.setProblems(this.problems());
    this.bottom.setHistory(this.timeline());
    this.updateChrome();
    this.checker.schedule(text);
    this.tools.fetchLibraries();
    this.autosave();
    if (this.tools.session && this.tools.session.analysis.text !== text) {
      this.tools.closeRefactoring();
    }
    this.tools.changed();
  }

  /**
   * Redraws the diagram and the declarations, keeping the selection.
   */
  redraw() {
    const base = this.analysis.ok ? this.analysis : this.lastGood;
    
    this.diagram.render(this.model, { mode: this.mode, writer: this.writer, flipped: this.flipped });
    
    this.declarations.render(base, { mode: this.mode, writer: this.writer, libraries: this.tools ? this.tools.libraries : [] });
    $("#diagram-stale").toggle(!this.analysis.ok);
    
    if (this.selection && this.selection.kind === "block" && !this.model.blocks.has(this.selection.id)) {
      this.selection = null;
    }
    
    this.diagram.setSelected(this.selection && this.selection.kind === "block" ? this.selection.id : null);
    this.declarations.setSelected(this.selection && this.selection.kind === "decl" ? this.selection.index : null);
  }

  /**
   * Sets the colours of the conventions on the page.
   */
  applyColours() {
    const style = document.documentElement.style;
    style.setProperty("--st-type-color", this.conventions.get("typeColor"));
    style.setProperty("--st-event-color", this.conventions.get("eventColor"));
    style.setProperty("--st-table-color", this.conventions.get("tableColor"));
    style.setProperty("--st-private-color", this.conventions.get("privateColor"));
    style.setProperty("--st-attacker-active", this.conventions.get("attackerActiveColor"));
    style.setProperty("--st-attacker-passive", this.conventions.get("attackerPassiveColor"));
  }

  /**
   * Gathers the problems of the model: those of the studio and those that
   * ProVerif reported for the same text.
   *
   * @return {Array<Object>} The problems, sorted, with their lines.
   */
  problems() {
    const text = this.getText();
    const list = [];
    let split = false;
    if (this.analysis.text === text) {
      this.analysis.diagnostics.forEach(d => {
        /*
         * Goals that ProVerif verifies in separate runs are not an error
         * here: the verification and the export split the model
         */
        if (d.code === "incompatible-queries") {
          split = true;
          list.push({
              severity: "info"
            , message: I18n.t("{message}: PieStudio verifies and exports these goals as separate files.", { message: d.message })
            , start: d.start
            , end: d.end
            , source: "studio"
          });
        } else if (d.severity !== "info") {
          list.push({
              severity: d.severity
            , message: d.message + (d.detail ? ": " + d.detail : "")
            , start: d.start
            , end: d.end
            , source: d.source || "studio"
          });
        }
      });
    }
    
    if (this.proverifCheck.text === text) {
      this.proverifCheck.problems.forEach(problem => {
        const known = list.some(item => item.severity === problem.severity && Math.abs(item.start - problem.start) <= 1);
        const splitting = split && /incompatible with (choice|equivalence)/i.test(problem.message);
        if (!known && !splitting) {
          list.push(problem);
        }
      });
    }
    
    const lines = this.analysis.lineIndex;
    list.forEach(problem => {
      problem.line = lines ? lines.pos(problem.start).line : null;
    });
    // The libraries that the model names, but that the studio does not have
    (this.analysis.text === text ? this.analysis.missingLibraries : []).forEach(item => list.push({
        severity: "warning"
      , message: I18n.t("The model needs the library {name} (@library): open it with File, Open a library, or choose it with the model.", { name: item.name })
      , start: item.start
      , end: item.end
      , line: lines ? lines.pos(item.start).line : null
      , source: "library"
    }));
    (this.analysis.text === text ? this.analysis.libraryProblems : []).forEach(problem => list.push({
        severity: problem.severity
      , message: I18n.t("{library}, line {line}: {message}", { library: problem.library, line: problem.line, message: problem.message })
      , start: 0
      , end: 0
      , line: null
      , source: "library"
    }));
    
    return list.sort((a, b) => a.start - b.start);
  }

  /**
   * Receives the result of a check by ProVerif.
   *
   * @param {Object} result The text, the status and the problems.
   */
  proverifChecked(result: any) {
    this.proverifCheck = result;
    if (result.text !== this.getText()) {
      return;
    }
    
    const problems = this.problems();
    this.code.setAnalysis(this.analysis.ok ? this.analysis : this.lastGood, problems);
    this.bottom.setProblems(problems);
    this.updateChrome();
  }

  /**
   * Updates the title, the file name, the buttons and the badges.
   */
  updateChrome() {
    const dirty = this.history.dirty;
    document.title = (dirty ? "* " : "") + this.fileName + " - PieStudio";
    
    $("#file-name").text(this.fileName).toggleClass("st-dirty", dirty);
    $("[data-command=\"undo\"]").toggleClass("disabled", !this.history.canUndo).prop("disabled", !this.history.canUndo);
    $("[data-command=\"redo\"]").toggleClass("disabled", !this.history.canRedo).prop("disabled", !this.history.canRedo);
    const attacker = this.analysis.setting("attacker") || "active";
    $("#attacker-badge").toggleClass("st-passive", attacker === "passive")
      .attr("title", attacker === "passive" ? I18n.t("Passive attacker: listens only. Click to change.") : I18n.t("Active attacker: reads, writes and blocks public channels. Click to change."))
      .find("span").text(attacker === "passive" ? I18n.t("passive attacker") : I18n.t("active attacker"));
    
    const errors = this.problems().filter(problem => problem.severity === "error").length;
    const $status = $("#check-status").removeClass("st-ok st-error st-pending");
    
    if (errors) {
      $status.addClass("st-error").html("<i class=\"fas fa-circle-xmark\"></i> " + MathRenderer.escape(I18n.n("{count} error", "{count} errors", errors)));
    } else if (this.proverifCheck.text === this.getText() && this.proverifCheck.status === "ok") {
      $status.addClass("st-ok").html("<i class=\"fas fa-circle-check\"></i> ProVerif: " + MathRenderer.escape(I18n.t("OK")));
    } else {
      $status.addClass("st-pending").html("<i class=\"fas fa-circle-check\"></i> " + MathRenderer.escape(I18n.t("OK")));
    }
  }

  /**
   * @return {Array<Object>} The history for the History tab, with the
   *   initial state first.
   */
  timeline() {
    const entries = this.history.timeline();
    return [{ index: 0, label: I18n.t("Start: {file}", { file: this.fileName }), time: null, applied: true }].concat(entries);
  }

  /**
   * Binds the elements that carry a data-command attribute.
   */
  bindCommands() {
    const studio = this;
    
    $(document).on("click", "[data-command]", function(event) {
      const $element = $(this);
      if ($element.closest("#bottom").length && $element.attr("data-command") === "toggleBottom") {
        return;
      }
      
      event.preventDefault();
      studio.command($element.attr("data-command"), $element);
    });
  }

  /**
   * Runs a command of a menu, a button or the keyboard.
   *
   * @param {string} name The command.
   * @param {jQuery} $element The element that carries it, if any.
   */
  command(name: string, $element: JQuery = $()) {
    switch (name) {
      case "new":
        this.confirmDiscard().then(ok => ok && this.load(PieStudio.blank(), "untitled.pv", ""));
        break;

      case "open":
        $("#file-input").val("").trigger("click");
        break;
        
      case "save":
        PieStudio.download(this.fileName, this.getText());
        this.history.markSaved();
        this.updateChrome();
        break;
        
      case "export":
        this.exportModel();
        break;
        
      case "example":
        this.confirmDiscard().then(ok => ok && this.openExample($element.attr("data-example")));
        break;
        
      case "undo":
        this.undo();
        break;
        
      case "redo":
        this.redo();
        break;
        
      case "addParty":
        this.addDeclaration("ProcessDecl");
        break;
        
      case "delete":
        this.deleteSelection();
        break;
        
      case "rename":
        this.renameSelection();
        break;
        
      case "restyle":
        this.restyle($element.attr("data-style"));
        break;
        
      case "view":
        this.setView($element.attr("data-view"));
        break;
        
      case "mode":
        this.setMode($element.attr("data-mode") || (this.mode === "design" ? "expert" : "design"));
        break;
        
      case "zoomIn":
        this.diagram.setZoom(this.diagram.zoom + 0.1);
        break;
        
      case "zoomOut":
        this.diagram.setZoom(this.diagram.zoom - 0.1);
        break;
        
      case "zoomReset":
        this.diagram.setZoom(1);
        break;
        
      case "theme":
        this.applyTheme(document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
        break;
        
      case "toggleAttacker":
        this.toggleAttacker();
        break;
        
      case "verify":
        this.verifier.start();
        break;
        
      case "cancel":
        this.verifier.cancel();
        break;
        
      case "settings":
        this.openSettings($element.attr("data-tab") || "engine");
        break;
        
      case "tracePrevious":
        this.verifier.pickStep(Math.max(0, (this.verifier.step === null ? 0 : this.verifier.step - 1)));
        break;
        
      case "traceNext":
        this.verifier.pickStep(this.verifier.step === null ? 0 : this.verifier.step + 1);
        break;
        
      case "about":
        this.about();
        break;
        
      case "refactor":
        this.tools.startRefactoring();
        break;
        
      case "openLibrary":
        $("#library-input").val("").trigger("click");
        break;
        
      case "exportTikz":
        this.tools.exportTikz();
        break;
        
      case "report":
        this.tools.report();
        break;
        
      case "toggleWatch":
        this.tools.toggleWatch();
        break;
        
      case "shortcuts":
        this.shortcuts();
        break;
        
      default:
        break;
    }
  }

  /**
   * Binds the keyboard shortcuts.
   */
  bindKeyboard() {
    $(document).on("keydown", event => {
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const inField = $(event.target).is("input, textarea, select") || $(event.target).closest(".modal").length > 0;
      const inCode = $(event.target).is(".st-code-input");
      if (event.key === "Escape" && this.tools.session && !$(event.target).closest(".modal").length) {
        event.preventDefault();
        this.tools.closeRefactoring();
        return;
      }
      if (event.key === "F2" && event.shiftKey && inCode) {
        event.preventDefault();
        this.tools.startRefactoring();
        return;
      }
      if (event.key === "F5") {
        event.preventDefault();
        this.verifier.start();
      } else if (event.key === "F9") {
        event.preventDefault();
        this.setMode(this.mode === "design" ? "expert" : "design");
      } else if (modifier && key === "s") {
        event.preventDefault();
        this.command("save");
      } else if (modifier && key === "o") {
        event.preventDefault();
        this.command("open");
      } else if (modifier && key === "e") {
        event.preventDefault();
        this.command("export");
      } else if (inField || inCode) {
        return;
      } else if (modifier && key === "z" && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      } else if (modifier && ((key === "z" && event.shiftKey) || key === "y")) {
        event.preventDefault();
        this.redo();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        this.deleteSelection();
      } else if (event.key === "F2" && event.shiftKey) {
        event.preventDefault();
        this.tools.startRefactoring();
      } else if (event.key === "F2") {
        event.preventDefault();
        this.renameSelection();
      } else if (event.key === "Enter" && this.selection) {
        event.preventDefault();
        if (this.selection.kind === "block") {
          this.editBlock(this.selection.id);
        } else {
          this.editDeclaration(this.selection.index);
        }
      }
    });
  }

  /**
   * Makes the panels resizable with jQuery UI.
   */
  bindResizing() {
    const remember = (name, value) => PieStudio.savePreference("size." + name, value);
    const width = PieStudio.loadPreference("size.left", 270);
    $("#left-panel").css("width", width).resizable({
        handles: "e"
      , minWidth: 190
      , maxWidth: 520
      , resize: (event, ui) => StudioCore.resizing(ui)
      , stop: (event, ui) => remember("left", ui.size.width)
    });
    const share = part => Math.min(0.85, Math.max(0.15, part));
    const split = part => $("#diagram-pane").css({ flex: "0 0 " + (100*part).toFixed(2) + "%", width: "" });
    $("#diagram-pane").resizable({
        handles: "e"
      , minWidth: 260
      , start: () => $("#diagram-pane").css("flex", "none")
      , resize: (event, ui) => {
          StudioCore.resizing(ui);
          this.diagram.drawArrows();
        }
      , stop: (event, ui) => {
          const part = share(ui.size.width/$("#editors").width());
          split(part);
          remember("split", part);
          this.diagram.drawArrows();
        }
    });
    const editors = $("#editors").width();
    const pixels = PieStudio.loadPreference("size.diagram", null);
    const part = PieStudio.loadPreference("size.split", pixels && editors ? share(pixels/editors) : null);
    if (part) {
      split(part);
    }
    $("#bottom").css("height", PieStudio.loadPreference("size.bottom", 230)).resizable({
        handles: "n"
      , minHeight: 90
      , maxHeight: 700
      , resize: (event, ui) => {
          StudioCore.resizing(ui);
          // The panel grows upwards: it stays at the bottom of the page
          ui.element.css("top", "auto");
        }
      , stop: (event, ui) => {
          ui.element.css("top", "auto");
          remember("bottom", ui.size.height);
          this.diagram.drawArrows();
        }
    });
  }

  /**
   * Opens the files chosen in the file input or dropped on the page.
   */
  bindFiles() {
    $("#file-input").on("change", event => this.openFiles(Array.from((event.target as HTMLInputElement).files || [])));
    $("#library-input").on("change", event => this.tools.addLibraries(Array.from((event.target as HTMLInputElement).files || [])));
    $(document).on("dragover", event => {
      if (event.originalEvent.dataTransfer && Array.from(event.originalEvent.dataTransfer.types || []).includes("Files")) {
        event.preventDefault();
        $("body").addClass("st-file-over");
      }
    });
    $(document).on("dragleave drop", () => $("body").removeClass("st-file-over"));
    $(document).on("drop", event => {
      const files = event.originalEvent.dataTransfer ? Array.from(event.originalEvent.dataTransfer.files || []) : [];
      if (files.length) {
        event.preventDefault();
        this.openFiles(files);
      }
    });
  }

  /**
   * Opens a model (.pv) and its hints (.pp), if any.
   *
   * @param {Array<File>} files The files.
   */
  openFiles(files: File[]) {
    const libraries = files.filter(file => /\.pvl$/i.test(file.name));
    if (libraries.length) {
      this.tools.addLibraries(libraries);
      files = files.filter(file => !/\.pvl$/i.test(file.name));
      if (files.length === 0) {
        return;
      }
    }
    const model = files.find(file => /\.pv$/i.test(file.name));
    const hints = files.find(file => /\.pp$/i.test(file.name));
    const read = file => (file ? file.text() : Promise.resolve(null));
    if (!model && hints) {
      read(hints).then(pp => {
        this.pp = pp;
        this.refresh();
        Toast.show(I18n.t("Hints of {file} applied to the model.", { file: hints.name }), "success");
      });
      return;
    }
    if (!model) {
      Toast.show(I18n.t("Choose a ProVerif model (.pv), and possibly its hints (.pp)."), "warning");
      return;
    }
    this.confirmDiscard().then(ok => {
      if (ok) {
        Promise.all([read(model), read(hints)]).then(([text, pp]) => this.load(text.replace(/\r\n?/g, "\n"), model.name, pp || ""));
      }
    });
  }

  /**
   * Opens the model that the address of the page carries (an extract of the
   * manual of ProVerif, for instance), after asking when the current model
   * has unsaved changes.
   *
   * @param {Object} linked The model, as StudioCore.linkedModel gives it.
   */
  openLinkedModel(linked: { text: string; fileName: string | null }) {
    this.confirmDiscard().then(ok => {
      if (ok) {
        this.load(linked.text, linked.fileName || "extract.pv", "", false);
        Toast.show(I18n.t("Opened the model of the link."), "info");
      }
    });
  }

  /**
   * Asks before replacing a model with unsaved changes.
   *
   * @return {Promise<boolean>} True when the current model may be replaced.
   */
  confirmDiscard(): Promise<boolean> {
    if (!this.history.dirty || this.history.size === 0) {
      return Promise.resolve(true);
    }
    return this.dialogs.confirm(I18n.t("Unsaved changes"), I18n.t("The changes to {file} are not saved. Replace the model anyway?", { file: this.fileName }), I18n.t("Replace"));
  }

  /**
   * Fills the menu of the examples.
   */
  fillExamples() {
    const $menu = $("#examples-menu").empty();
    Examples.LIST.forEach(example => {
      const $link = $("<a class=\"dropdown-item\" href=\"#\" data-command=\"example\"></a>").attr({ "data-example": example.id, title: I18n.t(example.note) });
      $link.append("<i class=\"far fa-file-lines\"></i>", $("<span></span>").text(I18n.t(example.title)));
      $menu.append($("<li></li>").append($link));
    });
  }

  /**
   * Opens an example.
   *
   * @param {string} id The example.
   */
  openExample(id: string) {
    const example = Examples.get(id);
    if (example) {
      this.load(example.source, example.file, example.pp || "", false);
      Toast.show(I18n.t(example.title) + ": " + I18n.t(example.note), "info", 5000);
    }
  }

  /**
   * Undoes the last change.
   */
  undo() {
    const undone = this.history.undo();
    if (undone) {
      this.refresh({ selection: undone.selection });
      Toast.show(I18n.t("Undid: {label}", { label: undone.entry.label }), "info", 1500);
    }
  }

  /**
   * Redoes the last change undone.
   */
  redo() {
    const redone = this.history.redo();
    if (redone) {
      this.refresh({ selection: redone.selection });
      Toast.show(I18n.t("Redid: {label}", { label: redone.entry.label }), "info", 1500);
    }
  }

  /**
   * Goes to a step of the history.
   *
   * @param {number} index The step in the History tab (0 is the start).
   */
  jumpHistory(index: number) {
    const entry = this.timeline()[index];
    if (entry) {
      this.history.goTo(entry.index);
      this.refresh();
    }
  }

  /**
   * Records the text typed in the code.
   *
   * @param {string} text The new text.
   * @param {Object} selection The selection after the change.
   */
  typed(text: string, selection: any) {
    this.history.commit(text, { label: I18n.t("Edit the code"), coalesce: "code", selectionAfter: selection });
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.refresh({ fromCode: true }), 180);
  }

  /**
   * Follows the caret of the code: selects the block or the declaration
   * under it.
   *
   * @param {Object} selection The selection of the code.
   */
  cursorMoved(selection: any) {
    if (!this.model || this.analysis.text !== this.getText()) {
      return;
    }
    const block = DiagramModel.blockAtOffset(this.model, selection.start);
    this.diagram.setSelected(block ? block.id : null);
    const index = this.analysis.program.decls.findIndex(decl => decl.start <= selection.start && selection.start <= decl.end && decl.kind !== "ProcessDecl");
    this.declarations.setSelected(index >= 0 ? index : null);
    this.selection = block ? { kind: "block", id: block.id } : index >= 0 ? { kind: "decl", index: index } : null;
  }

  /**
   * Selects a block of the diagram, and shows its code.
   *
   * @param {string|null} id The block, or null.
   */
  selectBlock(id: string | null) {
    const block = id && this.model ? this.model.blocks.get(id) : null;
    this.selection = block ? { kind: "block", id: id } : null;
    this.diagram.setSelected(block ? id : null);
    this.declarations.setSelected(null);
    this.code.setHighlight(block && !block.implicit ? block.range : null);
  }

  /**
   * Selects a declaration, and shows its code.
   *
   * @param {number|null} index The declaration, or null.
   */
  selectDeclaration(index: number | null) {
    const decl = index === null ? null : this.analysis.program.decls[index];
    this.selection = decl ? { kind: "decl", index: index } : null;
    this.declarations.setSelected(decl ? index : null);
    this.diagram.setSelected(null);
    this.code.setHighlight(decl ? [decl.start, decl.end] : null);
  }

  /**
   * Shows a problem in the code.
   *
   * @param {Object} problem The problem.
   */
  showProblem(problem: any) {
    if (problem) {
      this.code.reveal(problem.start, Math.max(problem.start, problem.end), true);
    }
  }

  /**
   * Applies an edit of the processes, given as a function of the program.
   *
   * @param {string} label What changed, for the history.
   * @param {function(Object):Object} edit Gives the new program.
   * @return {boolean} True when the edit applied.
   */
  editProgram(label: string, edit: ((arg0: any) => any)): boolean {
    if (!this.analysis.ok) {
      Toast.show(I18n.t("Fix the syntax errors of the code first: the diagram shows the last version that parsed."), "warning");
      return false;
    }
    try {
      const program = edit(this.analysis.program);
      this.commit(ModelEditor.applyProgram(this.analysis, program), label);
      return true;
    } catch (e: any) {
      Toast.show(e.message, "error");
      return false;
    }
  }

  /**
   * Edits the action of a block in its pop-up.
   *
   * @param {string} id The block.
   */
  editBlock(id: string) {
    const block = this.model ? this.model.blocks.get(id) : null;
    if (!block || block.mirror || !ActionDialog.FIELDS[block.kind]) {
      return;
    }
    this.selectBlock(id);
    this.actionDialog.open({ kind: block.kind, node: block.node, analysis: this.analysis, writer: this.writer }).then(values => {
      if (values) {
        this.editProgram(I18n.t("Edit {kind}", { kind: block.kind.toLowerCase() }), program => ProcessEditor.updateAction(program, block.path, values));
      }
    });
  }

  /**
   * Adds an action before a node of a process.
   *
   * @param {string|null} kind The kind of action, or null to choose it.
   * @param {Array} path Where to insert it.
   * @param {Element} anchor The element under which to show the choice.
   */
  insertAction(kind: string | null, path: any[], anchor: Element = null) {
    if (!kind) {
      const items = PvLanguage.PALETTE.map(item => ({ label: item.label + " - " + I18n.t(item.title), icon: item.icon, action: () => this.insertAction(item.kind, path) }));
      if (anchor) {
        this.menu.showBelow(items, anchor);
      }
      return;
    }
    this.actionDialog.open({ kind: kind, node: null, analysis: this.analysis, writer: this.writer, style: this.actionStyle() }).then(values => {
      if (values) {
        this.editProgram(I18n.t("Add {what}", { what: kind.toLowerCase() }), program => ProcessEditor.insertBefore(program, path, ProcessEditor.makeAction(kind, values)));
      }
    });
  }

  /**
   * Gives the style in which a new action writes a new name or a let: the
   * one of the settings, or the one that the model uses most.
   *
   * @return {string} "cryptoverif" or "proverif".
   */
  actionStyle(): string {
    if (this.codeStyle === "cryptoverif" || this.codeStyle === "proverif") {
      return this.codeStyle;
    }
    return ModelEditor.styleOf(this.lastGood.program);
  }

  /**
   * Rewrites the new names and the lets of the model in a style, as one step
   * of the history.
   *
   * @param {string} style "cryptoverif" ("k <-R key;", "x <- M;") or
   *   "proverif" ("new k: key;", "let x = M in").
   */
  restyle(style: string) {
    if (!this.analysis.ok) {
      Toast.show(I18n.t("Fix the syntax errors of the code first."), "warning");
      return;
    }
    const name = style === "cryptoverif" ? "CryptoVerif" : "ProVerif";
    const result = ModelEditor.restyle(this.analysis, style);
    if (result.count === 0) {
      Toast.show(I18n.t("Nothing to rewrite: the new names and the lets that can be are written as in {style}.", { style: name }), "info");
      return;
    }
    this.commit(result.text, I18n.t("Write new and let as in {style}", { style: name }));
    Toast.show(I18n.n("{count} new name or let written as in {style}.", "{count} new names and lets written as in {style}.", result.count, { style: name }), "success");
  }

  /**
   * Moves an action before another node.
   *
   * @param {Array} from The path of the action.
   * @param {Array} to The path of the node it goes before.
   */
  moveAction(from: any[], to: any[]) {
    this.editProgram(I18n.t("Move an action"), program => ProcessEditor.moveAction(program, from, to));
  }

  /**
   * Shows the menu of a block.
   *
   * @param {string} id The block.
   * @param {number} x The horizontal position.
   * @param {number} y The vertical position.
   */
  blockMenu(id: string, x: number, y: number) {
    const block = this.model.blocks.get(id);
    if (!block || block.mirror) {
      return;
    }
    const node = block.node;
    const items = [];
    if (ActionDialog.FIELDS[block.kind]) {
      items.push({ label: I18n.t("Edit"), icon: "fa-pen", shortcut: I18n.t("Enter"), action: () => this.editBlock(id) });
    }
    if (Ast.BRANCHING.has(block.kind)) {
      items.push({
          label: node.else ? I18n.t("Remove the else branch") : I18n.t("Add an else branch")
        , icon: "fa-code-branch"
        , action: () => this.editProgram(node.else ? I18n.t("Remove an else branch") : I18n.t("Add an else branch"), program => ProcessEditor.setElse(program, block.path, !node.else))
      });
    }
    if (block.kind !== "Nil") {
      items.push({ label: block.kind === "Repl" ? I18n.t("Remove the replication") : I18n.t("Replicate (!)"), icon: "fa-repeat",
        action: () => this.editProgram(I18n.t("Replication"), program => ProcessEditor.toggleReplication(program, block.path)) });
      items.push({ label: I18n.t("Run in parallel with another process"), icon: "fa-grip-lines-vertical",
        action: () => this.editProgram(I18n.t("Parallel composition"), program => ProcessEditor.addParallel(program, block.path)) });
    }
    items.push({ label: this.diagram.modeOf(id, block.lane) === "design" ? I18n.t("Show as code") : I18n.t("Show as a formula"), icon: "fa-eye", action: () => this.toggleEye(id) });
    if (block.kind !== "Nil") {
      items.push({ divider: true });
      items.push({ label: I18n.t("Delete"), icon: "fa-trash-can", shortcut: I18n.t("Del"), action: () => this.deleteBlock(id) });
    }
    this.menu.show(items, x, y);
  }

  /**
   * Deletes the action of a block, keeping what follows it.
   *
   * @param {string} id The block.
   */
  deleteBlock(id: string) {
    const block = this.model.blocks.get(id);
    if (block && block.kind !== "Nil") {
      this.selection = null;
      this.editProgram(I18n.t("Delete {kind}", { kind: block.kind.toLowerCase() }), program => ProcessEditor.removeAction(program, block.path, "then"));
    }
  }

  /**
   * Deletes the selected block or declaration.
   */
  deleteSelection() {
    if (!this.selection) {
      return;
    }
    if (this.selection.kind === "block") {
      this.deleteBlock(this.selection.id);
    } else {
      this.deleteDeclaration(this.selection.index);
    }
  }

  /**
   * Edits the party of a lane.
   *
   * @param {string} laneId The lane.
   */
  editLane(laneId: string) {
    const lane = this.model.lanes.find(item => item.id === laneId);
    if (lane && lane.declIndex !== undefined) {
      this.editDeclaration(lane.declIndex);
    }
  }

  /**
   * Shows a party with its mirrored copy, or alone: the hint @symmetric in
   * the comment above its declaration says so, and goes to the history.
   *
   * @param {string} laneId The lane of the party.
   */
  toggleSymmetric(laneId: string) {
    const lane = this.model.lanes.find(item => item.id === laneId);
    if (!lane || lane.declIndex === undefined || !this.analysis.ok) {
      return;
    }
    const text = this.getText();
    const decl = this.analysis.program.decls[lane.declIndex];
    const hinted = (decl.leadingComments || []).find(comment => /@symmetric\b/.test(comment.text));
    if (hinted) {
      const rest = hinted.text.slice(2, -2).replace(/@symmetric\b[ \t]*/, "");
      if (rest.trim() === "") {
        // The comment held the hint only: it goes, with its line
        const end = text.charAt(hinted.end) === "\n" ? hinted.end + 1 : hinted.end;
        this.commit(text.slice(0, hinted.start) + text.slice(end), I18n.t("Show {party} once", { party: lane.title }));
      } else {
        this.commit(text.slice(0, hinted.start) + "(*" + rest + "*)" + text.slice(hinted.end), I18n.t("Show {party} once", { party: lane.title }));
      }
    } else if (!lane.symmetric) {
      const lineStart = text.lastIndexOf("\n", decl.start - 1) + 1;
      this.commit(text.slice(0, lineStart) + "(* @symmetric *)\n" + text.slice(lineStart), I18n.t("Show {party} as symmetric", { party: lane.title }));
    }
  }

  /**
   * Shows a block or a lane in the other mode.
   *
   * @param {string} id The block or the lane.
   */
  toggleEye(id: string) {
    if (this.flipped.has(id)) {
      this.flipped.delete(id);
    } else {
      this.flipped.add(id);
    }
    this.diagram.render(this.model, { mode: this.mode, writer: this.writer, flipped: this.flipped });
  }

  /**
   * Edits a declaration in its pop-up.
   *
   * @param {number} index The declaration.
   */
  editDeclaration(index: number) {
    const decl = this.analysis.program.decls[index];
    if (!decl) {
      return;
    }
    this.selectDeclaration(index);
    this.declarationDialog.open({ analysis: this.analysis, index: index, writer: this.writer }).then(answer => {
      if (!answer) {
        return;
      }
      if (answer.spec === "ProcessDecl" && answer.name) {
        const result = ModelEditor.editProcessHeader(this.analysis, index, { name: answer.name, params: answer.params });
        if (result.error) {
          Toast.show(result.error, "error");
        } else {
          this.commit(result.text, I18n.t("Edit the party {name}", { name: answer.name }));
        }
        return;
      }
      this.commit(ModelEditor.replaceDecl(this.analysis, index, answer.source).text, I18n.t("Edit a declaration"));
    });
  }

  /**
   * Adds a declaration, choosing its kind first when the group has several.
   *
   * @param {string} kind The kind of declaration.
   * @param {Element} anchor The button that asked, for the menu of kinds.
   */
  addDeclaration(kind: string, anchor: Element = null) {
    const group = DeclarationsPanel.GROUPS.find(item => item.kinds.includes(kind));
    const kinds = group ? group.kinds.filter(item => DeclSpecs.specByKey(item)) : [kind];
    if (anchor && kinds.length > 1) {
      this.menu.showBelow(kinds.map(item => ({ label: I18n.t(DeclSpecs.specByKey(item).title), icon: "fa-plus", action: () => this.addDeclaration(item) })), anchor);
      return;
    }
    this.declarationDialog.open({ analysis: this.analysis, index: null, kind: kind, writer: this.writer }).then(answer => {
      if (!answer) {
        return;
      }
      try {
        if (answer.spec === "ProcessDecl" && answer.name) {
          this.commit(ModelEditor.addRole(this.analysis, answer.name, answer.params || "", { replicate: true, call: true }).text, I18n.t("Add the party {name}", { name: answer.name }));
        } else {
          this.commit(ModelEditor.insertDecl(this.analysis, answer.source).text, I18n.t("Add a declaration"));
        }
      } catch (e: any) {
        Toast.show(e.message, "error");
      }
    });
  }

  /**
   * Shows the menu of a declaration.
   *
   * @param {number} index The declaration.
   * @param {number} x The horizontal position.
   * @param {number} y The vertical position.
   */
  declarationMenu(index: number, x: number, y: number) {
    const count = this.analysis.program.decls.length;
    this.menu.show([
        { label: I18n.t("Edit"), icon: "fa-pen", shortcut: I18n.t("Enter"), action: () => this.editDeclaration(index) }
      , { label: I18n.t("Rename everywhere"), icon: "fa-i-cursor", shortcut: "F2", action: () => this.renameDeclaration(index) }
      , { label: I18n.t("Move up"), icon: "fa-arrow-up", disabled: index === 0, action: () => this.moveDeclaration(index, index - 1) }
      , { label: I18n.t("Move down"), icon: "fa-arrow-down", disabled: index === count - 1, action: () => this.moveDeclaration(index, index + 1) }
      , { divider: true }
      , { label: I18n.t("Delete"), icon: "fa-trash-can", shortcut: I18n.t("Del"), action: () => this.deleteDeclaration(index) }
    ], x, y);
  }

  /**
   * Moves a declaration.
   *
   * @param {number} index The declaration.
   * @param {number} to Its new index.
   */
  moveDeclaration(index: number, to: number) {
    if (this.analysis.ok) {
      this.commit(ModelEditor.moveDecl(this.analysis, index, to).text, I18n.t("Move a declaration"));
      this.selectDeclaration(to);
    }
  }

  /**
   * Deletes a declaration.
   *
   * @param {number} index The declaration.
   */
  deleteDeclaration(index: number) {
    if (this.analysis.ok && this.analysis.program.decls[index]) {
      this.selection = null;
      this.commit(ModelEditor.deleteDecl(this.analysis, index).text, I18n.t("Delete a declaration"));
    }
  }

  /**
   * Renames the selected declaration, or the symbol under the caret.
   */
  renameSelection() {
    if (this.selection && this.selection.kind === "decl") {
      this.renameDeclaration(this.selection.index);
    } else {
      this.renameAt(this.code.getSelection().start);
    }
  }

  /**
   * Renames the symbol that a declaration declares.
   *
   * @param {number} index The declaration.
   */
  renameDeclaration(index: number) {
    const decl = this.analysis.program.decls[index];
    const nameNode = decl && (decl.name || (decl.names && decl.names[0]));
    if (nameNode && nameNode.start >= 0) {
      this.renameAt(nameNode.start);
    } else {
      Toast.show(I18n.t("This declaration has no name to rename."), "warning");
    }
  }

  /**
   * Renames the symbol at an offset of the code, everywhere it is used.
   *
   * @param {number} offset The offset.
   */
  renameAt(offset: number) {
    const analysis = this.analysis;
    if (analysis.text !== this.getText() || !analysis.ok) {
      Toast.show(I18n.t("Fix the syntax errors first."), "warning");
      return;
    }
    const hit = analysis.symbolAt(offset) || (offset > 0 ? analysis.symbolAt(offset - 1) : null);
    if (!hit || !hit.symbol || hit.symbol.builtin) {
      Toast.show(I18n.t("Put the caret on a name to rename it."), "info");
      return;
    }
    const symbol = hit.symbol;
    this.dialogs.prompt({
        title: I18n.t("Rename {name}", { name: symbol.name })
      , label: I18n.n("New name of the {kind} {name} ({count} occurrence)", "New name of the {kind} {name} ({count} occurrences)", analysis.occurrencesOf(symbol.id).length,
          { kind: PvLanguage.kindName(symbol.kind), name: symbol.name })
      , value: symbol.name
      , validate: value => ModelEditor.validIdentifier(value)
    }).then(name => {
      if (!name || name === symbol.name) {
        return;
      }
      const result = ModelEditor.renameSymbol(analysis, symbol.id, name);
      if (result.error) {
        Toast.show(result.error, "error");
      } else {
        this.commit(result.text, I18n.t("Rename {name} to {to}", { name: symbol.name, to: name }));
        Toast.show(I18n.n("Renamed {name} to {to} ({count} occurrence).", "Renamed {name} to {to} ({count} occurrences).", result.count, { name: symbol.name, to: name }), "success");
      }
    });
  }

  /**
   * Shows the declaration of the symbol at an offset.
   *
   * @param {number} offset The offset.
   */
  goToDefinition(offset: number) {
    const hit = this.analysis.symbolAt(offset);
    const symbol = hit && hit.symbol;
    if (symbol && symbol.def) {
      this.code.reveal(symbol.def.start, symbol.def.end, true);
    }
  }

  /**
   * Switches between the Design mode (formulas) and the Expert mode (code).
   *
   * @param {string} mode "design" or "expert".
   * @param {boolean} draw True to redraw now.
   */
  setMode(mode: string, draw: boolean = true) {
    this.mode = mode === "expert" ? "expert" : "design";
    PieStudio.savePreference("mode", this.mode);
    $("[data-command=\"mode\"][data-mode]").removeClass("active").filter("[data-mode=\"" + this.mode + "\"]").addClass("active");
    $("body").attr("data-mode", this.mode);
    if (draw && this.model) {
      this.redraw();
      this.verifier.redrawTrace();
    }
  }

  /**
   * Shows the diagram, the code or both.
   *
   * @param {string} view "diagram", "both" or "code".
   */
  setView(view: string) {
    this.view = ["diagram", "both", "code"].includes(view) ? view : "both";
    PieStudio.savePreference("view", this.view);
    $("#editors").attr("data-view", this.view);
    $("[data-command=\"view\"]").removeClass("active").filter("[data-view=\"" + this.view + "\"]").addClass("active");
    if (this.model) {
      this.diagram.drawArrows();
      this.code.schedule();
    }
  }

  /**
   * Applies the light or the dark theme.
   *
   * @param {string} theme "light" or "dark".
   */
  applyTheme(theme: string) {
    document.documentElement.setAttribute("data-bs-theme", theme === "light" ? "light" : "dark");
    PieStudio.savePreference("theme", theme);
    if (this.tools) {
      this.tools.applyTheme(theme === "light" ? "light" : "dark");
    }
  }

  /**
   * Switches the attacker between active and passive (set attacker).
   */
  toggleAttacker() {
    if (!this.analysis.ok) {
      return;
    }
    const passive = (this.analysis.setting("attacker") || "active") === "passive";
    const result = ModelEditor.setSetting(this.analysis, "attacker", passive ? "active" : "passive");
    if (result.text !== undefined) {
      this.commit(result.text, passive ? I18n.t("Active attacker") : I18n.t("Passive attacker"));
    }
  }

  /**
   * Opens the settings. A new language shows when the page loads again, with
   * the model and its history.
   *
   * @param {string} tab "engine", "notation", "theme" or "language".
   */
  openSettings(tab: string) {
    const language = { preference: PieStudio.loadPreference("language", "auto"), loaded: PieStudio.loadPreference("translations", {}) };
    this.settingsDialog.open({
        settings: this.settings
      , conventions: this.conventions
      , tab: tab
      , theme: this.tools.theme
      , codeStyle: this.codeStyle
      , language: language
    }).then(answer => {
      if (!answer) {
        // The theme may have changed while it was edited
        this.applyTheme(PieStudio.loadPreference("theme", "dark"));
        return;
      }
      Explainer.setEnabled(answer.explain !== false);
      if (answer.theme) {
        this.tools.theme = answer.theme;
        this.tools.theme.save();
      }
      this.applyTheme(PieStudio.loadPreference("theme", "dark"));
      this.settings = answer.settings;
      this.settings.save();
      this.checker.settings = this.settings;
      this.conventions = answer.conventions;
      this.conventions.save();
      this.codeStyle = answer.codeStyle;
      PieStudio.savePreference("codeStyle", this.codeStyle);
      MathRenderer.cache.clear();
      if (answer.language.preference !== language.preference || JSON.stringify(answer.language.loaded) !== JSON.stringify(language.loaded)) {
        PieStudio.savePreference("language", answer.language.preference);
        PieStudio.savePreference("translations", answer.language.loaded);
        PieStudio.savePreference(PieStudio.STORAGE_KEY, { text: this.getText(), fileName: this.fileName, pp: this.pp });
        StudioCore.reload({ fileName: this.fileName, pp: this.pp, history: this.history.snapshot() });
        return;
      }
      this.refresh();
      Toast.show(I18n.t("Settings saved."), "success", 1500);
    });
  }

  /**
   * Exports the model: one file, or several when its goals cannot be
   * verified together.
   */
  exportModel() {
    if (!this.analysis.ok) {
      PieStudio.download(this.fileName, this.getText());
      return;
    }
    const plan = ExportPlanner.plan(this.analysis, { fileName: this.fileName });
    const libraries = this.tools.engineFiles();
    if (!plan.needSplit) {
      PieStudio.download(plan.files[0].name, plan.files[0].text);
      return;
    }
    const $body = $("<div></div>");
    $body.append($("<p></p>").text(I18n.n("ProVerif cannot verify these goals in one run ({reason}): the model is exported as {count} file, valid on its own.",
      "ProVerif cannot verify these goals in one run ({reason}): the model is exported as {count} files, each valid on its own.", plan.files.length,
      { reason: plan.incompatible || I18n.t("incompatible goals") })));
    const $list = $("<ul class=\"list-group\"></ul>");
    plan.files.forEach(file => {
      const $item = $("<li class=\"list-group-item d-flex align-items-center gap-2\"></li>");
      $item.append($("<span class=\"st-mono flex-grow-1\"></span>").text(file.name), $("<span class=\"st-muted small\"></span>").text(file.description));
      $item.append($("<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\"><i class=\"fas fa-download\"></i></button>")
        .on("click", () => PieStudio.download(file.name, file.text)));
      $list.append($item);
    });
    $body.append($list);
    this.dialogs.open({
        title: I18n.t("Export for ProVerif")
      , icon: "fa-file-export"
      , body: $body
      , size: "lg"
      , buttons: [
            { label: I18n.t("Close"), style: "secondary", value: null }
          , { label: I18n.t("Download all (.zip)"), style: "primary", action: () => {
                const zip = ZipWriter.make(plan.files.map(file => ({ name: file.name, text: file.text })).concat(libraries));
                PieStudio.download(ExportPlanner.baseName(this.fileName) + ".zip", zip, "application/zip");
                return true;
              }
            }
        ]
    });
  }

  /**
   * Shows the information about PieStudio.
   */
  about() {
    this.dialogs.inform(I18n.t("About PieStudio"), $("#about-template").html(), "fa-circle-info");
  }

  /**
   * Shows the keyboard shortcuts.
   */
  shortcuts() {
    this.dialogs.inform(I18n.t("Keyboard shortcuts"), $("#shortcuts-template").html(), "fa-keyboard");
  }

  /**
   * Remembers the model in the browser, a moment after the last change.
   */
  autosave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      PieStudio.savePreference(PieStudio.STORAGE_KEY, { text: this.getText(), fileName: this.fileName, pp: this.pp });
    }, 800);
  }

  /**
   * Makes the browser download a file.
   *
   * @param {string} name The file name.
   * @param {string|Uint8Array} content The content.
   * @param {string} type The media type.
   */
  static download(name: string, content: string | Uint8Array, type: string = "text/plain") {
    const url = URL.createObjectURL(new Blob([content as BlobPart], { type: type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Reads a preference from the browser storage.
   *
   * @param {string} key The preference, without the prefix.
   * @param {*} fallback The value when there is none.
   * @return {*} The value.
   */
  static loadPreference(key: string, fallback: any) {
    try {
      const value = localStorage.getItem(key.startsWith(PieStudio.PREFERENCES) ? key : PieStudio.PREFERENCES + key);
      return value === null ? fallback : JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Writes a preference into the browser storage, when there is one.
   *
   * @param {string} key The preference, without the prefix.
   * @param {*} value The value.
   */
  static savePreference(key: string, value: any) {
    try {
      localStorage.setItem(key.startsWith(PieStudio.PREFERENCES) ? key : PieStudio.PREFERENCES + key, JSON.stringify(value));
    } catch (e) {
      // Storage may be disabled: the preference lasts for this session only
    }
  }
}
// ----------------------------------------------------------------
