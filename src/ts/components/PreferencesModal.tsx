import log from 'loglevel'; // eslint-disable-line no-unused-vars
import * as React from 'react';
import * as styles from './cssStyles';
import * as Constants from './constants';
import * as Modal from './Modal';
import { themes } from './themeContext';
import { css } from 'emotion';
import { Preferences } from '../preferences';
import { useState } from 'react';

const themeSelectStyle = css({
    width: 80,
    marginLeft: 5
});

const selectLabelStyle = css({
    marginLeft: 8
});

interface PreferencesModalProps {
    initialPrefs: Preferences;
    onClose: () => void;
    onSubmit: (newPrefs: Preferences) => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
    initialPrefs,
    onClose,
    onSubmit
}) => {
    const [prefs, setPrefs] = useState(initialPrefs);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            onClose();
        } else if (e.keyCode === Constants.KEY_ENTER) {
            handleSubmit(e);
        }
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onSubmit(prefs);
    };

    const handlePopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set(
            'popoutOnStart',
            !oldPrefs.popoutOnStart
        );
        setPrefs(nextPrefs);
    };

    const handleTabDedupeChange = () => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('dedupeTabs', !oldPrefs.dedupeTabs);
        setPrefs(nextPrefs);
    };

    const handleRevertOnOpenChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('revertOnOpen', !oldPrefs.revertOnOpen);
        setPrefs(nextPrefs);
    };

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('theme', e.target.value);
        log.debug('handleThemeChange: nextPrefs:', nextPrefs.toJS());
        setPrefs(nextPrefs);
    };

    const popStart = prefs.popoutOnStart;
    const dedupeTabs = prefs.dedupeTabs;
    const revertOnOpen = prefs.revertOnOpen;

    const currentTheme = prefs.theme;
    const themeNames = Object.keys(themes);
    const themeOpts = themeNames.map(nm => (
        <option key={nm} value={nm}>
            {nm}
        </option>
    ));
    const themeSelect = (
        <select
            className={themeSelectStyle}
            name="theme"
            value={currentTheme}
            onChange={e => handleThemeChange(e)}
        >
            {themeOpts}
        </select>
    );
    return (
        <Modal.Dialog title="Tabli Preferences" onClose={onClose}>
            <Modal.Body>
                <div className="modal-body-container">
                    <form
                        className="dialog-form preferences-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={popStart}
                                    onChange={e => handlePopStartChange(e)}
                                />
                                Show Tabli popout window at startup
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={dedupeTabs}
                                    onChange={e => handleTabDedupeChange()}
                                />
                                Automatically close duplicate tabs
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={revertOnOpen}
                                    onChange={e => handleRevertOnOpenChange(e)}
                                />
                                Only re-open saved tabs when re-opening saved
                                windows
                            </label>
                        </div>
                        <div>
                            <label className={selectLabelStyle}>
                                Theme
                                {themeSelect}
                            </label>
                        </div>
                    </form>
                    <hr />
                    <div className={styles.dialogButtonRow}>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm tabli-dialog-button"
                            onClick={e => handleSubmit(e)}
                            tabIndex={0}
                            onKeyDown={handleKeyDown}
                        >
                            OK
                        </button>
                        <button
                            type="button"
                            className="btn btn-default btn-light btn-sm tabli-dialog-button"
                            onClick={e => onClose()}
                            tabIndex={0}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal.Dialog>
    );
};

export default PreferencesModal;
