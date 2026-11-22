/**
 * The pop-up that adds or edits a declaration: a form made from its
 * specification (DeclSpecs), and its ProVerif source, checked as the user
 * types against the whole model.
 *
 * The modifiers of a declaration ([private], [data], [typeConverter], ...)
 * are check boxes of the form. A declaration may carry a LaTeX notation,
 * written as a hint in a comment before it, previewed with KaTeX.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class DeclarationDialog {
  dialogs: Dialogs;
  menu: ContextMenu;
  analysis: Analysis;
  index: number;
  spec: any;
  writer: any;
  tab: any;
  pristine: boolean;
  $root: JQuery<HTMLElement>;
  form: FormBuilder;
  $formPane: JQuery<HTMLElement>;
  $source: JQuery<HTMLElement>;
  $sourcePane: JQuery<HTMLElement>;
  $check: JQuery<HTMLElement>;
  $preview: JQuery<HTMLElement>;
  timer: number;
  result: any;

  /**
   * @param {Object} params The pop-up parameters.
   * @param {Dialogs} params.dialogs The pop-ups of the studio.
   * @param {ContextMenu} params.menu The menu of the studio.
   */
  constructor(params?: { dialogs?: Dialogs; menu?: ContextMenu }) {
    this.dialogs = params.dialogs;
    this.menu = params.menu;
  }

  /**
   * Opens the pop-up.
   *
   * @param {Object} params What to edit.
   * @param {Analysis} params.analysis The analysis of the model.
   * @param {number|null} params.index The declaration to edit, or null to
   *   add one.
   * @param {string|null} params.kind The kind of declaration to add.
   * @param {Object} params.writer The LaTeX writer, for the previews.
   * @return {Promise<Object|null>} The source of the declaration and, for a
   *   party, its name and parameters; null when cancelled.
   */
  open(params?: { analysis?: Analysis; index?: number | null; kind?: string | null; writer?: any }): Promise<any> {
    const analysis = params.analysis;
    const index = params.index === undefined ? null : params.index;
    const decl = index === null ? null : analysis.program.decls[index];
    const spec = decl ? DeclSpecs.specOf(decl) : DeclSpecs.specByKey(params.kind);
    if (!spec) {
      return Promise.resolve(null);
    }
    this.analysis = analysis;
    this.index = index;
    this.spec = spec;
    this.writer = params.writer;
    let values = spec.sourceOnly ? {} : spec.defaults();
    if (decl && !spec.sourceOnly) {
      try {
        values = spec.from(decl, analysis);
      } catch (e) {
        values = spec.defaults();
      }
    }
    const original = decl ? analysis.text.slice(decl.start, decl.end) : spec.sourceOnly ? spec.template : spec.toSource(values);
    this.tab = spec.sourceOnly ? "source" : "form";
    // A new declaration starts empty: I do not shout errors before a key
    this.pristine = !decl;

    const $body = $("<div class=\"st-decl-dialog\"></div>");
    this.$root = $body;
    if (spec.help) {
      $body.append($("<p class=\"st-muted small\"></p>").text(I18n.t(spec.help)));
    }
    const $tabs = $("<ul class=\"nav nav-pills nav-sm st-dialog-tabs mb-2\"></ul>");
    if (!spec.sourceOnly) {
      $tabs.append($("<li class=\"nav-item\"></li>").append($("<a class=\"nav-link active\" href=\"#\" data-tab=\"form\"></a>").text(I18n.t("Form"))));
    }
    $tabs.append($("<li class=\"nav-item\"></li>").append($("<a class=\"nav-link\" href=\"#\" data-tab=\"source\"></a>")
      .toggleClass("active", !!spec.sourceOnly).text(I18n.t("ProVerif source"))));
    $body.append($tabs);

    this.form = new FormBuilder({
        fields: spec.sourceOnly ? [] : spec.fields
      , values: values
      , lists: DeclarationDialog.lists(analysis)
      , onChange: () => this.changed()
      , onButton: (name, $button) => this.button(name, $button)
    });
    this.$formPane = $("<div class=\"st-pane-form\"></div>").append(this.form.render()).toggle(this.tab === "form");
    this.$source = $("<textarea class=\"form-control st-mono st-source-input\" rows=\"6\" spellcheck=\"false\"></textarea>").val(original);
    this.$sourcePane = $("<div class=\"st-pane-source\"></div>").append(this.$source).toggle(this.tab === "source");
    this.$check = $("<div class=\"st-check-result\"></div>");
    this.$preview = $("<div class=\"st-decl-preview\"></div>");
    $body.append(this.$formPane, this.$sourcePane, this.$preview, this.$check);

    $tabs.on("click", "[data-tab]", event => {
      event.preventDefault();
      this.switchTab($(event.currentTarget).attr("data-tab"));
      $tabs.find(".nav-link").removeClass("active");
      $(event.currentTarget).addClass("active");
    });
    this.$source.on("input", () => this.changed());

    const what = I18n.t(spec.title);
    const lower = what.charAt(0).toLocaleLowerCase(I18n.language()) + what.slice(1);
    const promise = this.dialogs.open({
        title: decl ? I18n.t("Edit {what}", { what: lower }) : I18n.t("Add {what}", { what: lower })
      , icon: "fa-pen-to-square"
      , body: $body
      , size: "lg"
      , buttons: [
            { label: I18n.t("Cancel"), style: "secondary", value: null }
          , { label: decl ? I18n.t("Apply") : I18n.t("Add"), style: "primary", action: () => this.accept() }
        ]
      , onShown: () => this.$body().find("input, textarea").filter(":visible").first().trigger("focus")
    });
    this.check();
    return promise;
  }

  /**
   * @return {jQuery} The content of the pop-up.
   */
  $body(): JQuery {
    return this.$root;
  }

  /**
   * Collects the names the form can complete.
   *
   * @param {Analysis} analysis The analysis of the model.
   * @return {Object} Arrays of types, events, tables, processes,
   *   functions and names.
   */
  static lists(analysis: Analysis) {
    const lists = { types: ["bitstring", "channel", "bool", "nat", "time"], events: [], tables: [], processes: [], functions: [], names: [] };
    for (const decl of analysis.program.decls) {
      switch (decl.kind) {
        case "TypeDecl":
          lists.types.push(decl.name.name);
          break;
        case "EventDecl":
          lists.events.push(decl.name.name);
          break;
        case "TableDecl":
          lists.tables.push(decl.name.name);
          break;
        case "ProcessDecl":
          lists.processes.push(decl.name.name);
          break;
        case "FunDecl":
        case "LetFunDecl":
          lists.functions.push(decl.name.name);
          break;
        case "FreeDecl":
        case "ConstDecl":
          decl.names.forEach(name => lists.names.push(name.name));
          break;
        default:
          break;
      }
    }
    return lists;
  }

  /**
   * Shows the form or the source, carrying the changes over.
   *
   * @param {string} tab "form" or "source".
   */
  switchTab(tab: string) {
    if (tab === this.tab) {
      return;
    }
    if (tab === "source") {
      this.$source.val(this.source());
    } else {
      // The form cannot read every source: I keep its values when the
      // source does not parse as the same kind of declaration
      const parsed = PvParser.parseFragment(String(this.$source.val()).trim(), "decl");
      if (parsed.node && parsed.errors.length === 0 && DeclSpecs.specOf(parsed.node).key === this.spec.key) {
        try {
          const text = this.analysis.text + "\n" + String(this.$source.val()).trim() + "\n";
          const extended = Analysis.of(text);
          const decl = extended.program.decls[extended.program.decls.length - 1];
          this.form.values = this.spec.from(decl, extended);
          this.form.render();
        } catch (e) {
          // I keep the values of the form
        }
      }
    }
    this.tab = tab;
    this.$formPane.toggle(tab === "form");
    this.$sourcePane.toggle(tab === "source");
    this.check();
  }

  /**
   * @return {string} The source of the declaration, from the tab shown.
   */
  source(): string {
    if (this.tab === "source" || this.spec.sourceOnly) {
      return String(this.$source.val()).trim();
    }
    return this.spec.toSource(this.form.collect());
  }

  /**
   * Checks again, a moment after the last change.
   */
  changed() {
    this.pristine = false;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.check(), 250);
  }

  /**
   * Checks the declaration within the model, and previews it.
   *
   * @return {Object} The result of DeclSpecs.validate.
   */
  check() {
    const source = this.source();
    let result;
    try {
      result = DeclSpecs.validate(this.analysis, this.index, source);
    } catch (e: any) {
      result = { syntax: e.message, diagnostics: [], elsewhere: [] };
    }
    this.$check.empty();
    if (result.syntax && this.pristine) {
      this.$check.append($("<div class=\"st-muted small\"><i class=\"fas fa-pen\"></i> </div>").append($("<span></span>").text(I18n.t("Fill in the form: the declaration is checked as you type."))));
    } else if (result.syntax) {
      this.$check.append($("<div class=\"alert alert-danger py-1 px-2 mb-0 small\"></div>").text(result.syntax));
    } else {
      const problems = result.diagnostics.concat(result.elsewhere || []);
      problems.forEach(problem => {
        const style = problem.severity === "error" ? "danger" : "warning";
        this.$check.append($("<div class=\"alert py-1 px-2 mb-1 small\"></div>").addClass("alert-" + style).text(problem.message));
      });
      if (problems.length === 0) {
        this.$check.append($("<div class=\"st-ok small\"><i class=\"fas fa-circle-check\"></i> </div>").append($("<span></span>").text(I18n.t("Valid"))));
      }
    }
    this.preview(result);
    this.result = result;
    return result;
  }

  /**
   * Shows the declaration as code and as a formula, and the notation.
   *
   * @param {Object} result The result of DeclSpecs.validate.
   */
  preview(result: any) {
    this.$preview.empty();
    if (this.tab === "form" && !this.spec.sourceOnly) {
      this.$preview.append($("<pre class=\"st-code-preview\"></pre>").text(this.source()));
    }
    if (result.node && this.writer) {
      try {
        const tex = this.writer.declaration(result.node);
        if (tex) {
          this.$preview.append($("<div class=\"st-math-preview\"></div>").html(MathRenderer.html(tex)));
        }
      } catch (e) {
        // A declaration without a formula
      }
    }
    const values = this.form.values;
    const $notation = this.$body().find(".st-notation-preview");
    if ($notation.length) {
      const tex = String(values.notation || "").trim();
      if (tex === "") {
        $notation.text(I18n.t("the default"));
      } else {
        const sample = tex.replace(/#(\d)/g, (match, n) => ["x", "y", "z", "w"][Number(n) - 1] || "a");
        const error = MathRenderer.error(sample);
        $notation.html(error ? "<span class=\"st-error small\">" + MathRenderer.escape(error) + "</span>" : MathRenderer.html(sample));
      }
    }
  }

  /**
   * Handles the buttons of the form: Infer and Suggestions.
   *
   * @param {string} name The button.
   * @param {jQuery} $button The button element.
   */
  button(name: string, $button: JQuery) {
    const values = this.form.values;
    if (name === "infer") {
      const inferred = DeclSpecs.inferQueryVars(this.analysis, values.rows || [], values.vars || "");
      if (inferred !== null && inferred !== undefined) {
        this.form.set("vars", inferred);
        this.check();
      }
    } else if (name === "templates") {
      const templates = DeclSpecs.queryTemplates(this.analysis);
      this.menu.showBelow(templates.length ? templates.map(template => ({
          label: template.label
        , icon: "fa-wand-magic-sparkles"
        , action: () => {
            const rows = (values.rows || []).filter(row => String(row.q || "").trim() !== "");
            rows.push({ q: template.q });
            this.form.set("rows", rows);
            const inferred = DeclSpecs.inferQueryVars(this.analysis, rows, values.vars || "");
            if (inferred) {
              this.form.set("vars", inferred);
            }
            this.check();
          }
      })) : [{ label: I18n.t("Declare events and names first"), disabled: true }], $button[0]);
    }
  }

  /**
   * Closes the pop-up with the declaration, when it parses.
   *
   * @return {Object|undefined} The result, or undefined to stay open.
   */
  accept() {
    this.pristine = false;
    const result = this.check();
    if (result.syntax) {
      return undefined;
    }
    const answer: any = { source: this.source(), spec: this.spec.key };
    if (this.spec.key === "ProcessDecl" && this.tab === "form") {
      answer.name = String(this.form.values.name || "").trim();
      answer.params = String(this.form.values.params || "").trim();
    }
    return answer;
  }
}
// ----------------------------------------------------------------
