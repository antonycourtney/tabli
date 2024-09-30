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
import { applyPatches, enablePatches } from 'immer';
import { utimesSync } from 'fs';
import { init, saveSnapshot } from './savedState';
import { initState, loadSnapState } from './state';
import { deserializePatches } from './patchUtils';
import { initClient } from './actionsClient';

// full state update no more than 5 times a second:
const DEBOUNCE_WAIT = 200;

/**
 * Main entry point to rendering the popup window
 */
export async function renderPopup(
    storeRef: oneref.StateRef<TabManagerState>,
    isPopout: boolean,
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
    enablePatches();
    // const storeRef = await initState(true);
    const storeRef = await loadSnapState();

    if (storeRef == null) {
        throw new Error(
            'getFocusedAndRender: failed to load state snapshot from session storage',
        );
    }
    (window as any)._tabliIsPopout = isPopout;

    const portName = isPopout ? 'popout' : 'popup';
    const port = chrome.runtime.connect({ name: portName });
    log.debug('renderPopup: connected to service worker');

    initClient(port);

    port.onMessage.addListener((msg) => {
        log.debug('renderPopup: received message: ', msg);
        const { type, value } = msg;
        if (type === 'initialState') {
            log.debug('renderPopup: received initial state: ', value);
            const stateJS = JSON.parse(value);
            const nextAppState = TabManagerState.deserialize(stateJS);
            update(storeRef, (st) => nextAppState);
        } else if (type === 'statePatches') {
            log.debug('renderPopup: received state patches: ', value);
            const patches = deserializePatches(value);
            update(storeRef, (st) => {
                const nextState = applyPatches(st, patches);
                return nextState;
            });
        }
    });

    renderPopup(storeRef, isPopout);
}
