/**
 * common rendering entry point for popup and popout
 */
import * as log from 'loglevel';
import chromep from 'chrome-promise';
import * as utils from './utils';
import * as React from 'react';
import {} from 'react-dom/experimental';
import { createRoot } from 'react-dom/client';
import { PopupBaseProps, Popup } from './components/Popup';
import TabManagerState from './tabManagerState';
import * as actions from './actions';
import * as oneref from 'oneref';
import { update, refContainer } from 'oneref';
import { utimesSync } from 'fs';

/**
 * send message to BGhelper with listener id.
 * This allows the BGhelper to de-registered the listener
 * when the popout or popup goes away and the connection breaks.
 */
function sendHelperMessage(msg: any) {
    var port = chrome.runtime.connect({ name: 'renderedWindow' });
    port.postMessage(msg);
    port.onMessage.addListener((response: any) => {
        log.debug('Got response message: ', response);
    });
}

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
        log.debug('renderPopup: isPopout: ', isPopout);

        var tPreRender = performance.now();

        var parentNode = document.getElementById('windowList-region');

        const [App, listenerId] = refContainer<TabManagerState, PopupBaseProps>(
            storeRef,
            Popup,
            DEBOUNCE_WAIT,
        );
        log.debug('refContainer listener id: ', listenerId);
        if (utils.inExtension()) {
            sendHelperMessage({ listenerId });
        }
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
            // And set current focused window:
            log.debug(
                'renderPopup: setting current window to ',
                currentChromeWindow,
            );
            const nextStore = currentChromeWindow
                ? syncStore.setCurrentWindow(currentChromeWindow)
                : syncStore;
            if (!nextStore.equals(syncStore)) {
                update(storeRef, (st) => nextStore);
            } else {
                log.debug(
                    'doRender: nextStore.equals(savedStore) -- skipping setValue',
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
        }
    } catch (e) {
        log.error('renderPopup: caught exception invoking function: ');
        log.error((e as Error).stack);
        throw e;
    }
}

async function fetchSnapshot(): Promise<TabManagerState> {
    const storeStateSnap = await chrome.runtime.sendMessage({
        type: 'getTabliState',
    });
    console.log('*** fetchSnapshot: storeStateSnap: ', storeStateSnap);

    const storeState = TabManagerState.deserialize(storeStateSnap);

    console.log('*** fetchSnapshot: storeState: ', storeState.toJS());
    console.log(
        '*** fetchSnapshot: open window count: ',
        storeState.windowIdMap.size,
    );
    const m = storeState.windowIdMap;

    return storeState;
}

export async function getFocusedAndRender(
    isPopout: boolean,
    doSync: boolean = true,
) {
    log.setLevel('debug');
    const storeState = await fetchSnapshot();
    const storeRef = oneref.mkRef(storeState);
    (window as any)._tabliIsPopout = isPopout;
    chrome.windows.getCurrent({}, (currentChromeWindow) => {
        renderPopup(storeRef, currentChromeWindow, isPopout, doSync);
    });
}
