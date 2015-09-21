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
function renderPopup() {
  var bgw = chrome.extension.getBackgroundPage();
  var winStore = bgw.winStore;

  actions.syncChromeWindows(winStore,logWrap( () => {
    console.log("postLoadRender: window sync complete");

    var t_preRender = performance.now();
    var elemId = document.getElementById('windowList-region');
    var windowListComponent = <Components.TabMan winStore={winStore} />;
    React.render( windowListComponent, elemId ); 
    var t_postRender = performance.now();
    console.log("initial render complete. render time: (", t_postRender - t_preRender, " ms)");    
  }));
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
  window.onload = renderPopup;
}

main();