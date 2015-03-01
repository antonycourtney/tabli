/*
 * actions that can be sent to Flux store
 */
'use strict';

var constants = require('./constants.js');

var actions = {
  addTabWindow: function(tabWindow) {
    var payload = { tabWindow: tabWindow };
    this.dispatch(constants.ADD_TAB_WINDOW, payload);
  },

  closeTabWindow: function(tabWindow) {
    console.log("closeTabWindow: ", tabWindow);
    if (!tabWindow.open) {
      console.log("closeTabWindow: request to close non-open window, ignoring...");
      return;
    }
    var windowId = tabWindow.chromeWindow && tabWindow.chromeWindow.id;
    if (!windowId) {
      console.log("closeTabWindow: no valid chrome window, ignoring....");
      return;
    }
    var self = this;
    chrome.windows.remove( windowId, function() {
      tabWindow.open = false;
      var payload = { tabWindow: tabWindow };
      self.dispatch(constants.CLOSE_TAB_WINDOW, payload);
    });
  },

  revertTabWindow: function(tabWindow) {
    var payload = { tabWindow: tabWindow };
    this.dispatch(constants.REVERT_TAB_WINDOW, payload);
  },

  removeTabWindow: function(tabWindow) {
    var payload = { tabWindow: tabWindow };
    this.dispatch(constants.REMOVE_TAB_WINDOW, payload);
  },

  openTabWindow: function(tabWindow) {
    var payload = { tabWindow: tabWindow };
    this.dispatch(constants.OPEN_TAB_WINDOW, payload);
  },
  // associate a Chrome window with a given tabWindow:
  attachChromeWindow: function(tabWindow,chromeWindow) {
    var payload = { tabWindow: tabWindow, chromeWindow: chromeWindow };
    this.dispatch(constants.ATTACH_CHROME_WINDOW, payload);
  },
  // activate a specific tab:
  activateTab: function(tabWindow,tab,tabIndex) {
    var payload = { tabWindow: tabWindow, tab: tab, tabIndex: tabIndex };
    this.dispatch(constants.ACTIVATE_TAB, payload);
  },

  closeTab: function(tab) {
    console.log("closeTab: closing ", tab, this);
    var self = this;
    chrome.tabs.remove( tab.id, function() {
      console.log("closeTab: closed.  syncing");
      // TODO: we could probably sync just the one window
      // Note:  Flux plays games with 'this', so we can't do this.syncWindowList()
      self.flux.actions.syncWindowList();
    });
  },

  syncWindowList: function() {
    var self = this;
    chrome.windows.getAll( {populate: true}, function (windowList) {
      var payload = { windowList: windowList };
      self.dispatch(constants.SYNC_WINDOW_LIST, payload);
    });
  }
};

module.exports = actions;