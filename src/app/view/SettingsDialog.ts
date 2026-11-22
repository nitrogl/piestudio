/**
 * The pop-up of the settings: the engine (memory budget, timeout, extra
 * arguments, live checks), the notation (the style in which the diagram
 * writes new names and lets, and the LaTeX conventions of the Design mode
 * for the actions, terms, identifiers and colours), the theme and the
 * language of the interface.
 *
 * They are remembered in the browser storage.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class SettingsDialog {
  /**
   * The styles in which the actions added from the diagram write their new
   * names and lets.
   *
   * @type {Array<Object>}
   */
  static CODE_STYLES = [
      { value: "model", label: I18n.mark("As the model writes most of them") }
    , { value: "proverif", label: I18n.mark("As in ProVerif: new k: key; and let x = M in") }
    , { value: "cryptoverif", label: I18n.mark("As in CryptoVerif: k <-R key; and x <- M;") }
  ];

  /**
   * The tabs of the pop-up.
   *
   * @type {Array<Object>}
   */
  static TABS = [
      { name: "engine", icon: "fa-microchip", label: I18n.mark("Engine") }
    , { name: "notation", icon: "fa-square-root-variable", label: I18n.mark("Notation") }
    , { name: "theme", icon: "fa-palette", label: I18n.mark("Theme") }
    , { name: "language", icon: "fa-language", label: I18n.mark("Language") }
  ];

  dialogs: Dialogs;

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
   * @param {Object} params What the pop-up edits.
   * @param {EngineSettings} params.settings The engine settings.
   * @param {Conventions} params.conventions The notation conventions.
   * @param {string} params.tab The tab to show first: "engine", "notation",
   *   "theme" or "language".
   * @param {ThemeSettings} params.theme The theme.
   * @param {string} params.codeStyle How the actions added from the diagram
   *   write their new names and lets: "model", "proverif" or "cryptoverif".
   * @param {Object} params.language The language of the interface,
   *   {preference, loaded}, as LanguagePane takes them.
   * @return {Promise<Object|null>} The new engine settings, conventions,
   *   theme, style of the code and language, or null when cancelled.
   */
  open(params?: { settings?: EngineSettings; conventions?: Conventions; tab?: string; theme?: ThemeSettings; codeStyle?: string; language?: any }): Promise<any> {
    const defaults = {
        settings: new EngineSettings()
      , conventions: new Conventions()
      , tab: "engine"
      , theme: null
      , codeStyle: "model"
      , language: { preference: "auto", loaded: {} }
    };
    params = {...defaults, ...params};
    const $body = $("<div class=\"st-settings\"></div>");
    const $tabs = $("<ul class=\"nav nav-pills mb-3\"></ul>");
    SettingsDialog.TABS.forEach(item => $tabs.append($("<li class=\"nav-item\"></li>").append($("<a class=\"nav-link\" href=\"#\"></a>")
      .attr("data-tab", item.name).append($("<i class=\"fas\"></i>").addClass(item.icon), " ", $("<span></span>").text(I18n.t(item.label))))));
    const edited = new ThemeSettings(JSON.parse(JSON.stringify(params.theme || {})));
    const language = new LanguagePane({ ...params.language, project: "PieStudio " + PieStudio.VERSION, file: "piestudio" });
    const panes = {
        engine: this.engineForm(params.settings)
      , notation: this.notationForm(params.conventions, params.codeStyle)
      , theme: this.themeForm(edited)
      , language: language.render()
    };
    $body.append($tabs);
    Object.keys(panes).forEach(name => $body.append(panes[name].attr("data-pane", name)));
    const show = name => {
      const shown = Object.prototype.hasOwnProperty.call(panes, name) ? name : "engine";
      $tabs.find(".nav-link").removeClass("active").filter("[data-tab=\"" + shown + "\"]").addClass("active");
      Object.keys(panes).forEach(key => panes[key].toggle(key === shown));
    };
    $tabs.on("click", "[data-tab]", event => {
      event.preventDefault();
      show($(event.currentTarget).attr("data-tab"));
    });
    show(params.tab);
    return this.dialogs.open({
        title: I18n.t("Settings")
      , icon: "fa-sliders"
      , body: $body
      , size: "lg"
      , buttons: [
            { label: I18n.t("Cancel"), style: "secondary", value: null }
          , { label: I18n.t("Save"), style: "primary", action: () => ({ ...this.collect(panes.engine, panes.notation), theme: edited, explain: panes.theme.find("[data-key=explain]").prop("checked"), language: language.collect() }) }
        ]
    }).then(answer => {
      if (!answer) {
        language.restore();
      }
      return answer;
    });
  }

  /**
   * Builds the form of the engine settings.
   *
   * @param {EngineSettings} settings The settings.
   * @return {jQuery} The form.
   */
  engineForm(settings: EngineSettings): JQuery {
    const $form = $("<div></div>");
    const $memory = $("<select class=\"form-select form-select-sm\" data-key=\"maxMemoryMB\"></select>");
    EngineSettings.MEMORY_CHOICES.forEach(mb => {
      const label = mb === 0 ? I18n.t("No limit: as much as the browser gives (at most 4 GB, all that WebAssembly can address)") : mb >= 1024 ? (mb === 4095 ? "4 GB" : (mb/1024) + " GB") : mb + " MB";
      $memory.append($("<option></option>").attr("value", mb).text(label).prop("selected", mb === settings.maxMemoryMB));
    });
    if (!EngineSettings.MEMORY_CHOICES.includes(settings.maxMemoryMB)) {
      $memory.append($("<option></option>").attr("value", settings.maxMemoryMB).text(settings.maxMemoryMB + " MB").prop("selected", true));
    }
    const label = text => $("<label class=\"form-label st-form-label\"></label>").text(text);
    const hint = text => $("<div class=\"form-text\"></div>").text(text);
    $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Memory budget of a verification")), $memory,
      hint(I18n.t("ProVerif runs in a WebAssembly module whose memory grows as needed, up to this budget. "
      + "Beyond it, or when the browser has no more memory to give, the verification stops with a clear message, and the page is not affected."))));
    $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Time limit, in seconds (0 for none)")),
      $("<input type=\"number\" min=\"0\" step=\"10\" class=\"form-control form-control-sm\" data-key=\"timeoutSeconds\">").val(settings.timeoutSeconds),
      hint(I18n.t("A verification that runs in the page (opened from a file) cannot be interrupted."))));
      // It seems to work, but I think can be confusing and with little usage
    // $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Extra command line arguments")),
    //   $("<input type=\"text\" class=\"form-control form-control-sm st-mono\" data-key=\"extraArgs\" placeholder=\"-test\">").val(settings.extraArgs)));
    $form.append($("<label class=\"st-check\"></label>").append($("<input type=\"checkbox\" class=\"form-check-input\" data-key=\"liveChecks\">").prop("checked", settings.liveChecks),
      $("<span class=\"st-check-name\"></span>").text(I18n.t("Check the model with ProVerif while editing")),
      $("<span class=\"st-check-hint\"></span>").text(I18n.t("ProVerif 2.05 parses the model with -parse-only after each change"))));
    return $form;
  }

  /**
   * Builds the form of the theme: a preset, colours, the font of the code
   * and the size; every change shows at once.
   *
   * @param {ThemeSettings} theme The theme to edit.
   * @return {jQuery} The form.
   */
  themeForm(theme: ThemeSettings): JQuery {
    const $form = $("<div></div>");
    const base = () => (PieStudio.loadPreference("theme", "dark") === "light" ? "light" : "dark");
    const $preset = $("<select class=\"form-select form-select-sm\"></select>");
    Object.keys(ThemeSettings.PRESETS).forEach(key => {
      $preset.append($("<option></option>").attr("value", key).text(I18n.t(ThemeSettings.PRESETS[key].title)).prop("selected", key === theme.preset));
    });
    const $colours = $("<div class=\"st-theme-colours\"></div>");
    const fill = () => {
      $colours.empty();
      const style = getComputedStyle(document.documentElement);
      ThemeSettings.colours().forEach(colour => {
        const value = theme.colours[colour.key] || SettingsDialog.hex(style.getPropertyValue(colour.key).trim());
        const $input = $("<input type=\"color\" class=\"form-control form-control-color\">").val(value).on("input", () => {
          theme.colours[colour.key] = String($input.val());
          theme.apply(base());
        });
        $colours.append($("<label class=\"st-theme-colour\"></label>").append($input, $("<span></span>").text(I18n.t(colour.label))));
      });
    };
    $preset.on("change", () => {
      theme.preset = String($preset.val());
      theme.colours = {};
      theme.apply(base());
      fill();
    });
    const $font = $("<select class=\"form-select form-select-sm\"></select>");
    ThemeSettings.FONTS.forEach(font => {
      $font.append($("<option></option>").attr("value", font).text(font ? font.split(",")[0].replace(/"/g, "") : I18n.t("The default")).prop("selected", font === theme.font));
    });
    $font.on("change", () => {
      theme.font = String($font.val());
      theme.apply(base());
    });
    const $size = $("<input type=\"range\" class=\"form-range\" min=\"80\" max=\"150\" step=\"10\">").val(theme.size).on("change", () => {
      theme.size = Number($size.val());
      theme.apply(base());
    });
    const label = text => $("<label class=\"form-label st-form-label\"></label>").text(text);
    $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Preset")), $preset));
    $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Colours")), $colours));
    $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Font of the code")), $font));
    $form.append($("<div class=\"mb-3\"></div>").append(label(I18n.t("Size of the interface")), $size));
    $form.append($("<label class=\"st-check\"></label>").append($("<input type=\"checkbox\" class=\"form-check-input\" data-key=\"explain\">").prop("checked", Explainer.enabled()),
      $("<span class=\"st-check-name\"></span>").text(I18n.t("Explain the constructs")),
      $("<span class=\"st-check-hint\"></span>").text(I18n.t("A short description shows when the pointer rests on a block of the diagram or on a keyword of the code"))));
    fill();
    return $form;
  }

  /**
   * Writes a CSS colour as #rrggbb, for the colour inputs.
   *
   * @param {string} colour A CSS colour (#rgb, #rrggbb or rgb()).
   * @return {string} The colour as #rrggbb, or black.
   */
  static hex(colour: string): string {
    if (/^#[0-9a-f]{6}$/i.test(colour)) {
      return colour;
    }
    if (/^#[0-9a-f]{3}$/i.test(colour)) {
      return "#" + colour.slice(1).split("").map(c => c + c).join("");
    }
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(colour);
    return match ? "#" + match.slice(1, 4).map(n => Number(n).toString(16).padStart(2, "0")).join("") : "#000000";
  }

  /**
   * Builds the form of the notation: the style of the code, and the
   * conventions of the Design mode.
   *
   * @param {Conventions} conventions The conventions.
   * @param {string} codeStyle The style of the new names and lets that the
   *   diagram adds.
   * @return {jQuery} The form.
   */
  notationForm(conventions: Conventions, codeStyle: string = "model"): JQuery {
    const $form = $("<div></div>");
    const $style = $("<select class=\"form-select form-select-sm\" data-key=\"codeStyle\"></select>");
    SettingsDialog.CODE_STYLES.forEach(item => $style.append($("<option></option>").attr("value", item.value).text(I18n.t(item.label)).prop("selected", item.value === codeStyle)));
    $form.append($("<fieldset class=\"st-conventions mb-3\"></fieldset>").append($("<legend></legend>").text(I18n.t("Code")),
      $("<label class=\"form-label st-form-label\"></label>").text(I18n.t("New names and lets that the diagram adds")), $style,
      $("<div class=\"form-text\"></div>").text(I18n.t("ProVerif 2.05 reads both styles. Edit, Write new and let as in CryptoVerif (or as in ProVerif) rewrites those of the model."))));
    $form.append($("<p class=\"st-muted small\"></p>").text(I18n.t("LaTeX templates of the Design mode: #1, #2 are the parts of the action "
      + "(see the placeholders), # is the identifier in the styles. Hints in the model (@notation, @infix) take precedence.")));
    Conventions.GROUPS.forEach(group => {
      const $group = $("<fieldset class=\"st-conventions\"></fieldset>").append($("<legend></legend>").text(I18n.t(group.title)));
      group.keys.forEach(key => {
        const value = conventions.get(key);
        const colour = /Color$/.test(key);
        const $input = $("<input class=\"form-control form-control-sm st-mono\" spellcheck=\"false\">")
          .attr({ "data-convention": key, type: colour ? "color" : "text", placeholder: Conventions.DEFAULTS[key] })
          .val(value);
        const parts = Conventions.FIELDS[key];
        // A builtin type shows its name
        const name = key.replace(/^type:/, "");
        const $label = $("<label class=\"st-convention-label\"></label>").text(name + (parts ? " (" + parts.map((part, i) => "#" + (i + 1) + " " + I18n.t(part)).join(", ") + ")" : ""));
        const $preview = $("<span class=\"st-convention-preview\"></span>");
        const refresh = () => {
          if (colour) {
            return;
          }
          const sample = String($input.val()).replace(/#(\d)/g, (match, n) => ["x", "y", "z"][Number(n) - 1] || "a").replace(/#\*/g, "x, y").replace(/#/g, "name");
          const error = MathRenderer.error(sample);
          $preview.html(error ? "<span class=\"st-error small\">" + MathRenderer.escape(error) + "</span>" : MathRenderer.html(sample));
        };
        $input.on("input", refresh);
        refresh();
        $group.append($("<div class=\"st-convention\"></div>").append($label, $input, $preview));
      });
      $form.append($group);
    });
    $form.append($("<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\"><i class=\"fas fa-rotate-left\"></i> </button>").append($("<span></span>").text(I18n.t("Restore the defaults")))
      .on("click", () => {
        $form.find("[data-convention]").each(function() {
          $(this).val(Conventions.DEFAULTS[$(this).attr("data-convention")]).trigger("input");
        });
      }));
    return $form;
  }

  /**
   * Reads the forms.
   *
   * @param {jQuery} $engine The form of the engine.
   * @param {jQuery} $notation The form of the notation.
   * @return {Object} The engine settings, the conventions and the style of
   *   the code.
   */
  collect($engine: JQuery, $notation: JQuery) {
    const settings = new EngineSettings({
        maxMemoryMB: Number($engine.find("[data-key=\"maxMemoryMB\"]").val())
      , timeoutSeconds: Number($engine.find("[data-key=\"timeoutSeconds\"]").val())
      , extraArgs: String($engine.find("[data-key=\"extraArgs\"]").val())
      , liveChecks: $engine.find("[data-key=\"liveChecks\"]").prop("checked")
    });
    const overrides = {};
    $notation.find("[data-convention]").each(function() {
      const key = $(this).attr("data-convention");
      const value = String($(this).val());
      if (value !== Conventions.DEFAULTS[key]) {
        overrides[key] = value;
      }
    });
    return { settings: settings, conventions: new Conventions(overrides), codeStyle: String($notation.find("[data-key=\"codeStyle\"]").val() || "model") };
  }
}
// ----------------------------------------------------------------
