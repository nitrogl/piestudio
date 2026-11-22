/**
 * The pop-up that adds or edits an action of a process (a block of the
 * diagram): its fields, its modifiers ([precise], an else branch) and a
 * preview of the block as a formula and as code.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class ActionDialog {
  /**
   * The fields of each kind of action, as FormBuilder fields, whose labels
   * and hints FormBuilder translates; the keys are those of
   * ProcessEditor.makeAction.
   *
   * @type {Object<string, Array<Object>>}
   */
  static FIELDS: Record<string, any[]> = {
      New: [
          { key: "name", label: I18n.mark("Name"), kind: "ident", placeholder: "k" }
        , { key: "type", label: I18n.mark("Type"), kind: "type", placeholder: "key" }
        , { key: "random", label: I18n.mark("as in CryptoVerif"), kind: "check", hint: I18n.mark("k <-R key; instead of new k: key; ProVerif reads both"), bracket: false }
      ]
    , In: [
          { key: "chan", label: I18n.mark("Channel"), kind: "text", placeholder: "c", list: "names" }
        , { key: "pattern", label: I18n.mark("Pattern (what is received)"), kind: "text", placeholder: "x: bitstring" }
        , { key: "precise", label: "precise", kind: "check", hint: I18n.mark("a more precise analysis of this input (ProVerif 2.03 and later)") }
      ]
    , Out: [
          { key: "chan", label: I18n.mark("Channel"), kind: "text", placeholder: "c", list: "names" }
        , { key: "msg", label: I18n.mark("Message"), kind: "term", placeholder: "senc(m, k)" }
      ]
    , Let: [
          { key: "pattern", label: I18n.mark("Pattern"), kind: "text", placeholder: "x" }
        , { key: "value", label: I18n.mark("Value"), kind: "term", placeholder: "sdec(y, k)" }
        , { key: "withElse", label: I18n.mark("else branch"), kind: "check", hint: I18n.mark("what to do when the value does not match"), bracket: false }
        , { key: "arrow", label: I18n.mark("as in CryptoVerif"), kind: "check", hint: I18n.mark("x <- M; instead of let x = M in, for a variable or _ without else branch; ProVerif reads both"), bracket: false }
      ]
    , LetFilter: [
          { key: "vars", label: I18n.mark("Variables"), kind: "text", placeholder: "x: key" }
        , { key: "cond", label: I18n.mark("Condition"), kind: "term", placeholder: "p(x)" }
        , { key: "precise", label: "precise", kind: "check", hint: I18n.mark("a more precise analysis of this choice") }
        , { key: "withElse", label: I18n.mark("else branch"), kind: "check", hint: I18n.mark("what to do when no value fits"), bracket: false }
      ]
    , If: [
          { key: "cond", label: I18n.mark("Condition"), kind: "term", placeholder: "x = y" }
        , { key: "withElse", label: I18n.mark("else branch"), kind: "check", hint: I18n.mark("what to do when the condition is false"), bracket: false }
      ]
    , Event: [
          { key: "name", label: I18n.mark("Event"), kind: "ident", placeholder: "accepted", list: "events" }
        , { key: "args", label: I18n.mark("Arguments"), kind: "text", placeholder: "x, k" }
      ]
    , Insert: [
          { key: "table", label: I18n.mark("Table"), kind: "ident", placeholder: "keys", list: "tables" }
        , { key: "args", label: I18n.mark("Row"), kind: "text", placeholder: "host, pk" }
      ]
    , Get: [
          { key: "table", label: I18n.mark("Table"), kind: "ident", placeholder: "keys", list: "tables" }
        , { key: "patterns", label: I18n.mark("Row patterns"), kind: "text", placeholder: "=host, pk" }
        , { key: "cond", label: I18n.mark("Condition (optional)"), kind: "term", placeholder: "" }
        , { key: "precise", label: "precise", kind: "check", hint: I18n.mark("a more precise analysis of this lookup") }
        , { key: "withElse", label: I18n.mark("else branch"), kind: "check", hint: I18n.mark("what to do when no row matches"), bracket: false }
      ]
    , Call: [
          { key: "name", label: I18n.mark("Process"), kind: "ident", placeholder: "Client", list: "processes" }
        , { key: "args", label: I18n.mark("Arguments"), kind: "text", placeholder: "skA, pkB" }
      ]
    , Phase: [
          { key: "n", label: I18n.mark("Phase"), kind: "text", placeholder: "1" }
      ]
    , Sync: [
          { key: "n", label: I18n.mark("Barrier"), kind: "text", placeholder: "1" }
        , { key: "tag", label: I18n.mark("Tag (optional)"), kind: "text", placeholder: "" }
      ]
  };

  /**
   * The values of a new action, by kind.
   *
   * @type {Object<string, Object>}
   */
  static DEFAULTS: Record<string, any> = {
      New: { name: "n", type: "bitstring", random: false }
    , In: { chan: "c", pattern: "x: bitstring", precise: false }
    , Out: { chan: "c", msg: "" }
    , Let: { pattern: "x", value: "", withElse: false, arrow: false }
    , LetFilter: { vars: "x: bitstring", cond: "", precise: false, withElse: false }
    , If: { cond: "", withElse: true }
    , Event: { name: "", args: "" }
    , Insert: { table: "", args: "" }
    , Get: { table: "", patterns: "", cond: "", precise: false, withElse: false }
    , Call: { name: "", args: "" }
    , Phase: { n: "1" }
    , Sync: { n: "1", tag: "" }
  };

  /**
   * The field that asks for the style of CryptoVerif, by kind of action.
   *
   * @type {Object<string, string>}
   */
  static STYLE: Record<string, string> = { New: "random", Let: "arrow" };

  /**
   * The titles of the pop-up for each kind of action, to add one and to
   * edit one, in English: the pop-up translates them.
   *
   * @type {Object<string, Array<string>>}
   */
  static TITLES: Record<string, string[]> = {
      New: [I18n.mark("Add a fresh name (new)"), I18n.mark("Edit the fresh name (new)")]
    , In: [I18n.mark("Add an input (in)"), I18n.mark("Edit the input (in)")]
    , Out: [I18n.mark("Add an output (out)"), I18n.mark("Edit the output (out)")]
    , Let: [I18n.mark("Add an assignment or a match (let)"), I18n.mark("Edit the assignment or match (let)")]
    , LetFilter: [I18n.mark("Add a choice (let ... suchthat)"), I18n.mark("Edit the choice (let ... suchthat)")]
    , If: [I18n.mark("Add a test (if)"), I18n.mark("Edit the test (if)")]
    , Event: [I18n.mark("Add an event"), I18n.mark("Edit the event")]
    , Insert: [I18n.mark("Add an insertion into a table"), I18n.mark("Edit the insertion into a table")]
    , Get: [I18n.mark("Add a lookup in a table (get)"), I18n.mark("Edit the lookup in a table (get)")]
    , Call: [I18n.mark("Add a call of a process"), I18n.mark("Edit the call of a process")]
    , Phase: [I18n.mark("Add a phase"), I18n.mark("Edit the phase")]
    , Sync: [I18n.mark("Add a synchronisation (sync)"), I18n.mark("Edit the synchronisation (sync)")]
  };

  dialogs: Dialogs;
  kind: string;
  writer: LatexWriter;
  form: FormBuilder;
  $preview: JQuery<HTMLElement>;
  $error: JQuery<HTMLElement>;
  timer: number;

  /**
   * @param {Object} params The pop-up parameters.
   * @param {Dialogs} params.dialogs The pop-ups of the studio.
   */
  constructor(params?: { dialogs?: Dialogs }) {
    this.dialogs = params.dialogs;
  }

  /**
   * Opens the pop-up.
   *
   * @param {Object} params What to edit.
   * @param {string} params.kind The kind of action.
   * @param {Object|null} params.node The node to edit, or null for a new
   *   action.
   * @param {Analysis} params.analysis The analysis of the model.
   * @param {LatexWriter} params.writer The LaTeX writer, for the preview.
   * @param {string} params.style The style of a new action: "cryptoverif"
   *   for "k <-R key;" and "x <- M;", or "proverif".
   * @return {Promise<Object|null>} The values of the fields, or null when
   *   cancelled.
   */
  open(params?: { kind?: string; node?: any; analysis?: Analysis; writer?: LatexWriter; style?: string }): Promise<any> {
    const kind = params.kind;
    const fields = ActionDialog.FIELDS[kind];
    if (!fields) {
      return Promise.resolve(null);
    }
    this.kind = kind;
    this.writer = params.writer;
    const values = params.node ? {...ActionDialog.DEFAULTS[kind], ...ProcessEditor.actionFields(params.node)} : {...ActionDialog.DEFAULTS[kind]};
    if (!params.node && params.style === "cryptoverif" && ActionDialog.STYLE[kind]) {
      values[ActionDialog.STYLE[kind]] = true;
    }
    this.form = new FormBuilder({
        fields: fields
      , values: values
      , lists: DeclarationDialog.lists(params.analysis)
      , onChange: () => this.changed()
    });
    const $body = $("<div class=\"st-action-dialog\"></div>");
    this.$preview = $("<div class=\"st-action-preview\"></div>");
    this.$error = $("<div class=\"st-check-result\"></div>");
    $body.append(this.form.render(), this.$preview, this.$error);
    const promise = this.dialogs.open({
        title: I18n.t(ActionDialog.TITLES[kind][params.node ? 1 : 0])
      , icon: "fa-cube"
      , body: $body
      , buttons: [
            { label: I18n.t("Cancel"), style: "secondary", value: null }
          , { label: params.node ? I18n.t("Apply") : I18n.t("Add"), style: "primary", action: () => this.accept() }
        ]
      , onShown: () => $body.find("input, textarea").first().trigger("focus").trigger("select")
    });
    this.update();
    return promise;
  }

  /**
   * Updates the preview, a moment after the last change.
   */
  changed() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.update(), 200);
  }

  /**
   * Builds the action from the fields and previews it.
   *
   * @return {Object|null} The node, or null when a field is wrong.
   */
  update() {
    let node = null;
    this.$error.empty();
    this.$preview.empty();
    try {
      node = ProcessEditor.makeAction(this.kind, this.form.collect());
    } catch (e: any) {
      this.$error.append($("<div class=\"alert alert-danger py-1 px-2 mb-0 small\"></div>").text(e.message));
      return null;
    }
    this.$preview.append($("<code class=\"st-code-preview\"></code>").text(PvPrinter.head(node).replace(/ (then|in|do)$/, "")));
    if (this.writer) {
      try {
        this.$preview.append($("<span class=\"st-math-preview\"></span>").html(MathRenderer.html(this.writer.action(node))));
      } catch (e) {
        // No formula for this action
      }
    }
    return node;
  }

  /**
   * Closes the pop-up with the values, when they make an action.
   *
   * @return {Object|undefined} The values, or undefined to stay open.
   */
  accept() {
    return this.update() ? this.form.collect() : undefined;
  }
}
// ----------------------------------------------------------------
