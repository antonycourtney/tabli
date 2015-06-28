/**
 * messages on port between helper and popup
 */
'use strict';

var _ = require('underscore');

module.exports = {
  /* requests (from popup to helper): */
  REQ_HELLO: "REQ_HELLO",

  /* responses (helper to popup): */
  RESP_FULL_UPDATE: "RESP_FULL_UPDATE",

  mkMessage: function(msgType,payload) {
    return {
      messageType: msgType,
      contents: payload
    };
  },

  fullUpdate: function(encodedStore) {
    return this.mkMessage(this.RESP_FULL_UPDATE,encodedStore);
  },

  hello: function() {
    return this.mkMessage(this.REQ_HELLO,null);
  }
};
