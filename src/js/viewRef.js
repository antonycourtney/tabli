import * as OneRef from 'oneref'
import * as _ from 'lodash'

/**
 * A wrapper around OneRef.Ref that tracks listeners by numeric id
 * so that we can share a ref between background page and popup
 * in Chrome extension and clean up when popup goes away
 *
 *
 */

// Save previous bookmarkIdMap for efficient diff
let prevBookmarkIdMap = null  // last bookmarkIdMap written

let latestBookmarkIdMap = null  // most recent bookmark map

/**
 * get diffs between old and new version of bookmark id map.
 * Assumes an Immutable.Map() of string to Immutable.Record
 * returns:
 *  { deletes: Immutable.Set<string>, updates: Immutable.Seq<record> }
 */
const getDiffs = (prevMap, curMap) => {
  // find deleted keys:
  const prevKeySet = prevMap.keySeq().toSet()
  const curKeySet = curMap.keySeq().toSet()
  const deletes = prevKeySet.subtract(curKeySet)

  const updatedKeys = curMap.keySeq().filter(k => !deletes.has(k) && (prevMap.get(k) !== curMap.get(k)))
  const updates = updatedKeys.map(k => curMap.get(k))

  return { deletes, updates }
}

/**
 * determines if there are any diffs between prevMap and curMap
 */
const hasDiffs = (prevMap, curMap) => {
  const diffs = getDiffs(prevMap, curMap)
  return ((diffs.deletes.count() > 0) ||
    (diffs.updates.count() > 0))
}

const savedWindowStateVersion = 1

// persist bookmarkIdMap to local storage
const saveState = () => {
  prevBookmarkIdMap = latestBookmarkIdMap
  const savedWindowState = JSON.stringify(latestBookmarkIdMap, null, 2)
  const savedState = { savedWindowStateVersion, savedWindowState }
  chrome.storage.local.set(savedState, () => {
    console.log((new Date()).toString() + ' succesfully wrote window state')
  })
}

// A throttled version of saveState that will update our saved
// bookmark state at most once every 30 sec
const throttledSaveState = _.throttle(saveState, 30 * 1000)

export default class ViewRef extends OneRef.Ref {
  /**
   * construct a new ViewRef with initial value v
   */
  constructor (v) {
    super(v)
    this.viewListeners = []
  }

  /*
   * Add a view listener and return its listener id
   *
   * We have our own interface here because we don't have a reliable destructor / close event
   * on the chrome extension popup window, and our GC technique requires us to have
   * numeric id's (rather than object references) that we can encode in a Chrome JSON
   * message
   */
  addViewListener (listener) {
    // check to ensure this listener not yet registered:
    var idx = this.viewListeners.indexOf(listener)
    if (idx === -1) {
      idx = this.viewListeners.length
      this.viewListeners.push(listener)
      this.on('change', listener)
    }

    return idx
  }

  removeViewListener (id) {
    // console.log("removeViewListener: removing listener id ", id)
    var listener = this.viewListeners[id]
    if (listener) {
      this.removeListener('change', listener)
    } else {
      console.warn('removeViewListener: No listener found for id ', id)
    }

    delete this.viewListeners[id]
  }

  setValue (appState) {
    latestBookmarkIdMap = appState.bookmarkIdMap
    if (prevBookmarkIdMap == null) {
      prevBookmarkIdMap = latestBookmarkIdMap
    } else {
      if (hasDiffs(prevBookmarkIdMap, latestBookmarkIdMap)) {
        throttledSaveState()
      } else {
      }
    }
    super.setValue(appState)
  }

}
