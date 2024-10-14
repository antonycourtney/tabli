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
import { update, refContainer, mkRef } from 'oneref';
import { applyPatches, enablePatches } from 'immer';
import { utimesSync } from 'fs';
import { init, saveSnapshot } from './savedState';
import { initState, loadSnapState } from './state';
import { deserializePatches } from './patchUtils';
import { initClient } from './actionsClient';
import { WorkerConnection } from './workerConnection';

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
    utils.setLogLevel(log);
    enablePatches();

    let storeRef: oneref.StateRef<TabManagerState> | null = null;

    (window as any)._tabliIsPopout = isPopout;

    const portName = isPopout ? 'popout' : 'popup';

    const msgHandler = (msg: any) => {
        log.debug('renderPopup: received message: ', msg);
        const { type, value } = msg;
        if (type === 'initialState') {
            const stateJS = JSON.parse(value);
            log.debug(
                'renderPopup: received initial state (deserialized): ',
                stateJS,
            );
            const nextAppState = TabManagerState.deserialize(stateJS);
            log.debug('renderPopup: deserialized state: ', nextAppState);
            if (storeRef == null) {
                storeRef = mkRef(nextAppState);
                renderPopup(storeRef, isPopout);
            } else {
                update(storeRef, (st) => nextAppState);
            }
        } else if (type === 'statePatches') {
            const patches = deserializePatches(value);
            log.debug('renderPopup: received state patches: ', patches);
            if (storeRef == null) {
                log.error(
                    'renderPopup: received patches before initial state -- ignoring',
                );
                return;
            }
            update(storeRef, (st) => {
                const nextState = applyPatches(st, patches);
                return nextState;
            });
        }
    };

    const conn = new WorkerConnection(portName, msgHandler);
    initClient(conn);
}
