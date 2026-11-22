/**
 * Chained environments of the checker.
 *
 * Is the equivalent of the StringMap environments of pitsyntax.ml: a child
 * scope shadows its parent, which is how ProVerif rebinds identifiers.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Scope {
  parent: any;
  map: Map<any, any>;

  /**
   * Creates an empty scope.
   *
   * @param {Object} parent The enclosing scope, or null for the global one.
   */
  constructor(parent: any = null) {
    this.parent = parent;
    this.map = new Map();
  }

  /**
   * Looks an identifier up, in this scope and then in its ancestors.
   *
   * @param {string} name The identifier.
   * @return {Object} Its symbol, or undefined.
   */
  get(name: string) {
    for (let s = this; s; s = s.parent) {
      const v = s.map.get(name);
      if (v) {
        return v;
      }
    }
    return undefined;
  }

  /**
   * Tells whether an identifier is bound in this scope or its ancestors.
   *
   * @param {string} name The identifier.
   * @return {boolean} True when bound.
   */
  has(name: string): boolean {
    return this.get(name) !== undefined;
  }

  /**
   * Creates a child scope.
   *
   * @return {Object} The new scope.
   */
  child() {
    return new Scope(this);
  }

  /**
   * Binds an identifier in this very scope.
   *
   * @param {string} name The identifier.
   * @param {Object} sym Its symbol.
   * @return {Object} This scope, for chaining.
   */
  set(name: string, sym: any) {
    this.map.set(name, sym);
    return this;
  }

  /**
   * Binds an identifier in a new child scope (functional update).
   *
   * @param {string} name The identifier.
   * @param {Object} sym Its symbol.
   * @return {Object} The child scope.
   */
  with(name: string, sym: any) {
    return this.child().set(name, sym);
  }
}
// ----------------------------------------------------------------
