import { log } from './globals';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { enablePatches } from 'immer';
import PreferencesModal from './components/PreferencesModal';

import * as actionsClient from './actionsClient';

import ChromePromise from 'chrome-promise';
import { StateRef, mutableGet } from 'oneref';
import TabManagerState from './tabManagerState';
import { Preferences } from './preferences';
import { loadSnapState } from './state';
import { createRoot } from 'react-dom/client';
import { WorkerConnection } from './workerConnection';
import { Tooltip } from '@radix-ui/react-tooltip';
import { TooltipProvider } from './components/ui/tooltip';
const chromep = ChromePromise;

const onClose = async () => {
    log.debug('onClose');
    const tab = await chromep.tabs.getCurrent();
    log.debug('onClose tab: ', tab);
    if (tab.id) {
        chrome.tabs.remove([tab.id]);
    }
};

const TAB_PREVIEW_PERMISSIONS = ['activeTab', 'scripting', 'tabCapture'];
/**
 * check to see if we need to request permissions
 * @param userPrefs
 * @param storeRef
 * @returns true if permissions were granted or no additional permissions needed, false otherwise
 */
async function checkPermissions(
    curEnableTabPreviews: boolean,
    newEnableTabPreviews: boolean,
): Promise<boolean> {
    log.debug(
        'checkPermissions: curEnableTabPreviews: ',
        curEnableTabPreviews,
        ' newEnableTabPreviews: ',
        newEnableTabPreviews,
    );
    if (newEnableTabPreviews && !curEnableTabPreviews) {
        // We need to request the tab capture permission:
        log.debug('checkPermissions: requesting tab preview permissions');
        try {
            const persmRes = await chrome.permissions.request({
                permissions: TAB_PREVIEW_PERMISSIONS,
            });
            if (!persmRes) {
                log.warn(
                    'checkPermissions: tab preview permissions not granted',
                );
                return false; // Permissions not granted
            }
            log.debug('checkPermissions: tab preview permission granted');
            return true; // Permissions granted
        } catch (err) {
            log.error('checkPermissions: error requesting tab capture: ', err);
        }
        // If we get here, permissions were not granted:
        return false;
    } else if (!newEnableTabPreviews && curEnableTabPreviews) {
        // We need to remove the tab preview permission:
        log.debug('checkPermissions: removing tab preview permission');
        try {
            const removeRes = await chrome.permissions.remove({
                permissions: TAB_PREVIEW_PERMISSIONS,
            });
            if (!removeRes) {
                log.warn(
                    'checkPermissions: tab preview permissions not removed',
                );
                return false; // Permissions not removed
            }

            log.debug('checkPermissions: tab preview permissions removed');
            return true; // Permissions removed
        } catch (err) {
            log.error(
                'checkPermissions: error removing tab preview permissions: ',
                err,
            );
        }
        return false; // Permissions not removed
    }
    return true;
}

const onApplyPreferences = async (
    stateRef: StateRef<TabManagerState>,
    newPrefs: Preferences,
): Promise<boolean> => {
    const appState = mutableGet(stateRef);
    const currentPrefs = appState.preferences;

    const curEnableTabPreviews = currentPrefs.enableTabPreviews;
    const enableTabPreviews = newPrefs.enableTabPreviews;

    /**
     * We'd far prefer to do this in the service worker rather than here,
     * but Chrome insists on doing this in response to a user action.
     *
     * Should probably move to the handler for 'Apply' or 'OK' rather than
     * doing it here
     */

    const permsCheck = await checkPermissions(
        curEnableTabPreviews,
        enableTabPreviews,
    );
    if (!permsCheck) {
        log.warn(
            'onApplyPreferences: permissions check failed, not updating prefs',
        );
        return false;
    }

    await actionsClient.savePreferences(newPrefs, stateRef);
    return true;
};

const onUpdatePreferences = async (
    stateRef: StateRef<TabManagerState>,
    newPrefs: Preferences,
) => {
    const ret = await onApplyPreferences(stateRef, newPrefs);
    if (!ret) {
        log.warn('onUpdatePreferences: failed to apply preferences');
        return;
    }
    log.debug('onUpdatePreferences: preferences updated successfully');
    // Close the modal after updating preferences
    await onClose();
};

const renderPrefs = async () => {
    try {
        const maybeStateRef = await loadSnapState();
        if (!maybeStateRef) {
            log.error(
                'prefsPage: could not load snap state from session storage -- exiting',
            );
            return;
        }
        const stateRef = maybeStateRef as StateRef<TabManagerState>;
        const st = mutableGet(stateRef);
        const parentNode = document.getElementById('prefsContent');

        // Initialize connection to service worker
        const conn = new WorkerConnection('prefsPage');
        actionsClient.initClient(conn);

        const modal = (
            <TooltipProvider>
                <PreferencesModal
                    onClose={onClose}
                    initialPrefs={st.preferences}
                    onApply={(prefs) => onApplyPreferences(stateRef, prefs)}
                    onSubmit={(prefs) => onUpdatePreferences(stateRef, prefs)}
                />
            </TooltipProvider>
        );
        createRoot(parentNode!).render(modal);
    } catch (e) {
        log.error('caught exception rendering preferences page:');
        log.error((e as Error).stack);
        throw e;
    }
};

function main() {
    enablePatches();
    window.onload = () => renderPrefs();
}

main();
