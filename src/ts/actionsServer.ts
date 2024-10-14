import { mutableGet, StateRef } from 'oneref';
import * as actions from './actions';
import { log } from './globals';
import TabManagerState from './tabManagerState';
import { TabItemId, TabWindow } from './tabWindow';

async function handleShowRelNotes(
    stateRef: StateRef<TabManagerState>,
    args: {},
) {
    log.debug('actionsServer: handleShowRelNotes: ', args);

    return actions.showRelNotes(stateRef);
}

async function handleHideRelNotes(
    stateRef: StateRef<TabManagerState>,
    args: {},
) {
    log.debug('actionsServer: handleHideRelNotes: ', args);

    return actions.hideRelNotes(stateRef);
}

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
async function handleCloseWindow(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
    },
) {
    log.debug('actionsServer: handleCloseWindow: ', args);
    const { open, openWindowId, savedFolderId } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: handleCloseWindow: tabWindow not found: ',
            args,
        );
        return;
    }

    return actions.closeWindow(tabWindow, stateRef);
}

async function handleExpandWindow(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
        expand: boolean;
    },
) {
    log.debug('actionsServer: handleExpandWindow: ', args);
    const { open, openWindowId, savedFolderId, expand } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: handleExpandWindow: tabWindow not found: ',
            args,
        );
        return;
    }

    return actions.expandWindow(tabWindow, expand, stateRef);
}

async function handleRevertWindow(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
    },
) {
    log.debug('actionsServer: handleRevertWindow: ', args);
    const { open, openWindowId, savedFolderId } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: handleRevertWindow: tabWindow not found: ',
            args,
        );
        return;
    }

    return actions.revertWindow(tabWindow, stateRef);
}

async function handleUnmanageWindow(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
    },
) {
    log.debug('actionsServer: handleUnmanageWindow: ', args);
    const { open, openWindowId, savedFolderId } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: handleUnmanageWindow: tabWindow not found: ',
            args,
        );
        return;
    }

    return actions.unmanageWindow(tabWindow, stateRef);
}

async function handleManageWindow(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
        title: string;
    },
) {
    log.debug('actionsServer: handleManageWindow: ', args);
    const { open, openWindowId, savedFolderId, title } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: handleManageWindow: tabWindow not found: ',
            args,
        );
        return;
    }

    return actions.manageWindow(tabWindow, title, stateRef);
}

async function handleActivateOrRestoreTab(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
        tabItemId: TabItemId;
        tabIndex: number;
    },
) {
    log.debug('actionsServer: activateOrRestoreTab: ', args);
    const { open, openWindowId, savedFolderId, tabItemId, tabIndex } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug(
            'actionsServer: activateOrRestoreTab: tabWindow not found: ',
            args,
        );
        return;
    }
    const entry = tabWindow.findTabByTabItemId(tabItemId);
    if (entry == null) {
        log.debug('actionsServer: activateOrRestoreTab: tab not found: ', args);
        log.debug(
            'actionsServer: was looking for tabItemId: ',
            tabItemId,
            ' in tabWindow: ',
            tabWindow,
        );
        return;
    }
    const [_index, tab] = entry;

    return actions.activateOrRestoreTab(tabWindow, tab, tabIndex, stateRef);
}

async function handleSaveTab(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
        tabKey: string;
    },
) {
    log.debug('actionsServer: saveTab: ', args);
    const { open, openWindowId, savedFolderId, tabKey } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug('actionsServer: saveTab: tabWindow not found: ', args);
        return;
    }
    const entry = tabWindow.findTabByKey(tabKey);
    if (entry == null) {
        log.debug('actionsServer: saveTab: tab not found: ', args);
        return;
    }
    const [_index, tab] = entry;

    return actions.saveTab(tabWindow, tab, stateRef);
}

async function handleUnsaveTab(
    stateRef: StateRef<TabManagerState>,
    args: {
        open: boolean;
        openWindowId: number;
        savedFolderId: string;
        tabKey: string;
    },
) {
    log.debug('actionsServer: unsaveTab: ', args);
    const { open, openWindowId, savedFolderId, tabKey } = args;

    const tabWindow = findTabWindow(stateRef, args);

    if (tabWindow == null) {
        log.debug('actionsServer: unsaveTab: tabWindow not found: ', args);
        return;
    }
    const entry = tabWindow.findTabByKey(tabKey);
    if (entry == null) {
        log.debug('actionsServer: unsaveTab: tab not found: ', args);
        return;
    }
    const [_index, tab] = entry;

    return actions.unsaveTab(tabWindow, tab, stateRef);
}

type ActionHandler = (stateRef: StateRef<TabManagerState>, args: any) => void;

const actionHandlers: { [key: string]: ActionHandler } = {
    openWindow: handleOpenWindow,
    closeWindow: handleCloseWindow,
    expandWindow: handleExpandWindow,
    manageWindow: handleManageWindow,
    unmanageWindow: handleUnmanageWindow,
    revertWindow: handleRevertWindow,
    activateOrRestoreTab: handleActivateOrRestoreTab,
    saveTab: handleSaveTab,
    unsaveTab: handleUnsaveTab,
    showRelNotes: handleShowRelNotes,
    hideRelNotes: handleHideRelNotes,
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
