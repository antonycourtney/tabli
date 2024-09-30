import { mutableGet, StateRef } from 'oneref';
import * as actions from './actions';
import { log } from './globals';
import TabManagerState from './tabManagerState';
import { TabWindow } from './tabWindow';

function findTabWindow(
    stateRef: StateRef<TabManagerState>,
    {
        open,
        openWindowId,
        savedFolderId,
    }: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
    },
): TabWindow | null {
    const appState = mutableGet(stateRef);
    if (open) {
        return appState.getTabWindowByChromeId(openWindowId);
    } else {
        return appState.getSavedWindowByBookmarkId(savedFolderId);
    }
}

async function handleOpenWindow(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
    },
) {
    log.debug('actionsServer: handleOpenWindow: ', args);
    const { open, openWindowId, savedFolderId } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: handleOpenWindow: tabWindow not found: ',
            args,
        );
        return;
    }

    return actions.openWindow(tabWindow, stateRef);
}

type ActionHandler = (stateRef: StateRef<TabManagerState>, args: any) => void;

const actionHandlers: { [key: string]: ActionHandler } = {
    openWindow: handleOpenWindow,
};

function handleMessage(
    stateRef: StateRef<TabManagerState>,
    message: any,
    port: chrome.runtime.Port,
) {
    log.debug('actionsServer: handleMessage: ', message);
    const { action, args } = message;
    const handler = actionHandlers[action];
    if (handler == null) {
        log.error('actionsServer: handleMessage: unknown action: ', action);
        return;
    }
    handler(stateRef, args);
    return true;
}

export function startServer(
    stateRef: StateRef<TabManagerState>,
    port: chrome.runtime.Port,
) {
    log.debug('actionsServer: startServer: ', port);
    port.onMessage.addListener((message, port) =>
        handleMessage(stateRef, message, port),
    );
}
