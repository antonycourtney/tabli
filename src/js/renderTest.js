/* globals XMLHttpRequest */

import * as Immutable from 'immutable'
import * as RenderCommon from './renderCommon'

import * as TabWindow from './tabWindow'
import TabManagerState from './tabManagerState'
import ViewRef from './viewRef'

// make a TabWindow from its JSON
function makeTabWindow (jsWin) { // eslint-disable-line no-unused-vars
  const decItems = jsWin.tabItems.map((tiFields) => new TabWindow.TabItem(tiFields))

  const itemWin = Object.assign({}, jsWin, { tabItems: Immutable.Seq(decItems) })

  const decWin = new TabWindow.TabWindow(itemWin)
  return decWin
}

function renderPage (testData) {
  const tPreSync = performance.now()
  const testChromeWindows = testData.chromeWindows

  // console.log('renderPage: testData: ', testData)

  const emptyWinStore = new TabManagerState()
  const mockWinStore = emptyWinStore.syncWindowList(testChromeWindows).set('showRelNotes', false)

  const tPostSync = performance.now()

  console.log('syncing window state took ', tPostSync - tPreSync, ' ms')

  console.log('Created mockWinStore and registered test windows')
  console.log('mock winStore: ', mockWinStore.toJS())
  const storeRef = new ViewRef(mockWinStore)

  const currentChromeWindow = testChromeWindows[0]

  var tPreRender = performance.now()

  // N.B. false last arg to prevent sync'ing current chrome windows
  RenderCommon.renderPopup(storeRef, currentChromeWindow, false, false, true)

  var tPostRender = performance.now()
  console.log('initial render complete. render time: (', tPostRender - tPreRender, ' ms)')
}

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
      console.log('loading test data took ', tPostLoad - tPreLoad, ' ms')
      console.log('parsing test data took ', tPostParse - tPostLoad, ' ms')
      callback(data)
    } else {
      // We reached our target server, but it returned an error
      console.error('request failed, error: ', request.status, request)
    }
  }

  request.send()
}

/**
 * Main entry point to rendering the popup window
 */
function renderTest () {
  loadTestData(renderPage)
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
function main () {
  console.log('render test, environment: ', process.env.NODE_ENV)
  window.onload = renderTest
}

main()
