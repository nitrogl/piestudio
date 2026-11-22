/**
 * The languages of PieStudio, written from the files of lang/ by
 * scripts/build-i18n.js, or by the studio itself (View, Language): do
 * not edit by hand. The template lists the messages of the studio, for
 * the file to translate that it gives, and each language is a PO file of
 * lang/, without the messages that are not translated yet, which show in
 * English.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
I18n.setTemplate([
    ["About PieStudio", null, "index.html:20 index.html:82 src/app/controller/PieStudio.ts:1540"]
  , ["Model file", null, "index.html:23"]
  , ["File", null, "index.html:27 src/app/model/ReportWriter.ts:46 src/app/view/BottomPanel.ts:170"]
  , ["New model", null, "index.html:29"]
  , ["Open a model (.pv, .pp)...", null, "index.html:30"]
  , ["Ctrl+O", null, "index.html:30"]
  , ["Save the model (.pv)", null, "index.html:31"]
  , ["Ctrl+S", null, "index.html:31"]
  , ["Export for ProVerif...", null, "index.html:32"]
  , ["Ctrl+E", null, "index.html:32"]
  , ["Open a library (.pvl)...", null, "index.html:33 src/app/view/DeclarationsPanel.ts:242"]
  , ["LaTeX of the protocol (TikZ)...", null, "index.html:34"]
  , ["Examples", null, "index.html:36"]
  , ["Edit", null, "index.html:41 studio-core/src/text/EditHistory.ts:57 src/app/controller/PieStudio.ts:1102 src/app/controller/PieStudio.ts:1274"]
  , ["Undo", null, "index.html:43"]
  , ["Ctrl+Z", null, "index.html:43"]
  , ["Redo", null, "index.html:44"]
  , ["Ctrl+Shift+Z", null, "index.html:44"]
  , ["Add a party", null, "index.html:46"]
  , ["Rename everywhere", null, "index.html:47 index.html:226 src/app/controller/PieStudio.ts:1275"]
  , ["Refactor in the selection...", null, "index.html:48"]
  , ["Shift+F2", null, "index.html:48"]
  , ["Write new and let as in CryptoVerif", null, "index.html:49"]
  , ["k <-R key; and x <- M;", null, "index.html:49"]
  , ["Write new and let as in ProVerif", null, "index.html:50"]
  , ["new k: key; and let x = M in", null, "index.html:50"]
  , ["Delete the selection", null, "index.html:51 index.html:225"]
  , ["Del", null, "index.html:51 index.html:225 src/app/controller/PieStudio.ts:1120 src/app/controller/PieStudio.ts:1279"]
  , ["Active or passive attacker", null, "index.html:53"]
  , ["View", null, "index.html:57 index.html:97"]
  , ["Design mode (formulas)", null, "index.html:59"]
  , ["Expert mode (ProVerif)", null, "index.html:60"]
  , ["Diagram", null, "index.html:62 index.html:98 index.html:136"]
  , ["Diagram and code", null, "index.html:63 index.html:99"]
  , ["Code", null, "index.html:64 index.html:100 index.html:153 src/app/view/SettingsDialog.ts:234"]
  , ["Zoom in", null, "index.html:66 index.html:141"]
  , ["Zoom out", null, "index.html:67 index.html:140"]
  , ["Actual size", null, "index.html:68"]
  , ["Light or dark theme", null, "index.html:70"]
  , ["Notation...", null, "index.html:71"]
  , ["Theme...", null, "index.html:72"]
  , ["Language...", null, "index.html:73"]
  , ["Help", null, "index.html:77"]
  , ["User guide", null, "index.html:79"]
  , ["Keyboard shortcuts", null, "index.html:80 src/app/controller/PieStudio.ts:1547"]
  , ["ProVerif manual (online)", null, "index.html:81"]
  , ["Undo (Ctrl+Z)", null, "index.html:88"]
  , ["Redo (Ctrl+Shift+Z)", null, "index.html:89"]
  , ["Mode", null, "index.html:93"]
  , ["Design mode: blocks as formulas (F9)", null, "index.html:94"]
  , ["Design", null, "index.html:94"]
  , ["Expert mode: blocks as ProVerif code (F9)", null, "index.html:95"]
  , ["Expert", null, "index.html:95"]
  , ["Verify with ProVerif 2.05 (F5)", null, "index.html:103"]
  , ["Verify", null, "index.html:103 index.html:106 src/app/controller/Verifier.ts:318"]
  , ["Verification options", null, "index.html:104"]
  , ["Stop the verification", null, "index.html:107"]
  , ["Verify as I edit", null, "index.html:108"]
  , ["Report of the verification (HTML)", null, "index.html:109"]
  , ["Engine settings (memory, time)...", null, "index.html:111"]
  , ["Declarations", null, "index.html:121"]
  , ["Filter declarations", null, "index.html:126"]
  , ["Add a party (a process macro)", null, "index.html:137"]
  , ["active attacker", null, "index.html:139 src/app/controller/PieStudio.ts:489"]
  , ["The code has syntax errors: the diagram and the declarations show the last version that parsed.", null, "index.html:143"]
  , ["Problems", null, "index.html:164"]
  , ["Results", null, "index.html:165"]
  , ["Attack trace", null, "index.html:166"]
  , ["ProVerif output", null, "index.html:167"]
  , ["History", null, "index.html:168"]
  , ["Hide or show the panel", null, "index.html:170"]
  , ["Close", null, "index.html:189 studio-core/src/view/Dialogs.ts:95 studio-core/src/view/Toast.ts:33 src/app/controller/Toolbox.ts:337 src/app/controller/PieStudio.ts:1525"]
  , ["The model never leaves your computer.", null, "index.html:209"]
  , ["<b>PieStudio</b> is a visual editor for ProVerif models. Each block of the diagram is one construct of ProVerif's typed pi calculus; the diagram and the code are two views of the same model, and ProVerif 2.05 verifies it in your browser.", null, "index.html:212"]
  , ["Free software: you can redistribute it and modify it under the terms of the GNU General Public License, version 2 or (at your option) any later version (COPYING). Roberto Metere.", null, "index.html:213"]
  , ["The verifier is ProVerif 2.05 by Bruno Blanchet, Vincent Cheval and Marc Sylvestre (INRIA, CNRS), as ProVerif for WebAssembly: compiled with the OCaml 4.14 runtime to WebAssembly by Roberto Metere, and distributed under the GNU GPL v2 or later (engine/NOTICE, engine/COPYING; the OCaml runtime is under the LGPL 2.1 with the OCaml linking exception, engine/LICENSE-OCaml.txt, and the parts of Emscripten under the MIT licence, engine/LICENSE-Emscripten.txt). Studio Core, the parts that PieStudio shares with CryStudio, is by Roberto Metere under the MIT licence (studio-core/LICENSE). Bootstrap, jQuery, jQuery UI and KaTeX are under the MIT licence; Font Awesome Free under the SIL OFL (fonts) and MIT (code).", null, "index.html:214"]
  , ["Verify with ProVerif", null, "index.html:220"]
  , ["Design or Expert mode", null, "index.html:221"]
  , ["Ctrl", null, "index.html:222 index.html:223 index.html:228"]
  , ["Shift", null, "index.html:222 index.html:227"]
  , ["Undo, redo (no limit)", null, "index.html:222"]
  , ["Open, save, export", null, "index.html:223"]
  , ["Enter", null, "index.html:224 src/app/controller/PieStudio.ts:1102 src/app/controller/PieStudio.ts:1274"]
  , ["double click", null, "index.html:224"]
  , ["Edit the selected block or declaration", null, "index.html:224"]
  , ["Refactor in the selection", null, "index.html:227"]
  , ["click", null, "index.html:228"]
  , ["Go to the declaration (in the code)", null, "index.html:228"]
  , ["Right click", null, "index.html:229"]
  , ["The menu of a block or a declaration", null, "index.html:229"]
  , ["The file does not say its language: write its code after Language, in its header (Language: zh for Chinese).", null, "studio-core/src/text/I18n.ts:933"]
  , ["the translation leaves out {placeholders}", null, "studio-core/src/text/I18n.ts:1006"]
  , ["the translation has {placeholders}, which the message does not have", null, "studio-core/src/text/I18n.ts:1010"]
  , ["the translation has tags or links that the message does not have", null, "studio-core/src/text/I18n.ts:1014"]
  , ["variables", null, "studio-core/src/notation/Conventions.ts:65 src/app/language/PvLanguage.ts:64"]
  , ["formula", null, "studio-core/src/notation/Conventions.ts:65"]
  , ["Terms", null, "studio-core/src/notation/Conventions.ts:75 src/app/language/PvLanguage.ts:71"]
  , ["Identifiers", null, "studio-core/src/notation/Conventions.ts:76"]
  , ["Colours", null, "studio-core/src/notation/Conventions.ts:77 src/app/language/PvLanguage.ts:73 src/app/view/SettingsDialog.ts:194"]
  , ["a brace } closes no {", null, "studio-core/src/notation/LatexLexer.ts:92"]
  , ["a brace { is not closed", null, "studio-core/src/notation/LatexLexer.ts:97 studio-core/src/notation/LatexLexer.ts:166"]
  , ["@{kind}: the name of a convention is expected", null, "studio-core/src/notation/HintParser.ts:172"]
  , ["@{kind}: a name is expected, the same on an output and on the inputs that receive it", null, "studio-core/src/notation/HintParser.ts:182"]
  , ["@{kind}: a quoted colour is expected", null, "studio-core/src/notation/HintParser.ts:194"]
  , ["@{kind}: a quoted text is expected", null, "studio-core/src/notation/HintParser.ts:194"]
  , ["@{kind}: the quote is not closed", null, "studio-core/src/notation/HintParser.ts:215"]
  , ["@convention: unknown convention {name}", null, "studio-core/src/notation/NotationTable.ts:140"]
  , ["@{kind} in a .pp file needs an explicit target", null, "studio-core/src/notation/NotationTable.ts:162"]
  , ["@{kind}: I cannot tell what this hint applies to; name its target after it", null, "studio-core/src/notation/NotationTable.ts:163"]
  , ["@inout goes in a comment just before an output or an input", null, "studio-core/src/notation/NotationTable.ts:186"]
  , ["@inout {name}: no input has this name", null, "studio-core/src/notation/NotationTable.ts:202"]
  , ["@inout {name}: no output has this name", null, "studio-core/src/notation/NotationTable.ts:204"]
  , ["@{kind}: {name} is not declared", null, "studio-core/src/notation/NotationTable.ts:234"]
  , ["@{kind}: {name} has {count} argument; an infix notation needs 2", "@{kind}: {name} has {count} arguments; an infix notation needs 2", "studio-core/src/notation/NotationTable.ts:290"]
  , ["@{kind}: {name} has {count} argument; a prefix notation needs 1", "@{kind}: {name} has {count} arguments; a prefix notation needs 1", "studio-core/src/notation/NotationTable.ts:297"]
  , ["@{kind}: {name} has {count} argument; a postfix notation needs 1", "@{kind}: {name} has {count} arguments; a postfix notation needs 1", "studio-core/src/notation/NotationTable.ts:304"]
  , ["@notation: {name} has {count} argument but the notation uses #{hole}", "@notation: {name} has {count} arguments but the notation uses #{hole}", "studio-core/src/notation/NotationTable.ts:320"]
  , ["{language} code of the model", null, "studio-core/src/view/CodeView.ts:131"]
  , ["F2 renames, F12 goes to the declaration", null, "studio-core/src/view/CodeView.ts:730"]
  , ["Cancel", null, "studio-core/src/view/Dialogs.ts:207 studio-core/src/view/Dialogs.ts:260 studio-core/src/view/FileEditor.ts:80 studio-core/src/view/RefactorBar.ts:70 src/app/view/DeclarationDialog.ts:122 src/app/view/ActionDialog.ts:181 src/app/view/SettingsDialog.ts:104"]
  , ["OK", null, "studio-core/src/view/Dialogs.ts:208 studio-core/src/view/Dialogs.ts:261 src/app/controller/PieStudio.ts:497 src/app/controller/PieStudio.ts:499"]
  , ["{count} error: {message}", "{count} errors, the first: {message}", "studio-core/src/view/FileEditor.ts:60"]
  , ["No problems in {name}.", null, "studio-core/src/view/FileEditor.ts:61"]
  , ["Save the file", null, "studio-core/src/view/FileEditor.ts:76"]
  , ["Apply", null, "studio-core/src/view/FileEditor.ts:81 studio-core/src/view/RefactorBar.ts:69 src/app/view/DeclarationDialog.ts:123 src/app/view/ActionDialog.ts:182"]
  , ["Edit the code", null, "studio-core/src/view/FileEditor.ts:88 src/app/controller/PieStudio.ts:921"]
  , ["Studio (default)", null, "studio-core/src/view/ThemeSettings.ts:20"]
  , ["Midnight", null, "studio-core/src/view/ThemeSettings.ts:22"]
  , ["Paper (for printing and slides)", null, "studio-core/src/view/ThemeSettings.ts:27"]
  , ["High contrast", null, "studio-core/src/view/ThemeSettings.ts:32"]
  , ["Solarized light", null, "studio-core/src/view/ThemeSettings.ts:37"]
  , ["Accent", null, "studio-core/src/view/ThemeSettings.ts:50"]
  , ["Background", null, "studio-core/src/view/ThemeSettings.ts:51"]
  , ["Parties", null, "studio-core/src/view/ThemeSettings.ts:52"]
  , ["Calls", null, "studio-core/src/view/ThemeSettings.ts:58"]
  , ["Rename", null, "studio-core/src/view/RefactorBar.ts:66"]
  , ["to", null, "studio-core/src/view/RefactorBar.ts:66"]
  , ["all", null, "studio-core/src/view/RefactorBar.ts:67"]
  , ["none", null, "studio-core/src/view/RefactorBar.ts:68"]
  , ["lines {from} to {to}", null, "studio-core/src/view/RefactorBar.ts:100"]
  , ["the whole model", null, "studio-core/src/view/RefactorBar.ts:101"]
  , ["{included} of {total} in {range}", null, "studio-core/src/view/RefactorBar.ts:102"]
  , ["Type the new name: nothing changes until you apply it. Click an occurrence in the code to leave it out.", null, "studio-core/src/view/RefactorBar.ts:106"]
  , ["line {number}", null, "studio-core/src/view/RefactorBar.ts:114 src/app/view/BottomPanel.ts:110"]
  , ["and {count} more line", "and {count} more lines", "studio-core/src/view/RefactorBar.ts:118"]
  , ["Double click to edit the party", null, "studio-core/src/view/DiagramView.ts:233"]
  , ["No process runs this party", null, "studio-core/src/view/DiagramView.ts:242"]
  , ["unused", null, "studio-core/src/view/DiagramView.ts:242"]
  , ["Symmetric role: shown with its mirrored copy. Click to show it once.", null, "studio-core/src/view/DiagramView.ts:247"]
  , ["Symmetric role? Show it with a mirrored copy", null, "studio-core/src/view/DiagramView.ts:247"]
  , ["Show this party as code", null, "studio-core/src/view/DiagramView.ts:252"]
  , ["Show this party as formulas", null, "studio-core/src/view/DiagramView.ts:252"]
  , ["Add an action here", null, "studio-core/src/view/DiagramView.ts:285"]
  , ["End of the process", null, "studio-core/src/view/DiagramView.ts:308"]
  , ["Show the other way", null, "studio-core/src/view/DiagramView.ts:327"]
  , ["runs process {number}", null, "studio-core/src/view/DiagramView.ts:370"]
  , ["runs {name}", null, "studio-core/src/view/DiagramView.ts:370"]
  , ["any number of copies", null, "studio-core/src/view/DiagramView.ts:385"]
  , ["{count} process in parallel", "{count} processes in parallel", "studio-core/src/view/DiagramView.ts:387"]
  , ["Message {name} on {channel} (private channel)", null, "studio-core/src/view/DiagramView.ts:740"]
  , ["Message {name} on {channel}", null, "studio-core/src/view/DiagramView.ts:740"]
  , ["Message {name}", null, "studio-core/src/view/DiagramView.ts:743"]
  , ["Message on {channel} (private channel)", null, "studio-core/src/view/DiagramView.ts:746"]
  , ["Message on {channel}", null, "studio-core/src/view/DiagramView.ts:746"]
  , ["Message", null, "studio-core/src/view/DiagramView.ts:748 src/app/view/ActionDialog.ts:30"]
  , ["Load a translation (.po)...", null, "studio-core/src/view/LanguagePane.ts:82"]
  , ["Download the file to translate (.pot)", null, "studio-core/src/view/LanguagePane.ts:86"]
  , ["Download languages.js", null, "studio-core/src/view/LanguagePane.ts:99"]
  , ["Language of the interface", null, "studio-core/src/view/LanguagePane.ts:103"]
  , ["When the settings are saved, the page loads again in the language chosen, with the model and the history of its changes.", null, "studio-core/src/view/LanguagePane.ts:104"]
  , ["Translate {app}", null, "studio-core/src/view/LanguagePane.ts:106"]
  , ["Hand the file to translate to whoever knows another language: they write the translation of each message after msgstr, with a text editor or with Poedit, and load the file here to see it at once.", null, "studio-core/src/view/LanguagePane.ts:107"]
  , ["To give a translation to everyone who opens {app}, load it here, then put the languages.js that this pane gives in the folder lang/, next to the page, in place of the one there. Keep the translation in lang/ too, for later changes.", null, "studio-core/src/view/LanguagePane.ts:108"]
  , ["Automatic: the language of the browser ({name})", null, "studio-core/src/view/LanguagePane.ts:124"]
  , ["{name} (loaded)", null, "studio-core/src/view/LanguagePane.ts:127"]
  , ["Loaded by you: {name} ({code})", null, "studio-core/src/view/LanguagePane.ts:137"]
  , ["Remove", null, "studio-core/src/view/LanguagePane.ts:138 src/app/view/FormBuilder.ts:306"]
  , ["The messages of {app} are written in English.", null, "studio-core/src/view/LanguagePane.ts:168"]
  , ["All {total} messages are translated.", null, "studio-core/src/view/LanguagePane.ts:176"]
  , ["{translated} of {total} messages are translated; the others show in English.", null, "studio-core/src/view/LanguagePane.ts:177"]
  , ["Download {name} to improve it (.po)", null, "studio-core/src/view/LanguagePane.ts:178"]
  , ["Loaded {file}: {name} ({code}), {translated} of {total} messages. Save the settings to see it.", null, "studio-core/src/view/LanguagePane.ts:206"]
  , ["{count} line could not be read: {lines}", "{count} lines could not be read: {lines}", "studio-core/src/view/LanguagePane.ts:216"]
  , ["The file does not give the plural forms of the language: write them after Plural-Forms, in its header (see the comments at its top). Until then, plurals show as in English.", null, "studio-core/src/view/LanguagePane.ts:222"]
  , ["Line {line}: {reason}; the message shows in English.", null, "studio-core/src/view/LanguagePane.ts:228"]
  , ["And {count} more.", "And {count} more.", "studio-core/src/view/LanguagePane.ts:231"]
  , ["An active attacker reads, writes and blocks public channels; a passive one only listens.", null, "src/app/language/PvSettings.ts:24"]
  , ["Compromise of session keys of other sessions.", null, "src/app/language/PvSettings.ts:25"]
  , ["Allow private communications on public terms.", null, "src/app/language/PvSettings.ts:26"]
  , ["Allow choice/diff inside patterns.", null, "src/app/language/PvSettings.ts:27"]
  , ["Make every input, get and let...suchthat precise.", null, "src/app/language/PvSettings.ts:28"]
  , ["Ignore types during verification (types are still checked when parsing).", null, "src/app/language/PvSettings.ts:29"]
  , ["Move restrictions downwards before translating to clauses.", null, "src/app/language/PvSettings.ts:30"]
  , ["Move let bindings downwards before translating to clauses.", null, "src/app/language/PvSettings.ts:31"]
  , ["Include terms of the equational theory in the arguments of names.", null, "src/app/language/PvSettings.ts:32"]
  , ["Expand let terms precisely.", null, "src/app/language/PvSettings.ts:33"]
  , ["Prove lemmas by induction by default.", null, "src/app/language/PvSettings.ts:34"]
  , ["Prove queries by induction by default.", null, "src/app/language/PvSettings.ts:35"]
  , ["Remove events that are only used by lemmas.", null, "src/app/language/PvSettings.ts:36"]
  , ["How lemmas are applied during saturation.", null, "src/app/language/PvSettings.ts:37"]
  , ["How lemmas are applied during verification.", null, "src/app/language/PvSettings.ts:38"]
  , ["Display the application of lemmas.", null, "src/app/language/PvSettings.ts:39"]
  , ["Ignore nounif declarations a few times.", null, "src/app/language/PvSettings.ts:40"]
  , ["How many times nounif declarations are ignored.", null, "src/app/language/PvSettings.ts:41"]
  , ["Selection function of the resolution.", null, "src/app/language/PvSettings.ts:42"]
  , ["Stop when the resolution may not terminate.", null, "src/app/language/PvSettings.ts:43"]
  , ["Elimination of redundant clauses.", null, "src/app/language/PvSettings.ts:44"]
  , ["Elimination of redundant hypotheses.", null, "src/app/language/PvSettings.ts:45"]
  , ["Maximum depth of terms in clauses (an approximation).", null, "src/app/language/PvSettings.ts:46"]
  , ["Maximum number of hypotheses of clauses (an approximation).", null, "src/app/language/PvSettings.ts:47"]
  , ["Maximum length of chains of inequalities.", null, "src/app/language/PvSettings.ts:48"]
  , ["Simplify equalities at the end of saturation.", null, "src/app/language/PvSettings.ts:49"]
  , ["Check that all terms of clauses are in normal form.", null, "src/app/language/PvSettings.ts:50"]
  , ["Treatment of equations.", null, "src/app/language/PvSettings.ts:51"]
  , ["Ordering of function symbols for the termination of equations.", null, "src/app/language/PvSettings.ts:52"]
  , ["Check that predicates can be implemented.", null, "src/app/language/PvSettings.ts:53"]
  , ["Threshold for cleaning up the clause database (percent).", null, "src/app/language/PvSettings.ts:54"]
  , ["Maximum depth of the unification index.", null, "src/app/language/PvSettings.ts:55"]
  , ["Reconstruct attack traces (yes, no, or the number of attempts).", null, "src/app/language/PvSettings.ts:56"]
  , ["Backtrack when reconstructing traces.", null, "src/app/language/PvSettings.ts:57"]
  , ["Unify derivations to help trace reconstruction.", null, "src/app/language/PvSettings.ts:58"]
  , ["Reconstruct derivations.", null, "src/app/language/PvSettings.ts:59"]
  , ["Simplify derivations.", null, "src/app/language/PvSettings.ts:60"]
  , ["Explain derivations in English.", null, "src/app/language/PvSettings.ts:61"]
  , ["Display derivations.", null, "src/app/language/PvSettings.ts:62"]
  , ["Abbreviate names in derivations.", null, "src/app/language/PvSettings.ts:63"]
  , ["How attack traces are displayed.", null, "src/app/language/PvSettings.ts:64"]
  , ["Display the generated clauses.", null, "src/app/language/PvSettings.ts:65"]
  , ["Remove subsumed clauses before displaying them.", null, "src/app/language/PvSettings.ts:66"]
  , ["Abbreviate clauses when displaying them.", null, "src/app/language/PvSettings.ts:67"]
  , ["Use ANSI colours in the output.", null, "src/app/language/PvSettings.ts:68"]
  , ["Display the clause database.", null, "src/app/language/PvSettings.ts:69"]
  , ["Display statistics while saturating.", null, "src/app/language/PvSettings.ts:70"]
  , ["Display \"goal reachable\" clauses.", null, "src/app/language/PvSettings.ts:71"]
  , ["Display rules.", null, "src/app/language/PvSettings.ts:72"]
  , ["Display redundant clauses.", null, "src/app/language/PvSettings.ts:73"]
  , ["Display completed clauses.", null, "src/app/language/PvSettings.ts:74"]
  , ["Display information on equations.", null, "src/app/language/PvSettings.ts:75"]
  , ["Display termination warnings.", null, "src/app/language/PvSettings.ts:76"]
  , ["Display information on destructors.", null, "src/app/language/PvSettings.ts:77"]
  , ["Simplify biprocesses before proving equivalences.", null, "src/app/language/PvSettings.ts:78"]
  , ["Reject simplified processes containing choice[true, false].", null, "src/app/language/PvSettings.ts:79"]
  , ["Reject processes that cannot be simplified.", null, "src/app/language/PvSettings.ts:80"]
  , ["Simplify tests on constants when expanding terms.", null, "src/app/language/PvSettings.ts:81"]
  , ["Deprecated.", null, "src/app/language/PvSettings.ts:82"]
  , ["Choose swappings of synchronisations interactively.", null, "src/app/language/PvSettings.ts:83"]
  , ["Swapping of synchronisations, e.g. \"tag1 -> tag2\".", null, "src/app/language/PvSettings.ts:84"]
  , ["Record features of clauses.", null, "src/app/language/PvSettings.ts:85"]
  , ["Record function symbols as features.", null, "src/app/language/PvSettings.ts:86"]
  , ["Record names as features.", null, "src/app/language/PvSettings.ts:87"]
  , ["Record predicates as features.", null, "src/app/language/PvSettings.ts:88"]
  , ["Record events as features.", null, "src/app/language/PvSettings.ts:89"]
  , ["Record tables as features.", null, "src/app/language/PvSettings.ts:90"]
  , ["Record the depth of terms as a feature.", null, "src/app/language/PvSettings.ts:91"]
  , ["Record the width of terms as a feature.", null, "src/app/language/PvSettings.ts:92"]
  , ["Attacker model", null, "src/app/language/PvSettings.ts:101"]
  , ["Syntax", null, "src/app/language/PvSettings.ts:101"]
  , ["Precision", null, "src/app/language/PvSettings.ts:101"]
  , ["Lemmas", null, "src/app/language/PvSettings.ts:101"]
  , ["Attack reconstruction", null, "src/app/language/PvSettings.ts:101"]
  , ["Resolution", null, "src/app/language/PvSettings.ts:102"]
  , ["Process simplification", null, "src/app/language/PvSettings.ts:102"]
  , ["Display", null, "src/app/language/PvSettings.ts:102"]
  , ["Features", null, "src/app/language/PvSettings.ts:102"]
  , ["Declares a type, for names, variables and the arguments of functions.", null, "src/app/language/PvExplain.ts:16"]
  , ["Declares free names, which the attacker knows unless they are [private]: public channels, or secrets.", null, "src/app/language/PvExplain.ts:17"]
  , ["Declares constants: functions without arguments.", null, "src/app/language/PvExplain.ts:18"]
  , ["Declares a constructor, a function that builds terms such as encryptions; the attacker can apply it unless it is [private].", null, "src/app/language/PvExplain.ts:19"]
  , ["Declares a destructor by rewrite rules, such as decryption: sdec(senc(m, k), k) = m. When no rule applies, it fails.", null, "src/app/language/PvExplain.ts:20"]
  , ["Declares equations between terms, such as the commutativity of exponentiation in Diffie-Hellman.", null, "src/app/language/PvExplain.ts:21"]
  , ["Declares a predicate, for clauses and for the conditions of queries.", null, "src/app/language/PvExplain.ts:22"]
  , ["Declares a table: processes insert rows into it and look them up with get; the attacker cannot read it.", null, "src/app/language/PvExplain.ts:23"]
  , ["Declares or executes an event: events mark points of the protocol, for correspondence queries.", null, "src/app/language/PvExplain.ts:24"]
  , ["Asks a security property: the secrecy of a term (attacker(s)), or a correspondence between events (==>).", null, "src/app/language/PvExplain.ts:25"]
  , ["States a property that ProVerif proves first, then uses to prove the queries.", null, "src/app/language/PvExplain.ts:26"]
  , ["States a property that ProVerif assumes without proof, to help prove the queries.", null, "src/app/language/PvExplain.ts:27"]
  , ["Restricts the traces to those that satisfy a property.", null, "src/app/language/PvExplain.ts:28"]
  , ["Asks for strong secrecy: the attacker cannot tell runs apart when the given names change value.", null, "src/app/language/PvExplain.ts:29"]
  , ["Asks whether a weak secret, such as a password, resists offline guessing.", null, "src/app/language/PvExplain.ts:30"]
  , ["A secrecy assumption: a fact that never holds. ProVerif checks it, and uses it to speed up the proof.", null, "src/app/language/PvExplain.ts:31"]
  , ["A hint for the resolution: do not resolve on facts of this form. It changes speed and termination, not soundness.", null, "src/app/language/PvExplain.ts:32"]
  , ["A hint for the resolution: resolve on facts of this form first.", null, "src/app/language/PvExplain.ts:33"]
  , ["Defines a function by a term, expanded where it is used.", null, "src/app/language/PvExplain.ts:34"]
  , ["Binds a variable or matches a pattern: let x = M in P. It also defines a process macro: let P(x: T) = ...", null, "src/app/language/PvExplain.ts:35"]
  , ["Starts the main process: the roles of the protocol, usually in parallel and replicated.", null, "src/app/language/PvExplain.ts:36"]
  , ["Creates a fresh name that the attacker does not know: a nonce or a key.", null, "src/app/language/PvExplain.ts:37"]
  , ["Receives a message on a channel: in(c, x: T); on a public channel it comes from the attacker. Also ends a let: let x = M in P.", null, "src/app/language/PvExplain.ts:38"]
  , ["Sends a message on a channel: out(c, M); on a public channel the attacker gets it.", null, "src/app/language/PvExplain.ts:39"]
  , ["A test: if M then P else Q.", null, "src/app/language/PvExplain.ts:40"]
  , ["What runs when the test, the match or the lookup succeeds.", null, "src/app/language/PvExplain.ts:41"]
  , ["What runs when the test, the match or the lookup fails.", null, "src/app/language/PvExplain.ts:42"]
  , ["Inserts a row into a table: insert t(M1, ..., Mn).", null, "src/app/language/PvExplain.ts:43"]
  , ["Looks up a row of a table that matches a pattern: get t(=M, x) in P else Q.", null, "src/app/language/PvExplain.ts:44"]
  , ["A condition: get ... suchthat M, or let x suchthat p(x), which picks any value that satisfies it.", null, "src/app/language/PvExplain.ts:45"]
  , ["Starts a new phase: earlier processes stop, and the attacker keeps what it knows. Used for forward secrecy.", null, "src/app/language/PvExplain.ts:46"]
  , ["A synchronisation barrier: processes wait for each other at sync n.", null, "src/app/language/PvExplain.ts:47"]
  , ["A biprocess: choice[M, N] is M on the left and N on the right; ProVerif proves the two sides equivalent.", null, "src/app/language/PvExplain.ts:48"]
  , ["A biprocess: diff[M, N] is M on the left and N on the right; ProVerif proves the two sides equivalent.", null, "src/app/language/PvExplain.ts:49"]
  , ["The failure of a computation, such as a destructor that does not apply.", null, "src/app/language/PvExplain.ts:50"]
  , ["Declares the variables of a rewrite rule, an equation, a clause or a query.", null, "src/app/language/PvExplain.ts:51"]
  , ["Adds rules to a destructor that apply when the rules before them do not.", null, "src/app/language/PvExplain.ts:52"]
  , ["Defines a macro of declarations, which expand instantiates.", null, "src/app/language/PvExplain.ts:53"]
  , ["Expands a macro of declarations defined with def, with its arguments.", null, "src/app/language/PvExplain.ts:54"]
  , ["Sets an option of ProVerif, such as set attacker = passive.", null, "src/app/language/PvExplain.ts:55"]
  , ["Declares channels: free names of type channel.", null, "src/app/language/PvExplain.ts:56"]
  , ["The end of a process, as 0, in the syntax of CryptoVerif.", null, "src/app/language/PvExplain.ts:57"]
  , ["Declares Horn clauses directly, for the attacker or for predicates.", null, "src/app/language/PvExplain.ts:58"]
  , ["Declares a fact that always holds, to simplify the clauses.", null, "src/app/language/PvExplain.ts:59"]
  , ["Asks whether two processes are observationally equivalent.", null, "src/app/language/PvExplain.ts:60"]
  , ["In noninterf: the values that a secret ranges over.", null, "src/app/language/PvExplain.ts:61"]
  , ["An injective event in a query: each occurrence matches a distinct occurrence of the events before it.", null, "src/app/language/PvExplain.ts:62"]
  , ["attacker(M): the attacker knows M. query attacker(s) asks whether s stays secret.", null, "src/app/language/PvExplain.ts:63"]
  , ["mess(c, M): the message M is on channel c.", null, "src/app/language/PvExplain.ts:64"]
  , ["Picks any values that satisfy a condition: let x suchthat p(x) in P.", null, "src/app/language/PvExplain.ts:78"]
  , ["Runs a process macro, defined with let, with its arguments.", null, "src/app/language/PvExplain.ts:83"]
  , ["Replication: unboundedly many copies of the process run in parallel, one per session.", null, "src/app/language/PvExplain.ts:86"]
  , ["Parallel composition: the processes run at the same time.", null, "src/app/language/PvExplain.ts:87"]
  , ["The end of a process: it does nothing more.", null, "src/app/language/PvExplain.ts:88"]
  , ["branch", null, "src/app/language/PvExplain.ts:89"]
  , ["A branch: what runs after a test, a match, or in a parallel composition.", null, "src/app/language/PvExplain.ts:89"]
  , ["name", null, "src/app/language/PvLanguage.ts:64 src/app/language/PvLanguage.ts:105 src/app/model/ProcessEditor.ts:126"]
  , ["type", null, "src/app/language/PvLanguage.ts:64 src/app/language/PvLanguage.ts:104 src/app/model/ProcessEditor.ts:126 src/app/model/ProcessEditor.ts:172"]
  , ["pattern", null, "src/app/language/PvLanguage.ts:64 src/app/language/PvLanguage.ts:65 src/app/model/ProcessEditor.ts:130 src/app/model/ProcessEditor.ts:162"]
  , ["value", null, "src/app/language/PvLanguage.ts:64 src/app/model/ProcessEditor.ts:163"]
  , ["condition", null, "src/app/language/PvLanguage.ts:64 src/app/language/PvLanguage.ts:66 src/app/model/ProcessEditor.ts:177 src/app/model/ProcessEditor.ts:181 src/app/model/ProcessEditor.ts:184"]
  , ["channel", null, "src/app/language/PvLanguage.ts:65 src/app/model/ProcessEditor.ts:130 src/app/model/ProcessEditor.ts:133"]
  , ["message", null, "src/app/language/PvLanguage.ts:65 src/app/model/ProcessEditor.ts:133"]
  , ["event", null, "src/app/language/PvLanguage.ts:65 src/app/language/PvLanguage.ts:107 src/app/model/ProcessEditor.ts:137"]
  , ["row", null, "src/app/language/PvLanguage.ts:65 src/app/language/PvLanguage.ts:66"]
  , ["number", null, "src/app/language/PvLanguage.ts:66 src/app/language/PvLanguage.ts:67"]
  , ["call", null, "src/app/language/PvLanguage.ts:67"]
  , ["left", null, "src/app/language/PvLanguage.ts:67"]
  , ["right", null, "src/app/language/PvLanguage.ts:67"]
  , ["Actions", null, "src/app/language/PvLanguage.ts:70"]
  , ["Builtin types", null, "src/app/language/PvLanguage.ts:72"]
  , ["A fresh name: new k: key, or k <-R key as in CryptoVerif", null, "src/app/language/PvLanguage.ts:85"]
  , ["Send a message: out(c, M)", null, "src/app/language/PvLanguage.ts:86"]
  , ["Receive a message: in(c, x: T)", null, "src/app/language/PvLanguage.ts:87"]
  , ["Compute or match: let x = M in, or x <- M; as in CryptoVerif", null, "src/app/language/PvLanguage.ts:88"]
  , ["A test: if M then ... else ...", null, "src/app/language/PvLanguage.ts:89"]
  , ["An event, for correspondence queries", null, "src/app/language/PvLanguage.ts:90"]
  , ["Insert a row into a table", null, "src/app/language/PvLanguage.ts:91"]
  , ["Look up a row of a table", null, "src/app/language/PvLanguage.ts:92"]
  , ["Run a process macro: P(args)", null, "src/app/language/PvLanguage.ts:93"]
  , ["Start a new phase", null, "src/app/language/PvLanguage.ts:94"]
  , ["function", null, "src/app/language/PvLanguage.ts:106"]
  , ["table", null, "src/app/language/PvLanguage.ts:108 src/app/model/ProcessEditor.ts:141 src/app/model/ProcessEditor.ts:184"]
  , ["predicate", null, "src/app/language/PvLanguage.ts:109"]
  , ["process", null, "src/app/language/PvLanguage.ts:110 src/app/model/ProcessEditor.ts:188"]
  , ["function (letfun)", null, "src/app/language/PvLanguage.ts:111"]
  , ["variable", null, "src/app/language/PvLanguage.ts:112 src/app/language/PvLanguage.ts:113 src/app/model/ProcessEditor.ts:172"]
  , ["keyword", null, "src/app/language/PvLanguage.ts:114"]
  , ["internal error of the checker: {message}", null, "src/app/model/Analysis.ts:71"]
  , ["Identifiers start with a letter and contain letters, digits, _ and '", null, "src/app/model/ModelEditor.ts:69"]
  , ["{name} is a ProVerif keyword", null, "src/app/model/ModelEditor.ts:72"]
  , ["Unknown symbol", null, "src/app/model/ModelEditor.ts:306"]
  , ["{name} is built in and cannot be renamed", null, "src/app/model/ModelEditor.ts:309"]
  , ["{name} is already declared ({kind})", null, "src/app/model/ModelEditor.ts:317"]
  , ["not a process declaration", null, "src/app/model/ModelEditor.ts:550"]
  , ["parameters", null, "src/app/model/ModelEditor.ts:556 src/app/model/ModelEditor.ts:690"]
  , ["cannot locate the header of this process", null, "src/app/model/ModelEditor.ts:563"]
  , ["cannot rename this process", null, "src/app/model/ModelEditor.ts:571"]
  , ["this declaration has no options", null, "src/app/model/ModelEditor.ts:633"]
  , ["{name} is already declared", null, "src/app/model/ModelEditor.ts:685"]
  , ["empty", null, "src/app/model/ProcessEditor.ts:79"]
  , ["argument of the name", null, "src/app/model/ProcessEditor.ts:124"]
  , ["arguments", null, "src/app/model/ProcessEditor.ts:137 src/app/model/ProcessEditor.ts:141 src/app/model/ProcessEditor.ts:188"]
  , ["phase: a positive integer is expected", null, "src/app/model/ProcessEditor.ts:146"]
  , ["sync: a positive integer is expected", null, "src/app/model/ProcessEditor.ts:154"]
  , ["tag", null, "src/app/model/ProcessEditor.ts:156"]
  , ["variables: x: type is expected, not {text}", null, "src/app/model/ProcessEditor.ts:170"]
  , ["variables: at least one typed variable is required", null, "src/app/model/ProcessEditor.ts:175"]
  , ["patterns", null, "src/app/model/ProcessEditor.ts:184"]
  , ["unknown action {kind}", null, "src/app/model/ProcessEditor.ts:201"]
  , ["no such node", null, "src/app/model/ProcessEditor.ts:279 src/app/model/ProcessEditor.ts:329 src/app/model/ProcessEditor.ts:423 src/app/model/ProcessEditor.ts:519"]
  , ["only actions followed by a continuation can change kind", null, "src/app/model/ProcessEditor.ts:334"]
  , ["this action has an else branch: remove the branch first, or keep a conditional", null, "src/app/model/ProcessEditor.ts:347"]
  , ["this action has no options", null, "src/app/model/ProcessEditor.ts:364"]
  , ["insertion point is not a process", null, "src/app/model/ProcessEditor.ts:382"]
  , ["only sequential actions and conditionals can be moved", null, "src/app/model/ProcessEditor.ts:523"]
  , ["cannot move a conditional into its own else branch", null, "src/app/model/ProcessEditor.ts:526"]
  , ["only conditionals have an else branch", null, "src/app/model/ProcessEditor.ts:583"]
  , ["Observational equivalence of the biprocess (choice)", null, "src/app/model/ExportPlanner.ts:135"]
  , ["Observational equivalence of the two processes", null, "src/app/model/ExportPlanner.ts:138"]
  , ["Queries are incompatible with equivalence", null, "src/app/model/ExportPlanner.ts:143"]
  , ["Queries are incompatible with choice", null, "src/app/model/ExportPlanner.ts:145"]
  , ["Generated by PieStudio; verify with: proverif <this file>", null, "src/app/model/ExportPlanner.ts:219"]
  , ["reachability and correspondence queries", null, "src/app/model/ExportPlanner.ts:227"]
  , ["queries", null, "src/app/model/ExportPlanner.ts:233"]
  , ["all goals (no split needed)", null, "src/app/model/ExportPlanner.ts:263"]
  , ["observational equivalence of the two processes", null, "src/app/model/ExportPlanner.ts:268"]
  , ["observational equivalence (biprocess)", null, "src/app/model/ExportPlanner.ts:268"]
  , ["biprocess (choice)", null, "src/app/model/ExportPlanner.ts:269"]
  , ["first process of the equivalence", null, "src/app/model/ExportPlanner.ts:278"]
  , ["second process of the equivalence", null, "src/app/model/ExportPlanner.ts:278"]
  , ["choice[,] projected on its left side", null, "src/app/model/ExportPlanner.ts:284"]
  , ["choice[,] projected on its right side", null, "src/app/model/ExportPlanner.ts:284"]
  , ["model", null, "src/app/model/ExportPlanner.ts:298"]
  , ["Type", null, "src/app/model/DeclSpecs.ts:183 src/app/model/DeclSpecs.ts:199 src/app/model/DeclSpecs.ts:220 src/app/view/ActionDialog.ts:20"]
  , ["A type of messages. channel, bitstring, bool and nat are built in.", null, "src/app/model/DeclSpecs.ts:184"]
  , ["Name", null, "src/app/model/DeclSpecs.ts:186 src/app/model/DeclSpecs.ts:233 src/app/model/DeclSpecs.ts:249 src/app/model/DeclSpecs.ts:298 src/app/model/DeclSpecs.ts:310 src/app/model/DeclSpecs.ts:322 src/app/model/DeclSpecs.ts:335 src/app/model/DeclSpecs.ts:347 src/app/view/ActionDialog.ts:19"]
  , ["Options (for CryptoVerif)", null, "src/app/model/DeclSpecs.ts:187"]
  , ["Notation (LaTeX)", null, "src/app/model/DeclSpecs.ts:188 src/app/model/DeclSpecs.ts:201 src/app/model/DeclSpecs.ts:223 src/app/model/DeclSpecs.ts:239 src/app/model/DeclSpecs.ts:254 src/app/model/DeclSpecs.ts:300 src/app/model/DeclSpecs.ts:312"]
  , ["Free name", null, "src/app/model/DeclSpecs.ts:195"]
  , ["Names known from the start: public channels and constants, or secrets unknown to the attacker ([private]).", null, "src/app/model/DeclSpecs.ts:196"]
  , ["Names", null, "src/app/model/DeclSpecs.ts:198"]
  , ["unknown to the attacker (a private channel is drawn dotted)", null, "src/app/model/DeclSpecs.ts:200"]
  , ["Channel", null, "src/app/model/DeclSpecs.ts:208 src/app/view/ActionDialog.ts:24 src/app/view/ActionDialog.ts:29"]
  , ["Public channels (the same as free c: channel).", null, "src/app/model/DeclSpecs.ts:209"]
  , ["Channels", null, "src/app/model/DeclSpecs.ts:210"]
  , ["Constant", null, "src/app/model/DeclSpecs.ts:216"]
  , ["Public constants of a type.", null, "src/app/model/DeclSpecs.ts:217"]
  , ["Constants", null, "src/app/model/DeclSpecs.ts:219"]
  , ["unknown to the attacker", null, "src/app/model/DeclSpecs.ts:221"]
  , ["Other options", null, "src/app/model/DeclSpecs.ts:222"]
  , ["Constructor", null, "src/app/model/DeclSpecs.ts:230"]
  , ["A function symbol that builds messages (encryption, signature, hash, pairing). The attacker can apply it unless it is private.", null, "src/app/model/DeclSpecs.ts:231"]
  , ["Argument types", null, "src/app/model/DeclSpecs.ts:234 src/app/model/DeclSpecs.ts:250 src/app/model/DeclSpecs.ts:299 src/app/model/DeclSpecs.ts:323"]
  , ["Result type", null, "src/app/model/DeclSpecs.ts:235 src/app/model/DeclSpecs.ts:251"]
  , ["the attacker cannot apply it", null, "src/app/model/DeclSpecs.ts:236 src/app/model/DeclSpecs.ts:253 src/app/model/DeclSpecs.ts:265"]
  , ["the attacker can also take it apart, like a tuple", null, "src/app/model/DeclSpecs.ts:237"]
  , ["the identity, changing the type", null, "src/app/model/DeclSpecs.ts:238"]
  , ["Destructor (fun ... reduc)", null, "src/app/model/DeclSpecs.ts:246"]
  , ["A function defined by rewrite rules tried in order (otherwise). It fails when no rule applies.", null, "src/app/model/DeclSpecs.ts:247"]
  , ["Rewrite rules (tried in order)", null, "src/app/model/DeclSpecs.ts:252"]
  , ["Destructor (reduc)", null, "src/app/model/DeclSpecs.ts:261"]
  , ["Rewrite rules defining a destructor of constructors declared with fun, e.g. sdec(senc(x, k), k) = x.", null, "src/app/model/DeclSpecs.ts:262"]
  , ["Rewrite rules", null, "src/app/model/DeclSpecs.ts:264"]
  , ["Notation of the destructor (LaTeX)", null, "src/app/model/DeclSpecs.ts:266"]
  , ["Equation", null, "src/app/model/DeclSpecs.ts:273"]
  , ["Equational theory, e.g. Diffie-Hellman exp(exp(g, x), y) = exp(exp(g, y), x). A notation here is the one of the function on the left.", null, "src/app/model/DeclSpecs.ts:274"]
  , ["Equations", null, "src/app/model/DeclSpecs.ts:276"]
  , ["the equations form a convergent rewrite system", null, "src/app/model/DeclSpecs.ts:277"]
  , ["the equations are linear", null, "src/app/model/DeclSpecs.ts:278"]
  , ["Notation of the function on the left (LaTeX)", null, "src/app/model/DeclSpecs.ts:279"]
  , ["Event", null, "src/app/model/DeclSpecs.ts:295 src/app/view/ActionDialog.ts:49"]
  , ["Events mark steps of the protocol; correspondence queries relate them (authentication). Drawn in green boxes.", null, "src/app/model/DeclSpecs.ts:296"]
  , ["Table", null, "src/app/model/DeclSpecs.ts:307 src/app/view/ActionDialog.ts:53 src/app/view/ActionDialog.ts:57"]
  , ["Tables store rows private to the honest processes (insert and get), e.g. a key directory. Drawn in purple boxes.", null, "src/app/model/DeclSpecs.ts:308"]
  , ["Column types", null, "src/app/model/DeclSpecs.ts:311"]
  , ["Predicate", null, "src/app/model/DeclSpecs.ts:319"]
  , ["Predicates defined by clauses, usable in let ... suchthat and in queries.", null, "src/app/model/DeclSpecs.ts:320"]
  , ["the predicate is not defined by clauses", null, "src/app/model/DeclSpecs.ts:324"]
  , ["optimise the membership predicate (arity 2)", null, "src/app/model/DeclSpecs.ts:325"]
  , ["Term macro (letfun)", null, "src/app/model/DeclSpecs.ts:332"]
  , ["A macro for terms, expanded where it is used.", null, "src/app/model/DeclSpecs.ts:333"]
  , ["Parameters", null, "src/app/model/DeclSpecs.ts:336 src/app/model/DeclSpecs.ts:348"]
  , ["Definition", null, "src/app/model/DeclSpecs.ts:337"]
  , ["Process (party)", null, "src/app/model/DeclSpecs.ts:344"]
  , ["A process macro: one party of the protocol. Its actions are edited in the diagram.", null, "src/app/model/DeclSpecs.ts:345"]
  , ["Query", null, "src/app/model/DeclSpecs.ts:355"]
  , ["Security properties to verify: secrecy attacker(s), correspondences event(e1(x)) ==> event(e2(x)), injective ones with inj-event.", null, "src/app/model/DeclSpecs.ts:356"]
  , ["Variables", null, "src/app/model/DeclSpecs.ts:358 src/app/model/DeclSpecs.ts:371 src/app/view/ActionDialog.ts:39"]
  , ["Types of the variables of the queries (Infer finds them from the events).", null, "src/app/model/DeclSpecs.ts:358"]
  , ["Queries", null, "src/app/model/DeclSpecs.ts:359"]
  , ["Options", null, "src/app/model/DeclSpecs.ts:360 src/app/model/DeclSpecs.ts:373"]
  , ["Lemma, axiom or restriction", null, "src/app/model/DeclSpecs.ts:367"]
  , ["lemma: proved, then used to help other proofs; axiom: assumed; restriction: excludes traces.", null, "src/app/model/DeclSpecs.ts:368"]
  , ["Kind", null, "src/app/model/DeclSpecs.ts:370"]
  , ["Statements", null, "src/app/model/DeclSpecs.ts:372"]
  , ["Strong secrecy (noninterf)", null, "src/app/model/DeclSpecs.ts:380"]
  , ["The attacker cannot distinguish runs with different values of these names (optionally among a set of terms).", null, "src/app/model/DeclSpecs.ts:381"]
  , ["Variables (for the among terms)", null, "src/app/model/DeclSpecs.ts:383"]
  , ["Secrets", null, "src/app/model/DeclSpecs.ts:384"]
  , ["Weak secret", null, "src/app/model/DeclSpecs.ts:391"]
  , ["Resistance to off-line guessing attacks on a low-entropy secret (a password).", null, "src/app/model/DeclSpecs.ts:392"]
  , ["Secret", null, "src/app/model/DeclSpecs.ts:393"]
  , ["Setting", null, "src/app/model/DeclSpecs.ts:399 src/app/model/DeclSpecs.ts:401"]
  , ["ProVerif settings, e.g. set attacker = passive. A setting at its default value is not written.", null, "src/app/model/DeclSpecs.ts:400"]
  , ["Value", null, "src/app/model/DeclSpecs.ts:401 src/app/view/ActionDialog.ts:34"]
  , ["Secrecy assumption (not)", null, "src/app/model/DeclSpecs.ts:414"]
  , ["Facts assumed unreachable, e.g. not attacker(new k). ProVerif checks them.", null, "src/app/model/DeclSpecs.ts:414"]
  , ["Unification hint (nounif)", null, "src/app/model/DeclSpecs.ts:415"]
  , ["nounif / select / noselect guide the resolution strategy, e.g. nounif x: key; attacker(f(*x)).", null, "src/app/model/DeclSpecs.ts:415"]
  , ["Facts always true for a predicate.", null, "src/app/model/DeclSpecs.ts:416"]
  , ["Clauses", null, "src/app/model/DeclSpecs.ts:417"]
  , ["Horn clauses defining predicates.", null, "src/app/model/DeclSpecs.ts:417"]
  , ["Macro (def)", null, "src/app/model/DeclSpecs.ts:418"]
  , ["A parameterised block of declarations, instantiated with expand.", null, "src/app/model/DeclSpecs.ts:418"]
  , ["Macro expansion", null, "src/app/model/DeclSpecs.ts:419"]
  , ["Instantiates a def macro.", null, "src/app/model/DeclSpecs.ts:419"]
  , ["CryptoVerif declaration", null, "src/app/model/DeclSpecs.ts:420"]
  , ["param, proba, letproba, proof, implementation: ProVerif ignores them (they are kept for CryptoVerif).", null, "src/app/model/DeclSpecs.ts:420"]
  , ["Types and names", null, "src/app/model/DeclSpecs.ts:429"]
  , ["Cryptographic primitives", null, "src/app/model/DeclSpecs.ts:430"]
  , ["Protocol", null, "src/app/model/DeclSpecs.ts:431"]
  , ["Security goals", null, "src/app/model/DeclSpecs.ts:432 src/app/model/ReportWriter.ts:45 src/app/view/DeclarationsPanel.ts:26"]
  , ["Advanced", null, "src/app/model/DeclSpecs.ts:433"]
  , ["empty declaration", null, "src/app/model/DeclSpecs.ts:509"]
  , ["Secrecy of {name}", null, "src/app/model/DeclSpecs.ts:651 src/app/model/DeclSpecs.ts:653"]
  , ["Authentication: {end} implies {begin}", null, "src/app/model/DeclSpecs.ts:665"]
  , ["Injective: {end} implies {begin}", null, "src/app/model/DeclSpecs.ts:666"]
  , ["Reachability of {name}", null, "src/app/model/DeclSpecs.ts:669"]
  , ["Real-or-random secrecy of {name}", null, "src/app/model/DeclSpecs.ts:673"]
  , ["Main process", null, "src/app/model/DiagramModel.ts:108"]
  , ["Equivalence, side {number}", null, "src/app/model/DiagramModel.ts:111"]
  , ["Handshake (flawed)", null, "src/app/model/Examples.ts:20"]
  , ["Secrecy and authentication fail: a man in the middle learns the key.", null, "src/app/model/Examples.ts:21"]
  , ["Handshake (fixed)", null, "src/app/model/Examples.ts:28"]
  , ["The server signs the client key: all queries hold.", null, "src/app/model/Examples.ts:29"]
  , ["Signed Diffie-Hellman, in paper notation", null, "src/app/model/Examples.ts:36"]
  , ["Pretty printing hints: g^a, {m}_k, x || y.", null, "src/app/model/Examples.ts:37"]
  , ["Key confirmation (symmetric role)", null, "src/app/model/Examples.ts:44"]
  , ["One role run by both devices, drawn with its mirrored copy.", null, "src/app/model/Examples.ts:45"]
  , ["Needham-Schroeder public key", null, "src/app/model/Examples.ts:52"]
  , ["Lowe's attack on the authentication of the responder.", null, "src/app/model/Examples.ts:53"]
  , ["Needham-Schroeder-Lowe", null, "src/app/model/Examples.ts:60"]
  , ["The fix: the responder names itself in message 2.", null, "src/app/model/Examples.ts:61"]
  , ["Signed Diffie-Hellman, phases", null, "src/app/model/Examples.ts:68"]
  , ["Long-term keys leak in phase 1; the session secret survives.", null, "src/app/model/Examples.ts:69"]
  , ["Weak secret and non-interference", null, "src/app/model/Examples.ts:76"]
  , ["Off-line guessing breaks the password.", null, "src/app/model/Examples.ts:77"]
  , ["Strong secrecy (biprocess)", null, "src/app/model/Examples.ts:84"]
  , ["choice[,] and observational equivalence.", null, "src/app/model/Examples.ts:85"]
  , ["Mixed goals (split export)", null, "src/app/model/Examples.ts:92"]
  , ["Queries and choice together: verified, and exported, as several files.", null, "src/app/model/Examples.ts:93"]
  , ["No occurrence is chosen.", null, "src/app/model/RefactorSession.ts:129"]
  , ["The name is the same.", null, "src/app/model/RefactorSession.ts:132"]
  , ["With this name, the renamed occurrences would not all refer to the same declaration.", null, "src/app/model/RefactorSession.ts:147"]
  , ["The name {name} is already used on line {line}: it would refer to the renamed declaration.", null, "src/app/model/RefactorSession.ts:158"]
  , ["The name {name} is already used in the selection: the renamed declaration would hide it, or be hidden by it.", null, "src/app/model/RefactorSession.ts:167"]
  , ["The name {name} is already used in the model: the renamed declaration would hide it, or be hidden by it.", null, "src/app/model/RefactorSession.ts:168"]
  , ["The model would have new errors: {message} (line {line}).", null, "src/app/model/RefactorSession.ts:173"]
  , ["attack", null, "src/app/model/ReportWriter.ts:26"]
  , ["Attack on {goal}", null, "src/app/model/ReportWriter.ts:32"]
  , ["Library {name}", null, "src/app/model/ReportWriter.ts:34"]
  , ["{file}: verification report", null, "src/app/model/ReportWriter.ts:37"]
  , ["Verified with ProVerif 2.05 in PieStudio, {date}.", null, "src/app/model/ReportWriter.ts:43"]
  , ["Time: {seconds} s, memory: {size} MB.", null, "src/app/model/ReportWriter.ts:44"]
  , ["Result", null, "src/app/model/ReportWriter.ts:46 src/app/view/BottomPanel.ts:170"]
  , ["Goal", null, "src/app/model/ReportWriter.ts:46"]
  , ["Attack traces", null, "src/app/model/ReportWriter.ts:47"]
  , ["Model", null, "src/app/model/ReportWriter.ts:48"]
  , ["Written by PieStudio.", null, "src/app/model/ReportWriter.ts:51"]
  , ["true", null, "src/app/engine/OutputParser.ts:35"]
  , ["false", null, "src/app/engine/OutputParser.ts:36"]
  , ["cannot be proved", null, "src/app/engine/OutputParser.ts:37"]
  , ["new {name}: {type} creating {value}", null, "src/app/engine/TraceMapper.ts:348"]
  , ["{channel}: {message} (between processes)", null, "src/app/engine/TraceMapper.ts:354"]
  , ["attacker obtains {message}", null, "src/app/engine/TraceMapper.ts:369"]
  , ["event {event} executed", null, "src/app/engine/TraceMapper.ts:372"]
  , ["Settings", null, "src/app/view/DeclarationsPanel.ts:20 src/app/view/SettingsDialog.ts:99"]
  , ["Types", null, "src/app/view/DeclarationsPanel.ts:21"]
  , ["Names and channels", null, "src/app/view/DeclarationsPanel.ts:22"]
  , ["Functions and equations", null, "src/app/view/DeclarationsPanel.ts:23"]
  , ["Events, tables, predicates", null, "src/app/view/DeclarationsPanel.ts:24"]
  , ["Term macros", null, "src/app/view/DeclarationsPanel.ts:25"]
  , ["Parties (processes)", null, "src/app/view/DeclarationsPanel.ts:27"]
  , ["Add", null, "src/app/view/DeclarationsPanel.ts:188 src/app/view/FormBuilder.ts:310 src/app/view/DeclarationDialog.ts:123 src/app/view/ActionDialog.ts:182"]
  , ["Show more ({count} not shown)", null, "src/app/view/DeclarationsPanel.ts:193"]
  , ["None yet", null, "src/app/view/DeclarationsPanel.ts:196"]
  , ["None matches", null, "src/app/view/DeclarationsPanel.ts:198"]
  , ["Libraries (-lib)", null, "src/app/view/DeclarationsPanel.ts:221"]
  , ["{name}: {count} declaration", "{name}: {count} declarations", "src/app/view/DeclarationsPanel.ts:227"]
  , ["{count} decl.", null, "src/app/view/DeclarationsPanel.ts:230"]
  , ["not used by this model", null, "src/app/view/DeclarationsPanel.ts:230"]
  , ["{count} error", "{count} errors", "src/app/view/DeclarationsPanel.ts:232 src/app/controller/PieStudio.ts:495"]
  , ["Edit the library", null, "src/app/view/DeclarationsPanel.ts:234"]
  , ["Remove the library", null, "src/app/view/DeclarationsPanel.ts:235"]
  , ["The model needs {name} (@library): open it", null, "src/app/view/DeclarationsPanel.ts:239"]
  , ["missing", null, "src/app/view/DeclarationsPanel.ts:241"]
  , ["Attacker", null, "src/app/view/TraceView.ts:68"]
  , ["attacker has", null, "src/app/view/TraceView.ts:125"]
  , ["goal: event", null, "src/app/view/TraceView.ts:128"]
  , ["attacker test", null, "src/app/view/TraceView.ts:131"]
  , ["No problems: ProVerif accepts this model.", null, "src/app/view/BottomPanel.ts:103"]
  , ["Reported by ProVerif 2.05 itself", null, "src/app/view/BottomPanel.ts:113"]
  , ["Verify the model (F5) to see the results of its security goals.", null, "src/app/view/BottomPanel.ts:139"]
  , ["ProVerif is working...", null, "src/app/view/BottomPanel.ts:143"]
  , ["Memory of the engine: {used} MB, with no budget", null, "src/app/view/BottomPanel.ts:153"]
  , ["Memory of the engine: {used} MB of a budget of {limit} MB", null, "src/app/view/BottomPanel.ts:154"]
  , ["{used} MB, no limit", null, "src/app/view/BottomPanel.ts:156"]
  , ["Security goal", null, "src/app/view/BottomPanel.ts:170"]
  , ["trace", null, "src/app/view/BottomPanel.ts:179"]
  , ["Verify the model, then choose a result that has an attack trace.", null, "src/app/view/BottomPanel.ts:214"]
  , ["Previous step", null, "src/app/view/BottomPanel.ts:222"]
  , ["Next step", null, "src/app/view/BottomPanel.ts:223"]
  , ["ProVerif found an attack but could not rebuild a trace of it.", null, "src/app/view/BottomPanel.ts:234"]
  , ["The goal holds: there is no attack to show.", null, "src/app/view/BottomPanel.ts:235"]
  , ["ProVerif could neither prove the goal nor find an attack.", null, "src/app/view/BottomPanel.ts:235"]
  , ["Derivation ({count} step)", "Derivation ({count} steps)", "src/app/view/BottomPanel.ts:240"]
  , ["Step {number} of {count}: {text}", null, "src/app/view/BottomPanel.ts:255"]
  , ["{count} step. Click a step to see the action that made it.", "{count} steps. Click a step to see the action that made it.", "src/app/view/BottomPanel.ts:256"]
  , ["Modifiers", null, "src/app/view/FormBuilder.ts:68"]
  , ["Find the types from the events and tables", null, "src/app/view/FormBuilder.ts:168"]
  , ["Infer", null, "src/app/view/FormBuilder.ts:168"]
  , ["any value (empty)", null, "src/app/view/FormBuilder.ts:209"]
  , ["Default: {value}.", null, "src/app/view/FormBuilder.ts:235"]
  , ["{value} (default)", null, "src/app/view/FormBuilder.ts:254"]
  , ["for example {example}", null, "src/app/view/FormBuilder.ts:273"]
  , ["Shown as", null, "src/app/view/FormBuilder.ts:275"]
  , ["Suggestions", null, "src/app/view/FormBuilder.ts:294"]
  , ["Form", null, "src/app/view/DeclarationDialog.ts:86"]
  , ["ProVerif source", null, "src/app/view/DeclarationDialog.ts:89"]
  , ["Edit {what}", null, "src/app/view/DeclarationDialog.ts:117"]
  , ["Add {what}", null, "src/app/view/DeclarationDialog.ts:117 src/app/controller/PieStudio.ts:1037"]
  , ["Fill in the form: the declaration is checked as you type.", null, "src/app/view/DeclarationDialog.ts:249"]
  , ["Valid", null, "src/app/view/DeclarationDialog.ts:259"]
  , ["the default", null, "src/app/view/DeclarationDialog.ts:292"]
  , ["Declare events and names first", null, "src/app/view/DeclarationDialog.ts:330"]
  , ["as in CryptoVerif", null, "src/app/view/ActionDialog.ts:21 src/app/view/ActionDialog.ts:36"]
  , ["k <-R key; instead of new k: key; ProVerif reads both", null, "src/app/view/ActionDialog.ts:21"]
  , ["Pattern (what is received)", null, "src/app/view/ActionDialog.ts:25"]
  , ["a more precise analysis of this input (ProVerif 2.03 and later)", null, "src/app/view/ActionDialog.ts:26"]
  , ["Pattern", null, "src/app/view/ActionDialog.ts:33"]
  , ["else branch", null, "src/app/view/ActionDialog.ts:35 src/app/view/ActionDialog.ts:42 src/app/view/ActionDialog.ts:46 src/app/view/ActionDialog.ts:61"]
  , ["what to do when the value does not match", null, "src/app/view/ActionDialog.ts:35"]
  , ["x <- M; instead of let x = M in, for a variable or _ without else branch; ProVerif reads both", null, "src/app/view/ActionDialog.ts:36"]
  , ["Condition", null, "src/app/view/ActionDialog.ts:40 src/app/view/ActionDialog.ts:45"]
  , ["a more precise analysis of this choice", null, "src/app/view/ActionDialog.ts:41"]
  , ["what to do when no value fits", null, "src/app/view/ActionDialog.ts:42"]
  , ["what to do when the condition is false", null, "src/app/view/ActionDialog.ts:46"]
  , ["Arguments", null, "src/app/view/ActionDialog.ts:50 src/app/view/ActionDialog.ts:65"]
  , ["Row", null, "src/app/view/ActionDialog.ts:54"]
  , ["Row patterns", null, "src/app/view/ActionDialog.ts:58"]
  , ["Condition (optional)", null, "src/app/view/ActionDialog.ts:59"]
  , ["a more precise analysis of this lookup", null, "src/app/view/ActionDialog.ts:60"]
  , ["what to do when no row matches", null, "src/app/view/ActionDialog.ts:61"]
  , ["Process", null, "src/app/view/ActionDialog.ts:64"]
  , ["Phase", null, "src/app/view/ActionDialog.ts:68"]
  , ["Barrier", null, "src/app/view/ActionDialog.ts:71"]
  , ["Tag (optional)", null, "src/app/view/ActionDialog.ts:72"]
  , ["Add a fresh name (new)", null, "src/app/view/ActionDialog.ts:110"]
  , ["Edit the fresh name (new)", null, "src/app/view/ActionDialog.ts:110"]
  , ["Add an input (in)", null, "src/app/view/ActionDialog.ts:111"]
  , ["Edit the input (in)", null, "src/app/view/ActionDialog.ts:111"]
  , ["Add an output (out)", null, "src/app/view/ActionDialog.ts:112"]
  , ["Edit the output (out)", null, "src/app/view/ActionDialog.ts:112"]
  , ["Add an assignment or a match (let)", null, "src/app/view/ActionDialog.ts:113"]
  , ["Edit the assignment or match (let)", null, "src/app/view/ActionDialog.ts:113"]
  , ["Add a choice (let ... suchthat)", null, "src/app/view/ActionDialog.ts:114"]
  , ["Edit the choice (let ... suchthat)", null, "src/app/view/ActionDialog.ts:114"]
  , ["Add a test (if)", null, "src/app/view/ActionDialog.ts:115"]
  , ["Edit the test (if)", null, "src/app/view/ActionDialog.ts:115"]
  , ["Add an event", null, "src/app/view/ActionDialog.ts:116"]
  , ["Edit the event", null, "src/app/view/ActionDialog.ts:116"]
  , ["Add an insertion into a table", null, "src/app/view/ActionDialog.ts:117"]
  , ["Edit the insertion into a table", null, "src/app/view/ActionDialog.ts:117"]
  , ["Add a lookup in a table (get)", null, "src/app/view/ActionDialog.ts:118"]
  , ["Edit the lookup in a table (get)", null, "src/app/view/ActionDialog.ts:118"]
  , ["Add a call of a process", null, "src/app/view/ActionDialog.ts:119"]
  , ["Edit the call of a process", null, "src/app/view/ActionDialog.ts:119"]
  , ["Add a phase", null, "src/app/view/ActionDialog.ts:120"]
  , ["Edit the phase", null, "src/app/view/ActionDialog.ts:120"]
  , ["Add a synchronisation (sync)", null, "src/app/view/ActionDialog.ts:121"]
  , ["Edit the synchronisation (sync)", null, "src/app/view/ActionDialog.ts:121"]
  , ["As the model writes most of them", null, "src/app/view/SettingsDialog.ts:21"]
  , ["As in ProVerif: new k: key; and let x = M in", null, "src/app/view/SettingsDialog.ts:22"]
  , ["As in CryptoVerif: k <-R key; and x <- M;", null, "src/app/view/SettingsDialog.ts:23"]
  , ["Engine", null, "src/app/view/SettingsDialog.ts:32"]
  , ["Notation", null, "src/app/view/SettingsDialog.ts:33"]
  , ["Theme", null, "src/app/view/SettingsDialog.ts:34"]
  , ["Language", null, "src/app/view/SettingsDialog.ts:35"]
  , ["Save", null, "src/app/view/SettingsDialog.ts:105"]
  , ["No limit: as much as the browser gives (at most 4 GB, all that WebAssembly can address)", null, "src/app/view/SettingsDialog.ts:125"]
  , ["Memory budget of a verification", null, "src/app/view/SettingsDialog.ts:133"]
  , ["ProVerif runs in a WebAssembly module whose memory grows as needed, up to this budget. Beyond it, or when the browser has no more memory to give, the verification stops with a clear message, and the page is not affected.", null, "src/app/view/SettingsDialog.ts:134"]
  , ["Time limit, in seconds (0 for none)", null, "src/app/view/SettingsDialog.ts:136"]
  , ["A verification that runs in the page (opened from a file) cannot be interrupted.", null, "src/app/view/SettingsDialog.ts:138"]
  , ["Extra command line arguments", null, "src/app/view/SettingsDialog.ts:139"]
  , ["Check the model with ProVerif while editing", null, "src/app/view/SettingsDialog.ts:142"]
  , ["ProVerif 2.05 parses the model with -parse-only after each change", null, "src/app/view/SettingsDialog.ts:143"]
  , ["The default", null, "src/app/view/SettingsDialog.ts:182"]
  , ["Preset", null, "src/app/view/SettingsDialog.ts:193"]
  , ["Font of the code", null, "src/app/view/SettingsDialog.ts:195"]
  , ["Size of the interface", null, "src/app/view/SettingsDialog.ts:196"]
  , ["Explain the constructs", null, "src/app/view/SettingsDialog.ts:198"]
  , ["A short description shows when the pointer rests on a block of the diagram or on a keyword of the code", null, "src/app/view/SettingsDialog.ts:199"]
  , ["New names and lets that the diagram adds", null, "src/app/view/SettingsDialog.ts:235"]
  , ["ProVerif 2.05 reads both styles. Edit, Write new and let as in CryptoVerif (or as in ProVerif) rewrites those of the model.", null, "src/app/view/SettingsDialog.ts:236"]
  , ["LaTeX templates of the Design mode: #1, #2 are the parts of the action (see the placeholders), # is the identifier in the styles. Hints in the model (@notation, @infix) take precedence.", null, "src/app/view/SettingsDialog.ts:237"]
  , ["Restore the defaults", null, "src/app/view/SettingsDialog.ts:266"]
  , ["Fix the syntax errors of the code first.", null, "src/app/controller/Toolbox.ts:66 src/app/controller/PieStudio.ts:1064"]
  , ["There is no name to rename in the selection.", null, "src/app/controller/Toolbox.ts:81"]
  , ["Rename {name} to {to} ({count} place)", "Rename {name} to {to} ({count} places)", "src/app/controller/Toolbox.ts:162"]
  , ["Apply the refactoring?", null, "src/app/controller/Toolbox.ts:173"]
  , ["Apply anyway", null, "src/app/controller/Toolbox.ts:173"]
  , ["Library {names} loaded: its declarations are checked with the model and given to ProVerif.", "Libraries {names} loaded: their declarations are checked with the model and given to ProVerif.", "src/app/controller/Toolbox.ts:214"]
  , ["{name} changed: the model is checked with it again.", null, "src/app/controller/Toolbox.ts:268"]
  , ["LaTeX of the protocol (TikZ)", null, "src/app/controller/Toolbox.ts:332"]
  , ["The honest run, as paired in the diagram, in the notation of the Design mode.", null, "src/app/controller/Toolbox.ts:335"]
  , ["Copy", null, "src/app/controller/Toolbox.ts:338"]
  , ["LaTeX copied.", null, "src/app/controller/Toolbox.ts:339"]
  , ["Download .tex", null, "src/app/controller/Toolbox.ts:343"]
  , ["Verify the model first: the report gives the results of the last verification.", null, "src/app/controller/Toolbox.ts:359"]
  , ["The model is verified again after each change.", null, "src/app/controller/Toolbox.ts:373"]
  , ["Verify with F5.", null, "src/app/controller/Toolbox.ts:373"]
  , ["A verification is already running.", null, "src/app/controller/Verifier.ts:94"]
  , ["The code has syntax errors: fix them before verifying.", null, "src/app/controller/Verifier.ts:103"]
  , ["all goals", null, "src/app/controller/Verifier.ts:110"]
  , ["Verifying {count} file: the goals need separate runs.", "Verifying {count} files: the goals need separate runs.", "src/app/controller/Verifier.ts:114"]
  , ["ProVerif is verifying the model...", null, "src/app/controller/Verifier.ts:115"]
  , ["Verifying {count} file at the same time, one verifier each.", "Verifying {count} files at the same time, one verifier each.", "src/app/controller/Verifier.ts:138"]
  , ["File {name}: {description}", null, "src/app/controller/Verifier.ts:142 src/app/controller/Verifier.ts:160"]
  , ["{count} goal: {proved} proved, {failed} false, {other} cannot be proved.", "{count} goals: {proved} proved, {failed} false, {other} cannot be proved.", "src/app/controller/Verifier.ts:235"]
  , ["{count} goal: {proved} proved, {failed} false.", "{count} goals: {proved} proved, {failed} false.", "src/app/controller/Verifier.ts:236"]
  , ["ProVerif stopped: {message}", null, "src/app/controller/Verifier.ts:239"]
  , ["ProVerif accepts the model; it has no security goals to verify (add a query).", null, "src/app/controller/Verifier.ts:241"]
  , ["Stopped: the browser gave the engine no more memory, after {size} MB (WebAssembly can address at most 4 GB).", null, "src/app/controller/Verifier.ts:245"]
  , ["Stopped: the verification reached its memory budget of {size} MB (Settings, Engine).", null, "src/app/controller/Verifier.ts:248"]
  , ["Stopped: the verification reached its time limit of {seconds} s (Settings, Engine).", null, "src/app/controller/Verifier.ts:251"]
  , ["Cancelled.", null, "src/app/controller/Verifier.ts:254"]
  , ["The engine failed: {message}", null, "src/app/controller/Verifier.ts:256"]
  , ["Stop", null, "src/app/controller/Verifier.ts:318"]
  , ["A new model. Add declarations with the + of the panel on the left, parties with the + of Parties, and actions by dragging them from the palette onto a party.", null, "src/app/controller/PieStudio.ts:45"]
  , ["Opened {file}: {count} problem to fix.", "Opened {file}: {count} problems to fix.", "src/app/controller/PieStudio.ts:239"]
  , ["Opened {file}", null, "src/app/controller/PieStudio.ts:240"]
  , ["{message}: PieStudio verifies and exports these goals as separate files.", null, "src/app/controller/PieStudio.ts:407"]
  , ["The model needs the library {name} (@library): open it with File, Open a library, or choose it with the model.", null, "src/app/controller/PieStudio.ts:441"]
  , ["{library}, line {line}: {message}", null, "src/app/controller/PieStudio.ts:449"]
  , ["Passive attacker: listens only. Click to change.", null, "src/app/controller/PieStudio.ts:488"]
  , ["Active attacker: reads, writes and blocks public channels. Click to change.", null, "src/app/controller/PieStudio.ts:488"]
  , ["passive attacker", null, "src/app/controller/PieStudio.ts:489"]
  , ["Start: {file}", null, "src/app/controller/PieStudio.ts:509"]
  , ["Hints of {file} applied to the model.", null, "src/app/controller/PieStudio.ts:811"]
  , ["Choose a ProVerif model (.pv), and possibly its hints (.pp).", null, "src/app/controller/PieStudio.ts:816"]
  , ["Opened the model of the link.", null, "src/app/controller/PieStudio.ts:837"]
  , ["Unsaved changes", null, "src/app/controller/PieStudio.ts:851"]
  , ["The changes to {file} are not saved. Replace the model anyway?", null, "src/app/controller/PieStudio.ts:851"]
  , ["Replace", null, "src/app/controller/PieStudio.ts:851"]
  , ["Undid: {label}", null, "src/app/controller/PieStudio.ts:886"]
  , ["Redid: {label}", null, "src/app/controller/PieStudio.ts:897"]
  , ["Fix the syntax errors of the code first: the diagram shows the last version that parsed.", null, "src/app/controller/PieStudio.ts:989"]
  , ["Edit {kind}", null, "src/app/controller/PieStudio.ts:1015"]
  , ["Nothing to rewrite: the new names and the lets that can be are written as in {style}.", null, "src/app/controller/PieStudio.ts:1070"]
  , ["Write new and let as in {style}", null, "src/app/controller/PieStudio.ts:1073"]
  , ["{count} new name or let written as in {style}.", "{count} new names and lets written as in {style}.", "src/app/controller/PieStudio.ts:1074"]
  , ["Move an action", null, "src/app/controller/PieStudio.ts:1084"]
  , ["Remove the else branch", null, "src/app/controller/PieStudio.ts:1106"]
  , ["Add an else branch", null, "src/app/controller/PieStudio.ts:1106 src/app/controller/PieStudio.ts:1108"]
  , ["Remove an else branch", null, "src/app/controller/PieStudio.ts:1108"]
  , ["Remove the replication", null, "src/app/controller/PieStudio.ts:1112"]
  , ["Replicate (!)", null, "src/app/controller/PieStudio.ts:1112"]
  , ["Replication", null, "src/app/controller/PieStudio.ts:1113"]
  , ["Run in parallel with another process", null, "src/app/controller/PieStudio.ts:1114"]
  , ["Parallel composition", null, "src/app/controller/PieStudio.ts:1115"]
  , ["Show as code", null, "src/app/controller/PieStudio.ts:1117"]
  , ["Show as a formula", null, "src/app/controller/PieStudio.ts:1117"]
  , ["Delete", null, "src/app/controller/PieStudio.ts:1120 src/app/controller/PieStudio.ts:1279"]
  , ["Delete {kind}", null, "src/app/controller/PieStudio.ts:1134"]
  , ["Show {party} once", null, "src/app/controller/PieStudio.ts:1183 src/app/controller/PieStudio.ts:1185"]
  , ["Show {party} as symmetric", null, "src/app/controller/PieStudio.ts:1189"]
  , ["Edit the party {name}", null, "src/app/controller/PieStudio.ts:1227"]
  , ["Edit a declaration", null, "src/app/controller/PieStudio.ts:1231"]
  , ["Add the party {name}", null, "src/app/controller/PieStudio.ts:1254"]
  , ["Add a declaration", null, "src/app/controller/PieStudio.ts:1256"]
  , ["Move up", null, "src/app/controller/PieStudio.ts:1276"]
  , ["Move down", null, "src/app/controller/PieStudio.ts:1277"]
  , ["Move a declaration", null, "src/app/controller/PieStudio.ts:1291"]
  , ["Delete a declaration", null, "src/app/controller/PieStudio.ts:1304"]
  , ["This declaration has no name to rename.", null, "src/app/controller/PieStudio.ts:1330"]
  , ["Fix the syntax errors first.", null, "src/app/controller/PieStudio.ts:1342"]
  , ["Put the caret on a name to rename it.", null, "src/app/controller/PieStudio.ts:1347"]
  , ["Rename {name}", null, "src/app/controller/PieStudio.ts:1352"]
  , ["New name of the {kind} {name} ({count} occurrence)", "New name of the {kind} {name} ({count} occurrences)", "src/app/controller/PieStudio.ts:1353"]
  , ["Rename {name} to {to}", null, "src/app/controller/PieStudio.ts:1365"]
  , ["Renamed {name} to {to} ({count} occurrence).", "Renamed {name} to {to} ({count} occurrences).", "src/app/controller/PieStudio.ts:1366"]
  , ["Active attacker", null, "src/app/controller/PieStudio.ts:1440"]
  , ["Passive attacker", null, "src/app/controller/PieStudio.ts:1440"]
  , ["Settings saved.", null, "src/app/controller/PieStudio.ts:1487"]
  , ["ProVerif cannot verify these goals in one run ({reason}): the model is exported as {count} file, valid on its own.", "ProVerif cannot verify these goals in one run ({reason}): the model is exported as {count} files, each valid on its own.", "src/app/controller/PieStudio.ts:1507"]
  , ["incompatible goals", null, "src/app/controller/PieStudio.ts:1509"]
  , ["Export for ProVerif", null, "src/app/controller/PieStudio.ts:1520"]
  , ["Download all (.zip)", null, "src/app/controller/PieStudio.ts:1526"]
], { project: "PieStudio 0.1.0", author: "Roberto Metere", license: "GPL-2.0-or-later" });
I18n.register({
    code: "it"
  , name: "Italiano"
  , plural: "nplurals=2; plural=(n != 1);"
  , origin: "built-in"
  , messages: {
        "About PieStudio": "Informazioni su PieStudio"
      , "Model file": "File del modello"
      , "File": "File"
      , "New model": "Nuovo modello"
      , "Open a model (.pv, .pp)...": "Apri un modello (.pv, .pp)..."
      , "Ctrl+O": "Ctrl+O"
      , "Save the model (.pv)": "Salva il modello (.pv)"
      , "Ctrl+S": "Ctrl+S"
      , "Export for ProVerif...": "Esporta per ProVerif..."
      , "Ctrl+E": "Ctrl+E"
      , "Open a library (.pvl)...": "Apri una libreria (.pvl)..."
      , "LaTeX of the protocol (TikZ)...": "LaTeX del protocollo (TikZ)..."
      , "Examples": "Esempi"
      , "Edit": "Modifica"
      , "Undo": "Annulla"
      , "Ctrl+Z": "Ctrl+Z"
      , "Redo": "Ripeti"
      , "Ctrl+Shift+Z": "Ctrl+Maiusc+Z"
      , "Add a party": "Aggiungi un partecipante"
      , "Rename everywhere": "Rinomina ovunque"
      , "Refactor in the selection...": "Refactoring nella selezione..."
      , "Shift+F2": "Maiusc+F2"
      , "Write new and let as in CryptoVerif": "Scrivi new e let come in CryptoVerif"
      , "k <-R key; and x <- M;": "k <-R key; e x <- M;"
      , "Write new and let as in ProVerif": "Scrivi new e let come in ProVerif"
      , "new k: key; and let x = M in": "new k: key; e let x = M in"
      , "Delete the selection": "Elimina la selezione"
      , "Del": "Canc"
      , "Active or passive attacker": "Attaccante attivo o passivo"
      , "View": "Visualizza"
      , "Design mode (formulas)": "Modalit\u00e0 Design (formule)"
      , "Expert mode (ProVerif)": "Modalit\u00e0 Esperto (ProVerif)"
      , "Diagram": "Diagramma"
      , "Diagram and code": "Diagramma e codice"
      , "Code": "Codice"
      , "Zoom in": "Ingrandisci"
      , "Zoom out": "Riduci"
      , "Actual size": "Dimensioni reali"
      , "Light or dark theme": "Tema chiaro o scuro"
      , "Notation...": "Notazione..."
      , "Theme...": "Tema..."
      , "Language...": "Lingua..."
      , "Help": "Aiuto"
      , "User guide": "Guida per l'utente"
      , "Keyboard shortcuts": "Scorciatoie da tastiera"
      , "ProVerif manual (online)": "Manuale di ProVerif (online)"
      , "Undo (Ctrl+Z)": "Annulla (Ctrl+Z)"
      , "Redo (Ctrl+Shift+Z)": "Ripeti (Ctrl+Maiusc+Z)"
      , "Mode": "Modalit\u00e0"
      , "Design mode: blocks as formulas (F9)": "Modalit\u00e0 Design: blocchi come formule (F9)"
      , "Design": "Design"
      , "Expert mode: blocks as ProVerif code (F9)": "Modalit\u00e0 Esperto: blocchi come codice ProVerif (F9)"
      , "Expert": "Esperto"
      , "Verify with ProVerif 2.05 (F5)": "Verifica con ProVerif 2.05 (F5)"
      , "Verify": "Verifica"
      , "Verification options": "Opzioni della verifica"
      , "Stop the verification": "Ferma la verifica"
      , "Verify as I edit": "Verifica mentre modifico"
      , "Report of the verification (HTML)": "Rapporto della verifica (HTML)"
      , "Engine settings (memory, time)...": "Impostazioni del motore (memoria, tempo)..."
      , "Declarations": "Dichiarazioni"
      , "Filter declarations": "Filtra le dichiarazioni"
      , "Add a party (a process macro)": "Aggiungi un partecipante (una macro di processo)"
      , "active attacker": "attaccante attivo"
      , "The code has syntax errors: the diagram and the declarations show the last version that parsed.": "Il codice ha errori di sintassi: il diagramma e le dichiarazioni mostrano l'ultima versione senza errori."
      , "Problems": "Problemi"
      , "Results": "Risultati"
      , "Attack trace": "Traccia d'attacco"
      , "ProVerif output": "Output di ProVerif"
      , "History": "Cronologia"
      , "Hide or show the panel": "Nascondi o mostra il pannello"
      , "Close": "Chiudi"
      , "The model never leaves your computer.": "Il modello non lascia mai il tuo computer."
      , "<b>PieStudio</b> is a visual editor for ProVerif models. Each block of the diagram is one construct of ProVerif's typed pi calculus; the diagram and the code are two views of the same model, and ProVerif 2.05 verifies it in your browser.": "<b>PieStudio</b> \u00e8 un editor visuale di modelli ProVerif. Ogni blocco del diagramma \u00e8 un costrutto del pi-calcolo tipato di ProVerif; il diagramma e il codice sono due viste dello stesso modello, e ProVerif 2.05 lo verifica nel tuo browser."
      , "Free software: you can redistribute it and modify it under the terms of the GNU General Public License, version 2 or (at your option) any later version (COPYING). Roberto Metere.": "Software libero: puoi ridistribuirlo e modificarlo nei termini della GNU General Public License, versione 2 o (a tua scelta) qualsiasi versione successiva (COPYING). Roberto Metere."
      , "The verifier is ProVerif 2.05 by Bruno Blanchet, Vincent Cheval and Marc Sylvestre (INRIA, CNRS), as ProVerif for WebAssembly: compiled with the OCaml 4.14 runtime to WebAssembly by Roberto Metere, and distributed under the GNU GPL v2 or later (engine/NOTICE, engine/COPYING; the OCaml runtime is under the LGPL 2.1 with the OCaml linking exception, engine/LICENSE-OCaml.txt, and the parts of Emscripten under the MIT licence, engine/LICENSE-Emscripten.txt). Studio Core, the parts that PieStudio shares with CryStudio, is by Roberto Metere under the MIT licence (studio-core/LICENSE). Bootstrap, jQuery, jQuery UI and KaTeX are under the MIT licence; Font Awesome Free under the SIL OFL (fonts) and MIT (code).": "Il verificatore \u00e8 ProVerif 2.05 di Bruno Blanchet, Vincent Cheval e Marc Sylvestre (INRIA, CNRS), come ProVerif for WebAssembly: compilato in WebAssembly con il runtime di OCaml 4.14 da Roberto Metere, e distribuito sotto la GNU GPL v2 o successiva (engine/NOTICE, engine/COPYING; il runtime di OCaml \u00e8 sotto la LGPL 2.1 con l'eccezione di linking di OCaml, engine/LICENSE-OCaml.txt, e le parti di Emscripten sotto la licenza MIT, engine/LICENSE-Emscripten.txt). Studio Core, le parti che PieStudio condivide con CryStudio, \u00e8 di Roberto Metere con licenza MIT (studio-core/LICENSE). Bootstrap, jQuery, jQuery UI e KaTeX sono sotto la licenza MIT; Font Awesome Free sotto la SIL OFL (font) e la MIT (codice)."
      , "Verify with ProVerif": "Verifica con ProVerif"
      , "Design or Expert mode": "Modalit\u00e0 Design o Esperto"
      , "Ctrl": "Ctrl"
      , "Shift": "Maiusc"
      , "Undo, redo (no limit)": "Annulla, ripeti (senza limite)"
      , "Open, save, export": "Apri, salva, esporta"
      , "Enter": "Invio"
      , "double click": "doppio clic"
      , "Edit the selected block or declaration": "Modifica il blocco o la dichiarazione selezionati"
      , "Refactor in the selection": "Refactoring nella selezione"
      , "click": "clic"
      , "Go to the declaration (in the code)": "Vai alla dichiarazione (nel codice)"
      , "Right click": "Clic destro"
      , "The menu of a block or a declaration": "Il menu di un blocco o di una dichiarazione"
      , "The file does not say its language: write its code after Language, in its header (Language: zh for Chinese).": "Il file non dice la sua lingua: scrivine il codice dopo Language, nella sua intestazione (Language: zh per il cinese)."
      , "the translation leaves out {placeholders}": "la traduzione omette {placeholders}"
      , "the translation has {placeholders}, which the message does not have": "la traduzione contiene {placeholders}, che il messaggio non ha"
      , "the translation has tags or links that the message does not have": "la traduzione contiene tag o link che il messaggio non ha"
      , "variables": "variabili"
      , "formula": "formula"
      , "Terms": "Termini"
      , "Identifiers": "Identificatori"
      , "Colours": "Colori"
      , "a brace } closes no {": "una parentesi } non chiude alcuna {"
      , "a brace { is not closed": "una parentesi { non \u00e8 chiusa"
      , "@{kind}: the name of a convention is expected": "@{kind}: serve il nome di una convenzione"
      , "@{kind}: a name is expected, the same on an output and on the inputs that receive it": "@{kind}: serve un nome, lo stesso su un output e sugli input che lo ricevono"
      , "@{kind}: a quoted colour is expected": "@{kind}: serve un colore tra virgolette"
      , "@{kind}: a quoted text is expected": "@{kind}: serve un testo tra virgolette"
      , "@{kind}: the quote is not closed": "@{kind}: le virgolette non sono chiuse"
      , "@convention: unknown convention {name}": "@convention: la convenzione {name} non esiste"
      , "@{kind} in a .pp file needs an explicit target": "@{kind} in un file .pp deve dire esplicitamente a cosa si applica"
      , "@{kind}: I cannot tell what this hint applies to; name its target after it": "@{kind}: non so a cosa si applichi questa indicazione; scrivi dopo di essa il nome a cui si applica"
      , "@inout goes in a comment just before an output or an input": "@inout va in un commento subito prima di un output o di un input"
      , "@inout {name}: no input has this name": "@inout {name}: nessun input ha questo nome"
      , "@inout {name}: no output has this name": "@inout {name}: nessun output ha questo nome"
      , "@{kind}: {name} is not declared": "@{kind}: {name} non \u00e8 dichiarato"
      , "@{kind}: {name} has {count} argument; an infix notation needs 2": ["@{kind}: {name} ha {count} argomento; una notazione infissa ne richiede 2", "@{kind}: {name} ha {count} argomenti; una notazione infissa ne richiede 2"]
      , "@{kind}: {name} has {count} argument; a prefix notation needs 1": ["@{kind}: {name} ha {count} argomento; una notazione prefissa ne richiede 1", "@{kind}: {name} ha {count} argomenti; una notazione prefissa ne richiede 1"]
      , "@{kind}: {name} has {count} argument; a postfix notation needs 1": ["@{kind}: {name} ha {count} argomento; una notazione postfissa ne richiede 1", "@{kind}: {name} ha {count} argomenti; una notazione postfissa ne richiede 1"]
      , "@notation: {name} has {count} argument but the notation uses #{hole}": ["@notation: {name} ha {count} argomento, ma la notazione usa #{hole}", "@notation: {name} ha {count} argomenti, ma la notazione usa #{hole}"]
      , "{language} code of the model": "Codice {language} del modello"
      , "F2 renames, F12 goes to the declaration": "F2 rinomina, F12 va alla dichiarazione"
      , "Cancel": "Annulla"
      , "OK": "OK"
      , "{count} error: {message}": ["{count} errore: {message}", "{count} errori, il primo: {message}"]
      , "No problems in {name}.": "Nessun problema in {name}."
      , "Save the file": "Salva il file"
      , "Apply": "Applica"
      , "Edit the code": "Modifica il codice"
      , "Studio (default)": "Studio (predefinito)"
      , "Midnight": "Mezzanotte"
      , "Paper (for printing and slides)": "Carta (per la stampa e le slide)"
      , "High contrast": "Contrasto elevato"
      , "Solarized light": "Solarized chiaro"
      , "Accent": "Accento"
      , "Background": "Sfondo"
      , "Parties": "Partecipanti"
      , "Calls": "Chiamate"
      , "Rename": "Rinomina"
      , "to": "in"
      , "all": "tutte"
      , "none": "nessuna"
      , "lines {from} to {to}": "righe da {from} a {to}"
      , "the whole model": "tutto il modello"
      , "{included} of {total} in {range}": "{included} di {total} in {range}"
      , "Type the new name: nothing changes until you apply it. Click an occurrence in the code to leave it out.": "Scrivi il nuovo nome: nulla cambia finch\u00e9 non lo applichi. Fai clic su un'occorrenza nel codice per escluderla."
      , "line {number}": "riga {number}"
      , "and {count} more line": ["e un'altra riga", "e altre {count} righe"]
      , "Double click to edit the party": "Doppio clic per modificare il partecipante"
      , "No process runs this party": "Nessun processo esegue questo partecipante"
      , "unused": "non usato"
      , "Symmetric role: shown with its mirrored copy. Click to show it once.": "Ruolo simmetrico: mostrato con la sua copia speculare. Fai clic per mostrarlo una volta sola."
      , "Symmetric role? Show it with a mirrored copy": "Ruolo simmetrico? Mostralo con una copia speculare"
      , "Show this party as code": "Mostra questo partecipante come codice"
      , "Show this party as formulas": "Mostra questo partecipante come formule"
      , "Add an action here": "Aggiungi un'azione qui"
      , "End of the process": "Fine del processo"
      , "Show the other way": "Mostra nell'altro modo"
      , "runs process {number}": "esegue il processo {number}"
      , "runs {name}": "esegue {name}"
      , "any number of copies": "un numero qualsiasi di copie"
      , "{count} process in parallel": ["{count} processo in parallelo", "{count} processi in parallelo"]
      , "Message {name} on {channel} (private channel)": "Messaggio {name} su {channel} (canale privato)"
      , "Message {name} on {channel}": "Messaggio {name} su {channel}"
      , "Message {name}": "Messaggio {name}"
      , "Message on {channel} (private channel)": "Messaggio su {channel} (canale privato)"
      , "Message on {channel}": "Messaggio su {channel}"
      , "Message": "Messaggio"
      , "Load a translation (.po)...": "Carica una traduzione (.po)..."
      , "Download the file to translate (.pot)": "Scarica il file da tradurre (.pot)"
      , "Download languages.js": "Scarica languages.js"
      , "Language of the interface": "Lingua dell'interfaccia"
      , "When the settings are saved, the page loads again in the language chosen, with the model and the history of its changes.": "Quando salvi le impostazioni, la pagina si ricarica nella lingua scelta, con il modello e la cronologia delle sue modifiche."
      , "Translate {app}": "Traduci {app}"
      , "Hand the file to translate to whoever knows another language: they write the translation of each message after msgstr, with a text editor or with Poedit, and load the file here to see it at once.": "Dai il file da tradurre a chi conosce un'altra lingua: scrive la traduzione di ogni messaggio dopo msgstr, con un editor di testo o con Poedit, e carica qui il file per vederla subito."
      , "To give a translation to everyone who opens {app}, load it here, then put the languages.js that this pane gives in the folder lang/, next to the page, in place of the one there. Keep the translation in lang/ too, for later changes.": "Per dare una traduzione a chiunque apra {app}, caricala qui, poi metti il languages.js che questo pannello fornisce nella cartella lang/, accanto alla pagina, al posto di quello che c'\u00e8. Tieni anche la traduzione in lang/, per le modifiche future."
      , "Automatic: the language of the browser ({name})": "Automatica: la lingua del browser ({name})"
      , "{name} (loaded)": "{name} (caricata)"
      , "Loaded by you: {name} ({code})": "Caricata da te: {name} ({code})"
      , "Remove": "Rimuovi"
      , "The messages of {app} are written in English.": "I messaggi di {app} sono scritti in inglese."
      , "All {total} messages are translated.": "Tutti i {total} messaggi sono tradotti."
      , "{translated} of {total} messages are translated; the others show in English.": "Messaggi tradotti: {translated} su {total}; gli altri appaiono in inglese."
      , "Download {name} to improve it (.po)": "Scarica la traduzione: {name} (.po)"
      , "Loaded {file}: {name} ({code}), {translated} of {total} messages. Save the settings to see it.": "Hai caricato {file}: {name} ({code}), messaggi tradotti: {translated} su {total}. Salva le impostazioni per vedere la traduzione."
      , "{count} line could not be read: {lines}": ["Non \u00e8 stato possibile leggere {count} riga: {lines}", "Non \u00e8 stato possibile leggere {count} righe: {lines}"]
      , "The file does not give the plural forms of the language: write them after Plural-Forms, in its header (see the comments at its top). Until then, plurals show as in English.": "Il file non indica le forme plurali della lingua: scrivile dopo Plural-Forms, nella sua intestazione (vedi i commenti in cima al file). Fino ad allora, i plurali appaiono come in inglese."
      , "Line {line}: {reason}; the message shows in English.": "Riga {line}: {reason}; il messaggio appare in inglese."
      , "And {count} more.": ["E un altro.", "E altri {count}."]
      , "An active attacker reads, writes and blocks public channels; a passive one only listens.": "Un attaccante attivo legge, scrive e blocca i canali pubblici; uno passivo si limita ad ascoltare."
      , "Compromise of session keys of other sessions.": "Compromissione delle chiavi di sessione di altre sessioni."
      , "Allow private communications on public terms.": "Permette comunicazioni private su termini pubblici."
      , "Allow choice/diff inside patterns.": "Permette choice/diff dentro i pattern."
      , "Make every input, get and let...suchthat precise.": "Rende precisi ogni input, get e let...suchthat."
      , "Ignore types during verification (types are still checked when parsing).": "Ignora i tipi durante la verifica (i tipi vengono comunque controllati durante l'analisi sintattica)."
      , "Move restrictions downwards before translating to clauses.": "Sposta le restrizioni verso il basso prima della traduzione in clausole."
      , "Move let bindings downwards before translating to clauses.": "Sposta i legami let verso il basso prima della traduzione in clausole."
      , "Include terms of the equational theory in the arguments of names.": "Include i termini della teoria equazionale negli argomenti dei nomi."
      , "Expand let terms precisely.": "Espande con precisione i termini let."
      , "Prove lemmas by induction by default.": "Dimostra i lemmi per induzione, per impostazione predefinita."
      , "Prove queries by induction by default.": "Dimostra le query per induzione, per impostazione predefinita."
      , "Remove events that are only used by lemmas.": "Rimuove gli eventi usati solo dai lemmi."
      , "How lemmas are applied during saturation.": "Come si applicano i lemmi durante la saturazione."
      , "How lemmas are applied during verification.": "Come si applicano i lemmi durante la verifica."
      , "Display the application of lemmas.": "Mostra l'applicazione dei lemmi."
      , "Ignore nounif declarations a few times.": "Ignora alcune volte le dichiarazioni nounif."
      , "How many times nounif declarations are ignored.": "Quante volte si ignorano le dichiarazioni nounif."
      , "Selection function of the resolution.": "Funzione di selezione della risoluzione."
      , "Stop when the resolution may not terminate.": "Si ferma quando la risoluzione potrebbe non terminare."
      , "Elimination of redundant clauses.": "Eliminazione delle clausole ridondanti."
      , "Elimination of redundant hypotheses.": "Eliminazione delle ipotesi ridondanti."
      , "Maximum depth of terms in clauses (an approximation).": "Profondit\u00e0 massima dei termini nelle clausole (un'approssimazione)."
      , "Maximum number of hypotheses of clauses (an approximation).": "Numero massimo di ipotesi delle clausole (un'approssimazione)."
      , "Maximum length of chains of inequalities.": "Lunghezza massima delle catene di disuguaglianze."
      , "Simplify equalities at the end of saturation.": "Semplifica le uguaglianze alla fine della saturazione."
      , "Check that all terms of clauses are in normal form.": "Controlla che tutti i termini delle clausole siano in forma normale."
      , "Treatment of equations.": "Trattamento delle equazioni."
      , "Ordering of function symbols for the termination of equations.": "Ordinamento dei simboli di funzione per la terminazione delle equazioni."
      , "Check that predicates can be implemented.": "Controlla che i predicati si possano implementare."
      , "Threshold for cleaning up the clause database (percent).": "Soglia per ripulire la base di clausole (in percentuale)."
      , "Maximum depth of the unification index.": "Profondit\u00e0 massima dell'indice di unificazione."
      , "Reconstruct attack traces (yes, no, or the number of attempts).": "Ricostruisce le tracce d'attacco (yes, no, o il numero di tentativi)."
      , "Backtrack when reconstructing traces.": "Torna indietro (backtracking) durante la ricostruzione delle tracce."
      , "Unify derivations to help trace reconstruction.": "Unifica le derivazioni per aiutare la ricostruzione delle tracce."
      , "Reconstruct derivations.": "Ricostruisce le derivazioni."
      , "Simplify derivations.": "Semplifica le derivazioni."
      , "Explain derivations in English.": "Spiega le derivazioni in inglese."
      , "Display derivations.": "Mostra le derivazioni."
      , "Abbreviate names in derivations.": "Abbrevia i nomi nelle derivazioni."
      , "How attack traces are displayed.": "Come si mostrano le tracce d'attacco."
      , "Display the generated clauses.": "Mostra le clausole generate."
      , "Remove subsumed clauses before displaying them.": "Rimuove le clausole sussunte prima di mostrarle."
      , "Abbreviate clauses when displaying them.": "Abbrevia le clausole quando le mostra."
      , "Use ANSI colours in the output.": "Usa i colori ANSI nell'output."
      , "Display the clause database.": "Mostra la base di clausole."
      , "Display statistics while saturating.": "Mostra le statistiche durante la saturazione."
      , "Display \"goal reachable\" clauses.": "Mostra le clausole \"goal reachable\"."
      , "Display rules.": "Mostra le regole."
      , "Display redundant clauses.": "Mostra le clausole ridondanti."
      , "Display completed clauses.": "Mostra le clausole completate."
      , "Display information on equations.": "Mostra informazioni sulle equazioni."
      , "Display termination warnings.": "Mostra gli avvisi di terminazione."
      , "Display information on destructors.": "Mostra informazioni sui distruttori."
      , "Simplify biprocesses before proving equivalences.": "Semplifica i biprocessi prima di dimostrare le equivalenze."
      , "Reject simplified processes containing choice[true, false].": "Rifiuta i processi semplificati che contengono choice[true, false]."
      , "Reject processes that cannot be simplified.": "Rifiuta i processi che non si possono semplificare."
      , "Simplify tests on constants when expanding terms.": "Semplifica i test sulle costanti durante l'espansione dei termini."
      , "Deprecated.": "Deprecato."
      , "Choose swappings of synchronisations interactively.": "Sceglie in modo interattivo gli scambi delle sincronizzazioni."
      , "Swapping of synchronisations, e.g. \"tag1 -> tag2\".": "Scambio delle sincronizzazioni, per esempio \"tag1 -> tag2\"."
      , "Record features of clauses.": "Registra le caratteristiche delle clausole."
      , "Record function symbols as features.": "Registra i simboli di funzione come caratteristiche."
      , "Record names as features.": "Registra i nomi come caratteristiche."
      , "Record predicates as features.": "Registra i predicati come caratteristiche."
      , "Record events as features.": "Registra gli eventi come caratteristiche."
      , "Record tables as features.": "Registra le tabelle come caratteristiche."
      , "Record the depth of terms as a feature.": "Registra la profondit\u00e0 dei termini come caratteristica."
      , "Record the width of terms as a feature.": "Registra l'ampiezza dei termini come caratteristica."
      , "Attacker model": "Modello dell'attaccante"
      , "Syntax": "Sintassi"
      , "Precision": "Precisione"
      , "Lemmas": "Lemmi"
      , "Attack reconstruction": "Ricostruzione degli attacchi"
      , "Resolution": "Risoluzione"
      , "Process simplification": "Semplificazione dei processi"
      , "Display": "Visualizzazione"
      , "Features": "Caratteristiche"
      , "Declares a type, for names, variables and the arguments of functions.": "Dichiara un tipo, per nomi, variabili e argomenti delle funzioni."
      , "Declares free names, which the attacker knows unless they are [private]: public channels, or secrets.": "Dichiara nomi liberi, che l'attaccante conosce a meno che non siano [private]: canali pubblici o segreti."
      , "Declares constants: functions without arguments.": "Dichiara costanti: funzioni senza argomenti."
      , "Declares a constructor, a function that builds terms such as encryptions; the attacker can apply it unless it is [private].": "Dichiara un costruttore, una funzione che costruisce termini come le cifrature; l'attaccante pu\u00f2 applicarlo a meno che non sia [private]."
      , "Declares a destructor by rewrite rules, such as decryption: sdec(senc(m, k), k) = m. When no rule applies, it fails.": "Dichiara un distruttore con regole di riscrittura, come la decifratura: sdec(senc(m, k), k) = m. Quando nessuna regola si applica, fallisce."
      , "Declares equations between terms, such as the commutativity of exponentiation in Diffie-Hellman.": "Dichiara equazioni tra termini, come la commutativit\u00e0 dell'esponenziazione in Diffie-Hellman."
      , "Declares a predicate, for clauses and for the conditions of queries.": "Dichiara un predicato, per le clausole e per le condizioni delle query."
      , "Declares a table: processes insert rows into it and look them up with get; the attacker cannot read it.": "Dichiara una tabella: i processi vi inseriscono righe e le cercano con get; l'attaccante non pu\u00f2 leggerla."
      , "Declares or executes an event: events mark points of the protocol, for correspondence queries.": "Dichiara o esegue un evento: gli eventi segnano punti del protocollo, per le query di corrispondenza."
      , "Asks a security property: the secrecy of a term (attacker(s)), or a correspondence between events (==>).": "Chiede una propriet\u00e0 di sicurezza: la segretezza di un termine (attacker(s)) o una corrispondenza tra eventi (==>)."
      , "States a property that ProVerif proves first, then uses to prove the queries.": "Enuncia una propriet\u00e0 che ProVerif dimostra per prima, poi usa per dimostrare le query."
      , "States a property that ProVerif assumes without proof, to help prove the queries.": "Enuncia una propriet\u00e0 che ProVerif assume senza dimostrarla, per aiutare a dimostrare le query."
      , "Restricts the traces to those that satisfy a property.": "Restringe le tracce a quelle che soddisfano una propriet\u00e0."
      , "Asks for strong secrecy: the attacker cannot tell runs apart when the given names change value.": "Chiede la segretezza forte: l'attaccante non distingue le esecuzioni quando i nomi indicati cambiano valore."
      , "Asks whether a weak secret, such as a password, resists offline guessing.": "Chiede se un segreto debole, come una password, resiste agli attacchi a tentativi offline."
      , "A secrecy assumption: a fact that never holds. ProVerif checks it, and uses it to speed up the proof.": "Un'ipotesi di segretezza: un fatto che non vale mai. ProVerif la verifica e la usa per accelerare la dimostrazione."
      , "A hint for the resolution: do not resolve on facts of this form. It changes speed and termination, not soundness.": "Un suggerimento per la risoluzione: non risolvere su fatti di questa forma. Cambia velocit\u00e0 e terminazione, non la correttezza."
      , "A hint for the resolution: resolve on facts of this form first.": "Un suggerimento per la risoluzione: risolvi prima su fatti di questa forma."
      , "Defines a function by a term, expanded where it is used.": "Definisce una funzione con un termine, espanso dove viene usato."
      , "Binds a variable or matches a pattern: let x = M in P. It also defines a process macro: let P(x: T) = ...": "Lega una variabile o confronta un pattern: let x = M in P. Definisce anche una macro di processo: let P(x: T) = ..."
      , "Starts the main process: the roles of the protocol, usually in parallel and replicated.": "Inizia il processo principale: i ruoli del protocollo, di solito in parallelo e replicati."
      , "Creates a fresh name that the attacker does not know: a nonce or a key.": "Crea un nome nuovo che l'attaccante non conosce: un nonce o una chiave."
      , "Receives a message on a channel: in(c, x: T); on a public channel it comes from the attacker. Also ends a let: let x = M in P.": "Riceve un messaggio su un canale: in(c, x: T); su un canale pubblico arriva dall'attaccante. Chiude anche un let: let x = M in P."
      , "Sends a message on a channel: out(c, M); on a public channel the attacker gets it.": "Invia un messaggio su un canale: out(c, M); su un canale pubblico l'attaccante lo riceve."
      , "A test: if M then P else Q.": "Un test: if M then P else Q."
      , "What runs when the test, the match or the lookup succeeds.": "Ci\u00f2 che viene eseguito quando il test, il confronto o la ricerca riesce."
      , "What runs when the test, the match or the lookup fails.": "Ci\u00f2 che viene eseguito quando il test, il confronto o la ricerca fallisce."
      , "Inserts a row into a table: insert t(M1, ..., Mn).": "Inserisce una riga in una tabella: insert t(M1, ..., Mn)."
      , "Looks up a row of a table that matches a pattern: get t(=M, x) in P else Q.": "Cerca una riga di una tabella che corrisponde a un pattern: get t(=M, x) in P else Q."
      , "A condition: get ... suchthat M, or let x suchthat p(x), which picks any value that satisfies it.": "Una condizione: get ... suchthat M, oppure let x suchthat p(x), che sceglie un valore qualsiasi che la soddisfa."
      , "Starts a new phase: earlier processes stop, and the attacker keeps what it knows. Used for forward secrecy.": "Inizia una nuova fase: i processi precedenti si fermano e l'attaccante conserva ci\u00f2 che sa. Si usa per la forward secrecy."
      , "A synchronisation barrier: processes wait for each other at sync n.": "Una barriera di sincronizzazione: i processi si attendono a vicenda in sync n."
      , "A biprocess: choice[M, N] is M on the left and N on the right; ProVerif proves the two sides equivalent.": "Un biprocesso: choice[M, N] \u00e8 M a sinistra e N a destra; ProVerif dimostra che i due lati sono equivalenti."
      , "A biprocess: diff[M, N] is M on the left and N on the right; ProVerif proves the two sides equivalent.": "Un biprocesso: diff[M, N] \u00e8 M a sinistra e N a destra; ProVerif dimostra che i due lati sono equivalenti."
      , "The failure of a computation, such as a destructor that does not apply.": "Il fallimento di un calcolo, come un distruttore che non si applica."
      , "Declares the variables of a rewrite rule, an equation, a clause or a query.": "Dichiara le variabili di una regola di riscrittura, di un'equazione, di una clausola o di una query."
      , "Adds rules to a destructor that apply when the rules before them do not.": "Aggiunge a un distruttore regole che si applicano quando quelle precedenti non si applicano."
      , "Defines a macro of declarations, which expand instantiates.": "Definisce una macro di dichiarazioni, che expand istanzia."
      , "Expands a macro of declarations defined with def, with its arguments.": "Espande una macro di dichiarazioni definita con def, con i suoi argomenti."
      , "Sets an option of ProVerif, such as set attacker = passive.": "Imposta un'opzione di ProVerif, come set attacker = passive."
      , "Declares channels: free names of type channel.": "Dichiara canali: nomi liberi di tipo channel."
      , "The end of a process, as 0, in the syntax of CryptoVerif.": "La fine di un processo, come 0, nella sintassi di CryptoVerif."
      , "Declares Horn clauses directly, for the attacker or for predicates.": "Dichiara direttamente clausole di Horn, per l'attaccante o per i predicati."
      , "Declares a fact that always holds, to simplify the clauses.": "Dichiara un fatto che vale sempre, per semplificare le clausole."
      , "Asks whether two processes are observationally equivalent.": "Chiede se due processi sono osservazionalmente equivalenti."
      , "In noninterf: the values that a secret ranges over.": "In noninterf: i valori che un segreto pu\u00f2 assumere."
      , "An injective event in a query: each occurrence matches a distinct occurrence of the events before it.": "Un evento iniettivo in una query: ogni occorrenza corrisponde a un'occorrenza distinta degli eventi che lo precedono."
      , "attacker(M): the attacker knows M. query attacker(s) asks whether s stays secret.": "attacker(M): l'attaccante conosce M. query attacker(s) chiede se s resta segreto."
      , "mess(c, M): the message M is on channel c.": "mess(c, M): il messaggio M \u00e8 sul canale c."
      , "Picks any values that satisfy a condition: let x suchthat p(x) in P.": "Sceglie valori qualsiasi che soddisfano una condizione: let x suchthat p(x) in P."
      , "Runs a process macro, defined with let, with its arguments.": "Esegue una macro di processo, definita con let, con i suoi argomenti."
      , "Replication: unboundedly many copies of the process run in parallel, one per session.": "Replicazione: un numero illimitato di copie del processo eseguite in parallelo, una per sessione."
      , "Parallel composition: the processes run at the same time.": "Composizione parallela: i processi vengono eseguiti contemporaneamente."
      , "The end of a process: it does nothing more.": "La fine di un processo: non fa altro."
      , "branch": "ramo"
      , "A branch: what runs after a test, a match, or in a parallel composition.": "Un ramo: ci\u00f2 che viene eseguito dopo un test, un confronto o in una composizione parallela."
      , "name": "nome"
      , "type": "tipo"
      , "pattern": "pattern"
      , "value": "valore"
      , "condition": "condizione"
      , "channel": "canale"
      , "message": "messaggio"
      , "event": "evento"
      , "row": "riga"
      , "number": "numero"
      , "call": "chiamata"
      , "left": "sinistra"
      , "right": "destra"
      , "Actions": "Azioni"
      , "Builtin types": "Tipi predefiniti"
      , "A fresh name: new k: key, or k <-R key as in CryptoVerif": "Un nome fresco: new k: key, oppure k <-R key come in CryptoVerif"
      , "Send a message: out(c, M)": "Invia un messaggio: out(c, M)"
      , "Receive a message: in(c, x: T)": "Ricevi un messaggio: in(c, x: T)"
      , "Compute or match: let x = M in, or x <- M; as in CryptoVerif": "Calcola o confronta: let x = M in, oppure x <- M; come in CryptoVerif"
      , "A test: if M then ... else ...": "Un test: if M then ... else ..."
      , "An event, for correspondence queries": "Un evento, per le query di corrispondenza"
      , "Insert a row into a table": "Inserisci una riga in una tabella"
      , "Look up a row of a table": "Cerca una riga di una tabella"
      , "Run a process macro: P(args)": "Esegui una macro di processo: P(args)"
      , "Start a new phase": "Inizia una nuova fase"
      , "function": "funzione"
      , "table": "tabella"
      , "predicate": "predicato"
      , "process": "processo"
      , "function (letfun)": "funzione (letfun)"
      , "variable": "variabile"
      , "keyword": "parola chiave"
      , "internal error of the checker: {message}": "errore interno del controllore: {message}"
      , "Identifiers start with a letter and contain letters, digits, _ and '": "Gli identificatori iniziano con una lettera e contengono lettere, cifre, _ e '"
      , "{name} is a ProVerif keyword": "{name} \u00e8 una parola chiave di ProVerif"
      , "Unknown symbol": "Simbolo sconosciuto"
      , "{name} is built in and cannot be renamed": "{name} \u00e8 predefinito e non si pu\u00f2 rinominare"
      , "{name} is already declared ({kind})": "{name} \u00e8 gi\u00e0 dichiarato ({kind})"
      , "not a process declaration": "non \u00e8 la dichiarazione di un processo"
      , "parameters": "parametri"
      , "cannot locate the header of this process": "non trovo l'intestazione di questo processo"
      , "cannot rename this process": "non si pu\u00f2 rinominare questo processo"
      , "this declaration has no options": "questa dichiarazione non ha opzioni"
      , "{name} is already declared": "{name} \u00e8 gi\u00e0 dichiarato"
      , "empty": "vuoto"
      , "argument of the name": "argomento del nome"
      , "arguments": "argomenti"
      , "phase: a positive integer is expected": "fase: serve un intero positivo"
      , "sync: a positive integer is expected": "sync: serve un intero positivo"
      , "tag": "etichetta"
      , "variables: x: type is expected, not {text}": "variabili: serve x: tipo, non {text}"
      , "variables: at least one typed variable is required": "variabili: serve almeno una variabile con il suo tipo"
      , "patterns": "pattern"
      , "unknown action {kind}": "azione sconosciuta {kind}"
      , "no such node": "nodo inesistente"
      , "only actions followed by a continuation can change kind": "solo le azioni seguite da una continuazione possono cambiare genere"
      , "this action has an else branch: remove the branch first, or keep a conditional": "questa azione ha un ramo else: prima rimuovi il ramo, oppure tieni un condizionale"
      , "this action has no options": "questa azione non ha opzioni"
      , "insertion point is not a process": "il punto di inserimento non \u00e8 un processo"
      , "only sequential actions and conditionals can be moved": "si possono spostare solo le azioni sequenziali e i condizionali"
      , "cannot move a conditional into its own else branch": "non si pu\u00f2 spostare un condizionale nel suo stesso ramo else"
      , "only conditionals have an else branch": "solo i condizionali hanno un ramo else"
      , "Observational equivalence of the biprocess (choice)": "Equivalenza osservazionale del biprocesso (choice)"
      , "Observational equivalence of the two processes": "Equivalenza osservazionale dei due processi"
      , "Queries are incompatible with equivalence": "Le query sono incompatibili con l'equivalenza"
      , "Queries are incompatible with choice": "Le query sono incompatibili con choice"
      , "Generated by PieStudio; verify with: proverif <this file>": "Generato da PieStudio; verifica con: proverif <questo file>"
      , "reachability and correspondence queries": "query di raggiungibilit\u00e0 e di corrispondenza"
      , "queries": "query"
      , "all goals (no split needed)": "tutti gli obiettivi (nessuna divisione necessaria)"
      , "observational equivalence of the two processes": "equivalenza osservazionale dei due processi"
      , "observational equivalence (biprocess)": "equivalenza osservazionale (biprocesso)"
      , "biprocess (choice)": "biprocesso (choice)"
      , "first process of the equivalence": "primo processo dell'equivalenza"
      , "second process of the equivalence": "secondo processo dell'equivalenza"
      , "choice[,] projected on its left side": "choice[,] proiettato sul lato sinistro"
      , "choice[,] projected on its right side": "choice[,] proiettato sul lato destro"
      , "model": "modello"
      , "Type": "Tipo"
      , "A type of messages. channel, bitstring, bool and nat are built in.": "Un tipo di messaggi. channel, bitstring, bool e nat sono predefiniti."
      , "Name": "Nome"
      , "Options (for CryptoVerif)": "Opzioni (per CryptoVerif)"
      , "Notation (LaTeX)": "Notazione (LaTeX)"
      , "Free name": "Nome libero"
      , "Names known from the start: public channels and constants, or secrets unknown to the attacker ([private]).": "Nomi noti fin dall'inizio: canali e costanti pubblici, o segreti sconosciuti all'attaccante ([private])."
      , "Names": "Nomi"
      , "unknown to the attacker (a private channel is drawn dotted)": "sconosciuto all'attaccante (un canale privato \u00e8 disegnato a puntini)"
      , "Channel": "Canale"
      , "Public channels (the same as free c: channel).": "Canali pubblici (come free c: channel)."
      , "Channels": "Canali"
      , "Constant": "Costante"
      , "Public constants of a type.": "Costanti pubbliche di un tipo."
      , "Constants": "Costanti"
      , "unknown to the attacker": "sconosciuta all'attaccante"
      , "Other options": "Altre opzioni"
      , "Constructor": "Costruttore"
      , "A function symbol that builds messages (encryption, signature, hash, pairing). The attacker can apply it unless it is private.": "Un simbolo di funzione che costruisce messaggi (cifratura, firma, hash, coppie). L'attaccante pu\u00f2 applicarlo, a meno che non sia privato."
      , "Argument types": "Tipi degli argomenti"
      , "Result type": "Tipo del risultato"
      , "the attacker cannot apply it": "l'attaccante non pu\u00f2 applicarlo"
      , "the attacker can also take it apart, like a tuple": "l'attaccante pu\u00f2 anche scomporlo, come una tupla"
      , "the identity, changing the type": "l'identit\u00e0, che cambia il tipo"
      , "Destructor (fun ... reduc)": "Distruttore (fun ... reduc)"
      , "A function defined by rewrite rules tried in order (otherwise). It fails when no rule applies.": "Una funzione definita da regole di riscrittura provate in ordine (otherwise). Fallisce quando nessuna regola si applica."
      , "Rewrite rules (tried in order)": "Regole di riscrittura (provate in ordine)"
      , "Destructor (reduc)": "Distruttore (reduc)"
      , "Rewrite rules defining a destructor of constructors declared with fun, e.g. sdec(senc(x, k), k) = x.": "Regole di riscrittura che definiscono un distruttore di costruttori dichiarati con fun, per esempio sdec(senc(x, k), k) = x."
      , "Rewrite rules": "Regole di riscrittura"
      , "Notation of the destructor (LaTeX)": "Notazione del distruttore (LaTeX)"
      , "Equation": "Equazione"
      , "Equational theory, e.g. Diffie-Hellman exp(exp(g, x), y) = exp(exp(g, y), x). A notation here is the one of the function on the left.": "Teoria equazionale, per esempio Diffie-Hellman exp(exp(g, x), y) = exp(exp(g, y), x). Una notazione qui \u00e8 quella della funzione a sinistra."
      , "Equations": "Equazioni"
      , "the equations form a convergent rewrite system": "le equazioni formano un sistema di riscrittura convergente"
      , "the equations are linear": "le equazioni sono lineari"
      , "Notation of the function on the left (LaTeX)": "Notazione della funzione a sinistra (LaTeX)"
      , "Event": "Evento"
      , "Events mark steps of the protocol; correspondence queries relate them (authentication). Drawn in green boxes.": "Gli eventi segnano i passi del protocollo; le query di corrispondenza li mettono in relazione (autenticazione). Disegnati in riquadri verdi."
      , "Table": "Tabella"
      , "Tables store rows private to the honest processes (insert and get), e.g. a key directory. Drawn in purple boxes.": "Le tabelle conservano righe riservate ai processi onesti (insert e get), per esempio un elenco di chiavi. Disegnate in riquadri viola."
      , "Column types": "Tipi delle colonne"
      , "Predicate": "Predicato"
      , "Predicates defined by clauses, usable in let ... suchthat and in queries.": "Predicati definiti da clausole, utilizzabili in let ... suchthat e nelle query."
      , "the predicate is not defined by clauses": "il predicato non \u00e8 definito da clausole"
      , "optimise the membership predicate (arity 2)": "ottimizza il predicato di appartenenza (ariet\u00e0 2)"
      , "Term macro (letfun)": "Macro di termine (letfun)"
      , "A macro for terms, expanded where it is used.": "Una macro per i termini, espansa dove si usa."
      , "Parameters": "Parametri"
      , "Definition": "Definizione"
      , "Process (party)": "Processo (partecipante)"
      , "A process macro: one party of the protocol. Its actions are edited in the diagram.": "Una macro di processo: un partecipante del protocollo. Le sue azioni si modificano nel diagramma."
      , "Query": "Query"
      , "Security properties to verify: secrecy attacker(s), correspondences event(e1(x)) ==> event(e2(x)), injective ones with inj-event.": "Propriet\u00e0 di sicurezza da verificare: segretezza attacker(s), corrispondenze event(e1(x)) ==> event(e2(x)), quelle iniettive con inj-event."
      , "Variables": "Variabili"
      , "Types of the variables of the queries (Infer finds them from the events).": "Tipi delle variabili delle query (Deduci li trova dagli eventi)."
      , "Queries": "Query"
      , "Options": "Opzioni"
      , "Lemma, axiom or restriction": "Lemma, assioma o restrizione"
      , "lemma: proved, then used to help other proofs; axiom: assumed; restriction: excludes traces.": "lemma: dimostrato, poi usato per aiutare altre dimostrazioni; axiom: assunto; restriction: esclude delle tracce."
      , "Kind": "Genere"
      , "Statements": "Enunciati"
      , "Strong secrecy (noninterf)": "Segretezza forte (noninterf)"
      , "The attacker cannot distinguish runs with different values of these names (optionally among a set of terms).": "L'attaccante non pu\u00f2 distinguere esecuzioni con valori diversi di questi nomi (eventualmente tra un insieme di termini)."
      , "Variables (for the among terms)": "Variabili (per i termini di among)"
      , "Secrets": "Segreti"
      , "Weak secret": "Segreto debole"
      , "Resistance to off-line guessing attacks on a low-entropy secret (a password).": "Resistenza agli attacchi off-line per tentativi su un segreto a bassa entropia (una password)."
      , "Secret": "Segreto"
      , "Setting": "Impostazione"
      , "ProVerif settings, e.g. set attacker = passive. A setting at its default value is not written.": "Impostazioni di ProVerif, per esempio set attacker = passive. Un'impostazione al suo valore predefinito non si scrive."
      , "Value": "Valore"
      , "Secrecy assumption (not)": "Ipotesi di segretezza (not)"
      , "Facts assumed unreachable, e.g. not attacker(new k). ProVerif checks them.": "Fatti ritenuti irraggiungibili, per esempio not attacker(new k). ProVerif li controlla."
      , "Unification hint (nounif)": "Indicazione di unificazione (nounif)"
      , "nounif / select / noselect guide the resolution strategy, e.g. nounif x: key; attacker(f(*x)).": "nounif / select / noselect guidano la strategia di risoluzione, per esempio nounif x: key; attacker(f(*x))."
      , "Facts always true for a predicate.": "Fatti sempre veri per un predicato."
      , "Clauses": "Clausole"
      , "Horn clauses defining predicates.": "Clausole di Horn che definiscono predicati."
      , "Macro (def)": "Macro (def)"
      , "A parameterised block of declarations, instantiated with expand.": "Un blocco di dichiarazioni con parametri, istanziato con expand."
      , "Macro expansion": "Espansione di una macro"
      , "Instantiates a def macro.": "Istanzia una macro def."
      , "CryptoVerif declaration": "Dichiarazione di CryptoVerif"
      , "param, proba, letproba, proof, implementation: ProVerif ignores them (they are kept for CryptoVerif).": "param, proba, letproba, proof, implementation: ProVerif le ignora (restano per CryptoVerif)."
      , "Types and names": "Tipi e nomi"
      , "Cryptographic primitives": "Primitive crittografiche"
      , "Protocol": "Protocollo"
      , "Security goals": "Obiettivi di sicurezza"
      , "Advanced": "Avanzate"
      , "empty declaration": "dichiarazione vuota"
      , "Secrecy of {name}": "Segretezza di {name}"
      , "Authentication: {end} implies {begin}": "Autenticazione: {end} implica {begin}"
      , "Injective: {end} implies {begin}": "Iniettiva: {end} implica {begin}"
      , "Reachability of {name}": "Raggiungibilit\u00e0 di {name}"
      , "Real-or-random secrecy of {name}": "Segretezza real-or-random di {name}"
      , "Main process": "Processo principale"
      , "Equivalence, side {number}": "Equivalenza, lato {number}"
      , "Handshake (flawed)": "Handshake (difettoso)"
      , "Secrecy and authentication fail: a man in the middle learns the key.": "Segretezza e autenticazione falliscono: un attaccante man-in-the-middle scopre la chiave."
      , "Handshake (fixed)": "Handshake (corretto)"
      , "The server signs the client key: all queries hold.": "Il server firma la chiave del client: tutte le query sono soddisfatte."
      , "Signed Diffie-Hellman, in paper notation": "Diffie-Hellman firmato, nella notazione degli articoli"
      , "Pretty printing hints: g^a, {m}_k, x || y.": "Indicazioni di notazione: g^a, {m}_k, x || y."
      , "Key confirmation (symmetric role)": "Conferma della chiave (ruolo simmetrico)"
      , "One role run by both devices, drawn with its mirrored copy.": "Un ruolo eseguito da entrambi i dispositivi, disegnato con la sua copia speculare."
      , "Needham-Schroeder public key": "Needham-Schroeder a chiave pubblica"
      , "Lowe's attack on the authentication of the responder.": "L'attacco di Lowe all'autenticazione del rispondente."
      , "Needham-Schroeder-Lowe": "Needham-Schroeder-Lowe"
      , "The fix: the responder names itself in message 2.": "La correzione: il rispondente si nomina nel messaggio 2."
      , "Signed Diffie-Hellman, phases": "Diffie-Hellman firmato, fasi"
      , "Long-term keys leak in phase 1; the session secret survives.": "Le chiavi a lungo termine trapelano nella fase 1; il segreto di sessione sopravvive."
      , "Weak secret and non-interference": "Segreto debole e non interferenza"
      , "Off-line guessing breaks the password.": "Gli attacchi off-line per tentativi rompono la password."
      , "Strong secrecy (biprocess)": "Segretezza forte (biprocesso)"
      , "choice[,] and observational equivalence.": "choice[,] ed equivalenza osservazionale."
      , "Mixed goals (split export)": "Obiettivi misti (esportazione divisa)"
      , "Queries and choice together: verified, and exported, as several files.": "Query e choice insieme: verifica ed esportazione in pi\u00f9 file."
      , "No occurrence is chosen.": "Non hai scelto alcuna occorrenza."
      , "The name is the same.": "Il nome \u00e8 lo stesso."
      , "With this name, the renamed occurrences would not all refer to the same declaration.": "Con questo nome, le occorrenze rinominate non si riferirebbero tutte alla stessa dichiarazione."
      , "The name {name} is already used on line {line}: it would refer to the renamed declaration.": "Il nome {name} \u00e8 gi\u00e0 usato alla riga {line}: si riferirebbe alla dichiarazione rinominata."
      , "The name {name} is already used in the selection: the renamed declaration would hide it, or be hidden by it.": "Il nome {name} \u00e8 gi\u00e0 usato nella selezione: la dichiarazione rinominata lo nasconderebbe, o ne sarebbe nascosta."
      , "The name {name} is already used in the model: the renamed declaration would hide it, or be hidden by it.": "Il nome {name} \u00e8 gi\u00e0 usato nel modello: la dichiarazione rinominata lo nasconderebbe, o ne sarebbe nascosta."
      , "The model would have new errors: {message} (line {line}).": "Il modello avrebbe nuovi errori: {message} (riga {line})."
      , "attack": "attacco"
      , "Attack on {goal}": "Attacco a {goal}"
      , "Library {name}": "Libreria {name}"
      , "{file}: verification report": "{file}: rapporto di verifica"
      , "Verified with ProVerif 2.05 in PieStudio, {date}.": "Verificato con ProVerif 2.05 in PieStudio, {date}."
      , "Time: {seconds} s, memory: {size} MB.": "Tempo: {seconds} s, memoria: {size} MB."
      , "Result": "Risultato"
      , "Goal": "Obiettivo"
      , "Attack traces": "Tracce d'attacco"
      , "Model": "Modello"
      , "Written by PieStudio.": "Scritto da PieStudio."
      , "true": "vero"
      , "false": "falso"
      , "cannot be proved": "non dimostrabile"
      , "new {name}: {type} creating {value}": "new {name}: {type}, che crea {value}"
      , "{channel}: {message} (between processes)": "{channel}: {message} (tra processi)"
      , "attacker obtains {message}": "l'attaccante ottiene {message}"
      , "event {event} executed": "evento {event} eseguito"
      , "Settings": "Impostazioni"
      , "Types": "Tipi"
      , "Names and channels": "Nomi e canali"
      , "Functions and equations": "Funzioni ed equazioni"
      , "Events, tables, predicates": "Eventi, tabelle, predicati"
      , "Term macros": "Macro di termini"
      , "Parties (processes)": "Partecipanti (processi)"
      , "Add": "Aggiungi"
      , "Show more ({count} not shown)": "Mostra le altre ({count})"
      , "None yet": "Ancora nessuna"
      , "None matches": "Nessuna corrisponde"
      , "Libraries (-lib)": "Librerie (-lib)"
      , "{name}: {count} declaration": ["{name}: {count} dichiarazione", "{name}: {count} dichiarazioni"]
      , "{count} decl.": "{count} dich."
      , "not used by this model": "non usata da questo modello"
      , "{count} error": ["{count} errore", "{count} errori"]
      , "Edit the library": "Modifica la libreria"
      , "Remove the library": "Rimuovi la libreria"
      , "The model needs {name} (@library): open it": "Il modello richiede {name} (@library): aprila"
      , "missing": "mancante"
      , "Attacker": "Attaccante"
      , "attacker has": "l'attaccante ha"
      , "goal: event": "obiettivo: evento"
      , "attacker test": "test dell'attaccante"
      , "No problems: ProVerif accepts this model.": "Nessun problema: ProVerif accetta questo modello."
      , "Reported by ProVerif 2.05 itself": "Segnalato da ProVerif 2.05 stesso"
      , "Verify the model (F5) to see the results of its security goals.": "Verifica il modello (F5) per vedere i risultati dei suoi obiettivi di sicurezza."
      , "ProVerif is working...": "ProVerif sta lavorando..."
      , "Memory of the engine: {used} MB, with no budget": "Memoria del motore: {used} MB, senza limite"
      , "Memory of the engine: {used} MB of a budget of {limit} MB": "Memoria del motore: {used} MB su un limite di {limit} MB"
      , "{used} MB, no limit": "{used} MB, senza limite"
      , "Security goal": "Obiettivo di sicurezza"
      , "trace": "traccia"
      , "Verify the model, then choose a result that has an attack trace.": "Verifica il modello, poi scegli un risultato che ha una traccia d'attacco."
      , "Previous step": "Passo precedente"
      , "Next step": "Passo successivo"
      , "ProVerif found an attack but could not rebuild a trace of it.": "ProVerif ha trovato un attacco, ma non \u00e8 riuscito a ricostruirne una traccia."
      , "The goal holds: there is no attack to show.": "L'obiettivo \u00e8 soddisfatto: non c'\u00e8 alcun attacco da mostrare."
      , "ProVerif could neither prove the goal nor find an attack.": "ProVerif non \u00e8 riuscito n\u00e9 a dimostrare l'obiettivo n\u00e9 a trovare un attacco."
      , "Derivation ({count} step)": ["Derivazione ({count} passo)", "Derivazione ({count} passi)"]
      , "Step {number} of {count}: {text}": "Passo {number} di {count}: {text}"
      , "{count} step. Click a step to see the action that made it.": ["{count} passo. Fai clic su un passo per vedere l'azione che lo ha prodotto.", "{count} passi. Fai clic su un passo per vedere l'azione che lo ha prodotto."]
      , "Modifiers": "Modificatori"
      , "Find the types from the events and tables": "Trova i tipi dagli eventi e dalle tabelle"
      , "Infer": "Deduci"
      , "any value (empty)": "qualsiasi valore (vuoto)"
      , "Default: {value}.": "Predefinito: {value}."
      , "{value} (default)": "{value} (predefinito)"
      , "for example {example}": "per esempio {example}"
      , "Shown as": "Mostrato come"
      , "Suggestions": "Suggerimenti"
      , "Form": "Modulo"
      , "ProVerif source": "Sorgente ProVerif"
      , "Edit {what}": "Modifica {what}"
      , "Add {what}": "Aggiungi {what}"
      , "Fill in the form: the declaration is checked as you type.": "Compila il modulo: la dichiarazione viene controllata mentre scrivi."
      , "Valid": "Valida"
      , "the default": "quella predefinita"
      , "Declare events and names first": "Prima dichiara eventi e nomi"
      , "as in CryptoVerif": "come in CryptoVerif"
      , "k <-R key; instead of new k: key; ProVerif reads both": "k <-R key; invece di new k: key; ProVerif accetta entrambe le forme"
      , "Pattern (what is received)": "Pattern (ci\u00f2 che si riceve)"
      , "a more precise analysis of this input (ProVerif 2.03 and later)": "un'analisi pi\u00f9 precisa di questo input (ProVerif 2.03 e successivi)"
      , "Pattern": "Pattern"
      , "else branch": "ramo else"
      , "what to do when the value does not match": "cosa fare quando il valore non corrisponde"
      , "x <- M; instead of let x = M in, for a variable or _ without else branch; ProVerif reads both": "x <- M; invece di let x = M in, per una variabile o _ senza ramo else; ProVerif accetta entrambe le forme"
      , "Condition": "Condizione"
      , "a more precise analysis of this choice": "un'analisi pi\u00f9 precisa di questa scelta"
      , "what to do when no value fits": "cosa fare quando nessun valore va bene"
      , "what to do when the condition is false": "cosa fare quando la condizione \u00e8 falsa"
      , "Arguments": "Argomenti"
      , "Row": "Riga"
      , "Row patterns": "Pattern della riga"
      , "Condition (optional)": "Condizione (facoltativa)"
      , "a more precise analysis of this lookup": "un'analisi pi\u00f9 precisa di questa ricerca"
      , "what to do when no row matches": "cosa fare quando nessuna riga corrisponde"
      , "Process": "Processo"
      , "Phase": "Fase"
      , "Barrier": "Barriera"
      , "Tag (optional)": "Etichetta (facoltativa)"
      , "Add a fresh name (new)": "Aggiungi un nome fresco (new)"
      , "Edit the fresh name (new)": "Modifica il nome fresco (new)"
      , "Add an input (in)": "Aggiungi un input (in)"
      , "Edit the input (in)": "Modifica l'input (in)"
      , "Add an output (out)": "Aggiungi un output (out)"
      , "Edit the output (out)": "Modifica l'output (out)"
      , "Add an assignment or a match (let)": "Aggiungi un assegnamento o un confronto (let)"
      , "Edit the assignment or match (let)": "Modifica l'assegnamento o il confronto (let)"
      , "Add a choice (let ... suchthat)": "Aggiungi una scelta (let ... suchthat)"
      , "Edit the choice (let ... suchthat)": "Modifica la scelta (let ... suchthat)"
      , "Add a test (if)": "Aggiungi un test (if)"
      , "Edit the test (if)": "Modifica il test (if)"
      , "Add an event": "Aggiungi un evento"
      , "Edit the event": "Modifica l'evento"
      , "Add an insertion into a table": "Aggiungi un inserimento in una tabella"
      , "Edit the insertion into a table": "Modifica l'inserimento in una tabella"
      , "Add a lookup in a table (get)": "Aggiungi una ricerca in una tabella (get)"
      , "Edit the lookup in a table (get)": "Modifica la ricerca in una tabella (get)"
      , "Add a call of a process": "Aggiungi una chiamata di un processo"
      , "Edit the call of a process": "Modifica la chiamata di un processo"
      , "Add a phase": "Aggiungi una fase"
      , "Edit the phase": "Modifica la fase"
      , "Add a synchronisation (sync)": "Aggiungi una sincronizzazione (sync)"
      , "Edit the synchronisation (sync)": "Modifica la sincronizzazione (sync)"
      , "As the model writes most of them": "Come li scrive per lo pi\u00f9 il modello"
      , "As in ProVerif: new k: key; and let x = M in": "Come in ProVerif: new k: key; e let x = M in"
      , "As in CryptoVerif: k <-R key; and x <- M;": "Come in CryptoVerif: k <-R key; e x <- M;"
      , "Engine": "Motore"
      , "Notation": "Notazione"
      , "Theme": "Tema"
      , "Language": "Lingua"
      , "Save": "Salva"
      , "No limit: as much as the browser gives (at most 4 GB, all that WebAssembly can address)": "Nessun limite: quanta ne d\u00e0 il browser (al pi\u00f9 4 GB, tutta quella che WebAssembly pu\u00f2 indirizzare)"
      , "Memory budget of a verification": "Memoria massima di una verifica"
      , "ProVerif runs in a WebAssembly module whose memory grows as needed, up to this budget. Beyond it, or when the browser has no more memory to give, the verification stops with a clear message, and the page is not affected.": "ProVerif gira in un modulo WebAssembly la cui memoria cresce quando serve, fino a questo limite. Oltre il limite, o quando il browser non ha pi\u00f9 memoria da dare, la verifica si ferma con un messaggio chiaro, e la pagina non ne risente."
      , "Time limit, in seconds (0 for none)": "Limite di tempo, in secondi (0 per nessun limite)"
      , "A verification that runs in the page (opened from a file) cannot be interrupted.": "Una verifica che gira nella pagina (aperta da un file) non si pu\u00f2 interrompere."
      , "Extra command line arguments": "Argomenti aggiuntivi della riga di comando"
      , "Check the model with ProVerif while editing": "Controlla il modello con ProVerif durante le modifiche"
      , "ProVerif 2.05 parses the model with -parse-only after each change": "ProVerif 2.05 analizza il modello con -parse-only dopo ogni modifica"
      , "The default": "Predefinito"
      , "Preset": "Preimpostazione"
      , "Font of the code": "Carattere del codice"
      , "Size of the interface": "Dimensione dell'interfaccia"
      , "Explain the constructs": "Spiega i costrutti"
      , "A short description shows when the pointer rests on a block of the diagram or on a keyword of the code": "Una breve descrizione appare quando il puntatore si ferma su un blocco del diagramma o su una parola chiave del codice"
      , "New names and lets that the diagram adds": "Nomi freschi e let che il diagramma aggiunge"
      , "ProVerif 2.05 reads both styles. Edit, Write new and let as in CryptoVerif (or as in ProVerif) rewrites those of the model.": "ProVerif 2.05 accetta entrambi gli stili. Modifica, Scrivi new e let come in CryptoVerif (o come in ProVerif) riscrive quelli del modello."
      , "LaTeX templates of the Design mode: #1, #2 are the parts of the action (see the placeholders), # is the identifier in the styles. Hints in the model (@notation, @infix) take precedence.": "Schemi LaTeX della modalit\u00e0 Design: #1, #2 sono le parti dell'azione (vedi i segnaposto), # \u00e8 l'identificatore negli stili. Le indicazioni nel modello (@notation, @infix) hanno la precedenza."
      , "Restore the defaults": "Ripristina i valori predefiniti"
      , "Fix the syntax errors of the code first.": "Prima correggi gli errori di sintassi del codice."
      , "There is no name to rename in the selection.": "Nella selezione non c'\u00e8 alcun nome da rinominare."
      , "Rename {name} to {to} ({count} place)": ["Rinomina {name} in {to} ({count} punto)", "Rinomina {name} in {to} ({count} punti)"]
      , "Apply the refactoring?": "Applicare il refactoring?"
      , "Apply anyway": "Applica comunque"
      , "Library {names} loaded: its declarations are checked with the model and given to ProVerif.": ["Libreria {names} caricata: le sue dichiarazioni vengono controllate insieme al modello e passate a ProVerif.", "Librerie {names} caricate: le loro dichiarazioni vengono controllate insieme al modello e passate a ProVerif."]
      , "{name} changed: the model is checked with it again.": "{name} modificata: il modello viene ricontrollato con essa."
      , "LaTeX of the protocol (TikZ)": "LaTeX del protocollo (TikZ)"
      , "The honest run, as paired in the diagram, in the notation of the Design mode.": "L'esecuzione onesta, con i messaggi abbinati come nel diagramma, nella notazione della modalit\u00e0 Design."
      , "Copy": "Copia"
      , "LaTeX copied.": "LaTeX copiato."
      , "Download .tex": "Scarica .tex"
      , "Verify the model first: the report gives the results of the last verification.": "Prima verifica il modello: il rapporto d\u00e0 i risultati dell'ultima verifica."
      , "The model is verified again after each change.": "Il modello viene verificato di nuovo dopo ogni modifica."
      , "Verify with F5.": "Verifica con F5."
      , "A verification is already running.": "Una verifica \u00e8 gi\u00e0 in corso."
      , "The code has syntax errors: fix them before verifying.": "Il codice ha errori di sintassi: correggili prima di verificare."
      , "all goals": "tutti gli obiettivi"
      , "Verifying {count} file: the goals need separate runs.": ["Verifica di {count} file: gli obiettivi richiedono esecuzioni separate.", "Verifica di {count} file: gli obiettivi richiedono esecuzioni separate."]
      , "ProVerif is verifying the model...": "ProVerif sta verificando il modello..."
      , "Verifying {count} file at the same time, one verifier each.": ["Verifica di {count} file in contemporanea, con un verificatore ciascuno.", "Verifica di {count} file in contemporanea, con un verificatore ciascuno."]
      , "File {name}: {description}": "File {name}: {description}"
      , "{count} goal: {proved} proved, {failed} false, {other} cannot be proved.": ["{count} obiettivo. Dimostrati: {proved}; falsi: {failed}; non dimostrabili: {other}.", "{count} obiettivi. Dimostrati: {proved}; falsi: {failed}; non dimostrabili: {other}."]
      , "{count} goal: {proved} proved, {failed} false.": ["{count} obiettivo. Dimostrati: {proved}; falsi: {failed}.", "{count} obiettivi. Dimostrati: {proved}; falsi: {failed}."]
      , "ProVerif stopped: {message}": "ProVerif si \u00e8 fermato: {message}"
      , "ProVerif accepts the model; it has no security goals to verify (add a query).": "ProVerif accetta il modello; non ha obiettivi di sicurezza da verificare (aggiungi una query)."
      , "Stopped: the browser gave the engine no more memory, after {size} MB (WebAssembly can address at most 4 GB).": "Fermato: il browser non ha dato altra memoria al motore, dopo {size} MB (WebAssembly pu\u00f2 indirizzare al pi\u00f9 4 GB)."
      , "Stopped: the verification reached its memory budget of {size} MB (Settings, Engine).": "Fermato: la verifica ha raggiunto il suo limite di memoria di {size} MB (Impostazioni, Motore)."
      , "Stopped: the verification reached its time limit of {seconds} s (Settings, Engine).": "Fermato: la verifica ha raggiunto il suo limite di tempo di {seconds} s (Impostazioni, Motore)."
      , "Cancelled.": "Annullato."
      , "The engine failed: {message}": "Errore del motore: {message}"
      , "Stop": "Ferma"
      , "A new model. Add declarations with the + of the panel on the left, parties with the + of Parties, and actions by dragging them from the palette onto a party.": "Un nuovo modello. Aggiungi le dichiarazioni con il + del pannello a sinistra, i partecipanti con il + di Partecipanti, e le azioni trascinandole dalla palette su un partecipante."
      , "Opened {file}: {count} problem to fix.": ["Aperto {file}: {count} problema da correggere.", "Aperto {file}: {count} problemi da correggere."]
      , "Opened {file}": "Aperto {file}"
      , "{message}: PieStudio verifies and exports these goals as separate files.": "{message}: PieStudio verifica ed esporta questi obiettivi come file separati."
      , "The model needs the library {name} (@library): open it with File, Open a library, or choose it with the model.": "Il modello richiede la libreria {name} (@library): aprila con File, Apri una libreria, o sceglila insieme al modello."
      , "{library}, line {line}: {message}": "{library}, riga {line}: {message}"
      , "Passive attacker: listens only. Click to change.": "Attaccante passivo: si limita ad ascoltare. Fai clic per cambiare."
      , "Active attacker: reads, writes and blocks public channels. Click to change.": "Attaccante attivo: legge, scrive e blocca i canali pubblici. Fai clic per cambiare."
      , "passive attacker": "attaccante passivo"
      , "Start: {file}": "Inizio: {file}"
      , "Hints of {file} applied to the model.": "Indicazioni di {file} applicate al modello."
      , "Choose a ProVerif model (.pv), and possibly its hints (.pp).": "Scegli un modello ProVerif (.pv), ed eventualmente le sue indicazioni (.pp)."
      , "Opened the model of the link.": "Aperto il modello del link."
      , "Unsaved changes": "Modifiche non salvate"
      , "The changes to {file} are not saved. Replace the model anyway?": "Le modifiche a {file} non sono salvate. Sostituire comunque il modello?"
      , "Replace": "Sostituisci"
      , "Undid: {label}": "Annullato: {label}"
      , "Redid: {label}": "Ripetuto: {label}"
      , "Fix the syntax errors of the code first: the diagram shows the last version that parsed.": "Prima correggi gli errori di sintassi del codice: il diagramma mostra l'ultima versione senza errori."
      , "Edit {kind}": "Modifica {kind}"
      , "Nothing to rewrite: the new names and the lets that can be are written as in {style}.": "Niente da riscrivere: i nomi freschi e i let che possono esserlo sono gi\u00e0 scritti come in {style}."
      , "Write new and let as in {style}": "Scrivi new e let come in {style}"
      , "{count} new name or let written as in {style}.": ["{count} nome fresco o let scritto come in {style}.", "{count} nomi freschi e let scritti come in {style}."]
      , "Move an action": "Sposta un'azione"
      , "Remove the else branch": "Rimuovi il ramo else"
      , "Add an else branch": "Aggiungi un ramo else"
      , "Remove an else branch": "Rimuovi un ramo else"
      , "Remove the replication": "Rimuovi la replicazione"
      , "Replicate (!)": "Replica (!)"
      , "Replication": "Replicazione"
      , "Run in parallel with another process": "Esegui in parallelo con un altro processo"
      , "Parallel composition": "Composizione parallela"
      , "Show as code": "Mostra come codice"
      , "Show as a formula": "Mostra come formula"
      , "Delete": "Elimina"
      , "Delete {kind}": "Elimina {kind}"
      , "Show {party} once": "Mostra {party} una volta sola"
      , "Show {party} as symmetric": "Mostra {party} come simmetrico"
      , "Edit the party {name}": "Modifica il partecipante {name}"
      , "Edit a declaration": "Modifica una dichiarazione"
      , "Add the party {name}": "Aggiungi il partecipante {name}"
      , "Add a declaration": "Aggiungi una dichiarazione"
      , "Move up": "Sposta su"
      , "Move down": "Sposta gi\u00f9"
      , "Move a declaration": "Sposta una dichiarazione"
      , "Delete a declaration": "Elimina una dichiarazione"
      , "This declaration has no name to rename.": "Questa dichiarazione non ha un nome da rinominare."
      , "Fix the syntax errors first.": "Prima correggi gli errori di sintassi."
      , "Put the caret on a name to rename it.": "Metti il cursore su un nome per rinominarlo."
      , "Rename {name}": "Rinomina {name}"
      , "New name of the {kind} {name} ({count} occurrence)": ["Nuovo nome di {name}, {kind} ({count} occorrenza)", "Nuovo nome di {name}, {kind} ({count} occorrenze)"]
      , "Rename {name} to {to}": "Rinomina {name} in {to}"
      , "Renamed {name} to {to} ({count} occurrence).": ["{name} rinominato in {to} ({count} occorrenza).", "{name} rinominato in {to} ({count} occorrenze)."]
      , "Active attacker": "Attaccante attivo"
      , "Passive attacker": "Attaccante passivo"
      , "Settings saved.": "Impostazioni salvate."
      , "ProVerif cannot verify these goals in one run ({reason}): the model is exported as {count} file, valid on its own.": ["ProVerif non pu\u00f2 verificare questi obiettivi in un'unica esecuzione ({reason}): il modello viene esportato come {count} file, valido da solo.", "ProVerif non pu\u00f2 verificare questi obiettivi in un'unica esecuzione ({reason}): il modello viene esportato come {count} file, ciascuno valido da solo."]
      , "incompatible goals": "obiettivi incompatibili"
      , "Export for ProVerif": "Esporta per ProVerif"
      , "Download all (.zip)": "Scarica tutto (.zip)"
    }
});
