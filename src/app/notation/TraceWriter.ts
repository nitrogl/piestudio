/**
 * Writes the terms of an attack trace in LaTeX: a name of the trace is that
 * of the model, in its notation, with the mark that tells it apart (a prime
 * or a number); a name that the attacker makes is written as it is; the name
 * of a message sent before is a tilde M. A line may break after the commas
 * of the term.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class TraceWriter extends LatexWriter {
  /**
   * Writes a term with its binding level.
   *
   * @param {Object} t The term.
   * @return {Object} {tex, level}.
   */
  termLevel(t: any) {
    if (t.kind === "Ident" && t.trace) {
      const name = t.trace;
      const tex = name.shortcut ? "\\tilde{M}" : name.notation ? this.ident(name.base) : this.encode(name.base, this.conv.get("varStyle"), true);
      return { tex: TraceWriter.marked(tex, name.mark), level: LatexWriter.ATOM };
    }
    return super.termLevel(t);
  }

  /**
   * Writes a name with its mark.
   *
   * @param {string} tex The name, in LaTeX.
   * @param {string} mark Nothing, a prime or a number.
   * @return {string} The LaTeX.
   */
  static marked(tex: string, mark: string): string {
    return mark === "" ? tex : mark === "'" ? "{" + tex + "}'" : "{" + tex + "}|_{" + mark + "}";
  }

  /**
   * Lets a formula break after the commas that are outside braces, where
   * KaTeX may start a new line.
   *
   * @param {string} tex The formula.
   * @return {string} The formula.
   */
  static breakable(tex: string): string {
    let depth = 0;
    let out = "";
    for (let i = 0; i < tex.length; i++) {
      const c = tex[i];
      if (c === "\\") {
        out += c + (tex[i + 1] || "");
        i++;
        continue;
      }
      if (c === "{") {
        depth++;
      } else if (c === "}") {
        depth--;
      }
      out += c;
      if (c === "," && depth === 0) {
        out += "\\allowbreak ";
      }
    }
    return out;
  }
}
// ----------------------------------------------------------------
