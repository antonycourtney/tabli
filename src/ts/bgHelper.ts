import * as Constants from './components/constants';
import ChromePromise from 'chrome-promise';
import diff from 'deep-diff';
import { initGlobalLogger, log } from './globals';
import { initState, loadSnapState, readSnapStateStr } from './state';
import { enablePatches, Patch } from 'immer';
import * as actions from './actions';
import { addStateChangeListener, mutableGet, StateRef } from 'oneref';
import * as utils from './utils';
import _ from 'lodash';
import TabManagerState, {
    addPatchListener,
    PatchListenerId,
    removePatchListener,
} from './tabManagerState';
import { patch } from 'semver';
import { serializePatches } from './patchUtils';
import * as actionsServer from './actionsServer';

const chromep = ChromePromise;

function registerPatchListener(
    stateRef: StateRef<TabManagerState>,
    port: chrome.runtime.Port,
): PatchListenerId {
    const appState = mutableGet(stateRef);

    // First: Let's send the initial state:
    const stateSnapshot = JSON.stringify(appState, null, 2);
    port.postMessage({ type: 'initialState', value: stateSnapshot });

    let batchedPatches: Patch[] = [];

    const stateUpdater = () => {
        try {
            if (batchedPatches.length === 0) {
                log.debug('stateUpdater: no patches to send');
                return;
            }
            log.debug('sending batched patches: ', batchedPatches);
            const value = serializePatches(batchedPatches);
            port.postMessage({ type: 'statePatches', value });
            batchedPatches = [];
        } catch (e) {
            log.debug('error sending state change: ', e);
            removePatchListener(listenerId);
        }
    };
    const throttledStateUpdater = _.throttle(stateUpdater, 100);

    const listenerId = addPatchListener((patches) => {
        batchedPatches.push(...patches);
        throttledStateUpdater();
    });

    return listenerId;
}

async function main() {
    console.log('*** bgHelper: started at ', new Date().toString());
    enablePatches();
    initGlobalLogger('bgHelper');
    utils.setLogLevel(log);
    const userPrefs = await actions.readPreferences();
    log.debug('bgHelper: Read userPrefs: ', userPrefs);

    // Check for existence of snap state -- if it exists, we're already running
    const snapStateStr = await readSnapStateStr();

    // initalLoad will be set to true the very first time bgHelper is loaded in a Chrome session:
    const initialLoad = snapStateStr == null;
    log.debug('bgHelper: initialLoad: ', initialLoad);

    // 8/23/24: Passing false for now to avoid horrid race condition when opening saved windows.
    // Means that popout window Id will often be wrong.
    const stateRef = await initState(true);

    log.debug('bgHelper: initialized stateRef');

    if (initialLoad && userPrefs.popoutOnStart) {
        log.debug('bgHelper: popoutOnStart is true, creating popout');
        actions.showPopout(stateRef);
    } else {
        log.debug('bgHelper: skipping popout');
    }
    chrome.commands.onCommand.addListener((command) => {
        log.debug('Chrome Event: onCommand: ', command);

        if (command === 'show_popout') {
            actions.showPopout(stateRef);
        }
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        log.debug('bgHelper: Received message:', message);
        if (message.action === 'showPopout') {
            actions.showPopout(stateRef);
        }
        if (message.action === 'hidePopout') {
            actions.hidePopout(stateRef);
        }
        if (message.action === 'getPopoutWindowId') {
            const appState = mutableGet(stateRef);
            sendResponse({
                windowId: appState.popoutWindowId,
            });
        }
        return false;
    });

    // Use a port to track popout window
    chrome.runtime.onConnect.addListener((port) => {
        log.debug('bgHelper: onConnect: ', port, ' name: ', port.name);

        const listenerId = registerPatchListener(stateRef, port);
        actionsServer.startServer(stateRef, port);
        port.onDisconnect.addListener(() => {
            log.debug('bgHelper: port disconnected: ', port);
            removePatchListener(listenerId);
        });
    });
}

main();
