/**
 * Writes the report of a verification: one HTML page, with
 * its own style, holding the model, the result of every goal, the steps of
 * every attack trace and the figures of the run.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class ReportWriter {
  /**
   * Writes the report.
   *
   * @param {Object} params What to report.
   * @param {string} params.fileName The name of the model.
   * @param {string} params.text The model.
   * @param {Object} params.run The run of the Verifier.
   * @param {Array<Object>} params.libraries The libraries, {name, text}.
   * @return {string} The HTML page.
   */
  static write(params?: { fileName?: string; text?: string; run?: any; libraries?: any[] }): string {
    const run = params.run;
    const escape = text => String(text === undefined || text === null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const rows = run.results.map((item, i) => "<tr><td class=\"v-" + escape(item.result.verdict).replace(/ .*/, "") + "\">" + escape(OutputParser.verdictName(item.result.verdict))
      + "</td><td><code>" + escape(item.result.goal) + "</code></td><td>" + escape(item.fileName || params.fileName) + "</td><td>"
      + (item.result.trace ? "<a href=\"#trace" + i + "\">" + escape(I18n.t("attack")) + "</a>" : "") + "</td></tr>").join("\n");
    const traces = run.results.map((item, i) => {
      if (!item.result.trace) {
        return "";
      }
      const steps = item.result.trace.steps.map(step => "<li><code>" + escape(TraceMapper.stepLabel(step)) + "</code></li>").join("\n");
      return "<h3 id=\"trace" + i + "\">" + I18n.format(escape(I18n.t("Attack on {goal}")), { goal: "<code>" + escape(item.result.goal) + "</code>" }) + "</h3>\n<ol>\n" + steps + "\n</ol>";
    }).join("\n");
    const libraries = (params.libraries || []).map(library => "<h3>" + escape(I18n.t("Library {name}", { name: library.name })) + "</h3>\n<pre>" + escape(library.text) + "</pre>").join("\n");
    return [
        "<!DOCTYPE html>"
      , "<html lang=\"" + escape(I18n.language().replace(/_/g, "-")) + "\"><head><meta charset=\"utf-8\"><title>" + escape(I18n.t("{file}: verification report", { file: params.fileName })) + "</title>"
      , "<style>body{font:14px/1.5 system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#1d2630}"
        + "table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #d8dee5;padding:.35rem .5rem;text-align:left}"
        + "pre{background:#f4f6f9;padding:1rem;overflow:auto}.v-true{color:#1f883d;font-weight:700}.v-false{color:#cf222e;font-weight:700}"
        + ".v-cannot{color:#9a6700;font-weight:700}code{font-size:.92em}footer{margin-top:2rem;color:#5f6b78;font-size:.85em}</style></head><body>"
      , "<h1>" + escape(params.fileName) + "</h1>"
      , "<p>" + escape(I18n.t("Verified with ProVerif 2.05 in PieStudio, {date}.", { date: new Date().toISOString().slice(0, 16).replace("T", " ") })) + " "
        + escape(run.message) + " " + escape(I18n.t("Time: {seconds} s, memory: {size} MB.", { seconds: ((run.ms || 0)/1000).toFixed(1), size: Math.round((run.memory || 0)/1048576) })) + "</p>"
      , "<h2>" + escape(I18n.t("Security goals")) + "</h2>"
      , "<table><thead><tr><th>" + escape(I18n.t("Result")) + "</th><th>" + escape(I18n.t("Goal")) + "</th><th>" + escape(I18n.t("File")) + "</th><th></th></tr></thead><tbody>", rows, "</tbody></table>"
      , traces ? "<h2>" + escape(I18n.t("Attack traces")) + "</h2>\n" + traces : ""
      , "<h2>" + escape(I18n.t("Model")) + "</h2>"
      , "<pre>" + escape(params.text) + "</pre>"
      , libraries
      , "<footer>" + escape(I18n.t("Written by PieStudio.")) + "</footer>"
      , "</body></html>"
    ].join("\n") + "\n";
  }
}
// ----------------------------------------------------------------
