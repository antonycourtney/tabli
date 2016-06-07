/**
 * common rendering entry point for popup and popout
 */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { logWrap } from './utils'

import Popup from './components/Popup'
import * as actions from './actions'

/**
 * Main entry point to rendering the popup window
 */
export function renderPopup (storeRef, currentChromeWindow, isPopout, doSync) {
  console.log('renderPopup: isPopout: ', isPopout)

  var tPreRender = performance.now()

  var parentNode = document.getElementById('windowList-region')

  var appElement = <Popup storeRef={storeRef} initialWinStore={storeRef.getValue()} isPopout={isPopout} />
  var appComponent = ReactDOM.render(appElement, parentNode) // eslint-disable-line no-unused-vars
  var tPostRender = performance.now()
  console.log('full render complete. render time: (', tPostRender - tPreRender, ' ms)')

  // And sync our window state, which may update the UI...
  if (doSync) {
    actions.syncChromeWindows(logWrap((uf) => {
      console.log('postLoadRender: window sync complete')
      const savedStore = storeRef.getValue()
      const syncStore = uf(savedStore)

      // And set current focused window:
      console.log('renderPopup: setting current window to ', currentChromeWindow)
      const nextStore = syncStore.setCurrentWindow(currentChromeWindow)
      if (!(nextStore.equals(savedStore))) {
        storeRef.setValue(nextStore)
      } else {
        console.log('doRender: nextStore.equals(savedStore) -- skipping setValue')
      }

      // logHTML("Updated savedHTML", renderedString)
      var tPostSyncUpdate = performance.now()
      console.log('syncChromeWindows and update complete: ', tPostSyncUpdate - tPreRender, ' ms')
      document.getElementById('searchBox').focus()
    }))
  }
}

export function getFocusedAndRender (isPopout) {
  var bgPage = chrome.extension.getBackgroundPage()
  var storeRef = bgPage.storeRef
  chrome.windows.getCurrent(null, (currentChromeWindow) => {
    renderPopup(storeRef, currentChromeWindow, isPopout, true)
  })
}
