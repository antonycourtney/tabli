import log from 'loglevel';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PreferencesModal from './components/PreferencesModal';

import * as actions from './actions';

import ChromePromise from 'chrome-promise';
import { StateRef, mutableGet } from 'oneref';
import TabManagerState from './tabManagerState';
import { Preferences } from './preferences';
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
    newPrefs: Preferences
) => {
    await actions.savePreferences(newPrefs, stateRef);
};

const onUpdatePreferences = async (
    stateRef: StateRef<TabManagerState>,
    newPrefs: Preferences
) => {
    await onApplyPreferences(stateRef, newPrefs);
    await onClose();
};

const renderPrefs = async () => {
    try {
        const bgPage = chrome.extension.getBackgroundPage();
        const stateRef = (bgPage as any).stateRef as StateRef<TabManagerState>;
        const st = mutableGet(stateRef);
        const parentNode = document.getElementById('prefsContent');
        const modal = (
            <PreferencesModal
                onClose={onClose}
                initialPrefs={st.preferences}
                onApply={prefs => onApplyPreferences(stateRef, prefs)}
                onSubmit={prefs => onUpdatePreferences(stateRef, prefs)}
            />
        );
        ReactDOM.render(modal, parentNode);
    } catch (e) {
        log.error('caught exception rendering preferences page:');
        log.error(e.stack);
        throw e;
    }
};

function main() {
    window.onload = () => renderPrefs();
}

main();
