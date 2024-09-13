import { log } from './globals';
import * as Immutable from 'immutable';
import * as RenderCommon from './renderCommon';

import * as TabWindow from './tabWindow';
import TabManagerState from './tabManagerState';
import testData from '../../test-data/renderTest-chromeWindowSnap';
import { mkRef, utils as oneRefUtils, StateRef, update } from 'oneref';

// make a TabWindow from its JSON
function makeTabWindow(jsWin: any) {
    // eslint-disable-line no-unused-vars
    const decItems = jsWin.tabItems.map(
        (tiFields: any[]) => new TabWindow.TabItem(tiFields),
    );

    const itemWin = Object.assign({}, jsWin, {
        tabItems: Immutable.Seq(decItems),
    });

    const decWin = new TabWindow.TabWindow(itemWin);
    return decWin;
}

// from bgHelper --
function onTabRemoved(
    stateRef: StateRef<TabManagerState>,
    windowId: number,
    tabId: number,
) {
    log.debug('onTabRemoved: ', windowId, tabId);
    update(stateRef, (state) => {
        const tabWindow = state.getTabWindowByChromeId(windowId);

        if (!tabWindow) {
            log.info('tabs.onTabRemoved: window id not found: ', windowId);
            return state;
        }

        return state.handleTabClosed(tabWindow, tabId);
    });
}

const tabsToRemove = [
    [5408, 5413],
    [1903, 2147],
    [1903, 1904],
    [1903, 2151],
    [1903, 3994],
    [1903, 4004],
    [5285, 5288],
    [5285, 5290],
    [5285, 5294],
    [5285, 5296],
];

const runEventTests = async (stateRef: StateRef<TabManagerState>) => {
    console.log('runEventTests waiting 8 seconds...');
    await oneRefUtils.delay(8000);
    console.log('runEventTests removing ', tabsToRemove.length, ' tabs...:');
    let count = 0;
    for (let [windowId, tabId] of tabsToRemove) {
        console.log('removing tab ', count++);
        onTabRemoved(stateRef, windowId, tabId);
        await oneRefUtils.delay(200);
    }
    console.log('done removing tabs');
};

function renderPage(testData: any) {
    const tPreSync = performance.now();
    const testChromeWindows = testData.chromeWindows;

    // log.info('renderPage: testData: ', testData)

    const emptyWinStore = new TabManagerState();
    const mockWinStore = emptyWinStore
        .syncWindowList(testChromeWindows)
        .set('showRelNotes', false);

    const tPostSync = performance.now();

    log.info('syncing window state took ', tPostSync - tPreSync, ' ms');

    log.info('Created mockWinStore and registered test windows');
    log.info('mock winStore: ', mockWinStore.toJS());
    const storeRef = mkRef(mockWinStore);

    const currentChromeWindow = testChromeWindows[0];

    var tPreRender = performance.now();

    // N.B. false last arg to prevent sync'ing current chrome windows
    RenderCommon.renderPopup(storeRef, currentChromeWindow, false, false, true);

    var tPostRender = performance.now();
    log.info(
        'initial render complete. render time: (',
        tPostRender - tPreRender,
        ' ms)',
    );
    runEventTests(storeRef);
}

/*
var testStateUrl = 'testData/renderTest-chromeWindowSnap.json'

function loadTestData (callback) {
  var tPreLoad = performance.now()
  var request = new XMLHttpRequest()
  request.open('GET', testStateUrl, true)
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const tPostLoad = performance.now()
      var data = JSON.parse(request.responseText)
      const tPostParse = performance.now()
      log.info('loading test data took ', tPostLoad - tPreLoad, ' ms')
      log.info('parsing test data took ', tPostParse - tPostLoad, ' ms')
      callback(data)
    } else {
      // We reached our target server, but it returned an error
      log.error('request failed, error: ', request.status, request)
    }
  }

  request.send()
}
*/

/**
 * Main entry point to rendering the popup window
 */
function renderTest() {
    // loadTestData(renderPage)
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'development') {
        // more detail, generally:
        log.setLevel('debug'); // Enable to see every Chrome event:
    } else {
        log.setLevel('info');
    }
    console.log('log level: ', log.getLevel());
    renderPage(testData);
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
    log.info('render test, environment: ', process.env.NODE_ENV);
    window.onload = renderTest;
}

main();
