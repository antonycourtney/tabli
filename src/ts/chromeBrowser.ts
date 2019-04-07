/**
 * Implementation of Tabli browser interface for Google Chrome, using extensions API
 *
 * Only import this module from Chrome!
 */

// make a tab (identified by tab id) the currently focused tab:
export const activateTab = (
    tabId: number,
    callback: (tab?: chrome.tabs.Tab) => void
) => {
    chrome.tabs.update(tabId, { active: true }, callback);
};

export const setFocusedWindow = (
    windowId: number,
    callback?: (window: chrome.windows.Window) => void
) => {
    chrome.windows.update(windowId, { focused: true }, callback);
};
