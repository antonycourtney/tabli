/**
 * A mutable ref cell that supports node's EventEmitter to enable
 * registration of listeners to be notified when the ref cell is
 * updated
 *
 */
'use strict';

import EventEmitter from 'events';

export default class RefCell extends EventEmitter {
  /**
   * construct a new RefCell with initial value v
   */
  constructor(v) {
    super();
    this._value = v;
    this.viewListeners = [];
  }


  /**
   * get the current value of this ref cell
   */
  getValue() {
    return this._value;
  } 

  /**
   * update contents of this cell (and notify any listeners)
   */
  setValue(v) {
    this._value = v;
    this.emit("change");
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