import * as React from 'react/addons';
import * as Immutable from 'immutable';
import * as TabWindow from './tabWindow';
import TabManagerState from './tabManagerState';
import { addons } from 'react/addons';
const { Perf } = addons;

import TabliPopup from './components/TabliPopup';

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

  var emptyWinStore = new TabManagerState();

  var bgPage = chrome.extension.getBackgroundPage();

  var renderTestSavedHTML = bgPage.renderTestSavedHTML;

  /*
    const savedNode = bgPage.savedNode;
    console.log("Saved node from bg page: ", savedNode);
*/

  const mockWinStore = emptyWinStore.registerTabWindows(tabWindows);
  console.log('Created mockWinStore and registered test windows');
  console.log('mock winStore: ', mockWinStore.toJS());

  var t_preRender = performance.now();
  var parentNode = document.getElementById('windowList-region');

  if (Perf) {
    Perf.start();
  }

  /*
  if (savedNode) {
    var newNode = document.importNode(savedNode, true);
    if (parentNode.firstChild===null) {
      parentNode.appendChild(newNode);
    } else {
      parentNode.replaceChild(newNode,parentNode.firstChild);
    }
  }
  */
  if (renderTestSavedHTML) {
    console.log('Got saved HTML, setting...');
    parentNode.innerHTML = renderTestSavedHTML;
    var t_postSet = performance.now();
    console.log('time to set initial HTML: ', t_postSet - t_preRender);
  }
  /*
   * Use setTimeout so we have a chance to finish the initial render
   */

  // pass noListener since we don't want to receive updates from the store.
  // There won't be any such updates (since we created the store) but the listener mechanism
  // uses chrome messages to bg page as workaround for lack of window close event on popup, and we don't want
  // that connection.
  var appElement = <TabliPopup winStore={mockWinStore} noListener />;
  React.render(appElement, parentNode);

  var t_postRender = performance.now();
  if (Perf) {
    Perf.stop();
  }
  console.log('initial render complete. render time: (', t_postRender - t_preRender, ' ms)');
  if (Perf) {
    console.log('inclusive:');
    Perf.printInclusive();
    console.log('exclusive:');
    Perf.printExclusive();
    console.log('wasted:');
    Perf.printWasted();
  }

  console.log('After rendering, parentNode: ', parentNode);

  var renderedString = React.renderToString(appElement);

  // console.log("rendered string: ", renderedString);
  // bgPage.savedNode = parentNode.firstChild;
  bgPage.renderTestSavedHTML = renderedString;
}

var testStateUrl = 'testData/winSnap.json';

function loadTestData(callback) {
  var request = new XMLHttpRequest();
  request.open('GET', testStateUrl, true);
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      callback(data);
    } else {
      // We reached our target server, but it returned an error
      console.error('request failed, error: ', request.status, request);
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
