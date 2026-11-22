/**
 * An attack trace as a message sequence chart: one lifeline per process
 * instance (a party in a session) and one for the attacker.
 *
 * Messages from the processes go to the attacker, messages to the
 * processes come from him, and the steps without a message (fresh names,
 * events, tables, what the attacker learns) are boxes on their lifeline.
 * The steps are written as the diagram writes its blocks: formulas with the
 * notation of the model in the Design mode, code in the Expert mode; their
 * names are those of TraceNames, and a long step takes the lines it needs.
 * Clicking a step selects it, and the studio shows the block and the line
 * of code that made it.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class TraceView {
  /**
   * Sizes of the chart, in pixels.
   *
   * @type {Object}
   */
  static SIZE = {
      left: 30
    , headHeight: 38
    , columnMin: 160
    , columnMax: 280
    , arrowRow: 48
    , boxRow: 38
    , noteRow: 28
  };

  /**
   * The SVG namespace.
   *
   * @type {string}
   */
  static SVG = "http://www.w3.org/2000/svg";

  onPick: (arg0: number) => void;
  writer: any;
  mode: string;
  view: any;
  names: TraceNames;

  /**
   * @param {Object} params The view parameters.
   * @param {function(number):void} params.onPick Receives the step that the
   *   user clicked.
   */
  constructor(params?: { onPick?: ((arg0: number) => void) }) {
    const defaults = {
        onPick: () => {}
    };
    params = {...defaults, ...params};
    this.onPick = params.onPick;
    this.writer = null;
    this.mode = "expert";
    this.view = null;
    this.names = null;
  }

  /**
   * Lays out the columns and the rows of a trace.
   *
   * @param {Object} view The trace, as built by TraceMapper.
   * @param {number} available The width available, in pixels.
   * @param {Array<number>} heights The height of what each step shows, in
   *   pixels, or null before it is known.
   * @return {Object} The columns, the rows, the column width, the x of the
   *   attacker and the size of the chart.
   */
  static layout(view: any, available: number, heights: number[] = null) {
    const size = TraceView.SIZE;
    const middle = Math.ceil(view.lanes.length/2);
    const columns = view.lanes.map((lane, i) => ({ kind: "lane", lane: i, label: lane.label }));
    columns.splice(middle, 0, { kind: "attacker", label: I18n.t("Attacker") });
    const width = Math.max(size.columnMin, Math.min(size.columnMax, Math.floor((available - size.left - 20)/columns.length)));
    columns.forEach((column, i) => {
      column.x = size.left + width/2 + i*width;
    });
    const xOf = lane => columns.find(column => column.kind === "lane" && column.lane === lane).x;
    const attackerX = columns.find(column => column.kind === "attacker").x;
    const has = lane => lane !== null && lane !== undefined;
    let y = 8;
    const rows = view.steps.map((step, i) => {
      const content = heights ? heights[i] : 0;
      let height = Math.max(size.boxRow, content + 12);
      let kind = "box";
      if ((step.kind === "out" || step.kind === "in") && has(step.lane)) {
        height = Math.max(size.arrowRow, content + 30);
        kind = "arrow";
      } else if (step.kind === "comm" && has(step.lane) && has(step.lane2) && step.lane !== step.lane2) {
        height = Math.max(size.arrowRow, content + 30);
        kind = "comm";
      } else if (!has(step.lane) && !["attacker-knows", "attacker-test", "event-executed"].includes(step.kind)) {
        height = Math.max(size.noteRow, content + 8);
        kind = "note";
      }
      const row = {
          y: y
        , height: height
        , kind: kind
        , step: step
        , x: has(step.lane) ? xOf(step.lane) : attackerX
        , x2: kind === "comm" ? xOf(step.lane2) : null
      };
      y += height;
      return row;
    });
    return { columns: columns, rows: rows, width: width, attackerX: attackerX, chartWidth: size.left + columns.length*width + 20, chartHeight: y + 16 };
  }

  /**
   * Writes a term of a step, with the names of the trace.
   *
   * @param {number} index The step.
   * @param {string} field The term: message, channel, value, event or entry.
   * @param {string} text The term, as ProVerif prints it.
   * @return {Object} Its code, and its LaTeX, or null when the term cannot
   *   be read.
   */
  piece(index: number, field: string, text: string) {
    const node = this.names.term(index, field);
    if (!node) {
      return { code: this.names.text(text || ""), tex: null };
    }
    let tex = null;
    if (this.writer) {
      try {
        tex = this.writer.term(node);
      } catch (e) {
        tex = null;
      }
    }
    return { code: PvPrinter.term(node), tex: tex };
  }

  /**
   * Writes a step as the diagram writes its block: with the conventions of
   * the notation in the Design mode, as code in the Expert mode.
   *
   * @param {Object} step The step.
   * @param {number} index Its index.
   * @return {Object} The words before it, if any, its code, and its LaTeX,
   *   or null when it has none.
   */
  written(step: any, index: number) {
    const fill = (key, values) => (this.writer && Object.keys(values).every(k => values[k] !== null) ? LatexWriter.fill(this.writer.conv.get(key), values) : null);
    switch (step.kind) {
      case "new": {
        const value = this.piece(index, "value", step.value);
        return { head: "", code: "new " + value.code + (step.type ? ": " + step.type : ""), tex: step.type ? fill("new", { 1: value.tex, 2: this.writer ? this.writer.type(step.type) : null }) : null };
      }

      case "out":
      case "comm":
      case "in": {
        const key = step.kind === "in" ? "in" : "out";
        const channel = this.piece(index, "channel", step.channel);
        const message = this.piece(index, "message", step.message);
        return { head: "", code: key + "(" + channel.code + ", " + message.code + ")", tex: fill(key, { 1: channel.tex, 2: message.tex }) };
      }

      case "event": {
        const event = this.piece(index, "event", step.event);
        return { head: "", code: "event " + event.code, tex: fill("event", { 1: event.tex }) };
      }

      case "insert":
      case "get": {
        const entry = this.piece(index, "entry", step.entry);
        return { head: "", code: step.kind + " " + entry.code, tex: fill(step.kind, { 1: entry.tex }) };
      }

      case "attacker-knows": {
        const message = this.piece(index, "message", step.message);
        return { head: I18n.t("attacker has"), code: message.code, tex: message.tex };
      }

      case "event-executed": {
        const event = this.piece(index, "event", step.event);
        return { head: I18n.t("goal: event"), code: event.code, tex: event.tex };
      }

      case "attacker-test":
        return { head: I18n.t("attacker test"), code: "", tex: null };

      default:
        return { head: step.kind, code: step.detail || step.label || "", tex: null };
    }
  }

  /**
   * Draws what a step shows: a formula in the Design mode, when it has one,
   * and code otherwise; after a message that a later step shows by its name,
   * that name.
   *
   * @param {Object} step The step.
   * @param {number} index Its index.
   * @return {string} HTML.
   */
  printed(step: any, index: number): string {
    const written = this.written(step, index);
    const formula = tex => (this.mode === "design" && tex && MathRenderer.fits(tex) ? MathRenderer.html(TraceWriter.breakable(tex)) : null);
    const head = written.head ? "<span class=\"st-msc-kind\">" + MathRenderer.escape(written.head) + "</span> " : "";
    const body = formula(written.tex) || (written.code ? "<span class=\"st-msc-code\">" + MathRenderer.escape(written.code) + "</span>" : "");
    const name = this.names.defines(index);
    const named = name ? " <span class=\"st-msc-kind\">= " + (formula(TraceWriter.marked("\\tilde{M}", name.mark)) || MathRenderer.escape(name.code)) + "</span>" : "";
    return head + body + named;
  }

  /**
   * Draws the name of a lane: a process, with the mark of its session.
   *
   * @param {Object} column The column.
   * @return {string} HTML.
   */
  laneName(column: any): string {
    if (column.kind !== "lane") {
      return MathRenderer.escape(column.label);
    }
    const lane = this.names.lane(column.lane);
    return MathRenderer.escape(lane.name) + (lane.mark === "'" ? "'" : lane.mark ? "|<sub>" + MathRenderer.escape(lane.mark) + "</sub>" : "");
  }

  /**
   * Draws a trace.
   *
   * @param {jQuery} $host The element of the chart.
   * @param {Object} view The trace, as built by TraceMapper.
   * @param {Object} options The selected step, the mode and the writer.
   */
  render($host: JQuery, view: any, options: any) {
    this.mode = options.mode;
    this.writer = options.writer ? new TraceWriter(options.writer.table) : null;
    if (this.view !== view) {
      this.view = view;
      this.names = TraceNames.of(view);
    }
    const step = options.step;
    const size = TraceView.SIZE;
    const available = Math.max(600, $host.width() || 900);
    let layout = TraceView.layout(view, available);
    const element = (tag, attributes) => {
      const node = document.createElementNS(TraceView.SVG, tag);
      Object.keys(attributes).forEach(key => node.setAttribute(key, String(attributes[key])));
      return node;
    };
    const heads = layout.columns.map(column => "<div class=\"st-msc-lane" + (column.kind === "attacker" ? " st-msc-attacker" : "") + "\" style=\"left:"
      + (column.x - layout.width/2 + 8) + "px;width:" + (layout.width - 16) + "px\" title=\"" + MathRenderer.escape(column.label)
      + "\"><i class=\"fas " + (column.kind === "attacker" ? "fa-user-secret" : "fa-user") + "\"></i> <span>" + this.laneName(column) + "</span></div>");
    const ends = row => {
      const from = row.kind === "comm" || row.step.kind === "out" ? row.x : layout.attackerX;
      return { from: from, to: row.kind === "comm" ? row.x2 : row.step.kind === "out" ? layout.attackerX : row.x };
    };
    const labels = layout.rows.map((row, i) => {
      const current = row.step;
      const on = step === i ? " st-on" : "";
      const title = "\" title=\"" + MathRenderer.escape(current.text || "") + "\">";
      if (row.kind === "arrow" || row.kind === "comm") {
        const { from, to } = ends(row);
        return "<div class=\"st-msc-label" + on + "\" data-index=\"" + i + "\" style=\"left:" + (Math.min(from, to) + 8) + "px;width:" + (Math.abs(to - from) - 16) + "px" + title
          + this.printed(current, i) + "</div>";
      }
      if (row.kind === "box") {
        const kind = current.goal ? "st-goal" : current.kind === "event" || current.kind === "event-executed" ? "st-event"
          : current.kind === "insert" || current.kind === "get" ? "st-table" : current.kind === "new" ? "st-new" : "";
        return "<div class=\"st-msc-box " + kind + on + "\" data-index=\"" + i + "\" style=\"left:" + (row.x - layout.width/2 + 10) + "px;width:" + (layout.width - 20) + "px" + title
          + this.printed(current, i) + "</div>";
      }
      return "<div class=\"st-msc-note" + on + "\" data-index=\"" + i + "\" style=\"left:" + size.left + "px;width:" + (layout.chartWidth - size.left - 20) + "px\">"
        + MathRenderer.escape(current.label || current.text || "") + "</div>";
    });

    const $scroll = $("<div class=\"st-msc-scroll\"></div>");
    $scroll.append($("<div class=\"st-msc-heads\"></div>").css({ width: layout.chartWidth, height: size.headHeight }).html(heads.join("")));
    const $wrap = $("<div class=\"st-msc-wrap\"></div>").css({ width: layout.chartWidth }).html(labels.join(""));
    $scroll.append($wrap);
    $host.empty().append($scroll);
    const $labels = $wrap.children();
    layout = TraceView.layout(view, available, $labels.toArray().map(label => label.offsetHeight));
    layout.rows.forEach((row, i) => $labels.eq(i).css("top", row.y + (row.kind === "box" ? 5 : row.kind === "note" ? 4 : 2)));

    const svg = element("svg", { class: "st-msc", width: layout.chartWidth, height: layout.chartHeight });
    const marker = element("marker", { id: "st-msc-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
    marker.appendChild(element("path", { d: "M 0 0 L 10 5 L 0 10 z", class: "st-msc-head" }));
    const defs = element("defs", {});
    defs.appendChild(marker);
    svg.appendChild(defs);
    layout.columns.forEach(column => svg.appendChild(element("line", { x1: column.x, y1: 0, x2: column.x, y2: layout.chartHeight - 6, class: "st-msc-life" + (column.kind === "attacker" ? " st-msc-attacker" : "") })));
    layout.rows.forEach((row, i) => {
      svg.appendChild(element("rect", { x: 0, y: row.y, width: layout.chartWidth, height: row.height, class: "st-msc-row" + (step === i ? " st-on" : ""), "data-index": i }));
      if (row.kind === "arrow" || row.kind === "comm") {
        const { from, to } = ends(row);
        const y = row.y + row.height - 13;
        svg.appendChild(element("line", { x1: from, y1: y, x2: to + (to > from ? -4 : 4), y2: y, class: "st-msc-message" + (row.step.goal ? " st-goal" : ""), "marker-end": "url(#st-msc-arrow)" }));
      }
    });
    $wrap.css({ height: layout.chartHeight }).prepend(svg);
    $wrap.on("click", "[data-index]", event => this.onPick(Number($(event.currentTarget).attr("data-index"))));
  }

  /**
   * Selects a step of the trace drawn, without drawing it again.
   *
   * @param {jQuery} $host The element of the chart.
   * @param {number|null} step The step, or null.
   */
  select($host: JQuery, step: number) {
    $host.find(".st-on").removeClass("st-on");
    if (step !== null && step !== undefined) {
      $host.find("[data-index=\"" + step + "\"]").addClass("st-on");
      this.reveal($host, step);
    }
  }

  /**
   * Scrolls the element that holds the chart, if needed, so that a step
   * shows below the names of the processes.
   *
   * @param {jQuery} $host The element of the chart.
   * @param {number|null} step The step, or null.
   */
  reveal($host: JQuery, step: number) {
    const row = step !== null && step !== undefined ? $host.find("rect[data-index=\"" + step + "\"]")[0] : null;
    let scroller = $host[0] ? $host[0].parentElement : null;
    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    if (!row || !scroller) {
      return;
    }
    const heads = $host.find(".st-msc-heads")[0];
    const box = row.getBoundingClientRect();
    const frame = scroller.getBoundingClientRect();
    const top = heads ? heads.getBoundingClientRect().bottom : frame.top;
    if (box.top < top) {
      scroller.scrollTop -= top - box.top + 8;
    } else if (box.bottom > frame.bottom) {
      scroller.scrollTop += box.bottom - frame.bottom + 8;
    }
  }
}
// ----------------------------------------------------------------
