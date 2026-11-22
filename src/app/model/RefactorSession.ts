/**
 * A refactoring: renaming a name within a part of the model chosen first.
 *
 * The occurrences are fixed when the session starts, from the analysis of
 * the model as it is: what the user types afterwards is only a candidate
 * name, applied once, when the user accepts it. A name typed halfway that
 * happens to be another variable never changes anything. Before applying,
 * the candidate is checked: it must not capture other names, nor be
 * captured by them, nor make the model wrong.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class RefactorSession {
  analysis: Analysis;
  symbol: any;
  range: any;
  occurrences: { start: any; end: any; included: boolean; }[];

  /**
   * @param {Analysis} analysis The analysis of the model, as it is.
   * @param {Object} symbol The symbol to rename (from the checker).
   * @param {Object|null} range The part of the model, {start, end}, or
   *   null for all of it.
   */
  constructor(analysis: Analysis, symbol: any, range: any) {
    this.analysis = analysis;
    this.symbol = symbol;
    this.range = range;
    this.occurrences = analysis.occurrencesOf(symbol.id)
      .filter(occurrence => !range || (occurrence.start >= range.start && occurrence.end <= range.end))
      .map(occurrence => ({ start: occurrence.start, end: occurrence.end, included: true }))
      .sort((a, b) => a.start - b.start);
  }

  /**
   * Lists the names used in a part of the model, the most used first.
   *
   * @param {Analysis} analysis The analysis of the model.
   * @param {Object|null} range The part, {start, end}, or null for all.
   * @return {Array<Object>} The names, {symbol, count}.
   */
  static candidates(analysis: Analysis, range: any) {
    const counts = new Map();
    analysis.check.occurrences.forEach(occurrence => {
      const symbol = analysis.check.symbols.get(occurrence.sym);
      if (!symbol || symbol.builtin || (range && (occurrence.start < range.start || occurrence.end > range.end))) {
        return;
      }
      const entry = counts.get(occurrence.sym) || { symbol: symbol, count: 0 };
      entry.count++;
      counts.set(occurrence.sym, entry);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count || a.symbol.name.localeCompare(b.symbol.name));
  }

  /**
   * @return {Array<Object>} The occurrences that will be renamed.
   */
  included() {
    return this.occurrences.filter(occurrence => occurrence.included);
  }

  /**
   * Includes or leaves out the occurrence at an offset.
   *
   * @param {number} offset An offset of the model.
   * @return {boolean} True when an occurrence is there.
   */
  toggle(offset: number): boolean {
    const occurrence = this.occurrences.find(item => item.start <= offset && offset <= item.end);
    if (occurrence) {
      occurrence.included = !occurrence.included;
    }
    return !!occurrence;
  }

  /**
   * Includes every occurrence, or none.
   *
   * @param {boolean} included True to include them all.
   */
  setAll(included: boolean) {
    this.occurrences.forEach(occurrence => {
      occurrence.included = included;
    });
  }

  /**
   * Gives the text with the new name.
   *
   * @param {string} name The new name.
   * @return {string} The text.
   */
  apply(name: string): string {
    let text = this.analysis.text;
    this.included().slice().reverse().forEach(occurrence => {
      text = text.slice(0, occurrence.start) + name + text.slice(occurrence.end);
    });
    return text;
  }

  /**
   * Moves an offset of the model to the text with the new name.
   *
   * @param {number} offset An offset outside the renamed occurrences.
   * @param {string} name The new name.
   * @return {number} The offset in the new text.
   */
  shift(offset: number, name: string): number {
    const delta = name.length - this.symbol.name.length;
    return offset + delta*this.included().filter(occurrence => occurrence.end <= offset).length;
  }

  /**
   * Checks a new name before it is applied.
   *
   * @param {string} name The new name.
   * @return {Object} {ok, problems: [string], lines: [{line, before,
   *   after}]} where lines previews the changed lines.
   */
  check(name: string) {
    const problems = [];
    const invalid = ModelEditor.validIdentifier(name);
    if (invalid) {
      return { ok: false, problems: [invalid], lines: [] };
    }
    if (this.included().length === 0) {
      return { ok: false, problems: [I18n.t("No occurrence is chosen.")], lines: [] };
    }
    if (name === this.symbol.name) {
      return { ok: false, problems: [I18n.t("The name is the same.")], lines: [] };
    }
    const before = this.analysis;
    const text = this.apply(name);
    const after = Analysis.of(text);
    // The renamed occurrences must still name one and the same thing
    const renamed = new Set();
    let offset = 0;
    this.included().forEach(occurrence => {
      const start = occurrence.start + offset;
      offset += name.length - (occurrence.end - occurrence.start);
      const hit = after.symbolAt(start);
      renamed.add(hit && hit.symbol ? hit.symbol.id : null);
    });
    if (renamed.size !== 1 || renamed.has(null)) {
      problems.push(I18n.t("With this name, the renamed occurrences would not all refer to the same declaration."));
    }
    // The names that are already called so must keep their meaning
    const target = [...renamed][0];
    const pattern = new RegExp("(^|[^A-Za-z0-9_'])" + name.replace(/'/g, "\\'") + "(?![A-Za-z0-9_'])", "g");
    let match;
    while ((match = pattern.exec(before.text)) !== null) {
      const start = match.index + match[1].length;
      const hit = before.symbolAt(start);
      const moved = after.symbolAt(this.shift(start, name));
      if (hit && hit.symbol && moved && moved.symbol && moved.symbol.id === target) {
        problems.push(I18n.t("The name {name} is already used on line {line}: it would refer to the renamed declaration.", { name: name, line: before.lineIndex.pos(start).line }));
        break;
      }
    }
    // A name already used in the part, or declared for the whole model,
    // would hide the renamed one or be hidden by it
    const taken = RefactorSession.candidates(before, this.range).find(candidate => candidate.symbol.name === name && candidate.symbol.id !== this.symbol.id);
    const global = before.check.global ? before.check.global.get(name) : null;
    if (taken || (global && !global.builtin)) {
      problems.push(taken ? I18n.t("The name {name} is already used in the selection: the renamed declaration would hide it, or be hidden by it.", { name: name })
        : I18n.t("The name {name} is already used in the model: the renamed declaration would hide it, or be hidden by it.", { name: name }));
    }
    const errors = list => list.filter(d => d.severity === "error").length;
    if (errors(after.diagnostics) > errors(before.diagnostics)) {
      const fresh = after.diagnostics.find(d => d.severity === "error");
      problems.push(I18n.t("The model would have new errors: {message} (line {line}).", { message: fresh.message, line: after.lineIndex.pos(fresh.start).line }));
    }
    return { ok: problems.length === 0, problems: problems, lines: this.preview(text) };
  }

  /**
   * Lists the lines that change, before and after (a name never spans
   * lines, so they keep their numbers).
   *
   * @param {string} text The text with the new name.
   * @return {Array<Object>} The lines, {line, before, after}.
   */
  preview(text: string) {
    const before = this.analysis.text.split("\n");
    const after = text.split("\n");
    const lines = [...new Set(this.included().map(occurrence => this.analysis.lineIndex.pos(occurrence.start).line))];
    return lines.map(line => ({ line: line, before: before[line - 1], after: after[line - 1] }));
  }
}
// ----------------------------------------------------------------
