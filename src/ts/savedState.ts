import { log } from './globals';
import throttle from 'lodash/throttle';
import TabManagerState from './tabManagerState';
import { StateRef, addStateChangeListener, mutableGet } from 'oneref';
import * as Immutable from 'immutable';
import { TabWindow, TabItem } from './tabWindow';
const _ = { throttle };

// Save previous bookmarkIdMap for efficient diff
let prevBookmarkIdMap: Immutable.Map<string, TabWindow> | null = null; // last bookmarkIdMap written

let latestBookmarkIdMap: Immutable.Map<string, TabWindow> | null = null; // most recent bookmark map

/**
 * get diffs between old and new version of bookmark id map.
 * Assumes an Immutable.Map() of string to Immutable.Record
 * returns:
 *  { deletes: Immutable.Set<string>, updates: Immutable.Seq<record> }
 */
const getDiffs = (
    prevMap: Immutable.Map<string, TabWindow>,
    curMap: Immutable.Map<string, TabWindow>,
) => {
    // find deleted keys:
    const prevKeySet = prevMap.keySeq().toSet();
    const curKeySet = curMap.keySeq().toSet();
    const deletes = prevKeySet.subtract(curKeySet);

    const updatedKeys = curMap
        .keySeq()
        .filter((k) => !deletes.has(k) && prevMap.get(k) !== curMap.get(k));
    const updates = updatedKeys.map((k) => curMap.get(k));

    return { deletes, updates };
};

/**
 * determines if there are any diffs between prevMap and curMap
 */
const hasDiffs = (
    prevMap: Immutable.Map<string, TabWindow>,
    curMap: Immutable.Map<string, TabWindow>,
) => {
    const diffs = getDiffs(prevMap, curMap);
    return diffs.deletes.count() > 0 || diffs.updates.count() > 0;
};

const savedWindowStateVersion = 1;

// persist bookmarkIdMap to local storage
const saveState = () => {
    prevBookmarkIdMap = latestBookmarkIdMap;
    // never persist a chrome session id -- we'll set during startup from sessions API
    const serBookmarkIdMap = latestBookmarkIdMap!.map((tw) =>
        tw.clearChromeSessionId(),
    );
    const savedWindowState = JSON.stringify(serBookmarkIdMap, null, 2);
    const savedState = { savedWindowStateVersion, savedWindowState };
    chrome.storage.local.set(savedState, () => {
        log.debug(new Date().toString() + ' succesfully wrote window state');
        // log.debug('window state: ', serBookmarkIdMap.toJS());
    });
};

// A throttled version of saveState that will update our saved
// bookmark state at most once every 30 sec
const throttledSaveState = _.throttle(saveState, 30 * 1000);

// Save a snapshot of the current state to session storage every 10 seconds
let lastSnaphotState: TabManagerState | null = null;

export const saveSnapshot = (stRef: StateRef<TabManagerState>) => {
    const appState = mutableGet(stRef);
    if (lastSnaphotState == null || appState !== lastSnaphotState) {
        lastSnaphotState = appState;
        const snap = appState.toJS();
        const stateSnapshot = JSON.stringify(snap, null, 2);
        chrome.storage.session.set({ stateSnapshot }, () => {
            log.debug('saveSnapshot: saved snapshot');
            log.debug(
                'saveSnapshot: snapshot popoutWindowId: ',
                appState.popoutWindowId,
            );
        });
    } else {
        // pretty much never hit, since listener only invoked when state
        // actually updated
        log.debug('saveSnapshot: no change in state, skipping snapshot');
    }
};

export const init = (stRef: StateRef<TabManagerState>) => {
    const saveStateListener = (appState: TabManagerState) => {
        latestBookmarkIdMap = appState.bookmarkIdMap;
        if (prevBookmarkIdMap == null) {
            prevBookmarkIdMap = latestBookmarkIdMap;
        } else {
            if (hasDiffs(prevBookmarkIdMap, latestBookmarkIdMap)) {
                throttledSaveState();
            }
        }
    };

    const throttledSaveSnapshot = _.throttle(
        () => saveSnapshot(stRef),
        10 * 1000,
    );

    // We combine our two listeners to work around stupid bug in oneref, which
    // uses .on() instead of .addListener()
    const mergedListener = (appState: TabManagerState) => {
        saveStateListener(appState);
        throttledSaveSnapshot();
    };
    addStateChangeListener(stRef, mergedListener);
};
