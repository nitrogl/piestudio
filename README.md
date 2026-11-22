# PieStudio

![ProVerif](https://img.shields.io/badge/ProVerif-2.05-005f73)

> Study symbolic verification freely: your model never leaves your computer.

A visual editor for [ProVerif](https://bblanche.gitlabpages.inria.fr/proverif/) models, running entirely in the browser. You draw a protocol as parties (lanes) and blocks, and each block is one construct of ProVerif's typed pi calculus, one line of the `.pv` file. The diagram, the declarations and the code are three views of the same text, so editing any one of them updates the others. Verification uses ProVerif 2.05, compiled to WebAssembly ([ProVerif and CryptoVerif for WebAssembly](https://github.com/nitrogl/proverif-cryptoverif-wasm)), with a memory budget you choose.

**[Open PieStudio](https://nitrogl.github.io/piestudio/)** &middot; [User guide](https://nitrogl.github.io/piestudio/docs/) (also in [docs/](docs/index.md), and in Help, User guide) &middot; [The ProVerif manual](https://nitrogl.github.io/proverif-cryptoverif-wasm/docs/manuals/proverif/)

![PieStudio with the Handshake example](docs/images/main.png)

PieStudio is free software under the GNU General Public License, version 2 or later, the licence of ProVerif. Nothing leaves your computer: there is no server and no cloud service, and the libraries are served from the same folder. It speaks English and Italian, and any language that you add with only a browser.

## What it does

- **Diagram.** One lane per party and one for the main process; every process construct is a block on a lifeline, and tests and parallel compositions fork into one column per branch, inside their lane. Drag actions from the palette, move blocks, edit them in pop-ups; outputs and inputs paired by an honest run are joined by arrows; symmetric roles are drawn with their mirrored copy.
- **Design and Expert modes (F9).** Blocks and declarations as formulas (KaTeX), in a notation that you can change, the builtin types included, and that a model can carry in its comments (`@notation`, `@infix`...), or as ProVerif code.
- **Declarations panel.** Every kind of declaration, with a form and a source tab, checked as you type, and query suggestions built from the model.
- **Code editor.** Highlighting, errors as you type from a port of ProVerif's own checker and from ProVerif itself in the background, go to the declaration (F12), rename everywhere (F2), refactor in a selection (Shift+F2).
- **Verification (F5).** Results per goal, attack traces drawn as message sequence charts linked to the blocks and the code, the output of ProVerif, goals that need several runs verified in parallel, a memory budget from 64 MB to 4 GB, a report in HTML.
- **Files.** `.pv` models with their `.pp` hints, `.pvl` libraries (which a model names with `@library`, and which you can edit), export for ProVerif (split when it must be), the LaTeX of the protocol as a TikZ chart, and undo and redo with no limit; the model is kept in the browser.

The [user guide](docs/index.md) explains it all, with pictures.

## Running it

PieStudio is static files, once its TypeScript is compiled: build it, then serve the folder with any web server, or put it on a link.

```sh
npm install
npm run build
npm start
```

Its two libraries are in its folder, minified: Studio Core in `studio-core/`, and ProVerif for WebAssembly in `engine/`. The compiled scripts are not in the repository (`.gitignore`): a host serves the folder, built, or the `dist/` of `./dist.sh`.

Opening `index.html` directly from disk also works; ProVerif then runs in the page itself. `./dist.sh` builds a smaller copy to upload, and `./dist.sh --zip` packs it with its source. [Running PieStudio](docs/running.md) says more.

## Developing it

PieStudio is TypeScript, compiled to plain scripts that the page loads with script tags, built on [Studio Core](https://github.com/nitrogl/studio-core) (in `studio-core/`) with its engine from [proverif-cryptoverif-wasm](https://github.com/nitrogl/proverif-cryptoverif-wasm) (in `engine/`), each copied there, minified, by a script. [Developing PieStudio](docs/developing.md) has the code layout, what PieStudio adds to the core, how to update the core and the engine, the checks (`npm test`, and `node tests/check-ui.ts` in a headless Chromium), and the build of this documentation (`npm run docs`, with pandoc). [Translating PieStudio](docs/translating.md) explains the languages.

### The TypeScript build

My JavaScript was originally organized under `src/app/` as `model`, `view`, `controller`, as my generic starting point for complex projects.
When I migrated to TypeScript, I also *detached* the (ProVerif) *engine* from the `model`, added MetaCP's *notation*, and realized I wanted a *detached* language from the `model`, as in the view of expanding PieStudio to other backends.
As this went on, I also added translations and detached a *Studio-core* that
attempts to be as agnostic as reasonable to accomodate different engines.
In the future, I will implement StudioCore versions of CryptoVerif, MetaCP, and EasyCrypt - not sure if they'll still enjoy a full WASM like ProVerif does.

`npm run build` runs `tsc -p .`, against the declarations of the core; `npm run watch` builds again at every change, and `npm run typecheck` also checks the scripts that Node runs. Those (`tests/`, `scripts/`) are TypeScript too, but Node 22.18 or later runs them as they are, with no build: `node tests/check-model.ts`. `npm test`, `npm run test:ui`, `npm run dist` and `npm run examples` build first; `scripts/build-examples.ts` writes `src/app/model/Examples.ts`, and the translations take their messages from the TypeScript sources. `lang/languages.js` stays JavaScript: the build of the translations writes it, and so does the studio itself.

> Development note: parts of the JavaScript-to-TypeScript migration and the TypeScript port of ProVerif's parser and checker were drafted with LLM assistance to speed up the repetitive porting work, then manually reviewed and verified against ProVerif 2.05 using `npm test` and `npm run test:ui`.



## Licences

PieStudio is (c) Roberto Metere. It is free software: you can redistribute it and modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License or (at your option) any later version. It is distributed in the hope that it will be useful, but without any warranty; see `COPYING` for the details. Each source file says so with `@license GPL-2.0-or-later`.

ProVerif is (c) INRIA, CNRS (Bruno Blanchet, Vincent Cheval, Marc Sylvestre) and is distributed under the GNU GPL v2 or later. The engine in `engine/`, ProVerif for WebAssembly by Roberto Metere, is distributed under the same licence (`engine/NOTICE`, `engine/COPYING`). The OCaml runtime it contains is under the LGPL 2.1 with the OCaml linking exception (`engine/LICENSE-OCaml.txt`), and its parts of Emscripten and musl under the MIT licence (`engine/LICENSE-Emscripten.txt`). Studio Core, in `studio-core/`, is by Roberto Metere under the MIT licence (`studio-core/LICENSE`). jQuery, jQuery UI, Bootstrap and KaTeX are under the MIT licence. Font Awesome Free is under the SIL OFL (fonts) and MIT (code).
