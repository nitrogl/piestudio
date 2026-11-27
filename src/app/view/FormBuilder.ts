/**
 * Builds the forms of the pop-ups from the fields of a specification
 * (DeclSpecs for the declarations, ActionDialog for the actions), and reads
 * their values back.
 *
 * Field kinds: ident, idents, type, types, text, vars (with an Infer
 * button), term, check, select, notation (a LaTeX notation with its
 * preview), rules and queries and items (lists of rows), goalOptions,
 * setting and settingValue (ProVerif settings).
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class FormBuilder {
  fields: any[];
  values: any;
  lists: any;
  onChange: () => void;
  onButton: any;
  $form: JQuery<HTMLElement>;
  id: string;

  /**
   * @param {Object} params The form parameters.
   * @param {Array<Object>} params.fields The fields.
   * @param {Object} params.values The values, by key.
   * @param {Object} params.lists Completions: types, events, tables,
   *   processes, functions and names, as arrays of strings.
   * @param {function():void} params.onChange Called when a value changes.
   * @param {function(string, jQuery):void} params.onButton Called by the
   *   buttons of the fields (infer, templates).
   */
  constructor(params?: { fields?: any[]; values?: any; lists?: any; onChange?: (() => void); onButton?: ((arg0: string, arg1: JQuery) => void) }) {
    const defaults = {
        fields: []
      , values: {}
      , lists: {}
      , onChange: () => {}
      , onButton: () => {}
    };
    params = {...defaults, ...params};
    this.fields = params.fields;
    this.values = {...params.values};
    this.lists = params.lists;
    this.onChange = params.onChange;
    this.onButton = params.onButton;
    this.$form = $("<form class=\"st-form\" autocomplete=\"off\"></form>");
    this.id = "st-form-" + Math.floor(Math.random()*1e9);
    this.bind();
  }

  /**
   * @return {jQuery} The form, filled with the fields.
   */
  render(): JQuery {
    this.$form.empty();
    this.$form.append(this.datalists());
    const $checks = $("<div class=\"st-checks\"></div>");
    this.fields.forEach(field => {
      const $field = this.fieldElement(field);
      if (field.kind === "check") {
        $checks.append($field);
      } else if ($field) {
        this.$form.append($field);
      }
    });
    if ($checks.children().length) {
      this.$form.append($("<div class=\"st-form-label\"></div>").text(I18n.t("Modifiers")), $checks);
    }
    return this.$form;
  }

  /**
   * Listens to the inputs of the form.
   */
  bind() {
    const form = this;
    this.$form.on("submit", event => event.preventDefault());
    this.$form.on("input change", "[data-key]", () => {
      form.collect();
      form.onChange();
    });
    this.$form.on("click", "[data-row-add]", function() {
      form.collect();
      const key = $(this).attr("data-row-add");
      const empty = key === "rules" ? { forall: "", lhs: "", rhs: "" } : key === "items" ? { name: "", among: "" } : { q: "" };
      form.values[key] = (form.values[key] || []).concat([empty]);
      form.render();
      form.onChange();
    });
    this.$form.on("click", "[data-row-remove]", function() {
      form.collect();
      const key = $(this).attr("data-row-remove");
      const index = Number($(this).attr("data-index"));
      form.values[key] = (form.values[key] || []).filter((row, i) => i !== index);
      form.render();
      form.onChange();
    });
    this.$form.on("click", "[data-button]", function() {
      form.collect();
      form.onButton($(this).attr("data-button"), $(this));
    });
    this.$form.on("change", "[data-key=\"name\"][data-kind=\"setting\"]", () => {
      // The values offered depend on the setting
      form.values.value = PvSettings.defaultValue(form.values.name) || "";
      form.render();
      form.onChange();
    });
  }

  /**
   * Builds the lists of completions of the form.
   *
   * @return {string} The datalists, as HTML.
   */
  datalists(): string {
    return Object.keys(this.lists).map(name => "<datalist id=\"" + this.id + "-" + name + "\">"
      + (this.lists[name] || []).map(item => "<option value=\"" + MathRenderer.escape(item) + "\"></option>").join("")
      + "</datalist>").join("");
  }

  /**
   * Builds an input.
   *
   * @param {string} key The key of the value.
   * @param {*} value The value.
   * @param {Object} options Placeholder, list of completions, kind.
   * @return {jQuery} The input.
   */
  input(key: string, value: any, options: any = {}): JQuery {
    const $input = $("<input type=\"text\" class=\"form-control form-control-sm st-mono\" spellcheck=\"false\">")
      .attr({ "data-key": key, placeholder: options.placeholder || "" }).val(value === undefined || value === null ? "" : value);
    if (options.list) {
      $input.attr("list", this.id + "-" + options.list);
    }
    if (options.kind) {
      $input.attr("data-kind", options.kind);
    }
    return $input;
  }

  /**
   * Builds the element of a field.
   *
   * @param {Object} field The field.
   * @return {jQuery|null} The element, or null for a field without one.
   */
  fieldElement(field: any): JQuery | null {
    const value = this.values[field.key];
    const $group = $("<div class=\"mb-2\"></div>");
    const label = () => $("<label class=\"form-label st-form-label\"></label>").text(I18n.t(field.label));
    const hint = () => (field.hint ? $("<div class=\"form-text\"></div>").text(I18n.t(field.hint)) : null);
    switch (field.kind) {
      case "ident":
      case "idents":
      case "text":
      case "goalOptions":
        return $group.append(label(), this.input(field.key, value, { placeholder: field.placeholder, list: field.list, kind: field.kind }), hint());

      case "type":
      case "types":
        return $group.append(label(), this.input(field.key, value, { placeholder: field.placeholder, list: "types", kind: field.kind }), hint());

      case "vars": {
        const $line = $("<div class=\"input-group input-group-sm\"></div>").append(this.input(field.key, value, { placeholder: field.placeholder }));
        if (field.infer) {
          $line.append($("<button type=\"button\" class=\"btn btn-outline-secondary\" data-button=\"infer\"></button>")
            .attr("title", I18n.t("Find the types from the events and tables")).text(I18n.t("Infer")));
        }
        return $group.append(label(), $line, hint());
      }

      case "term":
        return $group.append(label(), $("<textarea class=\"form-control form-control-sm st-mono\" spellcheck=\"false\"></textarea>")
          .attr({ "data-key": field.key, rows: field.multiline ? 3 : 1, placeholder: field.placeholder || "" }).val(value || ""), hint());

      case "check": {
        const $check = $("<label class=\"st-check\" title=\"\"></label>").attr("title", field.hint ? I18n.t(field.hint) : "");
        $check.append($("<input type=\"checkbox\" class=\"form-check-input\">").attr("data-key", field.key).prop("checked", !!value));
        $check.append($("<span class=\"st-check-name\"></span>").text(field.bracket === false ? I18n.t(field.label) : "[" + field.label + "]"));
        if (field.hint) {
          $check.append($("<span class=\"st-check-hint\"></span>").text(I18n.t(field.hint)));
        }
        return $check;
      }

      case "select": {
        const $select = $("<select class=\"form-select form-select-sm\"></select>").attr("data-key", field.key);
        field.options.forEach(option => $select.append($("<option></option>").text(option).prop("selected", option === value)));
        return $group.append(label(), $select, hint());
      }

      case "setting":
        return $group.append(label(), this.settingSelect(field.key, value));

      case "settingValue":
        return $group.append(label(), this.settingValue(field.key, value));

      case "notation":
        return this.notationElement(field);

      case "rules":
        return this.rowsElement(field, ["forall", "lhs", "rhs"], ["x: bitstring", "sdec(senc(x, k), k)", "x"], field.eq ? "=" : "\u2192");

      case "queries":
        return this.rowsElement(field, ["q"], ["event(end(x)) ==> event(begin(x))"], null);

      case "items":
        return this.rowsElement(field, ["name", "among"], ["secret", I18n.t("any value (empty)")], "among");

      default:
        return $group.append(label(), this.input(field.key, value, {}));
    }
  }

  /**
   * Builds the list of the ProVerif settings, by group.
   *
   * @param {string} key The key of the value.
   * @param {string} value The setting.
   * @return {jQuery} The select element.
   */
  settingSelect(key: string, value: string): JQuery {
    const $select = $("<select class=\"form-select form-select-sm\"></select>").attr({ "data-key": key, "data-kind": "setting" });
    PvSettings.GROUPS.forEach(group => {
      const names = Object.keys(PvSettings.SPECS).filter(name => PvSettings.SPECS[name].group === group && PvSettings.SPECS[name].kind !== "deprecated");
      if (names.length) {
        const $group = $("<optgroup></optgroup>").attr("label", I18n.t(group));
        names.forEach(name => $group.append($("<option></option>").text(name).prop("selected", name === value)));
        $select.append($group);
      }
    });
    const spec = PvSettings.get(value);
    return $("<div></div>").append($select, $("<div class=\"form-text\"></div>")
      .text(spec ? I18n.t(spec.text) + " " + I18n.t("Default: {value}.", { value: spec.def || "none" }) : ""));
  }

  /**
   * Builds the input of the value of a setting.
   *
   * @param {string} key The key of the value.
   * @param {string} value The value.
   * @return {jQuery} A select element for settings with choices, an input
   *   otherwise.
   */
  settingValue(key: string, value: string): JQuery {
    const choices = PvSettings.choices(this.values.name);
    const current = String(value === undefined || value === null ? "" : value).replace(/^"|"$/g, "");
    if (choices.length === 0) {
      return this.input(key, current, { placeholder: PvSettings.defaultValue(this.values.name) || "" });
    }
    const $select = $("<select class=\"form-select form-select-sm\"></select>").attr("data-key", key);
    choices.forEach(choice => {
      const label = PvSettings.isDefault(this.values.name, choice) ? I18n.t("{value} (default)", { value: choice }) : choice;
      $select.append($("<option></option>").attr("value", choice).text(label).prop("selected", choice === current));
    });
    return $select;
  }

  /**
   * Builds the field of a LaTeX notation, with its preview.
   *
   * @param {Object} field The field.
   * @return {jQuery} The element.
   */
  notationElement(field: any): JQuery {
    const $box = $("<div class=\"st-notation\"></div>");
    const $head = $("<div class=\"d-flex align-items-center gap-2 mb-1\"></div>");
    $head.append($("<span class=\"st-form-label flex-grow-1\"></span>").text(I18n.t(field.label)));
    const $kind = $("<select class=\"form-select form-select-sm w-auto\"></select>").attr("data-key", "notationKind");
    ["notation", "infix", "prefix", "postfix"].forEach(kind => $kind.append($("<option></option>").text(kind).prop("selected", kind === this.values.notationKind)));
    $head.append($kind);
    $box.append($head, this.input("notation", this.values.notation, { placeholder: I18n.t("for example {example}", { example: "\\{#1\\}_{#2}" }) }));
    $box.append($("<div class=\"d-flex align-items-center gap-2 mt-1\"></div>")
      .append($("<span class=\"st-muted small\"></span>").text(I18n.t("Shown as")), "<span class=\"st-notation-preview\"></span>"));
    return $box;
  }

  /**
   * Builds a list of rows: rewrite rules, queries or secrets.
   *
   * @param {Object} field The field.
   * @param {Array<string>} columns The keys of the columns.
   * @param {Array<string>} placeholders The placeholders of the columns.
   * @param {string|null} separator The text between the last two columns.
   * @return {jQuery} The element.
   */
  rowsElement(field: any, columns: string[], placeholders: string[], separator: string | null): JQuery {
    const rows = this.values[field.key] || [];
    const $box = $("<div class=\"mb-2\"></div>");
    const $head = $("<div class=\"d-flex align-items-center\"></div>").append($("<label class=\"form-label st-form-label flex-grow-1\"></label>").text(I18n.t(field.label)));
    if (field.kind === "queries") {
      $head.append($("<button type=\"button\" class=\"btn btn-sm btn-link\" data-button=\"templates\"><i class=\"fas fa-wand-magic-sparkles\"></i> </button>")
        .append($("<span></span>").text(I18n.t("Suggestions"))));
    }
    $box.append($head);
    rows.forEach((row, i) => {
      const $row = $("<div class=\"st-row\"></div>").addClass("st-row-" + columns.length);
      columns.forEach((column, c) => {
        if (separator && c === columns.length - 1 && columns.length > 1) {
          $row.append($("<span class=\"st-row-sep\"></span>").text(separator));
        }
        $row.append(this.input(field.key + "." + i + "." + column, row[column], { placeholder: placeholders[c] }));
      });
      $row.append($("<button type=\"button\" class=\"btn btn-sm st-tool\"><i class=\"fas fa-xmark\"></i></button>")
        .attr({ "data-row-remove": field.key, "data-index": i, title: I18n.t("Remove") }));
      $box.append($row);
    });
    $box.append($("<button type=\"button\" class=\"btn btn-sm btn-link px-0\"></button>").attr("data-row-add", field.key)
      .append("<i class=\"fas fa-plus\"></i> ", $("<span></span>").text(I18n.t("Add"))));
    return $box;
  }

  /**
   * Reads the values of the form.
   *
   * @return {Object} The values, by key.
   */
  collect() {
    const values = this.values;
    this.$form.find("[data-key]").each(function() {
      const key = $(this).attr("data-key");
      const value = (this as HTMLInputElement).type === "checkbox" ? (this as HTMLInputElement).checked : $(this).val();
      const row = key.match(/^(\w+)\.(\d+)\.(\w+)$/);
      if (row) {
        const rows = values[row[1]] || (values[row[1]] = []);
        rows[Number(row[2])] = {...(rows[Number(row[2])] || {}), [row[3]]: value};
      } else {
        values[key] = value;
      }
    });
    return values;
  }

  /**
   * Changes a value and redraws the form.
   *
   * @param {string} key The key.
   * @param {*} value The value.
   */
  set(key: string, value: any) {
    this.collect();
    this.values[key] = value;
    this.render();
  }
}
// ----------------------------------------------------------------
