const noop = () => {};

/**
 * Tiny typed event emitter.
 *
 * The emitter stores listeners in a Map keyed by event name. Each event has a
 * Set of entries so that `off` is O(1) and duplicate registrations are
 * impossible. A Set also gives us insertion order, which is the only ordering
 * guarantee we make.
 *
 * `once` is implemented by wrapping the listener and removing the wrapper
 * before invoking the original. This means a listener added during the once
 * callback is not called by the current emit, which is the behaviour most
 * callers expect from a once listener.
 */
export class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<{ fn: Function, once: boolean }>>} */
    this._events = new Map();
  }

  /**
   * Register a listener for `event`.
   *
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    let set = this._events.get(event);
    if (!set) {
      set = new Set();
      this._events.set(event, set);
    }
    set.add({ fn: listener, once: false });
    return this;
  }

  /**
   * Register a listener that is removed after the first call.
   *
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  once(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    let set = this._events.get(event);
    if (!set) {
      set = new Set();
      this._events.set(event, set);
    }
    set.add({ fn: listener, once: true });
    return this;
  }

  /**
   * Remove a previously registered listener.
   *
   * @param {string} event
   * @param {Function} listener
   * @returns {this}
   */
  off(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    const set = this._events.get(event);
    if (!set) return this;
    for (const entry of set) {
      if (entry.fn === listener) {
        set.delete(entry);
      }
    }
    if (set.size === 0) {
      this._events.delete(event);
    }
    return this;
  }

  /**
   * Synchronously call every listener registered for `event`.
   *
   * A snapshot of the listener set is taken so that removing a listener during
   * dispatch does not skip the next listener in the set.
   *
   * @param {string} event
   * @param {...any} args
   * @returns {boolean} true if at least one listener was called
   */
  emit(event, ...args) {
    const set = this._events.get(event);
    if (!set || set.size === 0) return false;

    // Snapshot so that mutations during dispatch are safe.
    const entries = Array.from(set);
    let called = false;
    for (const entry of entries) {
      if (!set.has(entry)) continue; // removed by an earlier listener
      if (entry.once) {
        set.delete(entry);
      }
      entry.fn.apply(this, args);
      called = true;
    }
    if (set.size === 0) {
      this._events.delete(event);
    }
    return called;
  }

  /**
   * Number of listeners registered for `event`.
   *
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    const set = this._events.get(event);
    return set ? set.size : 0;
  }
}
