/**
 * Implementation of Tabli browser interface for Google Chrome, using extensions API
 *
 * Only import this module from Chrome!
 */
const chromeBrowser = {
  
  // make a tab (identified by tab id) the currently focused tab:
  activateTab: (tabId, callback) => {
    chrome.tabs.update(tabId, { active: true }, callback)
  },

  setFocusedWindow: (windowId, callback) => {
    chrome.windows.update(windowId, { focused: true }, callback);    
  }
}

window.tabliBrowser = chromeBrowser

module.exports = chromeBrowser