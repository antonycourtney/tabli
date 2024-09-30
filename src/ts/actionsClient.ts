/*
 * client that provides implementations of functions from actions.ts
 * that send messages to the service worker to perform the actions
 */
import { TabItem, TabWindow } from './tabWindow'; // eslint-disable-line
import {
    StateRef,
    utils as oneRefUtils,
    update,
    awaitableUpdate_,
    mutableGet,
    awaitableUpdate,
} from 'oneref';
import TabManagerState from './tabManagerState';
import { log } from './globals';

type WindowId = number;
type TMSRef = StateRef<TabManagerState>;

let targetPort: chrome.runtime.Port | null = null;

export function initClient(port: chrome.runtime.Port) {
    log.debug('actionsClient: init');
    targetPort = port;
}

export async function openWindow(targetTabWindow: TabWindow, storeRef: TMSRef) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId };
    log.debug('actionsClient: openWindow: ', targetPort, args);
    targetPort?.postMessage({ action: 'openWindow', args });
}
