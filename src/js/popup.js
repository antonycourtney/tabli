'use strict';

import * as React from 'react';

import * as actions from './actions';
import * as Components from './components';
import {logWrap} from './utils';

import {addons} from 'react/addons'; 
const {PureRenderMixin, Perf} = addons;

/**
 * Main entry point to rendering the popup window
 */ 
function renderPopup(currentWindowId) {
  var t_preRender = performance.now();
  var bgPage = chrome.extension.getBackgroundPage();
  var winStore = bgPage.winStore;

  var savedHTML = bgPage.savedHTML;

  var parentNode = document.getElementById('windowList-region');

  /*
   * We do a quick immediate render using saved HTML and then use setTimeout()
   * to initate a more complete sync operation
   */

  if (savedHTML) {
    parentNode.innerHTML = savedHTML;
    var t_postSet = performance.now();
    console.log("time to set initial HTML: ", t_postSet - t_preRender);    
  }


  function doRender() {
    /* Now let's render *before* sync'ing so that we match the pre-rendered HTML... */
    var appElement = <Components.TabMan winStore={winStore} />;
    React.render( appElement, parentNode ); 
    var t_postRender = performance.now();
    console.log("full render complete. render time: (", t_postRender - t_preRender, " ms)");    

    // And sync our window state, which may update the UI...
    actions.syncChromeWindows(winStore,logWrap( () => {
      console.log("postLoadRender: window sync complete");

      winStore.setCurrentWindow(currentWindowId);

      // And render/save our HTML:
      var renderedString = React.renderToString(appElement);
      // console.log("rendered string: ", renderedString);
      bgPage.savedHTML = renderedString;
      console.log("Updated savedHTML");
    }));
  }

  setTimeout(doRender,0);
}

function getFocusedAndRender() {
  chrome.windows.getCurrent(null, (currentWindow) => {
    renderPopup(currentWindow.id);
  })
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