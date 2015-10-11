'use strict';

import * as OneRef from 'oneref';

/**
 * A wrapper around OneRef.Ref that tracks listeners by numeric id
 * so that we can share a ref between background page and popup
 * in Chrome extension and clean up when popup goes away
 *
 * 
 */

export default class ViewRef extends OneRef.Ref {
  /**
   * construct a new ViewRef with initial value v
   */
  constructor(v) {
    super(v);
    this.viewListeners = [];
  }

  /*
   * Add a view listener and return its listener id
   *
   * We have our own interface here because we don't have a reliable destructor / close event 
   * on the chrome extension popup window, and our GC technique requires us to have
   * numeric id's (rather than object references) that we can encode in a Chrome JSON 
   * message
   */
  addViewListener(listener) {
    // check to ensure this listener not yet registered:
    var idx = this.viewListeners.indexOf(listener);
    if (idx===-1) {
      idx = this.viewListeners.length;
      this.viewListeners.push(listener);
      this.on("change",listener);
    }
    return idx;
  }

  removeViewListener(id) {
    // console.log("removeViewListener: removing listener id ", id);
    var listener = this.viewListeners[id];
    if (listener) {
      this.removeListener("change",listener);
    } else {
      console.warn("removeViewListener: No listener found for id ", id);
    }
    delete this.viewListeners[id];
  }  
}