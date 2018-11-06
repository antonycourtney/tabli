// @flow
import * as log from 'loglevel'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import PreferencesModal from './components/PreferencesModal'

import * as actions from './actions'

import ChromePromise from 'chrome-promise'
const chromep = ChromePromise

const onClose = async () => {
  log.log('onClose')
  const tab = await chromep.tabs.getCurrent()
  log.log('onClose tab: ', tab)
  chrome.tabs.remove(tab.id)
}

const onUpdatePreferences = (storeRef, newPrefs) => {
  log.log('update preferences: ', newPrefs.toJS())
  actions.savePreferences(newPrefs, storeRef)
  onClose()
}

const renderPrefs = async () => {
  try {
    const bgPage = chrome.extension.getBackgroundPage()
    const storeRef = bgPage.storeRef
    const st = storeRef.getValue()
    const parentNode = document.getElementById('prefsContent')
    const modal = (
      <PreferencesModal
        onClose={onClose}
        initialPrefs={st.preferences}
        storeRef={storeRef}
        onSubmit={(prefs) => onUpdatePreferences(storeRef, prefs)} />)
    ReactDOM.render(modal, parentNode)
  } catch (e) {
    log.error('caught exception rendering preferences page:')
    log.error(e.stack)
    throw e
  }
}

function main () {
  window.onload = () => renderPrefs()
}

main()
