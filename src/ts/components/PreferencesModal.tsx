import { log } from '../globals';
import * as React from 'react';
import * as styles from './cssStyles';
import * as Constants from './constants';
import * as Modal from './Modal';
import { themes } from './themeContext';
import { css, cx } from '@emotion/css';
import { Preferences } from '../preferences';
import { useState } from 'react';
import { layouts } from './LayoutContext';
import {
    fontScaleFactorToSize,
    fontSizeToScaleFactor,
    fontSizeVals,
} from '../renderUtils';

const SELECT_WIDTH = 120;

const themeSelectStyle = css({
    width: SELECT_WIDTH,
    marginLeft: 5,
});

const fontSizeSelectStyle = css({
    width: SELECT_WIDTH,
    marginLeft: 5,
});

const selectLabelStyle = css({
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 4,
});

const checkLabelStyle = css({
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
});

const prefsCheckbox = css({
    marginLeft: 8,
    marginRight: 4,
    marginTop: 'auto',
    marginBottom: 'auto',
});

const prefsLabeledCheckbox = css({
    display: 'flex',
    alignContent: 'flex-start',
});

interface PreferencesModalProps {
    initialPrefs: Preferences;
    onClose: () => void;
    onApply: (newPrefs: Preferences) => void;
    onSubmit: (newPrefs: Preferences) => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
    initialPrefs,
    onClose,
    onApply,
    onSubmit,
}) => {
    log.debug('PreferencesModal: initialPrefs: ', initialPrefs);
    const [prefs, setPrefs] = useState(initialPrefs);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            onClose();
        } else if (e.keyCode === Constants.KEY_ENTER) {
            handleSubmit(e);
        }
    };

    const handleCancel = (e: React.SyntheticEvent) => {
        e.preventDefault();
        // put back initial prefs:
        onApply(initialPrefs);
    };

    const handleApply = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onApply(prefs);
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onSubmit(prefs);
    };

    const updatePrefs = (updates: Partial<Preferences>) => {
        setPrefs(Preferences.update(prefs, updates));
    };

    const handlePopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updatePrefs({ popoutOnStart: !prefs.popoutOnStart });
    };

    const handleTabDedupeChange = () => {
        updatePrefs({ dedupeTabs: !prefs.dedupeTabs });
    };

    const handleRevertOnOpenChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        updatePrefs({ revertOnOpen: !prefs.revertOnOpen });
    };

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updatePrefs({ theme: e.target.value });
    };

    const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updatePrefs({ layout: e.target.value });
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextScaleFactor = fontSizeToScaleFactor(
            Number.parseInt(e.target.value),
        );
        updatePrefs({ fontScaleFactor: nextScaleFactor });
    };

    const themeNames = Object.keys(themes);
    const themeOpts = themeNames.map((nm) => (
        <option key={nm} value={nm}>
            {nm}
        </option>
    ));
    const themeSelect = (
        <select
            className={themeSelectStyle}
            name="theme"
            value={prefs.theme}
            onChange={handleThemeChange}
        >
            {themeOpts}
        </select>
    );

    const layoutNames = Object.keys(layouts);
    const layoutOpts = layoutNames.map((nm) => (
        <option key={nm} value={nm}>
            {nm}
        </option>
    ));
    const layoutSelect = (
        <select
            className={themeSelectStyle}
            name="layout"
            value={prefs.layout}
            onChange={handleLayoutChange}
        >
            {layoutOpts}
        </select>
    );

    const currentFontSize = fontScaleFactorToSize(prefs.fontScaleFactor);
    const fontSizeOpts = fontSizeVals.map((sz) => (
        <option key={sz.toString()} value={sz}>
            {sz.toString()}
        </option>
    ));
    const fontSizeSelect = (
        <select
            className={fontSizeSelectStyle}
            name="fontSize"
            value={currentFontSize}
            onChange={handleFontSizeChange}
        >
            {fontSizeOpts}
        </select>
    );

    const rightCol = styles.prefsGridRightCol;

    return (
        <Modal.Dialog
            className={styles.prefsDialog}
            title="Tabli Preferences"
            onClose={onClose}
        >
            <Modal.Body>
                <div className={styles.modalBodyContainer}>
                    <form className={styles.prefsForm} onSubmit={handleSubmit}>
                        <div className={styles.prefsGridContainer}>
                            <div
                                className={cx(
                                    'checkbox',
                                    rightCol,
                                    prefsLabeledCheckbox,
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className={prefsCheckbox}
                                    checked={prefs.popoutOnStart}
                                    onChange={handlePopStartChange}
                                />
                                <label className={checkLabelStyle}>
                                    Show Tabli popout window at startup
                                </label>
                            </div>
                            <div
                                className={cx(
                                    'checkbox',
                                    rightCol,
                                    prefsLabeledCheckbox,
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className={prefsCheckbox}
                                    checked={prefs.dedupeTabs}
                                    onChange={handleTabDedupeChange}
                                />
                                <label className={checkLabelStyle}>
                                    Automatically close duplicate tabs
                                </label>
                            </div>
                            <div
                                className={cx(
                                    'checkbox',
                                    rightCol,
                                    prefsLabeledCheckbox,
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className={prefsCheckbox}
                                    checked={prefs.revertOnOpen}
                                    onChange={handleRevertOnOpenChange}
                                />
                                <label className={checkLabelStyle}>
                                    Only re-open saved tabs when re-opening
                                    saved windows
                                </label>
                            </div>
                            <div />
                            <div />
                            <div className={styles.prefsGridLabel}>
                                <label className={selectLabelStyle}>
                                    Theme
                                </label>
                            </div>
                            {themeSelect}
                            <div className={styles.prefsGridLabel}>
                                <label className={selectLabelStyle}>
                                    Layout
                                </label>
                            </div>
                            {layoutSelect}
                            <div className={styles.prefsGridLabel}>
                                <label className={selectLabelStyle}>
                                    Font Size
                                </label>
                            </div>
                            {fontSizeSelect}
                        </div>
                    </form>
                    <hr />
                    <div className={styles.dialogButtonRow}>
                        <button
                            type="button"
                            className="btn btn-default btn-light tabli-dialog-button"
                            onClick={(e) => {
                                handleCancel(e);
                                onClose();
                            }}
                            tabIndex={0}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="btn btn-info tabli-dialog-button"
                            onClick={handleApply}
                            tabIndex={0}
                            onKeyDown={handleKeyDown}
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-default tabli-dialog-button"
                            onClick={handleSubmit}
                            tabIndex={0}
                            onKeyDown={handleKeyDown}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal.Dialog>
    );
};

export default PreferencesModal;
