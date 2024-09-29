import { log } from './globals';
import throttle from 'lodash/throttle';
import mapValues from 'lodash/mapValues';
import TabManagerState from './tabManagerState';
import { StateRef, addStateChangeListener, mutableGet } from 'oneref';
import * as Immutable from 'immutable';
import { TabWindow, TabItem } from './tabWindow';
const _ = { throttle, mapValues };

// Save previous bookmarkIdMap for efficient diff
let prevBookmarkIdMap: { [id: string]: TabWindow } | null = null; // last bookmarkIdMap written

let latestBookmarkIdMap: { [id: string]: TabWindow } | null = null; // most recent bookmark map

/**
 * get diffs between old and new version of bookmark id map.
 */
const getDiffs = (
    prevMap: { [id: string]: TabWindow },
    curMap: { [id: string]: TabWindow },
) => {
    const prevKeys = new Set(Object.keys(prevMap));
    const curKeys = new Set(Object.keys(curMap));

    // find deleted keys:
    const deletes = new Set([...prevKeys].filter((x) => !curKeys.has(x)));

    const updatedKeys = Object.keys(curMap).filter(
        (k) => !deletes.has(k) && prevMap[k] !== curMap[k],
    );
    const updates = updatedKeys.map((k) => curMap[k]);

    return { deletes, updates };
};

/**
 * determines if there are any diffs between prevMap and curMap
 */
const hasDiffs = (
    prevMap: { [id: string]: TabWindow },
    curMap: { [id: string]: TabWindow },
) => {
    const diffs = getDiffs(prevMap, curMap);
    return diffs.deletes.size > 0 || diffs.updates.length > 0;
};

const savedWindowStateVersion = 1;

// persist bookmarkIdMap to local storage
const saveState = () => {
    prevBookmarkIdMap = latestBookmarkIdMap;
    // never persist a chrome session id -- we'll set during startup from sessions API
    const serBookmarkIdMap = _.mapValues(latestBookmarkIdMap, (tw: TabWindow) =>
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
