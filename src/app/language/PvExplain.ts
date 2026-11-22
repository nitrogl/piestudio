/**
 * Short descriptions of the constructs of ProVerif, for the tips that show
 * when the pointer rests on a block of the diagram or on a keyword of the
 * code (Explainer, in Studio Core).
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class PvExplain {
  /**
   * What each keyword does, in English: explain translates it.
   *
   * @type {Object<string, string>}
   */
  static KEYWORDS: Record<string, string> = {
      type: I18n.mark("Declares a type, for names, variables and the arguments of functions.")
    , free: I18n.mark("Declares free names, which the attacker knows unless they are [private]: public channels, or secrets.")
    , const: I18n.mark("Declares constants: functions without arguments.")
    , fun: I18n.mark("Declares a constructor, a function that builds terms such as encryptions; the attacker can apply it unless it is [private].")
    , reduc: I18n.mark("Declares a destructor by rewrite rules, such as decryption: sdec(senc(m, k), k) = m. When no rule applies, it fails.")
    , equation: I18n.mark("Declares equations between terms, such as the commutativity of exponentiation in Diffie-Hellman.")
    , pred: I18n.mark("Declares a predicate, for clauses and for the conditions of queries.")
    , table: I18n.mark("Declares a table: processes insert rows into it and look them up with get; the attacker cannot read it.")
    , event: I18n.mark("Declares or executes an event: events mark points of the protocol, for correspondence queries.")
    , query: I18n.mark("Asks a security property: the secrecy of a term (attacker(s)), or a correspondence between events (==>).")
    , lemma: I18n.mark("States a property that ProVerif proves first, then uses to prove the queries.")
    , axiom: I18n.mark("States a property that ProVerif assumes without proof, to help prove the queries.")
    , restriction: I18n.mark("Restricts the traces to those that satisfy a property.")
    , noninterf: I18n.mark("Asks for strong secrecy: the attacker cannot tell runs apart when the given names change value.")
    , weaksecret: I18n.mark("Asks whether a weak secret, such as a password, resists offline guessing.")
    , not: I18n.mark("A secrecy assumption: a fact that never holds. ProVerif checks it, and uses it to speed up the proof.")
    , nounif: I18n.mark("A hint for the resolution: do not resolve on facts of this form. It changes speed and termination, not soundness.")
    , select: I18n.mark("A hint for the resolution: resolve on facts of this form first.")
    , letfun: I18n.mark("Defines a function by a term, expanded where it is used.")
    , let: I18n.mark("Binds a variable or matches a pattern: let x = M in P. It also defines a process macro: let P(x: T) = ...")
    , process: I18n.mark("Starts the main process: the roles of the protocol, usually in parallel and replicated.")
    , new: I18n.mark("Creates a fresh name that the attacker does not know: a nonce or a key.")
    , in: I18n.mark("Receives a message on a channel: in(c, x: T); on a public channel it comes from the attacker. Also ends a let: let x = M in P.")
    , out: I18n.mark("Sends a message on a channel: out(c, M); on a public channel the attacker gets it.")
    , if: I18n.mark("A test: if M then P else Q.")
    , then: I18n.mark("What runs when the test, the match or the lookup succeeds.")
    , else: I18n.mark("What runs when the test, the match or the lookup fails.")
    , insert: I18n.mark("Inserts a row into a table: insert t(M1, ..., Mn).")
    , get: I18n.mark("Looks up a row of a table that matches a pattern: get t(=M, x) in P else Q.")
    , suchthat: I18n.mark("A condition: get ... suchthat M, or let x suchthat p(x), which picks any value that satisfies it.")
    , phase: I18n.mark("Starts a new phase: earlier processes stop, and the attacker keeps what it knows. Used for forward secrecy.")
    , sync: I18n.mark("A synchronisation barrier: processes wait for each other at sync n.")
    , choice: I18n.mark("A biprocess: choice[M, N] is M on the left and N on the right; ProVerif proves the two sides equivalent.")
    , diff: I18n.mark("A biprocess: diff[M, N] is M on the left and N on the right; ProVerif proves the two sides equivalent.")
    , fail: I18n.mark("The failure of a computation, such as a destructor that does not apply.")
    , forall: I18n.mark("Declares the variables of a rewrite rule, an equation, a clause or a query.")
    , otherwise: I18n.mark("Adds rules to a destructor that apply when the rules before them do not.")
    , def: I18n.mark("Defines a macro of declarations, which expand instantiates.")
    , expand: I18n.mark("Expands a macro of declarations defined with def, with its arguments.")
    , set: I18n.mark("Sets an option of ProVerif, such as set attacker = passive.")
    , channel: I18n.mark("Declares channels: free names of type channel.")
    , yield: I18n.mark("The end of a process, as 0, in the syntax of CryptoVerif.")
    , clauses: I18n.mark("Declares Horn clauses directly, for the attacker or for predicates.")
    , elimtrue: I18n.mark("Declares a fact that always holds, to simplify the clauses.")
    , equivalence: I18n.mark("Asks whether two processes are observationally equivalent.")
    , among: I18n.mark("In noninterf: the values that a secret ranges over.")
    , "inj-event": I18n.mark("An injective event in a query: each occurrence matches a distinct occurrence of the events before it.")
    , attacker: I18n.mark("attacker(M): the attacker knows M. query attacker(s) asks whether s stays secret.")
    , mess: I18n.mark("mess(c, M): the message M is on channel c.")
  };

  /**
   * The blocks of the diagram: the keyword that they stand for, or their
   * own title and description.
   *
   * @type {Object<string, Object>}
   */
  static KINDS: Record<string, any> = {
      New: { keyword: "new" }
    , In: { keyword: "in" }
    , Out: { keyword: "out" }
    , Let: { keyword: "let" }
    , LetFilter: { title: "let ... suchthat", text: I18n.mark("Picks any values that satisfy a condition: let x suchthat p(x) in P.") }
    , If: { keyword: "if" }
    , Event: { keyword: "event" }
    , Insert: { keyword: "insert" }
    , Get: { keyword: "get" }
    , Call: { title: "P(...)", text: I18n.mark("Runs a process macro, defined with let, with its arguments.") }
    , Phase: { keyword: "phase" }
    , Sync: { keyword: "sync" }
    , Repl: { title: "!", text: I18n.mark("Replication: unboundedly many copies of the process run in parallel, one per session.") }
    , Par: { title: "|", text: I18n.mark("Parallel composition: the processes run at the same time.") }
    , Nil: { title: "0", text: I18n.mark("The end of a process: it does nothing more.") }
    , Branch: { title: I18n.mark("branch"), text: I18n.mark("A branch: what runs after a test, a match, or in a parallel composition.") }
  };

  /**
   * Gives the description of a construct.
   *
   * @param {Object} what {kind} for a block of the diagram, {keyword} for a
   *   keyword of the code.
   * @return {Object|null} {title, text}, translated, or null.
   */
  static explain(what: { kind?: string; keyword?: string }): { title: string; text: string } | null {
    if (what.kind) {
      const block = PvExplain.KINDS[what.kind];
      if (!block) {
        return null;
      }
      return block.keyword ? PvExplain.explain({ keyword: block.keyword }) : { title: I18n.t(block.title), text: I18n.t(block.text) };
    }
    const keyword = what.keyword || "";
    if (!Object.prototype.hasOwnProperty.call(PvExplain.KEYWORDS, keyword)) {
      return null;
    }

    return { title: keyword, text: I18n.t(PvExplain.KEYWORDS[keyword]) };
  }
}
// ----------------------------------------------------------------
