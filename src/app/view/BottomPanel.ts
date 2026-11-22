/**
 * The panel below the editors, with its tabs: the problems of the model,
 * the results of the last verification, the attack trace of the selected
 * result, the output of ProVerif and the history of the changes.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class BottomPanel {
  /**
   * The tabs, in order.
   *
   * @type {Array<string>}
   */
  static TABS: string[] = ["problems", "results", "trace", "output", "history"];

  handlers: any;
  $root: JQuery<HTMLElement>;
  problems: any[];
  trace: TraceView;
  current: string;
  pendingTrace: { view: any; result: any; options: any; };
  drawn: { view: any; result: any; mode: string; writer: any; step: number; };

  /**
   * @param {Object} params The panel parameters.
   * @param {string} params.root The element of the panel.
   * @param {Object} params.handlers The callbacks: problem(problem),
   *   result(index), step(index), jump(historyIndex), toggle().
   */
  constructor(params?: { root?: string; handlers?: any }) {
    const defaults = {
        root: "#bottom"
      , handlers: {}
    };
    params = {...defaults, ...params};
    this.handlers = {
        problem: () => {}
      , result: () => {}
      , step: () => {}
      , jump: () => {}
      , toggle: () => {}
      , ...params.handlers
    };
    this.$root = $(params.root);
    this.problems = [];
    this.drawn = null;
    this.trace = new TraceView({ onPick: index => this.handlers.step(index) });
    this.bind();
  }

  /**
   * Listens to the user.
   */
  bind() {
    const panel = this;
    this.$root.on("click", ".st-tab", function() {
      panel.show($(this).attr("data-tab"));
    });
    this.$root.on("click", "[data-command=\"toggleBottom\"]", () => this.handlers.toggle());
    this.$root.on("click", ".st-problem", function() {
      panel.handlers.problem(panel.problems[Number($(this).attr("data-index"))]);
    });
    this.$root.on("click", ".st-result", function() {
      panel.handlers.result(Number($(this).attr("data-index")));
    });
    this.$root.on("click", ".st-history-entry", function() {
      panel.handlers.jump(Number($(this).attr("data-index")));
    });
  }

  /**
   * Shows a tab, opening the panel if needed.
   *
   * @param {string} tab The tab: problems, results, trace, output or history.
   */
  show(tab: string) {
    this.$root.find(".st-tab").removeClass("active").filter("[data-tab=\"" + tab + "\"]").addClass("active");
    this.$root.find(".st-tab-pane").removeClass("active").filter("[data-pane=\"" + tab + "\"]").addClass("active");
    this.$root.removeClass("st-closed");
    this.current = tab;
    if (tab === "trace" && this.pendingTrace) {
      const pending = this.pendingTrace;
      this.pendingTrace = null;
      this.setTrace(pending.view, pending.result, pending.options);
    }
  }

  /**
   * Lists the problems of the model.
   *
   * @param {Array<Object>} problems The problems: severity, message,
   *   offsets, line and source.
   */
  setProblems(problems: any[]) {
    this.problems = problems;
    const errors = problems.filter(problem => problem.severity === "error").length;
    const warnings = problems.filter(problem => problem.severity === "warning").length;
    this.$root.find("[data-tab=\"problems\"] .st-badge").text(errors + warnings || "")
      .toggleClass("st-badge-error", errors > 0).toggleClass("st-badge-warning", errors === 0 && warnings > 0);
    const $pane = this.$root.find("[data-pane=\"problems\"]").empty();
    if (problems.length === 0) {
      $pane.append($("<div class=\"st-empty\"></div>").append("<i class=\"fas fa-circle-check st-ok\"></i> ", document.createTextNode(I18n.t("No problems: ProVerif accepts this model."))));
      return;
    }
    problems.forEach((problem, i) => {
      const icon = problem.severity === "error" ? "fa-circle-xmark st-error" : problem.severity === "warning" ? "fa-triangle-exclamation st-warning" : "fa-circle-info st-info";
      const $row = $("<div class=\"st-problem\"></div>").attr("data-index", i);
      $row.append("<i class=\"fas " + icon + "\"></i>");
      $row.append($("<span class=\"st-problem-line\"></span>").text(problem.line ? I18n.t("line {number}", { number: problem.line }) : ""));
      $row.append($("<span class=\"st-problem-message\"></span>").text(problem.message));
      if (problem.source === "proverif") {
        $row.append($("<span class=\"st-problem-source\">ProVerif</span>").attr("title", I18n.t("Reported by ProVerif 2.05 itself")));
      }
      $pane.append($row);
    });
  }

  /**
   * Shows the state of the verification and its results.
   *
   * @param {Object} run The run: status, message, results (each with its
   *   verdict, goal and file), files, memory and duration.
   * @param {number} selected The selected result, or -1.
   */
  setRun(run: any, selected: number) {
    const $pane = this.$root.find("[data-pane=\"results\"]").empty();
    const results = run.results || [];
    const counts = { true: 0, false: 0, other: 0 };
    results.forEach(item => {
      const verdict = item.result.verdict;
      counts[verdict === "true" ? "true" : verdict === "false" ? "false" : "other"]++;
    });
    this.$root.find("[data-tab=\"results\"] .st-badge").text(results.length || "")
      .toggleClass("st-badge-error", counts.false > 0).toggleClass("st-badge-ok", counts.false === 0 && results.length > 0);

    const $status = $("<div class=\"st-run-status\"></div>");
    if (run.status === "idle") {
      $pane.append($("<div class=\"st-empty\"></div>").text(I18n.t("Verify the model (F5) to see the results of its security goals.")));
      return;
    }
    if (run.status === "running") {
      $status.append("<span class=\"spinner-border spinner-border-sm\"></span>", $("<span></span>").text(" " + (run.message || I18n.t("ProVerif is working..."))));
    } else {
      const icon = run.status === "done" ? "fa-circle-check st-ok" : run.status === "memory" || run.status === "timeout" ? "fa-triangle-exclamation st-warning" : "fa-circle-xmark st-error";
      $status.append("<i class=\"fas " + icon + "\"></i>", $("<span></span>").text(" " + (run.message || "")));
    }
    if (run.memory) {
      // Without a budget, the bar measures against the 4 GB of WebAssembly
      const used = Math.round(run.memory/1048576);
      const unbounded = run.budget === 0;
      const limit = unbounded ? 4096 : Math.round((run.limit || run.memory)/1048576);
      const $meter = $("<span class=\"st-memory\"></span>").attr("title", unbounded ? I18n.t("Memory of the engine: {used} MB, with no budget", { used: used })
        : I18n.t("Memory of the engine: {used} MB of a budget of {limit} MB", { used: used, limit: limit }));
      $meter.append("<i class=\"fas fa-memory\"></i>", $("<span class=\"st-memory-bar\"></span>").append($("<span></span>").css("width", Math.min(100, 100*used/Math.max(1, limit)) + "%")),
        $("<span></span>").text(unbounded ? I18n.t("{used} MB, no limit", { used: used }) : used + " / " + limit + " MB"));
      $status.append($meter);
    }
    if (run.status === "running" && run.started) {
      $status.append($("<span class=\"st-muted\"></span>").text(Math.floor((Date.now() - run.started)/1000) + " s"));
    } else if (run.ms !== undefined) {
      $status.append($("<span class=\"st-muted\"></span>").text((run.ms/1000).toFixed(1) + " s"));
    }
    $pane.append($status);
    if (results.length === 0) {
      return;
    }
    const $table = $("<table class=\"table table-sm st-results\"><thead><tr><th></th><th></th><th></th><th></th></tr></thead><tbody></tbody></table>");
    $table.find("th").slice(0, 3).each(function(i) {
      $(this).text([I18n.t("Result"), I18n.t("Security goal"), I18n.t("File")][i]);
    });
    results.forEach((item, i) => {
      const verdict = item.result.verdict;
      const cls = verdict === "true" ? "st-v-true" : verdict === "false" ? "st-v-false" : "st-v-other";
      const $row = $("<tr class=\"st-result\"></tr>").attr("data-index", i).toggleClass("st-selected", i === selected);
      $row.append($("<td></td>").append($("<span class=\"st-verdict\"></span>").addClass(cls).text(OutputParser.verdictName(verdict))));
      $row.append($("<td class=\"st-goal\"></td>").text(item.result.goal + (item.result.note ? " (" + item.result.note + ")" : "")));
      $row.append($("<td class=\"st-muted\"></td>").text(item.fileName || ""));
      $row.append($("<td></td>").append(item.result.trace ? $("<span class=\"st-trace-link\"><i class=\"fas fa-route\"></i> </span>").append(document.createTextNode(I18n.t("trace"))) : ""));
      $table.find("tbody").append($row);
    });
    $pane.append($table);
  }

  /**
   * Draws the attack trace of the selected result.
   *
   * @param {Object|null} view The trace, as built by TraceMapper, or null.
   * @param {Object|null} result The result it belongs to.
   * @param {Object} options The selected step, the mode and the writer.
   */
  setTrace(view: any, result: any, options: any) {
    const $pane = this.$root.find("[data-pane=\"trace\"]");
    const drawn = this.drawn;
    this.drawn = null;
    if (this.current !== "trace" && view) {
      // I draw when the tab shows, so that the chart knows its width
      this.pendingTrace = { view: view, result: result, options: options };
      $pane.empty();
      return;
    }
    const $shown = $pane.find(".st-trace-chart");
    if (view && drawn && drawn.view === view && drawn.result === result && drawn.mode === options.mode && drawn.writer === options.writer && $shown.length) {
      if (drawn.step !== options.step) {
        $pane.find(".st-trace-step").text(this.stepText(view, options.step));
        this.trace.select($shown, options.step);
      }
      this.drawn = { ...drawn, step: options.step };
      return;
    }
    const scroll = drawn && drawn.view === view ? { top: $pane.scrollTop(), left: $pane.scrollLeft() } : { top: 0, left: 0 };
    $pane.empty();
    if (!result) {
      $pane.append($("<div class=\"st-empty\"></div>").text(I18n.t("Verify the model, then choose a result that has an attack trace.")));
      return;
    }
    const $head = $("<div class=\"st-trace-head\"></div>");
    $head.append($("<span class=\"st-verdict\"></span>").addClass(result.verdict === "true" ? "st-v-true" : result.verdict === "false" ? "st-v-false" : "st-v-other").text(OutputParser.verdictName(result.verdict)));
    $head.append($("<span class=\"st-goal\"></span>").text(result.goal));
    if (view) {
      $head.append($("<span class=\"st-muted st-trace-step\"></span>").text(this.stepText(view, options.step)));
      $head.append($("<button type=\"button\" class=\"btn btn-sm st-tool\" data-command=\"tracePrevious\"><i class=\"fas fa-chevron-up\"></i></button>").attr("title", I18n.t("Previous step")));
      $head.append($("<button type=\"button\" class=\"btn btn-sm st-tool\" data-command=\"traceNext\"><i class=\"fas fa-chevron-down\"></i></button>").attr("title", I18n.t("Next step")));
      const $chart = $("<div class=\"st-trace-chart\"></div>");
      $pane.append($head, $chart);
      this.trace.render($chart, view, options);
      $pane.scrollTop(scroll.top).scrollLeft(scroll.left);
      if (!drawn || drawn.view !== view || drawn.step !== options.step) {
        this.trace.reveal($chart, options.step);
      }
      this.drawn = { view: view, result: result, mode: options.mode, writer: options.writer, step: options.step };
    } else {
      $pane.append($head);
      const note = result.verdict === "false" ? I18n.t("ProVerif found an attack but could not rebuild a trace of it.")
        : result.verdict === "true" ? I18n.t("The goal holds: there is no attack to show.") : I18n.t("ProVerif could neither prove the goal nor find an attack.");
      $pane.append($("<div class=\"st-empty\"></div>").text(note));
      if (result.derivation && result.derivation.steps) {
        const $list = $("<ol class=\"st-derivation\"></ol>");
        result.derivation.steps.forEach(step => $list.append($("<li></li>").text(typeof step === "string" ? step : step.text || "")));
        $pane.append($("<details></details>").append($("<summary></summary>").text(I18n.n("Derivation ({count} step)", "Derivation ({count} steps)", result.derivation.steps.length)), $list));
      }
    }
  }

  /**
   * Writes the step of a trace in the head of its tab.
   *
   * @param {Object} view The trace, as built by TraceMapper.
   * @param {number|null} step The selected step, or null.
   * @return {string} The text.
   */
  stepText(view: any, step: number): string {
    const current = step !== null && step !== undefined ? view.steps[step] : null;
    return current
      ? I18n.t("Step {number} of {count}: {text}", { number: step + 1, count: view.steps.length, text: (current.text || "").replace(/\s+/g, " ") })
      : I18n.n("{count} step. Click a step to see the action that made it.", "{count} steps. Click a step to see the action that made it.", view.steps.length);
  }

  /**
   * Shows the output of ProVerif.
   *
   * @param {string} output The output.
   */
  setOutput(output: string) {
    const $pre = this.$root.find("[data-pane=\"output\"] pre");
    const element = $pre[0];
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 30;
    $pre.text(output);
    if (atBottom) {
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Lists the steps of the history.
   *
   * @param {Array<Object>} entries The steps: label, time and whether each
   *   is applied (done) or undone.
   */
  setHistory(entries: any[]) {
    const $pane = this.$root.find("[data-pane=\"history\"]").empty();
    const $list = $("<div class=\"st-history\"></div>");
    entries.forEach((entry, i) => {
      const $row = $("<div class=\"st-history-entry\"></div>").attr("data-index", i)
        .toggleClass("st-undone", !entry.applied).toggleClass("st-current", !!entry.current);
      $row.append($("<span class=\"st-history-label\"></span>").text(entry.label));
      $row.append($("<span class=\"st-muted\"></span>").text(entry.time ? new Date(entry.time).toLocaleTimeString() : ""));
      $list.append($row);
    });
    $pane.append($list);
  }
}
// ----------------------------------------------------------------
