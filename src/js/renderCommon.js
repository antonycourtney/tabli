// @flow
/**
 * common rendering entry point for popup and popout
 */
import * as log from 'loglevel'
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
  doSync: boolean,
  renderTest: boolean = false
) {
  try {
    log.log('renderPopup: isPopout: ', isPopout)

    var tPreRender = performance.now()

    var parentNode = document.getElementById('windowList-region')

    var appElement = (
      <Popup
        storeRef={storeRef}
        initialWinStore={storeRef.getValue()}
        isPopout={isPopout}
        noListener={renderTest}
      />)
    ReactDOM.render(appElement, parentNode, () => { // eslint-disable-line no-unused-vars
      const searchBoxElem = document.getElementById('searchBox')
      if (searchBoxElem) {
        searchBoxElem.focus()
      }
    })

    var tPostRender = performance.now()
    log.log('full render complete. render time: (', tPostRender - tPreRender, ' ms)')

    // And sync our window state, which may update the UI...
    if (doSync) {
      const syncStore = await actions.syncChromeWindows(storeRef)
      log.log('postLoadRender: window sync complete: ', syncStore)
      // And set current focused window:
      log.log('renderPopup: setting current window to ', currentChromeWindow)
      const nextStore = syncStore.setCurrentWindow(currentChromeWindow)
      if (!(nextStore.equals(syncStore))) {
        storeRef.setValue(nextStore)
      } else {
        log.log('doRender: nextStore.equals(savedStore) -- skipping setValue')
      }

      // logHTML("Updated savedHTML", renderedString)
      var tPostSyncUpdate = performance.now()
      log.log('syncChromeWindows and update complete: ', tPostSyncUpdate - tPreRender, ' ms')
    }
  } catch (e) {
    log.error('renderPopup: caught exception invoking function: ')
    log.error(e.stack)
    throw e
  }
}

export function getFocusedAndRender (isPopout: boolean, doSync: boolean = true) {
  var bgPage = chrome.extension.getBackgroundPage()
  var storeRef = bgPage.storeRef
  chrome.windows.getCurrent({}, (currentChromeWindow) => {
    renderPopup(storeRef, currentChromeWindow, isPopout, doSync)
  })
}
