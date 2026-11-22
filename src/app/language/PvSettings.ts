/**
 * The "set name = value." parameters of ProVerif 2.05, their values and their
 * defaults.
 *
 * Follows interpret_setting (pitsyntax.ml) and common_parameters (param.ml),
 * including their error messages. The defaults are those of param.ml for a
 * batch run (standard output is not a terminal), which is how the studio runs
 * ProVerif.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvSettings {
  /**
   * Specifications: kind, allowed values, default, group and a short
   * description (in English, translated where it shows).
   *
   * Kinds: 'bool' (true, false, yes, no), 'enum' (values), 'int',
   * 'intOrNone', 'string' (any identifier or string), 'deprecated'.
   *
   * @type {Object}
   */
  static SPECS = {
      attacker: { kind: "enum", values: ["active", "passive"], def: "active", group: "Attacker model", text: I18n.mark("An active attacker reads, writes and blocks public channels; a passive one only listens.") }
    , keyCompromise: { kind: "enum", values: ["none", "approx", "strict"], def: "none", group: "Attacker model", text: I18n.mark("Compromise of session keys of other sessions.") }
    , privateCommOnPublicTerms: { kind: "bool", def: "true", group: "Attacker model", text: I18n.mark("Allow private communications on public terms.") }
    , allowDiffPatterns: { kind: "bool", def: "false", group: "Syntax", text: I18n.mark("Allow choice/diff inside patterns.") }
    , preciseActions: { kind: "enum", values: ["false", "true", "no", "yes", "trueWithoutArgsInNames", "yesWithoutArgsInNames"], def: "false", group: "Precision", text: I18n.mark("Make every input, get and let...suchthat precise.") }
    , ignoreTypes: { kind: "enum", values: ["true", "all", "yes", "false", "none", "attacker", "no"], def: "true", group: "Precision", text: I18n.mark("Ignore types during verification (types are still checked when parsing).") }
    , movenew: { kind: "bool", def: "false", group: "Precision", text: I18n.mark("Move restrictions downwards before translating to clauses.") }
    , movelet: { kind: "bool", def: "true", group: "Precision", text: I18n.mark("Move let bindings downwards before translating to clauses.") }
    , eqInNames: { kind: "bool", def: "false", group: "Precision", text: I18n.mark("Include terms of the equational theory in the arguments of names.") }
    , preciseLetExpand: { kind: "bool", def: "true", group: "Precision", text: I18n.mark("Expand let terms precisely.") }
    , inductionLemmas: { kind: "bool", def: "false", group: "Lemmas", text: I18n.mark("Prove lemmas by induction by default.") }
    , inductionQueries: { kind: "bool", def: "false", group: "Lemmas", text: I18n.mark("Prove queries by induction by default.") }
    , removeEventsForLemma: { kind: "bool", def: "false", group: "Lemmas", text: I18n.mark("Remove events that are only used by lemmas.") }
    , saturationApplication: { kind: "enum", values: ["instantiate", "full", "discard", "none"], def: "instantiate", group: "Lemmas", text: I18n.mark("How lemmas are applied during saturation.") }
    , verificationApplication: { kind: "enum", values: ["full", "instantiate", "discard", "none"], def: "full", group: "Lemmas", text: I18n.mark("How lemmas are applied during verification.") }
    , verboseLemmas: { kind: "bool", def: "false", group: "Lemmas", text: I18n.mark("Display the application of lemmas.") }
    , nounifIgnoreAFewTimes: { kind: "enum", values: ["none", "auto", "all"], def: "none", group: "Resolution", text: I18n.mark("Ignore nounif declarations a few times.") }
    , nounifIgnoreNtimes: { kind: "int", def: "1", min: 1, group: "Resolution", text: I18n.mark("How many times nounif declarations are ignored.") }
    , selFun: { kind: "enum", values: ["TermMaxsize", "Term", "NounifsetMaxsize", "Nounifset"], def: "TermMaxsize", group: "Resolution", text: I18n.mark("Selection function of the resolution.") }
    , stopTerm: { kind: "bool", def: "true", group: "Resolution", text: I18n.mark("Stop when the resolution may not terminate.") }
    , redundancyElim: { kind: "enum", values: ["best", "simple", "no"], def: "best", group: "Resolution", text: I18n.mark("Elimination of redundant clauses.") }
    , redundantHypElim: { kind: "enum", values: ["beginOnly", "true", "yes", "false", "no"], def: "beginOnly", group: "Resolution", text: I18n.mark("Elimination of redundant hypotheses.") }
    , maxDepth: { kind: "intOrNone", def: "none", group: "Resolution", text: I18n.mark("Maximum depth of terms in clauses (an approximation).") }
    , maxHyp: { kind: "intOrNone", def: "none", group: "Resolution", text: I18n.mark("Maximum number of hypotheses of clauses (an approximation).") }
    , maxInequalityChain: { kind: "intOrNone", def: "none", group: "Resolution", text: I18n.mark("Maximum length of chains of inequalities.") }
    , simpEqFinal: { kind: "bool", def: "true", group: "Resolution", text: I18n.mark("Simplify equalities at the end of saturation.") }
    , simpEqAll: { kind: "bool", def: "false", group: "Resolution", text: I18n.mark("Check that all terms of clauses are in normal form.") }
    , eqTreatment: { kind: "enum", values: ["convLin", "nonProved"], def: "convLin", group: "Resolution", text: I18n.mark("Treatment of equations.") }
    , symbOrder: { kind: "string", def: "", group: "Resolution", text: I18n.mark("Ordering of function symbols for the termination of equations.") }
    , predicatesImplementable: { kind: "enum", values: ["check", "nocheck"], def: "check", group: "Resolution", text: I18n.mark("Check that predicates can be implemented.") }
    , cleanupThreshold: { kind: "int", def: "10", min: 0, max: 100, group: "Resolution", text: I18n.mark("Threshold for cleaning up the clause database (percent).") }
    , unifyTrieTermMaxDepth: { kind: "int", def: "5", min: 1, group: "Resolution", text: I18n.mark("Maximum depth of the unification index.") }
    , reconstructTrace: { kind: "intOrBool", def: "4", group: "Attack reconstruction", text: I18n.mark("Reconstruct attack traces (yes, no, or the number of attempts).") }
    , traceBacktracking: { kind: "bool", def: "true", group: "Attack reconstruction", text: I18n.mark("Backtrack when reconstructing traces.") }
    , unifyDerivation: { kind: "bool", def: "true", group: "Attack reconstruction", text: I18n.mark("Unify derivations to help trace reconstruction.") }
    , reconstructDerivation: { kind: "bool", def: "true", group: "Attack reconstruction", text: I18n.mark("Reconstruct derivations.") }
    , simplifyDerivation: { kind: "bool", def: "true", group: "Attack reconstruction", text: I18n.mark("Simplify derivations.") }
    , explainDerivation: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Explain derivations in English.") }
    , displayDerivation: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Display derivations.") }
    , abbreviateDerivation: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Abbreviate names in derivations.") }
    , traceDisplay: { kind: "enum", values: ["short", "long", "none"], def: "short", group: "Display", text: I18n.mark("How attack traces are displayed.") }
    , verboseClauses: { kind: "enum", values: ["none", "short", "explained"], def: "none", group: "Display", text: I18n.mark("Display the generated clauses.") }
    , removeUselessClausesBeforeDisplay: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Remove subsumed clauses before displaying them.") }
    , abbreviateClauses: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Abbreviate clauses when displaying them.") }
    , color: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Use ANSI colours in the output.") }
    , verboseBase: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Display the clause database.") }
    , verboseStatistics: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Display statistics while saturating.") }
    , verboseGoalReachable: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Display \"goal reachable\" clauses.") }
    , verboseRules: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Display rules.") }
    , verboseRedundant: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Display redundant clauses.") }
    , verboseCompleted: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Display completed clauses.") }
    , verboseEq: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Display information on equations.") }
    , verboseTerm: { kind: "bool", def: "true", group: "Display", text: I18n.mark("Display termination warnings.") }
    , verboseDestructors: { kind: "bool", def: "false", group: "Display", text: I18n.mark("Display information on destructors.") }
    , simplifyProcess: { kind: "enum", values: ["true", "yes", "false", "no", "interactive"], def: "true", group: "Process simplification", text: I18n.mark("Simplify biprocesses before proving equivalences.") }
    , rejectChoiceTrueFalse: { kind: "bool", def: "true", group: "Process simplification", text: I18n.mark("Reject simplified processes containing choice[true, false].") }
    , rejectNoSimplif: { kind: "bool", def: "true", group: "Process simplification", text: I18n.mark("Reject processes that cannot be simplified.") }
    , expandSimplifyIfCst: { kind: "bool", def: "true", group: "Process simplification", text: I18n.mark("Simplify tests on constants when expanding terms.") }
    , expandIfTermsToTerms: { kind: "deprecated", def: "", group: "Process simplification", text: I18n.mark("Deprecated.") }
    , interactiveSwapping: { kind: "bool", def: "false", group: "Process simplification", text: I18n.mark("Choose swappings of synchronisations interactively.") }
    , swapping: { kind: "string", def: "", group: "Process simplification", text: I18n.mark("Swapping of synchronisations, e.g. \"tag1 -> tag2\".") }
    , feature: { kind: "bool", def: "true", group: "Features", text: I18n.mark("Record features of clauses.") }
    , featureFuns: { kind: "bool", def: "true", group: "Features", text: I18n.mark("Record function symbols as features.") }
    , featureNames: { kind: "bool", def: "false", group: "Features", text: I18n.mark("Record names as features.") }
    , featurePredicates: { kind: "bool", def: "true", group: "Features", text: I18n.mark("Record predicates as features.") }
    , featureEvents: { kind: "bool", def: "true", group: "Features", text: I18n.mark("Record events as features.") }
    , featureTables: { kind: "bool", def: "true", group: "Features", text: I18n.mark("Record tables as features.") }
    , featureDepth: { kind: "bool", def: "false", group: "Features", text: I18n.mark("Record the depth of terms as a feature.") }
    , featureWidth: { kind: "bool", def: "false", group: "Features", text: I18n.mark("Record the width of terms as a feature.") }
  };

  /**
   * Order of the groups in the settings panel.
   *
   * @type {Array}
   */
  static GROUPS = [
      I18n.mark("Attacker model"), I18n.mark("Syntax"), I18n.mark("Precision"), I18n.mark("Lemmas"), I18n.mark("Attack reconstruction")
    , I18n.mark("Resolution"), I18n.mark("Process simplification"), I18n.mark("Display"), I18n.mark("Features")
  ];

  /**
   * Gives the specification of a setting.
   *
   * @param {string} name The setting name.
   * @return {Object} The specification, or undefined.
   */
  static get(name: string) {
    return Object.prototype.hasOwnProperty.call(PvSettings.SPECS, name) ? PvSettings.SPECS[name] : undefined;
  }

  /**
   * Gives the default value of a setting, as written in a "set" declaration.
   *
   * @param {string} name The setting name.
   * @return {Object} The default value text ('' when there is none).
   */
  static defaultValue(name: string) {
    const s = PvSettings.get(name);
    return s ? s.def : "";
  }

  /**
   * Tells whether a value means the default of a setting (yes/true and
   * no/false are equivalent).
   *
   * @param {string} name The setting name.
   * @param {string} value The value text.
   * @return {boolean} True when the declaration could be omitted.
   */
  static isDefault(name: string, value: string): boolean {
    const s = PvSettings.get(name);
    if (!s || s.def === "") {
      return false;
    }
    return PvSettings.normalize(name, String(value)) === PvSettings.normalize(name, s.def);
  }

  /**
   * Normalizes a value so that synonyms compare equal.
   *
   * @param {string} name The setting name.
   * @param {string} value The value text.
   * @return {Object} The canonical value.
   */
  static normalize(name: string, value: string) {
    const s = PvSettings.get(name);
    const v = String(value);
    
    if (!s) {
      return v;
    }
    
    switch (name) {
      case "ignoreTypes":
        return ["true", "all", "yes"].includes(v) ? "true" : "false";
        
      case "preciseActions":
        return v === "yes" ? "true" :
        v === "no" ? "false" :
        v === "yesWithoutArgsInNames" ? "trueWithoutArgsInNames" : v;
        
      case "simplifyProcess":
      case "redundantHypElim":
        return v === "yes" ? "true" : v === "no" ? "false" : v;
        
      default:
        if (s.kind === "bool" || s.kind === "intOrBool") {
          return v === "yes" ? "true" : v === "no" ? "false" : v;
        }
        return v;
    }
  }

  /**
   * Checks a setting the way ProVerif does.
   *
   * @param {string} name The setting name.
   * @param {string} value {kind: 'ident' | 'string' | 'int', value}.
   * @return {null} Null when it is accepted, else {severity, message}.
   */
  static validate(name: string, value: any) {
    const v = value.value;
    const isInt = value.kind === "int";
    const text = String(v);
    const bad = { severity: "error", message: "Bad parameter " + name + "=" + text + "." };
    const s = PvSettings.get(name);
    if (!s) {
      return bad;
    }
    switch (s.kind) {
      case "bool":
        if (!isInt && ["true", "false", "yes", "no"].includes(text)) {
          return null;
        }
        return { severity: "error", message: "Unexpected value for parameter " + name + "=" + text };
        
      case "enum":
        return !isInt && s.values.includes(text) ? null : bad;
        
      case "int":
        if (!isInt) {
          return bad;
        }
        
        if (name === "nounifIgnoreNtimes" && v < 1) {
          return { severity: "error", message: "The setting nounifIgnoreNtimes must be set with an integer greater or equal to 1." };
        }
        
        if (name === "cleanupThreshold" && (v < 0 || v > 100)) {
          return { severity: "error", message: "The cleanupThreshold value should be between 0 and 100" };
        }
        
        if (name === "unifyTrieTermMaxDepth" && v < 1) {
          return { severity: "error", message: "The unifyTrieTermMaxDepth value should be at least 1" };
        }
        return null;
        
      case "intOrNone":
        return isInt || text === "none" ? null : bad;
        
      case "intOrBool":
        if (isInt) {
          return v < 0 ? { severity: "error", message: "Value of reconstructTrace should be a positive integer or zero, yes, true, no, false" } : null;
        }
        return ["yes", "true", "no", "false"].includes(text) ? null : bad;
        
      case "string":
        return isInt ? bad : null;
        
      case "deprecated":
        return { severity: "warning", message: "Setting " + name + " is deprecated" };
        
      default:
        return bad;
    }
  }

  /**
   * Lists the values a setting may take, for a drop-down.
   *
   * @param {string} name The setting name.
   * @return {Array} The values (empty for free text).
   */
  static choices(name: string) {
    const s = PvSettings.get(name);
    
    if (!s) {
      return [];
    }
    
    switch (s.kind) {
      case "bool":
        return ["true", "false"];
        
      case "enum":
        return s.values;
        
      case "intOrBool":
        return ["true", "false", "0", "1", "2", "4", "8"];
        
      case "intOrNone":
        return ["none", "1", "2", "3", "4", "5"];
        
      default:
        return [];
    }
  }
}
// ----------------------------------------------------------------
