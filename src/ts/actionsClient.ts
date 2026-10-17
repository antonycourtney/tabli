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
import { Preferences } from './preferences';
import * as actions from './actions';

type WindowId = number;
type TMSRef = StateRef<TabManagerState>;

let conn: WorkerConnection;

export function initClient(wc: WorkerConnection) {
    log.debug('actionsClient: init');
    conn = wc;
}

export async function showRelNotes(storeRef: TMSRef) {
    log.debug('actionsClient: showRelNotes ');
    conn.send({ action: 'showRelNotes', args: [] });
}

export async function hideRelNotes(storeRef: TMSRef) {
    log.debug('actionsClient: hideRelNotes ');
    conn.send({ action: 'hideRelNotes', args: [] });
}

export async function openWindow(targetTabWindow: TabWindow, storeRef: TMSRef) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId };
    log.debug('actionsClient: openWindow: ', args);
    conn.send({ action: 'openWindow', args });
}

export async function closeWindow(
    targetTabWindow: TabWindow,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId };
    log.debug('actionsClient: closeWindow: ', args);
    conn.send({ action: 'closeWindow', args });
}

export async function expandWindow(
    targetTabWindow: TabWindow,
    expand: boolean,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId, expand };
    log.debug('actionsClient: expandWindow: ', args);
    conn.send({ action: 'expandWindow', args });
}

export async function revertWindow(
    targetTabWindow: TabWindow,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId };
    log.debug('actionsClient: revertWindow: ', args);
    conn.send({ action: 'revertWindow', args });
}

export async function unmanageWindow(
    targetTabWindow: TabWindow,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId };
    log.debug('actionsClient: unmanageWindow: ', args);
    conn.send({ action: 'unmanageWindow', args });
}

export async function manageWindow(
    targetTabWindow: TabWindow,
    title: string,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId, title };
    log.debug('actionsClient: manageWindow: ', args);
    conn.send({ action: 'manageWindow', args });
}

export async function activateOrRestoreTab(
    targetTabWindow: TabWindow,
    tab: TabItem,
    tabIndex: number,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const tabItemId = tab.tabItemId;
    const args = { open, openWindowId, savedFolderId, tabItemId, tabIndex };
    log.debug('actionsClient: activateOrRestoreTab: ', args);
    conn.send({ action: 'activateOrRestoreTab', args });
}

export async function saveTab(
    targetTabWindow: TabWindow,
    tab: TabItem,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const tabItemId = tab.tabItemId;
    const args = { open, openWindowId, savedFolderId, tabItemId };
    log.debug('actionsClient: saveTab: ', args);
    conn.send({ action: 'saveTab', args });
}

export async function unsaveTab(
    targetTabWindow: TabWindow,
    tab: TabItem,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const tabItemId = tab.tabItemId;
    const args = { open, openWindowId, savedFolderId, tabItemId };
    log.debug('actionsClient: unsaveTab: ', args);
    conn.send({ action: 'unsaveTab', args });
}

export async function setWindowTitle(
    title: string,
    targetTabWindow: TabWindow,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId, title };
    log.debug('actionsClient: setWindowTitle: ', args);
    conn.send({ action: 'setWindowTitle', args });
}

export async function savePreferences(
    preferences: Preferences,
    storeRef: TMSRef,
) {
    const preferencesStr = preferences.serialize();
    log.debug('actionsClient: savePreferences');
    conn.send({ action: 'savePreferences', args: { preferencesStr } });
}

export async function updatePreferences(storeRef: TMSRef, updates: any) {
    log.debug('actionsClient: updatePreferences: ', updates);
    conn.send({ action: 'updatePreferences', args: { updates } });
}

export async function closeTab(
    targetTabWindow: TabWindow,
    tabId: number,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId, tabId };
    log.debug('actionsClient: closeTab: ', args);
    conn.send({ action: 'closeTab', args });
}

export async function tabSetMute(
    targetTabWindow: TabWindow,
    tabId: number,
    muted: boolean,
    storeRef: TMSRef,
) {
    const { open, openWindowId, savedFolderId } = targetTabWindow;
    const args = { open, openWindowId, savedFolderId, tabId, muted };
    log.debug('actionsClient: tabSetMute: ', args);
    conn.send({ action: 'tabSetMute', args });
}

export async function moveTabItem(
    sourceTabWindow: TabWindow,
    targetTabWindow: TabWindow,
    sourceIndex: number,
    dropIndex: number,
    movedTabItem: TabItem,
    storeRef: TMSRef,
) {
    // Update local state right away so the drop animates without flashing;
    // the worker's state patches will follow once the move is done.
    actions.optimisticMoveTabItem(
        sourceTabWindow,
        targetTabWindow,
        sourceIndex,
        dropIndex,
        movedTabItem,
        storeRef,
    );
    const source = {
        open: sourceTabWindow.open,
        openWindowId: sourceTabWindow.openWindowId,
        savedFolderId: sourceTabWindow.savedFolderId,
    };
    const target = {
        open: targetTabWindow.open,
        openWindowId: targetTabWindow.openWindowId,
        savedFolderId: targetTabWindow.savedFolderId,
    };
    const tabItemId = movedTabItem.tabItemId;
    const args = { source, target, sourceIndex, dropIndex, tabItemId };
    log.debug('actionsClient: moveTabItem: ', args);
    conn.send({ action: 'moveTabItem', args });
}

export async function toggleExpandAll(storeRef: TMSRef) {
    log.debug('actionsClient: toggleExpandAll');
    conn.send({ action: 'toggleExpandAll', args: {} });
}

export async function tidyWindows(storeRef: TMSRef) {
    log.debug('actionsClient: tidyWindows');
    conn.send({ action: 'tidyWindows', args: {} });
}

export async function untidyWindows(storeRef: TMSRef) {
    log.debug('actionsClient: untidyWindows');
    conn.send({ action: 'untidyWindows', args: {} });
}
