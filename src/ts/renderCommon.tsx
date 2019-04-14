/**
 * common rendering entry point for popup and popout
 */
import * as log from 'loglevel';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PopupBaseProps, Popup } from './components/Popup';
import TabManagerState from './tabManagerState';
import * as actions from './actions';
import * as oneref from 'oneref';
import { update, refContainer } from 'oneref';

/**
 * Main entry point to rendering the popup window
 */
export async function renderPopup(
    storeRef: oneref.StateRef<TabManagerState>,
    currentChromeWindow: chrome.windows.Window,
    isPopout: boolean,
    doSync: boolean,
    renderTest: boolean = false
) {
    try {
        log.debug('renderPopup: isPopout: ', isPopout);

        var tPreRender = performance.now();

        var parentNode = document.getElementById('windowList-region');

        const App = refContainer<TabManagerState, PopupBaseProps>(
            storeRef,
            Popup
        );
        ReactDOM.render(
            <App isPopout={isPopout} noListener={renderTest} />,
            parentNode,
            () => {
                const searchBoxElem = document.getElementById('searchBox');
                if (searchBoxElem) {
                    searchBoxElem.focus();
                }
            }
        );

        var tPostRender = performance.now();
        log.info(
            'full render complete. render time: (',
            tPostRender - tPreRender,
            ' ms)'
        );

        // And sync our window state, which may update the UI...
        if (doSync) {
            const syncStore = await actions.syncChromeWindows(storeRef);
            log.debug('postLoadRender: window sync complete: ', syncStore);
            // And set current focused window:
            log.debug(
                'renderPopup: setting current window to ',
                currentChromeWindow
            );
            const nextStore = syncStore.setCurrentWindow(currentChromeWindow);
            if (!nextStore.equals(syncStore)) {
                update(storeRef, st => nextStore);
            } else {
                log.debug(
                    'doRender: nextStore.equals(savedStore) -- skipping setValue'
                );
            }

            // logHTML("Updated savedHTML", renderedString)
            var tPostSyncUpdate = performance.now();
            log.info(
                'syncChromeWindows and update complete: ',
                tPostSyncUpdate - tPreRender,
                ' ms'
            );
        }
    } catch (e) {
        log.error('renderPopup: caught exception invoking function: ');
        log.error(e.stack);
        throw e;
    }
}

export function getFocusedAndRender(isPopout: boolean, doSync: boolean = true) {
    log.setLevel('debug');
    var bgPage = chrome.extension.getBackgroundPage();
    var storeRef = (bgPage as any).stateRef;
    chrome.windows.getCurrent({}, currentChromeWindow => {
        renderPopup(storeRef, currentChromeWindow, isPopout, doSync);
    });
}
