/**
 * common rendering entry point for popup and popout
 */
import chromeBrowser from './chromeBrowser';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { logWrap } from './utils';

import * as Tabli from '../tabli-core/src/js/index';

const Popup = Tabli.components.Popup;
const actions = Tabli.actions;

/**
 * Main entry point to rendering the popup window
 */
function renderPopup(currentWindowId,isPopout) {
  var t_preRender = performance.now();
  var bgPage = chrome.extension.getBackgroundPage();

  var storeRef = bgPage.storeRef;
  var savedStore = bgPage.savedStore;
  var savedHTML = bgPage.savedHTML;

  var parentNode = document.getElementById('windowList-region');

  /*
   * We do a quick immediate render using saved HTML and then use setTimeout()
   * to initate a more complete sync operation
   */

  if (savedHTML) {
    parentNode.innerHTML = savedHTML;
    var t_postSet = performance.now();
    console.log('time to set initial HTML: ', t_postSet - t_preRender);

    // logHTML("loaded HTML", savedHTML);
  }

  /*
   * We make our initial call to create and render the React component tree on a zero timeout
   * to give this handler a chance to complete and allow Chrome to render the initial
   * HTML set from savedHTML
   */

  function doRender() {
    /* First:let's render *before* sync'ing so that we match the pre-rendered HTML... */
    /* Note (!!): We use savedStore here to ensured that the store state exactly matches savedHTML; we'll simply ignore
     * any possible store updates that happened since last save
     */

    // console.log("doRender: About to render using savedStore: ", savedStore.toJS());
    var appElement = <Popup storeRef={storeRef} initialWinStore={savedStore} isPopout={isPopout} />;
    var appComponent = ReactDOM.render(appElement, parentNode);  // eslint-disable-line no-unused-vars
    var t_postRender = performance.now();
    console.log('full render complete. render time: (', t_postRender - t_preRender, ' ms)');

    // And sync our window state, which may update the UI...
    actions.syncChromeWindows(logWrap((uf) => {
      // console.log("postLoadRender: window sync complete");
      const syncStore = uf(savedStore);

      // And set current focused window:
      const nextStore = syncStore.setCurrentWindow(currentWindowId);
      if (!(nextStore.equals(savedStore))) {
        storeRef.setValue(nextStore);
      } else {
        console.log("doRender: nextStore.equals(savedStore) -- skipping setValue")
      }

      // logHTML("Updated savedHTML", renderedString);
      var t_postSyncUpdate = performance.now();
      console.log('syncChromeWindows and update complete: ', t_postSyncUpdate - t_preRender, ' ms');
      document.getElementById('searchBox').focus();
    }));
  }

  // Just for curiosity, let's assume saved HTML up-to-date...
  setTimeout(doRender, 0);
}

export function getFocusedAndRender(isPopout) {
  chrome.windows.getCurrent(null, (currentWindow) => {
    renderPopup(currentWindow.id,isPopout);
  });
}
