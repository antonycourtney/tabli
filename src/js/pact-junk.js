import tabliBrowser from './chromeBrowser'
import * as Constants from './components/constants'

import Q from 'q'

/*
 * Experimental module for composable promise-based actions.
 *
 * All exported functions in this module return an APST, which is
 * an AppState transformer (AppState -> AppState)
 * wrapped in a Promise.
 */

const idst = st => st
/**
 * pact version of closeWindow.
 *
 * Close the specified tabWindow and return an APST that resolves
 * when window is closed.
 */
export function closeWindow (tabWindow) {
  var deferred = Q.defer()
  if (!tabWindow.open) {
    console.log('closeWindow: request to close non-open window, ignoring...')
    deferred.resolve(idst)
  }
  chrome.windows.remove(tabWindow.openWindowId, () => {
    deferred.resolve((state) => state.handleTabWindowClosed(tabWindow))
  })
  return deferred.promise
}

/**
 * close popout window (if open)
 *
 * N.B. not exported
 * returns: APST
 */
function closePopout (winStore) {
  const ptw = winStore.getPopoutTabWindow()

  const ret = ptw ? closeWindow(ptw) : Q(idst)

  return ret
}

/*
 * show popout window (and update local storage)
 *
 * returns: APST
 */
export function showPopout (winStore) {
  const ptw = winStore.getPopoutTabWindow()
  if (ptw) {
    tabliBrowser.setFocusedWindow(ptw.openWindowId)
    return Q(idst)
  }
  var deferred = Q.defer()

  chrome.storage.local.set({'showPopout': true}, () => {
    chrome.windows.create({ url: 'popout.html',
      type: 'popup',
      left: 0,
      top: 0,
      width: Constants.POPOUT_DEFAULT_WIDTH,
      height: Constants.POPOUT_DEFAULT_HEIGHT
    }, () => {
      deferred.resolve(idst)
    })
  })

  return deferred.promise
}

/*
 * hide popout window (and update local storage)
 *
 * returns: APST
 */
export function hidePopout (winStore) {
  const cp = closePopout(winStore)

  return cp.then(() => {
    chrome.storage.local.set({'showPopout': false})
    return idst
  })
}

/*
 * Given a oneref.Ref and a pact,run the pact and update the state in stRef with the result.
 *
 * Note that pf is a function of zero arguments to account for laziness.
 *
 * Returns: Promise<State> of resulting state.
 */
export function run (stRef, pf) {
  return pf().then(stf => {
    const st0 = stRef.getValue()
    const nextSt = stf(st0)
    stRef.setValue(nextSt)
    return nextSt
  })
}

/*
 * A bind operation corresponding to (>>) (rather than >>=) from Haskell.
 *
 * Note that to account for laziness and get the sequencing right, pf0 and pf1 are
 * no-arg functions that return pact promises.
 */
export function bind_ (stRef, pf0, pf1) {
  var p0 = run(stRef, pf0)
  return p0.then(nextSt => {
    return run(stRef, pf1)
  })
}

/*
 * restorePopout based on sequential composition of promise-based actions
 *
 * returns: Promise<State>
 */
export function restorePopout (stRef) {
  var deferred = Q.defer()
  // This would probably be cleaner with a promise wrapper
  // for chrome.storage.local.get...
  chrome.storage.local.get({'showPopout': false}, items => {
    const closeAct = () => closePopout(stRef.getValue())
    const showAct = () => {
      if (items.showPopout) {
        return showPopout(stRef.getValue())
      } else {
        return Q(idst)
      }
    }
    bind_(stRef, closeAct, showAct).done(finalState => {
      deferred.resolve(finalState)
    })
  })
  return deferred.promise
}
