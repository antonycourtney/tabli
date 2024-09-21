/**
 * common rendering entry point for popup and popout
 */
import { initGlobalLogger, log } from './globals';
import chromep from 'chrome-promise';
import * as utils from './utils';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { PopupBaseProps, Popup } from './components/Popup';
import TabManagerState from './tabManagerState';
import * as actions from './actions';
import * as oneref from 'oneref';
import { update, refContainer } from 'oneref';
import { utimesSync } from 'fs';
import { init, saveSnapshot } from './savedState';
import { initState } from './state';

// full state update no more than 5 times a second:
const DEBOUNCE_WAIT = 200;

/**
 * Main entry point to rendering the popup window
 */
export async function renderPopup(
    storeRef: oneref.StateRef<TabManagerState>,
    currentChromeWindow: chrome.windows.Window | null,
    isPopout: boolean,
    doSync: boolean,
    renderTest: boolean = false,
) {
    try {
        utils.setLogLevel(log);
        log.debug('renderPopup: isPopout: ', isPopout, ' doSync: ', doSync);

        const portName = isPopout ? 'popout' : 'popup';
        const port = chrome.runtime.connect({ name: portName });
        log.debug('renderPopup: connected to service worker');

        port.onMessage.addListener((msg) => {
            log.debug('renderPopup: received message: ', msg);
            const { type } = msg;
            if (type === 'stateChange') {
                const { stateSnapshot } = msg;
                /*
                log.debug(
                    'renderPopup: received state change: ',
                    stateSnapshot,
                );
                const stateJS = JSON.parse(stateSnapshot);
                const nextAppState = TabManagerState.deserialize(stateJS);
                update(storeRef, (st) => nextAppState);
                */
            }
        });

        var tPreRender = performance.now();

        var parentNode = document.getElementById('windowList-region');

        const [App, listenerId] = refContainer<TabManagerState, PopupBaseProps>(
            storeRef,
            Popup,
            DEBOUNCE_WAIT,
        );
        log.debug('refContainer listener id: ', listenerId);
        // TODO: We may want to record this listenerId, and clean it up on a reload
        // (used to be achieved by sending a message to bgHelper)

        createRoot(parentNode!).render(
            <App isPopout={isPopout} noListener={renderTest} />,
        );

        var tPostRender = performance.now();
        log.info(
            'full render complete. render time: (',
            tPostRender - tPreRender,
            ' ms)',
        );

        // And sync our window state, which may update the UI...
        if (doSync) {
            const syncStore = await actions.syncChromeWindows(storeRef);
            log.debug(
                '*** renderPopup: after window sync, open windows: ',
                syncStore.windowIdMap.size,
            );
            const m = syncStore.windowIdMap;
            const syncStoreJS = syncStore.toJS() as any;
            log.debug('*** renderPopup: window sync complete: ', syncStoreJS);
            let nextStore = syncStore;
            // And set current focused window:
            if (
                currentChromeWindow &&
                currentChromeWindow.id !== syncStore.currentWindowId
            ) {
                log.debug(
                    `renderPopup: setting current window from ${syncStore.currentWindowId} to ${currentChromeWindow.id}: `,
                    currentChromeWindow,
                );
                nextStore = syncStore.setCurrentWindow(currentChromeWindow);
                log.debug(
                    'renderPopup: after call to setCurrentWindow: nextStore: ',
                    nextStore,
                );
                update(storeRef, (st) => nextStore);
            } else {
                log.debug(
                    'doRender: no change in current window -- skipping setValue',
                );
            }
            if (
                isPopout &&
                currentChromeWindow &&
                nextStore.popoutWindowId !== currentChromeWindow.id &&
                currentChromeWindow.id !== undefined
            ) {
                log.debug(
                    'Setting popout window id to ',
                    currentChromeWindow.id,
                );
                update(storeRef, (st) =>
                    st.set('popoutWindowId', currentChromeWindow.id!),
                );
            }

            // logHTML("Updated savedHTML", renderedString)
            var tPostSyncUpdate = performance.now();
            log.info(
                'syncChromeWindows and update complete: ',
                tPostSyncUpdate - tPreRender,
                ' ms',
            );
            saveSnapshot(storeRef);
        }
    } catch (e) {
        log.error('renderPopup: caught exception invoking function: ');
        log.error((e as Error).stack);
        throw e;
    }
}

export async function getFocusedAndRender(
    isPopout: boolean,
    doSync: boolean = true,
) {
    initGlobalLogger(isPopout ? 'popout' : 'popup');
    const storeRef = await initState(true);
    (window as any)._tabliIsPopout = isPopout;
    chrome.windows.getCurrent({ populate: true }, (currentChromeWindow) => {
        renderPopup(storeRef, currentChromeWindow, isPopout, doSync);
    });
}
