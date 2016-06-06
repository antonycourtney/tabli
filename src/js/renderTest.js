/* globals XMLHttpRequest */

import * as Immutable from 'immutable'
import * as Perf from 'react-addons-perf'
import * as Tabli from '../tabli-core/src/js/index'
import * as RenderCommon from './renderCommon'

const TabManagerState = Tabli.TabManagerState
const TabWindow = Tabli.TabWindow
const ViewRef = Tabli.ViewRef

// make a TabWindow from its JSON
function makeTabWindow (jsWin) {  // eslint-disable-line no-unused-vars
  const decItems = jsWin.tabItems.map((tiFields) => new TabWindow.TabItem(tiFields))

  const itemWin = Object.assign({}, jsWin, { tabItems: Immutable.Seq(decItems) })

  const decWin = new TabWindow.TabWindow(itemWin)
  return decWin
}

function renderPage (testData) {
  const testChromeWindows = testData.chromeWindows

  console.log('renderPage: testData: ', testData)

  const emptyWinStore = new TabManagerState()
  const mockWinStore = emptyWinStore.syncWindowList(testChromeWindows).set('showRelNotes', false)

  console.log('Created mockWinStore and registered test windows')
  console.log('mock winStore: ', mockWinStore.toJS())
  const storeRef = new ViewRef(mockWinStore)

  const currentChromeWindow = testChromeWindows[0]

  if (Perf) {
    Perf.start()
  }

  var tPreRender = performance.now()

  // N.B. false last arg to prevent sync'ing current chrome windows
  RenderCommon.renderPopup(storeRef, currentChromeWindow, false, false)

  var tPostRender = performance.now()
  if (Perf) {
    Perf.stop()
  }
  console.log('initial render complete. render time: (', tPostRender - tPreRender, ' ms)')
  if (Perf) {
    console.log('inclusive:')
    Perf.printInclusive()
    console.log('exclusive:')
    Perf.printExclusive()
    console.log('wasted:')
    Perf.printWasted()
  }
}

var testStateUrl = 'testData/renderTest-chromeWindowSnap.json'

function loadTestData (callback) {
  var request = new XMLHttpRequest()
  request.open('GET', testStateUrl, true)
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText)
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
  window.onload = renderTest
}

main()
