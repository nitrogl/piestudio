/**
 * Lexical tokens of the ProVerif typed language.
 *
 * Keeps the token type names of pitparser.mly (IDENT, INT, LPAREN, ...), so
 * that the parser reads like the yacc grammar it mirrors.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvToken {
  type: string;
  value: string;
  start: number;
  end: number;

  /**
   * Builds a token.
   *
   * @param {string} type The token type (for example 'IDENT' or 'SEMI').
   * @param {string} value The identifier text, the integer value, the string
   *   contents or the symbol.
   * @param {number} start Offset of the first character.
   * @param {number} end Offset after the last character.
   */
  constructor(type: string, value: string, start: number, end: number) {
    this.type = type;
    this.value = value;
    this.start = start;
    this.end = end;
  }

  /**
   * Describes myself for an error message, as in "unexpected identifier 'x'".
   *
   * @return {Object} A short human readable description.
   */
  describe() {
    switch (this.type) {
      case "EOF":
        return "end of file";
        
      case "IDENT":
        return "identifier '" + this.value + "'";
        
      case "INT":
        return "integer " + this.value;
        
      case "FLOAT":
        return "number " + this.value;
        
      case "STRING":
        return "string \"" + this.value + "\"";
        
      default: {
        const text = this.value === undefined || this.value === null ? PvToken.TEXT[this.type] : this.value;
        return "'" + (text === undefined || text === null ? this.type : text) + "'";
      }
    }
  }

  /**
   * Spells a list of expected token types, as in "'(' or ','".
   *
   * @param {Array} types The expected token types.
   * @return {Array} The list joined with commas and "or".
   */
  static expectedText(types: any[]) {
    const uniq = [...new Set(types.map(t => (PvToken.TEXT[t] ? "'" + PvToken.TEXT[t] + "'" : t)))];
    if (uniq.length === 1) {
      return uniq[0];
    }
    
    return uniq.slice(0, -1).join(", ") + " or " + uniq[uniq.length - 1];
  }

  /**
   * Keywords of pitlexer.mll (2.05) and their token types.
   *
   * @type {Map}
   */
  static KEYWORDS: Map<any, any> = new Map([
        ["type", "TYPE"]
      , ["set", "SET"]
      , ["forall", "FORALL"]
      , ["fail", "FAIL"]
      , ["or", "ORTEXT"]
      , ["const", "CONST"]
      , ["letfun", "LETFUN"]
      , ["channel", "CHANNEL"]
      , ["def", "DEFINE"]
      , ["expand", "EXPAND"]
      , ["yield", "YIELD"]
      , ["proba", "PROBA"]
      , ["letproba", "LETPROBA"]
      , ["proof", "PROOF"]
      , ["implementation", "IMPLEMENTATION"]
      , ["foreach", "FOREACH"]
      , ["do", "DO"]
      , ["secret", "SECRET"]
      , ["public_vars", "PUBLICVARS"]
      , ["table", "TABLE"]
      , ["insert", "INSERT"]
      , ["get", "GET"]
      , ["param", "PARAM"]
      , ["new", "NEW"]
      , ["out", "OUT"]
      , ["in", "IN"]
      , ["if", "IF"]
      , ["then", "THEN"]
      , ["else", "ELSE"]
      , ["fun", "FUN"]
      , ["equation", "EQUATION"]
      , ["reduc", "REDUCTION"]
      , ["pred", "PREDICATE"]
      , ["process", "PROCESS"]
      , ["let", "LET"]
      , ["query", "QUERY"]
      , ["putbegin", "PUTBEGIN"]
      , ["noninterf", "NONINTERF"]
      , ["event", "EVENT"]
      , ["not", "NOT"]
      , ["elimtrue", "ELIMTRUE"]
      , ["free", "FREE"]
      , ["clauses", "CLAUSES"]
      , ["suchthat", "SUCHTHAT"]
      , ["nounif", "NOUNIF"]
      , ["select", "SELECT"]
      , ["noselect", "NOUNIF"]
      , ["phase", "PHASE"]
      , ["sync", "BARRIER"]
      , ["among", "AMONG"]
      , ["weaksecret", "WEAKSECRET"]
      , ["equivalence", "EQUIVALENCE"]
      , ["otherwise", "OTHERWISE"]
      , ["choice", "CHOICE"]
      , ["diff", "CHOICE"]
      , ["lemma", "LEMMA"]
      , ["axiom", "AXIOM"]
      , ["restriction", "RESTRICTION"]
      , ["for", "FOR"]
  ]);

  /**
   * Spelling of the symbol tokens, for error messages.
   *
   * @type {Object}
   */
  static TEXT = {
        COMMA: ","
      , LPAREN: "("
      , RPAREN: ")"
      , LBRACKET: "["
      , RBRACKET: "]"
      , LBRACE: "{"
      , RBRACE: "}"
      , BAR: "|"
      , OR: "||"
      , WEDGE: "&&"
      , SEMI: ";"
      , REPL: "!"
      , EQUAL: "="
      , SLASH: "/"
      , DOT: "."
      , STAR: "*"
      , COLON: ":"
      , PLUS: "+"
      , MINUS: "-"
      , POWER: "^"
      , RED: "->"
      , LEQ: "<="
      , EQUIV: "<->"
      , EQUIVEQ: "<=>"
      , DIFF: "<>"
      , BEFORE: "==>"
      , LESS: "<"
      , GEQ: ">="
      , GREATER: ">"
      , LEFTARROW: "<-"
      , RANDOM: "<-R"
      , INJEVENT: "inj-event"
      , UNDERSCORE: "_"
      , AT: "@"
      , COUNT: "#"
      , OPTIMIF: "optim-if"
      , ISCST: "is-cst"
      , EOF: "end of file"
      , IDENT: "identifier"
      , INT: "integer"
      , FLOAT: "number"
      , STRING: "string"
      , PROJECTION: "projection"
      , CHOICE: "choice"
      , NOUNIF: "nounif"
  };

  static {
    // The text of the tokens that are keywords
    for (const [keyword, token] of PvToken.KEYWORDS) {
      if (!(token in PvToken.TEXT)) {
        PvToken.TEXT[token] = keyword;
      }
    }
  }
}
// ----------------------------------------------------------------

