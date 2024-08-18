import log from 'loglevel';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PreferencesModal from './components/PreferencesModal';

import * as actions from './actions';

import ChromePromise from 'chrome-promise';
import { StateRef, mutableGet } from 'oneref';
import TabManagerState from './tabManagerState';
import { Preferences } from './preferences';
import { loadSnapState } from './state';
import { createRoot } from 'react-dom/client';
const chromep = ChromePromise;

const onClose = async () => {
    log.debug('onClose');
    const tab = await chromep.tabs.getCurrent();
    log.debug('onClose tab: ', tab);
    if (tab.id) {
        chrome.tabs.remove([tab.id]);
    }
};

const onApplyPreferences = async (
    stateRef: StateRef<TabManagerState>,
    newPrefs: Preferences,
) => {
    await actions.savePreferences(newPrefs, stateRef);
};

const onUpdatePreferences = async (
    stateRef: StateRef<TabManagerState>,
    newPrefs: Preferences,
) => {
    await onApplyPreferences(stateRef, newPrefs);
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
        const modal = (
            <PreferencesModal
                onClose={onClose}
                initialPrefs={st.preferences}
                onApply={(prefs) => onApplyPreferences(stateRef, prefs)}
                onSubmit={(prefs) => onUpdatePreferences(stateRef, prefs)}
            />
        );
        createRoot(parentNode!).render(modal);
    } catch (e) {
        log.error('caught exception rendering preferences page:');
        log.error((e as Error).stack);
        throw e;
    }
};

function main() {
    window.onload = () => renderPrefs();
}

main();
