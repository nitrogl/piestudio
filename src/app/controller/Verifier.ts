/**
 * Verifies the model with ProVerif 2.05 and shows the results and traces.
 *
 * When the goals of the model cannot be verified in one run of ProVerif
 * (queries next to choice[,] or equivalence), the model is split as the
 * export does, and the files are verified at the same time. Every run
 * has the memory budget and the timeout of the engine settings; the memory
 * of the engine is shown while it grows.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Verifier {
  studio: PieStudio;
  runner: ProVerifRunner;
  warming: boolean;
  run: any;
  resultIndex: number;
  step: number;
  view: any;
  mapsToModel: boolean;
  output: any;
  ticker: number;
  runners: any;
  outputTimer: any;
  runTimer: any;

  /**
   * @param {Object} params The parameters.
   * @param {PieStudio} params.studio The application.
   */
  constructor(params?: { studio?: PieStudio }) {
    this.studio = params.studio;
    this.runner = new ProVerifRunner({ folder: EngineSettings.ENGINE_FOLDER });
    this.warming = false;
    this.reset();
  }

  /**
   * Forgets the last verification.
   */
  reset() {
    this.run = Verifier.idleRun();
    this.resultIndex = -1;
    this.step = null;
    this.view = null;
    this.mapsToModel = false;
    this.output = "";
    if (this.studio.bottom) {
      this.studio.bottom.setRun(this.run, -1);
      this.studio.bottom.setOutput("");
      this.studio.bottom.setTrace(null, null, {});
      this.studio.diagram.setTraced(null);
      this.studio.code.setTraceRange(null);
    }
  }

  /**
   * @return {Object} The state before any verification.
   */
  static idleRun() {
    return { status: "idle", message: "", results: [], files: [], memory: 0, limit: 0 };
  }

  /**
   * @return {boolean} True while a verification runs.
   */
  isRunning(): boolean {
    return this.run.status === "running";
  }

  /**
   * Verifies a small model once, quietly, so that the first verification
   * of the user runs on an optimised engine.
   */
  warmUp() {
    if (this.isRunning() || this.runner.isRunning()) {
      return;
    }
    this.warming = true;
    this.runner.warmUp().then(() => {
      this.warming = false;
    });
  }

  /**
   * Verifies the model.
   *
   * @return {Promise} Resolves when the verification ends.
   */
  async start(): Promise<any> {
    const studio = this.studio;
    if (this.isRunning()) {
      Toast.show(I18n.t("A verification is already running."), "info");
      return;
    }
    if (this.warming) {
      this.runner.cancel();
      this.warming = false;
    }
    const analysis = studio.analysis;
    if (!analysis.ok) {
      Toast.show(I18n.t("The code has syntax errors: fix them before verifying."), "warning");
      studio.bottom.show("problems");
      return;
    }
    // One run verifies the model as it is, so that the lines of ProVerif
    // are the lines of the code; otherwise I verify the files of the export
    const plan = ExportPlanner.plan(analysis, { fileName: studio.fileName });
    const files = plan.needSplit ? plan.files : [{ name: studio.fileName, description: I18n.t("all goals"), text: studio.getText() }];
    this.reset();
    this.run = {
        status: "running"
      , message: files.length > 1 ? I18n.n("Verifying {count} file: the goals need separate runs.", "Verifying {count} files: the goals need separate runs.", files.length)
          : I18n.t("ProVerif is verifying the model...")
      , results: []
      , files: []
      , memory: ProVerifEngine.INITIAL_MEMORY
      , limit: studio.settings.getMaxMemoryBytes()
      , budget: studio.settings.getMaxMemoryBytes()
      , started: Date.now()
      , modelText: studio.getText()
    };
    // The time goes on even when ProVerif says nothing
    this.ticker = setInterval(() => this.refreshRun(), 1000);
    this.updateButtons();
    studio.bottom.show("results");
    studio.bottom.setRun(this.run, -1);

    const options = {
        args: studio.settings.getArgs().concat(studio.tools.engineArgs())
      , files: studio.tools.engineFiles()
      , maxMemory: studio.settings.getMaxMemoryBytes()
      , timeoutSeconds: studio.settings.getTimeoutSeconds()
    };
    // The files of a split are verified at the same time, one verifier each
    if (files.length > 1) {
      this.run.message = I18n.n("Verifying {count} file at the same time, one verifier each.", "Verifying {count} files at the same time, one verifier each.", files.length);
      this.run.limit = this.run.budget*files.length;
      this.runners = files.map(() => new ProVerifRunner({ folder: EngineSettings.ENGINE_FOLDER }));
      const memory = files.map(() => ProVerifEngine.INITIAL_MEMORY);
      const outputs = files.map(file => I18n.t("File {name}: {description}", { name: file.name, description: file.description }) + "\n\n");
      const outcomes = await Promise.all(files.map((file, i) => this.verifyFile(this.runners[i], file, options, text => {
        outputs[i] += text;
        this.output = outputs.join("\n");
        this.showOutput();
      }, bytes => {
        memory[i] = bytes;
        this.run.memory = memory.reduce((sum, value) => sum + value, 0);
        this.refreshRun();
      })));
      this.runners = [];
      outcomes.forEach(outcome => this.record(outcome, files.length));
      this.run.memory = outcomes.reduce((sum, outcome) => sum + (outcome.result.bytes || ProVerifEngine.INITIAL_MEMORY), 0);
      const failed = outcomes.find(outcome => outcome.result.status !== "done" || outcome.parsed.errors.length);
      this.finish(failed ? failed.result : { status: "done" }, failed ? failed.parsed : null);
      return;
    }
    for (const file of files) {
      this.appendOutput(files.length > 1 ? I18n.t("File {name}: {description}", { name: file.name, description: file.description }) + "\n\n" : "");
      const outcome = await this.verifyFile(this.runner, file, options, text => this.appendOutput(text), (bytes, limit) => {
        this.run.memory = Math.max(this.run.memory, bytes);
        this.run.limit = limit;
        this.refreshRun();
      });
      this.record(outcome, files.length);
      if (outcome.result.status !== "done" || outcome.parsed.errors.length) {
        this.finish(outcome.result, outcome.parsed);
        return;
      }
      this.refreshRun();
    }
    this.finish({ status: "done" }, null);
  }

  /**
   * Verifies one file.
   *
   * @param {ProVerifRunner} runner The runner.
   * @param {Object} file The file, {name, text, description}.
   * @param {Object} options The arguments, the libraries, the memory budget
   *   and the timeout.
   * @param {function(string):void} onText Receives the output.
   * @param {function(number, number):void} onMemory Receives the memory.
   * @return {Promise<Object>} {file, output, result, parsed}.
   */
  verifyFile(runner: ProVerifRunner, file: any, options: any, onText: ((arg0: string) => void), onMemory: ((arg0: number, arg1: number) => void)): Promise<any> {
    let output = "";
    return runner.run(file.text, {
        fileName: file.name
      , args: options.args
      , files: options.files
      , maxMemory: options.maxMemory
      , timeoutSeconds: options.timeoutSeconds
      , onOutput: (channel, text) => {
          output += text;
          onText(text);
        }
      , onMemory: onMemory
    }).then(result => ({ file: file, output: output, result: result, parsed: OutputParser.parse(output) }));
  }

  /**
   * Records the results of a file in the run.
   *
   * @param {Object} outcome The outcome of verifyFile.
   * @param {number} count The number of files of the run.
   */
  record(outcome: any, count: number) {
    this.run.memory = Math.max(this.run.memory, outcome.result.bytes || 0);
    const fileIndex = this.run.files.length;
    this.run.files.push({ name: outcome.file.name, text: outcome.file.text, output: outcome.output, parsed: outcome.parsed, result: outcome.result });
    outcome.parsed.results.forEach(item => this.run.results.push({ fileIndex: fileIndex, fileName: count > 1 ? outcome.file.name : "", result: item }));
  }

  /**
   * Ends the verification and tells the user how it went.
   *
   * @param {Object} result The result of the last run.
   * @param {Object|null} parsed The parsed output of the last run, when it
   *   failed.
   */
  finish(result: any, parsed: any) {
    const run = this.run;
    clearInterval(this.ticker);
    run.ms = Date.now() - run.started;
    run.status = result.status;
    const counts = { true: 0, false: 0, other: 0 };
    run.results.forEach(item => {
      const verdict = item.result.verdict;
      counts[verdict === "true" ? "true" : verdict === "false" ? "false" : "other"]++;
    });
    const values = { proved: counts.true, failed: counts.false, other: counts.other };
    const summary = counts.other
      ? I18n.n("{count} goal: {proved} proved, {failed} false, {other} cannot be proved.", "{count} goals: {proved} proved, {failed} false, {other} cannot be proved.", run.results.length, values)
      : I18n.n("{count} goal: {proved} proved, {failed} false.", "{count} goals: {proved} proved, {failed} false.", run.results.length, values);
    if (result.status === "done" && parsed && parsed.errors.length) {
      run.status = "error";
      run.message = I18n.t("ProVerif stopped: {message}", { message: parsed.errors[0].message.split("\n")[0] });
    } else if (result.status === "done" && run.results.length === 0) {
      run.message = I18n.t("ProVerif accepts the model; it has no security goals to verify (add a query).");
    } else if (result.status === "done") {
      run.message = summary;
    } else if (result.status === "memory" && run.budget === 0) {
      run.message = I18n.t("Stopped: the browser gave the engine no more memory, after {size} MB (WebAssembly can address at most 4 GB).", { size: Math.round(run.memory/1048576) })
        + " " + (run.results.length ? summary : "");
    } else if (result.status === "memory") {
      run.message = I18n.t("Stopped: the verification reached its memory budget of {size} MB (Settings, Engine).", { size: Math.round(run.budget/1048576) })
        + " " + (run.results.length ? summary : "");
    } else if (result.status === "timeout") {
      run.message = I18n.t("Stopped: the verification reached its time limit of {seconds} s (Settings, Engine).", { seconds: this.studio.settings.getTimeoutSeconds() })
        + " " + (run.results.length ? summary : "");
    } else if (result.status === "cancelled") {
      run.message = I18n.t("Cancelled.") + " " + (run.results.length ? summary : "");
    } else {
      run.message = I18n.t("The engine failed: {message}", { message: result.message });
    }
    this.updateButtons();
    this.refreshRun();
    const kind = run.status === "done" ? (counts.false ? "warning" : "success") : run.status === "cancelled" ? "info" : "error";
    Toast.show(run.message, kind, 5000);
    const attack = run.results.findIndex(item => item.result.verdict === "false" && item.result.trace);
    if (attack >= 0) {
      this.selectResult(attack);
    }
  }

  /**
   * Stops the verification.
   */
  cancel() {
    if (this.isRunning()) {
      this.runner.cancel();
      (this.runners || []).forEach(runner => runner.cancel());
    }
  }

  /**
   * Adds output, and shows it a little later (outputs come in many pieces).
   *
   * @param {string} text The output.
   */
  appendOutput(text: string) {
    this.output += text;
    this.showOutput();
  }

  /**
   * Shows the output, a little later (outputs come in many pieces).
   */
  showOutput() {
    if (!this.outputTimer) {
      this.outputTimer = setTimeout(() => {
        this.outputTimer = null;
        this.studio.bottom.setOutput(this.output);
      }, 150);
    }
  }

  /**
   * Shows the state of the run, a little later.
   */
  refreshRun() {
    if (!this.runTimer) {
      this.runTimer = setTimeout(() => {
        this.runTimer = null;
        this.studio.bottom.setRun(this.run, this.resultIndex);
      }, 100);
    }
  }

  /**
   * Shows the verify button as a stop button while ProVerif runs.
   */
  updateButtons() {
    const running = this.isRunning();
    $("#verify-button").attr("data-command", running ? "cancel" : "verify").empty()
      .append(running ? "<i class=\"spinner-border spinner-border-sm\"></i>" : "<i class=\"fas fa-play\"></i>", $("<span></span>").text(" " + (running ? I18n.t("Stop") : I18n.t("Verify"))))
      .toggleClass("btn-primary", !running).toggleClass("btn-danger", running);
    $("[data-command=\"cancel\"].dropdown-item").toggleClass("disabled", !running);
  }

  /**
   * Selects a result and shows its trace.
   *
   * @param {number} index The result.
   */
  selectResult(index: number) {
    const item = this.run.results[index];
    if (!item) {
      return;
    }
    const studio = this.studio;
    const file = this.run.files[item.fileIndex];
    this.resultIndex = index;
    this.step = null;
    this.view = null;
    // The files of a split have the processes of the model: their steps are
    // matched to the model, as long as it has not changed since the run
    this.mapsToModel = this.run.modelText === studio.getText();
    if (item.result.trace) {
      const listing = file.parsed.processes.get(item.result.processNum === null || item.result.processNum === undefined ? 0 : item.result.processNum)
        || file.parsed.processes.values().next().value;
      const analysis = this.mapsToModel ? studio.analysis : Analysis.of(file.text);
      try {
        this.view = TraceMapper.build(item.result.trace, listing ? listing.text : "", analysis);
      } catch (e) {
        this.view = null;
      }
    }
    studio.bottom.setRun(this.run, index);
    studio.diagram.setTraced(null);
    studio.code.setTraceRange(null);
    studio.bottom.show("trace");
    this.redrawTrace();
  }

  /**
   * Selects a step of the trace, and shows the block and the code that
   * made it.
   *
   * @param {number} index The step.
   */
  pickStep(index: number) {
    if (!this.view || this.view.steps.length === 0) {
      return;
    }
    this.step = Math.max(0, Math.min(this.view.steps.length - 1, index));
    const step = this.view.steps[this.step];
    const source = step.source || step.source2;
    if (source && this.mapsToModel) {
      this.studio.diagram.setTraced(source.path.join("."));
      this.studio.code.setTraceRange([source.start, source.end]);
    } else {
      this.studio.diagram.setTraced(null);
      this.studio.code.setTraceRange(null);
    }
    this.redrawTrace();
  }

  /**
   * Draws the trace of the selected result again (after a change of mode).
   */
  redrawTrace() {
    const item = this.run.results[this.resultIndex];
    this.studio.bottom.setTrace(this.view, item ? item.result : null, { step: this.step, mode: this.studio.mode, writer: this.studio.writer });
  }
}
// ----------------------------------------------------------------
