/*
 * constants for protocol messages between popup and helper
 */
'use strict';

var constants = {
  /* requests (from popup to helper): */
  REQ_HELLO: "REQ_HELLO",

  /* open / switch to specified window */
  REQ_OPEN_WINDOW: "REQ_OPEN_WINDOW",

  /* responses (helper to popup): */
  RESP_FULL_UPDATE: "RESP_FULL_UPDATE",
};

module.exports = constants;