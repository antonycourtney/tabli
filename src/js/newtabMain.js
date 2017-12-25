// @flow
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import NewTabPage from './components/NewTabPage'
import * as oneref from 'oneref'
import TabManagerState from './tabManagerState'

const renderPage = async (
  storeRef: oneref.Ref<TabManagerState>,
  currentChromeWindow: Object
) => {
  try {
    const tPreRender = performance.now()
    const parentNode = document.getElementById('windowList-region')
    var appElement = <NewTabPage storeRef={storeRef} initialWinStore={storeRef.getValue()} />
    ReactDOM.render(appElement, parentNode, () => { // eslint-disable-line no-unused-vars
      const searchBoxElem = document.getElementById('searchBox')
      if (searchBoxElem) {
        searchBoxElem.focus()
      }
    })

    var tPostRender = performance.now()
    console.log('full render complete. render time: (', tPostRender - tPreRender, ' ms)')
  } catch (e) {
    console.error('renderPage: caught exception rendering new tab page: ')
    console.error(e.stack)
    throw e
  }
}

const getFocusedAndRender = () => {
  var bgPage = chrome.extension.getBackgroundPage()
  var storeRef = bgPage.storeRef
  chrome.windows.getCurrent({}, (currentChromeWindow) => {
    renderPage(storeRef, currentChromeWindow)
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
function main () {
  window.onload = () => getFocusedAndRender(true)
  // window.onfocus = (e) => { document.getElementById('searchBox').focus() }
}

main()
