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
import { WorkerConnection } from './workerConnection';

type WindowId = number;
type TMSRef = StateRef<TabManagerState>;

let conn: WorkerConnection;

export function initClient(wc: WorkerConnection) {
    log.debug('actionsClient: init');
    conn = wc;
}

export async function openWindow(targetTabWindow: TabWindow, storeRef: TMSRef) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId };
    log.debug('actionsClient: openWindow: ', args);
    conn.send({ action: 'openWindow', args });
}
