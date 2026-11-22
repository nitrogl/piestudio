/**
 * The panel of the declarations: settings, types, names, functions,
 * equations, events, tables, goals and parties, grouped as in the code.
 *
 * Every declaration is one row, shown as a formula in the Design mode and
 * as code in the Expert mode. A click selects it, a double click edits it
 * in a pop-up, a right click opens its menu. Rows can be dragged within
 * their group (jQuery UI sortable) to reorder the declarations in the code.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class DeclarationsPanel {
  /**
   * The groups of the panel: title, icon and kinds of declarations.
   *
   * @type {Array<Object>}
   */
  static GROUPS = [
      { title: I18n.mark("Settings"), icon: "fa-sliders", kinds: ["SetDecl"] }
    , { title: I18n.mark("Types"), icon: "fa-shapes", kinds: ["TypeDecl"] }
    , { title: I18n.mark("Names and channels"), icon: "fa-key", kinds: ["FreeDecl", "ChannelDecl", "ConstDecl"] }
    , { title: I18n.mark("Functions and equations"), icon: "fa-gears", kinds: ["FunDecl", "ReducDecl", "EquationDecl", "DefineDecl", "ExpandDecl", "RawDecl", "DestructorFun"] }
    , { title: I18n.mark("Events, tables, predicates"), icon: "fa-flag", kinds: ["EventDecl", "TableDecl", "PredDecl", "ClausesDecl", "ElimTrueDecl"] }
    , { title: I18n.mark("Term macros"), icon: "fa-calculator", kinds: ["LetFunDecl"] }
    , { title: I18n.mark("Security goals"), icon: "fa-shield-halved", kinds: ["QueryDecl", "LemmaDecl", "NonInterfDecl", "WeakSecretDecl", "NotDecl", "NoUnifDecl"] }
    , { title: I18n.mark("Parties (processes)"), icon: "fa-users", kinds: ["ProcessDecl"] }
  ];

  /**
   * How many rows a group shows before its "show more" button: a model
   * written by a program may have thousands of declarations.
   *
   * @type {number}
   */
  static PAGE = 150;

  handlers: any;
  $body: JQuery<HTMLElement>;
  $filter: JQuery<HTMLElement>;
  $count: JQuery<HTMLElement>;
  selected: number;
  collapsed: Set<any>;
  limits: Map<any, any>;
  last: any;
  filterTimer: number;

  /**
   * @param {Object} params The panel parameters.
   * @param {string} params.body The element of the list.
   * @param {string} params.filter The filter input.
   * @param {string} params.count The element of the count.
   * @param {Object} params.handlers The callbacks: select(index), edit(index),
   *   add(kind), menu(index, x, y), move(index, to).
   */
  constructor(params?: { body?: string; filter?: string; count?: string; handlers?: any }) {
    const defaults = {
        body: "#declarations"
      , filter: "#declarations-filter"
      , count: "#declarations-count"
      , handlers: {}
    };
    params = {...defaults, ...params};
    this.handlers = {
        select: () => {}
      , edit: () => {}
      , add: () => {}
      , menu: () => {}
      , move: () => {}
      , removeLibrary: () => {}
      , ...params.handlers
    };
    this.$body = $(params.body);
    this.$filter = $(params.filter);
    this.$count = $(params.count);
    this.selected = null;
    this.collapsed = new Set();
    this.limits = new Map();
    this.last = null;
    this.bind();
  }

  /**
   * Listens to the user.
   */
  bind() {
    const panel = this;
    // The buttons of the libraries, before those that add a declaration
    this.$body.on("click", ".st-library-remove", function(event) {
      event.stopImmediatePropagation();
      panel.handlers.removeLibrary(Number($(this).closest(".st-library").attr("data-library")));
    });
    this.$body.on("click", ".st-library-edit", function(event) {
      event.stopImmediatePropagation();
      panel.handlers.editLibrary(Number($(this).closest(".st-library").attr("data-library")));
    });
    this.$body.on("click", ".st-library-open", function(event) {
      event.stopImmediatePropagation();
      panel.handlers.openLibrary();
    });
    this.$body.on("click", ".st-decl", function() {
      panel.handlers.select(Number($(this).attr("data-index")));
    });
    this.$body.on("dblclick", ".st-decl", function() {
      panel.handlers.edit(Number($(this).attr("data-index")));
    });
    this.$body.on("contextmenu", ".st-decl", function(event) {
      event.preventDefault();
      const index = Number($(this).attr("data-index"));
      panel.handlers.select(index);
      panel.handlers.menu(index, event.clientX, event.clientY);
    });
    this.$body.on("click", ".st-group-title", function() {
      const title = $(this).closest(".st-group").attr("data-title");
      if (panel.collapsed.has(title)) {
        panel.collapsed.delete(title);
      } else {
        panel.collapsed.add(title);
      }
      $(this).closest(".st-group").toggleClass("st-collapsed", panel.collapsed.has(title));
    });
    this.$body.on("click", ".st-group-add", function(event) {
      event.stopPropagation();
      panel.handlers.add($(this).attr("data-kind"), this);
    });
    this.$body.on("click", ".st-more", function() {
      const title = $(this).closest(".st-group").attr("data-title");
      panel.limits.set(title, (panel.limits.get(title) || DeclarationsPanel.PAGE) + DeclarationsPanel.PAGE);
      panel.redraw();
    });
    // Sortables are slow to set up on long lists: I make them when the
    // pointer comes near a list, not at every drawing
    this.$body.on("mouseenter", ".st-decl-list", function() {
      panel.makeSortable($(this));
    });
    this.$filter.on("input", () => {
      clearTimeout(this.filterTimer);
      this.filterTimer = setTimeout(() => this.redraw(), 150);
    });
  }

  /**
   * Draws the declarations again, with the last model drawn.
   */
  redraw() {
    if (this.last) {
      this.render(this.last.analysis, this.last.options);
    }
  }

  /**
   * Draws the declarations of a model.
   *
   * @param {Analysis} analysis The analysis of the model.
   * @param {Object} options How to draw it.
   * @param {string} options.mode "design" or "expert".
   * @param {LatexWriter} options.writer The writer of formulas.
   */
  render(analysis: Analysis, options?: any) {
    this.last = { analysis: analysis, options: options };
    const decls = analysis.program.decls;
    const needle = String(this.$filter.val() || "").trim().toLowerCase();
    const scroll = this.$body.scrollTop();
    this.$body.empty();
    this.$count.text(decls.length);
    if ((options.libraries && options.libraries.length) || analysis.missingLibraries.length) {
      this.$body.append(this.librariesElement(options.libraries || [], analysis));
    }
    DeclarationsPanel.GROUPS.forEach(group => {
      const members = [];
      decls.forEach((decl, index) => {
        const spec = DeclSpecs.specOf(decl);
        if (group.kinds.includes(spec.key) || group.kinds.includes(decl.kind)) {
          members.push({ decl: decl, index: index, spec: spec });
        }
      });
      const matching = needle === "" ? members : members.filter(member => {
        return analysis.text.slice(member.decl.start, member.decl.end).toLowerCase().includes(needle);
      });
      const limit = this.limits.get(group.title) || DeclarationsPanel.PAGE;
      const rows = matching.slice(0, limit).map(member => this.rowElement(analysis, member.decl, member.index, member.spec, options));
      const $group = $("<div class=\"st-group\"></div>").attr("data-title", group.title)
        .toggleClass("st-collapsed", this.collapsed.has(group.title));
      const $title = $("<div class=\"st-group-title\"></div>")
        .append("<i class=\"fas fa-chevron-down st-chevron\"></i>", "<i class=\"fas " + group.icon + "\"></i>",
          $("<span></span>").text(I18n.t(group.title)), $("<span class=\"st-count\"></span>").text(matching.length));
      const kind = group.kinds[0];
      $title.append($("<button type=\"button\" class=\"st-group-add\"></button>").attr({ "data-kind": kind, title: I18n.t("Add") })
        .append("<i class=\"fas fa-plus\"></i>"));
      const $list = $("<div class=\"st-decl-list\"></div>").append(rows).toggleClass("st-filtered", needle !== "");
      if (matching.length > rows.length) {
        $list.append($("<button type=\"button\" class=\"btn btn-sm btn-link st-more\"></button>")
          .text(I18n.t("Show more ({count} not shown)", { count: matching.length - rows.length })));
      }
      if (members.length === 0) {
        $list.append($("<div class=\"st-empty\"></div>").text(I18n.t("None yet")));
      } else if (matching.length === 0) {
        $list.append($("<div class=\"st-empty\"></div>").text(I18n.t("None matches")));
      }
      $group.append($title, $list);
      this.$body.append($group);
    });
    this.setSelected(this.selected);
    this.$body.scrollTop(scroll);
  }

  /**
   * Builds the group of the libraries: their names, how many
   * declarations they bring, their problems, and buttons to edit and to
   * remove them; those that the model names (@library) and that are
   * missing, with a button to open them; and, when the model names its
   * libraries, the others are marked as not used.
   *
   * @param {Array<Object>} libraries The libraries, {name, text}.
   * @param {Analysis} analysis The analysis of the model.
   * @return {jQuery} The group.
   */
  librariesElement(libraries: any[], analysis: Analysis): JQuery {
    const $group = $("<div class=\"st-group st-libraries\"></div>").attr("data-title", "Libraries");
    $group.append($("<div class=\"st-group-title\"></div>").append("<i class=\"fas fa-chevron-down st-chevron\"></i>", "<i class=\"fas fa-book\"></i>",
      $("<span></span>").text(I18n.t("Libraries (-lib)")), $("<span class=\"st-count\"></span>").text(libraries.length)));
    const $list = $("<div class=\"st-decl-list\"></div>");
    libraries.forEach((library, index) => {
      const count = PvParser.parse(library.text).program.decls.length;
      const used = analysis.libraries.includes(library);
      const problems = (analysis.libraryProblems || []).filter(problem => problem.library === library.name && problem.severity === "error").length;
      const $row = $("<div class=\"st-decl st-library\"></div>").attr({ "data-library": index, title: I18n.n("{name}: {count} declaration", "{name}: {count} declarations", count, { name: library.name }) })
        .toggleClass("st-unused", !used);
      $row.append("<span class=\"st-decl-keyword\">lib</span>", $("<span class=\"st-decl-label st-code\"></span>").text(library.name),
        $("<span class=\"st-modifier\"></span>").text(used ? I18n.t("{count} decl.", { count: count }) : I18n.t("not used by this model")));
      if (problems) {
        $row.append($("<span class=\"st-modifier st-error\"></span>").text(I18n.n("{count} error", "{count} errors", problems)));
      }
      $row.append($("<button type=\"button\" class=\"st-group-add st-library-edit\"><i class=\"fas fa-pen\"></i></button>").attr("title", I18n.t("Edit the library")),
        $("<button type=\"button\" class=\"st-group-add st-library-remove\"><i class=\"fas fa-xmark\"></i></button>").attr("title", I18n.t("Remove the library")));
      $list.append($row);
    });
    analysis.missingLibraries.forEach(item => {
      $list.append($("<div class=\"st-decl st-library st-missing\"></div>").attr("title", I18n.t("The model needs {name} (@library): open it", { name: item.name }))
        .append("<span class=\"st-decl-keyword\">lib</span>", $("<span class=\"st-decl-label st-code\"></span>").text(item.name),
          $("<span class=\"st-modifier st-error\"></span>").text(I18n.t("missing")),
          $("<button type=\"button\" class=\"st-group-add st-library-open\"><i class=\"fas fa-folder-open\"></i></button>").attr("title", I18n.t("Open a library (.pvl)..."))));
    });
    return $group.append($list);
  }

  /**
   * Lets the rows of a list be dragged to reorder the declarations in the
   * code (not while the list is filtered: the neighbours would be hidden).
   *
   * @param {jQuery} $list The list of a group.
   */
  makeSortable($list: JQuery) {
    if ($list.hasClass("ui-sortable") || $list.hasClass("st-filtered")) {
      return;
    }
    $list.sortable({
        items: "> .st-decl"
      , axis: "y"
      , distance: 6
      , placeholder: "st-decl-placeholder"
      , stop: (event, ui) => {
          const from = Number(ui.item.attr("data-index"));
          const $next = ui.item.next(".st-decl");
          const $previous = ui.item.prev(".st-decl");
          $(event.target).sortable("cancel");
          let to = null;
          if ($next.length) {
            to = Number($next.attr("data-index"));
            to = to > from ? to - 1 : to;
          } else if ($previous.length) {
            to = Number($previous.attr("data-index"));
            to = to > from ? to : to + 1;
          }
          if (to !== null && to !== from) {
            this.handlers.move(from, to);
          }
        }
    });
  }

  /**
   * Builds the row of a declaration.
   *
   * @param {Analysis} analysis The analysis of the model.
   * @param {Object} decl The declaration.
   * @param {number} index Its index in the model.
   * @param {Object} spec Its specification (DeclSpecs).
   * @param {Object} options The mode and the writer.
   * @return {jQuery} The row.
   */
  rowElement(analysis: Analysis, decl: any, index: number, spec: any, options: any): JQuery {
    const source = analysis.text.slice(decl.start, decl.end);
    const $row = $("<div class=\"st-decl\"></div>").attr({ "data-index": index, "data-kind": decl.kind, title: source })
      .addClass("st-d-" + decl.kind.toLowerCase());
    let html = null;
    if (options.mode === "design" && options.writer) {
      try {
        const tex = options.writer.declaration(decl);
        html = MathRenderer.fits(tex) ? MathRenderer.html(tex) : null;
      } catch (e) {
        html = null;
      }
    }
    const keyword = $("<span class=\"st-decl-keyword\"></span>").text(spec.keyword || "");
    const $label = $("<span class=\"st-decl-label\"></span>");
    if (html) {
      $label.addClass("st-math").html(html);
    } else {
      $label.addClass("st-code").text(DeclarationsPanel.summary(source, spec.keyword));
    }
    $row.append(keyword, $label);
    for (const option of (decl.options || []).map(o => o.name && o.name.name).filter(Boolean)) {
      $row.append($("<span class=\"st-modifier\"></span>").text(option));
    }
    return $row;
  }

  /**
   * Shortens the code of a declaration for its row.
   *
   * @param {string} source The code of the declaration.
   * @param {string} keyword Its keyword, which the row shows apart.
   * @return {string} The rest of its first line.
   */
  static summary(source: string, keyword: string): string {
    let text = source.replace(/\(\*[\s\S]*?\*\)/g, " ").replace(/\s+/g, " ").trim();
    if (keyword && text.startsWith(keyword + " ")) {
      text = text.slice(keyword.length + 1);
    }
    text = text.replace(/\[[^\]]*\]\s*\.?$/, "").replace(/\.$/, "");
    return text.length > 70 ? text.slice(0, 68) + "..." : text;
  }

  /**
   * Marks the selected declaration.
   *
   * @param {number|null} index The declaration, or null.
   */
  setSelected(index: number | null) {
    this.selected = index;
    this.$body.find(".st-selected").removeClass("st-selected");
    if (index !== null && index !== undefined) {
      const $row = this.$body.find(".st-decl[data-index=\"" + index + "\"]").addClass("st-selected");
      if ($row.length) {
        $row[0].scrollIntoView({ block: "nearest" });
      }
    }
  }
}
// ----------------------------------------------------------------
