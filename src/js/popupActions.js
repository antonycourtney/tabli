/**
 * actions to be invoked from popup
 */

'use strict';

var constants = require('./constants');
var ProtocolConstants = require('./protocolConstants');
var ProtocolMessages = require('./protocolMessages')

/*
 * Construct a map of actions suitable for passing to Flux constructor.
 *
 * This was originally implemented using prototypical inheritance. But Fluxxor actually requires that this be a true map
 * of action names to functions rather than a JavaScript object; it iterates over the keys and copies the actions
 * elsewhere.
 */
function mkActions(helperPort) {
  var actions = {
    replaceWindowState: function(tabWindows) {
      var payload = { tabWindows: tabWindows };
      this.dispatch(constants.REPLACE_WINDOW_STATE, payload);
    },

    sendHello: function() {
      helperPort.postMessage(ProtocolMessages.hello());
    },

    openTabWindow: function(tabWindow) {
      var msg = ProtocolMessages.openWindow(tabWindow);
      console.log("openTabWindow: posting message: ", msg);
      helperPort.postMessage(msg);
    }

  };

  return actions;  
}

module.exports = mkActions;