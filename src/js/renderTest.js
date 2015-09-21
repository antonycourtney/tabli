'use strict';

import * as React from 'react/addons';
import * as Immutable from 'immutable';
import * as TabWindow from './tabWindow';
import TabWindowStore from './tabWindowStore';
import * as _ from 'lodash';
import * as actions from './actions';
import * as Components from './components';
import {logWrap} from './utils';

import {addons} from 'react/addons'; 
const {PureRenderMixin, Perf} = addons;

// make a TabWindow from its JSON
function makeTabWindow(jsWin) {
  const decItems = jsWin.tabItems.map((tiFields) => new TabWindow.TabItem(tiFields));

  jsWin.tabItems = Immutable.Seq(decItems);

  const decWin = new TabWindow.TabWindow(jsWin);
  return decWin;
} 

function renderPage(testData) {
  const allWindows = testData.allWindows;

  const tabWindows = allWindows.map(makeTabWindow);

  var mockWinStore = new TabWindowStore(-1,-1);


  mockWinStore.registerTabWindows(tabWindows);
  console.log("Created mockWinStore and registered test windows");
  var t_preRender = performance.now();
  var elemId = document.getElementById('windowList-region');
  if (Perf)
    Perf.start();
 
  var windowListComponent = <Components.TabMan winStore={mockWinStore} />;
  React.render( windowListComponent, elemId ); 
  var t_postRender = performance.now();
  if (Perf)
    Perf.stop();
  console.log("initial render complete. render time: (", t_postRender - t_preRender, " ms)");    
  if (Perf) {
    console.log("inclusive:");
    Perf.printInclusive();
    console.log("exclusive:");
    Perf.printExclusive();
    console.log("wasted:");
    Perf.printWasted();
  }
}


var testStateUrl = "testData/winSnap.json";

function loadTestData(callback) {
  var request = new XMLHttpRequest();
  request.open('GET', testStateUrl, true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      callback(data);
    } else {
      // We reached our target server, but it returned an error
      console.error("request failed, error: ", request.status, request);
    }
  };
  request.send();        
}


/**
 * Main entry point to rendering the popup window
 */ 
function renderTest() {
  loadTestData(renderPage);
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
  window.onload = renderTest;
}

main();