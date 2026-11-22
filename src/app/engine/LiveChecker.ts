/**
 * Checks the model with ProVerif's own front end while the user edits it.
 *
 * A short while after the last change, the model is given to ProVerif 2.05
 * with -parse-only: ProVerif parses and type checks it and stops. Its first
 * error, if any, is reported with its position in the model. The JavaScript
 * parser and checker of the studio report problems as the user types; this
 * check confirms them with ProVerif itself, and finds what they might miss.
 *
 * Checks run in their own runner, so that they never wait for a
 * verification. In a page opened from a file, where ProVerif would run in
 * the page, the checks are off.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class LiveChecker {
  settings: EngineSettings;
  delay: number;
  onResult: (arg0: any) => void;
  libraries: () => any;
  runner: ProVerifRunner;
  timer: number;
  pending: any;
  checked: any;

  /**
   * @param {Object} params The checker parameters.
   * @param {EngineSettings} params.settings The engine settings.
   * @param {number} params.delay Milliseconds of quiet before a check.
   * @param {function(Object):void} params.onResult Receives the result of a
   *   check: the text checked, its status ("ok", "error" or "unavailable")
   *   and the problems, with their offsets in the text.
   * @param {function():Object} params.libraries Gives the arguments and the
   *   files of the libraries, {args, files}.
   */
  constructor(params?: { settings?: EngineSettings; delay?: number; onResult?: ((arg0: any) => void); libraries?: (() => any) }) {
    const defaults = {
        settings: new EngineSettings()
      , delay: 700
      , onResult: () => {}
      , libraries: () => ({ args: [], files: [] })
    };
    params = {...defaults, ...params};
    this.settings = params.settings;
    this.delay = params.delay;
    this.onResult = params.onResult;
    this.libraries = params.libraries;
    this.runner = new ProVerifRunner({ folder: EngineSettings.ENGINE_FOLDER });
    this.timer = null;
    this.pending = null;
    this.checked = null;
  }

  /**
   * @return {boolean} True when checks can run without blocking the page.
   */
  isAvailable(): boolean {
    return this.settings.liveChecks && this.runner.getMode() === "worker";
  }

  /**
   * Checks a text soon, unless it has just been checked.
   *
   * @param {string} text The model.
   */
  schedule(text: string) {
    if (!this.isAvailable() || text === this.checked) {
      return;
    }
    this.pending = text;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.next(), this.delay);
  }

  /**
   * Forgets the last check, so that the same text is checked again (the
   * libraries changed).
   */
  forget() {
    this.checked = null;
  }

  /**
   * Checks the pending text, if no check is running.
   */
  next() {
    if (this.pending === null || this.runner.isRunning()) {
      return;
    }
    const text = this.pending;
    this.pending = null;
    let output = "";
    const libraries = this.libraries();
    this.runner.run(text, {
        args: ["-parse-only"].concat(libraries.args)
      , files: libraries.files
      , maxMemory: 256*1048576
      , timeoutSeconds: 20
      , onOutput: (channel, chunk) => {
          output += chunk;
        }
    }).then(result => {
      this.checked = text;
      this.onResult(LiveChecker.interpret(text, result, output));
      if (this.pending !== null) {
        this.timer = setTimeout(() => this.next(), 50);
      }
    });
  }

  /**
   * Turns the output of a check into problems.
   *
   * @param {string} text The model that was checked.
   * @param {Object} result The result of the run.
   * @param {string} output The output of ProVerif.
   * @return {Object} The text, the status and the problems.
   */
  static interpret(text: string, result: any, output: string) {
    if (result.status !== "done") {
      return { text: text, status: "unavailable", problems: [], message: result.message };
    }
    const parsed = OutputParser.parse(output);
    const problems = parsed.errors.concat(parsed.warnings).map(record => {
      const range = record.line ? OutputParser.locationToOffsets(text, record) : { start: 0, end: 0 };
      return {
          severity: record.severity === "error" ? "error" : "warning"
        , message: record.message.split("\n")[0]
        , start: range.start
        , end: range.end
        , source: "proverif"
      };
    });
    const failed = result.exitCode !== 0 || problems.some(problem => problem.severity === "error");
    return { text: text, status: failed ? "error" : "ok", problems: problems, message: "" };
  }
}
// ----------------------------------------------------------------
