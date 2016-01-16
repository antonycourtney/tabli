import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as actions from './actions';
import { logWrap } from './utils';
import TabliPopup from './components/TabliPopup';

/**
 * Main entry point to rendering the new tab page
 */
function renderNewTab(currentWindowId) {
  var t_preRender = performance.now();
  var bgPage = chrome.extension.getBackgroundPage();

  var storeRef = bgPage.storeRef;
  var savedStore = bgPage.savedStore;

  var parentNode = document.getElementById('windowList-region');

  /* First:let's render *before* sync'ing so that we match the pre-rendered HTML... */
  /* Note (!!): We use savedStore here to ensured that the store state exactly matches savedHTML; we'll simply ignore
   * any possible store updates that happened since last save
   */

  // console.log("doRender: About to render using savedStore: ", savedStore.toJS());
  var appElement = <TabliPopup storeRef={storeRef} initialWinStore={savedStore} />;
  var appComponent = ReactDOM.render(appElement, parentNode);  // eslint-disable-line no-unused-vars
  var t_postRender = performance.now();
  console.log('full render complete. render time: (', t_postRender - t_preRender, ' ms)');

  // And sync our window state, which may update the UI...
  actions.syncChromeWindows(logWrap((uf) => {
    // console.log("postLoadRender: window sync complete");
    const syncStore = uf(savedStore);

    // And set current focused window:
    const nextStore = syncStore.setCurrentWindow(currentWindowId);
    storeRef.setValue(nextStore);

    // logHTML("Updated savedHTML", renderedString);
    var t_postSyncUpdate = performance.now();
    console.log('syncChromeWindows and update complete: ', t_postSyncUpdate - t_preRender, ' ms');
    document.getElementById('searchBox').focus();
  }));
}

function getFocusedAndRender() {
  chrome.windows.getCurrent(null, (currentWindow) => {
    renderNewTab(currentWindow.id);
  });
}

/*
 * Perform our React rendering *after* the load event for the popup
 * (rather than the more traditional ondocumentready event)
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event, and this
 * is essential for reasonable performance when loading favicons.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */
function main() {
  window.onload = getFocusedAndRender;
}

main();
