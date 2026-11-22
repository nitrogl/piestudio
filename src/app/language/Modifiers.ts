/**
 * The modifiers ([private], [data], [precise], ...) that each element of a
 * model can carry.
 *
 * The pop-up opened by a double click on an element lists the modifiers that
 * apply to it, with what they mean. The options of goals follow
 * transl_option_lemma_query of ProVerif 2.05: some are exclusive (only one of
 * noneSat, discardSat, fullSat, instantiateSat), given as groups.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Modifiers {
  /**
   * Options of declarations, by kind (DestructorFun is "fun ... reduc").
   *
   * @type {Object}
   */
  static DECLS = {
      FreeDecl: [{ name: "private", text: "unknown to the attacker; a private channel is drawn dotted" }]
    , ConstDecl: [{ name: "private", text: "unknown to the attacker" }, { name: "data", text: "kept for CryptoVerif" }]
    , FunDecl: [
          { name: "private", text: "the attacker cannot apply it" }
        , { name: "data", text: "the attacker can also take it apart, like a tuple" }
        , { name: "typeConverter", text: "the identity, only changing the type (unary functions)" }
      ]
    , DestructorFun: [{ name: "private", text: "the attacker cannot apply it" }]
    , ReducDecl: [{ name: "private", text: "the attacker cannot apply it" }]
    , EquationDecl: [
          { name: "convergent", text: "the equations form a convergent rewrite system", group: "eq" }
        , { name: "linear", text: "the equations are linear", group: "eq" }
      ]
    , PredDecl: [
          { name: "block", text: "the predicate is not defined by clauses: ProVerif does not resolve on it" }
        , { name: "memberOptim", text: "optimisation for membership predicates (arity 2)" }
      ]
    , TypeDecl: [
          { name: "large", text: "CryptoVerif: a large type" }
        , { name: "fixed", text: "CryptoVerif: a type of fixed length" }
        , { name: "bounded", text: "CryptoVerif: a bounded type" }
        , { name: "nonuniform", text: "CryptoVerif: a non-uniform distribution" }
      ]
    , QueryDecl: [
          { name: "induction", text: "prove the queries by induction", group: "ind" }
        , { name: "noInduction", text: "do not use induction", group: "ind" }
        , { name: "proveAll", text: "prove every query of the group", group: "subset" }
        , { name: "fullSat", text: "saturation: apply the lemmas fully", group: "sat" }
        , { name: "noneSat", text: "saturation: do not apply the lemmas", group: "sat" }
        , { name: "discardSat", text: "saturation: only to discard clauses", group: "sat" }
        , { name: "instantiateSat", text: "saturation: only when they instantiate", group: "sat" }
        , { name: "fullVerif", text: "verification: apply the lemmas fully", group: "verif" }
        , { name: "noneVerif", text: "verification: do not apply the lemmas", group: "verif" }
        , { name: "discardVerif", text: "verification: only to discard", group: "verif" }
        , { name: "instantiateVerif", text: "verification: only when they instantiate", group: "verif" }
      ]
    , LemmaDecl: [
          { name: "induction", text: "prove by induction", group: "ind" }
        , { name: "noInduction", text: "do not use induction", group: "ind" }
        , { name: "maxSubset", text: "lemmas only: prove the largest subset that holds", group: "subset", only: ["lemma"] }
        , { name: "keep", text: "axioms and restrictions: keep it in the proofs of lemmas", only: ["axiom", "restriction"] }
        , { name: "removeEvents", text: "remove the events only used by this lemma", group: "events" }
        , { name: "keepEvents", text: "keep those events", group: "events" }
        , { name: "fullSat", text: "saturation: apply fully", group: "sat" }
        , { name: "noneSat", text: "saturation: do not apply", group: "sat" }
        , { name: "discardSat", text: "saturation: only to discard", group: "sat" }
        , { name: "instantiateSat", text: "saturation: only when it instantiates", group: "sat" }
        , { name: "fullVerif", text: "verification: apply fully", group: "verif" }
        , { name: "noneVerif", text: "verification: do not apply", group: "verif" }
        , { name: "discardVerif", text: "verification: only to discard", group: "verif" }
        , { name: "instantiateVerif", text: "verification: only when it instantiates", group: "verif" }
      ]
    , NoUnifDecl: [
          { name: "hypothesis", text: "apply to hypotheses (the default)" }
        , { name: "conclusion", text: "apply to conclusions" }
        , { name: "ignoreAFewTimes", text: "ignore the declaration a few times" }
      ]
  };

  /**
   * Options of the queries "secret x [...]".
   *
   * @type {Array}
   */
  static SECRET = [
      { name: "reachability", text: "secrecy as reachability (the default)", group: "secret" }
    , { name: "real_or_random", text: "real-or-random secrecy, an equivalence", group: "secret" }
    , { name: "pv_reachability", text: "ProVerif only: reachability", group: "secret" }
    , { name: "pv_real_or_random", text: "ProVerif only: real-or-random", group: "secret" }
  ];

  /**
   * Options of process actions, by kind.
   *
   * @type {Object}
   */
  static ACTIONS = {
      In: [{ name: "precise", text: "precise input: ProVerif tracks which message was received (fewer false attacks, slower)" }]
    , Get: [{ name: "precise", text: "precise get: ProVerif tracks which row was read" }]
    , LetFilter: [{ name: "precise", text: "precise choice: ProVerif tracks which value was chosen" }]
  };

  /**
   * Gives the modifiers of a declaration.
   *
   * @param {Object} d The declaration.
   * @return {Array} The modifiers, each {name, text, group?, on}.
   */
  static ofDecl(d: any) {
    const key = d.kind === "FunDecl" && d.reduc ? "DestructorFun" : d.kind;
    const list = (Modifiers.DECLS[key] || []).filter(m => !m.only || m.only.includes(d.keyword));
    const on = new Set((d.options || []).map(o => o.name.name));
    const known = new Set(list.map(m => m.name));
    const extra = [...on].filter(n => !known.has(n)).map(name => ({ name, text: "an option of the model" }));
    return [...list, ...extra].map(m => ({ ...m, on: on.has(m.name) }));
  }

  /**
   * Gives the modifiers of a process action.
   *
   * @param {Object} p The action.
   * @return {Array} The modifiers, each {name, text, on}.
   */
  static ofAction(p: any) {
    const list = Modifiers.ACTIONS[p.kind] || [];
    const on = new Set((p.options || []).map(o => o.name.name));
    return list.map(m => ({ ...m, on: on.has(m.name) }));
  }

  /**
   * Applies a change of one modifier to a set, keeping the exclusive groups
   * consistent.
   *
   * @param {Array} list The modifiers ({name, group, on}).
   * @param {string} name The modifier the user changed.
   * @param {Object} on Its new state.
   * @return {Object} The option names now on, in the order of the list.
   */
  static toggle(list: any[], name: string, on: any) {
    const target = list.find(m => m.name === name);
    const out = [];
    for (const m of list) {
      let state = m.on;
      if (m.name === name) {
        state = on;
      } else if (on && target && target.group && m.group === target.group) {
        state = false;
      }
      if (state) {
        out.push(m.name);
      }
    }
    return out;
  }
}
// ----------------------------------------------------------------
