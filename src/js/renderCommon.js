// @flow
/**
 * common rendering entry point for popup and popout
 */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Popup from './components/Popup'
import TabManagerState from './tabManagerState'
import * as actions from './actions'

import * as oneref from 'oneref'

/**
 * Main entry point to rendering the popup window
 */
export async function renderPopup (
  storeRef: oneref.Ref<TabManagerState>,
  currentChromeWindow: Object,
  isPopout: boolean,
  doSync: boolean
) {
  try {
    console.log('renderPopup: isPopout: ', isPopout)

    var tPreRender = performance.now()

    var parentNode = document.getElementById('windowList-region')

    var appElement = <Popup storeRef={storeRef} initialWinStore={storeRef.getValue()} isPopout={isPopout} />
    ReactDOM.render(appElement, parentNode, () => { // eslint-disable-line no-unused-vars
      const searchBoxElem = document.getElementById('searchBox')
      if (searchBoxElem) {
        searchBoxElem.focus()
      }
    })

    var tPostRender = performance.now()
    console.log('full render complete. render time: (', tPostRender - tPreRender, ' ms)')

    // And sync our window state, which may update the UI...
    if (doSync) {
      const syncStore = await actions.syncChromeWindows(storeRef)
      console.log('postLoadRender: window sync complete: ', syncStore)
      // And set current focused window:
      console.log('renderPopup: setting current window to ', currentChromeWindow)
      const nextStore = syncStore.setCurrentWindow(currentChromeWindow)
      if (!(nextStore.equals(syncStore))) {
        storeRef.setValue(nextStore)
      } else {
        console.log('doRender: nextStore.equals(savedStore) -- skipping setValue')
      }

      // logHTML("Updated savedHTML", renderedString)
      var tPostSyncUpdate = performance.now()
      console.log('syncChromeWindows and update complete: ', tPostSyncUpdate - tPreRender, ' ms')
    }
  } catch (e) {
    console.error('renderPopup: caught exception invoking function: ')
    console.error(e.stack)
    throw e
  }
}

export function getFocusedAndRender (isPopout: boolean) {
  var bgPage = chrome.extension.getBackgroundPage()
  var storeRef = bgPage.storeRef
  chrome.windows.getCurrent({}, (currentChromeWindow) => {
    renderPopup(storeRef, currentChromeWindow, isPopout, true)
  })
}
