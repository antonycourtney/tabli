/**
 * messages on port between helper and popup
 */
'use strict';

var constants = require('./protocolConstants.js');

module.exports = {
  mkMessage: function(msgType,payload) {
    return {
      messageType: msgType,
      contents: payload
    };
  },

  fullUpdate: function(encodedStore) {
    return this.mkMessage(constants.RESP_FULL_UPDATE,encodedStore);
  },

  hello: function() {
    return this.mkMessage(constants.REQ_HELLO,null);
  },

  openWindow: function(tabWindow) {
    var payload = { windowId: tabWindow.getEncodedId() };
    return this.mkMessage(constants.REQ_OPEN_WINDOW,payload);
  }
};
